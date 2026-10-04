import { useState } from 'react';
import { useApiKeys } from '../hooks/useApiKeys';
import { useSubscription } from '../hooks/useSubscription';
import { useToast } from '../components/Toast';
import { Modal } from '../components/Modal';
import { Copy, Plus, RefreshCw, Trash2, Power } from 'lucide-react';

export const ApiKeysPage = () => {
  const { subscription } = useSubscription();
  const { keys, loading, createKey, toggleKey, deleteKey, refreshKey } = useApiKeys(subscription?.id);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState('');
  const addToast = useToast();

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!subscription) {
      addToast("Aucun abonnement actif.", "error");
      return;
    }
    const { data, error } = await createKey(newKeyName);
    if (error) {
      addToast(error.message, "error");
    } else {
      setCreatedKey(data);
      setIsCreateOpen(false);
      setNewKeyName('');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    addToast("Copié dans le presse-papiers !", "success");
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Clés d'accès API</h1>
        <button onClick={() => setIsCreateOpen(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={18} /> Créer une clé
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'var(--axis-bg)' }}>
            <tr>
              <th style={{ padding: '16px 20px', borderBottom: '1px solid var(--axis-border)', fontWeight: 500, color: 'var(--axis-textMuted)' }}>Nom</th>
              <th style={{ padding: '16px 20px', borderBottom: '1px solid var(--axis-border)', fontWeight: 500, color: 'var(--axis-textMuted)' }}>Préfixe</th>
              <th style={{ padding: '16px 20px', borderBottom: '1px solid var(--axis-border)', fontWeight: 500, color: 'var(--axis-textMuted)' }}>Statut</th>
              <th style={{ padding: '16px 20px', borderBottom: '1px solid var(--axis-border)', fontWeight: 500, color: 'var(--axis-textMuted)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="4" style={{ padding: 20, textAlign: 'center' }}>Chargement...</td></tr> : 
             keys.length === 0 ? <tr><td colSpan="4" style={{ padding: 20, textAlign: 'center', color: 'var(--axis-textMuted)' }}>Aucune clé trouvée.</td></tr> :
             keys.map(k => (
              <tr key={k.id} style={{ borderBottom: '1px solid var(--axis-border)' }}>
                <td style={{ padding: '16px 20px', fontWeight: 500 }}>{k.name}</td>
                <td style={{ padding: '16px 20px', fontFamily: 'monospace' }}>{k.key_prefix}...</td>
                <td style={{ padding: '16px 20px' }}>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                    background: k.is_enabled ? 'var(--axis-accent-dim)' : 'rgba(248,113,113,0.1)',
                    color: k.is_enabled ? 'var(--axis-accent)' : 'var(--axis-danger)'
                  }}>
                    {k.is_enabled ? 'ACTIF' : 'INACTIF'}
                  </span>
                </td>
                <td style={{ padding: '16px 20px', display: 'flex', gap: 12 }}>
                  <button onClick={() => toggleKey(k.id, !k.is_enabled)} title={k.is_enabled ? "Désactiver" : "Activer"} style={{ color: 'var(--axis-textMuted)' }}>
                    <Power size={18} />
                  </button>
                  <button onClick={async () => {
                    const { data } = await refreshKey(k.id);
                    if (data) setCreatedKey(data);
                  }} title="Régénérer" style={{ color: 'var(--axis-textMuted)' }}>
                    <RefreshCw size={18} />
                  </button>
                  <button onClick={() => { if(window.confirm('Supprimer cette clé ?')) deleteKey(k.id) }} title="Supprimer" style={{ color: 'var(--axis-danger)' }}>
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Créer une nouvelle clé API">
        <form onSubmit={handleCreate}>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 8 }}>Nom de la clé</label>
            <input type="text" className="input-field" value={newKeyName} onChange={e => setNewKeyName(e.target.value)} required placeholder="ex: Projet Web" />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>Générer</button>
        </form>
      </Modal>

      <Modal isOpen={!!createdKey} title="Clé API générée">
        <div style={{ background: 'var(--axis-bg)', border: '1px solid var(--axis-warning)', padding: 16, borderRadius: 12, marginBottom: 24 }}>
          <p style={{ color: 'var(--axis-warning)', fontSize: 14, marginBottom: 12, fontWeight: 600 }}>
            ⚠️ Cette clé ne sera plus jamais affichée. Copiez-la maintenant.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <input type="text" readOnly value={createdKey} className="input-field" style={{ fontFamily: 'monospace', flex: 1 }} />
            <button onClick={() => copyToClipboard(createdKey)} className="btn-ghost" style={{ padding: '8px 12px' }}><Copy size={18} /></button>
          </div>
        </div>
        <button onClick={() => setCreatedKey('')} className="btn-primary" style={{ width: '100%' }}>J'ai copié ma clé</button>
      </Modal>
    </div>
  );
};
