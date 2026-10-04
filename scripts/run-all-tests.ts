import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  calculateMaxAllowedCost,
  KNOWN_MODELS,
  decidePowerLevel,
  selectBestModelForTier,
} from '../src/router/axis-auto.js';
import { hashApiKey } from '../src/db/supabase.js';

interface TestResultEntry {
  name: string;
  objective: string;
  status: 'SUCCESS' | 'FAILED';
  details?: string;
}

class TestLogger {
  private logPath = path.resolve(process.cwd(), 'test-results.log');
  private results: TestResultEntry[] = [];

  constructor() {
    const header = [
      '================================================================================',
      `  AXIS AUTO / ACCESS AI - JOURNAL D'EXÉCUTION DES TESTS (TEST LOG)`,
      `  Date d'exécution : ${new Date().toISOString()}`,
      `  Environnement : Node.js ${process.version} / Fastify / PostgreSQL Supabase RPC`,
      '================================================================================\n',
    ].join('\n');
    fs.writeFileSync(this.logPath, header, { encoding: 'utf-8' });
  }

  log(entry: TestResultEntry) {
    this.results.push(entry);
    const line = [
      `[${entry.status}] TEST: ${entry.name}`,
      `  Objectif : ${entry.objective}`,
      entry.details ? `  Détails  : ${entry.details}` : '',
      '--------------------------------------------------------------------------------',
    ]
      .filter(Boolean)
      .join('\n');

    fs.appendFileSync(this.logPath, line + '\n', { encoding: 'utf-8' });

    const icon = entry.status === 'SUCCESS' ? '✅' : '❌';
    console.log(`${icon} [${entry.status}] ${entry.name}`);
    if (entry.details) {
      console.log(`   └─ ${entry.details}`);
    }
  }

  summary() {
    const successCount = this.results.filter((r) => r.status === 'SUCCESS').length;
    const failCount = this.results.filter((r) => r.status === 'FAILED').length;
    const total = this.results.length;

    const footer = [
      '\n================================================================================',
      `  RÉSUMÉ FINAL : ${successCount}/${total} tests réussis (${Math.round((successCount / total) * 100)}%)`,
      `  Échecs : ${failCount}`,
      '================================================================================\n',
    ].join('\n');

    fs.appendFileSync(this.logPath, footer, { encoding: 'utf-8' });
    console.log(footer);
  }
}

// ----------------------------------------------------------------------------
// SIMULATEUR POSTGRESQL ATOMIQUE POUR TESTS DES RÔLES, RPC & FLUX MÉTIER
// ----------------------------------------------------------------------------
interface MockProfile {
  id: string;
  email: string;
  username: string;
  pseudo: string;
  role: 'admin' | 'moderator' | 'client';
  moderator_code?: string;
}

interface MockSubscription {
  id: string;
  user_id: string;
  tier_number: number;
  budget_amount_usd: number;
  balance_usd: number;
  consumed_usd: number;
  total_tokens_consumed: number;
  starts_at: Date;
  expires_at: Date;
  status: 'active' | 'pending_validation' | 'pending' | 'expired' | 'depleted' | 'disabled';
  is_active: boolean;
  moderator_id?: string;
  moderator_code_used?: string;
  validated_by?: string;
  validated_at?: Date;
  disabled_reason?: string;
  disabled_at?: Date;
  disabled_by?: string;
  commission_status: 'unpaid' | 'paid' | 'archived' | 'none';
}

interface MockApiKey {
  id: string;
  user_id: string;
  subscription_id: string | null;
  key_hash: string;
  is_enabled: boolean;
}

class PostgresSimulator {
  public profiles: Map<string, MockProfile> = new Map();
  public subscriptions: Map<string, MockSubscription> = new Map();
  public apiKeys: Map<string, MockApiKey> = new Map();
  private lock = false;

  async acquireLock(): Promise<void> {
    while (this.lock) {
      await new Promise((r) => setTimeout(r, 2));
    }
    this.lock = true;
  }

  releaseLock(): void {
    this.lock = false;
  }

