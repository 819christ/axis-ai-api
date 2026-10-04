-- ==============================================================================
-- ACCESS AI / AXIS PROXY - SEED DATA (Models catalogue & fallback rules)
-- ==============================================================================

INSERT INTO public.models (id, name, input_cost_per_token, output_cost_per_token, tier, context_length, fallback_model_id, is_active)
VALUES
    -- Modèles Gratuits (Tier: free, Coût: 0.00)
    ('meta-llama/llama-3.3-70b-instruct:free', 'Llama 3.3 70B Instruct (Free)', 0.0, 0.0, 'free', 131072, 'google/gemini-2.0-flash-exp:free', true),
    ('google/gemini-2.0-flash-exp:free', 'Gemini 2.0 Flash Experimental (Free)', 0.0, 0.0, 'free', 1048576, 'mistralai/mistral-7b-instruct:free', true),
    ('mistralai/mistral-7b-instruct:free', 'Mistral 7B Instruct (Free)', 0.0, 0.0, 'free', 32768, 'meta-llama/llama-3.3-70b-instruct:free', true),
    ('qwen/qwen-2.5-coder-32b-instruct:free', 'Qwen 2.5 Coder 32B (Free)', 0.0, 0.0, 'free', 32768, 'meta-llama/llama-3.3-70b-instruct:free', true),

    -- Modèles Économiques (Tier: economy, Rapides & abordables)
    ('openai/gpt-4o-mini', 'GPT-4o Mini', 0.00000015, 0.00000060, 'economy', 128000, 'google/gemini-2.0-flash-001', true),
    ('google/gemini-2.0-flash-001', 'Gemini 2.0 Flash', 0.00000010, 0.00000040, 'economy', 1048576, 'openai/gpt-4o-mini', true),
    ('deepseek/deepseek-chat', 'DeepSeek V3 (Chat)', 0.00000014, 0.00000028, 'economy', 64000, 'openai/gpt-4o-mini', true),
    ('anthropic/claude-3-haiku', 'Claude 3 Haiku', 0.00000025, 0.00000125, 'economy', 200000, 'openai/gpt-4o-mini', true),
    ('meta-llama/llama-3.1-8b-instruct', 'Llama 3.1 8B Instruct', 0.00000005, 0.00000005, 'economy', 131072, 'openai/gpt-4o-mini', true),

    -- Modèles Haute Performance (Tier: performance, Fort raisonnement, Code complexe)
    ('anthropic/claude-3.5-sonnet', 'Claude 3.5 Sonnet', 0.00000300, 0.00001500, 'performance', 200000, 'openai/gpt-4o', true),
    ('openai/gpt-4o', 'GPT-4o', 0.00000250, 0.00001000, 'performance', 128000, 'anthropic/claude-3.5-sonnet', true),
    ('deepseek/deepseek-r1', 'DeepSeek R1 (Reasoning)', 0.00000055, 0.00000219, 'performance', 64000, 'openai/gpt-4o', true),
    ('openai/o1-mini', 'OpenAI o1 Mini', 0.00000300, 0.00001200, 'performance', 128000, 'openai/gpt-4o-mini', true),
    ('google/gemini-pro-1.5', 'Gemini 1.5 Pro', 0.00000125, 0.00000500, 'performance', 2097152, 'openai/gpt-4o', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    input_cost_per_token = EXCLUDED.input_cost_per_token,
    output_cost_per_token = EXCLUDED.output_cost_per_token,
    tier = EXCLUDED.tier,
    context_length = EXCLUDED.context_length,
    fallback_model_id = EXCLUDED.fallback_model_id,
    updated_at = timezone('utc'::text, now());
