import { AlertTriangle } from 'lucide-react';

/**
 * Modal de confirmation réutilisable — remplace window.confirm()
 * pour une UX cohérente avec le thème Axis (clair/sombre).
 */
export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  isDanger = false,
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(10, 10, 12, 0.55)', backdropFilter: 'blur(6px)',
      padding: 16,
    }}>
      <div className="ax-fade-in" style={{
        background: 'var(--axis-sidebar)',
        border: '1px solid var(--axis-border)',
        borderRadius: 18,
        width: '100%', maxWidth: 420,
        padding: '22px 24px',
        boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          {isDanger && (
            <div style={{ marginBottom: 12 }}>
              <AlertTriangle size={36} color="var(--axis-danger)" style={{ margin: '0 auto' }} />
            </div>
          )}
          <h2 style={{
            fontSize: 18, fontWeight: 600,
            color: isDanger ? 'var(--axis-danger)' : 'var(--axis-text)',
          }}>
            {title}
          </h2>
          {message && (
            <p style={{ color: 'var(--axis-textMuted)', fontSize: 13, marginTop: 8, lineHeight: 1.5 }}>
              {message}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={onClose} className="btn-ghost" style={{ flex: 1 }}>
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => { onConfirm(); onClose(); }}
            className={isDanger ? 'btn-danger' : 'btn-primary'}
            style={{ flex: 1 }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};