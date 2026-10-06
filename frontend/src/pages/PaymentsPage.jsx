import { Fragment, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { RefreshCw, CreditCard, Wallet, MessageCircle, Shield, ArrowRight } from 'lucide-react';
import { supabase } from '../supabase';
import { useToast } from '../components/Toast';
import { Modal } from '../components/Modal';
import { useMySubscriptions } from '../hooks/useMySubscriptions';
import {
  TIERS_NAMES, TIERS_XOF, WA_NUMBER, PAYMENT_STATUS, fmtDate, fmtTime, fmtXof,
} from '../lib/subscriptionUtils';

const FILTERS = [
  { id: 'all',       label: 'Toutes',    test: () => true },
  { id: 'waiting',   label: 'À valider', test: (s) => s.status === 'pending_validation' },
  { id: 'validated', label: 'Validées',  test: (s) => !['pending_validation', 'disabled'].includes(s.status) },
  { id: 'cancelled', label: 'Annulées',  test: (s) => s.status === 'disabled' },
];

const STEPS = ['Demande', 'Validation', 'Activation'];
const DOT = { done: 'var(--axis-accent)', current: 'var(--axis-warning)', fail: 'var(--axis-danger)', todo: 'var(--axis-border)' };

const stepStates = (s) => {
  switch (s.status) {
    case 'pending_validation': return ['done', 'current', 'todo'];
    case 'pending':            return ['done', 'done', 'current'];
    case 'disabled':           return s.validated_at ? ['done', 'done', 'fail'] : ['done', 'fail', 'todo'];
    default:                   return ['done', 'done', 'done'];
  }
};

const Stepper = ({ sub }) => {
  const st = stepStates(sub);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
      {STEPS.map((label, i) => (
        <Fragment key={label}>
          {i > 0 && <div style={{ width: 22, height: 2, marginTop: 6, background: st[i - 1] === 'done' ? 'var(--axis-accent)' : 'var(--axis-border)' }} />}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 14, height: 14, borderRadius: '50%', background: DOT[st[i]], boxShadow: st[i] === 'current' ? '0 0 0 4px rgba(251,191,36,0.18)' : 'none' }} />
            <span style={{ fontSize: 10, color: 'var(--axis-muted)' }}>{label}</span>
          </div>
        </Fragment>
      ))}
    </div>
  );
};

const Stat = ({ label, value, color }) => (
  <div className="card" style={{ padding: '16px 18px', background: 'var(--axis-sidebar)' }}>
    <div style={{ fontSize: 11.5, color: 'var(--axis-muted)', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 800, color: color || 'var(--axis-text)' }}>{value}</div>
  </div>
);

