import { useState, useMemo } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { useToast } from '../components/Toast';
import { Modal } from '../components/Modal';
import { ChevronDown, ChevronUp, Search, Check, Shield, MessageCircle, AlertCircle } from 'lucide-react';

const TIERS = [
  { id: 1, name: 'Starter', price: 10, budget: 10, maxCost: 5.00, desc: 'Modèles gratuits et ultra-économiques (max 5$/1M)' },
  { id: 2, name: 'Basic', price: 25, budget: 25, maxCost: 10.00, desc: 'Modèles légers et polyvalents (max 10$/1M)' },
  { id: 3, name: 'Standard', price: 50, budget: 50, maxCost: 15.00, desc: 'Modèles standards type GPT-4o Mini, DeepSeek (max 15$/1M)' },
  { id: 4, name: 'Pro', price: 100, budget: 100, maxCost: 20.00, desc: 'Modèles de pointe type Claude 3.5 Sonnet (max 20$/1M)', popular: true },
  { id: 5, name: 'Expert', price: 200, budget: 200, maxCost: 25.00, desc: 'Modèles haute performance intensifs (max 25$/1M)' },
  { id: 6, name: 'Master', price: 350, budget: 350, maxCost: 30.00, desc: 'Modèles de raisonnement lourd (DeepSeek R1, o1-mini) (max 30$/1M)' },
  { id: 7, name: 'Enterprise', price: 500, budget: 500, maxCost: 35.00, desc: 'Accès illimité sans restriction (max 35$/1M)' },
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
        addToast('Demande enregistrée ! Statut : pending_validation.', 'success');
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
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Catalogue des Paliers & Abonnements</h1>
        <p style={{ color: 'var(--axis-textMuted)', fontSize: 14 }}>
          Sélectionnez un pack selon vos besoins en modèles d'IA. Formule mathématique : <code>MaxAllowedCost(Pᵢ) = 5.00$ × i</code>
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
                  Pack Actuel
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

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <h3 style={{ fontSize: 20, fontWeight: 700 }}>Palier {tier.id}</h3>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--axis-accent)' }}>{tier.name}</span>
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, marginTop: 4 }}>
                  ${tier.price} <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--axis-muted)' }}>/ mois</span>
                </div>
                <div style={{ color: 'var(--axis-textMuted)', fontSize: 13 }}>
                  ≈ {(tier.price * 600).toLocaleString('fr-FR')} XOF
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--axis-border)', paddingTop: 14, marginBottom: 18, fontSize: 12.5, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--axis-textMuted)' }}>Solde initial :</span>
                  <b>${tier.budget}.00 USD</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--axis-textMuted)' }}>Plafond modèle :</span>
                  <b style={{ color: 'var(--axis-accent)' }}>≤ ${tier.maxCost.toFixed(2)}/1M tokens</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--axis-textMuted)' }}>Modèles inclus :</span>
                  <b>{accessibleModels.length} modèles</b>
                </div>
              </div>

              {/* Accordion Modèles Inclus */}
              <div style={{ borderTop: '1px solid var(--axis-border)', paddingTop: 12, marginBottom: 16 }}>
                <button
                  type="button"
                  onClick={() => setExpandedTier(isExpanded ? null : tier.id)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', fontSize: 12, fontWeight: 600, color: 'var(--axis-text)' }}
                >
                  <span>Voir les modèles autorisés ({accessibleModels.length})</span>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {isExpanded && (
                  <div style={{ marginTop: 10, background: 'var(--axis-bg)', borderRadius: 10, padding: 10, maxHeight: 180, overflowY: 'auto' }}>
                    <div style={{ position: 'relative', marginBottom: 8 }}>
                      <input
                        type="text"
                        placeholder="Rechercher un modèle..."
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
                {isCurrent ? 'Pack Actif' : isPending ? 'Demande en cours' : 'Souscrire'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Payment / Validation Modal */}
      <Modal isOpen={!!selectedTier} onClose={() => setSelectedTier(null)} title="Validation de la souscription">
        {selectedTier && (
          <form onSubmit={handleSubscribe}>
            <div style={{ background: 'var(--axis-bg)', padding: 18, borderRadius: 12, marginBottom: 20, border: '1px solid var(--axis-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontWeight: 600 }}>Palier {selectedTier.id} — {selectedTier.name}</span>
                <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--axis-accent)' }}>${selectedTier.price}.00 USD</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--axis-textMuted)', fontSize: 13 }}>
                <span>Montant en XOF (CFA)</span>
                <span>≈ {(selectedTier.price * 600).toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--axis-textMuted)', fontSize: 12, marginTop: 4 }}>
                <span>Enveloppe utilisable</span>
                <span>${selectedTier.budget}.00 USD pendant 30 jours</span>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 13 }}>Canal de validation</label>
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
                  <MessageCircle size={16} color="#25D366" /> Option A : Admin
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
                    1. Effectuez le virement Mobile Money au <b>+229 96 00 00 00</b> (Admin Officiel).<br />
                    2. Cliquez sur le bouton ci-dessous pour envoyer la capture d'écran sur WhatsApp.
                  </p>
                  <a
                    href={`https://wa.me/+22996000000?text=${encodeURIComponent(`Bonjour Axis AI, je viens de payer pour le Palier ${selectedTier.id} (${selectedTier.name} - $${selectedTier.price}). Voici ma preuve de paiement.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', background: '#25D366', color: '#fff', textDecoration: 'none' }}
                  >
                    <MessageCircle size={18} /> Envoyer la preuve sur WhatsApp
                  </a>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 12, color: 'var(--axis-textMuted)' }}>
                    Entrez l'identifiant MOD-XXXX fourni par votre modérateur de proximité :
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: MOD-7777"
                    value={modCode}
                    onChange={e => setModCode(e.target.value.toUpperCase())}
                    className="input-field"
                    required
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" onClick={() => setSelectedTier(null)} className="btn-ghost" style={{ flex: 1 }}>
                Annuler
              </button>
              <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ flex: 2 }}>
                {isSubmitting ? 'Enregistrement...' : 'Confirmer la souscription'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
