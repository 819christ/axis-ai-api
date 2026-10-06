-- ==============================================================================
-- AXIS AI — MIGRATION 005 : Synchronisation atomique clé ↔ abonnement
-- 
-- Problème : Une clé API était activée (is_enabled = true) dès qu'un
-- subscription_id lui était associé, même si l'abonnement était encore
-- en statut `pending_validation` (paiement non validé).
-- 
-- Corrections :
-- 1. Trigger AFTER UPDATE sur subscriptions → synchronise api_keys.is_enabled
-- 2. axis_generate_api_key → n'active la clé que si l'abonnement est 'active'
-- ==============================================================================

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. TRIGGER : Synchronisation automatique de la clé liée
-- ──────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_key_on_subscription_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Seulement si le statut ou is_active ont changé
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

-- Appliquer le trigger à la table subscriptions
DROP TRIGGER IF EXISTS trg_sync_key_on_subscription_change ON public.subscriptions;
CREATE TRIGGER trg_sync_key_on_subscription_change
    AFTER UPDATE OF status, is_active
    ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_key_on_subscription_change();


-- ──────────────────────────────────────────────────────────────────────────────
-- 2. RPC axis_generate_api_key (correction : ne pas activer une clé si
--    l'abonnement lié n'est pas en statut 'active')
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
    v_user       RECORD;
    v_sub        RECORD;
    v_is_active  BOOLEAN := false;
    v_raw_secret TEXT;
    v_full_key   TEXT;
    v_key_hash   TEXT;
    v_key_prefix TEXT;
    v_key_id     UUID;
BEGIN
    -- 1. Récupération du profil utilisateur
    SELECT id, role INTO v_user FROM public.profiles WHERE id = p_user_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'http_status', 404,
                                  'error_message', 'Utilisateur introuvable.');
    END IF;

    -- 2. Si un abonnement est fourni, vérifier son existence ET son statut
    v_is_active := (v_user.role = 'admin');
    IF p_subscription_id IS NOT NULL THEN
        SELECT id, status, is_active
          INTO v_sub
          FROM public.subscriptions
         WHERE id = p_subscription_id AND user_id = p_user_id;
        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'http_status', 404,
                                      'error_message',
                                      'Abonnement introuvable ou non associé à cet utilisateur.');
        END IF;
        -- Activation conditionnelle : admin OU abonnement actif
        v_is_active := (v_user.role = 'admin' OR (v_sub.status = 'active' AND v_sub.is_active = true));
    END IF;

    -- 3. Génération cryptographique résiliente
    BEGIN
        v_raw_secret := encode(gen_random_bytes(24), 'hex');
    EXCEPTION WHEN OTHERS THEN
        v_raw_secret := md5(random()::text || clock_timestamp()::text)
                     || md5(random()::text || clock_timestamp()::text);
    END;

    v_full_key  := 'axis_live_' || substr(v_raw_secret, 1, 40);

    BEGIN
        v_key_hash := encode(digest(v_full_key, 'sha256'), 'hex');
    EXCEPTION WHEN OTHERS THEN
        v_key_hash := encode(sha256(v_full_key::bytea), 'hex');
    END;

    v_key_prefix := 'ax_' || substr(v_raw_secret, 1, 10) || '...';

    -- 4. Insertion avec le bon état
    INSERT INTO public.api_keys (user_id, subscription_id, key_hash, key_prefix,
                                 name, is_enabled, daily_request_limit)
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
        'success',    true,
        'http_status', 201,
        'key_id',     v_key_id,
        'api_key',    v_full_key,
        'key_prefix', v_key_prefix,
        'is_enabled', v_is_active,
        'warning',    'Sauvegardez cette clé maintenant. Elle ne sera plus jamais affichée en clair.'
    );
END;
$$;
-- ──────────────────────────────────────────────────────────────────────────────
-- 3. TRIGGER GARDE-FOU : Une clé ne peut être activée que si son abonnement
--    est 'active' (ou si le propriétaire est admin)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.enforce_key_requires_active_sub()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_role TEXT;
  v_ok BOOLEAN := false;
BEGIN
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
END $$;

DROP TRIGGER IF EXISTS trg_key_requires_active_sub ON public.api_keys;
CREATE TRIGGER trg_key_requires_active_sub
BEFORE INSERT OR UPDATE OF is_enabled, subscription_id ON public.api_keys
FOR EACH ROW EXECUTE FUNCTION public.enforce_key_requires_active_sub();

-- Nettoyage des clés actuellement actives avec un abonnement non valide
UPDATE public.api_keys k
SET is_enabled = false, updated_at = now()
WHERE k.is_enabled = true
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = k.user_id AND p.role = 'admin'
  )
-- ──────────────────────────────────────────────────────────────────────────────
-- 4. CORRECTION axis_moderator_validate_subscription : activer UNIQUEMENT
--    les clés explicitement LIÉES à cet abonnement (pas toutes les clés
--    de l'utilisateur)
-- ──────────────────────────────────────────────────────────────────────────────
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
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_sub RECORD;
    v_validator_role TEXT;
BEGIN
    SELECT role INTO v_validator_role FROM public.profiles WHERE id = p_validator_id;
    IF v_validator_role NOT IN ('admin', 'moderator') THEN
        RETURN jsonb_build_object('success', false, 'http_status', 403,
            'error_message', 'Seuls les administrateurs et modérateurs peuvent valider un abonnement.');
    END IF;

    SELECT * INTO v_sub FROM public.subscriptions WHERE id = p_subscription_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'http_status', 404,
            'error_message', 'Abonnement introuvable.');
    END IF;

    IF v_sub.status != 'pending_validation' THEN
        RETURN jsonb_build_object('success', false, 'http_status', 409,
            'error_message', 'Cet abonnement n''est pas en attente de validation.');
    END IF;

    -- Activer l'abonnement
    UPDATE public.subscriptions
    SET status = 'active', is_active = true,
        validated_at = v_now, updated_at = v_now
    WHERE id = p_subscription_id;

    -- Activer UNIQUEMENT les clés liées à CET abonnement
    UPDATE public.api_keys
    SET is_enabled = true, updated_at = v_now
    WHERE subscription_id = p_subscription_id;

    RETURN jsonb_build_object(
        'success', true, 'http_status', 200,
        'subscription_id', p_subscription_id,
        'status', 'active',
        'message', 'Abonnement validé. Seules les clés liées sont activées.'
    );
END;
$$;
  AND NOT EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.id = k.subscription_id
      AND s.status = 'active' AND s.is_active = true
      AND s.expires_at > now() AND s.balance_usd > 0
  );