export const PaymentsPage = () => {
  const navigate = useNavigate();
  const addToast = useToast();
  const [searchParams] = useSearchParams();
  const focusedSubId = searchParams.get('focus');
  const { subscriptions, loading, refresh, keyForSub } = useMySubscriptions();
  const [filter, setFilter] = useState('all');
  const [selectedSub, setSelectedSub] = useState(null);
  const [modCode, setModCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const rowRefs = useRef({});

  useEffect(() => {
    if (!loading && focusedSubId) rowRefs.current[focusedSubId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [loading, focusedSubId]);

  const rows = subscriptions.filter(FILTERS.find((f) => f.id === filter).test);
  const waiting = subscriptions.filter(FILTERS[1].test).length;
  const validatedTotal = subscriptions.filter(FILTERS[2].test).reduce((sum, s) => sum + (TIERS_XOF[s.tier_number] || 0), 0);

  const handleLinkModerator = async (e) => {
    e.preventDefault();
    if (!modCode.trim() || !selectedSub) return;
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('axis_moderator_validate_subscription_by_code', {
        p_subscription_id: selectedSub.id,
        p_moderator_code: modCode.trim().toUpperCase(),
      });
      if (error || !data?.success) {
        addToast(error?.message || data?.error_message || 'Code modérateur invalide ou introuvable', 'error');
      } else {
        addToast('Demande validée avec succès par le modérateur !', 'success');
        setSelectedSub(null);
        setModCode('');
        refresh();
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', paddingBottom: 60 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Historique des paiements</h1>
          <p style={{ color: 'var(--axis-textMuted)', fontSize: 13, marginTop: 2 }}>
            Toutes vos demandes d'abonnement et leur état de validation.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={refresh} className="btn-ghost" style={{ padding: '8px 14px', fontSize: 12 }}><RefreshCw size={14} /> Actualiser</button>
          <Link to="/dashboard/subscriptions" className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }}><CreditCard size={14} /> Nouvelle demande</Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 22 }}>
        <Stat label="Demandes" value={subscriptions.length} />
        <Stat label="En attente de validation" value={waiting} color={waiting ? 'var(--axis-warning)' : undefined} />
        <Stat label="Total validé" value={fmtXof(validatedTotal)} color="var(--axis-accent)" />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{ padding: '7px 14px', borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', border: '1px solid var(--axis-border)', background: filter === f.id ? 'var(--axis-hover)' : 'transparent', color: filter === f.id ? 'var(--axis-text)' : 'var(--axis-textMuted)' }}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="ax-table">
          <thead>
            <tr><th>Demande</th><th>Pack</th><th>Montant</th><th>Suivi</th><th style={{ textAlign: 'right' }}>Action</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: 32, textAlign: 'center', color: 'var(--axis-muted)' }}>Chargement de vos paiements...</td></tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: 40, textAlign: 'center' }}>
                  <Wallet size={34} color="var(--axis-muted)" style={{ margin: '0 auto 12px' }} />
                  <p style={{ color: 'var(--axis-textMuted)', fontSize: 14 }}>Aucune demande dans cette catégorie.</p>
                </td>
              </tr>
            ) : rows.map((sub) => {
              const st = PAYMENT_STATUS[sub.status] || { label: sub.status, badge: 'badge-gray' };
              const key = keyForSub(sub.id);
              return (
                <tr key={sub.id} ref={(el) => (rowRefs.current[sub.id] = el)} style={focusedSubId === sub.id ? { background: 'var(--axis-hover)' } : undefined}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{fmtDate(sub.created_at)}</div>
                    <div style={{ fontSize: 11, color: 'var(--axis-muted)' }}>{fmtTime(sub.created_at)}{sub.moderator_code_used ? ` · ${sub.moderator_code_used}` : ''}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>P{sub.tier_number} — {TIERS_NAMES[sub.tier_number]}</div>
                    <div style={{ fontSize: 11, color: 'var(--axis-muted)' }}>{key ? `Clé : ${key.name || key.key_prefix}` : 'Aucune clé liée'}</div>
                  </td>
                  <td style={{ fontWeight: 700 }}>{fmtXof(TIERS_XOF[sub.tier_number])}</td>
                  <td>
                    <div style={{ marginBottom: 8 }}><span className={`badge ${st.badge}`}>{st.label}</span></div>
                    <Stepper sub={sub} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {sub.status === 'pending_validation' ? (
                      <div style={{ display: 'inline-flex', gap: 8 }}>
                        <a href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Bonjour Axis AI 👋\nJe souhaite valider mon abonnement Palier ${sub.tier_number} (${fmtXof(TIERS_XOF[sub.tier_number])}).`)}`} target="_blank" rel="noreferrer" className="btn-ghost" style={{ fontSize: 12, padding: '6px 10px', color: '#25D366' }} title="Contacter l'admin sur WhatsApp">
                          <MessageCircle size={14} />
                        </a>
                        <button onClick={() => { setSelectedSub(sub); setModCode(''); }} className="btn-primary" style={{ fontSize: 12, padding: '6px 12px' }}>
                          <Shield size={14} /> Code MOD
                        </button>
                      </div>
                    ) : sub.status === 'pending' ? (
                      <span style={{ fontSize: 11.5, color: 'var(--axis-muted)' }}>S'activera automatiquement</span>
                    ) : sub.status === 'disabled' ? (
                      <span style={{ fontSize: 11.5, color: 'var(--axis-danger)' }}>{sub.disabled_reason || 'Désactivé'}</span>
                    ) : (
                      <button onClick={() => navigate(`/dashboard/history?focus=${sub.id}`)} className="btn-ghost" style={{ fontSize: 12, padding: '5px 12px' }}>
                        Voir le pack <ArrowRight size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!selectedSub} onClose={() => setSelectedSub(null)} title="Validation par code modérateur">
        {selectedSub && (
          <form onSubmit={handleLinkModerator}>
            <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--axis-bg)', border: '1px solid var(--axis-border)', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>Palier {selectedSub.tier_number} — {TIERS_NAMES[selectedSub.tier_number]}</span>
                <span style={{ fontWeight: 900, fontSize: 18, color: 'var(--axis-accent)' }}>{fmtXof(TIERS_XOF[selectedSub.tier_number])}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--axis-muted)', marginTop: 4 }}>Demande du {fmtDate(selectedSub.created_at)}</div>
            </div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 13 }}>Identifiant du modérateur :</label>
            <input type="text" placeholder="Ex: MOD-8492" value={modCode} onChange={(e) => setModCode(e.target.value.toUpperCase())} className="input-field" required autoFocus />
            <p style={{ fontSize: 11, color: 'var(--axis-muted)', margin: '6px 0 20px' }}>Le modérateur doit avoir confirmé la réception de vos fonds en amont.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setSelectedSub(null)} className="btn-ghost" style={{ flex: 1 }}>Annuler</button>
              <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ flex: 2 }}>{isSubmitting ? 'Validation...' : 'Valider mon abonnement'}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