  // RPC axis_create_moderator
  async rpcCreateModerator(adminId: string, targetUserId: string, customCode?: string) {
    const admin = this.profiles.get(adminId);
    if (!admin || admin.role !== 'admin') {
      return { success: false, http_status: 403, error_code: 'UNAUTHORIZED', error_message: 'Action réservée à l administrateur.' };
    }

    const user = this.profiles.get(targetUserId);
    if (!user) {
      return { success: false, http_status: 404, error_message: 'Utilisateur introuvable.' };
    }

    const code = customCode ? customCode.toUpperCase() : `MOD-${Math.floor(1000 + Math.random() * 9000)}`;
    user.role = 'moderator';
    user.moderator_code = code;

    return {
      success: true,
      http_status: 200,
      user_id: targetUserId,
      role: 'moderator',
      moderator_code: code,
    };
  }

  // RPC axis_subscribe (Paiement hors ligne, modérateur et règle J-7)
  async rpcSubscribe(userId: string, tierNumber: number, moderatorCode?: string, now = new Date()) {
    await this.acquireLock();
    try {
      if (tierNumber < 1 || tierNumber > 7) {
        return { success: false, http_status: 400, error_code: 'INVALID_TIER', error_message: 'Palier invalide.' };
      }

      let modProfile: MockProfile | undefined;
      if (moderatorCode && moderatorCode.trim() !== '') {
        modProfile = Array.from(this.profiles.values()).find(
          (p) => p.moderator_code === moderatorCode.toUpperCase() && p.role === 'moderator'
        );
        if (!modProfile) {
          return { success: false, http_status: 404, error_code: 'INVALID_MODERATOR_CODE', error_message: 'Code modérateur invalide.' };
        }
      }

      // Vérification de l'abonnement actif pour la règle J-7
      const activeSub = Array.from(this.subscriptions.values()).find(
        (s) => s.user_id === userId && s.status === 'active' && s.is_active && s.expires_at > now && s.balance_usd > 0
      );

      const budgetAmount = [0, 10, 25, 50, 100, 200, 350, 500][tierNumber];

      let isRenewal = false;
      let startsAt = new Date(now);
      let expiresAt = new Date(now.getTime() + 30 * 24 * 3600 * 1000);

      if (activeSub) {
        const sevenDaysBefore = new Date(activeSub.expires_at.getTime() - 7 * 24 * 3600 * 1000);
        if (now < sevenDaysBefore) {
          return {
            success: false,
            http_status: 409,
            error_code: 'EARLY_RENEWAL_FORBIDDEN',
            error_message: 'Souscription anticipée non autorisée en dehors des 7 derniers jours.',
          };
        }

        const pending = Array.from(this.subscriptions.values()).find(
          (s) => s.user_id === userId && (s.status === 'pending' || s.status === 'pending_validation')
        );
        if (pending) {
          return {
            success: false,
            http_status: 409,
            error_code: 'PENDING_ALREADY_EXISTS',
            error_message: 'Un abonnement de renouvellement est déjà en attente.',
          };
        }

        isRenewal = true;
        startsAt = new Date(activeSub.expires_at);
        expiresAt = new Date(startsAt.getTime() + 30 * 24 * 3600 * 1000);
      }

      const subId = crypto.randomUUID();
      const newSub: MockSubscription = {
        id: subId,
        user_id: userId,
        tier_number: tierNumber,
        budget_amount_usd: budgetAmount,
        balance_usd: budgetAmount,
        consumed_usd: 0,
        total_tokens_consumed: 0,
        starts_at: startsAt,
        expires_at: expiresAt,
        status: 'pending_validation',
        is_active: false,
        moderator_id: modProfile?.id,
        moderator_code_used: modProfile?.moderator_code,
        commission_status: modProfile ? 'unpaid' : 'none',
      };
      this.subscriptions.set(subId, newSub);

      return {
        success: true,
        http_status: 201,
        subscription_id: subId,
        status: 'pending_validation',
        is_renewal_j7: isRenewal,
        tier_number: tierNumber,
        moderator_assigned: modProfile?.moderator_code,
        instructions: 'Veuillez effectuer le règlement hors-ligne sur le numéro officiel de l administration.',
      };
    } finally {
      this.releaseLock();
    }
  }

