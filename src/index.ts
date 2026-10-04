import { buildServer } from './api/server.js';
import { config } from './config/env.js';

async function main() {
  const server = buildServer();

  try {
    await server.listen({
      port: config.port,
      host: config.host,
    });

    console.log(`\n======================================================`);
    console.log(`  🚀 AXIS AI PROXY GATEKEEPER DÉMARRÉ AVEC SUCCÈS`);
    console.log(`  📡 Écoute sur : http://${config.host}:${config.port}`);
    console.log(`  🛡️  Gatekeeper RPC : Connecté à Supabase`);
    console.log(`  🧠 Axis Auto Router : Actif (free / economy / performance)`);
    console.log(`======================================================\n`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
