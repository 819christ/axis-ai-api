import { FastifyPluginAsync } from 'fastify';
import { subscribeUser, supabase } from '../../db/supabase.js';

export const subscriptionsRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * Souscription à un abonnement (avec application de la règle anti-abus des 7 jours)
   */
  fastify.post('/subscriptions', async (request, reply) => {
    const body = request.body as { user_id: string; tier_number: number };

    if (!body || !body.user_id || !body.tier_number) {
      return reply.status(400).send({
        error: 'Les paramètres user_id (UUID) et tier_number (1 à 7) sont obligatoires.',
      });
    }

    const result = await subscribeUser(body.user_id, body.tier_number);
    return reply.status(result.http_status || 200).send(result);
  });

  /**
   * Consultation des 7 paliers disponibles et de la formule mathématique MaxAllowedCost
   */
  fastify.get('/tiers', async (_request, reply) => {
    const { data, error } = await supabase
      .from('tiers')
      .select('*')
      .order('tier_number', { ascending: true });

    if (error) {
      return reply.status(500).send({ error: error.message });
    }

    return reply.send({
      object: 'list',
      formula: 'MaxAllowedCost(P_i) = alpha * i + beta (en USD par 1M tokens combinés)',
      data,
    });
  });
};
