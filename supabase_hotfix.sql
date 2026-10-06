-- ==============================================================================
-- AXIS AI — SCRIPT DE CORRECTIFS DE PRODUCTION (HOTFIX SUPABASE)
-- Résout :
-- 1. "record v_mod is not assigned yet" lors de la souscription sans modérateur
-- 2. "function gen_random_bytes(integer) does not exist" lors de la création de clé
-- 3. "infinite recursion detected in policy for relation profiles"
-- ==============================================================================

-- ──────────────────────────────────────────────────────────────────────────────
-- ÉTAPE 1 : Extension pgcrypto & Fonctions de sécurité
-- ──────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

-- Fonction helper de contrôle administrateur SANS récursion RLS (SECURITY DEFINER)
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

-- ──────────────────────────────────────────────────────────────────────────────
-- ÉTAPE 2 : Suppression et réécriture des politiques RLS récursives
-- ──────────────────────────────────────────────────────────────────────────────

-- PROFILES
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;

CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id OR public.is_admin())
    WITH CHECK (auth.uid() = id OR public.is_admin());

-- SUBSCRIPTIONS
DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_admin_all" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_moderator_assigned" ON public.subscriptions;

CREATE POLICY "subscriptions_select_own" ON public.subscriptions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "subscriptions_admin_all" ON public.subscriptions
    FOR ALL USING (public.is_admin());

CREATE POLICY "subscriptions_moderator_assigned" ON public.subscriptions
    FOR SELECT USING (moderator_id = auth.uid());

-- API KEYS
DROP POLICY IF EXISTS "api_keys_select_own" ON public.api_keys;
DROP POLICY IF EXISTS "api_keys_admin_all" ON public.api_keys;

CREATE POLICY "api_keys_select_own" ON public.api_keys
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "api_keys_admin_all" ON public.api_keys
    FOR ALL USING (public.is_admin());

-- USAGE LOGS
DROP POLICY IF EXISTS "usage_logs_select_own" ON public.usage_logs;
DROP POLICY IF EXISTS "usage_logs_admin_all" ON public.usage_logs;

CREATE POLICY "usage_logs_select_own" ON public.usage_logs
    FOR SELECT USING (
        api_key_id IN (SELECT id FROM public.api_keys WHERE user_id = auth.uid())
    );

CREATE POLICY "usage_logs_admin_all" ON public.usage_logs
    FOR ALL USING (public.is_admin());


-- ──────────────────────────────────────────────────────────────────────────────
-- ÉTAPE 3 : RPC axis_subscribe (Correction du bug record "v_mod" is not assigned)
-- ──────────────────────────────────────────────────────────────────────────────
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
    v_user RECORD;
    v_tier RECORD;
    v_mod RECORD;
    v_mod_id UUID := NULL;
    v_mod_code_assigned TEXT := NULL;
    v_active_sub RECORD;
    v_pending_sub RECORD;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_starts_at TIMESTAMPTZ;
    v_expires_at TIMESTAMPTZ;
    v_is_renewal BOOLEAN := false;
    v_new_sub_id UUID;
BEGIN
    SELECT role INTO v_user FROM public.profiles WHERE id = p_user_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'http_status', 404, 'error_message', 'Utilisateur introuvable.');
    END IF;

    IF v_user.role = 'admin' THEN
        RETURN jsonb_build_object('success', true, 'http_status', 200, 'message', 'L''administrateur bénéficie d''un accès illimité.');
    END IF;

    SELECT * INTO v_tier FROM public.tiers WHERE tier_number = p_tier_number;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'http_status', 404, 'error_message', 'Palier introuvable.');
    END IF;

    -- Affectation sécurisée du modérateur (ne plante pas si null)
    IF p_moderator_code IS NOT NULL AND trim(p_moderator_code) != '' THEN
        SELECT id, moderator_code INTO v_mod
        FROM public.profiles
        WHERE role = 'moderator' AND upper(moderator_code) = upper(trim(p_moderator_code));

        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'http_status', 404, 'error_message', 'Identifiant modérateur introuvable.');
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
        'instructions', 'Effectuez le règlement hors-ligne. Votre pack sera activé dès validation.'
    );
END;
$$;