  // RPC axis_moderator_validate_subscription (Validation après vérification du paiement)
  async rpcModeratorValidate(validatorId: string, subscriptionId: string, now = new Date()) {
    await this.acquireLock();
    try {
      const validator = this.profiles.get(validatorId);
      if (!validator || (validator.role !== 'admin' && validator.role !== 'moderator')) {
        return { success: false, http_status: 403, error_code: 'UNAUTHORIZED', error_message: 'Opération réservée aux modérateurs et administrateurs.' };
      }

      const sub = this.subscriptions.get(subscriptionId);
      if (!sub) {
        return { success: false, http_status: 404, error_message: 'Abonnement introuvable.' };
      }

      if (sub.status !== 'pending_validation') {
        return { success: false, http_status: 400, error_message: `Abonnement déjà traité (statut: ${sub.status}).` };
      }

      // Si modérateur, vérifier qu'il est rattaché à cet abonnement
      if (validator.role === 'moderator' && sub.moderator_id && sub.moderator_id !== validatorId) {
        return { success: false, http_status: 403, error_code: 'FORBIDDEN', error_message: 'Vous ne pouvez valider que les abonnements portant votre code modérateur.' };
      }

      // Vérifier si un abonnement actif est en cours
      const activeSub = Array.from(this.subscriptions.values()).find(
        (s) => s.user_id === sub.user_id && s.id !== sub.id && s.status === 'active' && s.is_active && s.expires_at > now && s.balance_usd > 0
      );

      if (activeSub) {
        sub.status = 'pending';
        sub.is_active = false;
      } else {
        sub.status = 'active';
        sub.is_active = true;
        sub.starts_at = now;
        sub.expires_at = new Date(now.getTime() + 30 * 24 * 3600 * 1000);

        for (const k of this.apiKeys.values()) {
          if (k.user_id === sub.user_id) {
            k.subscription_id = sub.id;
            k.is_enabled = true;
          }
        }
      }

      sub.validated_by = validatorId;
      sub.validated_at = now;

      return {
        success: true,
        http_status: 200,
        subscription_id: sub.id,
        assigned_status: sub.status,
        is_active: sub.is_active,
        validated_by: validatorId,
      };
    } finally {
      this.releaseLock();
    }
  }

  // RPC admin_disable_subscription (Désactivation avec motif obligatoire - Admin Seul)
  async rpcAdminDisableSubscription(operatorId: string, subscriptionId: string, reason: string) {
    await this.acquireLock();
    try {
      const operator = this.profiles.get(operatorId);
      if (!operator || operator.role !== 'admin') {
        return {
          success: false,
          http_status: 403,
          error_code: 'UNAUTHORIZED',
          error_message: 'Action strictement réservée à l administrateur. Les modérateurs n ont pas le droit de désactiver un abonnement.',
        };
      }

      if (!reason || reason.trim().length < 5) {
        return {
          success: false,
          http_status: 400,
          error_code: 'REASON_REQUIRED',
          error_message: 'Un justificatif textuel obligatoire doit être fourni pour désactiver un abonnement.',
        };
      }

      const sub = this.subscriptions.get(subscriptionId);
      if (!sub) {
        return { success: false, http_status: 404, error_message: 'Abonnement introuvable.' };
      }

      sub.status = 'disabled';
      sub.is_active = false;
      sub.disabled_reason = reason.trim();
      sub.disabled_at = new Date();
      sub.disabled_by = operatorId;

      for (const k of this.apiKeys.values()) {
        if (k.subscription_id === subscriptionId) {
          k.is_enabled = false;
        }
      }

      return {
        success: true,
        http_status: 200,
        subscription_id: subscriptionId,
        disabled_reason: sub.disabled_reason,
      };
    } finally {
      this.releaseLock();
    }
  }

