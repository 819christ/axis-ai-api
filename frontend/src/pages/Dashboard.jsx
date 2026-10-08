import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabase';
import { Modal } from '../components/Modal';
import { Link } from 'react-router-dom';
import { Key, ArrowRight, RefreshCw, Sparkles, Layers, CreditCard, History, Plus, ShieldCheck } from 'lucide-react';

const daysLeft = (exp) => exp ? Math.max(0, Math.ceil((new Date(exp) - new Date()) / 86400000)) : null;

export const Dashboard = () => {
  const { profile } = useAuth();
  const [subs, setSubs] = useState([]);
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    if (profile) {
      fetchOverview();
      checkAlert();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const checkAlert = async () => {
    try {
      const { data } = await supabase.rpc('axis_get_popup_alert', { p_user_id: profile.id });
      if (data?.has_alert) setAlert(data.message);
    } catch (e) {
      console.error('Erreur alert check:', e);
    }
  };

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const [subRes, keyRes] = await Promise.all([
        supabase.from('subscriptions').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }),
        supabase.from('api_keys').select('id, is_enabled, subscription_id').eq('user_id', profile.id),
      ]);
      if (subRes.error) throw subRes.error;
      setSubs(subRes.data || []);
      setKeys(keyRes.data || []);
    } catch (e) {
      console.error('Erreur chargement données:', e);
    } finally {
      setLoading(false);
    }
  };

  const unlinkedKeys = keys.filter(k => !k.subscription_id);

  const quickActions = [
    { to: '/dashboard/keys', icon: Key, title: 'Mes clés API', desc: 'Créer et gérer vos clés' },
    { to: '/dashboard/history', icon: Layers, title: 'Mes abonnements', desc: 'Suivre vos packs' },
    { to: '/dashboard/payments', icon: History, title: 'Historique des paiements', desc: 'Valider vos demandes' },
    { to: '/dashboard/subscriptions', icon: CreditCard, title: 'Paliers & tarifs', desc: 'Souscrire un pack' },
  ];

  return (
    <div style={{ maxWidth: 1050, margin: '0 auto' }}>
      {/* Bannière proposition de valeur */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderRadius: 12,
        background: 'var(--axis-accent-dim)', border: '1px solid var(--axis-border)', marginBottom: 24
      }}>
        <Sparkles size={16} color="var(--axis-accent)" />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--axis-text)' }}>
          Axis AI, la toute première plateforme béninoise offrant les modèles d'IA mondiaux à des prix abordables en Francs CFA.
        </span>
      </div>

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Bonjour, {profile?.pseudo || 'Utilisateur'} 👋</h1>
          <p style={{ color: 'var(--axis-textMuted)', fontSize: 13, marginTop: 2 }}>
            Gérez vos clés API, vos abonnements et suivez vos paiements depuis un seul endroit.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={fetchOverview} className="btn-ghost" style={{ padding: '8px 14px', fontSize: 12 }}>
            <RefreshCw size={14} /> Actualiser
          </button>
          <Link to="/dashboard/keys" className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }}>
            <Key size={15} /> Mes Clés API
          </Link>
        </div>
      </div>

      {/* Notification : clés sans abonnement (coloration conservée car c'est un avertissement) */}
      {unlinkedKeys.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 18px', borderRadius: 12,
          marginBottom: 24, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)'
        }}>
          <ShieldCheck size={20} color="var(--axis-warning)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 13, lineHeight: 1.5, flex: 1 }}>
            <b style={{ color: 'var(--axis-warning)' }}>{unlinkedKeys.length} clé(s) sans abonnement.</b>{' '}
            <span style={{ color: 'var(--axis-textMuted)' }}>Liez un pack à vos clés pour les activer et interroger les modèles.</span>
          </div>
          <Link to="/dashboard/subscriptions" className="btn-primary" style={{ fontSize: 12, padding: '6px 14px', flexShrink: 0 }}>
            Voir les paliers
          </Link>
        </div>
      )}

      {/* Actions rapides */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 26 }}>
        {quickActions.map(a => (
          <Link
            key={a.to}
            to={a.to}
            className="card"
            style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 8, textDecoration: 'none', transition: 'transform 0.15s ease, border-color 0.15s ease' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--axis-border)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--axis-border)'; }}
          >
            <a.icon size={20} color="var(--axis-textMuted)" />
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--axis-text)' }}>{a.title}</div>
            <div style={{ fontSize: 12, color: 'var(--axis-muted)' }}>{a.desc}</div>
          </Link>
        ))}
      </div>


      {/* Aperçu multi-abonnements (remplace « abonnement actuel ») */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Vos abonnements</h2>
          <Link to="/dashboard/history" className="btn-ghost" style={{ fontSize: 12, padding: '6px 14px' }}>
            Tout voir <ArrowRight size={13} />
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--axis-muted)' }}>Chargement...</div>
        ) : subs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 10px' }}>
            <p style={{ color: 'var(--axis-textMuted)', fontSize: 13, marginBottom: 16 }}>Vous n'avez aucun abonnement actif pour le moment.</p>
            <Link to="/dashboard/subscriptions" className="btn-primary" style={{ fontSize: 13 }}>
              <Plus size={15} /> Activer un pack
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {subs.map(sub => {
              const d = daysLeft(sub.expires_at);
              const isActive = sub.status === 'active';
              const isPending = sub.status === 'pending_validation' || sub.status === 'pending';
              return (
                <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, background: 'var(--axis-bg)', border: '1px solid var(--axis-border)' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--axis-accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--axis-accent)', flexShrink: 0 }}>
                    P{sub.tier_number}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{sub.package_name || `Pack ${sub.tier_number}`}</div>
                    <div style={{ fontSize: 11, color: 'var(--axis-muted)' }}>
                      {sub.expires_at ? `Échéance ${new Date(sub.expires_at).toLocaleDateString('fr-FR')}` : 'Crédit sans échéance'}
                      {' · '}${Number(sub.balance_usd || 0).toFixed(2)} / ${Number(sub.budget_amount_usd || 0).toFixed(2)} restants
                      {isActive && d !== null ? ` · ${d} j restants` : ''}
                    </div>
                  </div>
                  <span className={`badge ${isActive ? 'badge-green' : isPending ? 'badge-yellow' : 'badge-gray'}`}>
                    {isActive ? 'Actif' : isPending ? 'En attente' : sub.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal suspension administrative (sobre) */}
      <Modal isOpen={!!alert} isDanger title="Suspension Administrative">
        <div style={{ padding: '10px 0 20px' }}>
          <p style={{ color: 'var(--axis-text)', fontWeight: 600, fontSize: 14, marginBottom: 12 }}>
            Votre compte ou abonnement a été désactivé par l'administrateur avec le motif suivant :
          </p>
          <div style={{ padding: 14, borderRadius: 10, background: 'var(--axis-bg)', border: '1px solid var(--axis-border)', fontStyle: 'italic', fontSize: 13, marginBottom: 20 }}>
            &quot;{alert}&quot;
          </div>
          <p style={{ fontSize: 12, color: 'var(--axis-muted)', marginBottom: 20 }}>
            Pour toute réclamation ou levée de suspension, veuillez contacter directement l'assistance officielle.
          </p>
          <a
            href="https://wa.me/+22996000000"
            target="_blank"
            rel="noreferrer"
            className="btn-primary"
            style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
          >
            Contacter le support WhatsApp
          </a>
        </div>
      </Modal>
    </div>
  );
};
