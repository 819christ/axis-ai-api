import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowDown, ArrowRight, Check, ChevronDown, ChevronUp, CircleDollarSign,
  Cpu, Key, MessageCircle, Search, Shield, Sparkles, Wallet, Zap,
} from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { useApiKeys } from '../hooks/useApiKeys';
import { useToast } from '../components/Toast';
import { Modal } from '../components/Modal';
import { supabase } from '../supabase';

const WA_NUMBER = '0166518473';
const MODEL_COST_PER_TOKEN = (model) =>
  Number(model.input_cost_per_token || 0) + Number(model.output_cost_per_token || 0);

const formatXof = (amount) => `${Number(amount).toLocaleString('fr-FR')} FCFA`;
const formatUsd = (amount) => `$${Number(amount).toFixed(2)} USD`;
const estimatedTokens = (credit, model) => {
  const cost = MODEL_COST_PER_TOKEN(model);
  return cost > 0 ? Math.floor(Number(credit) / cost) : null;
};

const tierForModel = (models, model) => {
  if (models.length <= 1) return 'low';
  const index = models.findIndex((item) => item.id === model.id);
  const position = index / (models.length - 1);
  if (position < 1 / 3) return 'low';
  if (position < 2 / 3) return 'medium';
  return 'high';
};

const POWER_LABELS = { low: 'Low · économique', medium: 'Medium · équilibré', high: 'High · puissant' };
const FAMILIES = [
  {
    id: 1,
    name: 'Étudiant & Découverte',
    subtitle: 'Petits workflows et complétion',
    description: 'Pour rédiger, résumer, traduire et tester de petits scripts.',
    color: 'var(--axis-accent)',
  },
  {
    id: 2,
    name: 'Pro & Automatisation',
    subtitle: 'Workflows et agents simples',
    description: 'Pour coder, automatiser et construire des mini-agents.',
    color: 'var(--axis-purple)',
  },
  {
    id: 3,
    name: 'Entreprise & Scale',
    subtitle: 'Production intensive',
    description: 'Pour les agents soutenus et les requêtes complexes.',
    color: '#60a5fa',
  },
];

