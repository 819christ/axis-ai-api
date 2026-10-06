-- ==============================================================================
-- ACCESS AI / AXIS PROXY - SCHEMA COMPLET DE PRODUCTION (SUPABASE SQL EDITOR)
-- Exécutez ce script directement dans le SQL Editor de Supabase pour déployer
-- l'intégralité de l'architecture : profils, rôles, modérateurs, abonnements,
-- paliers mathématiques, règle J-7, journalisation et procédures RPC sécurisées.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLE PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    pseudo VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'moderator', 'client')),
    moderator_code VARCHAR(20) UNIQUE DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_moderator_code ON public.profiles(moderator_code);

-- Avatar vectoriel : 20 icônes x 360 teintes x 3 tons = 21 600 variantes (NULL = dérivé automatiquement du pseudo)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_icon SMALLINT CHECK (avatar_icon BETWEEN 0 AND 19);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_hue  SMALLINT CHECK (avatar_hue  BETWEEN 0 AND 359);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_tone SMALLINT CHECK (avatar_tone BETWEEN 0 AND 2);

-- Trigger automatique de création de profil à l'inscription (Google Auth / Email)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_username VARCHAR(50);
    v_pseudo VARCHAR(50);
BEGIN
    v_username := COALESCE(
        new.raw_user_meta_data->>'username',
        split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 4)
    );
    v_pseudo := COALESCE(
        new.raw_user_meta_data->>'pseudo',
        new.raw_user_meta_data->>'name',
        split_part(new.email, '@', 1)
    );

    INSERT INTO public.profiles (id, email, username, pseudo, role)
    VALUES (new.id, new.email, v_username, v_pseudo, 'client')
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = timezone('utc'::text, now());

    RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. TABLE TIERS (Les 7 Paliers avec formule mathématique : MaxAllowedCost = alpha * i + beta)
CREATE TABLE IF NOT EXISTS public.tiers (
    tier_number INTEGER PRIMARY KEY CHECK (tier_number BETWEEN 1 AND 7),
    name VARCHAR(50) NOT NULL,
    alpha NUMERIC(8, 2) NOT NULL DEFAULT 5.00,
    beta NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    max_cost_per_million_usd NUMERIC(10, 2) GENERATED ALWAYS AS (alpha * tier_number + beta) STORED,
    price_usd NUMERIC(10, 2) NOT NULL,
    budget_amount_usd NUMERIC(10, 2) NOT NULL,
    description TEXT
);

INSERT INTO public.tiers (tier_number, name, alpha, beta, price_usd, budget_amount_usd, description)
VALUES
    (1, 'Palier 1 - Starter', 5.00, 0.00, 10.00, 10.00, 'Modèles gratuits et ultra-économiques (max 5$/1M tokens)'),
    (2, 'Palier 2 - Basic', 5.00, 0.00, 25.00, 25.00, 'Modèles légers et polyvalents (max 10$/1M tokens)'),
    (3, 'Palier 3 - Standard', 5.00, 0.00, 50.00, 50.00, 'Modèles standards type GPT-4o (max 15$/1M tokens)'),
    (4, 'Palier 4 - Pro', 5.00, 0.00, 100.00, 100.00, 'Modèles de pointe type Claude 3.5 Sonnet (max 20$/1M tokens)'),
    (5, 'Palier 5 - Expert', 5.00, 0.00, 200.00, 200.00, 'Modèles haute performance (max 25$/1M tokens)'),
    (6, 'Palier 6 - Master', 5.00, 0.00, 350.00, 350.00, 'Modèles de raisonnement lourd (max 30$/1M tokens)'),
    (7, 'Palier 7 - Enterprise', 5.00, 0.00, 500.00, 500.00, 'Accès illimité sans restriction (max 35$/1M tokens)')
ON CONFLICT (tier_number) DO UPDATE SET
    name = EXCLUDED.name,
    alpha = EXCLUDED.alpha,
    beta = EXCLUDED.beta,
    price_usd = EXCLUDED.price_usd,
    budget_amount_usd = EXCLUDED.budget_amount_usd,
    description = EXCLUDED.description;

