import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type ReferralLinkStatus = 'active' | 'used' | 'expired' | 'reward_pending' | 'reward_completed';

export interface UserReferralReward {
  id: string;
  user_id: string;
  referral_code: string;
  original_purchase_amount: number;
  status: ReferralLinkStatus;
  referred_buyer_email: string | null;
  referred_purchase_amount: number | null;
  referred_at: string | null;
  reward_amount: number | null;
  reward_method: string | null;
  reward_processed_at: string | null;
  created_at: string;
  expires_at: string;
}

export function useUserReferral() {
  const [loading, setLoading] = useState(true);
  const [referralReward, setReferralReward] = useState<UserReferralReward | null>(null);
  const [hasPurchased, setHasPurchased] = useState(false);

  const checkReferralStatus = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setReferralReward(null);
        setHasPurchased(false);
        return;
      }

      // Check for existing referral reward
      const { data, error } = await supabase
        .from('user_referral_rewards')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        // Map the database fields to our interface
        const reward = data[0];
        setReferralReward({
          id: reward.id,
          user_id: reward.user_id,
          referral_code: reward.referral_code,
          original_purchase_amount: reward.original_purchase_amount,
          status: reward.status as ReferralLinkStatus,
          referred_buyer_email: reward.referred_buyer_email,
          referred_purchase_amount: reward.referred_purchase_amount,
          referred_at: reward.referred_at,
          reward_amount: reward.reward_amount,
          reward_method: reward.reward_method,
          reward_processed_at: reward.reward_processed_at,
          created_at: reward.created_at,
          expires_at: reward.expires_at,
        });
        setHasPurchased(true);
      } else {
        setReferralReward(null);
        // Check if user has made any purchases (user_settings with ai_scans_subscription_status or similar)
        const { data: settings } = await supabase
          .from('user_settings')
          .select('ai_scans_subscription_status, ai_scans_subscription_customer_id')
          .eq('user_id', session.user.id)
          .single();
        
        setHasPurchased(!!(settings?.ai_scans_subscription_customer_id));
      }
    } catch (error) {
      console.error('Error checking referral status:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const generateReferralLink = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Authentication required',
          description: 'Please log in to generate your referral link.',
          variant: 'destructive',
        });
        return null;
      }

      const { data, error } = await supabase.functions.invoke<{ referralCode: string; link: string }>('user-referral-generate', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (!data?.link) throw new Error('No referral link generated');

      // Refresh status
      await checkReferralStatus();
      
      toast({
        title: 'Referral link created!',
        description: 'Share it with a friend to get 50% back.',
      });

      return data.link;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate referral link';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return null;
    }
  }, [checkReferralStatus]);

  const getReferralLink = useCallback(() => {
    if (!referralReward?.referral_code) return null;
    return `${window.location.origin}?ref=${referralReward.referral_code}`;
  }, [referralReward]);

  const copyReferralLink = useCallback(async () => {
    const link = getReferralLink();
    if (!link) return false;
    
    try {
      await navigator.clipboard.writeText(link);
      toast({
        title: 'Link copied!',
        description: 'Share it with a friend to get 50% back.',
      });
      return true;
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Please manually copy your referral link.',
        variant: 'destructive',
      });
      return false;
    }
  }, [getReferralLink]);

  const getStatusLabel = useCallback(() => {
    if (!referralReward) return null;
    
    switch (referralReward.status) {
      case 'active':
        return { label: 'Link Active', variant: 'default' as const, description: 'Share with a friend to earn your reward!' };
      case 'used':
        return { label: 'Link Used', variant: 'secondary' as const, description: 'Someone used your link! Processing reward...' };
      case 'reward_pending':
        return { label: 'Reward Pending', variant: 'secondary' as const, description: `$${referralReward.reward_amount?.toFixed(2) || '0.00'} being processed` };
      case 'reward_completed':
        return { label: 'Reward Completed', variant: 'default' as const, description: `$${referralReward.reward_amount?.toFixed(2) || '0.00'} refunded!` };
      case 'expired':
        return { label: 'Link Expired', variant: 'outline' as const, description: 'This link has expired' };
      default:
        return null;
    }
  }, [referralReward]);

  useEffect(() => {
    checkReferralStatus();
  }, [checkReferralStatus]);

  return {
    loading,
    referralReward,
    hasPurchased,
    checkReferralStatus,
    generateReferralLink,
    getReferralLink,
    copyReferralLink,
    getStatusLabel,
  };
}
