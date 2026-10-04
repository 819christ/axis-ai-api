import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, isDanger }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'
    }}>
      <div className="ax-fade-in" style={{
        background: 'var(--axis-bg)',
        border: `1px solid ${isDanger ? 'var(--axis-danger)' : 'var(--axis-border)'}`,
        borderRadius: 24,
        width: '100%', maxWidth: 500,
        padding: 24,
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: isDanger ? 'var(--axis-danger)' : 'var(--axis-text)' }}>{title}</h2>
          {onClose && (
            <button onClick={onClose} style={{ color: 'var(--axis-muted)' }}>
              <X size={24} />
            </button>
          )}
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};
