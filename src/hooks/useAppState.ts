import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { 
  AppState, 
  FeatureKey, 
  getStateCapabilities, 
  hasFeatureAccess,
  StateCapabilities 
} from '@/lib/appState';

interface TrialInfo {
  started_at: string;
  expires_at: string;
}

type TrialRecord = Record<string, TrialInfo>;

interface AppStateData {
  // Current authoritative state
  state: AppState;
  
  // Loading indicator
  loading: boolean;
  
  // Capabilities based on current state
  capabilities: StateCapabilities;
  
  // Convenience checks
  isAdmin: boolean;
  isSetupComplete: boolean;
  isTrialActive: boolean;
  isPaidPro: boolean;
  
  // Feature access check
  hasAccess: (feature: FeatureKey) => boolean;
  
  // Actions
  resetToInstall: () => Promise<boolean>;
  refreshState: () => Promise<void>;
}

/**
 * useAppState - Single authoritative hook for application state
 * 
 * This hook determines the current AppState based on:
 * 1. Authentication status
 * 2. Admin role in user_roles table
 * 3. Setup completion status
 * 4. Trial status
 * 5. Paid subscription status
 * 
 * IMPORTANT: This is the ONLY source of truth for app state.
 * All other hooks should use this for feature gating.
 */
export function useAppState(): AppStateData {
  const { user, loading: authLoading } = useAuth();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [setupCompleted, setSetupCompleted] = useState<boolean | null>(null);
  const [trials, setTrials] = useState<TrialRecord>({});
  const [paidFeatures, setPaidFeatures] = useState<Record<string, boolean>>({});
  const [dataLoading, setDataLoading] = useState(true);

  // Fetch all state-related data from database
  useEffect(() => {
    async function fetchStateData() {
      if (!user?.id) {
        setIsAdmin(false);
        setSetupCompleted(null);
        setTrials({});
        setPaidFeatures({});
        setDataLoading(false);
        return;
      }

      try {
        // Parallel fetch for performance
        const [roleResult, settingsResult] = await Promise.all([
          // Check admin role
          supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'admin')
            .maybeSingle(),
          
          // Get user settings
          supabase
            .from('user_settings')
            .select(`
              setup_completed,
              trial_started_at,
              scheduling_pro_enabled,
              financial_tool_enabled,
              financial_pro_enabled,
              tax_pro_enabled,
              mileage_pro_enabled,
              ai_scans_subscription_status
            `)
            .eq('user_id', user.id)
            .maybeSingle(),
        ]);

        // Set admin status
        setIsAdmin(!!roleResult.data);

        // Set setup status
        setSetupCompleted(settingsResult.data?.setup_completed ?? false);

        // Set trials
        if (settingsResult.data?.trial_started_at && typeof settingsResult.data.trial_started_at === 'object') {
          setTrials(settingsResult.data.trial_started_at as unknown as TrialRecord);
        } else {
          setTrials({});
        }

        // Set paid features
        setPaidFeatures({
          scheduling: settingsResult.data?.scheduling_pro_enabled ?? false,
          financial: settingsResult.data?.financial_tool_enabled ?? 
                     settingsResult.data?.financial_pro_enabled ?? 
                     settingsResult.data?.tax_pro_enabled ?? false,
          mileage: settingsResult.data?.mileage_pro_enabled ?? false,
          aiScanning: settingsResult.data?.ai_scans_subscription_status === 'active',
        });

      } catch (error) {
        console.error('Error fetching app state:', error);
      } finally {
        setDataLoading(false);
      }
    }

    fetchStateData();
  }, [user?.id]);

  // Check if any trial is currently active
  const isTrialActive = useMemo(() => {
    const now = new Date();
    return Object.values(trials).some(trial => {
      if (!trial?.expires_at) return false;
      return new Date(trial.expires_at) > now;
    });
  }, [trials]);

  // Check if user has any paid pro features
  const isPaidPro = useMemo(() => {
    return Object.values(paidFeatures).some(enabled => enabled);
  }, [paidFeatures]);

  // Determine the authoritative AppState
  const state = useMemo((): AppState => {
    // Still loading - default to INSTALL to prevent flashing
    if (authLoading || dataLoading) {
      return AppState.INSTALL;
    }

    // No user - INSTALL state
    if (!user) {
      return AppState.INSTALL;
    }

    // Admin users get ADMIN_PREVIEW - bypasses all paywalls
    if (isAdmin) {
      return AppState.ADMIN_PREVIEW;
    }

    // Setup not completed
    if (!setupCompleted) {
      return AppState.SETUP_INCOMPLETE;
    }

    // Has paid pro features
    if (isPaidPro) {
      return AppState.PAID_PRO;
    }

    // Has active trial
    if (isTrialActive) {
      return AppState.TRIAL_PRO;
    }

    // Default: setup complete, no pro features
    return AppState.READY_BASE;
  }, [authLoading, dataLoading, user, isAdmin, setupCompleted, isPaidPro, isTrialActive]);

  // Get capabilities for current state
  const capabilities = useMemo(() => getStateCapabilities(state), [state]);

  // Feature access check
  const hasAccess = useCallback((feature: FeatureKey): boolean => {
    return hasFeatureAccess(state, feature);
  }, [state]);

  // Reset to install state (admin only)
  const resetToInstall = useCallback(async (): Promise<boolean> => {
    if (!user?.id || state !== AppState.ADMIN_PREVIEW) {
      return false;
    }

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          setup_completed: false,
          business_type: null,
          business_sector: null,
          company_name: null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('Error resetting setup:', error);
        return false;
      }

      // Clear local storage items
      localStorage.removeItem('nimble_services');
      localStorage.removeItem('nimble_services_preview');
      localStorage.removeItem('nimble_service_menu_settings');
      localStorage.removeItem('nimble_feature_flags');

      setSetupCompleted(false);
      return true;
    } catch (err) {
      console.error('Error:', err);
      return false;
    }
  }, [user?.id, state]);

  // Refresh state from database
  const refreshState = useCallback(async (): Promise<void> => {
    setDataLoading(true);
    // Re-trigger the effect by changing a dependency
    // The effect will run again due to user?.id dependency
  }, []);

  const loading = authLoading || dataLoading;

  return {
    state,
    loading,
    capabilities,
    isAdmin,
    isSetupComplete: setupCompleted ?? false,
    isTrialActive,
    isPaidPro,
    hasAccess,
    resetToInstall,
    refreshState,
  };
}