-- 4. TABLE MODELS (Catalogue OpenRouter classé par niveau de puissance)
CREATE TABLE IF NOT EXISTS public.models (
    id VARCHAR(120) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    input_cost_per_token NUMERIC(18, 10) NOT NULL DEFAULT 0.0,
    output_cost_per_token NUMERIC(18, 10) NOT NULL DEFAULT 0.0,
    combined_cost_per_million_usd NUMERIC(14, 4) GENERATED ALWAYS AS ((input_cost_per_token + output_cost_per_token) * 1000000) STORED,
    power_level VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (power_level IN ('low', 'medium', 'high', 'ultra')),
    tier VARCHAR(30) DEFAULT 'economy',
    context_length INTEGER DEFAULT 128000,
    fallback_model_id VARCHAR(120) DEFAULT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

INSERT INTO public.models (id, name, input_cost_per_token, output_cost_per_token, power_level, tier, fallback_model_id)
VALUES
    ('meta-llama/llama-3.3-70b-instruct:free', 'Llama 3.3 70B Free', 0.0, 0.0, 'low', 'free', 'google/gemini-2.0-flash-exp:free'),
    ('google/gemini-2.0-flash-exp:free', 'Gemini 2.0 Flash Exp Free', 0.0, 0.0, 'low', 'free', 'meta-llama/llama-3.3-70b-instruct:free'),
    ('google/gemini-2.0-flash-001', 'Gemini 2.0 Flash', 0.00000010, 0.00000040, 'low', 'economy', 'openai/gpt-4o-mini'),
    ('openai/gpt-4o-mini', 'GPT-4o Mini', 0.00000015, 0.00000060, 'low', 'economy', 'google/gemini-2.0-flash-001'),
    ('deepseek/deepseek-chat', 'DeepSeek V3 Chat', 0.00000014, 0.00000028, 'medium', 'economy', 'openai/gpt-4o-mini'),
    ('anthropic/claude-3-haiku', 'Claude 3 Haiku', 0.00000025, 0.00000125, 'medium', 'economy', 'deepseek/deepseek-chat'),
    ('mistralai/mistral-small', 'Mistral Small', 0.00000020, 0.00000060, 'medium', 'economy', 'openai/gpt-4o-mini'),
    ('qwen/qwen-2.5-coder-32b-instruct', 'Qwen 2.5 Coder 32B', 0.00000007, 0.00000016, 'high', 'economy', 'openai/gpt-4o'),
    ('openai/gpt-4o', 'GPT-4o', 0.00000250, 0.00001000, 'high', 'performance', 'google/gemini-pro-1.5'),
    ('google/gemini-pro-1.5', 'Gemini 1.5 Pro', 0.00000125, 0.00000500, 'high', 'performance', 'openai/gpt-4o'),
    ('deepseek/deepseek-r1', 'DeepSeek R1 Reasoning', 0.00000055, 0.00000219, 'ultra', 'performance', 'openai/gpt-4o'),
    ('openai/o1-mini', 'OpenAI o1 Mini', 0.00000300, 0.00001200, 'ultra', 'performance', 'anthropic/claude-3.5-sonnet'),
    ('anthropic/claude-3.5-sonnet', 'Claude 3.5 Sonnet', 0.00000300, 0.00001500, 'ultra', 'performance', 'deepseek/deepseek-r1')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    input_cost_per_token = EXCLUDED.input_cost_per_token,
    output_cost_per_token = EXCLUDED.output_cost_per_token,
    power_level = EXCLUDED.power_level,
    tier = EXCLUDED.tier,
    fallback_model_id = EXCLUDED.fallback_model_id,
    updated_at = timezone('utc'::text, now());

-- 5. TABLE SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tier_number INTEGER NOT NULL REFERENCES public.tiers(tier_number),
    budget_amount_usd NUMERIC(14, 6) NOT NULL CHECK (budget_amount_usd >= 0),
    balance_usd NUMERIC(14, 6) NOT NULL CHECK (balance_usd >= 0),
    consumed_usd NUMERIC(14, 6) NOT NULL DEFAULT 0.0,
    total_tokens_consumed BIGINT NOT NULL DEFAULT 0,
    starts_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending_validation' CHECK (status IN ('active', 'pending_validation', 'pending', 'expired', 'depleted', 'disabled')),
    is_active BOOLEAN NOT NULL DEFAULT false,
    
    moderator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    moderator_code_used VARCHAR(20) DEFAULT NULL,
    validated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    validated_at TIMESTAMPTZ DEFAULT NULL,
    commission_status VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (commission_status IN ('unpaid', 'paid', 'archived', 'none')),

    disabled_reason TEXT DEFAULT NULL,
    disabled_at TIMESTAMPTZ DEFAULT NULL,
    disabled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_sub_dates CHECK (expires_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON public.subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_moderator ON public.subscriptions(moderator_id, commission_status);

-- 6. TABLE API_KEYS
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    key_hash VARCHAR(64) NOT NULL UNIQUE,
    key_prefix VARCHAR(24) NOT NULL,
    name VARCHAR(100) NOT NULL DEFAULT 'Default API Key',
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    daily_request_limit INTEGER DEFAULT NULL,
    last_used_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);

-- Migration douce pour les bases déjà déployées (non bloquante)
DO $$
BEGIN
    ALTER TABLE public.api_keys ALTER COLUMN key_prefix TYPE VARCHAR(24);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'key_prefix non élargie : %', SQLERRM;
END $$;

-- 7. TABLE USAGE_LOGS
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    model_id VARCHAR(120) NOT NULL,
    power_level VARCHAR(20),
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

CREATE INDEX IF NOT EXISTS idx_usage_logs_key_date ON public.usage_logs(api_key_id, created_at);

-- Vérifie que l'appelant authentifié est bien celui qu'il prétend être.
-- auth.uid() est NULL pour le backend (service_role), qui reste de confiance.
-- Un administrateur peut agir pour le compte d'un autre identifiant.
CREATE OR REPLACE FUNCTION public.assert_caller_is(p_claimed UUID)
RETURNS VOID
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NOT NULL
       AND auth.uid() IS DISTINCT FROM p_claimed
       AND NOT public.is_admin_unlocked() THEN
        RAISE EXCEPTION 'Identité non conforme' USING ERRCODE = '42501';
    END IF;
END;
$$;

-- 8. RPC: axis_create_moderator
CREATE OR REPLACE FUNCTION public.axis_create_moderator(
    p_admin_id UUID,
    p_user_id UUID,
    p_custom_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin RECORD;
    v_mod_code VARCHAR(20);
BEGIN
    PERFORM public.assert_caller_is(p_admin_id);
    PERFORM public.assert_admin_unlocked();
    SELECT role INTO v_admin FROM public.profiles WHERE id = p_admin_id;
    IF NOT FOUND OR v_admin.role != 'admin' THEN
        RETURN jsonb_build_object('success', false, 'http_status', 403, 'error_message', 'Seul un administrateur peut nommer un modérateur.');
    END IF;

    IF p_custom_code IS NOT NULL AND trim(p_custom_code) != '' THEN
        v_mod_code := upper(trim(p_custom_code));
    ELSE
        v_mod_code := 'MOD-' || lpad(floor(random() * 9000 + 1000)::text, 4, '0');
    END IF;

    UPDATE public.profiles
    SET role = 'moderator',
        moderator_code = v_mod_code,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'user_id', p_user_id,
        'role', 'moderator',
        'moderator_code', v_mod_code
    );
END;
$$;

-- 9. RPC: axis_subscribe
CREATE OR REPLACE FUNCTION public.axis_subscribe(
    p_user_id UUID,
    p_tier_number INTEGER,
    p_moderator_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tier RECORD;
    v_active_sub RECORD;
    v_pending_sub RECORD;
    v_mod RECORD;
    v_mod_id UUID := NULL;
    v_mod_code_assigned TEXT := NULL;
    v_new_sub_id UUID;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_is_renewal BOOLEAN := false;
    v_starts_at TIMESTAMPTZ;
    v_expires_at TIMESTAMPTZ;
BEGIN
    PERFORM public.assert_caller_is(p_user_id);
    SELECT * INTO v_tier FROM public.tiers WHERE tier_number = p_tier_number;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'http_status', 400, 'error_code', 'INVALID_TIER', 'error_message', 'Palier invalide.');
    END IF;

    IF p_moderator_code IS NOT NULL AND trim(p_moderator_code) != '' THEN
        SELECT id, moderator_code INTO v_mod
        FROM public.profiles
        WHERE moderator_code = upper(trim(p_moderator_code)) AND role = 'moderator';

        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'http_status', 404, 'error_code', 'INVALID_MODERATOR_CODE', 'error_message', 'Code modérateur invalide.');
        END IF;
        v_mod_id := v_mod.id;
        v_mod_code_assigned := v_mod.moderator_code;
    END IF;

    SELECT * INTO v_active_sub
    FROM public.subscriptions
    WHERE user_id = p_user_id AND status = 'active' AND is_active = true AND expires_at > v_now AND balance_usd > 0
    ORDER BY created_at DESC LIMIT 1;

    IF FOUND THEN
        IF v_now < (v_active_sub.expires_at - INTERVAL '7 days') THEN
            RETURN jsonb_build_object(
                'success', false,
                'http_status', 409,
                'error_code', 'EARLY_RENEWAL_FORBIDDEN',
                'error_message', 'Souscription anticipée autorisée uniquement dans les 7 derniers jours.',
                'active_expires_at', v_active_sub.expires_at
            );
        END IF;

        SELECT id INTO v_pending_sub
        FROM public.subscriptions
        WHERE user_id = p_user_id AND status IN ('pending', 'pending_validation') LIMIT 1;

        IF FOUND THEN
            RETURN jsonb_build_object('success', false, 'http_status', 409, 'error_code', 'PENDING_ALREADY_EXISTS', 'error_message', 'Un abonnement de renouvellement est déjà en attente.');
        END IF;

        v_is_renewal := true;
        v_starts_at := v_active_sub.expires_at;
        v_expires_at := v_starts_at + INTERVAL '30 days';
    ELSE
        v_starts_at := v_now;
        v_expires_at := v_now + INTERVAL '30 days';
    END IF;

    INSERT INTO public.subscriptions (
        user_id, tier_number, budget_amount_usd, balance_usd, consumed_usd,
        starts_at, expires_at, status, is_active, moderator_id, moderator_code_used, commission_status
    ) VALUES (
        p_user_id, v_tier.tier_number, v_tier.budget_amount_usd, v_tier.budget_amount_usd, 0.0,
        v_starts_at, v_expires_at, 'pending_validation', false, v_mod_id, v_mod_code_assigned,
        CASE WHEN v_mod_id IS NOT NULL THEN 'unpaid' ELSE 'none' END
    ) RETURNING id INTO v_new_sub_id;

    RETURN jsonb_build_object(
        'success', true,
        'http_status', 201,
        'subscription_id', v_new_sub_id,
        'status', 'pending_validation',
        'is_renewal_j7', v_is_renewal,
        'tier_number', v_tier.tier_number,
        'price_usd', v_tier.price_usd,
        'moderator_assigned', v_mod_code_assigned,
        'instructions', 'Effectuez le règlement hors-ligne sur le numéro officiel. Votre pack sera activé dès validation.'
    );
