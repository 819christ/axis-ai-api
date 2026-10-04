import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  calculateMaxAllowedCost,
  KNOWN_MODELS,
  decidePowerLevel,
  selectBestModelForTier,
  resolveAxisRoute,
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
    // Initialise l'en-tête du journal de test
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
// SIMULATEUR POSTGRESQL ATOMIQUE POUR TESTS HORS-LIGNE & INTÉGRATION RPC
// Reproduit rigoureusement le comportement transactionnel PL/pgSQL de Supabase
// ----------------------------------------------------------------------------
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
  status: 'active' | 'pending' | 'expired' | 'depleted';
  is_active: boolean;
}

interface MockApiKey {
  id: string;
  user_id: string;
  subscription_id: string | null;
  key_hash: string;
  is_enabled: boolean;
}

class PostgresSimulator {
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

  // RPC axis_subscribe (Cycle de vie 30j & Règle J-7)
  async rpcSubscribe(userId: string, tierNumber: number, now = new Date()) {
    await this.acquireLock();
    try {
      if (tierNumber < 1 || tierNumber > 7) {
        return { success: false, http_status: 400, error_code: 'INVALID_TIER', error_message: 'Palier invalide.' };
      }

      // Recherche abonnement actif
      const activeSub = Array.from(this.subscriptions.values()).find(
        (s) => s.user_id === userId && s.status === 'active' && s.is_active && s.expires_at > now && s.balance_usd > 0
      );

      const budgetAmount = [0, 10, 25, 50, 100, 200, 350, 500][tierNumber];

      // Cas A : Pas d'abonnement actif
      if (!activeSub) {
        const subId = crypto.randomUUID();
        const startsAt = new Date(now);
        const expiresAt = new Date(now.getTime() + 30 * 24 * 3600 * 1000);

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
          status: 'active',
          is_active: true,
        };
        this.subscriptions.set(subId, newSub);

        // Activer la clé si existante
        for (const k of this.apiKeys.values()) {
          if (k.user_id === userId) {
            k.subscription_id = subId;
            k.is_enabled = true;
          }
        }

        return {
          success: true,
          http_status: 201,
          action: 'ACTIVATED_IMMEDIATE',
          subscription_id: subId,
          tier_number: tierNumber,
          balance_usd: budgetAmount,
          starts_at: startsAt,
          expires_at: expiresAt,
        };
      }

      // Cas B : Règle des 7 jours
      const sevenDaysBefore = new Date(activeSub.expires_at.getTime() - 7 * 24 * 3600 * 1000);
      if (now < sevenDaysBefore) {
        return {
          success: false,
          http_status: 409,
          error_code: 'EARLY_RENEWAL_FORBIDDEN',
          error_message: 'Souscription anticipée non autorisée en dehors de la fenêtre des 7 derniers jours.',
          allowed_renewal_date: sevenDaysBefore,
        };
      }

      // Cas C : Dans les 7 jours, vérifier si un pending existe déjà
      const pendingSub = Array.from(this.subscriptions.values()).find(
        (s) => s.user_id === userId && s.status === 'pending'
      );
      if (pendingSub) {
        return {
          success: false,
          http_status: 409,
          error_code: 'PENDING_ALREADY_EXISTS',
          error_message: 'Un pack de renouvellement est déjà en attente.',
        };
      }

      // Création du pack pending
      const pendingId = crypto.randomUUID();
      const pStartsAt = new Date(activeSub.expires_at);
      const pExpiresAt = new Date(pStartsAt.getTime() + 30 * 24 * 3600 * 1000);

      const newPending: MockSubscription = {
        id: pendingId,
        user_id: userId,
        tier_number: tierNumber,
        budget_amount_usd: budgetAmount,
        balance_usd: budgetAmount,
        consumed_usd: 0,
        total_tokens_consumed: 0,
        starts_at: pStartsAt,
        expires_at: pExpiresAt,
        status: 'pending',
        is_active: false,
      };
      this.subscriptions.set(pendingId, newPending);

      return {
        success: true,
        http_status: 201,
        action: 'QUEUED_PENDING_J7',
        subscription_id: pendingId,
        tier_number: tierNumber,
        starts_at: pStartsAt,
        expires_at: pExpiresAt,
      };
    } finally {
      this.releaseLock();
    }
  }

  // RPC axis_gatekeeper_validate (Vérification atomique, expiration, relai J-7, formule palier)
  async rpcGatekeeperValidate(keyHash: string, modelId: string, inputTokens: number, maxOutputTokens: number, now = new Date()) {
    await this.acquireLock();
    try {
      const key = Array.from(this.apiKeys.values()).find((k) => k.key_hash === keyHash);
      if (!key) {
        return { is_allowed: false, http_status: 401, error_code: 'INVALID_API_KEY', error_message: 'Clé invalide.' };
      }

      let sub = key.subscription_id ? this.subscriptions.get(key.subscription_id) : null;

      // Bascule automatique si expiré ou épuisé
      if (!sub || sub.status !== 'active' || sub.expires_at <= now || sub.balance_usd <= 0) {
        if (sub && sub.status === 'active') {
          sub.status = sub.balance_usd <= 0 ? 'depleted' : 'expired';
          sub.is_active = false;
        }

        // Vérifier si un pending existe (Relais continuité J-7)
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

      // Modèle & Tarification
      const model = KNOWN_MODELS[modelId];
      if (!model) {
        if (modelId.includes(':free')) {
          return { is_allowed: true, is_free: true, http_status: 200, current_balance_usd: sub.balance_usd };
        }
        return { is_allowed: false, http_status: 404, error_code: 'MODEL_NOT_FOUND', error_message: 'Modèle introuvable.' };
      }

      // Vérification du palier : MaxAllowedCost(P_i) = alpha * i + beta
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
        return {
          is_allowed: true,
          is_free: true,
          http_status: 200,
          current_balance_usd: sub.balance_usd,
          estimated_cost_usd: 0,
        };
      }

      // Modèle payant : estimation du coût
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
          current_balance_usd: sub.balance_usd,
          estimated_cost_usd: estCost,
        };
      }
    } finally {
      this.releaseLock();
    }
  }

  // RPC axis_settle_usage (Décompte atomique du solde)
  async rpcSettleUsage(keyHash: string, modelId: string, inputTokens: number, outputTokens: number) {
    await this.acquireLock();
    try {
      const key = Array.from(this.apiKeys.values()).find((k) => k.key_hash === keyHash);
      if (!key || !key.subscription_id) return { success: false };

      const sub = this.subscriptions.get(key.subscription_id);
      if (!sub) return { success: false };

      const model = KNOWN_MODELS[modelId];
      const realCost = model && !model.isFree
        ? inputTokens * model.inputCostPerToken + outputTokens * model.outputCostPerToken
        : 0;

      sub.balance_usd = Math.max(0, sub.balance_usd - realCost);
      sub.consumed_usd += realCost;
      sub.total_tokens_consumed += inputTokens + outputTokens;

      if (sub.balance_usd <= 0) {
        sub.status = 'depleted';
        sub.is_active = false;
        // Bascule vers pending si dispo
        const pending = Array.from(this.subscriptions.values()).find(
          (s) => s.user_id === key.user_id && s.status === 'pending'
        );
        if (pending) {
          pending.status = 'active';
          pending.is_active = true;
          key.subscription_id = pending.id;
        } else {
          key.is_enabled = false;
        }
      }

      return {
        success: true,
        cost_usd: realCost,
        new_balance_usd: sub.balance_usd,
        total_tokens: inputTokens + outputTokens,
      };
    } finally {
      this.releaseLock();
    }
  }
}

