import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import { Modal } from '../components/Modal';
import { AdminSecurityButton } from '../components/AdminGate';
import { ShieldAlert, UserPlus, RefreshCw, Archive, CheckCircle, Ban, Users } from 'lucide-react';

export const AdminPage = () => {
  const { profile } = useAuth();
  const [subs, setSubs] = useState([]);
  const [moderators, setModerators] = useState([]);
  const [disableSubId, setDisableSubId] = useState(null);
  const [reason, setReason] = useState('');
  
  // Nominate moderator form state
  const [isNominateOpen, setIsNominateOpen] = useState(false);
  const [nominateUserId, setNominateUserId] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [allProfiles, setAllProfiles] = useState([]);

  const addToast = useToast();

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchSubs();
      fetchModerators();
      fetchAllProfiles();
    }
  }, [profile]);

  const fetchSubs = async () => {
    const { data } = await supabase.from('subscriptions').select('*, profiles(pseudo, email, username)').order('created_at', { ascending: false });
    if (data) setSubs(data);
  };

  const fetchModerators = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'moderator').order('created_at', { ascending: false });
    if (data) setModerators(data);
  };

  const fetchAllProfiles = async () => {
    const { data } = await supabase.from('profiles').select('id, pseudo, email, username, role').order('created_at', { ascending: false });
    if (data) setAllProfiles(data);
  };

  const handleDisable = async (e) => {
    e.preventDefault();
    if (!reason || reason.trim().length < 5) {
      addToast('Un justificatif textuel obligatoire (min 5 caractères) doit être fourni.', 'error');
      return;
    }
    const { data, error } = await supabase.rpc('admin_disable_subscription', {
      p_admin_id: profile.id,
      p_subscription_id: disableSubId,
      p_reason: reason.trim()
    });
    if (error) {
      addToast(error.message, 'error');
    } else if (!data?.success) {
      addToast(data?.error_message || 'Échec de suspension', 'error');
    } else {
      addToast('Abonnement suspendu avec succès. L’alerte s’affichera sur le compte du client.', 'success');
      setDisableSubId(null);
      setReason('');
      fetchSubs();
    }
  };

  const handleNominateModerator = async (e) => {
    e.preventDefault();
    if (!nominateUserId) {
      addToast('Veuillez sélectionner un utilisateur.', 'error');
      return;
    }

    const { data, error } = await supabase.rpc('axis_create_moderator', {
      p_admin_id: profile.id,
      p_user_id: nominateUserId,
      p_custom_code: customCode.trim() || null
    });

    if (error) {
      addToast(error.message, 'error');
    } else if (!data?.success) {
      addToast(data?.error_message || 'Échec d’attribution', 'error');
    } else {
      addToast(`Modérateur nommé avec succès ! Code : ${data.moderator_code}`, 'success');
      setIsNominateOpen(false);
      setNominateUserId('');
      setCustomCode('');
      fetchModerators();
      fetchAllProfiles();
    }
  };

  const handleArchiveCommission = async (subId, newStatus) => {
    const { data, error } = await supabase.rpc('admin_archive_commission', {
      p_admin_id: profile.id,
      p_subscription_id: subId,
      p_new_status: newStatus
    });

    if (error) {
      addToast(error.message, 'error');
    } else if (!data?.success) {
      addToast(data?.error_message || 'Échec d’archivage', 'error');
    } else {
      addToast(`Commission passée en statut : ${newStatus}`, 'success');
      fetchSubs();
    }
  };

  if (profile?.role !== 'admin') {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--axis-muted)' }}>Accès réservé à l'administrateur suprême.</div>;
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Panneau d'Administration Suprême</h1>
          <p style={{ color: 'var(--axis-textMuted)', fontSize: 13 }}>
            Gestion globale des abonnements, nomination des modérateurs et règlement des commissions.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <AdminSecurityButton />
          <button onClick={() => { fetchSubs(); fetchModerators(); }} className="btn-ghost" style={{ padding: '8px 14px', fontSize: 12 }}>
            <RefreshCw size={14} /> Actualiser
          </button>
          <button onClick={() => setIsNominateOpen(true)} className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }}>
            <UserPlus size={15} /> Nommer un Modérateur
          </button>
        </div>
      </div>

      {/* Moderators List */}
      <div className="card" style={{ marginBottom: 32, padding: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Modérateurs Actifs ({moderators.length})</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          {moderators.map(m => (
            <div key={m.id} style={{
              padding: '12px 16px', borderRadius: 10, background: 'var(--axis-bg)',
              border: '1px solid var(--axis-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: 600 }}>{m.pseudo || m.username}</div>
                <div style={{ fontSize: 11, color: 'var(--axis-muted)' }}>{m.email}</div>
              </div>
              <span className="badge badge-purple" style={{ fontFamily: 'monospace', fontWeight: 800 }}>
                {m.moderator_code || 'SANS CODE'}
              </span>
            </div>
          ))}
          {moderators.length === 0 && (
            <p style={{ color: 'var(--axis-muted)', fontSize: 13 }}>Aucun modérateur nommé pour le moment.</p>
          )}
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--axis-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Tous les Abonnements ({subs.length})</h2>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="ax-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Palier</th>
                <th>Statut</th>
                <th>Solde / Budget</th>
                <th>Modérateur</th>
                <th>Commission</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subs.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.profiles?.pseudo || 'Utilisateur'}</div>
                    <div style={{ fontSize: 11, color: 'var(--axis-muted)' }}>{s.profiles?.email}</div>
                  </td>
                  <td><b>Palier {s.tier_number}</b></td>
                  <td>
                    <span className={`badge ${s.status === 'active' ? 'badge-green' : s.status === 'pending_validation' ? 'badge-yellow' : s.status === 'disabled' ? 'badge-red' : 'badge-gray'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td>${Number(s.balance_usd).toFixed(2)} / ${Number(s.budget_amount_usd).toFixed(2)}</td>
                  <td>
                    {s.moderator_code_used ? (
                      <span style={{ fontFamily: 'monospace', color: 'var(--axis-purple)' }}>{s.moderator_code_used}</span>
                    ) : (
                      <span style={{ color: 'var(--axis-muted)' }}>Direct Admin</span>
                    )}
                  </td>
                  <td>
                    {s.moderator_id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className={`badge ${s.commission_status === 'paid' ? 'badge-green' : s.commission_status === 'unpaid' ? 'badge-yellow' : 'badge-gray'}`}>
                          {s.commission_status}
                        </span>
                        {s.commission_status === 'unpaid' && (
                          <button
                            onClick={() => handleArchiveCommission(s.id, 'paid')}
                            title="Marquer comme payée"
                            className="btn-icon"
                          >
                            <CheckCircle size={14} color="var(--axis-accent)" />
                          </button>
                        )}
                        {s.commission_status === 'paid' && (
                          <button
                            onClick={() => handleArchiveCommission(s.id, 'archived')}
                            title="Archiver la commission"
                            className="btn-icon"
                          >
                            <Archive size={14} color="var(--axis-muted)" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--axis-muted)', fontSize: 11 }}>N/A</span>
                    )}
                  </td>
                  <td>
                    {s.status === 'active' ? (
                      <button
                        onClick={() => setDisableSubId(s.id)}
                        className="btn-ghost"
                        style={{ color: 'var(--axis-danger)', borderColor: 'var(--axis-danger)', padding: '5px 12px', fontSize: 12 }}
                      >
                        <Ban size={12} /> Suspendre
                      </button>
                    ) : s.status === 'disabled' ? (
                      <span style={{ fontSize: 11, color: 'var(--axis-danger)' }} title={s.disabled_reason}>
                        Suspendu
                      </span>
                    ) : (
                      <span style={{ color: 'var(--axis-muted)', fontSize: 12 }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Suspension with Mandatory Reason */}
      <Modal isOpen={!!disableSubId} onClose={() => setDisableSubId(null)} title="Suspendre l'abonnement (Admin Seul)" isDanger>
        <form onSubmit={handleDisable}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 13 }}>
              Justificatif obligatoire (sera affiché en popup au client) :
            </label>
            <textarea
              className="input-field"
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={4}
              required
              placeholder="Ex: Abus de charge détecté, non-respect des quotas ou contestation de paiement..."
            />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', background: 'var(--axis-danger)', color: '#fff' }}>
            Confirmer la suspension immédiate
          </button>
        </form>
      </Modal>

      {/* Modal Nominate Moderator */}
      <Modal isOpen={isNominateOpen} onClose={() => setIsNominateOpen(false)} title="Nommer un nouveau modérateur">
        <form onSubmit={handleNominateModerator}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 13 }}>Sélectionner l'utilisateur :</label>
            <select
              className="input-field"
              value={nominateUserId}
              onChange={e => setNominateUserId(e.target.value)}
              required
            >
              <option value="">-- Choisir un utilisateur --</option>
              {allProfiles.filter(p => p.role !== 'admin').map(p => (
                <option key={p.id} value={p.id}>
                  {p.pseudo || p.username} ({p.email}) — Actuel : {p.role}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 13 }}>
              Code personnalisé (optionnel, ex: MOD-8888) :
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Laisser vide pour génération aléatoire (MOD-XXXX)"
              value={customCode}
              onChange={e => setCustomCode(e.target.value.toUpperCase())}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%' }}>
            Promouvoir en modérateur
          </button>
        </form>
      </Modal>
    </div>
  );
};
