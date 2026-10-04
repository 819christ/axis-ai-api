-- ==============================================================================
-- ACCESS AI / AXIS PROXY - PRODUCTION DATABASE ARCHITECTURE & ROLES
-- ROLES: admin, moderator, client | VALIDATION HORS-LIGNE & COMMISSIONS | RÈGLE J-7
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. TABLE: profiles (Authentification, Rôles et Codes Modérateurs)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    pseudo VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'moderator', 'client')),
    moderator_code VARCHAR(20) UNIQUE DEFAULT NULL, -- ex: 'MOD-8421' (attribué aux modérateurs)
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_moderator_code ON public.profiles(moderator_code);

-- Trigger automatique de création du profil à l'inscription (Google Auth & Email/MDP)
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

-- ------------------------------------------------------------------------------
-- 2. TABLE: tiers (Les 7 Paliers d'abonnements et formule MaxAllowedCost)
-- Formule : MaxAllowedCost(P_i) = alpha * i + beta (en USD par 1M tokens combinés)
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 3. TABLE: models (Catalogue OpenRouter & Niveaux de Puissance Axis Auto)
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 4. TABLE: subscriptions (Cycle 30 jours, validation modérateur, J-7 & motif de désactivation)
-- ------------------------------------------------------------------------------
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
    
    -- Suivi Modérateur & Validation hors-ligne
    moderator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    moderator_code_used VARCHAR(20) DEFAULT NULL,
    validated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    validated_at TIMESTAMPTZ DEFAULT NULL,
    commission_status VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (commission_status IN ('unpaid', 'paid', 'archived', 'none')),

    -- Justificatif de désactivation administrative (Affiché en popup/alerte au client)
    disabled_reason TEXT DEFAULT NULL,
    disabled_at TIMESTAMPTZ DEFAULT NULL,
    disabled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_sub_dates CHECK (expires_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON public.subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_moderator ON public.subscriptions(moderator_id, commission_status);

-- ------------------------------------------------------------------------------
-- 5. TABLE: api_keys (1 clé API = 1 abonnement actif unique)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    key_hash VARCHAR(64) NOT NULL UNIQUE,
    key_prefix VARCHAR(16) NOT NULL,
    name VARCHAR(100) NOT NULL DEFAULT 'Default API Key',
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    daily_request_limit INTEGER DEFAULT NULL,
    last_used_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);

-- ------------------------------------------------------------------------------
-- 6. TABLE: usage_logs
-- ------------------------------------------------------------------------------
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

-- ==============================================================================
-- 7. FONCTIONS RPC MÉTIER
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- RPC 1 : axis_create_moderator (Création d'un modérateur par l'administrateur)
-- ------------------------------------------------------------------------------
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
    -- Vérification des droits administrateur
    SELECT role INTO v_admin FROM public.profiles WHERE id = p_admin_id;
    IF NOT FOUND OR v_admin.role != 'admin' THEN
        RETURN jsonb_build_object(
            'success', false,
            'http_status', 403,
            'error_code', 'UNAUTHORIZED',
            'error_message', 'Seul un administrateur peut créer ou nommer un modérateur.'
        );
    END IF;

    -- Génération d'un code unique MOD-XXXX si non fourni
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

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'http_status', 404, 'error_message', 'Utilisateur introuvable.');
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'http_status', 200,
        'user_id', p_user_id,
        'role', 'moderator',
        'moderator_code', v_mod_code,
        'message', format('Rôle modérateur attribué avec succès. Identifiant : %s', v_mod_code)
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- RPC 2 : axis_subscribe (Souscription par le client avec saisie modérateur et règle J-7)
-- ------------------------------------------------------------------------------
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
    v_new_sub_id UUID;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_is_renewal BOOLEAN := false;
    v_starts_at TIMESTAMPTZ;
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- 1. Vérification du palier
    SELECT * INTO v_tier FROM public.tiers WHERE tier_number = p_tier_number;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'http_status', 400, 'error_code', 'INVALID_TIER', 'error_message', 'Palier invalide.');
    END IF;

    -- 2. Recherche du modérateur si un code a été renseigné
    IF p_moderator_code IS NOT NULL AND trim(p_moderator_code) != '' THEN
        SELECT id, moderator_code INTO v_mod
        FROM public.profiles
        WHERE moderator_code = upper(trim(p_moderator_code)) AND role = 'moderator';

        IF NOT FOUND THEN
            RETURN jsonb_build_object(
                'success', false,
                'http_status', 404,
                'error_code', 'INVALID_MODERATOR_CODE',
                'error_message', format('Le code modérateur "%s" est invalide ou inactif.', p_moderator_code)
            );
        END IF;
    END IF;

    -- 3. Vérification de l'abonnement actif pour la règle anti-abus des 7 jours
    SELECT * INTO v_active_sub
    FROM public.subscriptions
    WHERE user_id = p_user_id
      AND status = 'active'
      AND is_active = true
      AND expires_at > v_now
      AND balance_usd > 0
    ORDER BY created_at DESC
    LIMIT 1;

    IF FOUND THEN
        -- Règle J-7 : Tentative avant les 7 derniers jours -> REFUS STRICT
        IF v_now < (v_active_sub.expires_at - INTERVAL '7 days') THEN
            RETURN jsonb_build_object(
                'success', false,
                'http_status', 409,
                'error_code', 'EARLY_RENEWAL_FORBIDDEN',
                'error_message', format(
                    'Vous disposez déjà d''un abonnement actif. La souscription anticipée n''est autorisée que dans les 7 jours précédant l''expiration (à partir du %s).',
                    (v_active_sub.expires_at - INTERVAL '7 days')::date
                ),
                'active_expires_at', v_active_sub.expires_at
            );
        END IF;

        -- Vérification si un renouvellement en attente existe déjà
        SELECT id INTO v_pending_sub
        FROM public.subscriptions
        WHERE user_id = p_user_id AND status IN ('pending', 'pending_validation')
        LIMIT 1;

        IF FOUND THEN
            RETURN jsonb_build_object(
                'success', false,
                'http_status', 409,
                'error_code', 'PENDING_ALREADY_EXISTS',
                'error_message', 'Un abonnement de renouvellement est déjà en attente pour votre compte.'
            );
        END IF;

        v_is_renewal := true;
        v_starts_at := v_active_sub.expires_at;
        v_expires_at := v_starts_at + INTERVAL '30 days';
    ELSE
        v_starts_at := v_now;
        v_expires_at := v_now + INTERVAL '30 days';
    END IF;

    -- 4. Création de la souscription en attente de paiement / validation hors-ligne
    INSERT INTO public.subscriptions (
        user_id,
        tier_number,
        budget_amount_usd,
        balance_usd,
        consumed_usd,
        starts_at,
        expires_at,
        status,
        is_active,
        moderator_id,
        moderator_code_used,
        commission_status
    ) VALUES (
        p_user_id,
        v_tier.tier_number,
        v_tier.budget_amount_usd,
        v_tier.budget_amount_usd,
        0.0,
        v_starts_at,
        v_expires_at,
        'pending_validation',
        false,
        v_mod.id,
        v_mod.moderator_code,
        CASE WHEN v_mod.id IS NOT NULL THEN 'unpaid' ELSE 'none' END
    ) RETURNING id INTO v_new_sub_id;

    RETURN jsonb_build_object(
        'success', true,
        'http_status', 201,
        'subscription_id', v_new_sub_id,
        'status', 'pending_validation',
        'is_renewal_j7', v_is_renewal,
        'tier_number', v_tier.tier_number,
        'price_usd', v_tier.price_usd,
        'moderator_assigned', v_mod.moderator_code,
        'instructions', 'Veuillez effectuer le règlement hors-ligne sur le numéro officiel. Votre abonnement sera activé dès validation par le modérateur ou l''administrateur.'
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- RPC 3 : axis_moderator_validate_subscription (Validation de l'abonnement par le Modérateur)
-- ------------------------------------------------------------------------------
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
    -- 1. Contrôle des permissions de l'opérateur (Modérateur ou Admin)
    SELECT role, moderator_code INTO v_validator
    FROM public.profiles
    WHERE id = p_validator_id;

    IF NOT FOUND OR v_validator.role NOT IN ('admin', 'moderator') THEN
        RETURN jsonb_build_object(
            'success', false,
            'http_status', 403,
            'error_code', 'UNAUTHORIZED',
            'error_message', 'Seuls les modérateurs et administrateurs peuvent valider les abonnements.'
        );
    END IF;

    -- 2. Recherche et verrouillage de l'abonnement
    SELECT * INTO v_sub
    FROM public.subscriptions
    WHERE id = p_subscription_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'http_status', 404, 'error_message', 'Abonnement introuvable.');
    END IF;

    IF v_sub.status != 'pending_validation' THEN
        RETURN jsonb_build_object(
            'success', false,
            'http_status', 400,
            'error_code', 'ALREADY_PROCESSED',
            'error_message', format('Cet abonnement est déjà dans l''état "%s".', v_sub.status)
        );
    END IF;

    -- Un modérateur ne peut valider que les clients qui ont renseigné son code (ou assignés à lui)
    IF v_validator.role = 'moderator' AND v_sub.moderator_id IS NOT NULL AND v_sub.moderator_id != p_validator_id THEN
        RETURN jsonb_build_object(
            'success', false,
            'http_status', 403,
            'error_code', 'FORBIDDEN',
            'error_message', 'Vous ne pouvez valider que les abonnements rattachés à votre identifiant modérateur.'
        );
    END IF;

    -- 3. Détermination du statut : Actif immédiat ou Pending (si renouvellement J-7)
    SELECT id, expires_at INTO v_active_sub
    FROM public.subscriptions
    WHERE user_id = v_sub.user_id
      AND id != v_sub.id
      AND status = 'active'
      AND is_active = true
      AND expires_at > v_now
      AND balance_usd > 0
    LIMIT 1;

    IF FOUND THEN
        -- Le client a encore un abonnement actif en cours -> pack validé placé en 'pending' pour la relève
        v_new_status := 'pending';
        v_make_active := false;
    ELSE
        -- Pas d'abonnement actif -> Activation immédiate pour 30 jours
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

    -- Si activation immédiate, mise à jour ou raccordement de la clé API du client
    IF v_make_active THEN
        UPDATE public.api_keys
        SET subscription_id = p_subscription_id,
            is_enabled = true,
            updated_at = v_now
        WHERE user_id = v_sub.user_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'http_status', 200,
        'subscription_id', p_subscription_id,
        'assigned_status', v_new_status,
        'is_active', v_make_active,
        'validated_by', p_validator_id,
        'message', CASE 
            WHEN v_make_active THEN 'Paiement validé : abonnement activé immédiatement pour 30 jours.'
            ELSE 'Paiement validé : abonnement mis en attente (relais automatique à l''échéance de l''actuel).'
        END
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- RPC 4 : admin_disable_subscription (Désactivation avec motif obligatoire - Admin Seul)
-- ------------------------------------------------------------------------------
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
    v_sub RECORD;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    -- 1. Contrôle strict du rôle administrateur
    SELECT role INTO v_admin FROM public.profiles WHERE id = p_admin_id;
    IF NOT FOUND OR v_admin.role != 'admin' THEN
        RETURN jsonb_build_object(
            'success', false,
            'http_status', 403,
            'error_code', 'UNAUTHORIZED',
            'error_message', 'Action réservée exclusivement à l''administrateur suprême. Les modérateurs n''ont pas le droit de désactiver un abonnement.'
        );
    END IF;

    -- 2. Justificatif textuel obligatoire
    IF p_reason IS NULL OR length(trim(p_reason)) < 5 THEN
        RETURN jsonb_build_object(
            'success', false,
            'http_status', 400,
            'error_code', 'REASON_REQUIRED',
            'error_message', 'Un justificatif textuel détaillé est obligatoire pour désactiver un abonnement.'
        );
    END IF;

    -- 3. Désactivation de l'abonnement
    UPDATE public.subscriptions
    SET status = 'disabled',
        is_active = false,
        disabled_reason = trim(p_reason),
        disabled_at = v_now,
        disabled_by = p_admin_id,
        updated_at = v_now
    WHERE id = p_subscription_id
    RETURNING * INTO v_sub;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'http_status', 404, 'error_message', 'Abonnement introuvable.');
    END IF;

    -- Désactivation immédiate de la clé API
    UPDATE public.api_keys
    SET is_enabled = false,
        updated_at = v_now
    WHERE subscription_id = p_subscription_id;

    RETURN jsonb_build_object(
        'success', true,
        'http_status', 200,
        'subscription_id', p_subscription_id,
        'disabled_reason', trim(p_reason),
        'message', 'Abonnement désactivé avec succès. Le motif sera affiché au client sous forme d''alerte popup.'
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- RPC 5 : admin_archive_moderator_commissions (Clôture des commissions modérateur)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_archive_moderator_commissions(
    p_admin_id UUID,
    p_moderator_id UUID,
    p_subscription_ids UUID[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin RECORD;
    v_updated_count INTEGER := 0;
BEGIN
    SELECT role INTO v_admin FROM public.profiles WHERE id = p_admin_id;
    IF NOT FOUND OR v_admin.role != 'admin' THEN
        RETURN jsonb_build_object('success', false, 'http_status', 403, 'error_message', 'Action réservée à l''administrateur.');
    END IF;

    IF p_subscription_ids IS NOT NULL AND array_length(p_subscription_ids, 1) > 0 THEN
        UPDATE public.subscriptions
        SET commission_status = 'archived',
            updated_at = timezone('utc'::text, now())
        WHERE moderator_id = p_moderator_id
          AND id = ANY(p_subscription_ids)
          AND commission_status = 'unpaid';
    ELSE
        UPDATE public.subscriptions
        SET commission_status = 'archived',
            updated_at = timezone('utc'::text, now())
        WHERE moderator_id = p_moderator_id
          AND commission_status = 'unpaid';
    END IF;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    RETURN jsonb_build_object(
        'success', true,
        'moderator_id', p_moderator_id,
        'archived_commissions_count', v_updated_count,
        'message', 'Commissions modérateur archivées avec succès.'
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- RPC 6 : axis_get_user_status (Consultation profil, solde, popups d'alerte et relai J-7)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.axis_get_user_status(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user RECORD;
    v_active_sub RECORD;
    v_pending_sub RECORD;
    v_disabled_sub RECORD;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    SELECT id, email, username, pseudo, role, moderator_code
    INTO v_user
    FROM public.profiles
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Utilisateur introuvable.');
    END IF;

    -- Si administrateur : Accès illimité et gratuit sans abonnement requis
    IF v_user.role = 'admin' THEN
        RETURN jsonb_build_object(
            'success', true,
            'user', jsonb_build_object('id', v_user.id, 'username', v_user.username, 'role', 'admin'),
            'is_admin', true,
            'unlimited_access', true,
            'message', 'Accès administrateur suprême illimité et gratuit.'
        );
    END IF;

    -- Recherche abonnement actif
    SELECT s.*, t.name as tier_name, t.max_cost_per_million_usd
    INTO v_active_sub
    FROM public.subscriptions s
    JOIN public.tiers t ON t.tier_number = s.tier_number
    WHERE s.user_id = p_user_id AND s.status = 'active' AND s.is_active = true
    ORDER BY s.created_at DESC
    LIMIT 1;

    -- Recherche abonnement pending (J-7 ou en attente de relève)
    SELECT s.*, t.name as tier_name
    INTO v_pending_sub
    FROM public.subscriptions s
    JOIN public.tiers t ON t.tier_number = s.tier_number
    WHERE s.user_id = p_user_id AND s.status IN ('pending', 'pending_validation')
    ORDER BY s.created_at DESC
    LIMIT 1;

    -- Recherche dernier abonnement désactivé avec motif pour alerte popup
    SELECT disabled_reason, disabled_at
    INTO v_disabled_sub
    FROM public.subscriptions
    WHERE user_id = p_user_id AND status = 'disabled' AND disabled_reason IS NOT NULL
    ORDER BY disabled_at DESC
    LIMIT 1;

    RETURN jsonb_build_object(
        'success', true,
        'user', jsonb_build_object(
            'id', v_user.id,
            'username', v_user.username,
            'pseudo', v_user.pseudo,
            'role', v_user.role,
            'moderator_code', v_user.moderator_code
        ),
        'active_subscription', CASE WHEN v_active_sub.id IS NOT NULL THEN jsonb_build_object(
            'id', v_active_sub.id,
            'tier_number', v_active_sub.tier_number,
            'tier_name', v_active_sub.tier_name,
            'balance_usd', v_active_sub.balance_usd,
            'starts_at', v_active_sub.starts_at,
            'expires_at', v_active_sub.expires_at,
            'days_remaining', GREATEST(0, extract(day from (v_active_sub.expires_at - v_now))::int),
            'is_in_j7_window', (v_now >= v_active_sub.expires_at - INTERVAL '7 days')
        ) ELSE NULL END,
        'pending_subscription', CASE WHEN v_pending_sub.id IS NOT NULL THEN jsonb_build_object(
            'id', v_pending_sub.id,
            'status', v_pending_sub.status,
            'tier_number', v_pending_sub.tier_number,
            'tier_name', v_pending_sub.tier_name,
            'scheduled_starts_at', v_pending_sub.starts_at
        ) ELSE NULL END,
        'popup_alert', CASE WHEN v_disabled_sub.disabled_reason IS NOT NULL THEN jsonb_build_object(
            'type', 'SUBSCRIPTION_DISABLED',
            'title', 'Abonnement Désactivé par l''Administration',
            'reason', v_disabled_sub.disabled_reason,
            'disabled_at', v_disabled_sub.disabled_at
        ) ELSE NULL END
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- RPC 7 : axis_gatekeeper_validate (Gatekeeper atomique avec Bypass Admin)
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
    -- 1. Validation de la clé API
    SELECT * INTO v_key
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

    -- Récupération du profil
    SELECT * INTO v_user FROM public.profiles WHERE id = v_key.user_id;

    -- 2. PRIVILÈGE ADMINISTRATEUR : ACCÈS TOTAL, GRATUIT & ILLIMITÉ SANS ABONNEMENT
    IF v_user.role = 'admin' THEN
        SELECT * INTO v_model FROM public.models WHERE id = p_model_id;
        RETURN jsonb_build_object(
            'is_allowed', true,
            'is_admin', true,
            'is_free', true,
            'http_status', 200,
            'api_key_id', v_key.id,
            'model_id', p_model_id,
            'tier_number', 7,
            'current_balance_usd', 999999.0,
            'estimated_cost_usd', 0.0,
            'message', 'Accès Administrateur privilégié sans limite de coût.'
        );
    END IF;

    -- 3. Vérification de l'abonnement
    IF v_key.subscription_id IS NULL THEN
        RETURN jsonb_build_object(
            'is_allowed', false,
            'http_status', 403,
            'error_code', 'NO_SUBSCRIPTION',
            'error_message', 'Aucun abonnement actif n''est associé à cette clé API.'
        );
    END IF;

    SELECT * INTO v_sub
    FROM public.subscriptions
    WHERE id = v_key.subscription_id
    FOR UPDATE;

    -- Vérification de désactivation administrative avec motif
    IF FOUND AND v_sub.status = 'disabled' THEN
        RETURN jsonb_build_object(
            'is_allowed', false,
            'http_status', 403,
            'error_code', 'SUBSCRIPTION_DISABLED_BY_ADMIN',
            'error_message', 'Votre abonnement a été désactivé par l''administrateur.',
            'disabled_reason', v_sub.disabled_reason
        );
    END IF;

    -- 4. Expiration 30 jours calendaires ou Épuisement du solde
    IF NOT FOUND OR v_sub.status != 'active' OR v_sub.expires_at <= v_now OR v_sub.balance_usd <= 0 THEN
        IF FOUND AND v_sub.status = 'active' THEN
            UPDATE public.subscriptions
            SET status = CASE WHEN balance_usd <= 0 THEN 'depleted' ELSE 'expired' END,
                is_active = false,
                updated_at = v_now
            WHERE id = v_sub.id;
        END IF;

        -- Vérifier s'il existe un pack 'pending' validé en attente de relève (Continuité J-7)
        SELECT * INTO v_pending_sub
        FROM public.subscriptions
        WHERE user_id = v_key.user_id AND status = 'pending'
        ORDER BY created_at ASC
        LIMIT 1
        FOR UPDATE;

        IF FOUND THEN
            -- Activation atomique immédiate du pack en attente
            UPDATE public.subscriptions
            SET status = 'active',
                is_active = true,
                starts_at = v_now,
                expires_at = v_now + INTERVAL '30 days',
                updated_at = v_now
            WHERE id = v_pending_sub.id
            RETURNING * INTO v_sub;

            UPDATE public.api_keys
            SET subscription_id = v_sub.id,
                is_enabled = true,
                updated_at = v_now
            WHERE id = v_key.id;
        ELSE
            -- Pas de relève -> coupure
            UPDATE public.api_keys SET is_enabled = false, updated_at = v_now WHERE id = v_key.id;
            RETURN jsonb_build_object(
                'is_allowed', false,
                'http_status', 402,
                'error_code', CASE WHEN v_sub.balance_usd <= 0 THEN 'SUBSCRIPTION_DEPLETED' ELSE 'SUBSCRIPTION_EXPIRED' END,
                'error_message', 'Votre abonnement est arrivé à expiration ou votre budget est épuisé.'
            );
        END IF;
    END IF;

    -- 5. Vérification du palier et formule MaxAllowedCost(P_i)
    SELECT * INTO v_tier FROM public.tiers WHERE tier_number = v_sub.tier_number;
    SELECT * INTO v_model FROM public.models WHERE id = p_model_id AND is_active = true;

    IF NOT FOUND THEN
        IF p_model_id LIKE '%:free' THEN
            v_is_free := true;
        ELSE
            RETURN jsonb_build_object('is_allowed', false, 'http_status', 404, 'error_code', 'MODEL_NOT_FOUND', 'error_message', 'Modèle non répertorié.');
        END IF;
    ELSE
        IF (v_model.input_cost_per_token = 0.0 AND v_model.output_cost_per_token = 0.0) OR p_model_id LIKE '%:free' THEN
            v_is_free := true;
        END IF;
    END IF;

    -- Contrôle de plafond MaxAllowedCost(P_i)
    IF NOT v_is_free AND v_model.id IS NOT NULL THEN
        IF v_model.combined_cost_per_million_usd > v_tier.max_cost_per_million_usd THEN
            RETURN jsonb_build_object(
                'is_allowed', false,
                'http_status', 403,
                'error_code', 'TIER_MODEL_NOT_PERMITTED',
                'error_message', 'Ce modèle n''est pas inclus dans votre palier actuel.',
                'tier_number', v_tier.tier_number,
                'max_allowed_cost', v_tier.max_cost_per_million_usd,
                'model_cost', v_model.combined_cost_per_million_usd
            );
        END IF;
    END IF;

    IF v_is_free THEN
        RETURN jsonb_build_object(
            'is_allowed', true,
            'is_free', true,
            'http_status', 200,
            'api_key_id', v_key.id,
            'subscription_id', v_sub.id,
            'tier_number', v_tier.tier_number,
            'model_id', p_model_id,
            'current_balance_usd', v_sub.balance_usd,
            'estimated_cost_usd', 0.0
        );
    END IF;

    -- Estimation budgétaire
    v_input_cost := GREATEST(0, p_input_tokens) * v_model.input_cost_per_token;
    v_output_cost := GREATEST(1, p_max_output_tokens) * v_model.output_cost_per_token;
    v_est_total_cost := v_input_cost + v_output_cost;

    IF v_sub.balance_usd >= v_est_total_cost THEN
        RETURN jsonb_build_object(
            'is_allowed', true,
            'is_free', false,
            'http_status', 200,
            'api_key_id', v_key.id,
            'subscription_id', v_sub.id,
            'tier_number', v_tier.tier_number,
            'model_id', v_model.id,
            'power_level', v_model.power_level,
            'current_balance_usd', v_sub.balance_usd,
            'estimated_cost_usd', v_est_total_cost,
            'fallback_model_id', v_model.fallback_model_id
        );
    ELSE
        RETURN jsonb_build_object(
            'is_allowed', false,
            'http_status', 402,
            'error_code', 'INSUFFICIENT_BALANCE',
            'error_message', format('Solde insuffisant ($%s) pour couvrir la requête ($%s).', v_sub.balance_usd, round(v_est_total_cost, 6)),
            'current_balance_usd', v_sub.balance_usd,
            'estimated_cost_usd', v_est_total_cost
        );
    END IF;
END;
$$;

-- ------------------------------------------------------------------------------
-- RPC 8 : axis_settle_usage (Décompte réel atomique & journalisation)
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

    SELECT id, user_id, subscription_id INTO v_key
    FROM public.api_keys
    WHERE key_hash = p_key_hash;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Clé API introuvable.');
    END IF;

    SELECT role INTO v_user FROM public.profiles WHERE id = v_key.user_id;

    -- Si administrateur : aucune déduction de solde
    IF v_user.role = 'admin' THEN
        INSERT INTO public.usage_logs (
            api_key_id, model_id, input_tokens, output_tokens, total_tokens, cost_usd, is_free, duration_ms, status_code
        ) VALUES (
            v_key.id, p_model_id, p_input_tokens, p_output_tokens, v_total_tokens, 0.0, true, p_duration_ms, p_status_code
        );
        RETURN jsonb_build_object('success', true, 'is_admin', true, 'cost_usd', 0.0);
    END IF;

    -- Calcul du coût réel
    SELECT * INTO v_model FROM public.models WHERE id = p_model_id;
    IF NOT FOUND OR (v_model.input_cost_per_token = 0.0 AND v_model.output_cost_per_token = 0.0) OR p_model_id LIKE '%:free' THEN
        v_is_free := true;
        v_real_cost := 0.0;
    ELSE
        v_real_cost := (GREATEST(0, p_input_tokens) * v_model.input_cost_per_token) +
                       (GREATEST(0, p_output_tokens) * v_model.output_cost_per_token);
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
                    SELECT * INTO v_pending_sub
                    FROM public.subscriptions
                    WHERE user_id = v_key.user_id AND status = 'pending'
                    ORDER BY created_at ASC
                    LIMIT 1
                    FOR UPDATE;

                    IF FOUND THEN
                        UPDATE public.subscriptions
                        SET status = 'active', is_active = true, starts_at = v_now, expires_at = v_now + INTERVAL '30 days', updated_at = v_now
                        WHERE id = v_pending_sub.id;

                        UPDATE public.api_keys SET subscription_id = v_pending_sub.id, is_enabled = true, updated_at = v_now WHERE id = v_key.id;
                    ELSE
                        UPDATE public.api_keys SET is_enabled = false, updated_at = v_now WHERE subscription_id = v_sub.id;
                    END IF;
                END IF;
            ELSE
                v_new_balance := v_sub.balance_usd;
                UPDATE public.subscriptions
                SET total_tokens_consumed = total_tokens_consumed + v_total_tokens, updated_at = v_now
                WHERE id = v_sub.id;
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
