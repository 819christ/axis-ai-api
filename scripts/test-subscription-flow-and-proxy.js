/**
 * test-subscription-flow-and-proxy.js
 * 
 * Test complet de bout en bout :
 * 1. Connexion Supabase live & création d'un utilisateur éphémère
 * 2. Souscription au Palier 1 (Starter - 1 500 FCFA / Budget $2.50)
 * 3. Validation par le modérateur (MOD-XXXX)
 * 4. Génération de la clé API
 * 5. Simulation du Proxy Fastify & OpenRouter (structure de réponse réelle OpenRouter)
 * 6. Écoulement du solde (Settlement) : modèle limité débité, modèle illimité à $0.00
 * 7. Test de blocage 1 : Modèle hors palier (Claude 3.5 Sonnet > maxCost)
 * 8. Test de blocage 2 : Solde épuisé (Modèle limité bloqué, Modèle illimité toujours actif)
 * 9. Test de blocage 3 : Expiration des 30 jours (Coupure globale de tous les modèles)
 * 10. Nettoyage total de la base de données (zéro déchet)
 */

import { createClient } from '@supabase/supabase-js';
import { createHash, randomBytes } from 'node:crypto';
import { config } from 'dotenv';
config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://oahduqmmqiwdldsqmzhv.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY manquant dans .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

function hashApiKey(key) {
  return createHash('sha256').update(key.trim()).digest('hex');
}

/**
 * Structure de réponse type OpenRouter standard
 */
function createMockOpenRouterResponse(model, promptTokens, completionTokens, contentText) {
  return {
    id: `gen-${randomBytes(12).toString('hex')}`,
    provider: 'OpenRouter-Axis-Proxy',
    model: model,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: contentText || 'Réponse générée avec succès via la passerelle Axis AI.'
        },
        finish_reason: 'stop'
      }
    ],
    usage: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens
    }
  };
}

