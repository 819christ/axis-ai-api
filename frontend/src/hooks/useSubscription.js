import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './useAuth';

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    fetchSubscription();
  }, [user]);

  const fetchSubscription = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      setSubscription(data || null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const subscribe = async (tierNumber, moderatorCode) => {
    const { data, error } = await supabase.rpc('axis_subscribe', {
      p_user_id: user.id,
      p_tier_number: tierNumber,
      p_moderator_code: moderatorCode || null
    });
    if (!error) await fetchSubscription();
    return { data, error };
  };

  return { subscription, loading, error, refresh: fetchSubscription, subscribe };
};
