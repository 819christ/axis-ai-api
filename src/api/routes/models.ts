import { FastifyPluginAsync } from 'fastify';
import { supabase } from '../../db/supabase.js';

export const modelsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/models', async (request, reply) => {
    // 1. Récupération des modèles en cache dans Supabase
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
        id: 'axis-free',
        object: 'model',
        created: 1700000000,
        owned_by: 'axis-ai',
        tier: 'free',
        description: 'Pool de modèles gratuits (aucun décompte sur le solde)',
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

    const actualModels = (dbModels || []).map((m: any) => ({
      id: m.id,
      object: 'model',
      created: 1700000000,
      owned_by: 'openrouter',
      name: m.name,
      tier: m.tier,
      context_length: m.context_length,
      pricing: {
        input_cost_per_token_usd: m.input_cost_per_token,
        output_cost_per_token_usd: m.output_cost_per_token,
        input_per_million_usd: (m.input_cost_per_token * 1000000).toFixed(4),
        output_per_million_usd: (m.output_cost_per_token * 1000000).toFixed(4),
      },
      fallback_model_id: m.fallback_model_id,
    }));

    return reply.send({
      object: 'list',
      data: [...virtualModels, ...actualModels],
    });
  });
};
