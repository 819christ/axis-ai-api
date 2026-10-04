import { supabase } from '../src/db/supabase.js';

interface OpenRouterModel {
  id: string;
  name: string;
  pricing?: {
    prompt?: string | number;
    completion?: string | number;
  };
  context_length?: number;
}

export async function syncOpenRouterModels() {
  console.log('[Sync] Récupération du catalogue des modèles depuis OpenRouter...');

  try {
    const res = await fetch('https://openrouter.ai/api/v1/models');
    if (!res.ok) {
      throw new Error(`OpenRouter models API returned HTTP ${res.status}`);
    }

    const data = (await res.json()) as any;
    const modelsList: OpenRouterModel[] = data.data || [];
    console.log(`[Sync] ${modelsList.length} modèles reçus depuis OpenRouter.`);

    const formattedModels = modelsList.map((m) => {
      const inputCostPerToken = parseFloat(String(m.pricing?.prompt || '0'));
      const outputCostPerToken = parseFloat(String(m.pricing?.completion || '0'));

      let tier: 'free' | 'economy' | 'performance' = 'economy';
      if (inputCostPerToken === 0 && outputCostPerToken === 0) {
        tier = 'free';
      } else if (inputCostPerToken >= 0.0000015 || outputCostPerToken >= 0.000005) {
        // Au dessus de $1.50 / million tokens en entrée ou $5.00 en sortie -> Performance
        tier = 'performance';
      } else {
        tier = 'economy';
      }

      // Définition d'un fallback approprié
      let fallbackModelId: string | null = null;
      if (tier === 'free') {
        fallbackModelId = 'meta-llama/llama-3.3-70b-instruct:free';
      } else if (tier === 'economy') {
        fallbackModelId = 'openai/gpt-4o-mini';
      } else {
        fallbackModelId = 'anthropic/claude-3.5-sonnet';
      }

      if (fallbackModelId === m.id) {
        fallbackModelId = null;
      }

      return {
        id: m.id,
        name: m.name || m.id,
        input_cost_per_token: inputCostPerToken,
        output_cost_per_token: outputCostPerToken,
        tier,
        context_length: m.context_length || 128000,
        fallback_model_id: fallbackModelId,
        is_active: true,
        updated_at: new Date().toISOString(),
      };
    });

    console.log(`[Sync] Insertion / Mise à jour dans Supabase (table public.models)...`);

    // Batch insert par paquets de 100 pour respecter les limites
    const chunkSize = 100;
    for (let i = 0; i < formattedModels.length; i += chunkSize) {
      const chunk = formattedModels.slice(i, i + chunkSize);
      const { error } = await supabase.from('models').upsert(chunk, {
        onConflict: 'id',
      });

      if (error) {
        console.error(`[Sync Chunk Error]`, error);
      } else {
        console.log(`[Sync] Lot ${Math.floor(i / chunkSize) + 1}/${Math.ceil(formattedModels.length / chunkSize)} synchronisé.`);
      }
    }

    console.log('[Sync] ✅ Synchronisation terminée avec succès !');
  } catch (err: any) {
    console.error('[Sync Error]', err.message || err);
  }
}

// Exécution directe si appelé par ligne de commande
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  syncOpenRouterModels();
}