END;
$$;

-- 10. RPC: axis_moderator_validate_subscription
CREATE OR REPLACE FUNCTION public.axis_moderator_validate_subscription(
    p_validator_id UUID,
    p_subscription_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_validator RECORD;
    v_sub RECORD;
    v_active_sub RECORD;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_new_status VARCHAR(30);
    v_make_active BOOLEAN := false;
BEGIN
    PERFORM public.assert_caller_is(p_validator_id);
    SELECT role INTO v_validator FROM public.profiles WHERE id = p_validator_id;
    IF NOT FOUND OR v_validator.role NOT IN ('admin', 'moderator') THEN
        RETURN jsonb_build_object('success', false, 'http_status', 403, 'error_message', 'Autorisation refusée.');
    END IF;

    SELECT * INTO v_sub FROM public.subscriptions WHERE id = p_subscription_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'http_status', 404, 'error_message', 'Abonnement introuvable.');
    END IF;

    IF v_sub.status != 'pending_validation' THEN
        RETURN jsonb_build_object('success', false, 'http_status', 400, 'error_message', format('Abonnement déjà dans l''état "%s".', v_sub.status));
    END IF;

    IF v_validator.role = 'moderator' AND v_sub.moderator_id IS NOT NULL AND v_sub.moderator_id != p_validator_id THEN
        RETURN jsonb_build_object('success', false, 'http_status', 403, 'error_message', 'Vous ne pouvez valider que les clients rattachés à votre code modérateur.');
    END IF;

    SELECT id INTO v_active_sub
    FROM public.subscriptions
    WHERE user_id = v_sub.user_id AND id != v_sub.id AND status = 'active' AND is_active = true AND expires_at > v_now AND balance_usd > 0 LIMIT 1;

    IF FOUND THEN
        v_new_status := 'pending';
        v_make_active := false;
    ELSE
        v_new_status := 'active';
        v_make_active := true;
    END IF;

    UPDATE public.subscriptions
    SET status = v_new_status,
        is_active = v_make_active,
        starts_at = CASE WHEN v_make_active THEN v_now ELSE v_sub.starts_at END,
        expires_at = CASE WHEN v_make_active THEN v_now + INTERVAL '30 days' ELSE v_sub.expires_at END,
        validated_by = p_validator_id,
        validated_at = v_now,
        updated_at = v_now
    WHERE id = p_subscription_id;

    IF v_make_active THEN
       UPDATE public.api_keys SET is_enabled = true, updated_at = v_now WHERE subscription_id = p_subscription_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'http_status', 200,
        'subscription_id', p_subscription_id,
        'assigned_status', v_new_status,
        'is_active', v_make_active,
        'message', CASE WHEN v_make_active THEN 'Abonnement activé pour 30 jours.' ELSE 'Abonnement mis en attente (relais J-7).' END
    );
END;
$$;

