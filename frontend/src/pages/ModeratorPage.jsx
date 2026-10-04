import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import { Shield, CheckCircle2, Clock, DollarSign, Archive, Users, RefreshCw } from 'lucide-react';

export const ModeratorPage = () => {
  const { profile } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [validatingId, setValidatingId] = useState(null);
  const addToast = useToast();

  useEffect(() => {
    if (profile?.role === 'moderator' || profile?.role === 'admin') {
      fetchDashboard();
    }
  }, [profile]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('axis_get_moderator_dashboard', { p_moderator_id: profile.id });
      if (error) {
        addToast(error.message, 'error');
      } else if (data?.success) {
        setDashboardData(data);
      }
    } catch (e) {
      console.error(e);
      addToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (subId) => {
    setValidatingId(subId);
    try {
      const { data, error } = await supabase.rpc('axis_moderator_validate_subscription', {
        p_validator_id: profile.id,
        p_subscription_id: subId
      });
      if (error) {
        addToast(error.message, 'error');
      } else if (!data?.success) {
        addToast(data?.error_message || 'Échec de validation', 'error');
      } else {
        addToast(`Abonnement validé ! Statut : ${data.assigned_status}`, 'success');
        fetchDashboard();
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setValidatingId(null);
    }
  };

  if (profile?.role !== 'moderator' && profile?.role !== 'admin') {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--axis-muted)' }}>Accès réservé aux modérateurs.</div>;
  }

  const totals = dashboardData?.totals || {};
  const clients = dashboardData?.clients || [];
  const modCode = dashboardData?.moderator_code || profile?.moderator_code || 'MOD-????';

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Espace Modérateur de Proximité</h1>
          <p style={{ color: 'var(--axis-textMuted)', fontSize: 13 }}>
            Gestion de vos clients rattachés, validation de paiements et suivi de vos commissions.
          </p>
        </div>
        <button onClick={fetchDashboard} className="btn-ghost" style={{ padding: '8px 14px', fontSize: 12 }}>
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      {/* Code Badge & Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(132,204,22,0.12) 0%, var(--axis-sidebar) 100%)', borderColor: 'var(--axis-accent)', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--axis-textMuted)' }}>VOTRE CODE OFFICIEL</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--axis-accent)', letterSpacing: '0.04em', margin: '4px 0' }}>
            {modCode}
          </div>
          <div style={{ fontSize: 11, color: 'var(--axis-textMuted)' }}>Communiquez ce code à vos clients</div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={22} color="var(--axis-text)" />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{totals.total_validated ?? 0}</div>
            <div style={{ fontSize: 12, color: 'var(--axis-textMuted)' }}>Clients validés</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(251,191,36,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={22} color="var(--axis-warning)" />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--axis-warning)' }}>{totals.unpaid_commissions ?? 0}</div>
            <div style={{ fontSize: 12, color: 'var(--axis-textMuted)' }}>Commissions à percevoir</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(132,204,22,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={22} color="var(--axis-accent)" />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--axis-accent)' }}>{totals.paid_commissions ?? 0}</div>
            <div style={{ fontSize: 12, color: 'var(--axis-textMuted)' }}>Commissions payées</div>
          </div>
        </div>
      </div>

      {/* Notice de rappel des permissions modérateur */}
      <div style={{ padding: '12px 18px', borderRadius: 10, background: 'rgba(192,132,252,0.06)', border: '1px solid rgba(192,132,252,0.2)', marginBottom: 24, fontSize: 12.5, color: 'var(--axis-textMuted)' }}>
        ℹ️ <b>Règle de sécurité :</b> Les modérateurs ont uniquement le droit de <b>valider</b> les souscriptions après encaissement. Seul l'administrateur suprême est habilité à suspendre un abonnement avec justificatif.
      </div>

      {/* Table Clients rattachés */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--axis-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Demandes et Clients Rattachés</h2>
          <span style={{ fontSize: 12, color: 'var(--axis-muted)' }}>{clients.length} dossier(s)</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="ax-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Palier</th>
                <th>Statut</th>
                <th>Solde</th>
                <th>Commission</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.subscription_id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{c.client_pseudo || c.client_username}</div>
                    <div style={{ fontSize: 11, color: 'var(--axis-muted)' }}>@{c.client_username}</div>
                  </td>
                  <td><b>Palier {c.tier_number}</b></td>
                  <td>
                    <span className={`badge ${c.status === 'active' ? 'badge-green' : c.status === 'pending_validation' ? 'badge-yellow' : 'badge-gray'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td>${Number(c.balance_usd || 0).toFixed(2)}</td>
                  <td>
                    <span className={`badge ${c.commission_status === 'paid' ? 'badge-green' : c.commission_status === 'unpaid' ? 'badge-yellow' : 'badge-gray'}`}>
                      {c.commission_status}
                    </span>
                  </td>
                  <td>
                    {c.status === 'pending_validation' ? (
                      <button
                        onClick={() => handleValidate(c.subscription_id)}
                        disabled={validatingId === c.subscription_id}
                        className="btn-primary"
                        style={{ padding: '6px 14px', fontSize: 12 }}
                      >
                        {validatingId === c.subscription_id ? 'Validation...' : 'Valider Paiement'}
                      </button>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--axis-muted)' }}>Traité</span>
                    )}
                  </td>
                </tr>
              ))}
              {clients.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" style={{ padding: 32, textAlign: 'center', color: 'var(--axis-muted)' }}>
                    Aucun client n'a encore saisi votre code modérateur ({modCode}).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
