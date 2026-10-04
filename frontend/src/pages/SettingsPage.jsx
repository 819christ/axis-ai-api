import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabase';
import { useToast } from '../components/Toast';

export const SettingsPage = () => {
  const { profile } = useAuth();
  const [username, setUsername] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [theme, setTheme] = useState(localStorage.getItem('axis_theme') || 'dark');
  const addToast = useToast();

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setPseudo(profile.pseudo || '');
    }
  }, [profile]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('profiles').update({ username, pseudo }).eq('id', profile.id);
    if (error) addToast(error.message, 'error');
    else addToast('Profil mis à jour.', 'success');
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('axis_theme', newTheme);
    if (newTheme === 'light') document.documentElement.setAttribute('data-axis-theme', 'light');
    else document.documentElement.removeAttribute('data-axis-theme');
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Paramètres</h1>

      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Profil</h2>
        <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14 }}>Email (lecture seule)</label>
            <input type="text" className="input-field" value={profile?.email || ''} disabled style={{ opacity: 0.7 }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14 }}>Nom complet</label>
            <input type="text" className="input-field" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14 }}>Pseudo</label>
            <input type="text" className="input-field" value={pseudo} onChange={e => setPseudo(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}>Sauvegarder</button>
        </form>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Apparence</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Thème actuel : {theme === 'dark' ? 'Sombre' : 'Clair'}</span>
          <button onClick={toggleTheme} className="btn-ghost">Basculer le thème</button>
        </div>
      </div>
    </div>
  );
};
