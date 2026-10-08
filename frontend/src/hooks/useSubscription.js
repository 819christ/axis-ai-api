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
        .maybeSingle();

      if (error) throw error;
      setSubscription(data || null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const subscribe = async (packCode) => {
    try {
      if (!user?.id) throw new Error('Vous devez être connecté pour commander un pack.');
      const { data, error } = await supabase.rpc('axis_request_pack', {
        p_pack_code: packCode,
      });
      if (error) throw error;
      if (!data?.success) {
        return { data, error: new Error(data?.error_message || 'La demande de pack a échoué.') };
      }
      await fetchSubscription();
      return { data, error: null };
    } catch (err) {
      console.error('Erreur demande de pack:', err);
      return { data: null, error: err };
    }
  };

  return { subscription, loading, error, refresh: fetchSubscription, subscribe };
};
