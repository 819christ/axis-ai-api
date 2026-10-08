import { FastifyPluginAsync } from 'fastify';
import { hashApiKey, supabase } from '../../db/supabase.js';

export const modelsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/models', async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.status(401).send({
        error: { message: 'Clé API requise.', code: 'MISSING_API_KEY' },
      });
    }

    const keyHash = hashApiKey(authHeader.replace(/^Bearer\s+/i, '').trim());
    const { data: key, error: keyError } = await supabase
      .from('api_keys')
      .select('is_enabled, subscription_id, subscriptions(status, is_active, balance_usd, budget_amount_usd, expires_at)')
      .eq('key_hash', keyHash)
      .maybeSingle();

    if (keyError) {
      fastify.log.error(keyError);
      return reply.status(503).send({ error: { message: 'Validation de clé temporairement indisponible.' } });
    }
    if (!key) return reply.status(401).send({ error: { message: 'Clé API invalide.', code: 'INVALID_API_KEY' } });
    if (!key.is_enabled) return reply.status(403).send({ error: { message: 'Clé API désactivée.', code: 'KEY_DISABLED' } });
    if (!key.subscription_id) return reply.status(402).send({ error: { message: 'Un pack actif est requis.', code: 'NO_SUBSCRIPTION' } });

    const subscription = Array.isArray(key.subscriptions) ? key.subscriptions[0] : key.subscriptions;
    if (!subscription || subscription.status !== 'active' || !subscription.is_active
      || Number(subscription.balance_usd) <= 0
      || (subscription.expires_at && new Date(subscription.expires_at) <= new Date())) {
      return reply.status(402).send({ error: { message: 'Le pack associé est inactif ou épuisé.', code: 'PACK_INACTIVE' } });
    }

    const creditUsd = Number(subscription.budget_amount_usd);
    const maxCostPerMillion = creditUsd / 40;

    // Catalogue correspondant au seuil de tokens atteignable avec le crédit initial du pack.
    const { data: dbModels, error } = await supabase
      .from('models')
      .select('*')
      .eq('is_active', true)
      .order('tier', { ascending: true });

    if (error) {
      fastify.log.error(error);
    }

    // 2. Modèles virtuels Axis
    const virtualModels = [
      {
        id: 'axis-auto',
        object: 'model',
        created: 1700000000,
        owned_by: 'axis-ai',
        tier: 'auto',
        description: 'Routage dynamique intelligent selon l\'intention et la complexité de votre prompt',
      },
      {
        id: 'axis-economy',
        object: 'model',
        created: 1700000000,
        owned_by: 'axis-ai',
        tier: 'economy',
        description: 'Pool économique ultra-rapide et abordable',
      },
      {
        id: 'axis-performance',
        object: 'model',
        created: 1700000000,
        owned_by: 'axis-ai',
        tier: 'performance',
        description: 'Pool haute performance pour raisonnement complexe et ingénierie de code',
      },
    ];

    const actualModels = (dbModels || [])
      .filter((model: any) => {
        const isTestOnly = Number(model.input_cost_per_token) === 0 && Number(model.output_cost_per_token) === 0;
        return isTestOnly || Number(model.combined_cost_per_million_usd) <= maxCostPerMillion;
      })
      .map((m: any) => {
        const isTestOnly = Number(m.input_cost_per_token) === 0 && Number(m.output_cost_per_token) === 0;
        return ({
      id: m.id,
      object: 'model',
      created: 1700000000,
      owned_by: 'openrouter',
      name: m.name,
      tier: isTestOnly ? 'test' : m.tier,
      description: isTestOnly ? 'Modèle de test instable, sans débit de crédit Axis et soumis aux quotas du fournisseur.' : undefined,
      axis_billing: isTestOnly ? 'test-only' : 'metered',
      context_length: m.context_length,
      pricing: {
        input_cost_per_token_usd: m.input_cost_per_token,
        output_cost_per_token_usd: m.output_cost_per_token,
        input_per_million_usd: (m.input_cost_per_token * 1000000).toFixed(4),
        output_per_million_usd: (m.output_cost_per_token * 1000000).toFixed(4),
        combined_per_million_usd: Number(m.combined_cost_per_million_usd).toFixed(4),
      },
      fallback_model_id: m.fallback_model_id,
      });
    });

    return reply.send({
      object: 'list',
      data: [...virtualModels, ...actualModels],
    });
  });
};
