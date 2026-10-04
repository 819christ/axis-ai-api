import Fastify from 'fastify';
import cors from '@fastify/cors';
import { chatRoutes } from './routes/chat.js';
import { modelsRoutes } from './routes/models.js';
import { balanceRoutes } from './routes/balance.js';
import { keysRoutes } from './routes/keys.js';
import { cronRoutes } from './routes/cron.js';

export function buildServer() {
  const server = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'test' ? 'error' : 'info',
    },
    // Découplage pour tolérance à la charge
    connectionTimeout: 120000,
    keepAliveTimeout: 65000,
  });

  // Activation de CORS pour tous les clients
  server.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-cron-token'],
  });

  // Health check endpoint
  server.get('/health', async () => ({
    status: 'ok',
    service: 'Axis AI Gatekeeper Proxy',
    timestamp: new Date().toISOString(),
  }));

  // Enregistrement des routes préfixées par /v1
  server.register(chatRoutes, { prefix: '/v1' });
  server.register(modelsRoutes, { prefix: '/v1' });
  server.register(balanceRoutes, { prefix: '/v1' });
  server.register(keysRoutes, { prefix: '/v1' });
  server.register(cronRoutes, { prefix: '/v1' });

  // Alias pour les requêtes racine (certains clients OpenAI envoient directement sur /chat/completions)
  server.register(chatRoutes);
  server.register(modelsRoutes);

  return server;
}
