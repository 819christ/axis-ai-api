import { X } from 'lucide-react';

// Pop-up sobre et neutre : fond sombre discret, bordures grises, aucune couleur fluo.
// Seules les notifications (voir Toast.jsx) conservent des couleurs vives.
export const Modal = ({ isOpen, onClose, title, children, isDanger }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(10, 10, 12, 0.55)', backdropFilter: 'blur(6px)',
      padding: 16,
    }}>
      <div className="ax-fade-in" style={{
        background: 'var(--axis-sidebar)',
        border: '1px solid var(--axis-border)',
        borderRadius: 18,
        width: '100%', maxWidth: 500,
        padding: '22px 24px',
        boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{
            fontSize: 18, fontWeight: 600,
            color: isDanger ? 'var(--axis-danger)' : 'var(--axis-text)',
            opacity: isDanger ? 0.85 : 1,
          }}>
            {title}
          </h2>
          {onClose && (
            <button onClick={onClose} style={{ color: 'var(--axis-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <X size={22} />
            </button>
          )}
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};
