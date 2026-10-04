-- ==============================================================================
-- ACCESS AI / AXIS AUTO : 7 PALIERS, FORMULE MATHÉMATIQUE & CYCLE DE VIE J-7
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. TABLE: tiers (Les 7 Paliers d'abonnements et formule MaxAllowedCost)
-- Formule : MaxAllowedCost(P_i) = alpha * i + beta (USD par 1M de tokens combinés)
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

-- Insertion des 7 Paliers avec la formule : MaxAllowedCost = 5.00 * i
-- P1: 5$/1M, P2: 10$/1M, P3: 15$/1M, P4: 20$/1M, P5: 25$/1M, P6: 30$/1M, P7: 35$/1M
INSERT INTO public.tiers (tier_number, name, alpha, beta, price_usd, budget_amount_usd, description)
VALUES
    (1, 'Palier 1 - Starter', 5.00, 0.00, 10.00, 10.00, 'Accès aux modèles gratuits et ultra-économiques (max 5$/1M tokens)'),
    (2, 'Palier 2 - Basic', 5.00, 0.00, 25.00, 25.00, 'Accès aux modèles légers et polyvalents (max 10$/1M tokens)'),
    (3, 'Palier 3 - Standard', 5.00, 0.00, 50.00, 50.00, 'Accès aux modèles avancés standards type GPT-4o (max 15$/1M tokens)'),
    (4, 'Palier 4 - Pro', 5.00, 0.00, 100.00, 100.00, 'Accès aux modèles de pointe type Claude 3.5 Sonnet (max 20$/1M tokens)'),
    (5, 'Palier 5 - Expert', 5.00, 0.00, 200.00, 200.00, 'Accès aux modèles haute fidélité (max 25$/1M tokens)'),
    (6, 'Palier 6 - Master', 5.00, 0.00, 350.00, 350.00, 'Accès aux modèles de raisonnement lourds (max 30$/1M tokens)'),
    (7, 'Palier 7 - Enterprise', 5.00, 0.00, 500.00, 500.00, 'Accès illimité à tous les modèles sans restriction (max 35$/1M tokens)')
ON CONFLICT (tier_number) DO UPDATE SET
    name = EXCLUDED.name,
    alpha = EXCLUDED.alpha,
    beta = EXCLUDED.beta,
    price_usd = EXCLUDED.price_usd,
    budget_amount_usd = EXCLUDED.budget_amount_usd,
    description = EXCLUDED.description;

-- ------------------------------------------------------------------------------
-- 2. TABLE: models (Catalogue des modèles avec niveaux de puissance pour Axis Auto)
-- Power levels : 'low', 'medium', 'high', 'ultra'
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

-- Insertion des modèles classés par niveau de puissance
INSERT INTO public.models (id, name, input_cost_per_token, output_cost_per_token, power_level, tier, fallback_model_id)
VALUES
    -- NIVEAU 1 : LOW (Gratuits et ultra-rapides)
    ('meta-llama/llama-3.3-70b-instruct:free', 'Llama 3.3 70B Free', 0.0, 0.0, 'low', 'free', 'google/gemini-2.0-flash-exp:free'),
    ('google/gemini-2.0-flash-exp:free', 'Gemini 2.0 Flash Exp Free', 0.0, 0.0, 'low', 'free', 'meta-llama/llama-3.3-70b-instruct:free'),
    ('google/gemini-2.0-flash-001', 'Gemini 2.0 Flash', 0.00000010, 0.00000040, 'low', 'economy', 'openai/gpt-4o-mini'),
    ('openai/gpt-4o-mini', 'GPT-4o Mini', 0.00000015, 0.00000060, 'low', 'economy', 'google/gemini-2.0-flash-001'),

    -- NIVEAU 2 : MEDIUM (Modèles polyvalents standards)
    ('deepseek/deepseek-chat', 'DeepSeek V3 Chat', 0.00000014, 0.00000028, 'medium', 'economy', 'openai/gpt-4o-mini'),
    ('anthropic/claude-3-haiku', 'Claude 3 Haiku', 0.00000025, 0.00000125, 'medium', 'economy', 'deepseek/deepseek-chat'),
    ('mistralai/mistral-small', 'Mistral Small', 0.00000020, 0.00000060, 'medium', 'economy', 'openai/gpt-4o-mini'),

    -- NIVEAU 3 : HIGH (Modèles avancés et code)
    ('openai/gpt-4o', 'GPT-4o', 0.00000250, 0.00001000, 'high', 'performance', 'google/gemini-pro-1.5'),
    ('google/gemini-pro-1.5', 'Gemini 1.5 Pro', 0.00000125, 0.00000500, 'high', 'performance', 'openai/gpt-4o'),
    ('qwen/qwen-2.5-coder-32b-instruct', 'Qwen 2.5 Coder 32B', 0.00000007, 0.00000016, 'high', 'economy', 'openai/gpt-4o'),

    -- NIVEAU 4 : ULTRA (Raisonnement fort et réflexion approfondie)
    ('anthropic/claude-3.5-sonnet', 'Claude 3.5 Sonnet', 0.00000300, 0.00001500, 'ultra', 'performance', 'deepseek/deepseek-r1'),
    ('deepseek/deepseek-r1', 'DeepSeek R1 Reasoning', 0.00000055, 0.00000219, 'ultra', 'performance', 'openai/gpt-4o'),
    ('openai/o1-mini', 'OpenAI o1 Mini', 0.00000300, 0.00001200, 'ultra', 'performance', 'anthropic/claude-3.5-sonnet')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    input_cost_per_token = EXCLUDED.input_cost_per_token,
    output_cost_per_token = EXCLUDED.output_cost_per_token,
    power_level = EXCLUDED.power_level,
    tier = EXCLUDED.tier,
    fallback_model_id = EXCLUDED.fallback_model_id,
    updated_at = timezone('utc'::text, now());

-- ------------------------------------------------------------------------------
-- 3. TABLE: subscriptions (Cycle de vie 30 jours, statut pending et règle J-7)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    tier_number INTEGER NOT NULL REFERENCES public.tiers(tier_number),
    budget_amount_usd NUMERIC(14, 6) NOT NULL CHECK (budget_amount_usd >= 0),
    balance_usd NUMERIC(14, 6) NOT NULL CHECK (balance_usd >= 0),
    consumed_usd NUMERIC(14, 6) NOT NULL DEFAULT 0.0,
    total_tokens_consumed BIGINT NOT NULL DEFAULT 0,
    starts_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'expired', 'depleted')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_sub_dates CHECK (expires_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON public.subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active_expires ON public.subscriptions(is_active, expires_at);

-- ------------------------------------------------------------------------------
-- 4. TABLE: api_keys (1 clé API = 1 abonnement actif unique)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
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
-- 5. TABLE: usage_logs
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

-- ------------------------------------------------------------------------------
-- 6. RPC: axis_subscribe (Gestion des abonnements & Règle anti-abus des 7 jours)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.axis_subscribe(
    p_user_id UUID,
    p_tier_number INTEGER
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
    v_new_sub_id UUID;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_starts_at TIMESTAMPTZ;
    v_expires_at TIMESTAMPTZ;
    v_key RECORD;
BEGIN
    -- 1. Récupération du palier demandé
    SELECT * INTO v_tier FROM public.tiers WHERE tier_number = p_tier_number;
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'http_status', 400,
            'error_code', 'INVALID_TIER',
            'error_message', format('Le palier %s n''existe pas (choisir entre 1 et 7).', p_tier_number)
        );
    END IF;

    -- 2. Recherche d'un abonnement actif existant pour cet utilisateur
    SELECT * INTO v_active_sub
    FROM public.subscriptions
    WHERE user_id = p_user_id
      AND status = 'active'
      AND is_active = true
      AND expires_at > v_now
      AND balance_usd > 0
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;

    -- Cas A : Aucun abonnement actif en cours -> Activation immédiate pour 30 jours
    IF NOT FOUND THEN
        v_starts_at := v_now;
        v_expires_at := v_now + INTERVAL '30 days';

        INSERT INTO public.subscriptions (
            user_id,
            tier_number,
            budget_amount_usd,
            balance_usd,
            consumed_usd,
            starts_at,
            expires_at,
            status,
            is_active
        ) VALUES (
            p_user_id,
            v_tier.tier_number,
            v_tier.budget_amount_usd,
            v_tier.budget_amount_usd,
            0.0,
            v_starts_at,
            v_expires_at,
            'active',
            true
        ) RETURNING id INTO v_new_sub_id;

        -- Raccordement de la clé API si elle existe déjà
        UPDATE public.api_keys
        SET subscription_id = v_new_sub_id,
            is_enabled = true,
            updated_at = v_now
        WHERE user_id = p_user_id;

        RETURN jsonb_build_object(
            'success', true,
            'http_status', 201,
            'action', 'ACTIVATED_IMMEDIATE',
            'subscription_id', v_new_sub_id,
            'tier_number', v_tier.tier_number,
            'tier_name', v_tier.name,
            'balance_usd', v_tier.budget_amount_usd,
            'starts_at', v_starts_at,
            'expires_at', v_expires_at,
            'message', 'Abonnement activé avec succès pour 30 jours calendaires.'
        );
    END IF;

    -- Cas B : Abonnement actif existant -> Contrôle de la règle des 7 derniers jours
    -- Si on est à PLUS de 7 jours de l'expiration et que le solde n'est pas épuisé -> REFUS ANTI-ABUS
    IF v_now < (v_active_sub.expires_at - INTERVAL '7 days') THEN
        RETURN jsonb_build_object(
            'success', false,
            'http_status', 409,
            'error_code', 'EARLY_RENEWAL_FORBIDDEN',
            'error_message', format(
                'Vous avez déjà un abonnement actif (Palier %s). La souscription anticipée n''est autorisée que dans les 7 derniers jours précédant l''expiration (à partir du %s).',
                v_active_sub.tier_number,
                (v_active_sub.expires_at - INTERVAL '7 days')::date
            ),
            'active_subscription_expires_at', v_active_sub.expires_at,
            'allowed_renewal_date', v_active_sub.expires_at - INTERVAL '7 days'
        );
    END IF;

    -- Cas C : Nous sommes dans la fenêtre des 7 derniers jours (ou solde à 0)
    -- Vérification si un abonnement pending existe déjà pour éviter le multi-cumul
    SELECT * INTO v_pending_sub
    FROM public.subscriptions
    WHERE user_id = p_user_id AND status = 'pending'
    LIMIT 1;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'http_status', 409,
            'error_code', 'PENDING_ALREADY_EXISTS',
            'error_message', 'Un abonnement de renouvellement est déjà en attente d''activation pour votre compte.',
            'pending_subscription_id', v_pending_sub.id,
            'scheduled_activation_date', v_pending_sub.starts_at
        );
    END IF;

    -- Création du pack en statut 'pending' programmé à la seconde exacte de fin de l'actuel
    v_starts_at := v_active_sub.expires_at;
    v_expires_at := v_starts_at + INTERVAL '30 days';

    INSERT INTO public.subscriptions (
        user_id,
        tier_number,
        budget_amount_usd,
        balance_usd,
        consumed_usd,
        starts_at,
        expires_at,
        status,
        is_active
    ) VALUES (
        p_user_id,
        v_tier.tier_number,
        v_tier.budget_amount_usd,
        v_tier.budget_amount_usd,
        0.0,
        v_starts_at,
        v_expires_at,
        'pending',
        false
    ) RETURNING id INTO v_new_sub_id;

    RETURN jsonb_build_object(
        'success', true,
        'http_status', 201,
        'action', 'QUEUED_PENDING_J7',
        'subscription_id', v_new_sub_id,
        'tier_number', v_tier.tier_number,
        'tier_name', v_tier.name,
        'balance_usd', v_tier.budget_amount_usd,
        'starts_at', v_starts_at,
        'expires_at', v_expires_at,
        'message', 'Abonnement enregistré en attente (Règle J-7). Il s''activera automatiquement à l''expiration exacte de votre abonnement actuel.'
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 7. RPC: axis_gatekeeper_validate (Validation synchrone atomique avec verrouillage)
-- Vérification Clé + Expiration 30j + Relais Pending + Filtrage mathématique MaxAllowedCost
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

    IF v_key.subscription_id IS NULL THEN
        RETURN jsonb_build_object(
            'is_allowed', false,
            'http_status', 403,
            'error_code', 'NO_SUBSCRIPTION',
            'error_message', 'Aucun abonnement actif n''est associé à cette clé API.'
        );
    END IF;

    -- 2. Verrouillage atomique de l'abonnement (FOR UPDATE) pour éviter les accès concurrents
    SELECT * INTO v_sub
    FROM public.subscriptions
    WHERE id = v_key.subscription_id
    FOR UPDATE;

    -- 3. Contrôle du cycle de vie des 30 jours et bascule automatique si expirée ou épuisée
    IF NOT FOUND OR v_sub.status != 'active' OR v_sub.expires_at <= v_now OR v_sub.balance_usd <= 0 THEN
        -- Marquer l'ancien abonnement comme expiré ou épuisé
        IF FOUND AND v_sub.status = 'active' THEN
            UPDATE public.subscriptions
            SET status = CASE WHEN balance_usd <= 0 THEN 'depleted' ELSE 'expired' END,
                is_active = false,
                updated_at = v_now
            WHERE id = v_sub.id;
        END IF;

        -- Vérifier si un abonnement 'pending' existe pour cet utilisateur (Relais continuité J-7)
        SELECT * INTO v_pending_sub
        FROM public.subscriptions
        WHERE user_id = v_key.user_id AND status = 'pending'
        ORDER BY created_at ASC
        LIMIT 1
        FOR UPDATE;

        IF FOUND THEN
            -- Activation immédiate du pack en attente
            UPDATE public.subscriptions
            SET status = 'active',
                is_active = true,
                starts_at = v_now,
                expires_at = v_now + INTERVAL '30 days',
                updated_at = v_now
            WHERE id = v_pending_sub.id
            RETURNING * INTO v_sub;

            -- Liaison de la clé API au nouvel abonnement
            UPDATE public.api_keys
            SET subscription_id = v_sub.id,
                is_enabled = true,
                updated_at = v_now
            WHERE id = v_key.id;
        ELSE
            -- Aucun pack en attente -> Coupure nette
            UPDATE public.api_keys SET is_enabled = false, updated_at = v_now WHERE id = v_key.id;
            RETURN jsonb_build_object(
                'is_allowed', false,
                'http_status', 402,
                'error_code', CASE WHEN v_sub.balance_usd <= 0 THEN 'SUBSCRIPTION_DEPLETED' ELSE 'SUBSCRIPTION_EXPIRED' END,
                'error_message', 'Votre abonnement est arrivé à expiration ou votre budget est épuisé. Veuillez souscrire à un nouveau pack.'
            );
        END IF;
    END IF;

    -- 4. Recherche du palier pour validation mathématique
    SELECT * INTO v_tier FROM public.tiers WHERE tier_number = v_sub.tier_number;
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'is_allowed', false,
            'http_status', 500,
            'error_code', 'TIER_CONFIGURATION_ERROR',
            'error_message', 'Configuration de palier invalide en base.'
        );
    END IF;

    -- 5. Recherche du modèle et vérification de la formule mathématique MaxAllowedCost(P_i)
    SELECT * INTO v_model
    FROM public.models
    WHERE id = p_model_id AND is_active = true;

    IF NOT FOUND THEN
        -- Si modèle avec suffixe :free
        IF p_model_id LIKE '%:free' THEN
            v_is_free := true;
        ELSE
            RETURN jsonb_build_object(
                'is_allowed', false,
                'http_status', 404,
                'error_code', 'MODEL_NOT_FOUND',
                'error_message', format('Le modèle "%s" est introuvable ou inactif.', p_model_id)
            );
        END IF;
    ELSE
        IF (v_model.input_cost_per_token = 0.0 AND v_model.output_cost_per_token = 0.0) OR v_model.power_level = 'low' AND v_model.id LIKE '%:free' THEN
            v_is_free := true;
        END IF;
    END IF;

    -- VÉRIFICATION DU PALIER (SECTION 3) : Formule MaxAllowedCost(P_i) = alpha * i + beta
    -- Si modèle payant, son coût combiné par 1M tokens doit être <= MaxAllowedCost(P_i)
    IF NOT v_is_free AND v_model.id IS NOT NULL THEN
        IF v_model.combined_cost_per_million_usd > v_tier.max_cost_per_million_usd THEN
            RETURN jsonb_build_object(
                'is_allowed', false,
                'http_status', 403,
                'error_code', 'TIER_MODEL_NOT_PERMITTED',
                'error_message', 'Ce modèle n''est pas inclus dans votre palier actuel.',
                'details', format(
                    'Votre palier (%s - %s) autorise un coût combiné maximum de %s $/1M tokens. Le modèle demandé (%s) requiert %s $/1M tokens.',
                    v_tier.tier_number,
                    v_tier.name,
                    v_tier.max_cost_per_million_usd,
                    v_model.name,
                    v_model.combined_cost_per_million_usd
                ),
                'tier_number', v_tier.tier_number,
                'max_allowed_cost', v_tier.max_cost_per_million_usd,
                'model_cost', v_model.combined_cost_per_million_usd
            );
        END IF;
    END IF;

    -- 6. Modèles Gratuits : Passage immédiat sans déduction
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
            'estimated_cost_usd', 0.0,
            'fallback_model_id', v_model.fallback_model_id
        );
    END IF;

    -- 7. Modèles Payants : Calcul de l'estimation et contrôle du solde
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
            'error_message', format('Solde insuffisant ($%s) pour couvrir l''estimation de la requête ($%s).', v_sub.balance_usd, round(v_est_total_cost, 6)),
            'current_balance_usd', v_sub.balance_usd,
            'estimated_cost_usd', v_est_total_cost
        );
    END IF;
