import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './useAuth';
import { useToast } from '../components/Toast';

// Source de données unique : abonnements + clés de l'utilisateur connecté
export const useMySubscriptions = () => {
  const { profile } = useAuth();
  const addToast = useToast();
  const [subscriptions, setSubscriptions] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const [subRes, keyRes] = await Promise.all([
        supabase.from('subscriptions').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }),
        supabase.from('api_keys').select('id, name, key_prefix, subscription_id, is_enabled').eq('user_id', profile.id),
      ]);
      if (subRes.error && !subRes.error.message?.includes('recursion')) throw subRes.error;
      setSubscriptions(subRes.error ? [] : subRes.data || []);
      setApiKeys(keyRes.data || []);
    } catch (e) {
      console.error(e);
      addToast(e.message || 'Erreur lors du chargement', 'error');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  useEffect(() => { refresh(); }, [refresh]);

  const keyForSub = (subId) => apiKeys.find((k) => k.subscription_id === subId);

  return { profile, subscriptions, apiKeys, loading, refresh, keyForSub };
};