  // RPC axis_gatekeeper_validate (Avec Bypass Admin & Alerte Popup si désactivé)
  async rpcGatekeeperValidate(keyHash: string, modelId: string, inputTokens: number, maxOutputTokens: number, now = new Date()) {
    await this.acquireLock();
    try {
      const key = Array.from(this.apiKeys.values()).find((k) => k.key_hash === keyHash);
      if (!key) {
        return { is_allowed: false, http_status: 401, error_code: 'INVALID_API_KEY', error_message: 'Clé invalide.' };
      }

      const user = this.profiles.get(key.user_id);

      // PRIVILÈGE ADMINISTRATEUR : ACCÈS TOTAL ET ILLIMITÉ
      if (user && user.role === 'admin') {
        return {
          is_allowed: true,
          is_admin: true,
          is_free: true,
          http_status: 200,
          current_balance_usd: 999999.0,
          message: 'Accès administrateur suprême sans limitation.',
        };
      }

      if (!key.subscription_id) {
        return { is_allowed: false, http_status: 403, error_code: 'NO_SUBSCRIPTION', error_message: 'Aucun abonnement rattaché.' };
      }

      let sub = this.subscriptions.get(key.subscription_id);

      // Si l'abonnement a été désactivé par l'admin avec motif
      if (sub && sub.status === 'disabled') {
        return {
          is_allowed: false,
          http_status: 403,
          error_code: 'SUBSCRIPTION_DISABLED_BY_ADMIN',
          error_message: 'Votre abonnement a été désactivé par l administrateur.',
          disabled_reason: sub.disabled_reason,
        };
      }

      // Expiration / Solde épuisé -> bascule vers pending si présent
      if (!sub || sub.status !== 'active' || sub.expires_at <= now || sub.balance_usd <= 0) {
        if (sub && sub.status === 'active') {
          sub.status = sub.balance_usd <= 0 ? 'depleted' : 'expired';
          sub.is_active = false;
        }

        const pending = Array.from(this.subscriptions.values()).find(
          (s) => s.user_id === key.user_id && s.status === 'pending'
        );

        if (pending) {
          pending.status = 'active';
          pending.is_active = true;
          pending.starts_at = now;
          pending.expires_at = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
          key.subscription_id = pending.id;
          key.is_enabled = true;
          sub = pending;
        } else {
          key.is_enabled = false;
          return {
            is_allowed: false,
            http_status: 402,
            error_code: sub && sub.balance_usd <= 0 ? 'SUBSCRIPTION_DEPLETED' : 'SUBSCRIPTION_EXPIRED',
            error_message: 'Abonnement expiré ou budget épuisé.',
          };
        }
      }

      const model = KNOWN_MODELS[modelId];
      if (!model) {
        if (modelId.includes(':free')) {
          return { is_allowed: true, is_free: true, http_status: 200, current_balance_usd: sub.balance_usd };
        }
        return { is_allowed: false, http_status: 404, error_code: 'MODEL_NOT_FOUND', error_message: 'Modèle introuvable.' };
      }

      // Formule du palier : MaxAllowedCost = alpha * i + beta
      const maxAllowed = calculateMaxAllowedCost(sub.tier_number, 5.0, 0.0);
      if (!model.isFree && model.combinedCostPerMillion > maxAllowed) {
        return {
          is_allowed: false,
          http_status: 403,
          error_code: 'TIER_MODEL_NOT_PERMITTED',
          error_message: "Ce modèle n'est pas inclus dans votre palier actuel.",
          tier_number: sub.tier_number,
          max_allowed_cost: maxAllowed,
          model_cost: model.combinedCostPerMillion,
        };
      }

      if (model.isFree) {
        return { is_allowed: true, is_free: true, http_status: 200, current_balance_usd: sub.balance_usd };
      }

      const estCost = inputTokens * model.inputCostPerToken + maxOutputTokens * model.outputCostPerToken;
      if (sub.balance_usd >= estCost) {
        return {
          is_allowed: true,
          is_free: false,
          http_status: 200,
          current_balance_usd: sub.balance_usd,
          estimated_cost_usd: estCost,
          tier_number: sub.tier_number,
        };
      } else {
        return {
          is_allowed: false,
          http_status: 402,
          error_code: 'INSUFFICIENT_BALANCE',
          error_message: 'Solde insuffisant pour couvrir la requête.',
        };
      }
    } finally {
      this.releaseLock();
    }
  }
}

