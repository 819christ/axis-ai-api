export const TIERS_NAMES = { 1: 'Starter', 2: 'Basic', 3: 'Standard', 4: 'Pro', 5: 'Expert', 6: 'Master', 7: 'Enterprise' };
export const TIERS_XOF = { 1: 1500, 2: 3000, 3: 6000, 4: 12000, 5: 18000, 6: 24000, 7: 30000 };
export const WA_NUMBER = '0166518473';

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
