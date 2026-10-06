import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './useAuth';

export const useApiKeys = () => {
  const { user, profile } = useAuth();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchKeys();
    } else {
      setKeys([]);
      setLoading(false);
    }
  }, [user]);

  // Récupère toutes les clés de l'utilisateur avec leur abonnement associé
  const fetchKeys = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*, subscriptions(id, tier_number, status, balance_usd, expires_at, budget_amount_usd)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setKeys(data);
      }
    } catch (err) {
      console.error('Erreur chargement clés:', err);
    } finally {
      setLoading(false);
    }
  };

  // Création d'une clé API — Libre et possible même SANS abonnement actif
  const createKey = async (name, subscriptionId = null, dailyLimit = null) => {
    try {
      // Tentative 1 : RPC serveur
      const { data, error } = await supabase.rpc('axis_generate_api_key', {
        p_user_id: user.id,
        p_subscription_id: subscriptionId || null,
        p_name: name || 'Default API Key',
        p_daily_limit: dailyLimit || null
      });

      if (!error && data?.success) {
        await fetchKeys();
        return { data, error: null };
      }

      // Tentative 2 : Fallback client (Web Crypto API)
      console.warn('[Axis Key Generator] RPC échouée, bascule vers le générateur client :', error?.message);
      const randBytes = new Uint8Array(24);
      window.crypto.getRandomValues(randBytes);
      const rawHex = Array.from(randBytes, b => b.toString(16).padStart(2, '0')).join('');

      // Clé complète : 'axis_live_' + 40 hex chars ≈ 50 chars
      const fullKey = 'axis_live_' + rawHex.slice(0, 40);

      // key_prefix doit tenir dans varchar(16) : 'ax_' + 8 hex + '...' = 14 chars ✓
      const keyPrefix = 'ax_' + rawHex.slice(0, 8) + '...';

      // Hash SHA-256 via SubtleCrypto
      const encoder = new TextEncoder();
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoder.encode(fullKey));
      const keyHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

      // Vérifier le statut réel de l'abonnement avant d'activer la clé
      let isKeyEnabled = profile?.role === 'admin';
      if (subscriptionId && !isKeyEnabled) {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('status, is_active, expires_at')
          .eq('id', subscriptionId)
          .maybeSingle();
        if (sub) isKeyEnabled = (sub.status === 'active' && sub.is_active === true && new Date(sub.expires_at) > new Date());
      }

      const { data: insertedKey, error: insertError } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          subscription_id: subscriptionId || null,
          name: (name || 'Default API Key').trim(),
          key_hash: keyHash,
          key_prefix: keyPrefix,
          is_enabled: isKeyEnabled,
          daily_request_limit: dailyLimit || null
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await fetchKeys();
      return {
        data: {
          success: true,
          api_key: fullKey,
          key_prefix: keyPrefix,
          key_id: insertedKey.id,
          is_enabled: isKeyEnabled
        },
        error: null
      };
    } catch (err) {
      console.error('Erreur createKey:', err);
      return { data: null, error: err };
    }
  };

  // Bascule active/inactive avec vérification d'abonnement
  const toggleKey = async (keyId, isEnabled, hasValidSubscription) => {
    const isAdmin = profile?.role === 'admin';

    if (isEnabled && !hasValidSubscription && !isAdmin) {
      return {
        error: {
          message: "Un abonnement actif est requis pour activer cette clé.",
          needSubscription: true
        }
      };
    }

    const { error } = await supabase
      .from('api_keys')
      .update({ is_enabled: isEnabled, updated_at: new Date().toISOString() })
      .eq('id', keyId);

    if (!error) {
      await fetchKeys();
    }
    return { error };
  };

  // Liaison manuelle d'une clé existante à un abonnement
  const linkKeyToSubscription = async (keyId, subscriptionId) => {
    // Lire le statut réel de l'abonnement — ne pas deviner
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('status, is_active, expires_at')
      .eq('id', subscriptionId)
      .maybeSingle();

    const subIsLive = sub?.status === 'active' && sub?.is_active === true && new Date(sub.expires_at) > new Date();

    const { error } = await supabase
      .from('api_keys')
      .update({
        subscription_id: subscriptionId,
        is_enabled: Boolean(subIsLive) || profile?.role === 'admin',
        updated_at: new Date().toISOString()
      })
      .eq('id', keyId);

    if (!error) await fetchKeys();
    return { error };
  };

  // Suppression / Révocation définitive
  const deleteKey = async (keyId) => {
    const { data, error } = await supabase.rpc('axis_revoke_api_key', { p_key_id: keyId, p_delete: true });
    if (error) {
      return { error: { message: error.message, code: /KEY_HAS_SUBSCRIPTION/.test(error.message) ? 'KEY_HAS_SUBSCRIPTION' : undefined } };
    }
    if (data?.success === false) {
      return { error: { message: data.error_message, code: data.error_code } };
    }
    await fetchKeys();
    return { error: null };
  };

  // Rotation / Régénération de clé
  const refreshKey = async (keyId) => {
    const { data, error } = await supabase.rpc('axis_refresh_api_key', { p_key_id: keyId });

    if (error) return { data: null, error };

    if (!data?.success) {
      return {
        data,
        error: {
          message: data?.error_message || 'Échec de la régénération.',
          code: data?.error_code,
        },
      };
    }

    await fetchKeys();
    return { data: { ...data, api_key: data.api_key || data.new_api_key }, error: null };
  };

  return {
    keys,
    loading,
    refresh: fetchKeys,
    createKey,
    toggleKey,
    linkKeyToSubscription,
    deleteKey,
    refreshKey
  };
};