END;
$$;

-- ------------------------------------------------------------------------------
-- 8. RPC: axis_settle_usage (Décompte réel, verrous atomiques & log d'audit)
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
        RETURN jsonb_build_object('success', false, 'error', 'Clé API introuvable lors de la clôture.');
    END IF;

    -- Tarification du modèle
    SELECT * INTO v_model FROM public.models WHERE id = p_model_id;
    IF NOT FOUND OR (v_model.input_cost_per_token = 0.0 AND v_model.output_cost_per_token = 0.0) OR p_model_id LIKE '%:free' THEN
        v_is_free := true;
        v_real_cost := 0.0;
    ELSE
        v_real_cost := (GREATEST(0, p_input_tokens) * v_model.input_cost_per_token) +
                       (GREATEST(0, p_output_tokens) * v_model.output_cost_per_token);
    END IF;

    -- Déduction atomique sur la ligne verrouillée
    IF v_key.subscription_id IS NOT NULL THEN
        SELECT * INTO v_sub
        FROM public.subscriptions
        WHERE id = v_key.subscription_id
        FOR UPDATE;

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

                -- Si le solde vient de s'épuiser, vérifier s'il existe un pack 'pending' pour ce user
                IF v_new_balance <= 0.0 THEN
                    SELECT * INTO v_pending_sub
                    FROM public.subscriptions
                    WHERE user_id = v_key.user_id AND status = 'pending'
                    ORDER BY created_at ASC
                    LIMIT 1
                    FOR UPDATE;

                    IF FOUND THEN
                        -- Activation immédiate du pack en attente
                        UPDATE public.subscriptions
                        SET status = 'active',
                            is_active = true,
                            starts_at = v_now,
                            expires_at = v_now + INTERVAL '30 days',
                            updated_at = v_now
                        WHERE id = v_pending_sub.id;

                        -- Mise à jour de la clé pour pointer sur le nouveau pack
                        UPDATE public.api_keys
                        SET subscription_id = v_pending_sub.id,
                            is_enabled = true,
                            updated_at = v_now
                        WHERE id = v_key.id;
                    ELSE
                        -- Désactivation de la clé
                        UPDATE public.api_keys
                        SET is_enabled = false,
                            updated_at = v_now
                        WHERE subscription_id = v_sub.id;
                    END IF;
                END IF;
            ELSE
                v_new_balance := v_sub.balance_usd;
                -- Comptabiliser les tokens même si gratuit
                UPDATE public.subscriptions
                SET total_tokens_consumed = total_tokens_consumed + v_total_tokens,
                    updated_at = v_now
                WHERE id = v_sub.id;
            END IF;
        END IF;
    END IF;

    -- Mise à jour du timestamp sur la clé
    UPDATE public.api_keys SET last_used_at = v_now WHERE id = v_key.id;

    -- Journalisation dans usage_logs
    INSERT INTO public.usage_logs (
        api_key_id,
        subscription_id,
        model_id,
        power_level,
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
        v_model.power_level,
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