-- ──────────────────────────────────────────────────────────────────────────────
-- ÉTAPE 4 : RPC axis_generate_api_key (Indépendance totale vis-à-vis de pgcrypto)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.axis_generate_api_key(
    p_user_id UUID,
    p_subscription_id UUID DEFAULT NULL,
    p_name TEXT DEFAULT 'Default API Key',
    p_daily_limit INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_user RECORD;
    v_sub RECORD;
    v_raw_secret TEXT;
    v_full_key TEXT;
    v_key_hash TEXT;
    v_key_prefix TEXT;
    v_key_id UUID;
BEGIN
    SELECT id, role INTO v_user FROM public.profiles WHERE id = p_user_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'http_status', 404, 'error_message', 'Utilisateur introuvable.');
    END IF;

    IF p_subscription_id IS NOT NULL THEN
        SELECT id INTO v_sub FROM public.subscriptions WHERE id = p_subscription_id AND user_id = p_user_id;
        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'http_status', 404, 'error_message', 'Abonnement introuvable ou non associé à cet utilisateur.');
        END IF;
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

    -- Préfixe court : 'ax_' + 10 hex + '...' = 16 chars exactement (tient dans varchar(16))
    v_key_prefix := 'ax_' || substr(v_raw_secret, 1, 10) || '...';

    INSERT INTO public.api_keys (user_id, subscription_id, key_hash, key_prefix, name, is_enabled, daily_request_limit)
    VALUES (

        p_user_id,
        p_subscription_id,
        v_key_hash,
        v_key_prefix,
        coalesce(nullif(trim(p_name), ''), 'Default API Key'),
        CASE WHEN v_user.role = 'admin' THEN true
             WHEN p_subscription_id IS NOT NULL THEN true
             ELSE false END,
        p_daily_limit
    )
    RETURNING id INTO v_key_id;

    RETURN jsonb_build_object(
        'success', true,
        'http_status', 201,
        'key_id', v_key_id,
        'api_key', v_full_key,
        'key_prefix', v_key_prefix,
        'is_enabled', CASE WHEN v_user.role = 'admin' THEN true WHEN p_subscription_id IS NOT NULL THEN true ELSE false END,
        'warning', 'Sauvegardez cette clé maintenant. Elle ne sera plus jamais affichée en clair.'
    );
END;
$$;

-- Rotation de clé
CREATE OR REPLACE FUNCTION public.axis_refresh_api_key(
    p_key_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_old_key RECORD;
    v_raw_secret TEXT;
    v_full_key TEXT;
    v_key_hash TEXT;
    v_key_prefix TEXT;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    SELECT * INTO v_old_key FROM public.api_keys WHERE id = p_key_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'http_status', 404, 'error_message', 'Clé API introuvable.');
    END IF;

    BEGIN
        v_raw_secret := encode(gen_random_bytes(24), 'hex');
    EXCEPTION WHEN OTHERS THEN
        v_raw_secret := md5(random()::text || clock_timestamp()::text) || md5(random()::text || clock_timestamp()::text);
    END;

    v_full_key := 'axis_live_' || substr(v_raw_secret, 1, 40);

    BEGIN
        v_key_hash := encode(digest(v_full_key, 'sha256'), 'hex');
    EXCEPTION WHEN OTHERS THEN
        v_key_hash := encode(sha256(v_full_key::bytea), 'hex');
    END;

    v_key_prefix := 'ax_' || substr(v_raw_secret, 1, 10) || '...';



    UPDATE public.api_keys
    SET key_hash = v_key_hash,
        key_prefix = v_key_prefix,
        last_used_at = NULL,
        updated_at = v_now
    WHERE id = p_key_id;

    RETURN jsonb_build_object(
        'success', true,
        'key_id', p_key_id,
        'new_api_key', v_full_key,
        'key_prefix', v_key_prefix,
        'is_enabled', v_old_key.is_enabled,
        'warning', 'Votre ancienne clé a été immédiatement révoquée. Remplacez-la dans votre IDE.'
    );
END;
$$;
-- ==============================================================================
-- ÉTAPE 5 : Trigger de synchronisation clé ↔ abonnement
-- Garantit qu'une clé liée à un abonnement est activée/désactivée en temps réel
-- lorsque le statut de l'abonnement change (pending_validation → active).
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
