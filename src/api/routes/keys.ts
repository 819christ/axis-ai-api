import { FastifyPluginAsync } from 'fastify';
import { supabase } from '../../db/supabase.js';

export const keysRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * Génération d'une nouvelle clé d'accès (affichée une seule fois)
   */
  fastify.post('/keys/generate', async (request, reply) => {
    const body = request.body as {
      user_id: string;
      subscription_id?: string;
      name?: string;
      daily_request_limit?: number;
    };

    if (!body || !body.user_id) {
      return reply.status(400).send({
        error: 'Le paramètre user_id (UUID) est obligatoire.',
      });
    }

    const { data, error } = await supabase.rpc('axis_generate_api_key', {
      p_user_id: body.user_id,
      p_subscription_id: body.subscription_id || null,
      p_name: body.name || 'Default API Key',
      p_daily_limit: body.daily_request_limit || null,
    });

    if (error) {
      return reply.status(500).send({
        error: `Erreur lors de la génération de la clé: ${error.message}`,
      });
    }

    return reply.status(201).send(data);
  });

  /**
   * Rafraîchissement / rotation d'une clé API en cas de fuite ou compromission
   */
  fastify.post('/keys/refresh', async (request, reply) => {
    const body = request.body as { key_id: string };

    if (!body || !body.key_id) {
      return reply.status(400).send({
        error: 'Le paramètre key_id (UUID) est obligatoire.',
      });
    }

    const { data, error } = await supabase.rpc('axis_refresh_api_key', {
      p_key_id: body.key_id,
    });

    if (error) {
      return reply.status(500).send({
        error: `Erreur lors du rafraîchissement de la clé: ${error.message}`,
      });
    }

    return reply.send(data);
  });

  /**
   * Révocation / Désactivation ou suppression d'une clé API
   */
  fastify.post('/keys/revoke', async (request, reply) => {
    const body = request.body as { key_id: string; delete?: boolean };

    if (!body || !body.key_id) {
      return reply.status(400).send({
        error: 'Le paramètre key_id (UUID) est obligatoire.',
      });
    }

    const { data, error } = await supabase.rpc('axis_revoke_api_key', {
      p_key_id: body.key_id,
      p_delete: Boolean(body.delete),
    });

    if (error) {
      return reply.status(500).send({
        error: `Erreur lors de la révocation de la clé: ${error.message}`,
      });
    }

    return reply.send(data);
  });
};