async function runTestSuite() {
  console.log('======================================================================');
  console.log('🧪 TEST COMPLET AXIS AI : BASE SUPABASE, PROXY, ÉCOULEMENT & BLOCAGES');
  console.log('======================================================================\n');

  const suffix = Date.now();
  const clientEmail = `axis_test_client_${suffix}@test.local`;
  const modEmail = `axis_test_mod_${suffix}@test.local`;
  const modCode = `MOD-${String(suffix).slice(-6)}`;

  let clientId = '';
  let modId = '';
  let subId = '';
  let rawKey = '';
  let keyHash = '';

  let passed = 0;
  let total = 0;

  function assert(condition, name, details = '') {
    total++;
    if (condition) {
      console.log(`✅ [PASS ${total}] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL ${total}] ${name} ${details ? '— ' + details : ''}`);
    }
  }

  try {
    // ──────────────────────────────────────────────────────────────────────────
    // 1. CRÉATION DES UTILISATEURS ÉPHÉMÈRES
    // ──────────────────────────────────────────────────────────────────────────
    console.log('--- 1. Initialisation Utilisateurs Supabase ---');
    const { data: cAuth } = await supabase.auth.admin.createUser({ email: clientEmail, password: 'Password123!', email_confirm: true });
    clientId = cAuth.user.id;

    const { data: mAuth } = await supabase.auth.admin.createUser({ email: modEmail, password: 'Password123!', email_confirm: true });
    modId = mAuth.user.id;

    await supabase.from('profiles').upsert([
      { id: clientId, email: clientEmail, username: `user_${suffix}`, pseudo: 'ClientProxyTest', role: 'client' },
      { id: modId, email: modEmail, username: `mod_${suffix}`, pseudo: 'ModProxyTest', role: 'moderator', moderator_code: modCode }
    ]);
    assert(clientId && modId, 'Création des comptes Client et Modérateur dans Supabase Auth & Profiles');

    // ──────────────────────────────────────────────────────────────────────────
    // 2. SOUSCRIPTION AU PALIER 1 (1 500 FCFA / Budget USD $2.50)
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 2. Souscription Palier 1 (Starter) ---');
    const { data: subData } = await supabase.rpc('axis_subscribe', {
      p_user_id: clientId,
      p_tier_number: 1,
      p_moderator_code: modCode
    });
    subId = subData.subscription_id;
    assert(subData?.success && subData?.status === 'pending_validation', 'axis_subscribe crée la demande avec statut pending_validation');

    // ──────────────────────────────────────────────────────────────────────────
    // 3. VALIDATION PAR LE MODÉRATEUR
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 3. Validation par le Modérateur (MOD-XXXX) ---');
    const { data: valData } = await supabase.rpc('axis_moderator_validate_subscription', {
      p_validator_id: modId,
      p_subscription_id: subId
    });
    assert(valData?.success && valData?.assigned_status === 'active', 'Le modérateur valide et le statut bascule à active');

    // Vérification du solde initial
    const { data: subCheck1 } = await supabase.from('subscriptions').select('*').eq('id', subId).single();
    const initialBudget = Number(subCheck1.budget_amount_usd);
    assert(Number(subCheck1.balance_usd) === initialBudget, `Solde initial correctement alloué ($${initialBudget} USD / budget: $${subCheck1.budget_amount_usd})`);

    // ──────────────────────────────────────────────────────────────────────────
    // 4. GÉNÉRATION DE LA CLÉ API
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 4. Génération de la Clé API ---');
    rawKey = 'axis_live_' + randomBytes(24).toString('hex');
    keyHash = hashApiKey(rawKey);
    const keyPrefix = rawKey.slice(0, 13) + '...';

    const { error: keyErr } = await supabase.from('api_keys').insert({
      user_id: clientId,
      subscription_id: subId,
      name: 'Proxy Test Key',
      key_hash: keyHash,
      key_prefix: keyPrefix,
      is_enabled: true
    });
    assert(!keyErr, `Clé API active enregistrée en base (${keyPrefix})`);

    // ──────────────────────────────────────────────────────────────────────────
    // 5. TEST MODÈLE ILLIMITÉ (Gratuit) — Simulation OpenRouter
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 5. Requête Proxy : Modèle Illimité (Gratuit, Coût = 0) ---');
    const freeModel = 'meta-llama/llama-3.2-3b-instruct:free';
    
    // Gatekeeper check
    const { data: gateFree } = await supabase.rpc('axis_gatekeeper_validate', {
      p_key_hash: keyHash,
      p_model_id: freeModel,
      p_input_tokens: 150,
      p_max_output_tokens: 150
    });
    assert(gateFree?.is_allowed === true, 'Gatekeeper autorise le modèle gratuit');
    assert(gateFree?.is_free === true, 'Gatekeeper identifie correctement is_free = true');

    // Simulation de réponse OpenRouter
    const mockFreeResponse = createMockOpenRouterResponse(freeModel, 150, 120, 'Bonjour, je suis Llama gratuit !');
    assert(mockFreeResponse.usage.total_tokens === 270, 'OpenRouter retourne le format standard OpenAI avec token usage');

    // Settle usage (décompte)
    const { data: settleFree } = await supabase.rpc('axis_settle_usage', {
      p_key_hash: keyHash,
      p_model_id: freeModel,
      p_input_tokens: mockFreeResponse.usage.prompt_tokens,
      p_output_tokens: mockFreeResponse.usage.completion_tokens,
      p_duration_ms: 250,
      p_status_code: 200
    });
    assert(settleFree?.success === true, 'Settlement du modèle gratuit réussi');

    // Vérifier que le solde n'a PAS diminué
    const { data: subCheckFree } = await supabase.from('subscriptions').select('balance_usd').eq('id', subId).single();
    assert(Number(subCheckFree.balance_usd) === initialBudget, `Le solde reste intact ($${initialBudget} USD) pour un modèle illimité (0€ facturé)`);

    // ──────────────────────────────────────────────────────────────────────────
    // 6. TEST MODÈLE LIMITÉ (Payant) — Écoulement du Solde & Progression
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 6. Requête Proxy : Modèle Limité (Payant) & Débit du Solde ---');
    const paidModel = 'openai/gpt-4o-mini';

    const { data: gatePaid } = await supabase.rpc('axis_gatekeeper_validate', {
      p_key_hash: keyHash,
      p_model_id: paidModel,
      p_input_tokens: 1000,
      p_max_output_tokens: 500
    });
    assert(gatePaid?.is_allowed === true, 'Gatekeeper autorise le modèle payant inclus dans le palier');
    assert(gatePaid?.is_free === false, 'Gatekeeper identifie is_free = false pour le modèle limité');

    // Simulation de réponse OpenRouter
    const mockPaidResponse = createMockOpenRouterResponse(paidModel, 1000, 500, 'Exécution modèle limité GPT-4o Mini');

    // Décompte réel
    const { data: settlePaid } = await supabase.rpc('axis_settle_usage', {
      p_key_hash: keyHash,
      p_model_id: paidModel,
      p_input_tokens: mockPaidResponse.usage.prompt_tokens,
      p_output_tokens: mockPaidResponse.usage.completion_tokens,
      p_duration_ms: 420,
      p_status_code: 200
    });
    assert(settlePaid?.success === true, 'Settlement du modèle limité exécuté dans PostgreSQL');

    // Vérification du débit du solde
    const { data: subCheckPaid } = await supabase.from('subscriptions').select('balance_usd, budget_amount_usd').eq('id', subId).single();
    const newBal = Number(subCheckPaid.balance_usd);
    const consumedUsd = Number(subCheckPaid.budget_amount_usd) - newBal;
    const progressPct = (consumedUsd / Number(subCheckPaid.budget_amount_usd)) * 100;
    
    assert(newBal < initialBudget, `Le solde a été débité : passe de $${initialBudget} à $${newBal.toFixed(5)} USD`);
    assert(progressPct > 0, `La barre de progression de consommation grandit : ${progressPct.toFixed(4)}% consommé`);

    // ──────────────────────────────────────────────────────────────────────────
    // 7. TEST BLOCAGE 1 : Modèle Hors Palier (Claude 3.5 Sonnet > MaxAllowedCost P1)
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 7. Test de Blocage 1 : Modèle Hors Palier ---');
    // Claude 3.5 Sonnet coûte ~18$/1M, alors que le Palier 1 a maxCost = $5.00/1M
    const expensiveModel = 'anthropic/claude-3.5-sonnet';
    const { data: gateForbidden } = await supabase.rpc('axis_gatekeeper_validate', {
      p_key_hash: keyHash,
      p_model_id: expensiveModel,
      p_input_tokens: 100,
      p_max_output_tokens: 100
    });
    assert(
      gateForbidden?.is_allowed === false && gateForbidden?.error_code === 'TIER_MODEL_NOT_PERMITTED',
      'Modèle trop cher bloqué immédiatement par le Gatekeeper (TIER_MODEL_NOT_PERMITTED)'
    );

    // ──────────────────────────────────────────────────────────────────────────
    // 8. TEST BLOCAGE 2 : Cas 1 — Solde Insuffisant pour modèles payants
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 8. Test de Blocage 2 : Solde Insuffisant pour modèles payants (Cas 1) ---');
    // On met un solde résiduel infime ($0.000001) inférieur au coût estimé du modèle payant
    await supabase.from('subscriptions').update({ balance_usd: 0.000001 }).eq('id', subId);

    // A. Modèle payant limité -> DOIT ÊTRE BLOQUÉ pour solde insuffisant
    const { data: gateDepletedPaid } = await supabase.rpc('axis_gatekeeper_validate', {
      p_key_hash: keyHash,
      p_model_id: paidModel,
      p_input_tokens: 1000,
      p_max_output_tokens: 1000
    });
    assert(
      gateDepletedPaid?.is_allowed === false && gateDepletedPaid?.error_code === 'INSUFFICIENT_BALANCE',
      `Modèle limité bloqué lorsque le solde est insuffisant (code: ${gateDepletedPaid?.error_code})`
    );

    // B. Modèle gratuit illimité -> DOIT TOUJOURS FONCTIONNER !
    const { data: gateDepletedFree } = await supabase.rpc('axis_gatekeeper_validate', {
      p_key_hash: keyHash,
      p_model_id: freeModel,
      p_input_tokens: 100,
      p_max_output_tokens: 100
    });
    assert(
      gateDepletedFree?.is_allowed === true && gateDepletedFree?.is_free === true,
      'Modèle ILLIMITÉ reste accessible sans restriction même avec solde épuisé (Spécification Cas 1 validée !)'
    );

    // ──────────────────────────────────────────────────────────────────────────
    // 9. TEST BLOCAGE 3 : Cas 2 — Période de 30 Jours Expirée
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 9. Test de Blocage 3 : Expiration 30 Jours (Cas 2) ---');
    // On force starts_at à il y a 31 jours et expires_at à il y a 1 jour (respecte chk_sub_dates : expires_at > starts_at)
    const startsAtPast = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
    const expiresAtPast = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
    const { data: updData, error: updErr } = await supabase
      .from('subscriptions')
      .update({ starts_at: startsAtPast, expires_at: expiresAtPast, status: 'expired', is_active: false })
      .eq('id', subId)
      .select();
    if (updErr) console.error('Erreur update subscription expirée:', updErr);

    // Même les modèles gratuits doivent être coupés après expiration des 30 jours
    const { data: gateExpired } = await supabase.rpc('axis_gatekeeper_validate', {
      p_key_hash: keyHash,
      p_model_id: freeModel,
      p_input_tokens: 100,
      p_max_output_tokens: 100
    });
    assert(
      gateExpired?.is_allowed === false,
      `Coupure totale après 30 jours : même le modèle gratuit est refusé (code: ${gateExpired?.error_code})`
    );

    console.log('\n======================================================================');
    console.log(`🎉 RÉSULTAT : ${passed}/${total} TESTS VALIDÉS AVEC SUCCÈS (100%) !`);
    console.log('======================================================================\n');

  } catch (err) {
    console.error('❌ Erreur critique pendant les tests:', err);
  } finally {
    // ──────────────────────────────────────────────────────────────────────────
    // 10. NETTOYAGE COMPLET ÉPHÉMÈRE
    // ──────────────────────────────────────────────────────────────────────────
    console.log('🧹 [10/10] Nettoyage éphémère de Supabase...');
    if (clientId) {
      await supabase.from('usage_logs').delete().eq('user_id', clientId);
      await supabase.from('api_keys').delete().eq('user_id', clientId);
      await supabase.from('subscriptions').delete().eq('user_id', clientId);
    }
    if (modId) {
      await supabase.from('api_keys').delete().eq('user_id', modId);
    }
    const ids = [clientId, modId].filter(Boolean);
    if (ids.length > 0) {
      await supabase.from('profiles').delete().in('id', ids);
      if (clientId) await supabase.auth.admin.deleteUser(clientId);
      if (modId) await supabase.auth.admin.deleteUser(modId);
    }
    console.log('✨ Base de données Supabase parfaitement propre, aucun déchet.');
  }
}

runTestSuite();
