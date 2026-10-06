-- ==============================================================================
-- AXIS AI — MIGRATION 005b : Fix axis_gatekeeper_validate
-- Ajoute la vérification de is_enabled sur la clé API.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.axis_gatekeeper_validate(
    p_key_hash VARCHAR, p_model_id VARCHAR,
    p_input_tokens INTEGER, p_max_output_tokens INTEGER
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_key RECORD; v_sub RECORD; v_model RECORD; v_tier RECORD;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_input_cost NUMERIC(14,6); v_output_cost NUMERIC(14,6);
    v_est_total_cost NUMERIC(14,6);
BEGIN
    SELECT id, user_id, subscription_id, is_enabled INTO v_key
      FROM public.api_keys WHERE key_hash = p_key_hash;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('is_allowed', false, 'http_status', 401,
            'error_code', 'INVALID_API_KEY', 'error_message', 'Clé API introuvable.');
    END IF;
    IF NOT v_key.is_enabled THEN
        RETURN jsonb_build_object('is_allowed', false, 'http_status', 403,
            'error_code', 'KEY_DISABLED', 'error_message', 'Clé API désactivée.');
    END IF;
    IF v_key.subscription_id IS NULL THEN
        SELECT * INTO v_model FROM public.models WHERE id = p_model_id;
        IF FOUND AND (v_model.input_cost_per_token + v_model.output_cost_per_token) = 0 THEN
            RETURN jsonb_build_object('is_allowed', true, 'http_status', 200, 'is_free', true,
                'api_key_id', v_key.id, 'subscription_id', NULL::UUID, 'tier_number', 0,
                'model_id', p_model_id, 'power_level', v_model.tier,
                'current_balance_usd', 0::NUMERIC(14,6), 'estimated_cost_usd', 0::NUMERIC(14,6),
                'message', 'Accès libre sans abonnement.');
        END IF;
        RETURN jsonb_build_object('is_allowed', false, 'http_status', 402,
            'error_code', 'NO_SUBSCRIPTION', 'error_message', 'Aucun abonnement.');
    END IF;
    SELECT * INTO v_sub FROM public.subscriptions WHERE id = v_key.subscription_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('is_allowed', false, 'http_status', 404,
            'error_code', 'SUBSCRIPTION_NOT_FOUND', 'error_message', 'Abonnement introuvable.');
    END IF;
    IF v_sub.status != 'active' OR v_sub.expires_at <= v_now OR v_sub.balance_usd <= 0 THEN
        DECLARE v_pending RECORD; BEGIN
            SELECT * INTO v_pending FROM public.subscriptions
             WHERE user_id = v_sub.user_id AND status = 'pending_validation'
               AND expires_at > v_now AND balance_usd > 0
             ORDER BY created_at DESC LIMIT 1 FOR UPDATE SKIP LOCKED;
            IF FOUND THEN
                UPDATE public.subscriptions SET status = 'active', is_active = true,
                    starts_at = v_now, expires_at = v_now + INTERVAL '30 days', updated_at = v_now
                WHERE id = v_pending.id;
                UPDATE public.api_keys SET subscription_id = v_pending.id,
                    is_enabled = true, updated_at = v_now WHERE id = v_key.id;
                v_key.is_enabled := true;
                SELECT * INTO v_sub FROM public.subscriptions WHERE id = v_pending.id;
            ELSE
                IF v_sub.status = 'active' THEN
                    UPDATE public.subscriptions SET status = CASE WHEN balance_usd <= 0 THEN 'depleted' ELSE 'expired' END,
                        is_active = false, updated_at = v_now WHERE id = v_sub.id;
                END IF;
                RETURN jsonb_build_object('is_allowed', false, 'http_status', 402,
                    'error_code', CASE WHEN v_sub.balance_usd <= 0 THEN 'SUBSCRIPTION_DEPLETED' ELSE 'SUBSCRIPTION_EXPIRED' END,
                    'error_message', 'Abonnement expiré ou budget épuisé.', 'current_balance_usd', v_sub.balance_usd);
            END IF;
        END;
    END IF;
    SELECT * INTO v_model FROM public.models WHERE id = p_model_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('is_allowed', false, 'http_status', 404,
            'error_code', 'MODEL_NOT_FOUND', 'error_message', 'Modèle non trouvé.', 'model_id', p_model_id);
    END IF;
    SELECT * INTO v_tier FROM public.tiers WHERE tier_number = v_sub.tier_number;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('is_allowed', false, 'http_status', 500,
            'error_code', 'TIER_NOT_FOUND', 'error_message', 'Palier introuvable.');
    END IF;
    v_input_cost := GREATEST(0, p_input_tokens) * v_model.input_cost_per_token;
    v_output_cost := GREATEST(0, p_max_output_tokens) * v_model.output_cost_per_token;
    v_est_total_cost := v_input_cost + v_output_cost;
    IF v_sub.balance_usd >= v_est_total_cost THEN
        RETURN jsonb_build_object('is_allowed', true, 'http_status', 200,
            'api_key_id', v_key.id, 'subscription_id', v_sub.id,
            'tier_number', v_tier.tier_number, 'model_id', p_model_id,
            'power_level', v_model.tier,
            'current_balance_usd', v_sub.balance_usd,
            'estimated_cost_usd', v_est_total_cost,
            'fallback_model_id', v_model.fallback_model_id);
    END IF;
    RETURN jsonb_build_object('is_allowed', false, 'http_status', 402,
        'error_code', 'INSUFFICIENT_BALANCE',
        'error_message', format('Solde insuffisant ($%s) pour couvrir la requête ($%s).', v_sub.balance_usd, round(v_est_total_cost, 6)),
        'current_balance_usd', v_sub.balance_usd, 'estimated_cost_usd', v_est_total_cost);
END; $$;