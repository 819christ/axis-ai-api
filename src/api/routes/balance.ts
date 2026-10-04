import { FastifyPluginAsync } from 'fastify';
import { supabase, hashApiKey } from '../../db/supabase.js';

export const balanceRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/balance', async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        error: {
          message: 'Clé API manquante.',
          type: 'authentication_error',
        },
      });
    }

    const rawApiKey = authHeader.replace(/^Bearer\s+/i, '').trim();
    const keyHash = hashApiKey(rawApiKey);

    // Recherche de la clé et de son abonnement
    const { data: keyRecord, error: keyErr } = await supabase
      .from('api_keys')
      .select('id, key_prefix, name, is_enabled, daily_request_limit, last_used_at, subscription_id')
      .eq('key_hash', keyHash)
      .maybeSingle();

    if (keyErr || !keyRecord) {
      return reply.status(401).send({
        error: {
          message: 'Clé API invalide ou introuvable.',
          code: 'INVALID_API_KEY',
        },
      });
    }

    if (!keyRecord.subscription_id) {
      return reply.send({
        key: {
          id: keyRecord.id,
          prefix: keyRecord.key_prefix,
          name: keyRecord.name,
          is_enabled: keyRecord.is_enabled,
        },
        subscription: null,
        message: 'Aucun abonnement budgétaire rattaché à cette clé.',
      });
    }

    // Récupération de l'enveloppe budgétaire
    const { data: subRecord, error: subErr } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', keyRecord.subscription_id)
      .maybeSingle();

    if (subErr || !subRecord) {
      return reply.status(404).send({
        error: {
          message: 'Abonnement introuvable.',
        },
      });
    }

    // Statistiques d'usage
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const { count: dailyRequestsCount } = await supabase
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('api_key_id', keyRecord.id)
      .gte('created_at', today.toISOString());

    const isExpired = new Date(subRecord.expires_at) <= new Date();

    return reply.send({
      key: {
        id: keyRecord.id,
        prefix: keyRecord.key_prefix,
        name: keyRecord.name,
        is_enabled: keyRecord.is_enabled && !isExpired && subRecord.is_active,
        daily_limit: keyRecord.daily_request_limit,
        requests_today: dailyRequestsCount || 0,
        last_used_at: keyRecord.last_used_at,
      },
      subscription: {
        id: subRecord.id,
        budget_amount_usd: subRecord.budget_amount_usd,
        balance_usd: subRecord.balance_usd,
        starts_at: subRecord.starts_at,
        expires_at: subRecord.expires_at,
        is_active: subRecord.is_active && !isExpired,
        is_expired: isExpired,
      },
    });
  });
};