-- 11. RPC: admin_disable_subscription (Désactivation avec motif obligatoire - Admin Seul)
CREATE OR REPLACE FUNCTION public.admin_disable_subscription(
    p_admin_id UUID,
    p_subscription_id UUID,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin RECORD;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    PERFORM public.assert_caller_is(p_admin_id);
    PERFORM public.assert_admin_unlocked();
    SELECT role INTO v_admin FROM public.profiles WHERE id = p_admin_id;
    IF NOT FOUND OR v_admin.role != 'admin' THEN
        RETURN jsonb_build_object('success', false, 'http_status', 403, 'error_message', 'Action réservée exclusivement à l''administrateur.');
    END IF;

    IF p_reason IS NULL OR length(trim(p_reason)) < 5 THEN
        RETURN jsonb_build_object('success', false, 'http_status', 400, 'error_message', 'Un justificatif textuel est obligatoire pour désactiver un abonnement.');
    END IF;

    UPDATE public.subscriptions
    SET status = 'disabled',
        is_active = false,
        disabled_reason = trim(p_reason),
        disabled_at = v_now,
        disabled_by = p_admin_id,
        updated_at = v_now
    WHERE id = p_subscription_id;

    UPDATE public.api_keys SET is_enabled = false, updated_at = v_now WHERE subscription_id = p_subscription_id;

    RETURN jsonb_build_object('success', true, 'subscription_id', p_subscription_id, 'disabled_reason', trim(p_reason));
END;
$$;

-- 12. RPC: axis_gatekeeper_validate
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
    v_user RECORD;
    v_sub RECORD;
    v_pending_sub RECORD;
    v_tier RECORD;
    v_model RECORD;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_input_cost NUMERIC(18, 10) := 0;
    v_output_cost NUMERIC(18, 10) := 0;
    v_est_total_cost NUMERIC(18, 10) := 0;
    v_is_free BOOLEAN := false;
BEGIN
    SELECT * INTO v_key FROM public.api_keys WHERE key_hash = p_key_hash;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('is_allowed', false, 'http_status', 401, 'error_code', 'INVALID_API_KEY', 'error_message', 'Clé API invalide.');
    END IF;

    SELECT * INTO v_user FROM public.profiles WHERE id = v_key.user_id;

    -- PRIVILÈGE ADMIN : ACCÈS TOTAL ET GRATUIT
    IF v_user.role = 'admin' THEN
        RETURN jsonb_build_object('is_allowed', true, 'is_admin', true, 'is_free', true, 'http_status', 200, 'api_key_id', v_key.id, 'model_id', p_model_id, 'current_balance_usd', 999999.0);
    END IF;

    IF v_key.subscription_id IS NULL THEN
        RETURN jsonb_build_object('is_allowed', false, 'http_status', 403, 'error_code', 'NO_SUBSCRIPTION', 'error_message', 'Aucun abonnement rattaché.');
    END IF;

    SELECT * INTO v_sub FROM public.subscriptions WHERE id = v_key.subscription_id FOR UPDATE;

    IF FOUND AND v_sub.status = 'disabled' THEN
        RETURN jsonb_build_object(
            'is_allowed', false,
            'http_status', 403,
            'error_code', 'SUBSCRIPTION_DISABLED_BY_ADMIN',
            'error_message', 'Abonnement désactivé par l''administrateur.',
            'disabled_reason', v_sub.disabled_reason
        );
    END IF;

    IF NOT FOUND OR v_sub.status != 'active' OR v_sub.expires_at <= v_now OR v_sub.balance_usd <= 0 THEN
        IF FOUND AND v_sub.status = 'active' THEN
            UPDATE public.subscriptions SET status = CASE WHEN balance_usd <= 0 THEN 'depleted' ELSE 'expired' END, is_active = false, updated_at = v_now WHERE id = v_sub.id;
        END IF;

        -- Vérifier si un pending validé existe
        SELECT * INTO v_pending_sub
        FROM public.subscriptions
        WHERE user_id = v_key.user_id AND status = 'pending' ORDER BY created_at ASC LIMIT 1 FOR UPDATE;

        IF FOUND THEN
            UPDATE public.subscriptions SET status = 'active', is_active = true, starts_at = v_now, expires_at = v_now + INTERVAL '30 days', updated_at = v_now WHERE id = v_pending_sub.id RETURNING * INTO v_sub;
            UPDATE public.api_keys SET subscription_id = v_sub.id, is_enabled = true, updated_at = v_now WHERE id = v_key.id;
            v_key.is_enabled := true;
        ELSE
            UPDATE public.api_keys SET is_enabled = false, updated_at = v_now WHERE id = v_key.id;
            RETURN jsonb_build_object('is_allowed', false, 'http_status', 402, 'error_code', 'SUBSCRIPTION_EXPIRED', 'error_message', 'Abonnement expiré ou solde épuisé.');
        END IF;
    END IF;

    -- La clé elle-même doit être activée (contrôle placé APRÈS le relais d'abonnement)
    IF NOT v_key.is_enabled THEN
        RETURN jsonb_build_object('is_allowed', false, 'http_status', 403,
            'error_code', 'KEY_DISABLED', 'error_message', 'Cette clé API est désactivée.');
    END IF;

    -- Formule mathématique du palier
    SELECT * INTO v_tier FROM public.tiers WHERE tier_number = v_sub.tier_number;
    SELECT * INTO v_model FROM public.models WHERE id = p_model_id AND is_active = true;

    IF NOT FOUND THEN
        IF p_model_id LIKE '%:free' THEN v_is_free := true;
        ELSE RETURN jsonb_build_object('is_allowed', false, 'http_status', 404, 'error_message', 'Modèle introuvable.'); END IF;
    ELSE
        IF (v_model.input_cost_per_token = 0.0 AND v_model.output_cost_per_token = 0.0) OR p_model_id LIKE '%:free' THEN v_is_free := true; END IF;
    END IF;

    IF NOT v_is_free AND v_model.id IS NOT NULL THEN
        IF v_model.combined_cost_per_million_usd > v_tier.max_cost_per_million_usd THEN
            RETURN jsonb_build_object(
                'is_allowed', false,
                'http_status', 403,
                'error_code', 'TIER_MODEL_NOT_PERMITTED',
                'error_message', 'Ce modèle n''est pas inclus dans votre palier actuel.'
            );
        END IF;
    END IF;

    IF v_is_free THEN
        RETURN jsonb_build_object('is_allowed', true, 'is_free', true, 'http_status', 200, 'current_balance_usd', v_sub.balance_usd, 'estimated_cost_usd', 0.0);
    END IF;

    v_input_cost := GREATEST(0, p_input_tokens) * v_model.input_cost_per_token;
    v_output_cost := GREATEST(1, p_max_output_tokens) * v_model.output_cost_per_token;
    v_est_total_cost := v_input_cost + v_output_cost;

    IF v_sub.balance_usd >= v_est_total_cost THEN
        RETURN jsonb_build_object('is_allowed', true, 'is_free', false, 'http_status', 200, 'current_balance_usd', v_sub.balance_usd, 'estimated_cost_usd', v_est_total_cost);
    ELSE
        RETURN jsonb_build_object('is_allowed', false, 'http_status', 402, 'error_code', 'INSUFFICIENT_BALANCE', 'error_message', 'Solde insuffisant pour couvrir la requête.');
    END IF;
END;
$$;

-- 13. RPC: axis_settle_usage
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
    v_user RECORD;
    v_sub RECORD;
    v_pending_sub RECORD;
    v_model RECORD;
    v_total_tokens INTEGER := 0;
    v_real_cost NUMERIC(16, 8) := 0.0;
    v_new_balance NUMERIC(14, 6) := 0.0;
    v_is_free BOOLEAN := false;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    v_total_tokens := GREATEST(0, p_input_tokens) + GREATEST(0, p_output_tokens);

    SELECT id, user_id, subscription_id INTO v_key FROM public.api_keys WHERE key_hash = p_key_hash;
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Clé API introuvable.'); END IF;

    SELECT role INTO v_user FROM public.profiles WHERE id = v_key.user_id;
    IF v_user.role = 'admin' THEN
        INSERT INTO public.usage_logs (api_key_id, model_id, input_tokens, output_tokens, total_tokens, cost_usd, is_free, duration_ms, status_code)
        VALUES (v_key.id, p_model_id, p_input_tokens, p_output_tokens, v_total_tokens, 0.0, true, p_duration_ms, p_status_code);
        RETURN jsonb_build_object('success', true, 'is_admin', true, 'cost_usd', 0.0);
    END IF;

    SELECT * INTO v_model FROM public.models WHERE id = p_model_id;
    IF NOT FOUND OR (v_model.input_cost_per_token = 0.0 AND v_model.output_cost_per_token = 0.0) OR p_model_id LIKE '%:free' THEN
        v_is_free := true;
        v_real_cost := 0.0;
    ELSE
        v_real_cost := (GREATEST(0, p_input_tokens) * v_model.input_cost_per_token) + (GREATEST(0, p_output_tokens) * v_model.output_cost_per_token);
    END IF;

    IF v_key.subscription_id IS NOT NULL THEN
        SELECT * INTO v_sub FROM public.subscriptions WHERE id = v_key.subscription_id FOR UPDATE;

        IF FOUND THEN
            IF NOT v_is_free AND v_real_cost > 0.0 AND p_status_code < 400 THEN
                v_new_balance := GREATEST(0.0, v_sub.balance_usd - v_real_cost);
                UPDATE public.subscriptions
                SET balance_usd = v_new_balance,
                    consumed_usd = consumed_usd + v_real_cost,
                    total_tokens_consumed = total_tokens_consumed + v_total_tokens,
                    status = CASE WHEN v_new_balance <= 0.0 THEN 'depleted' ELSE 'active' END,
                    is_active = (v_new_balance > 0.0),
                    updated_at = v_now
                WHERE id = v_sub.id;

                IF v_new_balance <= 0.0 THEN
                    SELECT * INTO v_pending_sub FROM public.subscriptions WHERE user_id = v_key.user_id AND status = 'pending' ORDER BY created_at ASC LIMIT 1 FOR UPDATE;
                    IF FOUND THEN
                        UPDATE public.subscriptions SET status = 'active', is_active = true, starts_at = v_now, expires_at = v_now + INTERVAL '30 days', updated_at = v_now WHERE id = v_pending_sub.id;
                        UPDATE public.api_keys SET subscription_id = v_pending_sub.id, is_enabled = true, updated_at = v_now WHERE id = v_key.id;
                    ELSE
                        UPDATE public.api_keys SET is_enabled = false, updated_at = v_now WHERE subscription_id = v_sub.id;
                    END IF;
                END IF;
            ELSE
                v_new_balance := v_sub.balance_usd;
                UPDATE public.subscriptions SET total_tokens_consumed = total_tokens_consumed + v_total_tokens, updated_at = v_now WHERE id = v_sub.id;
            END IF;
        END IF;
    END IF;

    UPDATE public.api_keys SET last_used_at = v_now WHERE id = v_key.id;

    INSERT INTO public.usage_logs (
        api_key_id, subscription_id, model_id, power_level, input_tokens, output_tokens, total_tokens, cost_usd, is_free, duration_ms, status_code, error_message
    ) VALUES (
        v_key.id, v_key.subscription_id, p_model_id, v_model.power_level, p_input_tokens, p_output_tokens, v_total_tokens, v_real_cost, v_is_free, p_duration_ms, p_status_code, p_error_message
    );

    RETURN jsonb_build_object('success', true, 'cost_usd', v_real_cost, 'new_balance_usd', v_new_balance, 'total_tokens', v_total_tokens);
END;
$$;

-- 14. RPC: axis_generate_api_key (FIX : n'active la clé que si l'abonnement est 'active')
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
    v_user       RECORD;
    v_sub        RECORD;
    v_is_active  BOOLEAN := false;
    v_raw_secret TEXT;
    v_full_key   TEXT;
    v_key_hash   TEXT;
    v_key_prefix TEXT;
    v_key_id     UUID;
BEGIN
    PERFORM public.assert_caller_is(p_user_id);
    SELECT id, role INTO v_user FROM public.profiles WHERE id = p_user_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'http_status', 404, 'error_message', 'Utilisateur introuvable.');
    END IF;

    v_is_active := (v_user.role = 'admin');
    IF p_subscription_id IS NOT NULL THEN
        SELECT id, status, is_active
          INTO v_sub
          FROM public.subscriptions
         WHERE id = p_subscription_id AND user_id = p_user_id;
        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'http_status', 404,
                                      'error_message', 'Abonnement introuvable ou n''appartient pas à cet utilisateur.');
        END IF;
        v_is_active := (v_user.role = 'admin' OR (v_sub.status = 'active' AND v_sub.is_active = true));
    END IF;

    -- Génération cryptographique résiliente : tente pgcrypto, fallback sur random natif
    BEGIN
        v_raw_secret := encode(gen_random_bytes(24), 'hex');
    EXCEPTION WHEN OTHERS THEN
        v_raw_secret := md5(random()::text || clock_timestamp()::text) || md5(random()::text || clock_timestamp()::text);
    END;

    v_full_key := 'axis_live_' || substr(v_raw_secret, 1, 40);

    -- Hachage SHA-256 résilient
    BEGIN
        v_key_hash := encode(digest(v_full_key, 'sha256'), 'hex');
    EXCEPTION WHEN OTHERS THEN
        v_key_hash := encode(sha256(v_full_key::bytea), 'hex');
    END;

    v_key_prefix := 'ax_' || substr(v_raw_secret, 1, 8) || '...';

    INSERT INTO public.api_keys (user_id, subscription_id, key_hash, key_prefix, name, is_enabled, daily_request_limit)
    VALUES (
        p_user_id,
        p_subscription_id,
        v_key_hash,
        v_key_prefix,
        coalesce(nullif(trim(p_name), ''), 'Default API Key'),
        v_is_active,
        p_daily_limit
    )
    RETURNING id INTO v_key_id;

    RETURN jsonb_build_object(
        'success', true,
        'http_status', 201,
        'key_id', v_key_id,
        'api_key', v_full_key,
        'key_prefix', v_key_prefix,
        'is_enabled', v_is_active,
        'warning', 'Sauvegardez cette clé maintenant. Elle ne sera plus jamais affichée en clair.'
    );
