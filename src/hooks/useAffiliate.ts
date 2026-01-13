import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Affiliate {
  id: string;
  user_id: string;
  stripe_account_id: string | null;
  stripe_account_type: string;
  stripe_onboarding_complete: boolean;
  status: 'pending' | 'active' | 'paused' | 'rejected';
  referral_code: string;
  commission_rate: number;
  commission_type: 'percentage' | 'flat';
  total_referrals: number;
  total_earnings: number;
  pending_earnings: number;
  created_at: string;
  updated_at: string;
  stripeAccountStatus?: {
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;
  };
}

export interface Referral {
  id: string;
  affiliate_id: string;
  referred_user_id: string | null;
  referred_email: string | null;
  stripe_payment_intent_id: string | null;
  product_type: string;
  product_name: string;
  sale_amount: number;
  commission_amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  paid_at: string | null;
  created_at: string;
}

export interface AffiliatePayout {
  id: string;
  affiliate_id: string;
  amount: number;
  stripe_transfer_id: string | null;
  status: string;
  processed_at: string | null;
  created_at: string;
}

export interface AffiliateSettings {
  signupsEnabled: boolean;
  maxAffiliates: number;
  currentAffiliates: number;
  minPayoutThreshold: number;
}

interface AffiliateStatusResponse {
  isAffiliate: boolean;
  affiliate: Affiliate | null;
  referrals: Referral[];
  payouts: AffiliatePayout[];
  settings: AffiliateSettings | null;
}

export function useAffiliate() {
  const [loading, setLoading] = useState(true);
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [payouts, setPayouts] = useState<AffiliatePayout[]>([]);
  const [settings, setSettings] = useState<AffiliateSettings | null>(null);
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);

  const checkAffiliateStatus = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsAffiliate(false);
        setAffiliate(null);
        return;
      }

      const { data, error } = await supabase.functions.invoke<AffiliateStatusResponse>('affiliate-check-status', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (!data) throw new Error('No data returned');

      setIsAffiliate(data.isAffiliate);
      setAffiliate(data.affiliate);
      setReferrals(data.referrals || []);
      setPayouts(data.payouts || []);
      setSettings(data.settings);
    } catch (error) {
      console.error('Error checking affiliate status:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const startOnboarding = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Authentication required',
          description: 'Please log in to join the affiliate program.',
          variant: 'destructive',
        });
        return null;
      }

      const { data, error } = await supabase.functions.invoke<{ url: string }>('affiliate-connect-onboard', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('No onboarding URL returned');

      setOnboardingUrl(data.url);
      return data.url;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start onboarding';
      toast({
        title: 'Onboarding Error',
        description: message,
        variant: 'destructive',
      });
      return null;
    }
  }, []);

  const openStripeDashboard = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Authentication required',
          description: 'Please log in to access your dashboard.',
          variant: 'destructive',
        });
        return null;
      }

      const { data, error } = await supabase.functions.invoke<{ url: string }>('affiliate-dashboard', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('No dashboard URL returned');

      window.open(data.url, '_blank');
      return data.url;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to open dashboard';
      toast({
        title: 'Dashboard Error',
        description: message,
        variant: 'destructive',
      });
      return null;
    }
  }, []);

  const getReferralLink = useCallback(() => {
    if (!affiliate?.referral_code) return null;
    return `${window.location.origin}?ref=${affiliate.referral_code}`;
  }, [affiliate]);

  const copyReferralLink = useCallback(async () => {
    const link = getReferralLink();
    if (!link) return false;
    
    try {
      await navigator.clipboard.writeText(link);
      toast({
        title: 'Link copied!',
        description: 'Your referral link has been copied to clipboard.',
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

  useEffect(() => {
    checkAffiliateStatus();
  }, [checkAffiliateStatus]);

  return {
    loading,
    isAffiliate,
    affiliate,
    referrals,
    payouts,
    settings,
    onboardingUrl,
    checkAffiliateStatus,
    startOnboarding,
    openStripeDashboard,
    getReferralLink,
    copyReferralLink,
  };
}
