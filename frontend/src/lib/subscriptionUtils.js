export const TIERS_XOF = { 1: 1500, 2: 3000, 3: 6000, 4: 12000, 5: 18000, 6: 24000, 7: 30000 };
export const PACK_NAMES = {
  'starter-light': 'Starter Light',
  'starter-standard': 'Starter Standard',
  'starter-plus': 'Starter Plus',
  'pro-starter': 'Pro Starter',
  'pro-standard': 'Pro Standard',
  'pro-advanced': 'Pro Advanced',
  'business-light': 'Business Light',
  'business-standard': 'Business Standard',
  'business-ultimate': 'Business Ultimate',
};
export const PACK_XOF = {
  'starter-light': 1500,
  'starter-standard': 2500,
  'starter-plus': 4500,
  'pro-starter': 7500,
  'pro-standard': 12000,
  'pro-advanced': 18000,
  'business-light': 22000,
  'business-standard': 26000,
  'business-ultimate': 30000,
};
export const WA_NUMBER = '0166518473';

export const packName = (sub) =>
  sub.package_name || PACK_NAMES[sub.package_code] || `Pack ${sub.tier_number}`;

export const packPriceXof = (sub) =>
  Number(sub.price_xof || PACK_XOF[sub.package_code] || TIERS_XOF[sub.tier_number] || 0);

export const isPendingStatus = (s) => s.status === 'pending_validation' || s.status === 'pending';

export const fmtXof = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`;

export const fmtDate = (d, opts = { day: '2-digit', month: 'long', year: 'numeric' }) =>
  d ? new Date(d).toLocaleDateString('fr-FR', opts) : '—';

export const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';

export const daysRemaining = (expiresAt) =>
  expiresAt ? Math.ceil((new Date(expiresAt) - new Date()) / 86400000) : null;

// % du budget consommé
export const usagePct = (sub) => {
  const budget = Math.max(0.01, Number(sub.budget_amount_usd || 0));
  const balance = Math.max(0, Number(sub.balance_usd || 0));
  return Math.min(100, Math.max(0, ((budget - balance) / budget) * 100));
};

// % de la période écoulée (starts_at → expires_at)
export const periodPct = (sub) => {
  if (!sub.expires_at) return 0;
  const start = new Date(sub.starts_at).getTime();
  const end = new Date(sub.expires_at).getTime();
  if (!start || !end || end <= start) return 0;
  return Math.min(100, Math.max(0, ((Date.now() - start) / (end - start)) * 100));
};

// Libellés « Mes abonnements » (état du pack)
export const SUB_STATUS = {
  active:   { label: 'Actif',      badge: 'badge-green' },
  expired:  { label: 'Expiré',     badge: 'badge-gray' },
  depleted: { label: 'Épuisé',     badge: 'badge-red' },
  disabled: { label: 'Désactivé',  badge: 'badge-red' },
};

// Libellés « Historique des paiements » (état de la demande)
export const PAYMENT_STATUS = {
  pending_validation: { label: 'À valider',         badge: 'badge-yellow' },
  pending:            { label: "En file d'attente", badge: 'badge-blue' },
  active:             { label: 'Pack activé',       badge: 'badge-green' },
  expired:            { label: 'Terminé',           badge: 'badge-gray' },
  depleted:           { label: 'Terminé',           badge: 'badge-gray' },
  disabled:           { label: 'Annulé',            badge: 'badge-red' },
};
