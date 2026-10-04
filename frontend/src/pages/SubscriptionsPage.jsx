import { useState, useMemo } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { useToast } from '../components/Toast';
import { Modal } from '../components/Modal';
import { ChevronDown, ChevronUp, Search, Shield, MessageCircle, Sparkles, CheckCircle2 } from 'lucide-react';

const TIERS = [
  { id: 1, name: 'Starter', priceXof: '1 500', priceUsd: 2.50, budgetUsd: 2.50, maxCost: 5.00, desc: 'Modèles gratuits & ultra-légers (Llama 3.3 Free, Gemini Flash Free)' },
  { id: 2, name: 'Basic', priceXof: '3 000', priceUsd: 5.00, budgetUsd: 5.00, maxCost: 10.00, desc: 'Modèles rapides du quotidien (GPT-4o Mini, Gemini 2.0 Flash, Mistral Small)' },
  { id: 3, name: 'Standard', priceXof: '6 000', priceUsd: 10.00, budgetUsd: 10.00, maxCost: 15.00, desc: 'Polyvalent & coding (DeepSeek V3, Claude 3 Haiku, Qwen 2.5 Coder)' },
  { id: 4, name: 'Pro', priceXof: '12 000', priceUsd: 20.00, budgetUsd: 20.00, maxCost: 20.00, desc: 'Modèles de pointe pour développeurs exigeants (Claude 3.5 Sonnet, GPT-4o)', popular: true },
  { id: 5, name: 'Expert', priceXof: '18 000', priceUsd: 30.00, budgetUsd: 30.00, maxCost: 25.00, desc: 'Haute performance et contexte étendu pour applications intensives' },
  { id: 6, name: 'Master', priceXof: '24 000', priceUsd: 40.00, budgetUsd: 40.00, maxCost: 30.00, desc: 'Modèles de raisonnement avancé et logique lourde (DeepSeek R1, OpenAI o1-mini)' },
  { id: 7, name: 'Enterprise', priceXof: '30 000', priceUsd: 50.00, budgetUsd: 50.00, maxCost: 35.00, desc: 'Accès illimité sans restriction aux plus gros modèles mondiaux' },
];

