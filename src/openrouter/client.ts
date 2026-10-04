import { config } from '../config/env.js';

export interface OpenRouterChatRequest {
  model: string;
  messages: any[];
  stream?: boolean;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  tools?: any[];
  [key: string]: any;
}

export interface NonStreamingCompletionResult {
  statusCode: number;
  body: any;
  modelUsed: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  fallbackOccurred: boolean;
}

/**
 * Envoie une requête de complétion non-streamée à OpenRouter avec gestion automatique de Fallback
 */
export async function executeCompletionWithFallback(
  reqBody: OpenRouterChatRequest,
  candidateModels: string[]
): Promise<NonStreamingCompletionResult> {
  const modelsToTry = [reqBody.model, ...(candidateModels || [])];
  // Éliminer les doublons
  const uniqueModels = Array.from(new Set(modelsToTry));

  let lastError: any = null;
  let lastStatus = 500;

  for (let i = 0; i < uniqueModels.length; i++) {
    const currentModel = uniqueModels[i];
    const isFallback = i > 0;

    if (isFallback) {
      console.warn(`[Axis Fallback] Basculement automatique vers le modèle de secours : ${currentModel}`);
    }

    try {
      const payload = {
        ...reqBody,
        model: currentModel,
        stream: false,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.proxyTimeoutMs);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.openRouterApiKey}`,
        'HTTP-Referer': 'https://axis-ai.network',
        'X-Title': 'Axis AI Proxy Gatekeeper',
      };

      const res = await fetch(`${config.openRouterBaseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Si erreur serveur temporaire (502, 503, 504, 429) et qu'il reste un modèle de secours, tenter le suivant
      if ((res.status === 502 || res.status === 503 || res.status === 504 || res.status === 429) && i < uniqueModels.length - 1) {
        console.warn(`[OpenRouter HTTP ${res.status}] Erreur sur ${currentModel}, tentative avec secours...`);
        lastStatus = res.status;
        lastError = await res.text();
        continue;
      }

      const json = (await res.json()) as any;

      if (res.ok) {
        const usage = json.usage || {};
        return {
          statusCode: res.status,
          body: json,
          modelUsed: currentModel,
          promptTokens: usage.prompt_tokens || 0,
          completionTokens: usage.completion_tokens || 0,
          totalTokens: usage.total_tokens || 0,
          fallbackOccurred: isFallback,
        };
      } else {
        // Si OpenRouter a renvoyé une erreur JSON spécifique (ex: modèle surchargé)
        if (i < uniqueModels.length - 1) {
          console.warn(`[OpenRouter API Error] ${JSON.stringify(json)}, tentative avec secours...`);
          lastStatus = res.status;
          lastError = json;
          continue;
        }
        return {
          statusCode: res.status,
          body: json,
          modelUsed: currentModel,
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          fallbackOccurred: isFallback,
        };
      }
    } catch (err: any) {
      console.error(`[OpenRouter Network Error] Erreur sur ${currentModel}:`, err?.message || err);
      lastError = err;
      if (i < uniqueModels.length - 1) {
        continue;
      }
    }
  }

  // Si tous les modèles ont échoué
  return {
    statusCode: lastStatus || 503,
    body: {
      error: {
        message: `Tous les modèles du pool (${uniqueModels.join(', ')}) sont actuellement indisponibles.`,
        type: 'axis_upstream_unavailable',
        details: lastError?.message || lastError,
      },
    },
    modelUsed: reqBody.model,
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    fallbackOccurred: uniqueModels.length > 1,
  };
}

/**
 * Lance un appel en streaming vers OpenRouter avec streaming direct (Zero-Latency Piping)
 */
export async function executeStreamingCompletion(
  reqBody: OpenRouterChatRequest,
  candidateModels: string[]
): Promise<{
  response: Response;
  modelUsed: string;
  fallbackOccurred: boolean;
}> {
  const modelsToTry = [reqBody.model, ...(candidateModels || [])];
  const uniqueModels = Array.from(new Set(modelsToTry));

  for (let i = 0; i < uniqueModels.length; i++) {
    const currentModel = uniqueModels[i];
    const isFallback = i > 0;

    if (isFallback) {
      console.warn(`[Axis Stream Fallback] Tentative de streaming sur le modèle de secours : ${currentModel}`);
    }

    try {
      const payload = {
        ...reqBody,
        model: currentModel,
        stream: true,
        stream_options: { include_usage: true },
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.openRouterApiKey}`,
        'HTTP-Referer': 'https://axis-ai.network',
        'X-Title': 'Axis AI Proxy Gatekeeper',
      };

      const res = await fetch(`${config.openRouterBaseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      // Si erreur 502/503/504 et qu'il reste des alternatives
      if ((res.status === 502 || res.status === 503 || res.status === 504) && i < uniqueModels.length - 1) {
        continue;
      }

      return {
        response: res,
        modelUsed: currentModel,
        fallbackOccurred: isFallback,
      };
    } catch (err) {
      if (i < uniqueModels.length - 1) {
        continue;
      }
      throw err;
    }
  }

  throw new Error('Impossible d\'initier le flux de streaming avec les modèles sélectionnés.');
}
