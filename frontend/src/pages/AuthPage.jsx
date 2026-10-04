import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import { AxisLogo } from '../components/AxisLogo';

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const addToast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Flux de connexion classique
        const { error } = await signIn(email, password);
        if (error) throw error;
        addToast('Connexion réussie !', 'success');
        navigate('/dashboard');
      } else {
        // Flux d'inscription unifié avec auto-login automatique
        const res = await signUp(email, password, username, pseudo);
        if (res.error) throw res.error;

        if (res.autoLoggedIn) {
          addToast('Inscription réussie ! Bienvenue sur Axis AI.', 'success');
          navigate('/dashboard');
        } else {
          // Si le projet Supabase impose une confirmation par email
          addToast('Compte créé avec succès ! Un lien de confirmation a été envoyé par email si requis.', 'info');
          setIsLogin(true);
        }
      }
    } catch (err) {
      addToast(err.message || 'Une erreur est survenue lors de l’authentification', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (err) {
      addToast(err.message || 'Erreur lors de la redirection Google OAuth', 'error');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} className="ax-hex-bg">
      <div className="card ax-fade-in" style={{ width: '100%', maxWidth: 420, padding: 32 }}>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            color: 'var(--axis-muted)',
            fontSize: 13,
            textDecoration: 'none',
            marginBottom: 16,
            transition: 'color 0.15s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--axis-accent)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--axis-muted)'}
        >
          <ArrowLeft size={16} />
          Retour à l'accueil
        </Link>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <AxisLogo size={48} className="ax-pulse-glow" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Axis AI Gateway</h1>
          <p style={{ color: 'var(--axis-textMuted)', fontSize: 13, marginTop: 4 }}>
            {isLogin ? 'Connectez-vous pour gérer vos clés et abonnements' : 'Créez votre compte et accédez à tous les modèles d’IA'}
          </p>
        </div>

        {/* Toggle Onglets Connexion / Inscription */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, background: 'var(--axis-bg)', padding: 4, borderRadius: 12, border: '1px solid var(--axis-border)' }}>
          <button 
            type="button"
            onClick={() => setIsLogin(true)}
            style={{
              flex: 1, padding: '8px 12px', borderRadius: 8,
              background: isLogin ? 'var(--axis-hover)' : 'transparent',
              color: isLogin ? '#fff' : 'var(--axis-textMuted)',
              fontWeight: isLogin ? 700 : 500, fontSize: 13, transition: 'all 0.15s ease'
            }}
          >
            Se connecter
          </button>
          <button 
            type="button"
            onClick={() => setIsLogin(false)}
            style={{
              flex: 1, padding: '8px 12px', borderRadius: 8,
              background: !isLogin ? 'var(--axis-hover)' : 'transparent',
              color: !isLogin ? '#fff' : 'var(--axis-textMuted)',
              fontWeight: !isLogin ? 700 : 500, fontSize: 13, transition: 'all 0.15s ease'
            }}
          >
            S'inscrire
          </button>
        </div>

        {/* Formulaire Email/Password */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {!isLogin && (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Nom complet</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ex: Jean Dupont"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Pseudo d'affichage</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ex: jeand"
                  value={pseudo}
                  onChange={e => setPseudo(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Adresse email</label>
            <input
              type="email"
              className="input-field"
              placeholder="nom@exemple.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Mot de passe</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 8, width: '100%', padding: '12px' }}>
            {loading ? 'Traitement en cours...' : isLogin ? 'Se connecter' : "Créer mon compte et accéder au Dashboard"}
          </button>
        </form>

        {/* Séparateur */}
        <div style={{ margin: '22px 0', textAlign: 'center', color: 'var(--axis-muted)', position: 'relative' }}>
          <hr style={{ borderColor: 'var(--axis-border)', position: 'absolute', width: '100%', top: '50%', zIndex: 0 }} />
          <span style={{ background: 'var(--axis-sidebar)', padding: '0 12px', position: 'relative', zIndex: 1, fontSize: 12 }}>
            ou continuer avec
          </span>
        </div>

        {/* Bouton Google OAuth */}
        <button
          type="button"
          onClick={handleGoogle}
          className="btn-ghost"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '11px', fontSize: 14 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google
        </button>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--axis-muted)', marginTop: 20 }}>
          En continuant, vous acceptez les conditions d'utilisation d'Axis AI.
        </p>
      </div>
    </div>
  );
};
