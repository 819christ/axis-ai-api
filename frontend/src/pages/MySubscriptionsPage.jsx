import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  RefreshCw, CreditCard, Layers, Key, ArrowRight,
  Zap, Hourglass,
} from 'lucide-react';
import { useMySubscriptions } from '../hooks/useMySubscriptions';
import {
  SUB_STATUS, isPendingStatus, usagePct, fmtDate, packName,
} from '../lib/subscriptionUtils';

const usageColor = (p) => (p >= 100 ? 'var(--axis-danger)' : p >= 80 ? 'var(--axis-warning)' : 'var(--axis-accent)');

const Meter = ({ icon: Icon, label, value, pct, color, hint }) => (
  <div style={{ background: 'var(--axis-bg)', border: '1px solid var(--axis-border)', borderRadius: 14, padding: '14px 16px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 12.5 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
        <Icon size={14} color={color} /> {label} <b style={{ color }}>{value}</b>
      </span>
      {hint && <span style={{ fontSize: 11, color: 'var(--axis-muted)' }}>{hint}</span>}
    </div>
    <div style={{ height: 10, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: color, transition: 'width .4s ease' }} />
    </div>
  </div>
);

const Stat = ({ label, value, color }) => (
  <div className="card" style={{ padding: '16px 18px', background: 'var(--axis-sidebar)' }}>
    <div style={{ fontSize: 11.5, color: 'var(--axis-muted)', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 800, color: color || 'var(--axis-text)' }}>{value}</div>
  </div>
);

export const MySubscriptionsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const focusedSubId = searchParams.get('focus');
  const { subscriptions, loading, refresh, keyForSub } = useMySubscriptions();

  // Un lien ?focus=<id> vers une demande en attente relève de la page Paiements
  useEffect(() => {
    const focused = subscriptions.find((s) => s.id === focusedSubId);
    if (focused && isPendingStatus(focused)) navigate(`/dashboard/payments?focus=${focused.id}`, { replace: true });
  }, [subscriptions, focusedSubId, navigate]);

  const pendingCount = subscriptions.filter(isPendingStatus).length;
  const current = subscriptions.filter((s) => s.status === 'active');
  const past = subscriptions.filter((s) => !isPendingStatus(s) && s.status !== 'active');
  const main = current[0];

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', paddingBottom: 60 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Mes abonnements</h1>
          <p style={{ color: 'var(--axis-textMuted)', fontSize: 13, marginTop: 2 }}>
            Suivez votre crédit pay-as-you-go et les clés associées à vos packs.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={refresh} className="btn-ghost" style={{ padding: '8px 14px', fontSize: 12 }}>
            <RefreshCw size={14} /> Actualiser
          </button>
          <Link to="/dashboard/subscriptions" className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }}>
            <CreditCard size={14} /> Souscrire un nouveau pack
          </Link>
        </div>
      </div>

      {pendingCount > 0 && (
        <Link to="/dashboard/payments" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.3)', marginBottom: 20, color: 'var(--axis-text)', fontSize: 13 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Hourglass size={18} color="var(--axis-warning)" />
              <span><b>{pendingCount} demande{pendingCount > 1 ? 's' : ''}</b> en attente de validation ou d'activation.</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--axis-warning)', fontWeight: 600 }}>
              Voir l'historique des paiements <ArrowRight size={14} />
            </span>
          </div>
        </Link>
      )}

      {loading ? (
        <div className="card" style={{ padding: 60, textAlign: 'center', color: 'var(--axis-muted)' }}>Chargement de vos abonnements...</div>
      ) : subscriptions.filter((s) => !isPendingStatus(s)).length === 0 ? (
        <div className="card" style={{ padding: 50, textAlign: 'center' }}>
          <Layers size={40} color="var(--axis-muted)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Aucun abonnement actif</h3>
          <p style={{ color: 'var(--axis-textMuted)', fontSize: 13, marginBottom: 20 }}>
            Choisissez un pack parmi nos 9 offres. Le crédit reste disponible sans échéance et s’utilise jusqu’à épuisement.
          </p>
          <Link to="/dashboard/subscriptions" className="btn-primary" style={{ fontSize: 13 }}>Découvrir les paliers <ArrowRight size={14} /></Link>
        </div>
      ) : (
        <>
          {main && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 22 }}>
              <Stat label="Pack actif" value={packName(main)} color="var(--axis-accent)" />
              <Stat label="Crédit disponible" value={`$${Number(main.balance_usd || 0).toFixed(2)}`} />
              <Stat label="Crédit consommé" value={`${usagePct(main).toFixed(1)} %`} color={usageColor(usagePct(main))} />
            </div>
          )}

          {current.map((sub) => {
            const usage = usagePct(sub);
            const linked = keyForSub(sub.id);
            return (
              <div key={sub.id} className="card" style={{ padding: 24, marginBottom: 18, border: '1px solid rgba(132,204,22,0.4)', background: 'linear-gradient(180deg, rgba(132,204,22,0.03) 0%, var(--axis-sidebar) 100%)', outline: focusedSubId === sub.id ? '2px solid var(--axis-accent)' : 'none', outlineOffset: -2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--axis-accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 18, color: 'var(--axis-accent)' }}>P{sub.tier_number}</div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 800 }}>{packName(sub)}</h3>
                        <span className="badge badge-green">Actif</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--axis-muted)', marginTop: 5 }}>
                        <span>Activé le {fmtDate(sub.starts_at)} · sans échéance</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 14 }}>
                  <Meter icon={Zap} label="Crédit consommé :" value={`${usage.toFixed(1)} %`} pct={usage} color={usageColor(usage)} hint={`$${Number(sub.consumed_usd || 0).toFixed(4)} utilisés`} />
                  <Meter icon={CreditCard} label="Crédit restant :" value={`$${Number(sub.balance_usd || 0).toFixed(4)}`} pct={100 - usage} color={usageColor(usage)} hint="Rechargez à tout moment" />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'var(--axis-bg)', border: '1px solid var(--axis-border)' }}>
                  <Key size={15} color={linked ? 'var(--axis-accent)' : 'var(--axis-muted)'} />
                  {linked ? (
                    <button onClick={() => navigate(`/dashboard/keys?focus=${linked.id}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12.5, color: 'var(--axis-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 600 }}>Clé liée :</span>
                      <span style={{ color: 'var(--axis-accent)', fontWeight: 600, textDecoration: 'underline' }}>{linked.name || linked.key_prefix}</span>
                      <ArrowRight size={13} color="var(--axis-accent)" />
                    </button>
                  ) : (
                    <Link to="/dashboard/keys" style={{ fontSize: 12.5, color: 'var(--axis-textMuted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      Clé non liée — créez ou liez une clé API <ArrowRight size={13} />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}

          {past.length > 0 && (
            <>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: '26px 0 12px' }}>Abonnements terminés</h2>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="ax-table">
                  <thead>
                    <tr><th>Pack</th><th>Période</th><th>Consommation finale</th><th>Statut</th><th style={{ textAlign: 'right' }}>Action</th></tr>
                  </thead>
                  <tbody>
                    {past.map((sub) => {
                      const st = SUB_STATUS[sub.status] || { label: sub.status, badge: 'badge-gray' };
                      return (
                        <tr key={sub.id} style={focusedSubId === sub.id ? { background: 'var(--axis-hover)' } : undefined}>
                          <td style={{ fontWeight: 700 }}>{packName(sub)}</td>
                          <td style={{ fontSize: 12.5, color: 'var(--axis-textMuted)' }}>Activé le {fmtDate(sub.starts_at, { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td style={{ fontWeight: 600 }}>{usagePct(sub).toFixed(1)} %</td>
                          <td><span className={`badge ${st.badge}`} title={sub.disabled_reason || undefined}>{st.label}</span></td>
                          <td style={{ textAlign: 'right' }}>
                            <Link to="/dashboard/subscriptions" className="btn-ghost" style={{ fontSize: 12, padding: '5px 12px' }}>Choisir un pack</Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

    </div>
  );
};