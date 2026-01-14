import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useAppState } from './useAppState';

/**
 * useMileagePro - Mileage feature hook using centralized AppState
 * 
 * Access is determined by AppState. This hook provides:
 * - Read access to enabled status (from AppState)
 * - Actions to enable/disable the feature (persists to DB)
 */
export function useMileagePro() {
  const { user } = useAuth();
  const { hasAccess, loading: stateLoading } = useAppState();
  const [actionLoading, setActionLoading] = useState(false);

  // Access determined by AppState - NOT by individual DB flag
  const isEnabled = hasAccess('mileage');
  const loading = stateLoading;

  const enableMileagePro = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    setActionLoading(true);

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          mileage_pro_enabled: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('Error enabling Mileage Pro:', error);
        return false;
      }

      // Note: State will update on next AppState refresh
      return true;
    } catch (err) {
      console.error('Error:', err);
      return false;
    } finally {
      setActionLoading(false);
    }
  }, [user]);

  const disableMileagePro = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    setActionLoading(true);

    try {
      const { error } = await supabase
        .from('user_settings')
        .update({ 
          mileage_pro_enabled: false, 
          updated_at: new Date().toISOString() 
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error disabling Mileage Pro:', error);
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

  return {
    isEnabled,
    loading,
    actionLoading,
    enableMileagePro,
    disableMileagePro
  };
}
