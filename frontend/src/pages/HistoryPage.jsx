import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabase';
import { useToast } from '../components/Toast';
import { Modal } from '../components/Modal';
import {
  Clock, Shield, RefreshCw, MessageCircle, ChevronRight, AlertTriangle,
  CreditCard, Sparkles, CheckCircle2, ArrowRight, Hourglass, Zap
} from 'lucide-react';

const TIERS_NAMES = { 1: 'Starter', 2: 'Basic', 3: 'Standard', 4: 'Pro', 5: 'Expert', 6: 'Master', 7: 'Enterprise' };
const TIERS_XOF   = { 1: '1 500', 2: '3 000', 3: '6 000', 4: '12 000', 5: '18 000', 6: '24 000', 7: '30 000' };
const USD_TO_XOF  = 600;
const WA_NUMBER   = '0166518473';

const toXof = (usd) => Math.round(Number(usd || 0) * USD_TO_XOF).toLocaleString('fr-FR');

export const HistoryPage = () => {
  const { profile } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState(null);
  const [modCode, setModCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expirationAlertSub, setExpirationAlertSub] = useState(null);
  const addToast = useToast();

  useEffect(() => {
    if (profile) fetchSubscriptions();
  }, [profile]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Subscriptions select error:', error);
        if (error.message && error.message.includes('recursion')) {
          setSubscriptions([]);
          return;
        }
        throw error;
      }
      if (data) {
        setSubscriptions(data);

        // Détecter automatiquement si un abonnement actif est proche de l'expiration (<= 7 jours)
        const activeSub = data.find(s => s.status === 'active');
        if (activeSub && activeSub.expires_at) {
          const daysLeft = Math.ceil((new Date(activeSub.expires_at) - new Date()) / (1000 * 60 * 60 * 24));
          if (daysLeft <= 7) {
            // Afficher le pop-up d'alerte expiration
            setExpirationAlertSub({ ...activeSub, daysLeft });
          }
        }
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
        fetchSubscriptions();
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateDaysRemaining = (expiresAt) => {
    if (!expiresAt) return null;
    const diffMs = new Date(expiresAt) - new Date();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header avec action rapide */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: 'var(--axis-accent-dim)', marginBottom: 8 }}>
            <Sparkles size={13} color="var(--axis-accent)" />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--axis-accent)' }}>GESTIONNAIRE CENTRALISÉ</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Mes Abonnements & Consommation</h1>
          <p style={{ color: 'var(--axis-textMuted)', fontSize: 13, marginTop: 2 }}>
            Suivi en temps réel de votre solde, écoulement des modèles limités et jours restants.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={fetchSubscriptions} className="btn-ghost" style={{ padding: '8px 14px', fontSize: 12 }}>
            <RefreshCw size={14} /> Actualiser
          </button>
          <Link to="/dashboard/subscriptions" className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }}>
            <CreditCard size={14} /> Souscrire un nouveau pack
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 60, textAlign: 'center', color: 'var(--axis-muted)' }}>
          Chargement de vos abonnements...
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="card" style={{ padding: 50, textAlign: 'center' }}>
          <Clock size={40} color="var(--axis-muted)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Aucun abonnement enregistré</h3>
          <p style={{ color: 'var(--axis-textMuted)', fontSize: 13, marginBottom: 20 }}>
            Découvrez nos 7 paliers conçus pour le marché local et souscrivez dès 1 500 FCFA.
          </p>
          <Link to="/dashboard/subscriptions" className="btn-primary" style={{ fontSize: 13 }}>
            Voir le catalogue des paliers <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {subscriptions.map((sub) => {
            const budget = Math.max(0.01, Number(sub.budget_amount_usd || 0));
            const balance = Math.max(0, Number(sub.balance_usd || 0));
            const consumed = Math.max(0, budget - balance);
            const progressPct = Math.min(100, Math.max(0, (consumed / budget) * 100));

            const daysLeft = calculateDaysRemaining(sub.expires_at);
            const isActive = sub.status === 'active';
            const isPending = sub.status === 'pending_validation' || sub.status === 'pending';
            const isExpired = sub.status === 'expired' || (daysLeft !== null && daysLeft <= 0);

            // Couleur de la barre de progression selon niveau de consommation
            const progressColor = progressPct >= 100 ? 'var(--axis-danger)' : progressPct >= 80 ? 'var(--axis-warning)' : 'var(--axis-accent)';

            return (
              <div
                key={sub.id}
                className="card"
                style={{
                  border: isActive ? '1px solid rgba(132,204,22,0.4)' : isPending ? '1px solid rgba(251,191,36,0.4)' : '1px solid var(--axis-border)',
                  background: isActive ? 'linear-gradient(180deg, rgba(132,204,22,0.03) 0%, var(--axis-sidebar) 100%)' : 'var(--axis-sidebar)',
                  padding: 24, position: 'relative'
                }}
              >
                {/* Ligne 1 : En-tête de la carte */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, marginBottom: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 46, height: 46, borderRadius: 12,
                      background: isActive ? 'var(--axis-accent-dim)' : 'rgba(255,255,255,0.04)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 900, fontSize: 18, color: isActive ? 'var(--axis-accent)' : 'var(--axis-textMuted)'
                    }}>
                      P{sub.tier_number}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 800 }}>Palier {sub.tier_number} — {TIERS_NAMES[sub.tier_number] || ''}</h3>
                        <span className={`badge ${isActive ? 'badge-green' : isPending ? 'badge-yellow' : 'badge-gray'}`}>
                          {isActive ? 'Actif' : isPending ? 'En attente de validation' : isExpired ? 'Expiré' : sub.status}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--axis-muted)', marginTop: 3 }}>
                        Souscrit le {new Date(sub.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        {sub.moderator_code_used && (
                          <span style={{ marginLeft: 10, color: 'var(--axis-purple)', fontWeight: 600 }}>
                            • Modérateur : {sub.moderator_code_used}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Compteur de temps : Jours restants */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--axis-text)' }}>
                      {TIERS_XOF[sub.tier_number]} <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--axis-accent)' }}>FCFA</span>
                    </div>

                    {isActive && daysLeft !== null && (
                      <div style={{ marginTop: 4 }}>
                        {daysLeft > 7 ? (
                          <span className="badge badge-green" style={{ fontSize: 11 }}>
                            ⏱️ {daysLeft} jours restants
                          </span>
                        ) : daysLeft > 0 ? (
                          <span className="badge badge-yellow" style={{ fontSize: 11 }}>
                            ⚠️ Expire dans {daysLeft} jour{daysLeft > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="badge badge-red" style={{ fontSize: 11 }}>
                            🚫 30 jours expirés
                          </span>
                        )}
                      </div>
                    )}

                    {sub.expires_at && (
                      <div style={{ fontSize: 11, color: 'var(--axis-muted)', marginTop: 4 }}>
                        Échéance : {new Date(sub.expires_at).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Ligne 2 : Barre de progression dynamique (consommation du montant alloué) */}
                <div style={{
                  background: 'var(--axis-bg)', borderRadius: 14, padding: '16px 18px',
                  border: '1px solid var(--axis-border)', marginBottom: 14
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 12.5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Zap size={14} color="var(--axis-accent)" />
                      <span style={{ fontWeight: 600, color: 'var(--axis-text)' }}>Consommation des modèles limités :</span>
                      <b style={{ color: progressColor }}>{progressPct.toFixed(1)}%</b>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--axis-textMuted)' }}>
                      <b>${consumed.toFixed(3)}</b> dépensés sur <b>${budget.toFixed(2)}</b> alloués
                    </div>
                  </div>

                  {/* Barre visuelle */}
                  <div style={{
                    width: '100%', height: 10, borderRadius: 999, background: 'rgba(255,255,255,0.06)',
                    overflow: 'hidden', position: 'relative'
                  }}>
                    <div style={{
                      width: `${progressPct}%`, height: '100%', borderRadius: 999,
                      background: progressColor,
                      transition: 'width 0.4s ease, background 0.3s ease',
                      boxShadow: `0 0 10px ${progressColor}44`
                    }} />
                  </div>

                  {/* Métriques détaillées en dessous */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, fontSize: 12, flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ color: 'var(--axis-textMuted)' }}>
                      Solde restant : <b style={{ color: balance > 0 ? 'var(--axis-text)' : 'var(--axis-danger)' }}>${balance.toFixed(3)} USD</b> (≈ {toXof(balance)} FCFA)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="badge badge-blue" style={{ fontSize: 9, padding: '2px 7px' }}>ILLIMITÉ</span>
                      <span style={{ fontSize: 11, color: 'var(--axis-textMuted)' }}>Modèles gratuits toujours actifs à 0 FCFA</span>
                    </div>
                  </div>
                </div>

                {/* Ligne 3 : Actions spécifiques selon l'état de l'abonnement */}
                {isPending && (
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
                    padding: '12px 16px', borderRadius: 10, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Hourglass size={18} color="var(--axis-warning)" />
                      <div style={{ fontSize: 12.5, color: 'var(--axis-text)' }}>
                        <b>Paiement en attente de validation.</b> Vous avez réglé via un modérateur ou sur WhatsApp ?
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <a
                        href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Bonjour Axis AI 👋\nJe souhaite valider mon abonnement Palier ${sub.tier_number} (${TIERS_XOF[sub.tier_number]} FCFA).`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-ghost"
                        style={{ fontSize: 12, padding: '6px 12px', color: '#25D366' }}
                      >
                        <MessageCircle size={14} /> WhatsApp Admin
                      </a>
                      <button
                        onClick={() => { setSelectedSub(sub); setModCode(''); }}
                        className="btn-primary"
                        style={{ fontSize: 12, padding: '6px 14px' }}
                      >
                        <Shield size={14} /> Saisir code MOD-XXXX
                      </button>
                    </div>
                  </div>
                )}

                {isActive && daysLeft !== null && daysLeft <= 7 && (
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
                    padding: '12px 16px', borderRadius: 10, background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.25)', marginTop: 8
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <AlertTriangle size={18} color="var(--axis-danger)" />
                      <span style={{ fontSize: 12.5, color: 'var(--axis-text)' }}>
                        Votre abonnement arrive à échéance dans <b>{daysLeft} jour{daysLeft > 1 ? 's' : ''}</b>. Anticipez pour éviter l'interruption de vos clés API.
                      </span>
                    </div>
                    <Link to="/dashboard/subscriptions" className="btn-primary" style={{ fontSize: 12, padding: '6px 14px' }}>
                      Renouveler ce pack
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pop-up Modal automatique d'alerte expiration (< 7 jours) */}
      <Modal
        isOpen={!!expirationAlertSub}
        onClose={() => setExpirationAlertSub(null)}
        title="⚠️ Échéance d'Abonnement Proche"
      >
        {expirationAlertSub && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(251,191,36,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <AlertTriangle size={28} color="var(--axis-warning)" />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 800 }}>Votre forfait expire bientôt !</h3>
              <p style={{ color: 'var(--axis-textMuted)', fontSize: 13, marginTop: 4 }}>
                Votre abonnement <b>Palier {expirationAlertSub.tier_number} ({TIERS_NAMES[expirationAlertSub.tier_number]})</b> arrive à échéance dans <b>{expirationAlertSub.daysLeft} jour(s)</b>.
              </p>
            </div>

            <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--axis-bg)', border: '1px solid var(--axis-border)', marginBottom: 22, fontSize: 12.5, lineHeight: 1.6 }}>
              • À l'issue des 30 jours, vos clés API associées seront automatiquement suspendues.<br />
              • Vous pouvez renouveler ou choisir un palier supérieur dès maintenant en toute transparence.
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setExpirationAlertSub(null)} className="btn-ghost" style={{ flex: 1 }}>
                Plus tard
              </button>
              <Link
                to="/dashboard/subscriptions"
                onClick={() => setExpirationAlertSub(null)}
                className="btn-primary"
                style={{ flex: 2, textAlign: 'center', textDecoration: 'none' }}
              >
                Renouveler mon pack
              </Link>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal interactif : Saisie code modérateur pour validation */}
      <Modal
        isOpen={!!selectedSub}
        onClose={() => setSelectedSub(null)}
        title="Validation par Code Modérateur"
      >
        {selectedSub && (
          <div>
            <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--axis-bg)', border: '1px solid var(--axis-border)', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>Palier {selectedSub.tier_number} — {TIERS_NAMES[selectedSub.tier_number]}</span>
                <span style={{ fontWeight: 900, fontSize: 18, color: 'var(--axis-accent)' }}>{TIERS_XOF[selectedSub.tier_number]} FCFA</span>
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
                <input
                  type="text"
                  placeholder="Ex: MOD-8492"
                  value={modCode}
                  onChange={e => setModCode(e.target.value.toUpperCase())}
                  className="input-field"
                  required
                  autoFocus
                />
                <p style={{ fontSize: 11, color: 'var(--axis-muted)', marginTop: 6 }}>
                  Le modérateur doit avoir validé la réception de vos fonds en amont.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setSelectedSub(null)} className="btn-ghost" style={{ flex: 1 }}>
                  Annuler
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ flex: 2 }}>
                  {isSubmitting ? 'Validation...' : 'Valider mon abonnement'}
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
};
