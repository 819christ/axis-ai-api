import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate('/dashboard');
      } else {
        const { error } = await signUp(email, password, username, pseudo);
        if (error) throw error;
        addToast('Inscription réussie ! Veuillez vous connecter.', 'success');
        setIsLogin(true);
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="card ax-fade-in" style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <AxisLogo width={48} height={48} style={{ margin: '0 auto 16px' }} />
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Bienvenue sur Axis AI</h1>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: 'var(--axis-bg)', padding: 4, borderRadius: 12 }}>
          <button 
            onClick={() => setIsLogin(true)}
            style={{ flex: 1, padding: '8px', borderRadius: 8, background: isLogin ? 'var(--axis-hover)' : 'transparent', color: isLogin ? '#fff' : 'var(--axis-textMuted)', fontWeight: 500 }}
          >Connexion</button>
          <button 
            onClick={() => setIsLogin(false)}
            style={{ flex: 1, padding: '8px', borderRadius: 8, background: !isLogin ? 'var(--axis-hover)' : 'transparent', color: !isLogin ? '#fff' : 'var(--axis-textMuted)', fontWeight: 500 }}
          >Inscription</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!isLogin && (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14 }}>Nom complet</label>
                <input type="text" className="input-field" value={username} onChange={e => setUsername(e.target.value)} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14 }}>Pseudo</label>
                <input type="text" className="input-field" value={pseudo} onChange={e => setPseudo(e.target.value)} required />
              </div>
            </>
          )}
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14 }}>Email</label>
            <input type="email" className="input-field" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14 }}>Mot de passe</label>
            <input type="password" className="input-field" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? 'Chargement...' : isLogin ? 'Se connecter' : "S'inscrire"}
          </button>
        </form>

        <div style={{ margin: '24px 0', textAlign: 'center', color: 'var(--axis-textMuted)', position: 'relative' }}>
          <hr style={{ borderColor: 'var(--axis-border)', position: 'absolute', width: '100%', top: '50%', zIndex: 0 }} />
          <span style={{ background: 'var(--axis-sidebar)', padding: '0 12px', position: 'relative', zIndex: 1, fontSize: 14 }}>Ou continuer avec</span>
        </div>

        <button onClick={handleGoogle} className="btn-ghost" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
          Google
        </button>
      </div>
    </div>
  );
};
