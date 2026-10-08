-- Axis AI pay-as-you-go packs: three cumulative model pools and nine fixed-credit offers.
CREATE TABLE IF NOT EXISTS public.subscription_packs (
    code TEXT PRIMARY KEY,
    tier_number INTEGER NOT NULL CHECK (tier_number BETWEEN 1 AND 3),
    family_name VARCHAR(80) NOT NULL,
    name VARCHAR(80) NOT NULL,
    price_xof INTEGER NOT NULL CHECK (price_xof > 0),
    credit_usd NUMERIC(14, 6) NOT NULL CHECK (credit_usd > 0),
    description TEXT NOT NULL,
    sort_order SMALLINT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true
);

INSERT INTO public.subscription_packs
    (code, tier_number, family_name, name, price_xof, credit_usd, description, sort_order)
VALUES
    ('starter-light', 1, 'Étudiant & Découverte', 'Starter Light', 1500, 1.50, 'Pour les résumés, la rédaction et les petits workflows.', 1),
    ('starter-standard', 1, 'Étudiant & Découverte', 'Starter Standard', 2500, 2.50, 'Pour un usage régulier de chatbots et de traduction.', 2),
    ('starter-plus', 1, 'Étudiant & Découverte', 'Starter Plus', 4500, 4.50, 'Pour tester des scripts simples et de petits contextes.', 3),
    ('pro-starter', 2, 'Pro & Automatisation', 'Pro Starter', 7500, 7.50, 'Pour quelques micro-automatisations par jour.', 4),
    ('pro-standard', 2, 'Pro & Automatisation', 'Pro Standard', 12000, 12.00, 'Pour le code et des mini-agents réguliers.', 5),
    ('pro-advanced', 2, 'Pro & Automatisation', 'Pro Advanced', 18000, 18.00, 'Pour des flux d’automatisation plus intensifs.', 6),
    ('business-light', 3, 'Entreprise & Scale', 'Business Light', 22000, 22.00, 'Pour une agence ou startup en phase de production.', 7),
    ('business-standard', 3, 'Entreprise & Scale', 'Business Standard', 26000, 26.00, 'Pour des agents autonomes et des processus soutenus.', 8),
    ('business-ultimate', 3, 'Entreprise & Scale', 'Business Ultimate', 30000, 30.00, 'Pour les requêtes complexes et l’ingénierie avancée.', 9)
ON CONFLICT (code) DO UPDATE SET
    tier_number = EXCLUDED.tier_number,
    family_name = EXCLUDED.family_name,
    name = EXCLUDED.name,
    price_xof = EXCLUDED.price_xof,
    credit_usd = EXCLUDED.credit_usd,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order,
    is_active = true;

ALTER TABLE public.subscriptions
    ADD COLUMN IF NOT EXISTS package_code TEXT REFERENCES public.subscription_packs(code),
    ADD COLUMN IF NOT EXISTS package_name VARCHAR(80),
    ADD COLUMN IF NOT EXISTS price_xof INTEGER;

ALTER TABLE public.subscriptions ALTER COLUMN expires_at DROP NOT NULL;
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS chk_sub_dates;

-- Existing active and pending packs retain their balances but no longer expire by date.
UPDATE public.subscriptions
SET expires_at = NULL,
    updated_at = timezone('utc'::text, now())
WHERE status IN ('active', 'pending', 'pending_validation')
  AND expires_at IS NOT NULL;

ALTER TABLE public.subscription_packs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Active packs are readable" ON public.subscription_packs;
CREATE POLICY "Active packs are readable"
    ON public.subscription_packs FOR SELECT
    USING (is_active = true);
