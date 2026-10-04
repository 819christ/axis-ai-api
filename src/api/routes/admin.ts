import { FastifyPluginAsync } from 'fastify';
import { supabase } from '../../db/supabase.js';

/**
 * Routes d'administration et de modération.
 * Ces routes sont protégées par logique applicative (vérification du rôle via RPC SECURITY DEFINER).
 * Pour la production, ajoutez une vérification JWT Supabase en middleware.
 */
export const adminRoutes: FastifyPluginAsync = async (fastify) => {

  // ────────────────────────────────────────────────────────────────────────────
  // ADMIN : Nommer un modérateur
  // POST /v1/admin/moderators
  // Body: { admin_id, user_id, custom_code? }
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/admin/moderators', async (request, reply) => {
    const body = request.body as {
      admin_id: string;
      user_id: string;
      custom_code?: string;
    };

    if (!body?.admin_id || !body?.user_id) {
      return reply.status(400).send({ error: 'admin_id et user_id sont obligatoires.' });
    }

    const { data, error } = await supabase.rpc('axis_create_moderator', {
      p_admin_id: body.admin_id,
      p_user_id: body.user_id,
      p_custom_code: body.custom_code || null,
    });

    if (error) return reply.status(500).send({ error: error.message });
    return reply.status(data?.http_status || 200).send(data);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // ADMIN + MODERATEUR : Valider un abonnement pending_validation
  // POST /v1/admin/subscriptions/:id/validate
  // Body: { validator_id }
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/admin/subscriptions/:id/validate', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { validator_id: string };

    if (!body?.validator_id) {
      return reply.status(400).send({ error: 'validator_id est obligatoire.' });
    }

    const { data, error } = await supabase.rpc('axis_moderator_validate_subscription', {
      p_validator_id: body.validator_id,
      p_subscription_id: id,
    });

    if (error) return reply.status(500).send({ error: error.message });
    return reply.status(data?.http_status || 200).send(data);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // ADMIN : Désactiver un abonnement avec motif obligatoire
  // POST /v1/admin/subscriptions/:id/disable
  // Body: { admin_id, reason }
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/admin/subscriptions/:id/disable', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { admin_id: string; reason: string };

    if (!body?.admin_id || !body?.reason || body.reason.trim().length < 5) {
      return reply.status(400).send({
        error: 'admin_id et un justificatif (reason, min 5 caractères) sont obligatoires.',
      });
    }

    const { data, error } = await supabase.rpc('admin_disable_subscription', {
      p_admin_id: body.admin_id,
      p_subscription_id: id,
      p_reason: body.reason.trim(),
    });

    if (error) return reply.status(500).send({ error: error.message });
    return reply.status(data?.http_status || 200).send(data);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // MODÉRATEUR : Tableau de bord (clients assignés + commissions)
  // GET /v1/moderator/dashboard?moderator_id=UUID
  // ────────────────────────────────────────────────────────────────────────────
  fastify.get('/moderator/dashboard', async (request, reply) => {
    const { moderator_id } = request.query as { moderator_id?: string };

    if (!moderator_id) {
      return reply.status(400).send({ error: 'moderator_id (UUID) est obligatoire.' });
    }

    const { data, error } = await supabase.rpc('axis_get_moderator_dashboard', {
      p_moderator_id: moderator_id,
    });

    if (error) return reply.status(500).send({ error: error.message });
    return reply.status(data?.http_status || 200).send(data);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // ADMIN : Archiver / Marquer une commission comme payée
  // POST /v1/admin/subscriptions/:id/commission
  // Body: { admin_id, status: 'paid' | 'archived' }
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/admin/subscriptions/:id/commission', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { admin_id: string; status: 'paid' | 'archived' };

    if (!body?.admin_id || !body?.status) {
      return reply.status(400).send({ error: 'admin_id et status (paid | archived) sont obligatoires.' });
    }

    const { data, error } = await supabase.rpc('admin_archive_commission', {
      p_admin_id: body.admin_id,
      p_subscription_id: id,
      p_new_status: body.status,
    });

    if (error) return reply.status(500).send({ error: error.message });
    return reply.status(data?.http_status || 200).send(data);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // CLIENT : Vérifier s'il y a une alerte popup (suspension admin)
  // GET /v1/me/alert?user_id=UUID
  // ────────────────────────────────────────────────────────────────────────────
  fastify.get('/me/alert', async (request, reply) => {
    const { user_id } = request.query as { user_id?: string };

    if (!user_id) {
      return reply.status(400).send({ error: 'user_id (UUID) est obligatoire.' });
    }

    const { data, error } = await supabase.rpc('axis_get_popup_alert', {
      p_user_id: user_id,
    });

    if (error) return reply.status(500).send({ error: error.message });
    return reply.send(data);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // CRON/WEBHOOK : Nettoyage des abonnements expirés + activation des packs pending
  // POST /v1/cron/cleanup
  // Header: Authorization: Bearer <CRON_SECRET>
  // ────────────────────────────────────────────────────────────────────────────
  fastify.post('/cron/cleanup', async (request, reply) => {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = request.headers['authorization'];
      if (authHeader !== `Bearer ${cronSecret}`) {
        return reply.status(401).send({ error: 'CRON_SECRET invalide.' });
      }
    }

    const { data, error } = await supabase.rpc('axis_cleanup_expired_subscriptions');

    if (error) return reply.status(500).send({ error: error.message });
    return reply.send(data);
  });
};
