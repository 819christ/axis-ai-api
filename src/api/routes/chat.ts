import { FastifyPluginAsync } from 'fastify';
import { hashApiKey, validateWithGatekeeper, settleUsage, supabase } from '../../db/supabase.js';
import { resolveAxisRoute, estimateTokens } from '../../router/axis-auto.js';
import { executeCompletionWithFallback, executeStreamingCompletion } from '../../openrouter/client.js';
import { config } from '../../config/env.js';

export const chatRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/chat/completions', async (request, reply) => {
    const startTime = Date.now();

    // 1. Extraction et validation de la clé API Bearer
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        error: {
          message: 'Clé API manquante. Utilisez le format Authorization: Bearer <votre_clé>',
          type: 'authentication_error',
          code: 'MISSING_API_KEY',
        },
      });
    }

    const rawApiKey = authHeader.replace(/^Bearer\s+/i, '').trim();
    const keyHash = hashApiKey(rawApiKey);

    // 2. Extraction du corps de requête OpenAI
    const body = request.body as any;
    if (!body || !Array.isArray(body.messages)) {
      return reply.status(400).send({
        error: {
          message: 'Le champ "messages" est obligatoire et doit être un tableau.',
          type: 'invalid_request_error',
          code: 'INVALID_REQUEST',
        },
      });
    }

    const requestedModel = body.model || 'axis-auto';
    const isStream = Boolean(body.stream);
    const maxTokens = body.max_tokens || body.max_completion_tokens || config.defaultMaxOutputTokens;

    // 3. Récupération du palier de l'utilisateur pour le routage intelligent
    let userTierNumber = 1;
    try {
      const { data: keyData } = await supabase
        .from('api_keys')
        .select('subscription_id, subscriptions(tier_number)')
        .eq('key_hash', keyHash)
        .maybeSingle();

      const sub = keyData?.subscriptions as any;
      if (sub?.tier_number) {
        userTierNumber = sub.tier_number;
      }
    } catch {
      // Valeur par défaut : palier 1
      userTierNumber = 1;
    }

    // 4. Routage intelligent Axis Auto (Flux en 2 étapes : Décision puis Exécution)
    const route = resolveAxisRoute(requestedModel, body.messages, userTierNumber, body.tools);
    const estimatedInputTokens = estimateTokens(body.messages);

    // 5. Validation atomique Gatekeeper via procédure RPC PostgreSQL pure
    const gatekeeperResult = await validateWithGatekeeper(
      keyHash,
      route.targetModel,
      estimatedInputTokens,
      maxTokens
    );

    if (!gatekeeperResult.is_allowed) {
      const httpStatus = gatekeeperResult.http_status || 402;
      return reply.status(httpStatus).send({
        error: {
          message: gatekeeperResult.error_message || 'Requête refusée par le Gatekeeper.',
          type: gatekeeperResult.error_code || 'gatekeeper_rejection',
          code: gatekeeperResult.error_code || 'FORBIDDEN',
          details: gatekeeperResult.details || null,
          current_balance_usd: gatekeeperResult.current_balance_usd,
          estimated_cost_usd: gatekeeperResult.estimated_cost_usd,
        },
      });
    }

    // 6. Chaîne de secours
    const candidateModels = [
      ...(gatekeeperResult.fallback_model_id ? [gatekeeperResult.fallback_model_id] : []),
      ...route.fallbackChain,
    ];

    const openRouterPayload = {
      ...body,
      model: route.targetModel,
    };

    // 7. Mode STREAMING (Server-Sent Events)
    if (isStream) {
      try {
        const streamResult = await executeStreamingCompletion(openRouterPayload, candidateModels);
        const upstreamResponse = streamResult.response;

        if (!upstreamResponse.ok || !upstreamResponse.body) {
          const errText = await upstreamResponse.text();
          return reply.status(upstreamResponse.status).send({
            error: {
              message: `Erreur upstream OpenRouter: ${errText}`,
              type: 'upstream_error',
              code: 'OPENROUTER_ERROR',
            },
          });
        }

        reply.raw.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Axis-Model': streamResult.modelUsed,
          'X-Axis-Power-Level': route.powerLevel,
          'X-Axis-Tier': String(gatekeeperResult.tier_number || userTierNumber),
          'X-Axis-Fallback': streamResult.fallbackOccurred ? 'true' : 'false',
        });

        let outputTokensCount = 0;
        let streamClosed = false;

        const reader = upstreamResponse.body.getReader();
        const decoder = new TextDecoder();

        const processStream = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              reply.raw.write(value);

              const chunkText = decoder.decode(value, { stream: true });
              const lines = chunkText.split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ') && !line.includes('[DONE]')) {
                  try {
                    const parsed = JSON.parse(line.slice(6));
                    if (parsed.usage) {
                      outputTokensCount = parsed.usage.completion_tokens || outputTokensCount;
                    } else if (parsed.choices?.[0]?.delta?.content) {
                      outputTokensCount += Math.max(1, Math.ceil(parsed.choices[0].delta.content.length / 3.8));
                    }
                  } catch {}
                }
              }
            }
          } catch (err) {
            console.error('[Streaming Error]', err);
          } finally {
            if (!streamClosed) {
              streamClosed = true;
              reply.raw.end();
            }

            // Décompte de sortie découplé via RPC PostgreSQL
            const durationMs = Date.now() - startTime;
            const finalOutputTokens = Math.max(1, outputTokensCount);
            settleUsage({
              keyHash,
              modelId: streamResult.modelUsed,
              inputTokens: estimatedInputTokens,
              outputTokens: finalOutputTokens,
              durationMs,
              statusCode: 200,
            }).catch((err) => console.error('[Stream Settlement Error]', err));
          }
        };

        await processStream();
        return reply;
      } catch (streamErr: any) {
        console.error('[Streaming Init Error]', streamErr);
        return reply.status(500).send({
          error: {
            message: 'Erreur lors de l\'initialisation du streaming.',
            details: streamErr.message,
          },
        });
      }
    }

    // 8. Mode NON-STREAMING (JSON Standard)
    const completionResult = await executeCompletionWithFallback(
      openRouterPayload,
      candidateModels
    );

    const durationMs = Date.now() - startTime;

    // Décompte asynchrone découplé via RPC PostgreSQL
    queueMicrotask(() => {
      settleUsage({
        keyHash,
        modelId: completionResult.modelUsed,
        inputTokens: completionResult.promptTokens || estimatedInputTokens,
        outputTokens: completionResult.completionTokens,
        durationMs,
        statusCode: completionResult.statusCode,
        errorMessage: completionResult.statusCode >= 400 ? JSON.stringify(completionResult.body) : null,
      }).catch((settleErr) => {
        console.error('[Settlement Error]', settleErr);
      });
    });

    reply
      .header('X-Axis-Model', completionResult.modelUsed)
      .header('X-Axis-Power-Level', route.powerLevel)
      .header('X-Axis-Tier', String(gatekeeperResult.tier_number || userTierNumber))
      .header('X-Axis-Fallback', completionResult.fallbackOccurred ? 'true' : 'false')
      .header('X-Axis-Routing-Reason', route.routingReason)
      .header('X-Axis-Latency-Ms', durationMs.toString())
      .status(completionResult.statusCode)
      .send(completionResult.body);
  });
};