const KNOWN_MODELS = [
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free)', costPerMillion: 0.00, power: 'low' },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash Exp (Free)', costPerMillion: 0.00, power: 'low' },
  { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', costPerMillion: 0.50, power: 'low' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', costPerMillion: 0.75, power: 'low' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3 Chat', costPerMillion: 0.42, power: 'medium' },
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', costPerMillion: 1.50, power: 'medium' },
  { id: 'mistralai/mistral-small', name: 'Mistral Small', costPerMillion: 0.80, power: 'medium' },
  { id: 'qwen/qwen-2.5-coder-32b-instruct', name: 'Qwen 2.5 Coder 32B', costPerMillion: 0.23, power: 'high' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', costPerMillion: 12.50, power: 'high' },
  { id: 'google/gemini-pro-1.5', name: 'Gemini 1.5 Pro', costPerMillion: 6.25, power: 'high' },
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1 Reasoning', costPerMillion: 2.74, power: 'ultra' },
  { id: 'openai/o1-mini', name: 'OpenAI o1 Mini', costPerMillion: 15.00, power: 'ultra' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', costPerMillion: 18.00, power: 'ultra' },
];

export const SubscriptionsPage = () => {
  const { subscription, subscribe, refresh } = useSubscription();
  const [selectedTier, setSelectedTier] = useState(null);
  const [modCode, setModCode] = useState('');
  const [paymentOption, setPaymentOption] = useState('admin');
  const [expandedTier, setExpandedTier] = useState(null);
  const [modelSearch, setModelSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const addToast = useToast();

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!selectedTier) return;
    setIsSubmitting(true);
    
    try {
      const code = paymentOption === 'mod' ? modCode.trim() : null;
      const { data, error } = await subscribe(selectedTier.id, code);
      if (error) {
        addToast(error.message || 'Erreur lors de la souscription', 'error');
      } else if (data && !data.success) {
        addToast(data.error_message || 'Souscription rejetée', 'error');
      } else {
        addToast('Demande enregistrée ! Votre clé sera activée dès validation du paiement.', 'success');
        setSelectedTier(null);
        setModCode('');
        refresh();
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredModels = useMemo(() => {
    if (!modelSearch) return KNOWN_MODELS;
    const q = modelSearch.toLowerCase();
    return KNOWN_MODELS.filter(m => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q));
  }, [modelSearch]);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* BANNIÈRE VALEUR AJOUTÉE FORTE */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', borderRadius: 12,
        background: 'linear-gradient(90deg, rgba(132,204,22,0.12) 0%, rgba(192,132,252,0.12) 100%)',
        border: '1px solid rgba(132,204,22,0.3)', marginBottom: 28
      }}>
        <Sparkles size={18} color="var(--axis-accent)" />
        <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--axis-text)' }}>
          Axis AI, la toute première plateforme béninoise offrant les modèles d'IA mondiaux à des prix abordables en Francs CFA
        </span>
      </div>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Les 7 Paliers d'Abonnement en Francs CFA (XOF)</h1>
        <p style={{ color: 'var(--axis-textMuted)', fontSize: 13 }}>
          De <b>1 500 FCFA à 30 000 FCFA</b> pour 30 jours calendaires. Validez votre paiement par Mobile Money ou via votre modérateur local.
        </p>
      </div>
      
      {/* 7 Tiers Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 20, marginBottom: 44 }}>
        {TIERS.map(tier => {
          const isCurrent = subscription?.tier_number === tier.id && subscription?.status === 'active';
          const isPending = subscription?.tier_number === tier.id && subscription?.status === 'pending_validation';
          const isExpanded = expandedTier === tier.id;
          const accessibleModels = KNOWN_MODELS.filter(m => m.costPerMillion <= tier.maxCost);

          return (
            <div key={tier.id} className="card card-hover" style={{ 
              border: isCurrent ? '2px solid var(--axis-accent)' : isPending ? '2px solid var(--axis-warning)' : tier.popular ? '2px solid rgba(132,204,22,0.4)' : '1px solid var(--axis-border)',
              display: 'flex', flexDirection: 'column', position: 'relative'
            }}>
              {isCurrent && (
                <span className="badge badge-green" style={{ position: 'absolute', top: -12, right: 16 }}>
                  Pack Actif
                </span>
              )}
              {isPending && (
                <span className="badge badge-yellow" style={{ position: 'absolute', top: -12, right: 16 }}>
                  En attente validation
                </span>
              )}
              {tier.popular && !isCurrent && !isPending && (
                <span className="badge badge-purple" style={{ position: 'absolute', top: -12, right: 16 }}>
                  Populaire
                </span>
              )}

              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <h3 style={{ fontSize: 20, fontWeight: 700 }}>Palier {tier.id}</h3>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--axis-accent)' }}>{tier.name}</span>
                </div>

                {/* Prix XOF grand format */}
                <div style={{ fontSize: 32, fontWeight: 900, marginTop: 4, color: 'var(--axis-text)' }}>
                  {tier.priceXof} <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--axis-accent)' }}>FCFA</span>
                </div>
                <div style={{ color: 'var(--axis-textMuted)', fontSize: 12 }}>
                  ≈ ${tier.priceUsd.toFixed(2)} USD / 30 jours
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--axis-border)', paddingTop: 12, marginBottom: 16, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--axis-textMuted)' }}>Budget alloué :</span>
                  <b>${tier.budgetUsd.toFixed(2)} USD</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--axis-textMuted)' }}>Plafond modèle :</span>
                  <b style={{ color: 'var(--axis-accent)' }}>≤ ${tier.maxCost.toFixed(2)}/1M tokens</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--axis-textMuted)' }}>Modèles compatibles :</span>
                  <b>{accessibleModels.length} modèles</b>
                </div>
              </div>

              {/* Accordion Modèles Inclus */}
              <div style={{ borderTop: '1px solid var(--axis-border)', paddingTop: 10, marginBottom: 16 }}>
                <button
                  type="button"
                  onClick={() => setExpandedTier(isExpanded ? null : tier.id)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', fontSize: 12, fontWeight: 600, color: 'var(--axis-text)' }}
                >
                  <span>Modèles inclus ({accessibleModels.length})</span>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {isExpanded && (
                  <div style={{ marginTop: 10, background: 'var(--axis-bg)', borderRadius: 10, padding: 10, maxHeight: 180, overflowY: 'auto' }}>
                    <div style={{ position: 'relative', marginBottom: 8 }}>
                      <input
                        type="text"
                        placeholder="Rechercher (Claude, GPT, DeepSeek...)"
                        value={modelSearch}
                        onChange={e => setModelSearch(e.target.value)}
                        className="input-field"
                        style={{ fontSize: 11, padding: '6px 8px 6px 26px' }}
                      />
                      <Search size={12} style={{ position: 'absolute', left: 8, top: 9, color: 'var(--axis-muted)' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {filteredModels.map(m => {
                        const isAllowed = m.costPerMillion <= tier.maxCost;
                        return (
                          <div key={m.id} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            fontSize: 11, padding: '4px 6px', borderRadius: 6,
                            background: isAllowed ? 'rgba(132,204,22,0.05)' : 'rgba(255,255,255,0.02)',
                            opacity: isAllowed ? 1 : 0.4
                          }}>
                            <span style={{ fontWeight: isAllowed ? 600 : 400 }}>{m.name}</span>
                            <span style={{ color: isAllowed ? 'var(--axis-accent)' : 'var(--axis-danger)', fontSize: 10 }}>
                              {isAllowed ? `≤ $${m.costPerMillion.toFixed(2)}` : 'Exclu'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setSelectedTier(tier)} 
                className={isCurrent ? "btn-ghost" : "btn-primary"} 
                disabled={isCurrent}
                style={{ width: '100%', opacity: isCurrent ? 0.6 : 1 }}
              >
                {isCurrent ? 'Pack Actif' : isPending ? 'Demande en cours' : `Souscrire (${tier.priceXof} FCFA)`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Payment / Validation Modal */}
      <Modal isOpen={!!selectedTier} onClose={() => setSelectedTier(null)} title="Finaliser votre souscription">
        {selectedTier && (
          <form onSubmit={handleSubscribe}>
            <div style={{ background: 'var(--axis-bg)', padding: 18, borderRadius: 12, marginBottom: 20, border: '1px solid var(--axis-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>Palier {selectedTier.id} — {selectedTier.name}</span>
                <span style={{ fontWeight: 900, fontSize: 22, color: 'var(--axis-accent)' }}>{selectedTier.priceXof} FCFA</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--axis-textMuted)', fontSize: 12 }}>
                <span>Équivalent USD</span>
                <span>${selectedTier.priceUsd.toFixed(2)} USD</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--axis-textMuted)', fontSize: 12, marginTop: 4 }}>
                <span>Budget utilisable</span>
                <span>${selectedTier.budgetUsd.toFixed(2)} USD pendant 30 jours</span>
              </div>
            </div>

            {/* Note liaison automatique */}
            <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(132,204,22,0.06)', border: '1px solid rgba(132,204,22,0.2)', marginBottom: 20, fontSize: 12, color: 'var(--axis-text)' }}>
              🔗 <b>Liaison Clé API :</b> Dès la validation de ce paiement, votre clé API sera automatiquement rattachée à ce pack et activée pour utilisation immédiate.
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 13 }}>Canal de paiement</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                <button
                  type="button"
                  onClick={() => setPaymentOption('admin')}
                  className="btn-ghost"
                  style={{
                    borderColor: paymentOption === 'admin' ? 'var(--axis-accent)' : 'var(--axis-border)',
                    background: paymentOption === 'admin' ? 'var(--axis-accent-dim)' : 'transparent',
                    fontSize: 13, padding: '10px 12px'
                  }}
                >
                  <MessageCircle size={16} color="#25D366" /> Option A : Admin (WhatsApp)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentOption('mod')}
                  className="btn-ghost"
                  style={{
                    borderColor: paymentOption === 'mod' ? 'var(--axis-accent)' : 'var(--axis-border)',
                    background: paymentOption === 'mod' ? 'var(--axis-accent-dim)' : 'transparent',
                    fontSize: 13, padding: '10px 12px'
                  }}
                >
                  <Shield size={16} color="var(--axis-purple)" /> Option B : Modérateur
                </button>
              </div>

              {paymentOption === 'admin' ? (
                <div style={{ padding: 14, borderRadius: 10, background: 'var(--axis-bg)', border: '1px solid var(--axis-border)', fontSize: 12.5, lineHeight: 1.5 }}>
                  <p style={{ marginBottom: 10 }}>
                    1. Envoyez <b>{selectedTier.priceXof} FCFA</b> par Mobile Money au <b>+229 96 00 00 00</b>.<br />
                    2. Cliquez ci-dessous pour transmettre la capture du transfert sur WhatsApp.
                  </p>
                  <a
                    href={`https://wa.me/+22996000000?text=${encodeURIComponent(`Bonjour Axis AI, je viens d'effectuer le transfert de ${selectedTier.priceXof} FCFA pour activer le Palier ${selectedTier.id} (${selectedTier.name}). Voici ma preuve de paiement.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', background: '#25D366', color: '#fff', textDecoration: 'none' }}
                  >
                    <MessageCircle size={18} /> Envoyer la preuve ({selectedTier.priceXof} FCFA)
                  </a>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 12, color: 'var(--axis-textMuted)' }}>
                    Entrez l'identifiant MOD-XXXX fourni par votre modérateur de terrain :
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: MOD-7777"
                    value={modCode}
                    onChange={e => setModCode(e.target.value.toUpperCase())}
                    className="input-field"
                    required
                  />
                  <span style={{ fontSize: 11, color: 'var(--axis-muted)' }}>
                    Dès que votre modérateur confirme la réception des {selectedTier.priceXof} FCFA, votre clé s'active instantanément.
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setSelectedTier(null)} className="btn-ghost" style={{ flex: 1 }}>
                Annuler
              </button>
              <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ flex: 2 }}>
                {isSubmitting ? 'Enregistrement...' : 'Confirmer ma souscription'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
