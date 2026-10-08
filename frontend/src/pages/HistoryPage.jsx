import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabase';
import { useToast } from '../components/Toast';
import { Modal } from '../components/Modal';
import {
  Clock, Shield, RefreshCw, MessageCircle,
  CreditCard, Sparkles, ArrowRight, Hourglass, Zap, Key, Layers, Wallet, CalendarDays
} from 'lucide-react';

const WA_NUMBER   = '0166518473';

const calculateDaysRemaining = (expiresAt) => {
  if (!expiresAt) return null;
  const diffMs = new Date(expiresAt) - new Date();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

export const HistoryPage = ({ initialTab = 'subscriptions' }) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const focusedSubId = searchParams.get('focus');
  const [subscriptions, setSubscriptions] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);
  const subCardRefs = useRef({});
  const [selectedSub, setSelectedSub] = useState(null);
  const [modCode, setModCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const addToast = useToast();

  useEffect(() => {
    if (profile) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subRes, keyRes] = await Promise.all([
        supabase.from('subscriptions').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }),
        supabase.from('api_keys').select('id, name, key_prefix, subscription_id, is_enabled').eq('user_id', profile.id)
      ]);

      if (subRes.error) {
        if (subRes.error.message?.includes('recursion')) setSubscriptions([]);
        else throw subRes.error;
      }
      if (keyRes.error) console.warn('api_keys select error:', keyRes.error);

      const subs = subRes.data || [];
      setSubscriptions(subs);
      setApiKeys(keyRes.data || []);

      // Si on arrive avec un focus sur un abonnement précis, on ouvre le bon onglet
      const focusedSub = subs.find(s => s.id === focusedSubId);
      if (focusedSub) {
        setActiveTab(isPendingStatus(focusedSub) ? 'payments' : 'subscriptions');
      }

    } catch (e) {
      console.error(e);
      addToast(e.message || 'Erreur lors du chargement des abonnements', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkModerator = async (e) => {
    e.preventDefault();
    if (!modCode.trim() || !selectedSub) return;
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('axis_moderator_validate_subscription_by_code', {
        p_subscription_id: selectedSub.id,
        p_moderator_code: modCode.trim().toUpperCase()
      });
      if (error || !data?.success) {
        addToast(error?.message || data?.error_message || 'Code modérateur invalide ou introuvable', 'error');
      } else {
        addToast('Demande validée avec succès par le modérateur !', 'success');
        setSelectedSub(null);
        setModCode('');
        fetchData();
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clé API liée à un abonnement (via api_keys.subscription_id)
  const keyForSub = (subId) => apiKeys.find(k => k.subscription_id === subId);

  const isPendingStatus = (s) => s.status === 'pending_validation' || s.status === 'pending';

  const pendingSubs = subscriptions.filter(isPendingStatus);
  const otherSubs = subscriptions.filter(s => !isPendingStatus(s));
  const subsToShow = activeTab === 'subscriptions' ? otherSubs : pendingSubs;

  // Scroll + mise en évidence de l'abonnement pointé via ?focus=<id>
  useEffect(() => {
    if (!loading && focusedSubId && subCardRefs.current[focusedSubId]) {
      subCardRefs.current[focusedSubId].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, focusedSubId, activeTab]);

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: 'var(--axis-accent-dim)', marginBottom: 8 }}>
            <Sparkles size={13} color="var(--axis-accent)" />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--axis-accent)' }}>GESTIONNAIRE CENTRALISÉ</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Mes packs & paiements</h1>
          <p style={{ color: 'var(--axis-textMuted)', fontSize: 13, marginTop: 2 }}>
            Suivez vos crédits, leur consommation et la validation de vos paiements.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={fetchData} className="btn-ghost" style={{ padding: '8px 14px', fontSize: 12 }}>
            <RefreshCw size={14} /> Actualiser
          </button>
          <Link to="/dashboard/subscriptions" className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }}>
            <CreditCard size={14} /> Souscrire un nouveau pack
          </Link>
        </div>
      </div>

      {/* Onglets séparés : Abonnements / Historique des paiements */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
        {[
          { id: 'subscriptions', label: 'Mes Abonnements', icon: Layers, count: otherSubs.length },
          { id: 'payments', label: 'Historique des Paiements', icon: Wallet, count: pendingSubs.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); navigate(tab.id === 'subscriptions' ? '/dashboard/history' : '/dashboard/payments'); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12,
              fontSize: 13, fontWeight: 600, transition: 'all 0.2s ease', cursor: 'pointer',
              background: activeTab === tab.id ? 'var(--axis-hover)' : 'transparent',
              color: activeTab === tab.id ? '#fff' : 'var(--axis-textMuted)',
              border: '1px solid var(--axis-border)',
            }}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.count > 0 && (
              <span style={{ background: activeTab === tab.id ? 'var(--axis-accent)' : 'var(--axis-border)', color: activeTab === tab.id ? '#000' : 'var(--axis-muted)', borderRadius: 999, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card" style={{ padding: 60, textAlign: 'center', color: 'var(--axis-muted)' }}>
          Chargement de vos abonnements...
        </div>
      ) : subsToShow.length === 0 ? (
        <div className="card" style={{ padding: 50, textAlign: 'center' }}>
          {activeTab === 'subscriptions' ? (
            <>
              <Clock size={40} color="var(--axis-muted)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Aucun pack actif</h3>
              <p style={{ color: 'var(--axis-textMuted)', fontSize: 13, marginBottom: 20 }}>
                Choisissez l’un de nos 9 packs pour créditer votre portefeuille et activer vos accès aux modèles.
              </p>
              <Link to="/dashboard/subscriptions" className="btn-primary" style={{ fontSize: 13 }}>
                Découvrir les packs <ArrowRight size={14} />
              </Link>
            </>
          ) : (
            <>
              <Wallet size={40} color="var(--axis-muted)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Aucun paiement en attente</h3>
              <p style={{ color: 'var(--axis-textMuted)', fontSize: 13, marginBottom: 20 }}>
                Vos demandes d'abonnement validées et vos paiements en cours de traitement apparaîtront ici.
              </p>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {subsToShow.map((sub) => {

            const budget = Math.max(0.01, Number(sub.budget_amount_usd || 0));
            const balance = Math.max(0, Number(sub.balance_usd || 0));
            const consumed = Math.max(0, budget - balance);
            const progressPct = Math.min(100, Math.max(0, (consumed / budget) * 100));

            const daysLeft = calculateDaysRemaining(sub.expires_at);
            const isActive = sub.status === 'active';
            const isPending = isPendingStatus(sub);
            const isExpired = sub.status === 'expired' || sub.status === 'depleted' || (daysLeft !== null && daysLeft <= 0);
            const packName = sub.package_name || `Pack ${sub.tier_number}`;

            const progressColor = progressPct >= 100 ? 'var(--axis-danger)' : progressPct >= 80 ? 'var(--axis-warning)' : 'var(--axis-accent)';
            const linkedKey = keyForSub(sub.id);

            return (
              <div
                key={sub.id}
                ref={(el) => (subCardRefs.current[sub.id] = el)}
                className="card"
                style={{
                  border: isActive ? '1px solid rgba(132,204,22,0.4)' : isPending ? '1px solid rgba(251,191,36,0.4)' : '1px solid var(--axis-border)',
                  background: isActive ? 'linear-gradient(180deg, rgba(132,204,22,0.03) 0%, var(--axis-sidebar) 100%)' : 'var(--axis-sidebar)',
                  padding: 24, position: 'relative',
                  outline: focusedSubId === sub.id ? '2px solid var(--axis-accent)' : 'none',
                  outlineOffset: -2,
                  transition: 'outline 0.3s ease'
                }}
              >
                {/* En-tête */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 46, height: 46, borderRadius: 12, background: isActive ? 'var(--axis-accent-dim)' : 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 18, color: isActive ? 'var(--axis-accent)' : 'var(--axis-textMuted)' }}>
                      P{sub.tier_number}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 800 }}>{packName}</h3>
                        <span className={`badge ${isActive ? 'badge-green' : isPending ? 'badge-yellow' : isExpired ? 'badge-red' : 'badge-gray'}`}>
                          {isActive ? 'Actif' : isPending ? 'En attente' : sub.status === 'depleted' ? 'Épuisé' : isExpired ? 'Expiré' : sub.status}
                        </span>
                      </div>
                      {sub.expires_at && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--axis-muted)', marginTop: 5 }}>
                          <CalendarDays size={13} />
                          Échéance : {new Date(sub.expires_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </div>
                      )}
                      {!sub.expires_at && (
                        <div style={{ fontSize: 12, color: 'var(--axis-muted)', marginTop: 5 }}>Crédit sans échéance</div>
                      )}
                    </div>
                  </div>

                  {/* Jours restants */}
                  <div style={{ textAlign: 'right' }}>
                    {isActive && daysLeft !== null && (
                      <div style={{ marginBottom: 4 }}>
                        {daysLeft > 7 ? (
                          <span className="badge badge-green" style={{ fontSize: 11 }}>⏱️ {daysLeft} jours restants</span>
                        ) : daysLeft > 0 ? (
                          <span className="badge badge-yellow" style={{ fontSize: 11 }}>⚠️ Expire dans {daysLeft} jour{daysLeft > 1 ? 's' : ''}</span>
                        ) : (
                          <span className="badge badge-red" style={{ fontSize: 11 }}>🚫 Expiré</span>
                        )}
                      </div>
                    )}
                    {sub.moderator_code_used && (
                      <div style={{ fontSize: 11, color: 'var(--axis-purple)', fontWeight: 600 }}>
                        • Modérateur : {sub.moderator_code_used}
                      </div>
                    )}
                  </div>
                </div>

                {/* Clé API liée */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'var(--axis-bg)', border: '1px solid var(--axis-border)', marginBottom: 14 }}>
                  <Key size={15} color={linkedKey ? 'var(--axis-accent)' : 'var(--axis-muted)'} />
                  {linkedKey ? (
                    <button
                      onClick={() => navigate(`/dashboard/keys?focus=${linkedKey.id}`)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12.5, color: 'var(--axis-text)', display: 'flex', alignItems: 'center', gap: 6, textAlign: 'left' }}
                      title="Voir la clé API associée"
                    >
                      <span style={{ fontWeight: 600 }}>Clé liée :</span>
                      <span style={{ color: 'var(--axis-accent)', fontWeight: 600, textDecoration: 'underline' }}>{linkedKey.name || linkedKey.key_prefix}</span>
                      <ArrowRight size={13} color="var(--axis-accent)" />
                    </button>
                  ) : (
                    <Link to="/dashboard/keys" style={{ fontSize: 12.5, color: 'var(--axis-textMuted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>Clé non liée — créez ou liez une clé API</span>
                      <ArrowRight size={13} />
                    </Link>
                  )}
                </div>


                {/* Barre de consommation du crédit */}
                <div style={{ background: 'var(--axis-bg)', borderRadius: 14, padding: '16px 18px', border: '1px solid var(--axis-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 12.5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Zap size={14} color="var(--axis-accent)" />
                      <span style={{ fontWeight: 600, color: 'var(--axis-text)' }}>Crédit consommé :</span>
                      <b style={{ color: progressColor }}>{progressPct.toFixed(1)}%</b>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--axis-muted)' }}>${balance.toFixed(2)} / ${budget.toFixed(2)} restants</span>
                  </div>
                  <div style={{ width: '100%', height: 10, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ width: `${progressPct}%`, height: '100%', borderRadius: 999, background: progressColor, transition: 'width 0.4s ease, background 0.3s ease', boxShadow: `0 0 10px ${progressColor}44` }} />
                  </div>
                </div>

                {/* Actions selon l'état */}
                {isPending && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, padding: '12px 16px', borderRadius: 10, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', marginTop: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Hourglass size={18} color="var(--axis-warning)" />
                      <div style={{ fontSize: 12.5, color: 'var(--axis-text)' }}>
                        <b>Paiement en attente de validation.</b> Vous avez réglé via un modérateur ou sur WhatsApp ?
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <a href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Bonjour Axis AI 👋\nJe souhaite valider mon pack ${packName} (${Number(sub.price_xof || 0).toLocaleString('fr-FR')} FCFA).`)}`} target="_blank" rel="noreferrer" className="btn-ghost" style={{ fontSize: 12, padding: '6px 12px', color: '#25D366' }}>
                        <MessageCircle size={14} /> WhatsApp Admin
                      </a>
                      <button onClick={() => { setSelectedSub(sub); setModCode(''); }} className="btn-primary" style={{ fontSize: 12, padding: '6px 14px' }}>
                        <Shield size={14} /> Saisir code MOD-XXXX
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}


      {/* Modal : Saisie code modérateur pour validation */}
      <Modal isOpen={!!selectedSub} onClose={() => setSelectedSub(null)} title="Validation par Code Modérateur">
        {selectedSub && (
          <div>
            <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--axis-bg)', border: '1px solid var(--axis-border)', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{selectedSub.package_name || `Pack ${selectedSub.tier_number}`}</span>
                <span style={{ fontWeight: 900, fontSize: 18, color: 'var(--axis-accent)' }}>{Number(selectedSub.price_xof || 0).toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--axis-muted)', marginTop: 4 }}>
                Demande du {new Date(selectedSub.created_at).toLocaleDateString('fr-FR')}
              </div>
            </div>

            <form onSubmit={handleLinkModerator}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 13 }}>
                  Saisissez l'identifiant du modérateur :
                </label>
                <input type="text" placeholder="Ex: MOD-8492" value={modCode} onChange={e => setModCode(e.target.value.toUpperCase())} className="input-field" required autoFocus />
                <p style={{ fontSize: 11, color: 'var(--axis-muted)', marginTop: 6 }}>
                  Le modérateur doit avoir validé la réception de vos fonds en amont.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setSelectedSub(null)} className="btn-ghost" style={{ flex: 1 }}>Annuler</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ flex: 2 }}>
                  {isSubmitting ? 'Validation...' : 'Valider mon pack'}
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

    </div>
  );
};
