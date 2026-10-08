import { FastifyPluginAsync } from 'fastify';
import { supabase } from '../../db/supabase.js';
import { config } from '../../config/env.js';


export const subscriptionsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/subscriptions', async (request, reply) => {
    const body = request.body as { pack_code?: string } | null;
    const authHeader = request.headers.authorization;
    const accessToken = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();

    if (!accessToken) {
      return reply.status(401).send({ error: { message: 'Un jeton utilisateur est requis.' } });
    }
    if (!body || typeof body.pack_code !== 'string' || !body.pack_code.trim()) {
      return reply.status(400).send({ error: { message: 'Le paramètre pack_code est obligatoire.' } });
    }

    const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !authData.user) {
      return reply.status(401).send({ error: { message: 'Jeton utilisateur invalide.' } });
    }

    if (!config.supabaseAnonKey) {
      fastify.log.error('SUPABASE_ANON_KEY is required to create authenticated pack requests.');
      return reply.status(503).send({ error: { message: 'Création de demande temporairement indisponible.' } });
    }

    const response = await fetch(`${config.supabaseUrl}/rest/v1/rpc/axis_request_pack`, {
      method: 'POST',
      headers: {
        apikey: config.supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_pack_code: body.pack_code.trim() }),
    });
    const result = await response.json() as Record<string, unknown>;
    if (!response.ok) {
      fastify.log.error({ statusCode: response.status, result }, 'Pack request RPC failed.');
      return reply.status(response.status).send(result);
    }
    const httpStatus = typeof result.http_status === 'number' ? result.http_status : 200;
    return reply.status(httpStatus).send(result);
  });

  fastify.get('/tiers', async (_request, reply) => {
    const { data, error } = await supabase
      .from('subscription_packs')
      .select('code, tier_number, family_name, name, price_xof, credit_usd, description, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      return reply.status(500).send({ error: error.message });
    }

    return reply.send({
      object: 'list',
      formula: 'max_model_cost_per_million_usd = pack.credit_usd / 40',
      data: data || [],
    });
  });
};
