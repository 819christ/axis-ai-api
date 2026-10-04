import { useState, useEffect, useMemo } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { useToast } from '../components/Toast';
import { Modal } from '../components/Modal';
import { ChevronDown, ChevronUp, Shield, MessageCircle, Sparkles, Search, Cpu, Check, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TIERS = [
  { id: 1, name: 'Starter',    priceXof: '1 500',  priceUsd: 2.50,  maxCost: 5.00  },
  { id: 2, name: 'Basic',      priceXof: '3 000',  priceUsd: 5.00,  maxCost: 10.00 },
  { id: 3, name: 'Standard',   priceXof: '6 000',  priceUsd: 10.00, maxCost: 15.00 },
  { id: 4, name: 'Pro',        priceXof: '12 000', priceUsd: 20.00, maxCost: 20.00, popular: true },
  { id: 5, name: 'Expert',     priceXof: '18 000', priceUsd: 30.00, maxCost: 25.00 },
  { id: 6, name: 'Master',     priceXof: '24 000', priceUsd: 40.00, maxCost: 30.00 },
  { id: 7, name: 'Enterprise', priceXof: '30 000', priceUsd: 50.00, maxCost: 35.00 },
];

const WA_NUMBER = '0166518473';

// Récupère les modèles OpenRouter et les classe gratuits/payants selon le plafond du palier
async function fetchOpenRouterModels() {
  const res = await fetch('https://openrouter.ai/api/v1/models');
  if (!res.ok) throw new Error('Requête OpenRouter échouée');
  const json = await res.json();
  return json.data || [];
}

function TierCard({ tier, subscription, onSubscribe, openRouterModels, modelsLoading }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'unlimited' | 'limited'

  const { freeModels, paidModels } = useMemo(() => {
    const free = [], paid = [];
    for (const m of openRouterModels) {
      const inp = parseFloat(m.pricing?.prompt || 0) * 1_000_000;
      const out = parseFloat(m.pricing?.completion || 0) * 1_000_000;
      const combined = inp + out;
      if (combined > tier.maxCost) continue;
      if (combined === 0) free.push(m);
      else paid.push(m);
    }
    return { freeModels: free, paidModels: paid };
  }, [openRouterModels, tier.maxCost]);

  // Modèles filtrés selon recherche et mode (tous / illimités / limités)
  const filteredList = useMemo(() => {
    let list = [];
    if (filterMode === 'all') {
      list = [...freeModels.map(m => ({ ...m, isUnlimited: true })), ...paidModels.map(m => ({ ...m, isUnlimited: false }))];
    } else if (filterMode === 'unlimited') {
      list = freeModels.map(m => ({ ...m, isUnlimited: true }));
    } else {
      list = paidModels.map(m => ({ ...m, isUnlimited: false }));
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(m => (m.name || '').toLowerCase().includes(q) || (m.id || '').toLowerCase().includes(q));
  }, [freeModels, paidModels, filterMode, searchQuery]);

  const totalModels = paidModels.length + freeModels.length;
  const isCurrent = subscription?.tier_number === tier.id && subscription?.status === 'active';
  const isPending = subscription?.tier_number === tier.id && subscription?.status === 'pending_validation';

  return (
    <div className="card card-hover" style={{
      border: isCurrent ? '2px solid var(--axis-accent)' : isPending ? '2px solid var(--axis-warning)' : tier.popular ? '2px solid rgba(132,204,22,0.4)' : '1px solid var(--axis-border)',
      display: 'flex', flexDirection: 'column', position: 'relative'
    }}>
      {isCurrent  && <span className="badge badge-green"  style={{ position: 'absolute', top: -12, right: 16 }}>Pack Actif</span>}
      {isPending  && <span className="badge badge-yellow" style={{ position: 'absolute', top: -12, right: 16 }}>En attente</span>}
      {tier.popular && !isCurrent && !isPending && <span className="badge badge-purple" style={{ position: 'absolute', top: -12, right: 16 }}>Populaire</span>}

      {/* Prix */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h3 style={{ fontSize: 20, fontWeight: 700 }}>Palier {tier.id}</h3>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--axis-accent)' }}>{tier.name}</span>
        </div>
        <div style={{ fontSize: 30, fontWeight: 900, marginTop: 4 }}>
          {tier.priceXof} <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--axis-accent)' }}>FCFA</span>
        </div>
        <div style={{ color: 'var(--axis-textMuted)', fontSize: 12 }}>Durée : 30 jours</div>
      </div>

      {/* Compteurs modèles */}
      <div style={{ borderTop: '1px solid var(--axis-border)', paddingTop: 12, marginBottom: 14, fontSize: 12.5, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {modelsLoading ? (
          <div style={{ color: 'var(--axis-muted)' }}>Calcul des modèles...</div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--axis-textMuted)' }}>Modèles disponibles dans ce palier :</span>
              <b style={{ color: 'var(--axis-text)' }}>{totalModels} modèle{totalModels > 1 ? 's' : ''}</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--axis-textMuted)' }}>Modèles limités :</span>
              <b style={{ color: 'var(--axis-text)' }}>{paidModels.length}</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--axis-textMuted)' }}>Modèles illimités :</span>
              <b style={{ color: '#60a5fa' }}>{freeModels.length}</b>
            </div>
          </>
        )}
      </div>

      {/* Accordion zone stylisée des modèles */}
      <div style={{ borderTop: '1px solid var(--axis-border)', paddingTop: 12, marginBottom: 16 }}>
        {/* Trigger button ergonomique et soigné */}
        <button
          type="button"
          onClick={() => setIsExpanded(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            width: '100%', padding: '10px 14px', borderRadius: 10,
            background: isExpanded ? 'var(--axis-hover)' : 'rgba(255,255,255,0.03)',
            border: isExpanded ? '1px solid var(--axis-accent)' : '1px solid var(--axis-border)',
            color: 'var(--axis-text)', cursor: 'pointer', transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.borderColor = 'rgba(132,204,22,0.4)'; }}
          onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.borderColor = 'var(--axis-border)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Cpu size={15} color="var(--axis-accent)" />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Modèles du palier</span>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
              background: 'rgba(255,255,255,0.06)', color: 'var(--axis-textMuted)'
            }}>
              {modelsLoading ? '...' : totalModels}
            </span>
          </div>
          {isExpanded ? <ChevronUp size={16} color="var(--axis-accent)" /> : <ChevronDown size={16} color="var(--axis-muted)" />}
        </button>

        {/* Panneau déroulant stylisé */}
        {isExpanded && (
          <div className="ax-fade-in" style={{
            marginTop: 10, background: 'var(--axis-bg)', borderRadius: 12,
            border: '1px solid var(--axis-border)', padding: 12, display: 'flex', flexDirection: 'column', gap: 10
          }}>
            {/* Barre de recherche instantanée */}
            <div style={{ position: 'relative' }}>
              <Search size={14} color="var(--axis-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Filtrer un modèle (ex: llama, deepseek...)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--axis-border)',
                  borderRadius: 8, padding: '7px 10px 7px 30px', fontSize: 12, color: 'var(--axis-text)', outline: 'none'
                }}
              />
            </div>

            {/* Filtres rapides */}
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { id: 'all', label: `Tous (${totalModels})` },
                { id: 'unlimited', label: `Illimités (${freeModels.length})` },
                { id: 'limited', label: `Limités (${paidModels.length})` },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterMode(tab.id)}
                  style={{
                    flex: 1, padding: '4px 6px', borderRadius: 6, fontSize: 10.5, fontWeight: 600,
                    background: filterMode === tab.id ? 'var(--axis-hover)' : 'transparent',
                    color: filterMode === tab.id ? '#fff' : 'var(--axis-muted)',
                    border: filterMode === tab.id ? '1px solid var(--axis-border)' : '1px solid transparent',
                    cursor: 'pointer', transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Liste scrollable propre */}
            <div style={{
              maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4,
              paddingRight: 4
            }}>
              {modelsLoading ? (
                <p style={{ color: 'var(--axis-muted)', fontSize: 12, textAlign: 'center', padding: '16px 0' }}>Chargement depuis OpenRouter...</p>
              ) : filteredList.length === 0 ? (
                <p style={{ color: 'var(--axis-muted)', fontSize: 12, textAlign: 'center', padding: '16px 0' }}>Aucun modèle correspondant</p>
              ) : (
                filteredList.map(m => (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '6px 10px', borderRadius: 8,
                      background: m.isUnlimited ? 'rgba(59,130,246,0.04)' : 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.03)',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = m.isUnlimited ? 'rgba(59,130,246,0.1)' : 'var(--axis-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = m.isUnlimited ? 'rgba(59,130,246,0.04)' : 'rgba(255,255,255,0.02)'}
                  >
                    <div style={{ minWidth: 0, flex: 1, paddingRight: 8 }}>
                      <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--axis-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.name}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--axis-muted)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.id}
                      </div>
                    </div>
                    <span className={m.isUnlimited ? 'badge badge-blue' : 'badge badge-gray'} style={{ fontSize: 9, padding: '2px 7px', flexShrink: 0 }}>
                      {m.isUnlimited ? 'ILLIMITÉ' : 'LIMITÉ'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => !isCurrent && onSubscribe(tier)}
        className={isCurrent ? "btn-ghost" : "btn-primary"}
        disabled={isCurrent}
        style={{ width: '100%', opacity: isCurrent ? 0.6 : 1, marginTop: 'auto' }}
      >
        {isCurrent ? 'Pack Actif' : isPending ? 'Demande en cours' : `Souscrire (${tier.priceXof} FCFA)`}
      </button>
    </div>
  );
}

