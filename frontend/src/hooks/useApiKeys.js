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

  // Récupère toutes les clés de l'utilisateur, qu'elles aient un abonnement ou non
  const fetchKeys = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*, subscriptions(id, tier_number, status, balance_usd, expires_at)')
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
    const { data, error } = await supabase.rpc('axis_generate_api_key', {
      p_user_id: user.id,
      p_subscription_id: subscriptionId || null,
      p_name: name || 'Default API Key',
      p_daily_limit: dailyLimit || null
    });

    if (!error && data?.success) {
      await fetchKeys();
    }
    return { data, error };
  };

  // Bascule active/inactive avec vérification d'abonnement
  const toggleKey = async (keyId, isEnabled, hasValidSubscription) => {
    // Si l'utilisateur est admin, il a le bypass total
    const isAdmin = profile?.role === 'admin';

    // Si on veut activer une clé sans abonnement valide et sans être admin -> Erreur explicite
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

  // Liaison manuelle d'une clé existante à un abonnement actif
  const linkKeyToSubscription = async (keyId, subscriptionId) => {
    const { error } = await supabase
      .from('api_keys')
      .update({
        subscription_id: subscriptionId,
        is_enabled: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', keyId);

    if (!error) {
      await fetchKeys();
    }
    return { error };
  };

  // Suppression / Révocation définitive
  const deleteKey = async (keyId) => {
    const { error } = await supabase.rpc('axis_revoke_api_key', {
      p_key_id: keyId,
      p_delete: true
    });
    if (!error) await fetchKeys();
    return { error };
  };

  // Rotation / Régénération de clé
  const refreshKey = async (keyId) => {
    const { data, error } = await supabase.rpc('axis_refresh_api_key', {
      p_key_id: keyId
    });
    if (!error) await fetchKeys();
    return { data, error };
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
