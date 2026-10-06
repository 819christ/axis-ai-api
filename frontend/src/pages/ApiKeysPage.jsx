import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useApiKeys } from '../hooks/useApiKeys';
import { useSubscription } from '../hooks/useSubscription';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import { Modal } from '../components/Modal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import {
  Copy, Plus, RefreshCw, Trash2, Key, AlertCircle,
  CheckCircle2, ArrowRight, Shield, Layers, Zap, ChevronRight, Hourglass
} from 'lucide-react';

// Paliers XOF pour l'affichage du badge
const TIERS_XOF = { 1: '1 500', 2: '3 000', 3: '6 000', 4: '12 000', 5: '18 000', 6: '24 000', 7: '30 000' };
const TIERS_NAMES = { 1: 'Starter', 2: 'Basic', 3: 'Standard', 4: 'Pro', 5: 'Expert', 6: 'Master', 7: 'Enterprise' };

export const ApiKeysPage = () => {
  const { profile } = useAuth();
  const { subscription } = useSubscription();
  const { keys, loading, createKey, toggleKey, deleteKey, refreshKey } = useApiKeys();

  // État création
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // État clé créée (affichage unique)
  const [createdKeyData, setCreatedKeyData] = useState(null);

  // État souscrire depuis une clé
  const [subscribeFromKey, setSubscribeFromKey] = useState(null); // keyId

  // État confirmation modale (delete / refresh)
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [refreshTarget, setRefreshTarget] = useState(null);
  // État pop-up abonnement en attente de validation
  const [pendingSubKey, setPendingSubKey] = useState(null);
  // État pop-up blocage régénération
  const [refreshBlocked, setRefreshBlocked] = useState(null);
  // État pop-up blocage suppression
  const [deleteBlocked, setDeleteBlocked] = useState(null);

  const navigate = useNavigate();
  const addToast = useToast();

  // Helpers état clé
  const isSubPending = (k) =>
    Boolean(k.subscriptions && ['pending_validation', 'pending'].includes(k.subscriptions.status));
  const getKeyState = (k) => {
    const s = k.subscriptions;
    if (s && s.status === 'active' && new Date(s.expires_at) > new Date()) return 'live';
    if (isSubPending(k)) return 'pending';
    return 'unlinked';
  };
  const hasLockedSub = (k) =>
    Boolean(k.subscriptions && ['pending_validation', 'pending', 'active'].includes(k.subscriptions.status));
  const requestDelete = (k) => (hasLockedSub(k) ? setDeleteBlocked(k) : setDeleteTarget(k));
  const requestRefresh = (k) => {
    if (isSubPending(k) && !isAdmin) { setRefreshBlocked(k); return; }
    setRefreshTarget(k);
  };

  const isAdmin = profile?.role === 'admin';

  // Abonnement actif global (peut être null)
  const hasActiveSub = subscription?.status === 'active' && new Date(subscription.expires_at) > new Date();

  // --- Focus sur une clé depuis la page "Mes abonnements" (?focus=<keyId>) ---
  const [searchParams] = useSearchParams();
  const [focusedKeyId, setFocusedKeyId] = useState(searchParams.get('focus'));
  const keyRowRefs = useRef({});

  useEffect(() => {
    if (!loading && focusedKeyId) {
      const rowEl = keyRowRefs.current[focusedKeyId];
      if (rowEl) {
        rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const timer = setTimeout(() => setFocusedKeyId(null), 4000);
        return () => clearTimeout(timer);
      }
    }
  }, [loading, focusedKeyId]);

  // === Création de clé ===
  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Clé libre : pas de subscription_id à la création — l'utilisateur lie ensuite son abonnement
      const { data, error } = await createKey(newKeyName.trim() || 'Default API Key', null);

      if (error) {
        addToast(error.message || 'Erreur lors de la génération', 'error');
      } else if (data?.success) {
        setCreatedKeyData({ ...data, mode: 'create', state: data.is_enabled ? 'live' : 'unlinked' });
        setIsCreateOpen(false);
        setNewKeyName('');
        addToast('Clé API générée ! Copiez-la immédiatement.', 'success');
      } else {
        addToast(data?.error_message || 'Échec de génération', 'error');
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // === Toggle (activation/désactivation) ===
  const handleToggle = async (keyItem, targetState) => {
    const hasActiveSub = Boolean(
      keyItem.subscriptions?.status === 'active' &&
      new Date(keyItem.subscriptions.expires_at) > new Date()
    );
    const hasPendingSub = Boolean(keyItem.subscriptions && 
      (keyItem.subscriptions.status === 'pending_validation' || keyItem.subscriptions.status === 'pending'));

    // Si on tente d'activer avec un abonnement en attente → pop-up informatif
    if (targetState && hasPendingSub && !hasActiveSub && !isAdmin) {
      setPendingSubKey(keyItem);
      return;
    }

    const res = await toggleKey(keyItem.id, targetState, hasActiveSub || isAdmin);

    if (res?.error) {
      if (res.error.needSubscription) {
        addToast("Activez d'abord un abonnement pour cette clé.", 'warning');
        setSubscribeFromKey(keyItem.id);
      } else {
        addToast(res.error.message, 'error');
      }
    } else {
      addToast(targetState ? 'Clé API activée.' : 'Clé API désactivée.', 'success');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    addToast('Copié dans le presse-papiers !', 'success');
  };

  // Clés sans abonnement actif lié
  const keysWithoutSub = keys.filter(k => {
    const s = k.subscriptions;
    return !s || s.status !== 'active' || new Date(s.expires_at) <= new Date();
  });

  return (
    <div style={{ maxWidth: 1050, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Gestionnaire de Clés d'Accès API</h1>
          <p style={{ color: 'var(--axis-textMuted)', fontSize: 13, marginTop: 2 }}>
            Créez vos clés, puis liez-leur un abonnement pour les activer.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontSize: 13 }}
        >
          <Plus size={16} /> Créer une nouvelle clé
        </button>
      </div>

      {/* Banner : clés sans abonnement */}
      {keysWithoutSub.length > 0 && (
        <div style={{
          padding: '14px 18px', borderRadius: 12, marginBottom: 24,
          background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertCircle color="var(--axis-warning)" size={20} />
            <span style={{ fontSize: 13, color: 'var(--axis-text)' }}>
              <b>{keysWithoutSub.length} clé{keysWithoutSub.length > 1 ? 's' : ''}</b> sans abonnement actif.
              Liez-leur un pack pour les activer et interroger les modèles.
            </span>
          </div>
          <Link to="/dashboard/subscriptions" className="btn-ghost" style={{ fontSize: 12, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
            Voir les 7 paliers (dès 1 500 FCFA) <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {/* Tableau des clés */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="ax-table">
            <thead>
              <tr>
                <th>Nom de la clé</th>
                <th>Préfixe</th>
                <th>Pack associé</th>
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
                  const sub = k.subscriptions;
                  const hasSub = Boolean(sub && sub.status === 'active' && new Date(sub.expires_at) > new Date());
                  const isPending = Boolean(sub && (sub.status === 'pending_validation' || sub.status === 'pending'));
                  const budget = Number(sub?.budget_amount_usd || 0);
                  const balance = Number(sub?.balance_usd || 0);
                  const usagePct = budget > 0 ? Math.min(100, Math.round(((budget - balance) / budget) * 100)) : 0;
                  // État réel : l'utilisateur voit ce que le serveur accepte
                  const isLive = Boolean(k.is_enabled) && (hasSub || profile?.role === 'admin');
                  const isPendingDisplay = !isLive && Boolean(sub && (sub.status === 'pending_validation' || sub.status === 'pending'));

                  return (
                    <tr key={k.id} ref={(el) => (keyRowRefs.current[k.id] = el)} style={{ outline: focusedKeyId === k.id ? '2px solid var(--axis-accent)' : 'none', outlineOffset: -2, transition: 'outline 0.3s ease' }}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{k.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--axis-muted)' }}>
                          Créée le {new Date(k.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </td>

                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        <span style={{ background: 'var(--axis-bg)', padding: '3px 8px', borderRadius: 6, border: '1px solid var(--axis-border)' }}>
                          {k.key_prefix}
                        </span>
                      </td>

                      {/* Colonne Pack associé */}
                      <td>
                        {hasSub ? (
                          <div>
                            <span className="badge badge-green" style={{ marginBottom: 4, display: 'block', width: 'fit-content' }}>
                              Palier {sub.tier_number} — {TIERS_NAMES[sub.tier_number]}
                            </span>
                            {/* Mini barre de progression */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 70, height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                <div style={{
                                  width: `${usagePct}%`, height: '100%',
                                  background: usagePct >= 80 ? 'var(--axis-danger)' : 'var(--axis-accent)',
                                  borderRadius: 999
                                }} />
                              </div>
                              <span style={{ fontSize: 10, color: 'var(--axis-muted)' }}>{usagePct}%</span>
                            </div>
                            <button
                              onClick={() => navigate(`/dashboard/history?focus=${sub.id}`)}
                              style={{ fontSize: 11, color: 'var(--axis-textMuted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 6, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              title="Voir le détail de cet abonnement"
                            >
                              Voir l'abonnement <ArrowRight size={11} />
                            </button>
                          </div>
                        ) : isPending ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <span className="badge badge-yellow">En attente de validation</span>
                            <button
                              onClick={() => navigate(`/dashboard/history?focus=${sub.id}`)}
                              style={{ fontSize: 11, color: 'var(--axis-textMuted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, textAlign: 'left' }}
                              title="Voir le détail de cet abonnement"
                            >
                              Voir l'abonnement <ArrowRight size={11} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span className="badge badge-gray">Non lié</span>
                            <button
                              onClick={() => navigate('/dashboard/subscriptions', { state: { targetKeyId: k.id } })}
                              style={{ fontSize: 11, color: 'var(--axis-accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', textAlign: 'left' }}
                            >
                              + Lier un abonnement
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Toggle activation */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <label className="toggle" title={k.is_enabled ? 'Désactiver la clé' : 'Activer la clé'}>
                            <input
                              type="checkbox"
                              checked={isLive}
                              onChange={e => handleToggle(k, e.target.checked)}
                            />
                            <span className="toggle-track" />
                            <span className="toggle-thumb" />
                          </label>
                          <span style={{ fontSize: 11, fontWeight: 700, color: isLive ? 'var(--axis-accent)' : isPendingDisplay ? 'var(--axis-warning)' : 'var(--axis-muted)' }}>
                            {isLive ? 'ACTIF' : isPendingDisplay ? 'EN ATTENTE' : 'INACTIF'}
                          </span>
                        </div>
                      </td>

                      <td style={{ fontSize: 12, color: 'var(--axis-muted)' }}>
                        {k.last_used_at ? new Date(k.last_used_at).toLocaleString('fr-FR') : 'Jamais'}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button onClick={() => copyToClipboard(k.key_prefix)} className="btn-icon" title="Copier le préfixe">
                            <Copy size={15} />
                          </button>
                          <button
                            onClick={() => requestRefresh(k)}
                            className="btn-icon"
                            title={isSubPending(k) && !isAdmin ? 'Indisponible : abonnement en attente' : 'Régénérer cette clé'}
                            style={isSubPending(k) && !isAdmin ? { opacity: 0.45 } : undefined}
                          >
                            <RefreshCw size={15} />
                          </button>
                          <button
                            onClick={() => requestDelete(k)}
                            className="btn-icon danger"
                            title={hasLockedSub(k) ? 'Indisponible : abonnement lié' : 'Supprimer la clé'}
                            style={hasLockedSub(k) ? { opacity: 0.45 } : undefined}
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

      {/* === Modal Création de Clé === */}
      <Modal isOpen={isCreateOpen} onClose={() => { setIsCreateOpen(false); setNewKeyName(''); }} title="Créer une nouvelle clé d'accès API">
        <form onSubmit={handleCreate}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>Nom de la clé</label>
            <input
              type="text"
              className="input-field"
              value={newKeyName}
              onChange={e => setNewKeyName(e.target.value)}
              required
              placeholder="Ex: Cursor / Claude Code / Script Python"
              autoFocus
            />
          </div>

          {/* Info contextuelle */}
          <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--axis-bg)', border: '1px solid var(--axis-border)', marginBottom: 22, fontSize: 12.5, lineHeight: 1.6 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, color: 'var(--axis-accent)', fontWeight: 600 }}>
              <Key size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>Comment ça marche ?</span>
            </div>
            <ol style={{ margin: 0, paddingLeft: 18, color: 'var(--axis-textMuted)', fontSize: 12 }}>
              <li>Créez votre clé librement — elle sera inactive par défaut.</li>
              <li>Depuis la page <b>Paliers &amp; Tarifs</b>, souscrivez un abonnement en choisissant <b>cette clé</b>.</li>
              <li>Une fois l'abonnement validé, la clé s'active automatiquement.</li>
            </ol>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={() => { setIsCreateOpen(false); setNewKeyName(''); }} className="btn-ghost" style={{ flex: 1 }}>
              Annuler
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ flex: 2 }}>
              {isSubmitting ? 'Génération...' : 'Générer ma clé API'}
            </button>
          </div>
        </form>
      </Modal>

      {/* === Modal Pop-up Unique Affichage Clé en Clair === */}
      <Modal isOpen={!!createdKeyData} title={createdKeyData?.mode === 'refresh' ? '🔄 Clé API régénérée' : '🎉 Clé API générée avec succès'}>
        {createdKeyData && (
          <div>
            {/* Avertissement sécurité */}
            <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid var(--axis-warning)', padding: 16, borderRadius: 12, marginBottom: 20 }}>
              <p style={{ color: 'var(--axis-warning)', fontSize: 13, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={16} /> Avertissement de sécurité
              </p>
              <p style={{ color: 'var(--axis-textMuted)', fontSize: 12, margin: 0 }}>
                Cette clé secrète ne sera <b>plus jamais affichée en clair</b>. Copiez-la maintenant et conservez-la en lieu sûr.
              </p>
            </div>

            {/* Clé en clair */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>Votre clé secrète (Bearer Token) :</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  readOnly
                  value={createdKeyData.api_key}
                  className="input-field"
                  style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--axis-accent)', background: 'var(--axis-bg)' }}
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

            {/* Statut & prochaine étape */}
            <div style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--axis-bg)', border: '1px solid var(--axis-border)', marginBottom: 20, fontSize: 12.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Zap size={14} color={createdKeyData.state === 'live' ? 'var(--axis-accent)' : 'var(--axis-warning)'} />
                <b>Statut :</b>{' '}
                <span style={{ color: createdKeyData.state === 'live' ? 'var(--axis-accent)' : 'var(--axis-warning)' }}>
                  {createdKeyData.state === 'live' && 'Active — liée à votre abonnement'}
                  {createdKeyData.state === 'pending' && 'En attente de validation de l\'abonnement'}
                  {createdKeyData.state === 'unlinked' && 'Inactive — abonnement requis'}
                </span>
              </div>
              <div style={{ color: 'var(--axis-textMuted)', lineHeight: 1.5 }}>
                {createdKeyData.mode === 'refresh' && 'L\'ancienne clé est révoquée. Votre abonnement reste lié à cette nouvelle clé. '}
                {createdKeyData.state === 'unlinked' && <>👉 Rendez-vous dans <b>Paliers &amp; Tarifs</b> pour souscrire un forfait et lier cette clé.</>}
                {createdKeyData.state === 'pending' && 'Elle s\'activera automatiquement dès la validation du paiement.'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setCreatedKeyData(null)} className="btn-ghost" style={{ flex: 1 }}>
                J'ai copié ma clé
              </button>
              {createdKeyData.state === 'unlinked' && (
                <button
                  type="button"
                  onClick={() => { setCreatedKeyData(null); navigate('/dashboard/subscriptions'); }}
                  className="btn-primary"
                  style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <Layers size={15} /> Voir les paliers d'abonnement
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
      {/* === Modal Abonnement Requis (déclenchée par le toggle) === */}
      <Modal isOpen={!!subscribeFromKey} onClose={() => setSubscribeFromKey(null)} title="Abonnement requis pour activer cette clé">
        <div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 10, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.3)', marginBottom: 20 }}>
            <Shield size={20} color="var(--axis-warning)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--axis-textMuted)' }}>
              La clé <b style={{ color: 'var(--axis-text)' }}>{keys.find(k => k.id === subscribeFromKey)?.name || 'sélectionnée'}</b> reste inactive tant qu'aucun abonnement validé ne lui est rattaché.
              Choisissez un palier (dès <b style={{ color: 'var(--axis-accent)' }}>1 500 FCFA</b>) — la clé s'activera automatiquement dès la validation du paiement.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={() => setSubscribeFromKey(null)} className="btn-ghost" style={{ flex: 1 }}>
              Plus tard
            </button>
            <button
              type="button"
              onClick={() => {
                const keyId = subscribeFromKey;
                setSubscribeFromKey(null);
                navigate('/dashboard/subscriptions', { state: { targetKeyId: keyId } });
              }}
              className="btn-primary"
              style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Layers size={15} /> Choisir un palier pour cette clé
            </button>
          </div>
        </div>
      </Modal>

      {/* === Modal Confirmation Suppression === */}
      <ConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          const { error } = await deleteKey(deleteTarget.id);
          if (error?.code === 'KEY_HAS_SUBSCRIPTION') setDeleteBlocked(deleteTarget);
          else if (error) addToast(error.message, 'error');
          else addToast('Clé supprimée définitivement.', 'success');
        }}
        title="Supprimer la clé API"
        message={`Êtes-vous sûr de vouloir supprimer définitivement la clé "${deleteTarget?.name || 'sélectionnée'}" ? Cette action est irréversible et toutes les requêtes utilisant cette clé échoueront.`}
        confirmLabel="Supprimer définitivement"
        cancelLabel="Annuler"
        isDanger
      />

      {/* === Modal Blocage Suppression === */}
      <Modal isOpen={!!deleteBlocked} onClose={() => setDeleteBlocked(null)} title="Suppression impossible">
        <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--axis-textMuted)', marginBottom: 20 }}>
          La clé <b style={{ color: 'var(--axis-text)' }}>{deleteBlocked?.name}</b> est liée à un abonnement
          {deleteBlocked?.subscriptions?.status === 'active' ? ' validé en cours' : ' en attente de validation'}.
          Elle pourra être supprimée une fois cet abonnement terminé.
        </div>
        <button onClick={() => setDeleteBlocked(null)} className="btn-primary" style={{ width: '100%' }}>Compris</button>
      </Modal>

      {/* === Modal Confirmation Régénération === */}
      <ConfirmationModal
        isOpen={!!refreshTarget}
        onClose={() => setRefreshTarget(null)}
        onConfirm={async () => {
          const target = refreshTarget;
          if (!target) return;
          const res = await refreshKey(target.id);

          if (res.error) {
            if (res.error.code === 'REFRESH_BLOCKED_PENDING') setRefreshBlocked(target);
            else { if (res.error) addToast(res.error.message, 'error'); }
            return;
          }

          // Même modale qu'à la création : clé en clair + statut
          setCreatedKeyData({
            ...res.data,
            mode: 'refresh',
            keyName: target.name,
            state: getKeyState(target),
          });
          addToast('Clé régénérée ! Copiez-la immédiatement.', 'success');
        }}
        title="Régénérer la clé API"
        message={`La régénération de la clé "${refreshTarget?.name || 'sélectionnée'}" créera un nouveau token. L'ancien token sera immédiatement révoqué et toutes les requêtes utilisant l'ancienne clé échoueront.`}
        confirmLabel="Régénérer la clé"
        cancelLabel="Annuler"
      />

      {/* === Modal Abonnement en attente de validation === */}
      <Modal isOpen={!!pendingSubKey} onClose={() => setPendingSubKey(null)} title="Abonnement en cours de validation">
        {pendingSubKey && (
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 10, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.3)', marginBottom: 20 }}>
              <Hourglass size={24} color="var(--axis-warning)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--axis-text)' }}>
                <b>Votre abonnement est en attente de validation.</b><br /><br />
                Une fois le paiement confirmé par l'administrateur ou votre modérateur, l'abonnement sera activé et vous pourrez activer cette clé.
              </div>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--axis-muted)', marginBottom: 10 }}>
              Vous pouvez suivre l'état de vos abonnements et paiements depuis <b>Mes abonnements</b>.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setPendingSubKey(null)} className="btn-ghost" style={{ flex: 1 }}>
                J'ai compris
              </button>
              <button
                type="button"
                onClick={() => { setPendingSubKey(null); navigate('/dashboard/history'); }}
                className="btn-primary"
                style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Layers size={15} /> Voir mes abonnements
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* === Modal Blocage Régénération === */}
      <Modal isOpen={!!refreshBlocked} onClose={() => setRefreshBlocked(null)} title="Régénération indisponible pour le moment">
        {refreshBlocked && (
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 10, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.3)', marginBottom: 20 }}>
              <Shield size={20} color="var(--axis-warning)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--axis-textMuted)' }}>
                La clé <b style={{ color: 'var(--axis-text)' }}>{refreshBlocked.name}</b> est liée à un abonnement
                <b style={{ color: 'var(--axis-warning)' }}> en attente de validation</b>.
                Tant que votre paiement n'est pas validé, la clé ne peut pas être régénérée.
                <br /><br />
                Dès la validation, la clé s'active et vous pourrez la régénérer librement.
                Votre abonnement restera lié à la nouvelle clé.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setRefreshBlocked(null)} className="btn-ghost" style={{ flex: 1 }}>
                Compris
              </button>
              <button type="button" className="btn-primary" style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                onClick={() => { const id = refreshBlocked.id; setRefreshBlocked(null); navigate(`/dashboard/history?focus=${id}`); }}>
                Voir l'état de mon abonnement <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
