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

  const subscribe = async (tierNumber, moderatorCode) => {
    try {
      const { data, error } = await supabase.rpc('axis_subscribe', {
        p_user_id: user.id,
        p_tier_number: tierNumber,
        p_moderator_code: moderatorCode ? moderatorCode.trim() : null
      });

      if (!error && data?.success) {
        await fetchSubscription();
        return { data, error: null };
      }

      console.warn('[Axis Subscription] RPC indisponible ou en erreur, bascule vers création directe :', error?.message || data?.error_message);
      
      // Fallback direct : création de la souscription en attente de validation
      const TIERS_BUDGETS = { 1: 10, 2: 25, 3: 50, 4: 100, 5: 200, 6: 350, 7: 500 };
      const budget = TIERS_BUDGETS[tierNumber] || 10;
      const now = new Date();
      const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      let modId = null;
      let modCodeUsed = null;
      if (moderatorCode && moderatorCode.trim()) {
        const { data: modProfile } = await supabase
          .from('profiles')
          .select('id, moderator_code')
          .eq('role', 'moderator')
          .ilike('moderator_code', moderatorCode.trim())
          .maybeSingle();

        if (modProfile) {
          modId = modProfile.id;
          modCodeUsed = modProfile.moderator_code;
        } else {
          modCodeUsed = moderatorCode.trim().toUpperCase();
        }
      }

      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          tier_number: tierNumber,
          budget_amount_usd: budget,
          balance_usd: budget,
          consumed_usd: 0,
          starts_at: now.toISOString(),
          expires_at: expires.toISOString(),
          status: 'pending_validation',
          is_active: false,
          moderator_id: modId,
          moderator_code_used: modCodeUsed,
          commission_status: modCodeUsed ? 'unpaid' : 'none'
        })
        .select()
        .single();

      if (subError) throw subError;

      await fetchSubscription();
      return {
        data: {
          success: true,
          subscription_id: subData.id,
          status: 'pending_validation',
          tier_number: tierNumber
        },
        error: null
      };
    } catch (err) {
      console.error('Erreur subscribe:', err);
      return { data: null, error: err };
    }
  };

  return { subscription, loading, error, refresh: fetchSubscription, subscribe };
};
