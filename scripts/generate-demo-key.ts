/**
 * generate-demo-key.ts
 * 
 * Génère une clé API de test via le RPC `axis_generate_api_key`.
 * Prérequis : Le schéma SQL doit être déployé sur Supabase.
 * Usage : npm run generate-key [user-id-uuid]
 */
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis dans .env');
  process.exit(1);
}

// Client avec service role key pour contourner RLS
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

async function generateDemoKey() {
  // L'user_id peut être passé en argument CLI
  const userId = process.argv[2];

  if (!userId) {
    console.error(`
❌ Usage : npm run generate-key <user-id-uuid>

L'UUID doit correspondre à un utilisateur existant dans auth.users (et donc dans public.profiles).

💡 Pour obtenir votre UUID admin :
   Ouvrez le SQL Editor Supabase et exécutez :
   SELECT id, email FROM auth.users LIMIT 10;
`);
    process.exit(1);
  }

  console.log(`\n[Setup Demo] Génération d'une clé pour l'utilisateur : ${userId}`);

  // Vérifier que le profil existe
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, username, role')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    console.error(`
❌ Utilisateur introuvable dans public.profiles.
   
Vérifiez que :
  1. Le schéma SQL (supabase_production_schema.sql) a bien été déployé.
  2. L'utilisateur est inscrit via Supabase Auth (le trigger handle_new_user crée le profil automatiquement).
  3. L'UUID fourni est correct.

Erreur technique : ${profileError?.message ?? 'Aucun profil trouvé'}
`);
    process.exit(1);
  }

  console.log(`[Setup Demo] Profil trouvé : @${profile.username} (rôle: ${profile.role})`);

  // Appel RPC axis_generate_api_key
  const { data, error } = await supabaseAdmin.rpc('axis_generate_api_key', {
    p_user_id: userId,
    p_subscription_id: null,       // Pas d'abonnement lié (admin bypass ou clé en attente)
    p_name: 'Demo Key (Dev)',
    p_daily_limit: null,
  });

  if (error) {
    console.error(`❌ Erreur RPC axis_generate_api_key : ${error.message}`);
    process.exit(1);
  }

  if (!data?.success) {
    console.error(`❌ La génération a échoué : ${data?.error_message}`);
    process.exit(1);
  }

  console.log('\n' + '='.repeat(60));
  console.log('  🎉 CLÉ API AXIS GÉNÉRÉE AVEC SUCCÈS');
  console.log('='.repeat(60));
  console.log(`  🔑 Clé API secrète (à copier) : ${data.api_key}`);
  console.log(`  🏷️  Prefix affiché            : ${data.key_prefix}`);
  console.log(`  🆔 ID Clé                    : ${data.key_id}`);
  console.log(`  ✅ Activée                   : ${data.is_enabled ? 'Oui' : 'Non (nécessite un abonnement validé)'}`);
  console.log('='.repeat(60));
  console.log(`\n⚠️  ${data.warning}`);

  if (profile.role !== 'admin') {
    console.log(`
📋 Prochaines étapes pour activer cette clé :
  1. Appelez POST /v1/subscriptions avec un tier_number (1 à 7)
  2. Un modérateur valide l'abonnement via POST /v1/admin/subscriptions/:id/validate
  3. La clé s'active automatiquement.
`);
  } else {
    console.log(`
✨ Cet utilisateur est ADMIN — la clé est active immédiatement sans abonnement.
`);
  }

  console.log('Exemple de commande cURL pour tester :');
  console.log(`
curl -X POST http://localhost:3000/v1/chat/completions \\
  -H "Authorization: Bearer ${data.api_key}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "axis-auto",
    "messages": [{"role": "user", "content": "Bonjour ! Peux-tu expliquer le rôle d un gatekeeper API ?"}]
  }'
`);
}

generateDemoKey();
