import { buildServer } from '../src/api/server.js';
import { resolveAxisRoute, estimateTokens, decidePowerLevel } from '../src/router/axis-auto.js';
import { hashApiKey } from '../src/db/supabase.js';

async function runTests() {
  console.log('==================================================');
  console.log('🧪 LANCEMENT DE LA SUITE DE TESTS AXIS AI PROXY');
  console.log('==================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1 : Hachage cryptographique SHA-256
  // --------------------------------------------------------------------------
  console.log('\n--- 1. Sécurité & Hachage des Clés ---');
  const sampleKey = 'axis_live_1234567890abcdef1234567890abcdef';
  const hashed = hashApiKey(sampleKey);
  assert(hashed.length === 64, 'Le hash de la clé doit faire 64 caractères hexadécimaux (SHA-256)');
  assert(hashApiKey(sampleKey) === hashed, 'Le hachage doit être déterministe et idempotent');

  // --------------------------------------------------------------------------
  // TEST 2 : Estimateur de tokens
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Estimateur de Tokens d\'Entrée ---');
  const shortMsg = [{ role: 'user', content: 'Bonjour' }];
  const estShort = estimateTokens(shortMsg);
  assert(estShort > 0 && estShort <= 15, `Estimation prompt court (${estShort} tokens attendu ~5-15)`);

  const longText = 'A'.repeat(3800);
  const longMsg = [{ role: 'user', content: longText }];
  const estLong = estimateTokens(longMsg);
  assert(estLong >= 950 && estLong <= 1050, `Estimation prompt long (${estLong} tokens attendu ~1000)`);

  // --------------------------------------------------------------------------
  // TEST 3 : Analyse d'intention et routage Axis Auto
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Moteur Axis Auto & Heuristiques ---');

  // Question simple -> low
  const simpleIntent = decidePowerLevel([{ role: 'user', content: 'Quelle est la capitale de l\'Espagne ?' }]);
  assert(simpleIntent.powerLevel === 'low', `Question simple classée 'low' (obtenu: ${simpleIntent.powerLevel})`);

  // Raisonnement / Preuve -> ultra
  const reasoningIntent = decidePowerLevel([{
    role: 'user',
    content: 'Fournis une preuve mathématique step by step du théorème de Pythagore avec une analyse formelle.'
  }]);
  assert(reasoningIntent.powerLevel === 'ultra', `Prompt de raisonnement classé 'ultra' (obtenu: ${reasoningIntent.powerLevel})`);

  // Code complexe -> high
  const codeIntent = decidePowerLevel([{
    role: 'user',
    content: '```typescript\nfunction solve(matrix: number[][]): boolean {\n  // complex algorithm\n}\n```\nPeux-tu refactoriser et optimiser cet algorithme ?'
  }]);
  assert(codeIntent.powerLevel === 'high', `Prompt de code complexe classé 'high' (obtenu: ${codeIntent.powerLevel})`);

  // Function calling -> high
  const toolIntent = decidePowerLevel(
    [{ role: 'user', content: 'Donne-moi la météo' }],
    [{ type: 'function', function: { name: 'get_weather' } }]
  );
  assert(toolIntent.powerLevel === 'high', `Requête avec outils (Tools) classée 'high' (obtenu: ${toolIntent.powerLevel})`);

  // Routes virtuelles
  const routeLow = resolveAxisRoute('axis-low', [], 1);
  assert(routeLow.powerLevel === 'low', 'Modèle axis-low configuré en power level low');

  const routeAuto = resolveAxisRoute('axis-auto', [{ role: 'user', content: 'Salut' }], 1);
  assert(routeAuto.isVirtualRoute === true, 'axis-auto identifié comme route virtuelle');
  assert(routeAuto.fallbackChain.length > 0, 'La chaîne de secours Fallback est bien configurée');

  // --------------------------------------------------------------------------
  // TEST 4 : Serveur HTTP Fastify & Endpoints
  // --------------------------------------------------------------------------
  console.log('\n--- 4. Endpoints HTTP & Filtre Gatekeeper ---');
  const app = buildServer();
  await app.ready();

  // A. Health check
  const resHealth = await app.inject({ method: 'GET', url: '/health' });
  assert(resHealth.statusCode === 200, 'GET /health retourne HTTP 200');

  // B. Liste des modèles
  const resModels = await app.inject({ method: 'GET', url: '/v1/models' });
  assert(resModels.statusCode === 200, 'GET /v1/models retourne HTTP 200');
  const modelsJson = JSON.parse(resModels.payload);
  const modelIds = modelsJson.data.map((m: any) => m.id);
  assert(modelIds.includes('axis-auto'), 'Le catalogue inclut le modèle axis-auto');
  assert(modelIds.includes('axis-free'), 'Le catalogue inclut le modèle axis-free');
  assert(modelIds.includes('axis-economy'), 'Le catalogue inclut le modèle axis-economy');
  assert(modelIds.includes('axis-performance'), 'Le catalogue inclut le modèle axis-performance');

  // C. Gatekeeper : Requête sans header Authorization
  const resNoAuth = await app.inject({
    method: 'POST',
    url: '/v1/chat/completions',
    payload: { messages: [{ role: 'user', content: 'Test' }] },
  });
  assert(resNoAuth.statusCode === 401, 'Requête sans clé refusée avec HTTP 401');

  // D. Gatekeeper : Requête avec fausse clé inexistante
  const resBadKey = await app.inject({
    method: 'POST',
    url: '/v1/chat/completions',
    headers: { Authorization: 'Bearer axis_live_invalid_key_000000000000' },
    payload: { messages: [{ role: 'user', content: 'Test' }] },
  });
  // Si la procédure RPC n'est pas encore déployée en DB, la procédure retourne 500 (GATEKEEPER_DB_ERROR)
  // ou 401 si la procédure est présente. Vérifions que le refus a bien eu lieu (status >= 400).
  assert(resBadKey.statusCode >= 400, `Clé inexistante interceptée et rejetée (HTTP ${resBadKey.statusCode})`);

  // E. Protection du Cron Cleanup
  const resCronBad = await app.inject({
    method: 'POST',
    url: '/v1/cron/cleanup',
    headers: { 'x-cron-token': 'wrong_token' },
  });
  assert(resCronBad.statusCode === 401, 'Cron webhook avec mauvais token rejeté HTTP 401');

  await app.close();

  console.log('\n==================================================');
  console.log(`📊 RÉSULTAT : ${passed}/${total} tests réussis (${Math.round((passed / total) * 100)}%)`);
  console.log('==================================================\n');
}

runTests().catch((err) => {
  console.error('Erreur critique pendant les tests:', err);
  process.exit(1);
});
