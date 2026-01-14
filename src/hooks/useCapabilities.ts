import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

export type FeatureKey = 
  | 'scheduling_pro'
  | 'financial_tool'
  | 'mileage_pro'
  | 'service_menu'
  | 'ai_scanning';

interface CapabilityState {
  enabled: boolean;
  loading: boolean;
}

interface UseCapabilitiesReturn {
  // Admin check (from user_roles table, not UI state)
  isAdmin: boolean;
  adminLoading: boolean;
  
  // Feature capability checks
  hasCapability: (feature: FeatureKey) => boolean;
  isLoading: (feature: FeatureKey) => boolean;
  
  // Enable features
  enableFeature: (feature: FeatureKey) => Promise<boolean>;
  
  // Dev mode (only affects capability display, not admin status)
  isDevMode: boolean;
}

export function useCapabilities(): UseCapabilitiesReturn {
  const { user } = useAuth();
  const { isDevModeEnabled, updateFlag } = useFeatureFlags();
  
  // Admin status - determined ONLY by user_roles table
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);
  
  // Feature states from user_settings
  const [featureStates, setFeatureStates] = useState<Record<FeatureKey, CapabilityState>>({
    scheduling_pro: { enabled: false, loading: true },
    financial_tool: { enabled: false, loading: true },
    mileage_pro: { enabled: false, loading: true },
    service_menu: { enabled: false, loading: true },
    ai_scanning: { enabled: false, loading: true },
  });

  // Check admin role from database
  useEffect(() => {
    async function checkAdminRole() {
      if (!user?.id) {
        setIsAdmin(false);
        setAdminLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();
        
        setIsAdmin(!!data);
      } catch (error) {
        console.error('Error checking admin role:', error);
        setIsAdmin(false);
      } finally {
        setAdminLoading(false);
      }
    }

    checkAdminRole();
  }, [user?.id]);

  // Load feature states from user_settings
  useEffect(() => {
    async function loadFeatureStates() {
      if (!user?.id) {
        setFeatureStates(prev => 
          Object.fromEntries(
            Object.keys(prev).map(key => [key, { enabled: false, loading: false }])
          ) as Record<FeatureKey, CapabilityState>
        );
        return;
      }

      try {
        const { data } = await supabase
          .from('user_settings')
          .select('scheduling_pro_enabled, financial_tool_enabled, financial_pro_enabled, tax_pro_enabled, mileage_pro_enabled, ai_scans_subscription_status')
          .eq('user_id', user.id)
          .maybeSingle();

        // Financial tool is enabled if new flag OR either legacy flag is set
        const financialToolEnabled = data?.financial_tool_enabled ?? data?.financial_pro_enabled ?? data?.tax_pro_enabled ?? false;

        setFeatureStates({
          scheduling_pro: { enabled: data?.scheduling_pro_enabled ?? false, loading: false },
          financial_tool: { enabled: financialToolEnabled, loading: false },
          mileage_pro: { enabled: data?.mileage_pro_enabled ?? false, loading: false },
          service_menu: { enabled: false, loading: false }, // Local flag only
          ai_scanning: { enabled: data?.ai_scans_subscription_status === 'active', loading: false },
        });
      } catch (error) {
        console.error('Error loading feature states:', error);
        setFeatureStates(prev => 
          Object.fromEntries(
            Object.keys(prev).map(key => [key, { enabled: false, loading: false }])
          ) as Record<FeatureKey, CapabilityState>
        );
      }
    }

    loadFeatureStates();
  }, [user?.id]);

  // Check if user has capability for a feature
  const hasCapability = useCallback((feature: FeatureKey): boolean => {
    // Admin users have access to all features
    if (isAdmin) {
      return true;
    }
    return featureStates[feature]?.enabled ?? false;
  }, [featureStates, isAdmin]);

  // Check if a feature is still loading
  const isLoading = useCallback((feature: FeatureKey): boolean => {
    return featureStates[feature]?.loading ?? false;
  }, [featureStates]);

  // Enable a feature
  const enableFeature = useCallback(async (feature: FeatureKey): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const columnMap: Record<FeatureKey, string> = {
        scheduling_pro: 'scheduling_pro_enabled',
        financial_tool: 'financial_tool_enabled',
        mileage_pro: 'mileage_pro_enabled',
        service_menu: 'service_menu_enabled', // Local only
        ai_scanning: 'ai_scans_subscription_status',
      };

      // Service menu uses local flags only
      if (feature === 'service_menu') {
        updateFlag('service_menu_enabled', true);
        setFeatureStates(prev => ({
          ...prev,
          [feature]: { enabled: true, loading: false },
        }));
        return true;
      }

      const { error } = await supabase
        .from('user_settings')
        .upsert({ 
          user_id: user.id,
          [columnMap[feature]]: true,
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setFeatureStates(prev => ({
        ...prev,
        [feature]: { enabled: true, loading: false },
      }));

      return true;
    } catch (error) {
      console.error(`Error enabling ${feature}:`, error);
      return false;
    }
  }, [user?.id, updateFlag]);

  return {
    isAdmin,
    adminLoading,
    hasCapability,
    isLoading,
    enableFeature,
    isDevMode: isDevModeEnabled,
  };
}
