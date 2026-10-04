import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Synchronisation & création sécurisée du profil (Trigger PostgreSQL + Fallback Frontend)
  const ensureProfile = async (authUser) => {
    if (!authUser) {
      setProfile(null);
      setLoading(false);
      return null;
    }

    try {
      // 1. Tenter de récupérer le profil existant
      const { data: existingProfile, error: fetchErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (existingProfile) {
        setProfile(existingProfile);
        return existingProfile;
      }

      // 2. Si le profil n'existe pas encore (ex: premier login Google ou trigger retardé),
      // création automatique avec rôle par défaut 'client'
      const meta = authUser.user_metadata || {};
      const fallbackUsername = meta.username || (authUser.email ? authUser.email.split('@')[0] : `user_${authUser.id.slice(0, 6)}`);
      const fallbackPseudo = meta.pseudo || meta.full_name || meta.name || fallbackUsername;

      const profilePayload = {
        id: authUser.id,
        email: authUser.email || '',
        username: fallbackUsername,
        pseudo: fallbackPseudo,
        role: 'client'
      };

      const { data: insertedProfile, error: insertErr } = await supabase
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' })
        .select()
        .maybeSingle();

      if (!insertErr && insertedProfile) {
        setProfile(insertedProfile);
        return insertedProfile;
      } else {
        // En cas de restriction RLS temporaire, on garde un profil local pour ne pas bloquer l'UI
        setProfile(profilePayload);
        return profilePayload;
      }
    } catch (err) {
      console.error('Erreur lors de la synchronisation du profil:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        ensureProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // 2. Auth state change listener (Google OAuth callback, sign in, sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await ensureProfile(currentUser);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    const res = await supabase.auth.signInWithPassword({ email, password });
    if (!res.error && res.data?.user) {
      setUser(res.data.user);
      await ensureProfile(res.data.user);
    }
    return res;
  };
  
  // Inscription avec auto-connexion immédiate
  const signUp = async (email, password, username, pseudo) => {
    // 1. Création de l'utilisateur avec métadonnées pour le trigger PostgreSQL
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.trim(),
          pseudo: pseudo.trim()
        }
      }
    });

    if (error) return { data, error };

    // 2. Si une session est directement retournée (auto-confirm activé)
    if (data?.session && data?.user) {
      setUser(data.user);
      await ensureProfile(data.user);
      return { data, error: null, autoLoggedIn: true };
    }

    // 3. Si aucune session n'est retournée directement, tentative d'auto-login immédiat
    try {
      const signInRes = await supabase.auth.signInWithPassword({ email, password });
      if (!signInRes.error && signInRes.data?.session) {
        setUser(signInRes.data.user);
        await ensureProfile(signInRes.data.user);
        return { data: signInRes.data, error: null, autoLoggedIn: true };
      }
    } catch {
      // Ignorer si la confirmation par email est strictement obligatoire sur le projet Supabase
    }

    return { data, error: null, autoLoggedIn: false };
  };

  // Google OAuth avec URL de redirection dynamique (Localhost ou Cloudflare Pages)
  const signInWithGoogle = () => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl
      }
    });
  };

  const signOut = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
