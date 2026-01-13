import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Affiliate } from './useAffiliate';

interface AdminSettings {
  id: string;
  signups_enabled: boolean;
  max_affiliates: number;
  current_affiliates: number;
  default_commission_rate: number;
  default_commission_type: string;
  min_payout_threshold: number;
  updated_at: string;
}

export function useAffiliateAdmin() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [settings, setSettings] = useState<AdminSettings | null>(null);

  const checkAdminStatus = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsAdmin(false);
        return false;
      }

      // Check if user has admin role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      const hasAdminRole = !!roleData;
      setIsAdmin(hasAdminRole);
      return hasAdminRole;
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
      return false;
    }
  }, []);

  const fetchAffiliates = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('affiliate-admin', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { action: 'get_all_affiliates' },
      });

      if (error) throw error;
      setAffiliates(data?.affiliates || []);
    } catch (error) {
      console.error('Error fetching affiliates:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('affiliate-admin', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { action: 'get_settings' },
      });

      if (error) throw error;
      setSettings(data?.settings || null);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  }, []);

  const updateSettings = useCallback(async (updates: Partial<AdminSettings>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      const { data, error } = await supabase.functions.invoke('affiliate-admin', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { 
          action: 'update_settings',
          settings: { ...settings, ...updates },
        },
      });

      if (error) throw error;
      
      toast({
        title: 'Settings updated',
        description: 'Affiliate program settings have been saved.',
      });
      
      await fetchSettings();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update settings';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return false;
    }
  }, [settings, fetchSettings]);

  const increaseLimit = useCallback(async (amount: number = 25) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      const { data, error } = await supabase.functions.invoke('affiliate-admin', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { action: 'increase_limit', amount },
      });

      if (error) throw error;
      
      toast({
        title: 'Limit increased',
        description: `New affiliate limit: ${data.newLimit}`,
      });
      
      await fetchSettings();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to increase limit';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return false;
    }
  }, [fetchSettings]);

  const updateAffiliate = useCallback(async (affiliateId: string, updates: Partial<Affiliate>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      const { error } = await supabase.functions.invoke('affiliate-admin', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { 
          action: 'update_affiliate',
          affiliateId,
          updates,
        },
      });

      if (error) throw error;
      
      toast({
        title: 'Affiliate updated',
        description: 'Changes have been saved.',
      });
      
      await fetchAffiliates();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update affiliate';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return false;
    }
  }, [fetchAffiliates]);

  const processPayout = useCallback(async (affiliateId: string, amount: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      const { data, error } = await supabase.functions.invoke('affiliate-admin', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { 
          action: 'process_payout',
          affiliateId,
          amount,
        },
      });

      if (error) throw error;
      
      toast({
        title: 'Payout processed',
        description: `Transfer ID: ${data.transferId}`,
      });
      
      await fetchAffiliates();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process payout';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return false;
    }
  }, [fetchAffiliates]);

  useEffect(() => {
    const init = async () => {
      const hasAccess = await checkAdminStatus();
      if (hasAccess) {
        await Promise.all([fetchAffiliates(), fetchSettings()]);
      }
      setLoading(false);
    };
    init();
  }, [checkAdminStatus, fetchAffiliates, fetchSettings]);

  return {
    loading,
    isAdmin,
    affiliates,
    settings,
    fetchAffiliates,
    fetchSettings,
    updateSettings,
    increaseLimit,
    updateAffiliate,
    processPayout,
  };
}
