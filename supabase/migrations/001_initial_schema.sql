-- ==============================================================================
-- ACCESS AI / AXIS PROXY - DATABASE SCHEMA & GATEKEEPER PROCEDURES
-- ==============================================================================

-- Enable pgcrypto extension for cryptographic key generation and SHA-256 hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. TABLE: models (Cache des tarifs OpenRouter & classification)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.models (
    id VARCHAR(120) PRIMARY KEY,                  -- ex: 'anthropic/claude-3.5-sonnet', 'openai/gpt-4o'
    name VARCHAR(255) NOT NULL,                   -- Human-readable name
    input_cost_per_token NUMERIC(18, 10) NOT NULL DEFAULT 0.0,  -- Cost per token in USD (0.0 for free models)
    output_cost_per_token NUMERIC(18, 10) NOT NULL DEFAULT 0.0, -- Cost per token in USD (0.0 for free models)
    tier VARCHAR(30) NOT NULL DEFAULT 'economy', -- 'free', 'economy', 'performance'
    context_length INTEGER DEFAULT 128000,
    fallback_model_id VARCHAR(120) DEFAULT NULL, -- Backup model if primary fails
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_models_tier ON public.models(tier);
CREATE INDEX IF NOT EXISTS idx_models_is_active ON public.models(is_active);

-- ------------------------------------------------------------------------------
-- 2. TABLE: subscriptions (Enveloppes budgétaires en USD)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,                       -- ID of the user (e.g. auth.users or external user)
    budget_amount_usd NUMERIC(14, 6) NOT NULL CHECK (budget_amount_usd >= 0),
    balance_usd NUMERIC(14, 6) NOT NULL CHECK (balance_usd >= 0),
    starts_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_dates CHECK (expires_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active_expires ON public.subscriptions(is_active, expires_at);

-- ------------------------------------------------------------------------------
-- 3. TABLE: api_keys (Gestion des clés d'accès hachées)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    key_hash VARCHAR(64) NOT NULL UNIQUE,       -- SHA-256 hash of the plain API key
    key_prefix VARCHAR(16) NOT NULL,            -- e.g. 'axis_live_a1b2' (for safe display)
    name VARCHAR(100) NOT NULL DEFAULT 'Default API Key',
    is_enabled BOOLEAN NOT NULL DEFAULT false,  -- Active only if attached to a valid active subscription
    daily_request_limit INTEGER DEFAULT NULL,   -- Optional request rate cap per day
    last_used_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_subscription_id ON public.api_keys(subscription_id);

-- ------------------------------------------------------------------------------
-- 4. TABLE: usage_logs (Traçabilité des requêtes et tokens)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    model_id VARCHAR(120) NOT NULL,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    cost_usd NUMERIC(16, 8) NOT NULL DEFAULT 0.0,
    is_free BOOLEAN NOT NULL DEFAULT false,
    duration_ms INTEGER NOT NULL DEFAULT 0,
    status_code INTEGER NOT NULL DEFAULT 200,
    error_message TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_api_key_id ON public.usage_logs(api_key_id, created_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_sub_id ON public.usage_logs(subscription_id, created_at);

-- ------------------------------------------------------------------------------
-- 5. RPC FUNCTION: axis_gatekeeper_validate
-- Validation synchrone de la clé, du modèle et du solde avant transmission
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.axis_gatekeeper_validate(
    p_key_hash TEXT,
    p_model_id TEXT,
    p_input_tokens INTEGER DEFAULT 0,
    p_max_output_tokens INTEGER DEFAULT 1000
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
    v_input_cost NUMERIC(18, 10) := 0;
    v_output_cost NUMERIC(18, 10) := 0;
    v_est_total_cost NUMERIC(18, 10) := 0;
    v_daily_count INTEGER := 0;
    v_is_free BOOLEAN := false;
BEGIN
    -- 1. Vérification de la clé API
    SELECT id, user_id, subscription_id, is_enabled, daily_request_limit
    INTO v_key
    FROM public.api_keys
    WHERE key_hash = p_key_hash;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'is_allowed', false,
            'http_status', 401,
            'error_code', 'INVALID_API_KEY',
            'error_message', 'Clé API inconnue ou invalide.'
        );
    END IF;

    IF NOT v_key.is_enabled THEN
        RETURN jsonb_build_object(
            'is_allowed', false,
            'http_status', 403,
            'error_code', 'KEY_DISABLED',
            'error_message', 'Cette clé API est actuellement désactivée.'
        );
    END IF;

    -- 2. Vérification de l'abonnement rattaché
    IF v_key.subscription_id IS NULL THEN
        RETURN jsonb_build_object(
            'is_allowed', false,
            'http_status', 403,
            'error_code', 'NO_SUBSCRIPTION',
            'error_message', 'Aucun abonnement budgétaire rattaché à cette clé.'
        );
    END IF;

    SELECT id, user_id, balance_usd, expires_at, is_active
    INTO v_sub
    FROM public.subscriptions
    WHERE id = v_key.subscription_id;

    IF NOT FOUND OR NOT v_sub.is_active THEN
        -- Auto-désactivation de la clé si abonnement inactif
        UPDATE public.api_keys SET is_enabled = false WHERE id = v_key.id;
        RETURN jsonb_build_object(
            'is_allowed', false,
            'http_status', 403,
            'error_code', 'SUBSCRIPTION_INACTIVE',
            'error_message', 'Abonnement inactif ou résilié.'
        );
    END IF;

    IF v_sub.expires_at <= timezone('utc'::text, now()) THEN
        -- Auto-désactivation de l'abonnement expiré et de sa clé
        UPDATE public.subscriptions SET is_active = false WHERE id = v_sub.id;
        UPDATE public.api_keys SET is_enabled = false WHERE id = v_key.id;
        RETURN jsonb_build_object(
            'is_allowed', false,
            'http_status', 403,
            'error_code', 'SUBSCRIPTION_EXPIRED',
            'error_message', 'Votre forfait a expiré. Veuillez le renouveler.'
        );
    END IF;

    -- 3. Vérification de la limite quotidienne si configurée
    IF v_key.daily_request_limit IS NOT NULL AND v_key.daily_request_limit > 0 THEN
        SELECT COUNT(*)
        INTO v_daily_count
        FROM public.usage_logs
        WHERE api_key_id = v_key.id
          AND created_at >= date_trunc('day', timezone('utc'::text, now()));

        IF v_daily_count >= v_key.daily_request_limit THEN
            RETURN jsonb_build_object(
                'is_allowed', false,
                'http_status', 429,
                'error_code', 'DAILY_LIMIT_EXCEEDED',
                'error_message', 'La limite quotidienne de requêtes pour cette clé a été atteinte.'
            );
        END IF;
    END IF;

    -- 4. Recherche du modèle et tarification
    SELECT id, name, input_cost_per_token, output_cost_per_token, tier, fallback_model_id
    INTO v_model
    FROM public.models
    WHERE id = p_model_id AND is_active = true;

    -- Si le modèle n'est pas encore en base, vérifions si c'est un tag :free connu
    IF NOT FOUND THEN
        IF p_model_id LIKE '%:free' THEN
            v_is_free := true;
            v_input_cost := 0.0;
            v_output_cost := 0.0;
        ELSE
            -- Modèle non reconnu
            RETURN jsonb_build_object(
                'is_allowed', false,
                'http_status', 404,
                'error_code', 'MODEL_NOT_FOUND',
                'error_message', format('Modèle "%s" non supporté ou introuvable dans le catalogue.', p_model_id)
            );
        END IF;
    ELSE
        IF (v_model.input_cost_per_token = 0.0 AND v_model.output_cost_per_token = 0.0) OR v_model.tier = 'free' THEN
            v_is_free := true;
        END IF;
    END IF;

    -- 5. Formule d'estimation budgétaire
    -- A. Modèles Gratuits : Passage immédiat sans déduction
    IF v_is_free THEN
        RETURN jsonb_build_object(
            'is_allowed', true,
            'is_free', true,
            'http_status', 200,
            'api_key_id', v_key.id,
            'subscription_id', v_sub.id,
            'model_id', p_model_id,
            'tier', COALESCE(v_model.tier, 'free'),
            'current_balance_usd', v_sub.balance_usd,
            'estimated_cost_usd', 0.0,
            'fallback_model_id', v_model.fallback_model_id
        );
    END IF;

    -- B. Modèles Payants : Calcul des coûts d'entrée et de sortie estimée
    v_input_cost := GREATEST(0, p_input_tokens) * v_model.input_cost_per_token;
    v_output_cost := GREATEST(1, p_max_output_tokens) * v_model.output_cost_per_token;
    v_est_total_cost := v_input_cost + v_output_cost;

    -- Vérification de couverture par le solde
    IF v_sub.balance_usd >= v_est_total_cost THEN
        RETURN jsonb_build_object(
            'is_allowed', true,
            'is_free', false,
            'http_status', 200,
            'api_key_id', v_key.id,
            'subscription_id', v_sub.id,
            'model_id', v_model.id,
            'tier', v_model.tier,
            'current_balance_usd', v_sub.balance_usd,
            'estimated_cost_usd', v_est_total_cost,
            'fallback_model_id', v_model.fallback_model_id
        );
    ELSE
        -- Refus net HTTP 402
        RETURN jsonb_build_object(
            'is_allowed', false,
            'http_status', 402,
            'error_code', 'INSUFFICIENT_BALANCE',
            'error_message', format('Solde insuffisant ($%s) pour couvrir l''estimation de la requête ($%s). Veuillez recharger votre forfait.', v_sub.balance_usd, round(v_est_total_cost, 6)),
            'current_balance_usd', v_sub.balance_usd,
            'estimated_cost_usd', v_est_total_cost
        );
    END IF;
END;
$$;

-- ------------------------------------------------------------------------------
-- 6. RPC FUNCTION: axis_settle_usage
-- Décompte réel du solde et enregistrement d'audit (Usage log)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.axis_settle_usage(
    p_key_hash TEXT,
    p_model_id TEXT,
    p_input_tokens INTEGER DEFAULT 0,
    p_output_tokens INTEGER DEFAULT 0,
    p_duration_ms INTEGER DEFAULT 0,
    p_status_code INTEGER DEFAULT 200,
    p_error_message TEXT DEFAULT NULL
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
    v_total_tokens INTEGER := 0;
    v_real_cost NUMERIC(16, 8) := 0.0;
    v_new_balance NUMERIC(14, 6) := 0.0;
    v_is_free BOOLEAN := false;
BEGIN
    v_total_tokens := GREATEST(0, p_input_tokens) + GREATEST(0, p_output_tokens);

    -- Récupération de la clé
    SELECT id, subscription_id
    INTO v_key
    FROM public.api_keys
    WHERE key_hash = p_key_hash;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Clé API introuvable lors de la clôture.');
    END IF;

    -- Tarifs du modèle
    SELECT id, input_cost_per_token, output_cost_per_token, tier
    INTO v_model
    FROM public.models
    WHERE id = p_model_id;

    IF NOT FOUND OR (v_model.input_cost_per_token = 0.0 AND v_model.output_cost_per_token = 0.0) OR (v_model.tier = 'free') OR (p_model_id LIKE '%:free') THEN
        v_is_free := true;
        v_real_cost := 0.0;
    ELSE
        v_real_cost := (GREATEST(0, p_input_tokens) * v_model.input_cost_per_token) +
                       (GREATEST(0, p_output_tokens) * v_model.output_cost_per_token);
    END IF;

    -- Si requête en succès et modèle payant, déduire du solde
    IF v_key.subscription_id IS NOT NULL THEN
        SELECT id, balance_usd INTO v_sub FROM public.subscriptions WHERE id = v_key.subscription_id FOR UPDATE;

        IF FOUND THEN
            IF NOT v_is_free AND v_real_cost > 0.0 AND p_status_code < 400 THEN
                v_new_balance := GREATEST(0.0, v_sub.balance_usd - v_real_cost);
                UPDATE public.subscriptions
                SET balance_usd = v_new_balance,
                    is_active = (v_new_balance > 0.0),
                    updated_at = timezone('utc'::text, now())
                WHERE id = v_sub.id;

                -- Si solde épuisé, désactiver immédiatement les clés rattachées
                IF v_new_balance <= 0.0 THEN
                    UPDATE public.api_keys
                    SET is_enabled = false,
                        updated_at = timezone('utc'::text, now())
                    WHERE subscription_id = v_sub.id;
                END IF;
            ELSE
                v_new_balance := v_sub.balance_usd;
            END IF;
        END IF;
    END IF;

    -- Mise à jour de la date de dernier usage sur la clé
    UPDATE public.api_keys
    SET last_used_at = timezone('utc'::text, now())
    WHERE id = v_key.id;

    -- Insertion dans usage_logs pour audit
    INSERT INTO public.usage_logs (
        api_key_id,
        subscription_id,
        model_id,
        input_tokens,
        output_tokens,
        total_tokens,
        cost_usd,
        is_free,
        duration_ms,
        status_code,
        error_message
    ) VALUES (
        v_key.id,
        v_key.subscription_id,
        p_model_id,
        p_input_tokens,
        p_output_tokens,
        v_total_tokens,
        v_real_cost,
        v_is_free,
        p_duration_ms,
        p_status_code,
        p_error_message
    );

    RETURN jsonb_build_object(
        'success', true,
        'cost_usd', v_real_cost,
        'is_free', v_is_free,
        'new_balance_usd', v_new_balance,
        'total_tokens', v_total_tokens
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 7. RPC FUNCTION: axis_generate_api_key
-- Génération d'une nouvelle clé secrète (affichée une seule fois)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.axis_generate_api_key(
    p_user_id UUID,
    p_subscription_id UUID DEFAULT NULL,
    p_name TEXT DEFAULT 'Default API Key',
    p_daily_limit INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_raw_secret TEXT;
    v_full_key TEXT;
    v_hash TEXT;
    v_prefix TEXT;
    v_new_key_id UUID;
    v_is_enabled BOOLEAN := false;
    v_sub RECORD;
BEGIN
    -- Si un abonnement est fourni, valider qu'il est actif et non expiré
    IF p_subscription_id IS NOT NULL THEN
        SELECT id, is_active, expires_at, balance_usd
        INTO v_sub
        FROM public.subscriptions
        WHERE id = p_subscription_id AND user_id = p_user_id;

        IF FOUND AND v_sub.is_active AND v_sub.expires_at > timezone('utc'::text, now()) AND v_sub.balance_usd > 0 THEN
            v_is_enabled := true;
        END IF;
    END IF;

    -- Génération de 24 octets cryptographiques hex (48 chars)
    v_raw_secret := encode(gen_random_bytes(24), 'hex');
    v_full_key := 'axis_live_' || v_raw_secret;
    v_prefix := substr(v_full_key, 1, 14) || '...';
    v_hash := encode(digest(v_full_key, 'sha256'), 'hex');

    INSERT INTO public.api_keys (
        user_id,
        subscription_id,
        key_hash,
        key_prefix,
        name,
        is_enabled,
        daily_request_limit
    ) VALUES (
        p_user_id,
        p_subscription_id,
        v_hash,
        v_prefix,
        COALESCE(p_name, 'Default API Key'),
        v_is_enabled,
        p_daily_limit
    )
    RETURNING id INTO v_new_key_id;

    RETURN jsonb_build_object(
        'key_id', v_new_key_id,
        'raw_key', v_full_key,
        'key_prefix', v_prefix,
        'name', COALESCE(p_name, 'Default API Key'),
        'is_enabled', v_is_enabled,
        'daily_request_limit', p_daily_limit,
        'warning', 'La clé en clair ne sera plus jamais accessible. Veuillez la conserver en lieu sûr.'
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 8. RPC FUNCTION: axis_refresh_api_key
-- Régénération d'une nouvelle clé secrète en cas de compromission
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.axis_refresh_api_key(
    p_key_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_raw_secret TEXT;
    v_full_key TEXT;
    v_hash TEXT;
    v_prefix TEXT;
    v_key RECORD;
BEGIN
    SELECT * INTO v_key FROM public.api_keys WHERE id = p_key_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Clé introuvable');
    END IF;

    v_raw_secret := encode(gen_random_bytes(24), 'hex');
    v_full_key := 'axis_live_' || v_raw_secret;
    v_prefix := substr(v_full_key, 1, 14) || '...';
    v_hash := encode(digest(v_full_key, 'sha256'), 'hex');

    UPDATE public.api_keys
    SET key_hash = v_hash,
        key_prefix = v_prefix,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_key_id;

    RETURN jsonb_build_object(
        'success', true,
        'key_id', p_key_id,
        'new_raw_key', v_full_key,
        'key_prefix', v_prefix,
        'warning', 'Nouvelle clé générée. L''ancienne clé est immédiatement invalidée.'
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 9. RPC FUNCTION: axis_revoke_api_key
-- Révocation ou suppression d'une clé API
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.axis_revoke_api_key(
    p_key_id UUID,
    p_delete BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_delete THEN
        DELETE FROM public.api_keys WHERE id = p_key_id;
        RETURN jsonb_build_object('success', true, 'action', 'deleted', 'key_id', p_key_id);
    ELSE
        UPDATE public.api_keys
        SET is_enabled = false,
            updated_at = timezone('utc'::text, now())
        WHERE id = p_key_id;
        RETURN jsonb_build_object('success', true, 'action', 'disabled', 'key_id', p_key_id);
    END IF;
END;
$$;

-- ------------------------------------------------------------------------------
-- 10. RPC FUNCTION: axis_cleanup_expired_subscriptions
-- Tâche de maintenance (Cron Job) pour désactiver les forfaits épuisés ou expirés
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.axis_cleanup_expired_subscriptions()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_subs_deactivated INTEGER := 0;
    v_keys_disabled INTEGER := 0;
BEGIN
    -- 1. Désactiver les abonnements expirés ou à solde nul
    WITH expired AS (
        UPDATE public.subscriptions
        SET is_active = false,
            updated_at = timezone('utc'::text, now())
        WHERE is_active = true
          AND (expires_at <= timezone('utc'::text, now()) OR balance_usd <= 0.0)
        RETURNING id
    )
    SELECT COUNT(*) INTO v_subs_deactivated FROM expired;

    -- 2. Désactiver les clés rattachées aux abonnements inactifs
    WITH disabled_keys AS (
        UPDATE public.api_keys k
        SET is_enabled = false,
            updated_at = timezone('utc'::text, now())
        FROM public.subscriptions s
        WHERE k.subscription_id = s.id
          AND k.is_enabled = true
          AND (s.is_active = false OR s.expires_at <= timezone('utc'::text, now()) OR s.balance_usd <= 0.0)
        RETURNING k.id
    )
    SELECT COUNT(*) INTO v_keys_disabled FROM disabled_keys;

    RETURN jsonb_build_object(
        'success', true,
        'subscriptions_deactivated', v_subs_deactivated,
        'keys_disabled', v_keys_disabled,
        'executed_at', timezone('utc'::text, now())
    );
END;
$$;
