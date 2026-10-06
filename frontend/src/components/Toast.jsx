import { createContext, useContext, useState, useCallback } from 'react';
import { X } from 'lucide-react';

const ToastContext = createContext(null);

// Traduit les erreurs Supabase/PostgreSQL techniques en messages lisibles
function humanizeError(raw) {
  if (!raw) return 'Une erreur est survenue.';
  const msg = typeof raw === 'string' ? raw : (raw.message || String(raw));
  if (msg.includes('infinite recursion') || msg.includes('recursion detected'))
    return 'Erreur de configuration Supabase (politique RLS récursive). Exécutez le script supabase_hotfix.sql pour débloquer cette action.';
  if (msg.includes('JWT') || msg.includes('not authenticated'))
    return 'Session expirée. Veuillez vous reconnecter.';
  if (msg.includes('violates row-level security') || msg.includes('new row violates'))
    return 'Accès refusé par les règles de sécurité. Vérifiez votre session.';
  if (msg.includes('duplicate key') || msg.includes('already exists'))
    return 'Cette entrée existe déjà.';
  if (msg.includes('network') || msg.includes('Failed to fetch'))
    return 'Erreur réseau. Vérifiez votre connexion internet.';
  return msg;
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    const displayMsg = type === 'error' ? humanizeError(message) : (message || 'Info');
    setToasts(prev => [...prev, { id, message: displayMsg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, type === 'error' ? 8000 : 5000);
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 400 }}>
        {toasts.map(t => (
          <div key={t.id} className="ax-fade-in" style={{
            background: 'var(--axis-sidebar)',
            borderLeft: `4px solid ${t.type === 'error' ? 'var(--axis-danger)' : t.type === 'success' ? 'var(--axis-accent)' : 'var(--axis-purple)'}`,
            padding: '12px 16px',
            borderRadius: 8,
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            color: 'var(--axis-text)',
            fontSize: 13,
            lineHeight: 1.5
          }}>
            <span style={{ flex: 1 }}>{t.message}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              style={{ color: 'var(--axis-muted)', flexShrink: 0, marginTop: 1 }}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};