function PackCard({ pack, models, loading, onBuy, isExpanded, onToggle }) {
  const [query, setQuery] = useState('');
  const eligibleModels = useMemo(() => {
    const maxCostPerMillion = Number(pack.credit_usd) / 40;
    return models
      .filter((model) => {
        const price = MODEL_COST_PER_TOKEN(model);
        return price > 0 && price * 1_000_000 <= maxCostPerMillion;
      })
      .sort((a, b) => MODEL_COST_PER_TOKEN(a) - MODEL_COST_PER_TOKEN(b));
  }, [models, pack.credit_usd]);

  const testModels = useMemo(
    () => models.filter((model) => MODEL_COST_PER_TOKEN(model) === 0),
    [models],
  );
  const filteredModels = useMemo(() => {
    const search = query.trim().toLowerCase();
    return search
      ? eligibleModels.filter((model) =>
          `${model.name} ${model.id}`.toLowerCase().includes(search),
        )
      : eligibleModels;
  }, [eligibleModels, query]);
  const powerCounts = eligibleModels.reduce((counts, model) => {
    const power = tierForModel(eligibleModels, model);
    counts[power] += 1;
    return counts;
  }, { low: 0, medium: 0, high: 0 });

  return (
    <article className="card card-hover" style={{
      display: 'flex',
      flexDirection: 'column',
      borderTop: `3px solid ${FAMILIES[pack.tier_number - 1]?.color || 'var(--axis-accent)'}`,
      minWidth: 0,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
        <div>
          <span className="badge badge-gray" style={{ marginBottom: 8 }}>
            PACK {String(pack.sort_order).padStart(2, '0')}
          </span>
          <h3 style={{ fontSize: 18, fontWeight: 800 }}>{pack.name}</h3>
        </div>
        <Sparkles size={19} color={FAMILIES[pack.tier_number - 1]?.color || 'var(--axis-accent)'} />
      </div>

      <p style={{ minHeight: 40, marginTop: 8, color: 'var(--axis-textMuted)', fontSize: 12.5, lineHeight: 1.6 }}>
        {pack.description}
      </p>

      <div style={{
        display: 'flex', alignItems: 'end', justifyContent: 'space-between',
        gap: 8, padding: '16px 0', marginTop: 8,
        borderTop: '1px solid var(--axis-border)', borderBottom: '1px solid var(--axis-border)',
      }}>
        <div>
          <div style={{ fontSize: 25, fontWeight: 900 }}>{formatXof(pack.price_xof)}</div>
          <div style={{ fontSize: 11, color: 'var(--axis-muted)' }}>Paiement unique · sans expiration</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end', color: 'var(--axis-accent)', fontSize: 14, fontWeight: 800 }}>
            <Wallet size={15} /> {formatUsd(pack.credit_usd)}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--axis-muted)' }}>crédit après validation</div>
        </div>
      </div>

      <div style={{ margin: '14px 0', padding: '11px 12px', borderRadius: 10, background: 'var(--axis-bg)', fontSize: 11.5 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ color: 'var(--axis-textMuted)' }}>Modèles payants compatibles</span>
          <b>{loading ? '…' : eligibleModels.length}</b>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 9 }}>
          {(['low', 'medium', 'high']).map((power) => (
            <span key={power} className="badge badge-gray" style={{ fontSize: 9, padding: '3px 7px' }}>
              {power.toUpperCase()} {loading ? '…' : powerCounts[power]}
            </span>
          ))}
        </div>
        <div style={{ color: 'var(--axis-muted)', marginTop: 8, lineHeight: 1.5 }}>
          Sélectionnés si le crédit permet au moins 40 M de tokens combinés entrée + sortie.
        </div>
      </div>

      <button type="button" onClick={onToggle} className="btn-ghost" style={{ justifyContent: 'space-between', padding: '9px 12px', fontSize: 12 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <Cpu size={14} color="var(--axis-accent)" />
          Catalogue dynamique
        </span>
        {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>

      {isExpanded && (
        <div className="ax-fade-in" style={{ marginTop: 10, padding: 10, borderRadius: 10, background: 'var(--axis-bg)', border: '1px solid var(--axis-border)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Search size={14} color="var(--axis-muted)" />
            <input
              className="input-field"
              aria-label={`Rechercher un modèle dans ${pack.name}`}
              placeholder="Rechercher un modèle..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              style={{ padding: '7px 9px', fontSize: 11.5 }}
            />
          </label>
          <div style={{ maxHeight: 210, overflowY: 'auto', marginTop: 8 }}>
            {loading ? (
              <p style={{ padding: 12, color: 'var(--axis-muted)', fontSize: 12 }}>Chargement du catalogue…</p>
            ) : filteredModels.length === 0 ? (
              <p style={{ padding: 12, color: 'var(--axis-muted)', fontSize: 12 }}>Aucun modèle payant ne répond au seuil de ce pack.</p>
            ) : filteredModels.map((model) => {
              const costPerMillion = MODEL_COST_PER_TOKEN(model) * 1_000_000;
              const tokenEstimate = estimatedTokens(pack.credit_usd, model);
              return (
                <div key={model.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '8px 4px', borderBottom: '1px solid var(--axis-border)' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{model.name || model.id}</div>
                    <div style={{ fontSize: 9.5, color: 'var(--axis-muted)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{model.id}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span className="badge badge-gray" style={{ fontSize: 8, padding: '2px 6px' }}>{POWER_LABELS[tierForModel(eligibleModels, model)]}</span>
                    <div style={{ marginTop: 3, color: 'var(--axis-muted)', fontSize: 9.5 }}>
                      ${costPerMillion.toFixed(4)}/M · ~{(tokenEstimate / 1_000_000).toFixed(1)} M tokens
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {testModels.length > 0 && (
            <div style={{ padding: '10px 8px 2px', marginTop: 8, borderTop: '1px solid var(--axis-border)', fontSize: 10.5, lineHeight: 1.5 }}>
              <b style={{ color: 'var(--axis-warning)' }}>Modèles de test · instables</b>
              <span style={{ color: 'var(--axis-muted)' }}> — {testModels.length} modèle(s), sans débit de crédit Axis ; disponibilité et quotas soumis au fournisseur.</span>
            </div>
          )}
        </div>
      )}

      <button type="button" className="btn-primary" onClick={onBuy} style={{ width: '100%', marginTop: 16 }}>
        Choisir ce pack <ArrowRight size={15} />
      </button>
    </article>
  );
}

export const SubscriptionsPage = () => {
  const { subscribe, refresh } = useSubscription();
  const { keys, linkKeyToSubscription } = useApiKeys();
  const [packs, setPacks] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [expandedPack, setExpandedPack] = useState(null);
  const [selectedPack, setSelectedPack] = useState(null);
  const [paymentChoice, setPaymentChoice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const addToast = useToast();
  const [targetKeyId, setTargetKeyId] = useState(
    location.state?.targetKeyId || new URLSearchParams(location.search).get('key') || null,
  );
  const targetKey = keys.find((key) => key.id === targetKeyId);

  useEffect(() => {
    let cancelled = false;
    const loadCatalog = async () => {
      setLoading(true);
      setCatalogError('');
      const [packResult, modelResult] = await Promise.all([
        supabase.from('subscription_packs').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('models').select('id, name, input_cost_per_token, output_cost_per_token').eq('is_active', true),
      ]);
      if (cancelled) return;
      const error = packResult.error || modelResult.error;
      if (error) {
        setCatalogError(error.message || 'Impossible de charger le catalogue des packs.');
      } else {
        setPacks(packResult.data || []);
        setModels(modelResult.data || []);
      }
      setLoading(false);
    };
    loadCatalog();
    return () => { cancelled = true; };
  }, []);

  const familyGroups = useMemo(
    () => FAMILIES.map((family) => ({
      ...family,
      packs: packs.filter((pack) => Number(pack.tier_number) === family.id),
    })),
    [packs],
  );

  const submitPackRequest = async () => {
    if (!selectedPack || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { data, error } = await subscribe(selectedPack.code);
      if (error) {
        addToast(error.message || 'Impossible de créer la demande de pack.', 'error');
        return;
      }

      if (targetKeyId && data?.subscription_id) {
        const { error: linkError } = await linkKeyToSubscription(targetKeyId, data.subscription_id);
        if (linkError) {
          addToast(`Demande créée, mais la clé n’a pas pu être associée : ${linkError.message}`, 'warning');
        } else {
          addToast('Demande créée et liée à votre clé API.', 'success');
        }
      } else {
        addToast('Demande créée. Le crédit sera disponible après validation du paiement.', 'success');
      }

      await refresh();
      if (paymentChoice === 'whatsapp') {
        const keyInfo = targetKey ? `\n• Clé API : ${targetKey.name} (${targetKey.key_prefix})` : '';
        const message = encodeURIComponent(
          `Bonjour Axis AI 👋\n\nJe souhaite régler une demande de pack :\n• ${selectedPack.name} — ${selectedPack.family_name}\n• Montant : ${formatXof(selectedPack.price_xof)}\n• Crédit après validation : ${formatUsd(selectedPack.credit_usd)}${keyInfo}\n\nMerci de m'indiquer les coordonnées de paiement Mobile Money.`,
        );
        window.open(`https://wa.me/${WA_NUMBER}?text=${message}`, '_blank', 'noopener,noreferrer');
      }

      setSelectedPack(null);
      setPaymentChoice(null);
      setTargetKeyId(null);
      navigate('/dashboard/payments');
    } catch (error) {
      addToast(error.message || 'Erreur inattendue lors de la création du pack.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', paddingBottom: 50 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '15px 18px', borderRadius: 14, background: 'linear-gradient(90deg, rgba(132,204,22,0.12), rgba(192,132,252,0.1))', border: '1px solid var(--axis-border)', marginBottom: 24 }}>
        <CircleDollarSign size={19} color="var(--axis-accent)" />
        <div style={{ fontSize: 12.5, lineHeight: 1.5 }}>
          <b>Pay-as-you-go :</b> achetez du crédit USD, utilisez-le sans échéance, puis rechargez lorsque votre solde est épuisé.
        </div>
      </div>

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 27, fontWeight: 850 }}>Choisissez votre pack</h1>
          <p style={{ color: 'var(--axis-textMuted)', fontSize: 13, marginTop: 5 }}>
            3 familles, 9 packs. Chaque pack crédite votre portefeuille après validation du paiement.
          </p>
        </div>
        <Link to="/dashboard/payments" className="btn-ghost" style={{ fontSize: 12.5, padding: '8px 13px' }}>
          <Wallet size={15} /> Mes demandes
        </Link>
      </header>

      {targetKey && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, background: 'var(--axis-accent-dim)', border: '1px solid var(--axis-border)', marginBottom: 22, fontSize: 12.5 }}>
          <Key size={17} color="var(--axis-accent)" />
          <span style={{ flex: 1 }}>Pack associé à <b>{targetKey.name}</b> ({targetKey.key_prefix}) après validation.</span>
          <button type="button" className="btn-icon" aria-label="Désélectionner la clé" onClick={() => setTargetKeyId(null)}>×</button>
        </div>
      )}

      {catalogError && (
        <div role="alert" style={{ marginBottom: 20, padding: 14, borderRadius: 12, color: 'var(--axis-danger)', background: 'rgba(248,113,113,0.08)', border: '1px solid var(--axis-danger)', fontSize: 13 }}>
          Catalogue indisponible : {catalogError}
        </div>
      )}

      {loading ? (
        <div className="card" style={{ padding: 44, textAlign: 'center', color: 'var(--axis-muted)' }}>
          Chargement des packs et du catalogue de modèles…
        </div>
      ) : !catalogError && packs.length === 0 ? (
        <div className="card" style={{ padding: 44, textAlign: 'center' }}>
          <Wallet size={32} color="var(--axis-muted)" style={{ margin: '0 auto 12px' }} />
          <b>Aucun pack disponible pour le moment.</b>
        </div>
      ) : !catalogError && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {familyGroups.map((family) => (
            <section key={family.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 13 }}>
                <span style={{ width: 34, height: 34, display: 'grid', placeItems: 'center', borderRadius: 10, background: 'var(--axis-hover)', color: family.color, fontWeight: 900 }}>
                  0{family.id}
                </span>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 750 }}>{family.name}</h2>
                  <p style={{ fontSize: 11.5, color: 'var(--axis-muted)' }}>{family.subtitle} — {family.description}</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 285px), 1fr))', gap: 14 }}>
                {family.packs.map((pack) => (
                  <PackCard
                    key={pack.code}
                    pack={pack}
                    models={models}
                    loading={loading}
                    onBuy={() => { setSelectedPack(pack); setPaymentChoice(null); }}
                    isExpanded={expandedPack === pack.code}
                    onToggle={() => setExpandedPack((current) => current === pack.code ? null : pack.code)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 24, padding: 15, borderRadius: 12, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', fontSize: 11.5, color: 'var(--axis-textMuted)', lineHeight: 1.55 }}>
        <Zap size={16} color="var(--axis-warning)" style={{ flexShrink: 0, marginTop: 1 }} />
        <span>Les modèles payants sont débités selon leur consommation réelle. Les modèles à tarif nul sont indiqués comme <b>modèles de test</b> : ils ne débitent pas le crédit Axis, mais restent instables et soumis aux quotas du fournisseur. Les frais CUMP ne sont pas encore inclus dans ce calcul.</span>
      </div>

      <Modal isOpen={Boolean(selectedPack) && !paymentChoice} onClose={() => setSelectedPack(null)} title="Choisir le mode de paiement">
        {selectedPack && (
          <div>
            <div style={{ padding: 15, borderRadius: 12, background: 'var(--axis-bg)', border: '1px solid var(--axis-border)', marginBottom: 18 }}>
              <div style={{ fontWeight: 750 }}>{selectedPack.name} <span style={{ color: 'var(--axis-muted)', fontWeight: 500 }}>· {selectedPack.family_name}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 9, fontSize: 13 }}>
                <span>{formatXof(selectedPack.price_xof)}</span>
                <b style={{ color: 'var(--axis-accent)' }}>{formatUsd(selectedPack.credit_usd)} de crédit</b>
              </div>
              <div style={{ marginTop: 7, fontSize: 11, color: 'var(--axis-muted)' }}>Crédit sans expiration, utilisable après validation.</div>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              <button type="button" className="btn-ghost" onClick={() => setPaymentChoice('whatsapp')} style={{ justifyContent: 'flex-start', padding: 14, borderRadius: 12, textAlign: 'left' }}>
                <MessageCircle size={19} color="#25D366" />
                <span><b>Contacter l’administrateur</b><small style={{ display: 'block', color: 'var(--axis-muted)', marginTop: 3 }}>Demande enregistrée, puis règlement Mobile Money sur WhatsApp.</small></span>
              </button>
              <button type="button" className="btn-ghost" onClick={() => setPaymentChoice('moderator')} style={{ justifyContent: 'flex-start', padding: 14, borderRadius: 12, textAlign: 'left' }}>
                <Shield size={19} color="var(--axis-purple)" />
                <span><b>Régler auprès d’un modérateur</b><small style={{ display: 'block', color: 'var(--axis-muted)', marginTop: 3 }}>Après paiement, saisissez son code dans l’historique des demandes.</small></span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={Boolean(selectedPack) && Boolean(paymentChoice)} onClose={() => { setSelectedPack(null); setPaymentChoice(null); }} title={paymentChoice === 'whatsapp' ? 'Demande de paiement administrateur' : 'Demande de paiement modérateur'}>
        {selectedPack && (
          <div>
            <div style={{ padding: 15, borderRadius: 12, background: 'var(--axis-bg)', border: '1px solid var(--axis-border)', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontWeight: 700 }}>
                <span>{selectedPack.name}</span><span>{formatXof(selectedPack.price_xof)}</span>
              </div>
              <div style={{ marginTop: 5, fontSize: 12, color: 'var(--axis-accent)' }}>{formatUsd(selectedPack.credit_usd)} crédit à l’activation</div>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--axis-textMuted)', lineHeight: 1.6, marginBottom: 18 }}>
              La demande sera créée sans échéance. Le crédit sera ajouté et la clé liée sera activée après confirmation du paiement.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn-ghost" onClick={() => setPaymentChoice(null)} style={{ flex: 1 }}>
                <ArrowDown size={14} /> Retour
              </button>
              <button type="button" className="btn-primary" onClick={submitPackRequest} disabled={isSubmitting} style={{ flex: 2 }}>
                {isSubmitting ? 'Création…' : <><Check size={15} /> Créer la demande</>}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
