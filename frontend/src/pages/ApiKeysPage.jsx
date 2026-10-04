import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApiKeys } from '../hooks/useApiKeys';
import { useSubscription } from '../hooks/useSubscription';
import { useToast } from '../components/Toast';
import { Modal } from '../components/Modal';
import { Copy, Plus, RefreshCw, Trash2, Key, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export const ApiKeysPage = () => {
  const { subscription } = useSubscription();
  const { keys, loading, createKey, toggleKey, deleteKey, refreshKey } = useApiKeys();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKeyData, setCreatedKeyData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const addToast = useToast();

  const hasActiveSub = subscription && subscription.status === 'active' && new Date(subscription.expires_at) > new Date();

  // Création libre de clé API (même sans abonnement actif)
  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Si un abonnement actif existe, on le rattache automatiquement, sinon null
      const subId = hasActiveSub ? subscription.id : null;
      const { data, error } = await createKey(newKeyName.trim() || 'Default API Key', subId);

      if (error) {
        addToast(error.message || 'Erreur lors de la génération', 'error');
      } else if (data?.success) {
        setCreatedKeyData(data);
        setIsCreateOpen(false);
        setNewKeyName('');
        addToast('Clé API générée avec succès !', 'success');
      } else {
        addToast(data?.error_message || 'Échec de génération', 'error');
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gestion du Toggle Switch avec redirection vers les abonnements si inactif
  const handleToggle = async (keyItem, targetState) => {
    const isKeyLinkedToActiveSub = Boolean(
      keyItem.subscriptions?.status === 'active' && 
      new Date(keyItem.subscriptions.expires_at) > new Date()
    );

    const res = await toggleKey(keyItem.id, targetState, isKeyLinkedToActiveSub);

    if (res?.error) {
      if (res.error.needSubscription) {
        addToast("Un abonnement actif est requis pour activer cette clé. Redirection vers les 7 paliers...", "warning");
        setTimeout(() => {
          navigate('/dashboard/subscriptions');
        }, 1200);
      } else {
        addToast(res.error.message, "error");
      }
    } else {
      addToast(targetState ? "Clé API activée." : "Clé API désactivée.", "success");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    addToast("Copié dans le presse-papiers !", "success");
  };

  return (
    <div style={{ maxWidth: 1050, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Gestionnaire de Clés d'Accès API</h1>
          <p style={{ color: 'var(--axis-textMuted)', fontSize: 13, marginTop: 2 }}>
            Créez librement vos clés pour vos IDE (Cursor, Claude Code, Continue) ou applications.
          </p>
        </div>

        {/* Bouton de création libre */}
        <button
          onClick={() => setIsCreateOpen(true)}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontSize: 13 }}
        >
          <Plus size={16} /> Créer une nouvelle clé
        </button>
      </div>

      {/* Info Banner si aucun abonnement actif */}
      {!hasActiveSub && (
        <div style={{
          padding: '14px 18px', borderRadius: 12, marginBottom: 24,
          background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertCircle color="var(--axis-warning)" size={20} />
            <span style={{ fontSize: 13, color: 'var(--axis-text)' }}>
              <b>Note :</b> Vous pouvez créer des clés dès maintenant. Pour les activer et interroger les modèles, souscrivez à l'un des 7 paliers.
            </span>
          </div>
          <Link to="/dashboard/subscriptions" className="btn-ghost" style={{ fontSize: 12, padding: '6px 14px' }}>
            Voir les 7 Paliers (dès 1 500 XOF) <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {/* Keys Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="ax-table">
            <thead>
              <tr>
                <th>Nom de la clé</th>
                <th>Préfixe</th>
                <th>Pack Associé</th>
                <th>Activation</th>
                <th>Dernière utilisation</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ padding: 32, textAlign: 'center', color: 'var(--axis-muted)' }}>Chargement de vos clés...</td></tr>
              ) : keys.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: 36, textAlign: 'center' }}>
                    <Key size={32} color="var(--axis-muted)" style={{ margin: '0 auto 12px' }} />
                    <p style={{ color: 'var(--axis-textMuted)', fontSize: 14, marginBottom: 16 }}>Aucune clé API créée pour le moment.</p>
                    <button onClick={() => setIsCreateOpen(true)} className="btn-primary" style={{ fontSize: 13 }}>
                      Créer ma première clé API
                    </button>
                  </td>
                </tr>
              ) : (
                keys.map(k => {
                  const hasSub = Boolean(k.subscriptions && k.subscriptions.status === 'active');

                  return (
                    <tr key={k.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{k.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--axis-muted)' }}>Créée le {new Date(k.created_at).toLocaleDateString()}</div>
                      </td>

                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        <span style={{ background: 'var(--axis-bg)', padding: '3px 8px', borderRadius: 6, border: '1px solid var(--axis-border)' }}>
                          {k.key_prefix}
                        </span>
                      </td>

                      <td>
                        {hasSub ? (
                          <span className="badge badge-green">
                            Palier {k.subscriptions.tier_number} (${Number(k.subscriptions.balance_usd).toFixed(2)})
                          </span>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="badge badge-yellow">Requis</span>
                            <Link to="/dashboard/subscriptions" style={{ fontSize: 11, color: 'var(--axis-accent)', textDecoration: 'underline' }}>
                              Lier un pack
                            </Link>
                          </div>
                        )}
                      </td>

                      {/* Toggle Switch */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <label className="toggle" title={k.is_enabled ? "Désactiver la clé" : "Activer la clé"}>
                            <input
                              type="checkbox"
                              checked={Boolean(k.is_enabled)}
                              onChange={e => handleToggle(k, e.target.checked)}
                            />
                            <span className="toggle-track" />
                            <span className="toggle-thumb" />
                          </label>
                          <span style={{ fontSize: 11, fontWeight: 700, color: k.is_enabled ? 'var(--axis-accent)' : 'var(--axis-muted)' }}>
                            {k.is_enabled ? 'ACTIF' : 'INACTIF'}
                          </span>
                        </div>
                      </td>

                      <td style={{ fontSize: 12, color: 'var(--axis-muted)' }}>
                        {k.last_used_at ? new Date(k.last_used_at).toLocaleString() : 'Jamais'}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            onClick={() => copyToClipboard(k.key_prefix)}
                            className="btn-icon"
                            title="Copier le préfixe"
                          >
                            <Copy size={15} />
                          </button>
                          <button
                            onClick={async () => {
                              const res = await refreshKey(k.id);
                              if (res.data?.success) {
                                setCreatedKeyData(res.data);
                                addToast("Clé renouvelée avec succès !", "success");
                              }
                            }}
                            className="btn-icon"
                            title="Régénérer cette clé"
                          >
                            <RefreshCw size={15} />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement la clé "${k.name}" ?`)) {
                                deleteKey(k.id);
                              }
                            }}
                            className="btn-icon danger"
                            title="Supprimer la clé"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Création de Clé API */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Créer une nouvelle clé d'accès API">
        <form onSubmit={handleCreate}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>Nom de la clé</label>
            <input
              type="text"
              className="input-field"
              value={newKeyName}
              onChange={e => setNewKeyName(e.target.value)}
              required
              placeholder="Ex: Mon Projet Cursor / VS Code / Script Python"
            />
          </div>

          <div style={{ padding: 14, borderRadius: 10, background: 'var(--axis-bg)', border: '1px solid var(--axis-border)', marginBottom: 22, fontSize: 12.5, lineHeight: 1.5 }}>
            {hasActiveSub ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--axis-accent)' }}>
                <CheckCircle2 size={16} />
                <span>Cette clé sera automatiquement liée à votre abonnement actif (Palier {subscription.tier_number}).</span>
              </div>
            ) : (
              <div style={{ color: 'var(--axis-textMuted)' }}>
                ℹ️ <b>Création libre :</b> Votre clé sera créée immédiatement. Pour l'activer, vous pourrez souscrire à tout moment à l'un des 7 forfaits en Francs CFA.
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={() => setIsCreateOpen(false)} className="btn-ghost" style={{ flex: 1 }}>
              Annuler
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ flex: 2 }}>
              {isSubmitting ? 'Génération...' : 'Générer ma clé API'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Pop-up Unique Affichage Clé en Clair */}
      <Modal isOpen={!!createdKeyData} title="🎉 Clé API Générée avec Succès">
        {createdKeyData && (
          <div>
            <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid var(--axis-warning)', padding: 16, borderRadius: 12, marginBottom: 20 }}>
              <p style={{ color: 'var(--axis-warning)', fontSize: 13, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={16} /> Avertissement de sécurité
              </p>
              <p style={{ color: 'var(--axis-textMuted)', fontSize: 12, margin: 0 }}>
                Cette clé secrète ne sera <b>plus jamais affichée en clair</b>. En cas de perte, vous devrez la régénérer. Copiez-la et enregistrez-la dans un endroit sûr dès maintenant.
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>Votre clé secrète (Bearer Token) :</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  readOnly
                  value={createdKeyData.api_key}
                  className="input-field"
                  style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--axis-accent)', background: 'var(--axis-bg)' }}
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(createdKeyData.api_key)}
                  className="btn-primary"
                  style={{ padding: '8px 14px' }}
                  title="Copier"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>

            <div style={{ fontSize: 12, color: 'var(--axis-textMuted)', marginBottom: 24 }}>
              Statut initial : <b>{createdKeyData.is_enabled ? 'Activée immédiatement' : 'En attente d’activation (abonnement requis)'}</b>
            </div>

            <button
              type="button"
              onClick={() => setCreatedKeyData(null)}
              className="btn-primary"
              style={{ width: '100%', padding: '12px' }}
            >
              J'ai copié ma clé en lieu sûr
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};