END;
$$;

-- 15. RPC: axis_refresh_api_key (FIX : préfixe correct, blocage pending, retour normalisé)
CREATE OR REPLACE FUNCTION public.axis_refresh_api_key(p_key_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
    v_old_key RECORD; v_owner_role TEXT; v_sub_status TEXT;
    v_raw_secret TEXT; v_full_key TEXT; v_key_hash TEXT; v_key_prefix TEXT;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    SELECT * INTO v_old_key FROM public.api_keys WHERE id = p_key_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'http_status', 404,
            'error_code', 'KEY_NOT_FOUND', 'error_message', 'Clé API introuvable.');
    END IF;
    IF auth.uid() IS NOT NULL AND v_old_key.user_id <> auth.uid()
       AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RETURN jsonb_build_object('success', false, 'http_status', 403,
            'error_code', 'FORBIDDEN', 'error_message', 'Cette clé ne vous appartient pas.');
    END IF;
    SELECT role INTO v_owner_role FROM public.profiles WHERE id = v_old_key.user_id;
    IF v_owner_role IS DISTINCT FROM 'admin' AND v_old_key.subscription_id IS NOT NULL THEN
        SELECT status INTO v_sub_status FROM public.subscriptions WHERE id = v_old_key.subscription_id;
        IF v_sub_status IN ('pending', 'pending_validation') THEN
            RETURN jsonb_build_object('success', false, 'http_status', 409,
                'error_code', 'REFRESH_BLOCKED_PENDING',
                'error_message', 'Régénération impossible : l''abonnement lié est en attente de validation.',
                'subscription_id', v_old_key.subscription_id);
        END IF;
    END IF;
    BEGIN v_raw_secret := encode(gen_random_bytes(24), 'hex');
    EXCEPTION WHEN OTHERS THEN
        v_raw_secret := md5(random()::text || clock_timestamp()::text) || md5(random()::text || clock_timestamp()::text);
    END;
    v_full_key := 'axis_live_' || substr(v_raw_secret, 1, 40);
    BEGIN v_key_hash := encode(digest(v_full_key, 'sha256'), 'hex');
    EXCEPTION WHEN OTHERS THEN v_key_hash := encode(sha256(v_full_key::bytea), 'hex');
    END;
    v_key_prefix := 'ax_' || substr(v_raw_secret, 1, 8) || '...';
    UPDATE public.api_keys SET key_hash = v_key_hash, key_prefix = v_key_prefix,
        last_used_at = NULL, updated_at = v_now WHERE id = p_key_id;
    RETURN jsonb_build_object('success', true, 'http_status', 200, 'key_id', p_key_id,
        'api_key', v_full_key, 'new_api_key', v_full_key, 'key_prefix', v_key_prefix,
        'is_enabled', v_old_key.is_enabled, 'subscription_id', v_old_key.subscription_id,
        'warning', 'Ancienne clé révoquée. Sauvegardez la nouvelle clé maintenant.');
END;
$$;

-- 16. RPC: axis_revoke_api_key
-- Désactive ou supprime définitivement une clé API.
CREATE OR REPLACE FUNCTION public.axis_revoke_api_key(
    p_key_id UUID,
    p_delete BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.api_keys
        WHERE id = p_key_id
          AND (auth.uid() IS NULL OR user_id = auth.uid() OR public.is_admin_unlocked())
    ) THEN
        RETURN jsonb_build_object('success', false, 'http_status', 404, 'error_message', 'Clé API introuvable.');
    END IF;

    IF p_delete THEN
        -- Interdit de supprimer une clé liée à un abonnement en attente ou validé
        IF EXISTS (
            SELECT 1 FROM public.api_keys k
            JOIN public.subscriptions s ON s.id = k.subscription_id
            WHERE k.id = p_key_id AND s.status IN ('pending_validation', 'pending', 'active')
        ) THEN
            RETURN jsonb_build_object('success', false, 'http_status', 409,
                'error_code', 'KEY_HAS_SUBSCRIPTION',
                'error_message', 'Suppression impossible : cette clé est liée à un abonnement en attente ou validé.');
        END IF;
        DELETE FROM public.api_keys WHERE id = p_key_id;
        RETURN jsonb_build_object('success', true, 'action', 'deleted', 'key_id', p_key_id);
    ELSE
        UPDATE public.api_keys SET is_enabled = false, updated_at = v_now WHERE id = p_key_id;
        RETURN jsonb_build_object('success', true, 'action', 'disabled', 'key_id', p_key_id);
    END IF;
