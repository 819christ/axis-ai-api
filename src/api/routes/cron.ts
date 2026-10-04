import { FastifyPluginAsync } from 'fastify';
import { supabase } from '../../db/supabase.js';
import { config } from '../../config/env.js';

export const cronRoutes: FastifyPluginAsync = async (fastify) => {
  const handleCleanup = async (request: any, reply: any) => {
    // Vérification du token de sécurité secret pour autoriser l'exécution cron
    const providedToken =
      request.headers['x-cron-token'] ||
      (request.query as any)?.token ||
      request.headers.authorization?.replace(/^Bearer\s+/i, '');

    if (providedToken !== config.cronSecretToken) {
      return reply.status(401).send({
        error: 'Non autorisé. Token de sécurité cron invalide.',
      });
    }

    // Appel de la procédure stockée de maintenance
    const { data, error } = await supabase.rpc('axis_cleanup_expired_subscriptions');

    if (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: `Erreur d'exécution de la maintenance: ${error.message}`,
      });
    }

    return reply.send({
      message: 'Nettoyage des abonnements et désactivation des clés expirées exécutés avec succès.',
      result: data,
    });
  };

  // Supporte GET et POST pour une compatibilité totale avec cron-job.org
  fastify.get('/cron/cleanup', handleCleanup);
  fastify.post('/cron/cleanup', handleCleanup);
};