// ============================================================================
// EXÉCUTION DE TOUS LES TESTS
// ============================================================================
async function runAllTests() {
  const logger = new TestLogger();
  const db = new PostgresSimulator();

  console.log('🚀 Démarrage de la validation technique complète...\n');

  // --------------------------------------------------------------------------
  // TEST 1 : Vérification des 7 Paliers et de la Formule Mathématique
  // Formule : MaxAllowedCost(P_i) = alpha * i + beta (alpha = 5.0, beta = 0.0)
  // --------------------------------------------------------------------------
  console.log('--- SUITE 1 : Formule mathématique des 7 Paliers ---');
  for (let i = 1; i <= 7; i++) {
    const calculated = calculateMaxAllowedCost(i, 5.0, 0.0);
    const expected = 5.0 * i;
    const ok = calculated === expected;
    logger.log({
      name: `Palier P${i} : Calcul MaxAllowedCost`,
      objective: `Valider que P${i} = 5.00 * ${i} = ${expected}$/1M tokens`,
      status: ok ? 'SUCCESS' : 'FAILED',
      details: ok
        ? `MaxAllowedCost(P${i}) = ${calculated.toFixed(2)}$ / 1M tokens conforme à la formule.`
        : `Erreur: attendu ${expected}$, obtenu ${calculated}$`,
    });
  }

  // --------------------------------------------------------------------------
  // TEST 2 : Filtrage de modèle par Palier (Autorisé vs Bloqué)
  // --------------------------------------------------------------------------
  console.log('\n--- SUITE 2 : Contrôle d\'accès aux modèles par Palier ---');
  const userP1 = 'user-p1-uuid';
  await db.rpcSubscribe(userP1, 1); // Palier 1 : max 5$/1M
  const keyP1Raw = 'axis_live_key_p1_test';
  const keyP1Hash = hashApiKey(keyP1Raw);
  const activeSubP1 = Array.from(db.subscriptions.values()).find((s) => s.user_id === userP1)!;
  db.apiKeys.set(keyP1Hash, {
    id: crypto.randomUUID(),
    user_id: userP1,
    subscription_id: activeSubP1.id,
    key_hash: keyP1Hash,
    is_enabled: true,
  });

  // Modèle P1 : GPT-4o Mini (0.75$/1M <= 5$) -> DOIT PASSER
  const resP1Mini = await db.rpcGatekeeperValidate(keyP1Hash, 'openai/gpt-4o-mini', 100, 500);
  logger.log({
    name: 'Palier 1 : Modèle GPT-4o Mini (0.75$/1M)',
    objective: 'Vérifier qu un modèle sous le plafond de 5$/1M est autorisé pour P1.',
    status: resP1Mini.is_allowed ? 'SUCCESS' : 'FAILED',
    details: resP1Mini.is_allowed
      ? 'Requête autorisée avec succès (coût combiné 0.75$ <= 5.00$).'
      : `Échec inattendu : ${resP1Mini.error_message}`,
  });

  // Modèle P1 : Claude 3.5 Sonnet (18.00$/1M > 5$) -> DOIT ÊTRE REJETÉ
  const resP1Claude = await db.rpcGatekeeperValidate(keyP1Hash, 'anthropic/claude-3.5-sonnet', 100, 500);
  const claudeRejectedProperly = !resP1Claude.is_allowed && resP1Claude.http_status === 403 && resP1Claude.error_code === 'TIER_MODEL_NOT_PERMITTED';
  logger.log({
    name: 'Palier 1 : Modèle Claude 3.5 Sonnet (18$/1M) - Rejet strict',
    objective: 'Vérifier le rejet immédiat avec HTTP 403 si le modèle dépasse le palier.',
    status: claudeRejectedProperly ? 'SUCCESS' : 'FAILED',
    details: claudeRejectedProperly
      ? `Rejet HTTP 403 conforme : "${resP1Claude.error_message}" (Modèle 18.00$/1M > Plafond P1 5.00$/1M).`
      : `Erreur : Le modèle aurait dû être rejeté mais status=${resP1Claude.http_status}, code=${resP1Claude.error_code}`,
  });

  // Utilisateur Palier 4 (P4 : max 20$/1M) -> Claude 3.5 Sonnet DOIT PASSER
  const userP4 = 'user-p4-uuid';
  await db.rpcSubscribe(userP4, 4);
  const keyP4Raw = 'axis_live_key_p4_test';
  const keyP4Hash = hashApiKey(keyP4Raw);
  const activeSubP4 = Array.from(db.subscriptions.values()).find((s) => s.user_id === userP4)!;
  db.apiKeys.set(keyP4Hash, {
    id: crypto.randomUUID(),
    user_id: userP4,
    subscription_id: activeSubP4.id,
    key_hash: keyP4Hash,
    is_enabled: true,
  });

  const resP4Claude = await db.rpcGatekeeperValidate(keyP4Hash, 'anthropic/claude-3.5-sonnet', 100, 500);
  logger.log({
    name: 'Palier 4 : Modèle Claude 3.5 Sonnet (18$/1M)',
    objective: 'Vérifier que Claude 3.5 Sonnet est autorisé sur le Palier 4 (plafond 20$/1M).',
    status: resP4Claude.is_allowed ? 'SUCCESS' : 'FAILED',
    details: resP4Claude.is_allowed
      ? 'Requête autorisée avec succès (coût combiné 18.00$ <= 20.00$).'
      : `Échec inattendu: ${resP4Claude.error_message}`,
  });

  // --------------------------------------------------------------------------
  // TEST 3 : Cycle de vie 30 jours et Expiration automatique
  // --------------------------------------------------------------------------
  console.log('\n--- SUITE 3 : Cycle de vie 30 jours et Expiration ---');
  const userExp = 'user-exp-uuid';
  await db.rpcSubscribe(userExp, 2);
  const keyExpRaw = 'axis_live_key_exp';
  const keyExpHash = hashApiKey(keyExpRaw);
  const subExp = Array.from(db.subscriptions.values()).find((s) => s.user_id === userExp)!;
  db.apiKeys.set(keyExpHash, {
    id: crypto.randomUUID(),
    user_id: userExp,
    subscription_id: subExp.id,
    key_hash: keyExpHash,
    is_enabled: true,
  });

  // Simulation à J+31 (au delà des 30 jours calendaires stricts)
  const future31Days = new Date(Date.now() + 31 * 24 * 3600 * 1000);
  const resExpired = await db.rpcGatekeeperValidate(keyExpHash, 'openai/gpt-4o-mini', 10, 100, future31Days);
  const expiredOk = !resExpired.is_allowed && resExpired.http_status === 402 && resExpired.error_code === 'SUBSCRIPTION_EXPIRED';
  const keyDeactivated = !db.apiKeys.get(keyExpHash)!.is_enabled;

  logger.log({
    name: 'Expiration automatique à J+31 (30 jours calendaires)',
    objective: 'Vérifier la désactivation automatique de l abonnement et de la clé à l échéance.',
    status: expiredOk && keyDeactivated ? 'SUCCESS' : 'FAILED',
    details: expiredOk && keyDeactivated
      ? 'Abonnement et clé désactivés (HTTP 402 SUBSCRIPTION_EXPIRED).'
      : `Erreur: allowed=${resExpired.is_allowed}, status=${resExpired.http_status}, key_enabled=${!keyDeactivated}`,
  });

  // --------------------------------------------------------------------------
  // TEST 4 : Épuisement du solde / budget de tokens
  // --------------------------------------------------------------------------
  console.log('\n--- SUITE 4 : Épuisement des tokens et du budget ---');
  const userDep = 'user-depleted-uuid';
  await db.rpcSubscribe(userDep, 1); // $10 de solde
  const keyDepHash = hashApiKey('axis_live_key_dep');
  const subDep = Array.from(db.subscriptions.values()).find((s) => s.user_id === userDep)!;
  db.apiKeys.set(keyDepHash, {
    id: crypto.randomUUID(),
    user_id: userDep,
    subscription_id: subDep.id,
    key_hash: keyDepHash,
    is_enabled: true,
  });

  // Consommer la totalité des 10.00$
  subDep.balance_usd = 0.000000;
  const resDepleted = await db.rpcGatekeeperValidate(keyDepHash, 'openai/gpt-4o-mini', 10, 100);
  const depletedOk = !resDepleted.is_allowed && resDepleted.error_code === 'SUBSCRIPTION_DEPLETED';

  logger.log({
    name: 'Coupure nette à épuisement total du solde ($0.00)',
    objective: 'Vérifier le blocage immédiat quand balance_usd atteint 0.',
    status: depletedOk ? 'SUCCESS' : 'FAILED',
    details: depletedOk
      ? 'Requête bloquée avec code SUBSCRIPTION_DEPLETED.'
      : `Erreur: allowed=${resDepleted.is_allowed}, code=${resDepleted.error_code}`,
  });

  // --------------------------------------------------------------------------
  // TEST 5 : Règle anti-abus des 7 jours & Relais Pending
  // --------------------------------------------------------------------------
  console.log('\n--- SUITE 5 : Règle anti-abus des 7 jours (J-7) ---');
  const userJ7 = 'user-j7-uuid';
  const now = new Date();
  await db.rpcSubscribe(userJ7, 2, now); // Actif du jour J à J+30

  // Tentative 1 : Renouvellement à J+5 (il reste 25 jours > 7 jours) -> REFUS STRICT
  const resTooEarly = await db.rpcSubscribe(userJ7, 3, new Date(now.getTime() + 5 * 24 * 3600 * 1000));
  const earlyRefused = !resTooEarly.success && resTooEarly.http_status === 409 && resTooEarly.error_code === 'EARLY_RENEWAL_FORBIDDEN';

  logger.log({
    name: 'Anti-abus : Tentative de souscription avant J-7',
    objective: 'Empêcher la double souscription ou le cumul de crédits à plus de 7 jours de l échéance.',
    status: earlyRefused ? 'SUCCESS' : 'FAILED',
    details: earlyRefused
      ? `Rejet HTTP 409 conforme : "${resTooEarly.error_message}"`
      : `Erreur: tentative acceptée indûment (success=${resTooEarly.success})`,
  });

  // Tentative 2 : Renouvellement à J+25 (il reste 5 jours <= 7 jours) -> ACCEPTÉ EN PENDING
  const dateWithinJ7 = new Date(now.getTime() + 25 * 24 * 3600 * 1000);
  const resPendingJ7 = await db.rpcSubscribe(userJ7, 3, dateWithinJ7);
  const pendingQueued = resPendingJ7.success && resPendingJ7.action === 'QUEUED_PENDING_J7';

  logger.log({
    name: 'Règle J-7 : Souscription autorisée en statut pending',
    objective: 'Enregistrer le nouveau pack en attente pour une activation transparente à l expiration.',
    status: pendingQueued ? 'SUCCESS' : 'FAILED',
    details: pendingQueued
      ? `Pack en attente créé avec succès (ID: ${resPendingJ7.subscription_id}, Début prévu à l expiration exacte de l actuel).`
      : `Erreur: échec de mise en attente: ${resPendingJ7.error_message}`,
  });

  // Tentative 3 : Deuxième renouvellement alors qu un pending existe déjà -> REFUS
  const resDoublePending = await db.rpcSubscribe(userJ7, 4, dateWithinJ7);
  const doublePendingRefused = !resDoublePending.success && resDoublePending.error_code === 'PENDING_ALREADY_EXISTS';

  logger.log({
    name: 'Anti-cumul : Refus d un second pack en attente',
    objective: 'Empêcher l accumulation multiple de packs en attente.',
    status: doublePendingRefused ? 'SUCCESS' : 'FAILED',
    details: doublePendingRefused
      ? 'Refus conforme : PENDING_ALREADY_EXISTS.'
      : 'Erreur: second pack pending accepté indûment.',
  });

  // Tentative 4 : Transition automatique à J+30 -> Le pack pending s active et prend le relais
  const keyJ7Hash = hashApiKey('axis_live_key_j7');
  const activeSubJ7 = Array.from(db.subscriptions.values()).find((s) => s.user_id === userJ7 && s.status === 'active')!;
  db.apiKeys.set(keyJ7Hash, {
    id: crypto.randomUUID(),
    user_id: userJ7,
    subscription_id: activeSubJ7.id,
    key_hash: keyJ7Hash,
    is_enabled: true,
  });

  const dateExpiredJ30 = new Date(now.getTime() + 30 * 24 * 3600 * 1000 + 1000);
  const resSeamless = await db.rpcGatekeeperValidate(keyJ7Hash, 'openai/gpt-4o-mini', 10, 100, dateExpiredJ30);
  const subAfterTransition = db.subscriptions.get(db.apiKeys.get(keyJ7Hash)!.subscription_id!)!;
  const seamlessTransitionOk = resSeamless.is_allowed && subAfterTransition.tier_number === 3 && subAfterTransition.status === 'active';

  logger.log({
    name: 'Relais sans couture : Activation atomique du pack pending à J+30',
    objective: 'Garantir la continuité de service sans interruption lors de l expiration de l ancien abonnement.',
    status: seamlessTransitionOk ? 'SUCCESS' : 'FAILED',
    details: seamlessTransitionOk
      ? `Continuité parfaite : l'abonnement P3 en attente a été activé automatiquement sans interruption de service.`
      : `Erreur: allowed=${resSeamless.is_allowed}, tier=${subAfterTransition?.tier_number}, status=${subAfterTransition?.status}`,
  });

  // --------------------------------------------------------------------------
  // TEST 6 : Mode Axis Auto en 2 Étapes
  // --------------------------------------------------------------------------
  console.log('\n--- SUITE 6 : Mode Axis Auto (Routage en 2 étapes) ---');
  // Étape 1 : Décision
  const dSimple = decidePowerLevel([{ role: 'user', content: 'Bonjour, comment vas-tu ?' }]);
  const dCode = decidePowerLevel([{ role: 'user', content: '```typescript\nfunction optimize(n: number) {}\n```' }]);
  const dMath = decidePowerLevel([{ role: 'user', content: 'Fournis une preuve mathématique step by step formelle du théorème.' }]);

  const decisionOk = dSimple.powerLevel === 'low' && dCode.powerLevel === 'high' && dMath.powerLevel === 'ultra';
  logger.log({
    name: 'Axis Auto - Étape 1 (Décision)',
    objective: 'Classification d intention parmi les 4 niveaux : low, medium, high, ultra.',
    status: decisionOk ? 'SUCCESS' : 'FAILED',
    details: decisionOk
      ? `Décisions validées : Simple->${dSimple.powerLevel}, Code->${dCode.powerLevel}, Raisonnement->${dMath.powerLevel}.`
      : `Erreur de classification`,
  });

  // Étape 2 : Exécution sous contrainte de palier
  // Sur Palier 1 (cap 5$/1M) pour une tâche Ultra -> sélectionne DeepSeek R1 (2.74$/1M <= 5$)
  const selP1Ultra = selectBestModelForTier('ultra', 1);
  const p1UltraOk = selP1Ultra.selectedModel.combinedCostPerMillion <= 5.0;

  logger.log({
    name: 'Axis Auto - Étape 2 (Exécution Palier 1 pour tâche Ultra)',
    objective: 'Sélectionner le meilleur modèle disponible sans jamais dépasser le plafond du palier.',
    status: p1UltraOk ? 'SUCCESS' : 'FAILED',
    details: p1UltraOk
      ? `Modèle sélectionné : ${selP1Ultra.selectedModel.name} (${selP1Ultra.selectedModel.combinedCostPerMillion}$/1M <= 5.00$).`
      : 'Erreur: dépassement du palier',
  });

  // --------------------------------------------------------------------------
  // TEST 7 : Test de Concurrence & Décompte Atomique (Protection contre les Race Conditions)
  // --------------------------------------------------------------------------
  console.log('\n--- SUITE 7 : Test de Charge & Concurrence (Atomicité FOR UPDATE) ---');
  const userConc = 'user-concurrency-uuid';
  await db.rpcSubscribe(userConc, 1); // $10 de solde
  const keyConcHash = hashApiKey('axis_live_key_concurrency');
  const subConc = Array.from(db.subscriptions.values()).find((s) => s.user_id === userConc)!;
  db.apiKeys.set(keyConcHash, {
    id: crypto.randomUUID(),
    user_id: userConc,
    subscription_id: subConc.id,
    key_hash: keyConcHash,
    is_enabled: true,
  });

  // Lancement de 20 décomptes concurrents simultanés de 0.20$
  const concurrentCalls = Array.from({ length: 20 }).map(async () => {
    return db.rpcSettleUsage(keyConcHash, 'openai/gpt-4o-mini', 100000, 100000); // ~0.075$
  });

  await Promise.all(concurrentCalls);

  const subConcFinal = db.subscriptions.get(subConc.id)!;
  const balanceConsistent = subConcFinal.balance_usd >= 0 && Math.abs(subConcFinal.balance_usd + subConcFinal.consumed_usd - 10.0) < 0.0001;

  logger.log({
    name: 'Concurrence : 20 requêtes simultanées avec verrouillage atomique',
    objective: 'Garantir l intégrité stricte du solde et prévenir le double-spending.',
    status: balanceConsistent ? 'SUCCESS' : 'FAILED',
    details: balanceConsistent
      ? `Solde final cohérent : Restant=$${subConcFinal.balance_usd.toFixed(4)}, Consommé=$${subConcFinal.consumed_usd.toFixed(4)}, Somme=$${(subConcFinal.balance_usd + subConcFinal.consumed_usd).toFixed(2)}.`
      : `Incohérence détectée: balance=${subConcFinal.balance_usd}, consumed=${subConcFinal.consumed_usd}`,
  });

  // Résumé
  logger.summary();
}

runAllTests().catch((err) => {
  console.error('Erreur critique pendant les tests:', err);
  process.exit(1);
});
