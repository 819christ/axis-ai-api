import crypto from 'node:crypto';
import { supabase, hashApiKey } from '../src/db/supabase.js';
async function generateDemoKey() {
    console.log('\n[Setup Demo] Initialisation d\'une clé et d\'un abonnement de test...');
    const userId = crypto.randomUUID();
    console.log(`[Setup Demo] Utilisateur UUID : ${userId}`);
    // 1. Création d'une souscription avec 10.00 USD de solde valide 30 jours
    const startsAt = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    const budgetAmount = 10.0;
    const { data: subData, error: subErr } = await supabase
        .from('subscriptions')
        .insert({
        user_id: userId,
        budget_amount_usd: budgetAmount,
        balance_usd: budgetAmount,
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        is_active: true,
    })
        .select()
        .single();
    if (subErr) {
        console.error('[Setup Demo Error] Impossible de créer la souscription:', subErr);
        console.log('\n💡 Conseil: Assurez-vous d\'avoir exécuté le script SQL "001_initial_schema.sql" dans le SQL Editor de Supabase !');
        return;
    }
    console.log(`[Setup Demo] Abonnement créé avec succès (ID: ${subData.id}, Solde: $${subData.balance_usd})`);
    // 2. Génération de la clé API
    const rawSecret = crypto.randomBytes(24).toString('hex');
    const fullKey = `axis_live_${rawSecret}`;
    const keyPrefix = `${fullKey.slice(0, 14)}...`;
    const keyHash = hashApiKey(fullKey);
    const { data: keyData, error: keyErr } = await supabase
        .from('api_keys')
        .insert({
        user_id: userId,
        subscription_id: subData.id,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        name: 'Test Key Dev',
        is_enabled: true,
        daily_request_limit: 1000,
    })
        .select()
        .single();
    if (keyErr) {
        console.error('[Setup Demo Error] Impossible d\'insérer la clé:', keyErr);
        return;
    }
    console.log('\n======================================================');
    console.log('  🎉 CLÉ API AXIS GÉNÉRÉE AVEC SUCCÈS');
    console.log('======================================================');
    console.log(`  🔑 Clé API secrète (à copier) : ${fullKey}`);
    console.log(`  🏷️  ID Clé                    : ${keyData.id}`);
    console.log(`  💰 Solde initial              : $${budgetAmount.toFixed(2)} USD`);
    console.log(`  📅 Expire le                  : ${expiresAt.toLocaleDateString()}`);
    console.log('======================================================');
    console.log('\nExemple de commande cURL pour tester :');
    console.log(`
curl -X POST http://localhost:3000/v1/chat/completions \\
  -H "Authorization: Bearer ${fullKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "axis-auto",
    "messages": [{"role": "user", "content": "Bonjour ! Peux-tu me résumer le rôle d un gatekeeper API ?"}]
  }'
  `);
}
generateDemoKey();