END;
$$;

-- 17. RPC: axis_cleanup_expired_subscriptions
-- Cron : expire les abonnements échus et active les packs "pending" en attente.
CREATE OR REPLACE FUNCTION public.axis_cleanup_expired_subscriptions()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_expired_count INTEGER := 0;
    v_activated_count INTEGER := 0;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_sub RECORD;
    v_pending_sub RECORD;
BEGIN
    FOR v_sub IN
        SELECT * FROM public.subscriptions
        WHERE status = 'active' AND is_active = true AND (expires_at <= v_now OR balance_usd <= 0)
        FOR UPDATE SKIP LOCKED
    LOOP
        UPDATE public.subscriptions
        SET status = CASE WHEN balance_usd <= 0 THEN 'depleted' ELSE 'expired' END,
            is_active = false,
            updated_at = v_now
        WHERE id = v_sub.id;

        v_expired_count := v_expired_count + 1;

        SELECT * INTO v_pending_sub
        FROM public.subscriptions
        WHERE user_id = v_sub.user_id AND status = 'pending'
        ORDER BY created_at ASC LIMIT 1
        FOR UPDATE SKIP LOCKED;

        IF FOUND THEN
            UPDATE public.subscriptions
            SET status = 'active', is_active = true,
                starts_at = v_now, expires_at = v_now + INTERVAL '30 days',
                updated_at = v_now
            WHERE id = v_pending_sub.id;

            UPDATE public.api_keys
            SET subscription_id = v_pending_sub.id, is_enabled = true, updated_at = v_now
            WHERE user_id = v_sub.user_id;

            v_activated_count := v_activated_count + 1;
        ELSE
            UPDATE public.api_keys
            SET is_enabled = false, updated_at = v_now
            WHERE user_id = v_sub.user_id AND subscription_id = v_sub.id;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'expired_count', v_expired_count,
        'activated_pending_count', v_activated_count,
        'ran_at', v_now
    );
END;
$$;

-- 18. RPC: axis_get_moderator_dashboard
-- Retourne la liste des abonnements rattachés au code du modérateur + totaux commissions.
CREATE OR REPLACE FUNCTION public.axis_get_moderator_dashboard(
    p_moderator_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_mod RECORD;
    v_clients JSONB;
    v_totals JSONB;
BEGIN
    PERFORM public.assert_caller_is(p_moderator_id);
    SELECT id, role, moderator_code INTO v_mod FROM public.profiles WHERE id = p_moderator_id;
    IF NOT FOUND OR v_mod.role NOT IN ('admin', 'moderator') THEN
        RETURN jsonb_build_object('success', false, 'http_status', 403, 'error_message', 'Accès refusé.');
    END IF;

    SELECT jsonb_agg(
        jsonb_build_object(
            'subscription_id', s.id,
            'client_username', p.username,
            'client_pseudo', p.pseudo,
            'tier_number', s.tier_number,
            'status', s.status,
            'is_active', s.is_active,
            'balance_usd', s.balance_usd,
            'budget_amount_usd', s.budget_amount_usd,
            'commission_status', s.commission_status,
            'validated_at', s.validated_at,
            'expires_at', s.expires_at,
            'starts_at', s.starts_at
        ) ORDER BY s.created_at DESC
    ) INTO v_clients
    FROM public.subscriptions s
    JOIN public.profiles p ON p.id = s.user_id
    WHERE s.moderator_id = p_moderator_id;

    SELECT jsonb_build_object(
        'total_validated', count(*),
        'unpaid_commissions', count(*) FILTER (WHERE commission_status = 'unpaid'),
        'paid_commissions', count(*) FILTER (WHERE commission_status = 'paid'),
        'archived_commissions', count(*) FILTER (WHERE commission_status = 'archived')
    ) INTO v_totals
    FROM public.subscriptions
    WHERE moderator_id = p_moderator_id;

    RETURN jsonb_build_object(
        'success', true,
        'moderator_code', v_mod.moderator_code,
        'totals', v_totals,
        'clients', coalesce(v_clients, '[]'::jsonb)
    );
END;
$$;

-- 19. RPC: axis_get_popup_alert
-- Appelé à chaque ouverture de session : retourne le message de suspension admin si présent.
CREATE OR REPLACE FUNCTION public.axis_get_popup_alert(
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_disabled_sub RECORD;
BEGIN
    PERFORM public.assert_caller_is(p_user_id);
    SELECT disabled_reason, disabled_at, disabled_by INTO v_disabled_sub
    FROM public.subscriptions
    WHERE user_id = p_user_id AND status = 'disabled' AND disabled_reason IS NOT NULL
    ORDER BY disabled_at DESC LIMIT 1;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'has_alert', true,
            'alert_type', 'subscription_disabled',
            'message', v_disabled_sub.disabled_reason,
            'disabled_at', v_disabled_sub.disabled_at
        );
    END IF;

    RETURN jsonb_build_object('has_alert', false);
END;
$$;

-- 20. RPC: admin_archive_commission
-- L'admin archive/clôture une commission modérateur après paiement externe.
CREATE OR REPLACE FUNCTION public.admin_archive_commission(
    p_admin_id UUID,
    p_subscription_id UUID,
    p_new_status TEXT DEFAULT 'paid'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin RECORD;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    PERFORM public.assert_caller_is(p_admin_id);
    PERFORM public.assert_admin_unlocked();
    SELECT role INTO v_admin FROM public.profiles WHERE id = p_admin_id;
    IF NOT FOUND OR v_admin.role != 'admin' THEN
        RETURN jsonb_build_object('success', false, 'http_status', 403, 'error_message', 'Action réservée exclusivement à l''administrateur.');
    END IF;

    IF p_new_status NOT IN ('paid', 'archived') THEN
        RETURN jsonb_build_object('success', false, 'http_status', 400, 'error_message', 'Statut invalide. Valeurs acceptées : paid, archived.');
    END IF;

    UPDATE public.subscriptions
    SET commission_status = p_new_status, updated_at = v_now
    WHERE id = p_subscription_id AND moderator_id IS NOT NULL;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'http_status', 404, 'error_message', 'Abonnement introuvable ou sans modérateur rattaché.');
    END IF;

    RETURN jsonb_build_object('success', true, 'subscription_id', p_subscription_id, 'commission_status', p_new_status);
END;
$$;

-- ==============================================================================
-- 21. ROW LEVEL SECURITY (RLS)
-- Les RPCs utilisent SECURITY DEFINER (ils contournent RLS automatiquement).
-- Ces règles protègent l'accès direct aux tables depuis le client JS (anon/auth).
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent (idempotent)
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_admin_all" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_moderator_assigned" ON public.subscriptions;
DROP POLICY IF EXISTS "api_keys_select_own" ON public.api_keys;
DROP POLICY IF EXISTS "api_keys_admin_all" ON public.api_keys;
DROP POLICY IF EXISTS "usage_logs_select_own" ON public.usage_logs;
DROP POLICY IF EXISTS "usage_logs_admin_all" ON public.usage_logs;
DROP POLICY IF EXISTS "tiers_public_read" ON public.tiers;
DROP POLICY IF EXISTS "models_public_read" ON public.models;

-- Helper non-récursif (SECURITY DEFINER contourne RLS automatiquement)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ── SÉCURITÉ ADMIN : PIN haché, anti brute-force, session de déverrouillage ───
CREATE TABLE IF NOT EXISTS public.admin_security (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    pin_hash TEXT NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT true,
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ DEFAULT NULL,
    unlocked_until TIMESTAMPTZ DEFAULT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.admin_security ENABLE ROW LEVEL SECURITY;   -- aucune policy : accès uniquement via les RPC
REVOKE ALL ON TABLE public.admin_security FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.app_admin_email()
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$ SELECT 'aureltchiakpe819@gmail.com'::text $$;

-- Admin ET PIN saisi (session de 2 h) : base de toutes les policies et RPC d'administration
CREATE OR REPLACE FUNCTION public.is_admin_unlocked()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin() AND EXISTS (
    SELECT 1 FROM public.admin_security s
    WHERE s.user_id = auth.uid() AND s.unlocked_until > now()
  );
$$;

CREATE OR REPLACE FUNCTION public.assert_admin_unlocked()
RETURNS VOID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- auth.uid() NULL = backend (service_role)
    IF auth.uid() IS NOT NULL AND NOT public.is_admin_unlocked() THEN
        RAISE EXCEPTION 'PIN administrateur requis' USING ERRCODE = '42501';
    END IF;
END;
$$;

-- ── PROFILES ──────────────────────────────────────────────────────────────────
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR public.is_admin_unlocked());

CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id OR public.is_admin_unlocked())
    WITH CHECK (auth.uid() = id OR public.is_admin_unlocked());

