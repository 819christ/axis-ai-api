-- ==============================================================================
-- AXIS AI — MIGRATION 006 : Correctifs clés API (préfixe, blocage refresh, retour)
-- Partie 1/2 : ALTER colonne + axis_generate_api_key corrigé
-- ==============================================================================

ALTER TABLE public.api_keys ALTER COLUMN key_prefix TYPE VARCHAR(24);

CREATE OR REPLACE FUNCTION public.axis_generate_api_key(
    p_user_id UUID,
    p_subscription_id UUID DEFAULT NULL,
    p_name TEXT DEFAULT 'Default API Key',
    p_daily_limit INTEGER DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
    v_user RECORD; v_sub RECORD; v_is_active BOOLEAN := false;
    v_raw_secret TEXT; v_full_key TEXT; v_key_hash TEXT; v_key_prefix TEXT; v_key_id UUID;
BEGIN
    SELECT id, role INTO v_user FROM public.profiles WHERE id = p_user_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'http_status', 404, 'error_message', 'Utilisateur introuvable.');
    END IF;
    v_is_active := (v_user.role = 'admin');
    IF p_subscription_id IS NOT NULL THEN
        SELECT id, status, is_active INTO v_sub
          FROM public.subscriptions WHERE id = p_subscription_id AND user_id = p_user_id;
        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'http_status', 404, 'error_message', 'Abonnement introuvable.');
        END IF;
        v_is_active := (v_user.role = 'admin' OR (v_sub.status = 'active' AND v_sub.is_active = true));
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
    INSERT INTO public.api_keys (user_id, subscription_id, key_hash, key_prefix, name, is_enabled, daily_request_limit)
    VALUES (p_user_id, p_subscription_id, v_key_hash, v_key_prefix, coalesce(nullif(trim(p_name), ''), 'Default API Key'), v_is_active, p_daily_limit)
    RETURNING id INTO v_key_id;
    RETURN jsonb_build_object('success', true, 'http_status', 201, 'key_id', v_key_id,
        'api_key', v_full_key, 'key_prefix', v_key_prefix, 'is_enabled', v_is_active,
        'warning', 'Sauvegardez cette clé maintenant. Elle ne sera plus jamais affichée en clair.');
END;
$$;
-- Partie 2/2 : axis_refresh_api_key — préfixe corrigé, blocage pending, retour normalisé
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