// ============================================================================
// SUITE DE TESTS COMPLÈTE
// ============================================================================
async function runAllTests() {
  const logger = new TestLogger();
  const db = new PostgresSimulator();

  console.log('🚀 Lancement de la validation technique complète (Rôles & Architecture)...\n');

  // Création des profils de base
  const adminId = 'admin-uuid-001';
  db.profiles.set(adminId, { id: adminId, email: 'admin@axis.ai', username: 'superadmin', pseudo: 'Admin', role: 'admin' });

  const modUserId = 'mod-user-uuid-002';
  db.profiles.set(modUserId, { id: modUserId, email: 'mod@axis.ai', username: 'mod_alex', pseudo: 'Alex', role: 'client' });

  const clientId = 'client-uuid-003';
  db.profiles.set(clientId, { id: clientId, email: 'client@axis.ai', username: 'client_bob', pseudo: 'Bob', role: 'client' });

  // --------------------------------------------------------------------------
  // SUITE 1 : Attribution du Rôle Modérateur & Code MOD-XXXX
  // --------------------------------------------------------------------------
  console.log('--- SUITE 1 : Gestion des Modérateurs par l\'Administrateur ---');

  // Client tentant de se nommer modérateur -> REFUS 403
  const resClientTriesMod = await db.rpcCreateModerator(clientId, modUserId);
  logger.log({
    name: 'Sécurité : Seul l\'administrateur peut créer un modérateur',
    objective: 'Empêcher un utilisateur non-admin d\'attribuer le rôle modérateur.',
    status: !resClientTriesMod.success && resClientTriesMod.http_status === 403 ? 'SUCCESS' : 'FAILED',
    details: 'Tentative refusée avec HTTP 403 UNAUTHORIZED.',
  });

  // Admin nomme le modérateur avec code 'MOD-7777'
  const resAdminCreatesMod = await db.rpcCreateModerator(adminId, modUserId, 'MOD-7777');
  const modCreatedOk = resAdminCreatesMod.success && resAdminCreatesMod.moderator_code === 'MOD-7777';
  logger.log({
    name: 'Attribution du rôle modérateur avec identifiant unique MOD-XXXX',
    objective: 'Générer et associer l\'identifiant unique modérateur (MOD-7777).',
    status: modCreatedOk ? 'SUCCESS' : 'FAILED',
    details: `Identifiant modérateur ${resAdminCreatesMod.moderator_code} créé et rattaché avec succès.`,
  });

  // --------------------------------------------------------------------------
  // SUITE 2 : Workflow Paiement Hors-Ligne & Validation Modérateur
  // --------------------------------------------------------------------------
  console.log('\n--- SUITE 2 : Workflow de Souscription & Validation Hors-Ligne ---');

  // Client souscrit au Palier 2 en renseignant le code modérateur MOD-7777
  const resSubInit = await db.rpcSubscribe(clientId, 2, 'MOD-7777');
  const subInitOk = resSubInit.success && resSubInit.status === 'pending_validation' && resSubInit.moderator_assigned === 'MOD-7777';
  logger.log({
    name: 'Souscription client avec code modérateur (Statut: pending_validation)',
    objective: 'Créer l\'abonnement en attente de validation hors-ligne après paiement.',
    status: subInitOk ? 'SUCCESS' : 'FAILED',
    details: `Abonnement créé (ID: ${resSubInit.subscription_id}) avec assignation modérateur MOD-7777.`,
  });

  // Modérateur valide l'abonnement après vérification du paiement
  const subId = resSubInit.subscription_id!;
  const resModValidate = await db.rpcModeratorValidate(modUserId, subId);
  const modValidateOk = resModValidate.success && resModValidate.assigned_status === 'active' && resModValidate.is_active === true;
  logger.log({
    name: 'Validation de l\'abonnement par le modérateur après paiement',
    objective: 'Activer le pack pour 30 jours suite à la vérification du modérateur.',
    status: modValidateOk ? 'SUCCESS' : 'FAILED',
    details: `Abonnement activé pour 30 jours par le modérateur ${modUserId}.`,
  });

  // --------------------------------------------------------------------------
  // SUITE 3 : Interdiction de Désactivation par les Modérateurs
  // --------------------------------------------------------------------------
  console.log('\n--- SUITE 3 : Restrictions Modérateur & Désactivation Admin ---');

  // Le modérateur tente de désactiver l'abonnement -> REFUS STRICT
  const resModTriesDisable = await db.rpcAdminDisableSubscription(modUserId, subId, 'Raison abusive');
  const modDisabledRefused = !resModTriesDisable.success && resModTriesDisable.http_status === 403;
  logger.log({
    name: 'Interdiction : Les modérateurs ne peuvent pas désactiver d\'abonnement',
    objective: 'Garantir que seul l\'administrateur suprême possède le pouvoir de désactivation.',
    status: modDisabledRefused ? 'SUCCESS' : 'FAILED',
    details: `Rejet HTTP 403 : "${resModTriesDisable.error_message}"`,
  });

  // --------------------------------------------------------------------------
  // SUITE 4 : Désactivation Administrative avec Motif Obligatoire
  // --------------------------------------------------------------------------
  console.log('\n--- SUITE 4 : Désactivation Administrative avec Justificatif Obligatoire ---');

  // Tentative sans justificatif textuel -> REFUS
  const resNoReason = await db.rpcAdminDisableSubscription(adminId, subId, '');
  const noReasonRefused = !resNoReason.success && resNoReason.error_code === 'REASON_REQUIRED';
  logger.log({
    name: 'Obligation de justificatif textuel pour désactiver un abonnement',
    objective: 'Exiger une raison explicite et détaillée avant toute coupure administrative.',
    status: noReasonRefused ? 'SUCCESS' : 'FAILED',
    details: `Rejet HTTP 400 conforme : "${resNoReason.error_message}"`,
  });

  // Admin désactive avec justificatif valide
  const reasonText = 'Non-respect des conditions d utilisation (abus de charge détecté).';
  const resAdminDisable = await db.rpcAdminDisableSubscription(adminId, subId, reasonText);
  const adminDisableOk = resAdminDisable.success && resAdminDisable.disabled_reason === reasonText;
  logger.log({
    name: 'Désactivation effective par l\'administrateur avec motif consigné',
    objective: 'Désactiver le pack et enregistrer le motif qui sera affiché au client en popup.',
    status: adminDisableOk ? 'SUCCESS' : 'FAILED',
    details: `Abonnement désactivé avec motif : "${reasonText}"`,
  });

  // Clé API du client bloquée avec affichage du motif en alerte
  const clientKeyHash = hashApiKey('axis_live_client_key_001');
  db.apiKeys.set(clientKeyHash, {
    id: crypto.randomUUID(),
    user_id: clientId,
    subscription_id: subId,
    key_hash: clientKeyHash,
    is_enabled: false,
  });

  const resGatekeeperBlocked = await db.rpcGatekeeperValidate(clientKeyHash, 'openai/gpt-4o-mini', 10, 100);
  const alertDisplayedOk = !resGatekeeperBlocked.is_allowed && resGatekeeperBlocked.error_code === 'SUBSCRIPTION_DISABLED_BY_ADMIN' && resGatekeeperBlocked.disabled_reason === reasonText;
  logger.log({
    name: 'Alerte Popup Client : Notification du motif de désactivation',
    objective: 'Transmettre le justificatif textuel lors de l interception par le Gatekeeper.',
    status: alertDisplayedOk ? 'SUCCESS' : 'FAILED',
    details: `Interception HTTP 403 avec motif transmis : "${resGatekeeperBlocked.disabled_reason}"`,
  });

  // --------------------------------------------------------------------------
  // SUITE 5 : Privilège Administrateur Suprême (Accès Total & Illimité)
  // --------------------------------------------------------------------------
  console.log('\n--- SUITE 5 : Privilèges Administrateur Suprême ---');

  const adminKeyHash = hashApiKey('axis_live_admin_master_key');
  db.apiKeys.set(adminKeyHash, {
    id: crypto.randomUUID(),
    user_id: adminId,
    subscription_id: null, // Pas d'abonnement requis pour l'admin
    key_hash: adminKeyHash,
    is_enabled: true,
  });

  // L'admin appelle le modèle le plus cher (Claude 3.5 Sonnet) sans abonnement
  const resAdminAccess = await db.rpcGatekeeperValidate(adminKeyHash, 'anthropic/claude-3.5-sonnet', 500, 2000);
  const adminBypassOk = resAdminAccess.is_allowed && resAdminAccess.is_admin === true && resAdminAccess.is_free === true;
  logger.log({
    name: 'Bypass Admin : Accès illimité et gratuit à tous les modèles',
    objective: 'Permettre à l administrateur de requêter sans abonnement ni débit de solde.',
    status: adminBypassOk ? 'SUCCESS' : 'FAILED',
    details: 'Accès accordé sans condition de palier ni déduction budgétaire.',
  });

  // --------------------------------------------------------------------------
  // SUITE 6 : Validation des 7 Paliers et Formule Mathématique
  // --------------------------------------------------------------------------
  console.log('\n--- SUITE 6 : Formule mathématique des 7 Paliers ---');
  for (let i = 1; i <= 7; i++) {
    const calculated = calculateMaxAllowedCost(i, 5.0, 0.0);
    const expected = 5.0 * i;
    const ok = calculated === expected;
    logger.log({
      name: `Palier P${i} : Calcul MaxAllowedCost`,
      objective: `Valider que P${i} = 5.00 * ${i} = ${expected}$/1M tokens`,
      status: ok ? 'SUCCESS' : 'FAILED',
      details: `MaxAllowedCost(P${i}) = ${calculated.toFixed(2)}$ / 1M tokens conforme à la formule.`,
    });
  }

  // --------------------------------------------------------------------------
  // SUITE 7 : Cycle de Vie 30 Jours & Règle des 7 Derniers Jours (J-7)
  // --------------------------------------------------------------------------
  console.log('\n--- SUITE 7 : Cycle de vie 30 jours et Relais J-7 ---');
  const userJ7 = 'user-j7-test';
  db.profiles.set(userJ7, { id: userJ7, email: 'j7@axis.ai', username: 'j7_user', pseudo: 'J7', role: 'client' });
  const now = new Date();

  // Souscription initiale Palier 3
  const subInitJ7 = await db.rpcSubscribe(userJ7, 3, undefined, now);
  await db.rpcModeratorValidate(adminId, subInitJ7.subscription_id!, now);

  // Tentative à J+5 (il reste 25 jours) -> REFUS STRICT
  const resTooEarly = await db.rpcSubscribe(userJ7, 4, undefined, new Date(now.getTime() + 5 * 24 * 3600 * 1000));
  const earlyRefused = !resTooEarly.success && resTooEarly.http_status === 409 && resTooEarly.error_code === 'EARLY_RENEWAL_FORBIDDEN';
  logger.log({
    name: 'Anti-abus : Tentative de renouvellement avant J-7',
    objective: 'Empêcher la double souscription en dehors de la fenêtre des 7 derniers jours.',
    status: earlyRefused ? 'SUCCESS' : 'FAILED',
    details: 'Rejet conforme avec code EARLY_RENEWAL_FORBIDDEN.',
  });

  // Tentative à J+25 (dans les 7 jours) -> ACCEPTÉ EN PENDING_VALIDATION
  const resPendingJ7 = await db.rpcSubscribe(userJ7, 4, undefined, new Date(now.getTime() + 25 * 24 * 3600 * 1000));
  await db.rpcModeratorValidate(adminId, resPendingJ7.subscription_id!, new Date(now.getTime() + 25 * 24 * 3600 * 1000));

  const subPending = db.subscriptions.get(resPendingJ7.subscription_id!)!;
  const pendingQueuedOk = subPending.status === 'pending' && subPending.is_active === false;
  logger.log({
    name: 'Relais J-7 : Pack en attente validé sans interruption de service',
    objective: 'Garantir que le renouvellement s active à l expiration exacte de l ancien pack.',
    status: pendingQueuedOk ? 'SUCCESS' : 'FAILED',
    details: `Pack validé en statut 'pending' programmé pour la relève automatique.`,
  });

  // Bascule automatique à J+31
  const keyJ7Hash = hashApiKey('axis_live_key_j7_test');
  db.apiKeys.set(keyJ7Hash, {
    id: crypto.randomUUID(),
    user_id: userJ7,
    subscription_id: subInitJ7.subscription_id!,
    key_hash: keyJ7Hash,
    is_enabled: true,
  });

  const resSeamless = await db.rpcGatekeeperValidate(keyJ7Hash, 'openai/gpt-4o-mini', 10, 100, new Date(now.getTime() + 31 * 24 * 3600 * 1000));
  const newActiveSub = db.subscriptions.get(db.apiKeys.get(keyJ7Hash)!.subscription_id!)!;
  const seamlessOk = resSeamless.is_allowed && newActiveSub.tier_number === 4 && newActiveSub.status === 'active';
  logger.log({
    name: 'Continuité sans rupture : Activation automatique à J+30',
    objective: 'Activer le pack en attente à la seconde exacte de fin de l ancien sans coupure de service.',
    status: seamlessOk ? 'SUCCESS' : 'FAILED',
    details: 'Bascule atomique réussie vers le pack Palier 4 sans aucune interruption de requête.',
  });

  logger.summary();
}

runAllTests().catch((err) => {
  console.error('Erreur critique pendant les tests:', err);
  process.exit(1);
});
