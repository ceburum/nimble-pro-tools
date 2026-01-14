import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useAppState } from './useAppState';

export type BusinessType = 'mobile_job' | 'stationary_appointment' | null;

/**
 * useSchedulingPro - Scheduling feature hook using centralized AppState
 * 
 * Access is determined by AppState. This hook provides:
 * - Read access to enabled status (from AppState)
 * - Business type management
 * - Actions to enable/disable the feature (persists to DB)
 */
export function useSchedulingPro() {
  const { user } = useAuth();
  const { hasAccess, loading: stateLoading } = useAppState();
  const [businessType, setBusinessTypeState] = useState<BusinessType>(null);
  const [businessTypeLoading, setBusinessTypeLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Access determined by AppState - NOT by individual DB flag
  const isEnabled = hasAccess('scheduling');
  const loading = stateLoading || businessTypeLoading;

  // Fetch business type separately (still needed for scheduling mode)
  useEffect(() => {
    if (!user) {
      setBusinessTypeState(null);
      setBusinessTypeLoading(false);
      return;
    }

    const fetchBusinessType = async () => {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('business_type')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching business type:', error);
          setBusinessTypeState(null);
        } else {
          setBusinessTypeState((data?.business_type as BusinessType) ?? null);
        }
      } catch (err) {
        console.error('Error:', err);
        setBusinessTypeState(null);
      } finally {
        setBusinessTypeLoading(false);
      }
    };

    fetchBusinessType();
  }, [user]);

  const enableSchedulingPro = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    setActionLoading(true);

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          scheduling_pro_enabled: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('Error enabling Scheduling Pro:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error:', err);
      return false;
    } finally {
      setActionLoading(false);
    }
  }, [user]);

  const disableSchedulingPro = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    setActionLoading(true);

    try {
      const { error } = await supabase
        .from('user_settings')
        .update({ 
          scheduling_pro_enabled: false, 
          updated_at: new Date().toISOString() 
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error disabling Scheduling Pro:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error:', err);
      return false;
    } finally {
      setActionLoading(false);
    }
  }, [user]);

  const setBusinessType = useCallback(async (type: BusinessType): Promise<boolean> => {
    if (!user) return false;
    setActionLoading(true);

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          business_type: type,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('Error setting business type:', error);
        return false;
      }

      setBusinessTypeState(type);
      return true;
    } catch (err) {
      console.error('Error:', err);
      return false;
    } finally {
      setActionLoading(false);
    }
  }, [user]);

  return {
    isEnabled,
    businessType,
    loading,
    actionLoading,
    enableSchedulingPro,
    disableSchedulingPro,
    setBusinessType,
  };
}
