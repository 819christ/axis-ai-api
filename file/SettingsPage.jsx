import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabase';
import { useToast } from '../components/Toast';
import { AvatarPicker } from '../components/AvatarPicker';
import { AlertTriangle, Save, User, Moon, Sun, Shield, LogOut, Palette } from 'lucide-react';

const IconBox = ({ bg, children }) => (
  <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</div>
);

export const SettingsPage = () => {
  const { profile, signOut, refreshProfile } = useAuth();
  const [username, setUsername] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [theme, setTheme] = useState(localStorage.getItem('axis_theme') || 'dark');
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [rlsError, setRlsError] = useState(false);
  const addToast = useToast();

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setPseudo(profile.pseudo || '');
    }
  }, [profile]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setRlsError(false);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: username.trim(), pseudo: pseudo.trim() })
        .eq('id', profile.id);

      if (error) {
        if (error.message?.includes('recursion') || error.message?.includes('infinite')) setRlsError(true);
        addToast(error.message, 'error');
      } else {
        addToast('Profil mis à jour avec succès.', 'success');
        refreshProfile?.();
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAvatar = async ({ icon, hue, tone }) => {
    setIsSavingAvatar(true);
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_icon: icon, avatar_hue: hue, avatar_tone: tone })
      .eq('id', profile.id);
    setIsSavingAvatar(false);
    if (error) {
      addToast(error.message, 'error');
    } else {
      addToast('Avatar mis à jour.', 'success');
      refreshProfile?.();
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('axis_theme', newTheme);
    if (newTheme === 'light') document.documentElement.setAttribute('data-axis-theme', 'light');
    else document.documentElement.removeAttribute('data-axis-theme');
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', paddingBottom: 60 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Paramètres</h1>
        <p style={{ color: 'var(--axis-textMuted)', fontSize: 13, marginTop: 4 }}>
          Gérez votre profil, l'apparence et la sécurité de votre compte.
        </p>
      </div>

      {rlsError && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 18px', borderRadius: 12, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.35)', marginBottom: 24 }}>
          <AlertTriangle size={20} color="var(--axis-danger)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>
            <b style={{ color: 'var(--axis-danger)' }}>Erreur de configuration Supabase</b><br />
            Une politique RLS récursive bloque la mise à jour. Exécutez <code>supabase_production_schema.sql</code> dans le SQL Editor puis rafraîchissez cette page.
          </div>
        </div>
      )}

      {/* Avatar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <IconBox bg="rgba(56,189,248,0.1)"><Palette size={18} color="#38bdf8" /></IconBox>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Avatar</h2>
            <p style={{ fontSize: 12, color: 'var(--axis-muted)', marginTop: 2 }}>20 icônes, des milliers de couleurs : composez le vôtre.</p>
          </div>
        </div>
        {profile && <AvatarPicker key={profile.id} profile={profile} onSave={handleSaveAvatar} saving={isSavingAvatar} />}
      </div>

      {/* Profil */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <IconBox bg="var(--axis-accent-dim)"><User size={18} color="var(--axis-accent)" /></IconBox>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Informations du profil</h2>
            <p style={{ fontSize: 12, color: 'var(--axis-muted)', marginTop: 2 }}>Nom d'affichage et pseudo publics.</p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Email (lecture seule)</label>
            <input type="text" className="input-field" value={profile?.email || ''} disabled style={{ opacity: 0.6 }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Nom complet</label>
            <input type="text" className="input-field" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Votre nom complet" required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Pseudo</label>
            <input type="text" className="input-field" value={pseudo} onChange={(e) => setPseudo(e.target.value)} placeholder="Votre pseudo" required />
          </div>
          <button type="submit" className="btn-primary" disabled={isSaving} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Save size={15} /> {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </form>
      </div>

      {/* Apparence */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <IconBox bg="rgba(192,132,252,0.1)">
            {theme === 'dark' ? <Moon size={18} color="var(--axis-purple)" /> : <Sun size={18} color="var(--axis-warning)" />}
          </IconBox>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Apparence</h2>
            <p style={{ fontSize: 12, color: 'var(--axis-muted)', marginTop: 2 }}>Basculez entre le thème sombre et clair.</p>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, color: 'var(--axis-textMuted)' }}>
            Thème actuel : <b style={{ color: 'var(--axis-text)' }}>{theme === 'dark' ? 'Sombre' : 'Clair'}</b>
          </span>
          <button onClick={toggleTheme} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />} Basculer
          </button>
        </div>
      </div>

      {/* Sécurité */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <IconBox bg="rgba(251,191,36,0.1)"><Shield size={18} color="var(--axis-warning)" /></IconBox>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Sécurité</h2>
            <p style={{ fontSize: 12, color: 'var(--axis-muted)', marginTop: 2 }}>Gérez votre session active.</p>
          </div>
        </div>
        <button onClick={signOut} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--axis-danger)', borderColor: 'rgba(248,113,113,0.3)' }}>
          <LogOut size={15} /> Se déconnecter
        </button>
      </div>
    </div>
  );
};
