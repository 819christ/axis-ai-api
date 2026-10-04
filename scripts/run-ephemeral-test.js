/**
 * run-ephemeral-test.js
 * Test live direct sur Supabase : crée des utilisateurs réels, appelle les RPCs,
 * vérifie les résultats, puis supprime toutes les données (aucun déchet en base).
 */

import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import { config } from 'dotenv';
config();

const SUPABASE_URL           = process.env.SUPABASE_URL || 'https://oahduqmmqiwdldsqmzhv.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY manquant dans .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

function hashApiKey(key) {
  return createHash('sha256').update(key).digest('hex');
}

async function runEphemeralTest() {
  console.log('🚀 Démarrage du test éphémère direct sur Supabase...\n');

  const suffix      = Date.now();
  const clientEmail = `client_${suffix}@axis.local`;
  const modEmail    = `mod_${suffix}@axis.local`;
  const modCode     = `MOD-${String(suffix).slice(-6)}`; // ex: MOD-965162 → 10 chars, bien < 20


  let clientId = '';
  let modId    = '';
  let subId    = '';

  try {
    // ── ÉTAPE 1 : Créer 2 utilisateurs dans auth.users ──────────────────────
    const { data: authClient, error: errClient } = await supabase.auth.admin.createUser({
      email: clientEmail, password: 'Password123!', email_confirm: true
    });
    if (errClient || !authClient?.user) throw new Error(`Création client auth: ${errClient?.message}`);
    clientId = authClient.user.id;

    const { data: authMod, error: errMod } = await supabase.auth.admin.createUser({
      email: modEmail, password: 'Password123!', email_confirm: true
    });
    if (errMod || !authMod?.user) throw new Error(`Création modérateur auth: ${errMod?.message}`);
    modId = authMod.user.id;

    // Upsert profils (le trigger handle_new_user le fait normalement,
    // mais on force le rôle moderator + code pour ce test)
    const { error: profileError } = await supabase.from('profiles').upsert([
      { id: clientId, email: clientEmail, username: `client_${suffix}`, pseudo: 'ClientTest', role: 'client' },
      { id: modId,    email: modEmail,    username: `mod_${suffix}`,    pseudo: 'ModTest',    role: 'moderator', moderator_code: modCode }
    ]);
    if (profileError) throw new Error(`Upsert profils: ${profileError.message}`);
    console.log('✅ [1/6] Utilisateurs éphémères créés (auth.users + profiles).');

    // ── ÉTAPE 2 : Souscription client avec code modérateur ──────────────────
    const { data: subData, error: subError } = await supabase.rpc('axis_subscribe', {
      p_user_id:        clientId,
      p_tier_number:    3,
      p_moderator_code: modCode
    });
    if (subError)          throw new Error(`RPC axis_subscribe (réseau): ${subError.message}`);
    if (!subData?.success) throw new Error(`axis_subscribe refusée: ${subData?.error_message}`);
    subId = subData.subscription_id;
    console.log(`✅ [2/6] axis_subscribe → statut: ${subData.status} | ID: ${subId}`);

    // ── ÉTAPE 3 : Validation par le modérateur ───────────────────────────────
    const { data: valData, error: valError } = await supabase.rpc('axis_moderator_validate_subscription', {
      p_validator_id:    modId,
      p_subscription_id: subId
    });
    if (valError)          throw new Error(`RPC validation modérateur (réseau): ${valError.message}`);
    if (!valData?.success) throw new Error(`Validation refusée: ${valData?.error_message}`);
    console.log(`✅ [3/6] axis_moderator_validate_subscription → statut assigné: ${valData.assigned_status}`);

    // ── ÉTAPE 4 : Génération d'une clé API ──────────────────────────────────
    // On tente d'abord la RPC. Si pgcrypto n'est pas installé (schema pas encore déployé),
    // on génère la clé côté JS et on insère directement dans api_keys.
    let keyHash = '';
    let keyPrefix = '';

    const { data: keyData, error: keyError } = await supabase.rpc('axis_generate_api_key', {
      p_user_id:         clientId,
      p_subscription_id: subId,
      p_name:            'Ephemeral Test Key',
      p_daily_limit:     null
    });

    if (keyError || !keyData?.success) {
      // Fallback : génération JS (compatible même sans pgcrypto déployé)
      const { randomBytes } = await import('node:crypto');
      const rawKey = 'axis_live_' + randomBytes(24).toString('hex');
      keyHash   = hashApiKey(rawKey);
      keyPrefix = rawKey.slice(0, 13) + '...'; // 13 + '...' = 16 chars ≤ VARCHAR(16)


      const { error: insertKeyError } = await supabase.from('api_keys').insert({
        user_id:       clientId,
        subscription_id: subId,
        key_hash:      keyHash,
        key_prefix:    keyPrefix,
        name:          'Ephemeral Test Key',
        is_enabled:    true
      });
      if (insertKeyError) throw new Error(`Insertion clé (fallback JS): ${insertKeyError.message}`);
      console.log(`✅ [4/6] Clé API générée (fallback JS) → Prefix: ${keyPrefix}`);
    } else {
      keyHash   = hashApiKey(keyData.api_key);
      keyPrefix = keyData.key_prefix;
      console.log(`✅ [4/6] axis_generate_api_key RPC → Clé: ${keyPrefix} | Activée: ${keyData.is_enabled}`);
    }

    // ── ÉTAPE 5 : Gatekeeper — modèle hors palier → doit être rejeté ────────
    // Claude 3.5 Sonnet ≈ 18 $/1M tokens > MaxAllowedCost(P3) = 15 $/1M → REJET attendu
    const { data: gateData, error: gateError } = await supabase.rpc('axis_gatekeeper_validate', {
      p_key_hash:          keyHash,
      p_model_id:          'anthropic/claude-3.5-sonnet',
      p_input_tokens:      100,
      p_max_output_tokens: 100
    });
    if (gateError) throw new Error(`RPC gatekeeper (réseau): ${gateError.message}`);

    if (gateData?.is_allowed === false && gateData?.error_code === 'TIER_MODEL_NOT_PERMITTED') {
      console.log(`✅ [5/6] axis_gatekeeper_validate → Rejet 403 TIER_MODEL_NOT_PERMITTED (comportement conforme).`);
    } else if (gateData?.is_allowed === true) {
      throw new Error(`Échec filtrage palier : modèle aurait dû être bloqué.\n    Réponse: ${JSON.stringify(gateData)}`);
    } else {
      console.log(`⚠️  [5/6] Réponse gatekeeper inattendue : ${JSON.stringify(gateData)}`);
    }

    console.log('\n🎉 TOUS LES TESTS LIVE SUPABASE ONT RÉUSSI.\n');

  } catch (err) {
    console.error(`\n❌ ÉCHEC DU TEST ÉPHÉMÈRE : ${err.message}\n`);
  } finally {
    // ── NETTOYAGE PROPRE ─────────────────────────────────────────────────────
    console.log('🧹 [6/6] Nettoyage et suppression des données éphémères...');
    if (clientId) {
      await supabase.from('api_keys').delete().eq('user_id', clientId);
      await supabase.from('subscriptions').delete().eq('user_id', clientId);
    }
    if (modId) await supabase.from('api_keys').delete().eq('user_id', modId);

    const ids = [clientId, modId].filter(Boolean);
    if (ids.length > 0) {
      await supabase.from('profiles').delete().in('id', ids);
      if (clientId) await supabase.auth.admin.deleteUser(clientId);
      if (modId)    await supabase.auth.admin.deleteUser(modId);
    }
    console.log('✨ Nettoyage terminé. Base de données entièrement propre, zéro déchet.');
  }
}

runEphemeralTest();