-- ── SUBSCRIPTIONS ─────────────────────────────────────────────────────────────
CREATE POLICY "subscriptions_select_own" ON public.subscriptions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "subscriptions_admin_all" ON public.subscriptions
    FOR ALL USING (public.is_admin_unlocked());

-- Modérateur : lecture seule des abonnements de ses clients assignés
CREATE POLICY "subscriptions_moderator_assigned" ON public.subscriptions
    FOR SELECT USING (moderator_id = auth.uid());

-- ── API KEYS ──────────────────────────────────────────────────────────────────
CREATE POLICY "api_keys_select_own" ON public.api_keys
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "api_keys_admin_all" ON public.api_keys
    FOR ALL USING (public.is_admin_unlocked());

-- ── USAGE LOGS ────────────────────────────────────────────────────────────────
CREATE POLICY "usage_logs_select_own" ON public.usage_logs
    FOR SELECT USING (
        api_key_id IN (SELECT id FROM public.api_keys WHERE user_id = auth.uid())
    );

CREATE POLICY "usage_logs_admin_all" ON public.usage_logs
    FOR ALL USING (public.is_admin_unlocked());

-- ── TIERS & MODELS : Lecture publique (catalogue accessible sans auth) ─────────
CREATE POLICY "tiers_public_read" ON public.tiers
    FOR SELECT USING (true);

CREATE POLICY "models_public_read" ON public.models
    FOR SELECT USING (true);

-- ==============================================================================
-- HOTFIX v2.1 : Trigger de synchronisation clé ↔ abonnement
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.sync_key_on_subscription_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status
       OR NEW.is_active IS DISTINCT FROM OLD.is_active THEN
        UPDATE public.api_keys
        SET is_enabled = (NEW.status = 'active' AND NEW.is_active = true),
            updated_at = timezone('utc'::text, now())
        WHERE subscription_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_key_on_subscription_change ON public.subscriptions;
CREATE TRIGGER trg_sync_key_on_subscription_change
    AFTER UPDATE OF status, is_active
    ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_key_on_subscription_change();

-- ==============================================================================
-- 22. TRIGGERS D'INTÉGRITÉ ET DURCISSEMENT SÉCURITÉ (v2.3)
-- ==============================================================================

-- 22.1 Une clé ne s'active que si son abonnement (le sien) est actif
CREATE OR REPLACE FUNCTION public.enforce_key_requires_active_sub()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role TEXT;
    v_ok   BOOLEAN := false;
BEGIN
    -- Interdit de rattacher une clé à l'abonnement d'un autre utilisateur
    IF NEW.subscription_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.subscriptions
        WHERE id = NEW.subscription_id AND user_id = NEW.user_id
    ) THEN
        RAISE EXCEPTION 'Abonnement invalide pour cette clé' USING ERRCODE = '42501';
    END IF;

    IF NEW.is_enabled IS NOT TRUE THEN RETURN NEW; END IF;

    SELECT role INTO v_role FROM public.profiles WHERE id = NEW.user_id;
    IF v_role = 'admin' THEN RETURN NEW; END IF;

    IF NEW.subscription_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.subscriptions
            WHERE id = NEW.subscription_id
              AND status = 'active' AND is_active = true
              AND expires_at > now() AND balance_usd > 0
        ) INTO v_ok;
    END IF;

    IF NOT v_ok THEN NEW.is_enabled := false; END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_key_requires_active_sub ON public.api_keys;
CREATE TRIGGER trg_key_requires_active_sub
    BEFORE INSERT OR UPDATE OF is_enabled, subscription_id ON public.api_keys
    FOR EACH ROW EXECUTE FUNCTION public.enforce_key_requires_active_sub();

-- 22.2 Un non-admin ne peut pas modifier son rôle ni son code modérateur
CREATE OR REPLACE FUNCTION public.protect_profile_privileges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NOT NULL AND NOT public.is_admin_unlocked() THEN
        IF NEW.role IS DISTINCT FROM OLD.role
           OR NEW.moderator_code IS DISTINCT FROM OLD.moderator_code THEN
            RAISE EXCEPTION 'Modification du rôle interdite' USING ERRCODE = '42501';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_privileges ON public.profiles;
CREATE TRIGGER trg_protect_profile_privileges
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileges();

-- 22.3 Une clé liée à un abonnement en attente ou validé ne peut pas être supprimée
CREATE OR REPLACE FUNCTION public.prevent_key_delete_with_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Suppression en cascade (compte supprimé) : on ne bloque pas
    IF pg_trigger_depth() > 1 THEN RETURN OLD; END IF;

    IF OLD.subscription_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.subscriptions
        WHERE id = OLD.subscription_id AND status IN ('pending_validation', 'pending', 'active')
    ) THEN
        RAISE EXCEPTION 'KEY_HAS_SUBSCRIPTION : clé liée à un abonnement en attente ou validé'
            USING ERRCODE = '23503';
    END IF;
    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_key_delete ON public.api_keys;
CREATE TRIGGER trg_prevent_key_delete
    BEFORE DELETE ON public.api_keys
    FOR EACH ROW EXECUTE FUNCTION public.prevent_key_delete_with_subscription();

-- 22.4 Le rôle admin est réservé au compte propriétaire
CREATE OR REPLACE FUNCTION public.enforce_single_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.role = 'admin' AND lower(NEW.email) IS DISTINCT FROM lower(public.app_admin_email()) THEN
        RAISE EXCEPTION 'Le rôle admin est réservé au compte propriétaire' USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_single_admin ON public.profiles;