GRANT SELECT ON public.subscription_packs TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.axis_request_pack(p_pack_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_pack RECORD;
    v_subscription_id UUID;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'http_status', 401,
            'error_code', 'AUTHENTICATION_REQUIRED', 'error_message', 'Connectez-vous pour commander un pack.');
    END IF;

    SELECT * INTO v_pack
    FROM public.subscription_packs
    WHERE code = lower(trim(p_pack_code)) AND is_active = true;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'http_status', 404,
            'error_code', 'PACK_NOT_FOUND', 'error_message', 'Ce pack est introuvable ou indisponible.');
    END IF;

    INSERT INTO public.subscriptions (
        user_id, tier_number, package_code, package_name, price_xof,
        budget_amount_usd, balance_usd, consumed_usd, starts_at, expires_at,
        status, is_active, commission_status
    ) VALUES (
        v_user_id, v_pack.tier_number, v_pack.code, v_pack.name, v_pack.price_xof,
        v_pack.credit_usd, v_pack.credit_usd, 0, v_now, NULL,
        'pending_validation', false, 'none'
    )
    RETURNING id INTO v_subscription_id;

    RETURN jsonb_build_object(
        'success', true,
        'http_status', 201,
        'subscription_id', v_subscription_id,
        'status', 'pending_validation',
        'tier_number', v_pack.tier_number,
        'package_code', v_pack.code,
        'package_name', v_pack.name,
        'price_xof', v_pack.price_xof,
        'credit_usd', v_pack.credit_usd,
        'expires_at', NULL
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.axis_request_pack(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.axis_moderator_validate_subscription_by_code(
    p_subscription_id UUID,
    p_moderator_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_sub RECORD;
    v_moderator RECORD;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    SELECT * INTO v_sub
    FROM public.subscriptions
    WHERE id = p_subscription_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'http_status', 404,
            'error_message', 'Demande de pack introuvable.');
    END IF;
    IF v_user_id IS NULL OR v_user_id <> v_sub.user_id THEN
        RETURN jsonb_build_object('success', false, 'http_status', 403,
            'error_message', 'Cette demande ne vous appartient pas.');
    END IF;
    IF v_sub.status <> 'pending_validation' THEN
        RETURN jsonb_build_object('success', false, 'http_status', 409,
            'error_message', 'Cette demande a déjà été traitée.');
    END IF;

    SELECT id, moderator_code INTO v_moderator
    FROM public.profiles
    WHERE moderator_code = upper(trim(p_moderator_code))
      AND role = 'moderator';
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'http_status', 404,
            'error_code', 'INVALID_MODERATOR_CODE',
            'error_message', 'Code modérateur invalide ou inactif.');
    END IF;

    UPDATE public.subscriptions
    SET status = 'active',
        is_active = true,
        moderator_id = v_moderator.id,
        moderator_code_used = v_moderator.moderator_code,
        validated_by = v_moderator.id,
        validated_at = v_now,
        commission_status = 'unpaid',
        updated_at = v_now
    WHERE id = p_subscription_id;

    RETURN jsonb_build_object('success', true, 'http_status', 200,
        'subscription_id', p_subscription_id, 'status', 'active',
        'moderator_code', v_moderator.moderator_code,
        'message', 'Pack activé après validation par le modérateur.');
END;
$$;

GRANT EXECUTE ON FUNCTION public.axis_moderator_validate_subscription_by_code(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.enforce_key_requires_active_sub()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role TEXT;
    v_is_valid BOOLEAN := false;
BEGIN
    IF NEW.is_enabled IS NOT TRUE THEN
        RETURN NEW;
    END IF;

    SELECT role INTO v_role FROM public.profiles WHERE id = NEW.user_id;
    IF v_role = 'admin' THEN
        RETURN NEW;
    END IF;

    IF NEW.subscription_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1
            FROM public.subscriptions
            WHERE id = NEW.subscription_id
              AND user_id = NEW.user_id
              AND status = 'active'
              AND is_active = true
              AND (expires_at IS NULL OR expires_at > now())
              AND balance_usd > 0
        ) INTO v_is_valid;
    END IF;

    IF NOT v_is_valid THEN
        NEW.is_enabled := false;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.axis_gatekeeper_validate(
    p_key_hash VARCHAR,
    p_model_id VARCHAR,
    p_input_tokens INTEGER,
    p_max_output_tokens INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_key RECORD;
    v_sub RECORD;
    v_model RECORD;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_input_cost NUMERIC(18, 10);
    v_output_cost NUMERIC(18, 10);
    v_estimated_cost NUMERIC(18, 10);
    v_is_test_model BOOLEAN;
BEGIN
    SELECT id, user_id, subscription_id, is_enabled
    INTO v_key
    FROM public.api_keys
    WHERE key_hash = p_key_hash;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('is_allowed', false, 'http_status', 401,
            'error_code', 'INVALID_API_KEY', 'error_message', 'Clé API introuvable.');
    END IF;
    IF NOT v_key.is_enabled THEN
        RETURN jsonb_build_object('is_allowed', false, 'http_status', 403,
            'error_code', 'KEY_DISABLED', 'error_message', 'Clé API désactivée.');
    END IF;
    IF v_key.subscription_id IS NULL THEN
        RETURN jsonb_build_object('is_allowed', false, 'http_status', 402,
            'error_code', 'NO_SUBSCRIPTION', 'error_message', 'Un pack actif est requis pour utiliser cette clé.');
    END IF;

    SELECT * INTO v_sub
    FROM public.subscriptions
    WHERE id = v_key.subscription_id
    FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('is_allowed', false, 'http_status', 404,
            'error_code', 'SUBSCRIPTION_NOT_FOUND', 'error_message', 'Pack introuvable.');
    END IF;
    IF v_sub.status = 'disabled' THEN
        RETURN jsonb_build_object('is_allowed', false, 'http_status', 403,
            'error_code', 'SUBSCRIPTION_DISABLED_BY_ADMIN',
            'error_message', coalesce(v_sub.disabled_reason, 'Votre pack a été désactivé par l’administration.'));
    END IF;
    IF v_sub.status <> 'active' OR NOT v_sub.is_active
       OR (v_sub.expires_at IS NOT NULL AND v_sub.expires_at <= v_now)
       OR v_sub.balance_usd <= 0 THEN
        IF v_sub.status = 'active' THEN
            UPDATE public.subscriptions
            SET status = CASE WHEN balance_usd <= 0 THEN 'depleted' ELSE 'expired' END,
                is_active = false,
                updated_at = v_now
            WHERE id = v_sub.id;
        END IF;
        RETURN jsonb_build_object('is_allowed', false, 'http_status', 402,
            'error_code', CASE WHEN v_sub.balance_usd <= 0 THEN 'SUBSCRIPTION_DEPLETED' ELSE 'SUBSCRIPTION_INACTIVE' END,
            'error_message', 'Le pack associé est inactif ou son crédit est épuisé.',
            'current_balance_usd', v_sub.balance_usd);
    END IF;

    SELECT id, input_cost_per_token, output_cost_per_token, combined_cost_per_million_usd,
           fallback_model_id, tier, power_level
    INTO v_model
    FROM public.models
    WHERE id = p_model_id AND is_active = true;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('is_allowed', false, 'http_status', 404,
            'error_code', 'MODEL_NOT_FOUND', 'error_message', 'Modèle non répertorié dans le catalogue Axis.');
    END IF;

    v_is_test_model := v_model.input_cost_per_token = 0 AND v_model.output_cost_per_token = 0;
    IF NOT v_is_test_model
       AND v_model.combined_cost_per_million_usd > (v_sub.budget_amount_usd / 40.0) THEN
        RETURN jsonb_build_object('is_allowed', false, 'http_status', 403,
            'error_code', 'MODEL_NOT_PERMITTED_FOR_PACK',
            'error_message', 'Ce modèle ne respecte pas le seuil de volume minimal du pack.',
            'maximum_model_cost_per_million_usd', v_sub.budget_amount_usd / 40.0,
            'model_cost_per_million_usd', v_model.combined_cost_per_million_usd);
    END IF;

    IF v_is_test_model THEN
        RETURN jsonb_build_object('is_allowed', true, 'http_status', 200, 'is_free', true,
            'api_key_id', v_key.id, 'subscription_id', v_sub.id,
            'tier_number', v_sub.tier_number, 'model_id', p_model_id,
            'power_level', v_model.power_level, 'current_balance_usd', v_sub.balance_usd,
            'estimated_cost_usd', 0, 'message', 'Modèle de test : crédit Axis non débité.');
    END IF;

    v_input_cost := GREATEST(0, p_input_tokens) * v_model.input_cost_per_token;
    v_output_cost := GREATEST(0, p_max_output_tokens) * v_model.output_cost_per_token;
    v_estimated_cost := v_input_cost + v_output_cost;

    IF v_sub.balance_usd < v_estimated_cost THEN
        RETURN jsonb_build_object('is_allowed', false, 'http_status', 402,
            'error_code', 'INSUFFICIENT_BALANCE',
            'error_message', format('Solde insuffisant ($%s) pour couvrir la requête ($%s).',
                v_sub.balance_usd, round(v_estimated_cost, 6)),
            'current_balance_usd', v_sub.balance_usd, 'estimated_cost_usd', v_estimated_cost);
    END IF;

    RETURN jsonb_build_object('is_allowed', true, 'http_status', 200, 'is_free', false,
        'api_key_id', v_key.id, 'subscription_id', v_sub.id,
        'tier_number', v_sub.tier_number, 'model_id', p_model_id,
        'power_level', v_model.power_level, 'current_balance_usd', v_sub.balance_usd,
        'estimated_cost_usd', v_estimated_cost,
        'fallback_model_id', v_model.fallback_model_id);
END;
$$;
