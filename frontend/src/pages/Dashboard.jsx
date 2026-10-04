import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { supabase } from '../supabase';
import { Modal } from '../components/Modal';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Clock, Zap, Shield, Key, ArrowRight, RefreshCw, Sparkles } from 'lucide-react';

export const Dashboard = () => {
  const { profile } = useAuth();
  const { subscription, loading, refresh } = useSubscription();
  const [alert, setAlert] = useState(null);
  const [usage, setUsage] = useState([]);

  useEffect(() => {
    if (profile) {
      checkAlert();
      fetchUsage();
    }
  }, [profile]);


  const checkAlert = async () => {
    try {
      const { data } = await supabase.rpc('axis_get_popup_alert', { p_user_id: profile.id });
      if (data?.has_alert) setAlert(data.message);
    } catch (e) {
      console.error('Erreur alert check:', e);
    }
  };

  const fetchUsage = async () => {
    try {
      const { data } = await supabase.from('usage_logs').select('*').order('created_at', { ascending: false }).limit(6);
      if (data) setUsage(data);
    } catch (e) {
      console.error(e);
    }
  };



  const isExpired = subscription && new Date(subscription.expires_at) < new Date();
  const isDepleted = subscription && subscription.balance_usd <= 0;
  const isDepletedBeforeExpiry = isDepleted && !isExpired;

  const renderCircularProgress = () => {
    if (!subscription) return null;
    const balance = Math.max(0, Number(subscription.balance_usd) || 0);
    const budget = Math.max(1, Number(subscription.budget_amount_usd) || 1);
    const pct = Math.min(100, Math.max(0, (balance / budget) * 100));
    const circumference = 2 * Math.PI * 45; // ~282.7
    const strokeDashoffset = circumference - (pct / 100) * circumference;

    return (
      <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto 16px' }}>
        <svg viewBox="0 0 110 110" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
          <circle cx="55" cy="55" r="45" fill="none" stroke="var(--axis-border)" strokeWidth="9" />
          <circle
            cx="55" cy="55" r="45" fill="none"
            stroke={isDepleted ? "var(--axis-danger)" : "var(--axis-accent)"}
            strokeWidth="9"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--axis-text)' }}>
            ${balance.toFixed(2)}
          </span>
          <span style={{ fontSize: 11, color: 'var(--axis-muted)' }}>
            sur ${budget.toFixed(2)}
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--axis-accent)', marginTop: 2 }}>
            {pct.toFixed(0)}% restant
          </span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 1050, margin: '0 auto' }}>
      {/* BANNIÈRE VALEUR AJOUTÉE FORTE */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderRadius: 12,
        background: 'linear-gradient(90deg, rgba(132,204,22,0.12) 0%, rgba(192,132,252,0.12) 100%)',
        border: '1px solid rgba(132,204,22,0.3)', marginBottom: 24
      }}>
        <Sparkles size={16} color="var(--axis-accent)" />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--axis-text)' }}>
          Axis AI, la toute première plateforme béninoise offrant les modèles d'IA mondiaux à des prix abordables en Francs CFA
        </span>
      </div>

      {/* Header */}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Bonjour, {profile?.pseudo || 'Utilisateur'} 👋</h1>
          <p style={{ color: 'var(--axis-textMuted)', fontSize: 13, marginTop: 2 }}>
            Tableau de bord de consommation et gestion de votre passerelle API.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={refresh} className="btn-ghost" style={{ padding: '8px 14px', fontSize: 12 }}>
            <RefreshCw size={14} /> Actualiser
          </button>
          <Link to="/dashboard/keys" className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }}>
            <Key size={15} /> Mes Clés API
          </Link>
        </div>
      </div>

      {/* Rules Banner (Cas 1 ou Cas 2) */}
      {isDepletedBeforeExpiry && (
        <div style={{
          padding: '16px 20px', borderRadius: 12, marginBottom: 24,
          background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertTriangle color="var(--axis-warning)" size={24} />
            <div>
              <b style={{ color: 'var(--axis-warning)', fontSize: 14 }}>Cas 1 : Quota de crédit épuisé ($0.00)</b>
              <p style={{ fontSize: 12, color: 'var(--axis-textMuted)', margin: 0 }}>
                Les modèles payants sont temporairement grisés. Vos modèles gratuits restent 100% actifs. Vous pouvez renouveler un pack sans attendre la fin du mois.
              </p>
            </div>
          </div>
          <Link to="/dashboard/subscriptions" className="btn-primary" style={{ fontSize: 12, padding: '8px 16px' }}>
            Renouveler maintenant
          </Link>
        </div>
      )}

      {isExpired && (
        <div style={{
          padding: '16px 20px', borderRadius: 12, marginBottom: 24,
          background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertTriangle color="var(--axis-danger)" size={24} />
            <div>
              <b style={{ color: 'var(--axis-danger)', fontSize: 14 }}>Cas 2 : Période de 30 jours expirée</b>
              <p style={{ fontSize: 12, color: 'var(--axis-textMuted)', margin: 0 }}>
                Coupure globale de l'accès aux modèles et clés API désactivées automatiquement jusqu'au réabonnement.
              </p>
            </div>
          </div>
          <Link to="/dashboard/subscriptions" className="btn-primary" style={{ fontSize: 12, padding: '8px 16px', background: 'var(--axis-danger)', color: '#fff' }}>
            Souscrire un nouveau pack
          </Link>
        </div>
      )}

      {/* Grid: Status card + Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 32 }}>
        {/* Subscription Card */}
        <div className="card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Abonnement Actuel</h2>
              {subscription && (
                <span className={`badge ${subscription.status === 'active' ? 'badge-green' : subscription.status === 'pending_validation' ? 'badge-yellow' : 'badge-red'}`}>
                  {subscription.status}
                </span>
              )}
            </div>

            {loading ? (
              <div style={{ padding: 40, color: 'var(--axis-muted)' }}>Chargement du solde...</div>
            ) : subscription ? (
              <>
                {renderCircularProgress()}
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--axis-text)', marginBottom: 2 }}>
                  Palier {subscription.tier_number}
                </div>
                <div style={{ fontSize: 12, color: 'var(--axis-textMuted)', marginBottom: 14 }}>
                  Expire le {new Date(subscription.expires_at).toLocaleDateString()}
                </div>
              </>
            ) : (
              <div style={{ padding: '30px 10px' }}>
                <p style={{ color: 'var(--axis-muted)', fontSize: 14, marginBottom: 16 }}>Aucun abonnement actif.</p>
                <Link to="/dashboard/subscriptions" className="btn-primary" style={{ fontSize: 13 }}>
                  Activer un pack
                </Link>
              </div>
            )}
          </div>

          {subscription && (
            <Link to="/dashboard/subscriptions" className="btn-ghost" style={{ fontSize: 12, width: '100%', justifyContent: 'center' }}>
              Changer de palier <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {/* Quick Usage Card */}
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Dernières requêtes proxy</h2>
          {usage.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {usage.map(u => (
                <div key={u.id || Math.random()} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 10px', borderRadius: 8, background: 'var(--axis-bg)', border: '1px solid var(--axis-border)', fontSize: 12
                }}>
                  <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <div style={{ fontWeight: 600, color: 'var(--axis-text)' }}>{u.model_id}</div>
                    <div style={{ fontSize: 11, color: 'var(--axis-muted)' }}>{new Date(u.created_at).toLocaleTimeString()}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, color: u.is_free ? 'var(--axis-accent)' : 'var(--axis-text)' }}>
                      {u.is_free ? 'GRATUIT' : `$${Number(u.cost_usd || 0).toFixed(5)}`}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--axis-muted)' }}>{u.total_tokens || (u.input_tokens + u.output_tokens)} tokens</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--axis-muted)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
              Aucune requête effectuée pour l'instant. Configurez votre clé API dans votre IDE.
            </p>
          )}
        </div>
      </div>

      {/* Lien vers la page Historique dédiée */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px' }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>Historique des Abonnements & Paiements</h2>
          <p style={{ fontSize: 12, color: 'var(--axis-textMuted)', margin: 0 }}>Retrouvez toutes vos souscriptions et liez un code modérateur à vos demandes en attente.</p>
        </div>
        <Link to="/dashboard/history" className="btn-ghost" style={{ fontSize: 13, padding: '8px 18px', flexShrink: 0 }}>
          Voir l'historique <ArrowRight size={14} />
        </Link>
      </div>


      {/* Mandatory Admin Suspension Modal */}
      <Modal isOpen={!!alert} isDanger title="⚠️ Suspension Administrative">
        <div style={{ padding: '10px 0 20px' }}>
          <p style={{ color: 'var(--axis-danger)', fontWeight: 600, fontSize: 14, marginBottom: 12 }}>
            Votre compte ou abonnement a été désactivé par l'administrateur avec le motif suivant :
          </p>
          <div style={{ padding: 14, borderRadius: 10, background: 'var(--axis-bg)', border: '1px solid var(--axis-border)', fontStyle: 'italic', fontSize: 13, marginBottom: 20 }}>
            "{alert}"
          </div>
          <p style={{ fontSize: 12, color: 'var(--axis-muted)', marginBottom: 20 }}>
            Pour toute réclamation ou levée de suspension, veuillez contacter directement l'assistance officielle.
          </p>
          <a
            href="https://wa.me/+22996000000"
            target="_blank"
            rel="noreferrer"
            className="btn-primary"
            style={{ display: 'block', textAlign: 'center', textDecoration: 'none', background: 'var(--axis-accent)' }}
          >
            Contacter le support WhatsApp
          </a>
        </div>
      </Modal>
    </div>
  );
};