CREATE TRIGGER trg_enforce_single_admin
    BEFORE INSERT OR UPDATE OF role, email ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.enforce_single_admin();

-- Promotion du compte propriétaire (idempotent ; le compte doit déjà exister et être confirmé)
UPDATE public.profiles
SET role = 'admin', updated_at = timezone('utc'::text, now())
WHERE lower(email) = lower(public.app_admin_email()) AND role <> 'admin';

-- 22.5 PIN administrateur (vérification, déverrouillage 2 h, changement, verrouillage)
-- Contrôle interne : compteur d'échecs, blocage 15 min après 5 erreurs
CREATE OR REPLACE FUNCTION public.private_admin_pin_check(p_pin TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_hash TEXT; v_fail INTEGER; v_lock TIMESTAMPTZ;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    IF NOT public.is_admin() THEN
        RETURN jsonb_build_object('ok', false, 'error_code', 'FORBIDDEN', 'error_message', 'Accès réservé à l''administrateur.');
    END IF;
    IF p_pin IS NULL OR p_pin !~ '^[0-9]{5,8}$' THEN
        RETURN jsonb_build_object('ok', false, 'error_code', 'PIN_FORMAT', 'error_message', 'Le PIN contient 5 à 8 chiffres.');
    END IF;

    -- Première utilisation : PIN par défaut (à changer dans le dashboard)
    INSERT INTO public.admin_security (user_id, pin_hash)
    VALUES (auth.uid(), crypt('10606', gen_salt('bf')))
    ON CONFLICT (user_id) DO NOTHING;

    SELECT pin_hash, failed_attempts, locked_until INTO v_hash, v_fail, v_lock
    FROM public.admin_security WHERE user_id = auth.uid() FOR UPDATE;

    IF v_lock IS NOT NULL AND v_lock > v_now THEN
        RETURN jsonb_build_object('ok', false, 'error_code', 'PIN_LOCKED', 'locked_until', v_lock,
            'error_message', 'Trop de tentatives. Réessayez plus tard.');
    END IF;

    IF crypt(p_pin, v_hash) = v_hash THEN
        UPDATE public.admin_security SET failed_attempts = 0, locked_until = NULL, updated_at = v_now WHERE user_id = auth.uid();
        RETURN jsonb_build_object('ok', true);
    END IF;

    v_fail := v_fail + 1;
    IF v_fail >= 5 THEN
        UPDATE public.admin_security SET failed_attempts = 0, locked_until = v_now + INTERVAL '15 minutes', updated_at = v_now WHERE user_id = auth.uid();
        RETURN jsonb_build_object('ok', false, 'error_code', 'PIN_LOCKED', 'locked_until', v_now + INTERVAL '15 minutes',
            'error_message', 'Trop de tentatives. Accès bloqué 15 minutes.');
    END IF;
    UPDATE public.admin_security SET failed_attempts = v_fail, updated_at = v_now WHERE user_id = auth.uid();
    RETURN jsonb_build_object('ok', false, 'error_code', 'PIN_INVALID', 'attempts_left', 5 - v_fail,
        'error_message', 'PIN incorrect.');
END;
$$;

CREATE OR REPLACE FUNCTION public.axis_admin_pin_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_unlocked TIMESTAMPTZ; v_lock TIMESTAMPTZ; v_default BOOLEAN;
BEGIN
    IF NOT public.is_admin() THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'FORBIDDEN');
    END IF;
    SELECT unlocked_until, locked_until, is_default INTO v_unlocked, v_lock, v_default
    FROM public.admin_security WHERE user_id = auth.uid();
    RETURN jsonb_build_object(
        'success', true,
        'unlocked', COALESCE(v_unlocked > now(), false),
        'unlocked_until', v_unlocked,
        'locked_until', CASE WHEN v_lock > now() THEN v_lock END,
        'is_default_pin', COALESCE(v_default, true)
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.axis_admin_verify_pin(p_pin TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE v_res JSONB; v_until TIMESTAMPTZ := timezone('utc'::text, now()) + INTERVAL '2 hours'; v_default BOOLEAN;
BEGIN
    v_res := public.private_admin_pin_check(p_pin);
    IF NOT COALESCE((v_res->>'ok')::boolean, false) THEN
        RETURN v_res || jsonb_build_object('success', false);
    END IF;
    UPDATE public.admin_security SET unlocked_until = v_until WHERE user_id = auth.uid()
    RETURNING is_default INTO v_default;
    RETURN jsonb_build_object('success', true, 'unlocked_until', v_until, 'is_default_pin', v_default);
END;
$$;

CREATE OR REPLACE FUNCTION public.axis_admin_change_pin(p_current TEXT, p_new TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE v_res JSONB;
BEGIN
    PERFORM public.assert_admin_unlocked();
    v_res := public.private_admin_pin_check(p_current);
    IF NOT COALESCE((v_res->>'ok')::boolean, false) THEN
        RETURN v_res || jsonb_build_object('success', false);
    END IF;
    IF p_new IS NULL OR p_new !~ '^[0-9]{5,8}$' THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'PIN_FORMAT', 'error_message', 'Le nouveau PIN contient 5 à 8 chiffres.');
    END IF;
    IF p_new = p_current OR p_new = '10606' THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'PIN_WEAK', 'error_message', 'Choisissez un PIN différent de l''actuel et du PIN par défaut.');
    END IF;
    UPDATE public.admin_security
    SET pin_hash = crypt(p_new, gen_salt('bf')), is_default = false, failed_attempts = 0, locked_until = NULL,
        updated_at = timezone('utc'::text, now())
    WHERE user_id = auth.uid();
    RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.axis_admin_lock()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.admin_security SET unlocked_until = NULL WHERE user_id = auth.uid();
    RETURN jsonb_build_object('success', true);
END;
$$;

-- 22.6 Privilèges d'exécution (DOIT rester en DERNIER, rejoué à chaque exécution)
--   Backend uniquement (service_role) : gatekeeper, settle_usage, cleanup
--   Front connecté (authenticated)    : les RPC listées dans v_front
--   anon / PUBLIC                     : aucune RPC axis_* / admin_*
DO $$
DECLARE
    r RECORD;
    v_front TEXT[] := ARRAY[
        'axis_generate_api_key', 'axis_refresh_api_key', 'axis_revoke_api_key',
        'axis_subscribe', 'axis_get_popup_alert', 'axis_get_moderator_dashboard',
        'axis_moderator_validate_subscription',
        'axis_moderator_validate_subscription_by_code',
        'admin_disable_subscription', 'axis_create_moderator', 'admin_archive_commission',
        'axis_admin_pin_status', 'axis_admin_verify_pin', 'axis_admin_change_pin', 'axis_admin_lock'
    ];
BEGIN
    FOR r IN
        SELECT p.oid::regprocedure AS sig, p.proname
        FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname ~ '^(axis|admin|private)_'
    LOOP
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
        EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
        IF r.proname = ANY (v_front) THEN
            EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.sig);
        END IF;
    END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- FIN DU SCRIPT — ACCESS AI / AXIS PROXY — Production Schema v2.3
-- Instance : oahduqmmqiwdldsqmzhv.supabase.co
-- 6 tables · 20 RPCs · RLS complète · triggers d'intégrité · privilèges d'exécution restreints · PIN admin · avatars
-- Synchronisation atomique clé ↔ abonnement activée
-- ==============================================================================
