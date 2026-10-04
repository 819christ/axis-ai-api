import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './pages/Dashboard';
import { ApiKeysPage } from './pages/ApiKeysPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { ModeratorPage } from './pages/ModeratorPage';
import { AdminPage } from './pages/AdminPage';

// Route protégée pour les utilisateurs authentifiés
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--axis-bg)', color: 'var(--axis-textMuted)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="ax-spin" style={{ width: 36, height: 36, border: '3px solid var(--axis-border)', borderTopColor: 'var(--axis-accent)', borderRadius: '50%', margin: '0 auto 16px' }} />
          <span>Chargement de votre session...</span>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--axis-bg)' }}>
      <Sidebar />
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 28px' }}>
        {children}
      </div>
    </div>
  );
};

// Route publique qui redirige vers /dashboard si déjà connecté
const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

export const App = () => {
  // Support rétro-compatible pour d'anciens liens hash (ex: /#/dashboard -> /dashboard)
  useEffect(() => {
    if (window.location.hash.startsWith('#/')) {
      const cleanPath = window.location.hash.replace('#', '');
      window.history.replaceState(null, '', cleanPath);
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<PublicOnlyRoute><AuthPage /></PublicOnlyRoute>} />
        
        {/* Routes du Dashboard */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard/keys" element={<ProtectedRoute><ApiKeysPage /></ProtectedRoute>} />
        <Route path="/dashboard/subscriptions" element={<ProtectedRoute><SubscriptionsPage /></ProtectedRoute>} />
        <Route path="/dashboard/history"       element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
        <Route path="/dashboard/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/dashboard/moderator" element={<ProtectedRoute><ModeratorPage /></ProtectedRoute>} />
        <Route path="/dashboard/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        
        {/* Redirection par défaut */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
