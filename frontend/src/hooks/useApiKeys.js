import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './useAuth';

export const useApiKeys = (subscriptionId) => {
  const { user } = useAuth();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && subscriptionId) fetchKeys();
    else setLoading(false);
  }, [user, subscriptionId]);

  const fetchKeys = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', user.id)
      .eq('subscription_id', subscriptionId);
    
    if (!error) setKeys(data || []);
    setLoading(false);
  };

  const createKey = async (name, dailyLimit) => {
    const { data, error } = await supabase.rpc('axis_generate_api_key', {
      p_user_id: user.id,
      p_subscription_id: subscriptionId,
      p_name: name,
      p_daily_limit: dailyLimit || null
    });
    if (!error) await fetchKeys();
    return { data, error };
  };

  const toggleKey = async (keyId, isEnabled) => {
    const { error } = await supabase.from('api_keys').update({ is_enabled: isEnabled }).eq('id', keyId);
    if (!error) fetchKeys();
    return { error };
  };

  const deleteKey = async (keyId) => {
    const { error } = await supabase.rpc('axis_revoke_api_key', { p_key_id: keyId, p_delete: true });
    if (!error) fetchKeys();
    return { error };
  };

  const refreshKey = async (keyId) => {
    const { data, error } = await supabase.rpc('axis_refresh_api_key', { p_key_id: keyId });
    if (!error) fetchKeys();
    return { data, error };
  };

  return { keys, loading, refresh: fetchKeys, createKey, toggleKey, deleteKey, refreshKey };
};
