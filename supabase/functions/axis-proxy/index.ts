// Supabase Edge Function: axis-proxy
// Compatible with Deno runtime and deployable with: supabase functions deploy axis-proxy

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

async function sha256(str: string): Promise<string> {
  const buffer = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req: Request) => {
  // Gestion du pre-flight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // Health check
  if (url.pathname.endsWith('/health')) {
    return new Response(JSON.stringify({ status: 'ok', service: 'Axis Supabase Edge Proxy' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({
        error: { message: 'Missing Authorization header', code: 'UNAUTHORIZED' },
      }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const rawKey = authHeader.replace(/^Bearer\s+/i, '').trim();
  const keyHash = await sha256(rawKey);

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY') || '';

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json();
    const model = body.model || 'axis-auto';
    const isStream = Boolean(body.stream);
    const maxTokens = body.max_tokens || 1024;

    // 1. Détermination du modèle cible
    let targetModel = model;
    if (model === 'axis-auto' || model === 'auto') {
      targetModel = 'openai/gpt-4o-mini';
    } else if (model === 'axis-free') {
      targetModel = 'meta-llama/llama-3.3-70b-instruct:free';
    } else if (model === 'axis-performance') {
      targetModel = 'anthropic/claude-3.5-sonnet';
    }

    // 2. Gatekeeper RPC
    const { data: gatekeeper, error: gkErr } = await supabase.rpc('axis_gatekeeper_validate', {
      p_key_hash: keyHash,
      p_model_id: targetModel,
      p_input_tokens: 100,
      p_max_output_tokens: maxTokens,
    });

    if (gkErr || !gatekeeper.is_allowed) {
      return new Response(
        JSON.stringify({
          error: {
            message: gatekeeper?.error_message || gkErr?.message || 'Rejected by Gatekeeper',
            code: gatekeeper?.error_code || 'FORBIDDEN',
            balance_usd: gatekeeper?.current_balance_usd,
          },
        }),
        {
          status: gatekeeper?.http_status || 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 3. Appel OpenRouter
    const openRouterPayload = { ...body, model: targetModel };
    const upstreamRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openRouterApiKey}`,
        'HTTP-Referer': 'https://axis-ai.network',
        'X-Title': 'Axis Supabase Proxy',
      },
      body: JSON.stringify(openRouterPayload),
    });

    // 4. Si streaming
    if (isStream) {
      return new Response(upstreamRes.body, {
        status: upstreamRes.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // 5. Non-streaming
    const resData = await upstreamRes.json();
    const promptTokens = resData.usage?.prompt_tokens || 100;
    const completionTokens = resData.usage?.completion_tokens || 100;

    // Décompte de solde asynchrone
    EdgeRuntime.waitUntil(
      supabase.rpc('axis_settle_usage', {
        p_key_hash: keyHash,
        p_model_id: targetModel,
        p_input_tokens: promptTokens,
        p_output_tokens: completionTokens,
        p_duration_ms: 500,
        p_status_code: upstreamRes.status,
      })
    );

    return new Response(JSON.stringify(resData), {
      status: upstreamRes.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