export const SubscriptionsPage = () => {
  const { subscription, subscribe, refresh } = useSubscription();
  const [selectedTier, setSelectedTier] = useState(null);
  const [paymentChoice, setPaymentChoice] = useState(null); // null | 'whatsapp' | 'moderator'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openRouterModels, setOpenRouterModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const navigate = useNavigate();
  const addToast = useToast();

  useEffect(() => {
    fetchOpenRouterModels()
      .then(data => setOpenRouterModels(data))
      .catch(() => setOpenRouterModels([]))
      .finally(() => setModelsLoading(false));
  }, []);

  // Étape 1 : créer la souscription (pending_validation) sans code modérateur
  const handleSubscribeConfirm = async () => {
    if (!selectedTier || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { data, error } = await subscribe(selectedTier.id, null);
      if (error) {
        addToast(error.message || 'Erreur lors de la souscription', 'error');
      } else if (data && !data.success) {
        addToast(data.error_message || 'Souscription rejetée', 'error');
      } else {
        addToast('Demande créée ! Retrouvez-la dans votre historique.', 'success');
        refresh();

        if (paymentChoice === 'whatsapp') {
          const msg = encodeURIComponent(`Bonjour Axis AI 👋\n\nJe viens de soumettre une demande d'abonnement :\n• Palier ${selectedTier.id} — ${selectedTier.name}\n• Montant : ${selectedTier.priceXof} FCFA\n\nMerci de m'indiquer les coordonnées de paiement Mobile Money.`);
          window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank');
        }

        setSelectedTier(null);
        setPaymentChoice(null);
        navigate('/dashboard/history');
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Bannière */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', borderRadius: 12, background: 'linear-gradient(90deg, rgba(132,204,22,0.12) 0%, rgba(192,132,252,0.12) 100%)', border: '1px solid rgba(132,204,22,0.3)', marginBottom: 28 }}>
        <Sparkles size={16} color="var(--axis-accent)" />
        <span style={{ fontSize: 13, fontWeight: 700 }}>Axis AI — Première plateforme béninoise d'accès aux modèles d'IA mondiaux en Francs CFA</span>
      </div>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Les 7 Paliers d'Abonnement</h1>
        <p style={{ color: 'var(--axis-textMuted)', fontSize: 13 }}>
          De <b>1 500 FCFA</b> à <b>30 000 FCFA</b> pour 30 jours. Modèles listés directement depuis OpenRouter en temps réel.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 20, marginBottom: 44 }}>
        {TIERS.map(tier => (
          <TierCard
            key={tier.id}
            tier={tier}
            subscription={subscription}
            onSubscribe={t => { setSelectedTier(t); setPaymentChoice(null); }}
            openRouterModels={openRouterModels}
            modelsLoading={modelsLoading}
          />
        ))}
      </div>

      {/* Modal Étape 1 : Choix du canal */}
      <Modal isOpen={!!selectedTier && !paymentChoice} onClose={() => setSelectedTier(null)} title="Choisissez votre canal de paiement">
        {selectedTier && (
          <div>
            <div style={{ background: 'var(--axis-bg)', padding: '14px 18px', borderRadius: 12, marginBottom: 24, border: '1px solid var(--axis-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>Palier {selectedTier.id} — {selectedTier.name}</span>
                <span style={{ fontWeight: 900, fontSize: 22, color: 'var(--axis-accent)' }}>{selectedTier.priceXof} FCFA</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--axis-muted)', marginTop: 2 }}>Durée 30 jours</div>
            </div>

            <p style={{ fontSize: 13, color: 'var(--axis-textMuted)', marginBottom: 20, lineHeight: 1.5 }}>
              Comment souhaitez-vous régler ce forfait ?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                type="button"
                onClick={() => setPaymentChoice('whatsapp')}
                className="btn-ghost"
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', textAlign: 'left', borderRadius: 12 }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(37,211,102,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MessageCircle size={20} color="#25D366" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Service WhatsApp — Administrateur</div>
                  <div style={{ fontSize: 12, color: 'var(--axis-muted)', marginTop: 2 }}>Envoyez votre preuve de paiement Mobile Money et recevez confirmation sous 24h.</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentChoice('moderator')}
                className="btn-ghost"
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', textAlign: 'left', borderRadius: 12 }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(192,132,252,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Shield size={20} color="var(--axis-purple)" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Via Modérateur de Proximité</div>
                  <div style={{ fontSize: 12, color: 'var(--axis-muted)', marginTop: 2 }}>Vous avez un modérateur près de vous ? Le paiement et la validation se font rapidement, en direct.</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Étape 2 : WhatsApp — Confirmation & Redirection */}
      <Modal isOpen={!!selectedTier && paymentChoice === 'whatsapp'} onClose={() => { setSelectedTier(null); setPaymentChoice(null); }} title="Paiement via WhatsApp Administrateur">
        {selectedTier && (
          <div>
            <div style={{ background: 'var(--axis-bg)', padding: '14px 18px', borderRadius: 12, marginBottom: 20, border: '1px solid var(--axis-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700 }}>Palier {selectedTier.id} — {selectedTier.name}</span>
                <span style={{ fontWeight: 900, color: 'var(--axis-accent)' }}>{selectedTier.priceXof} FCFA</span>
              </div>
            </div>

            <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(37,211,102,0.06)', border: '1px solid rgba(37,211,102,0.2)', marginBottom: 22, fontSize: 12.5, lineHeight: 1.6 }}>
              <b style={{ color: '#25D366' }}>Comment ça marche :</b><br />
              1. Cliquez sur <b>"Confirmer et aller sur WhatsApp"</b> — votre demande sera automatiquement créée.<br />
              2. Vous serez redirigé sur WhatsApp pour contacter l'administrateur et lui envoyer votre preuve de paiement Mobile Money.<br />
              3. La validation se fait <b>sous 24h</b>.
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setPaymentChoice(null)} className="btn-ghost" style={{ flex: 1 }}>
                ← Retour
              </button>
              <button type="button" onClick={handleSubscribeConfirm} disabled={isSubmitting} className="btn-primary" style={{ flex: 2, background: '#25D366', color: '#fff' }}>
                {isSubmitting ? 'Création...' : '✓ Confirmer et aller sur WhatsApp'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Étape 2 : Modérateur — Confirmation (le code MOD sera saisi dans l'historique) */}
      <Modal isOpen={!!selectedTier && paymentChoice === 'moderator'} onClose={() => { setSelectedTier(null); setPaymentChoice(null); }} title="Paiement via Modérateur de Proximité">
        {selectedTier && (
          <div>
            <div style={{ background: 'var(--axis-bg)', padding: '14px 18px', borderRadius: 12, marginBottom: 20, border: '1px solid var(--axis-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700 }}>Palier {selectedTier.id} — {selectedTier.name}</span>
                <span style={{ fontWeight: 900, color: 'var(--axis-accent)' }}>{selectedTier.priceXof} FCFA</span>
              </div>
            </div>

            <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(192,132,252,0.06)', border: '1px solid rgba(192,132,252,0.2)', marginBottom: 22, fontSize: 12.5, lineHeight: 1.6 }}>
              <b style={{ color: 'var(--axis-purple)' }}>Comment ça marche :</b><br />
              1. Cliquez sur <b>"Confirmer la demande"</b> — votre demande est créée immédiatement.<br />
              2. Rendez-vous dans <b>Historique des Abonnements</b> — cliquez sur votre nouvelle demande.<br />
              3. Saisissez le code <b>MOD-XXXX</b> de votre modérateur pour lui soumettre la demande de validation.<br />
              4. Il valide après réception de votre paiement — <b>activation rapide</b>.
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setPaymentChoice(null)} className="btn-ghost" style={{ flex: 1 }}>
                ← Retour
              </button>
              <button type="button" onClick={handleSubscribeConfirm} disabled={isSubmitting} className="btn-primary" style={{ flex: 2 }}>
                {isSubmitting ? 'Création...' : '✓ Confirmer la demande'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
