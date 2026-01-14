import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { 
  AppState, 
  FeatureKey, 
  getStateCapabilities, 
  hasFeatureAccess,
  StateCapabilities,
  getNextState
} from '@/lib/appState';

interface TrialInfo {
  started_at: string;
  expires_at: string;
}

type TrialRecord = Record<string, TrialInfo>;

interface SetupProgress {
  companyName: string | null;
  businessType: string | null;
  businessSector: string | null;
  setupCompleted: boolean;
}

interface AppStateData {
  // Current authoritative state
  state: AppState;
  
  // Loading indicator
  loading: boolean;
  
  // Capabilities based on current state
  capabilities: StateCapabilities;
  
  // Setup progress (for onboarding UI)
  setupProgress: SetupProgress;
  
  // Convenience checks
  isAdmin: boolean;
  isSetupComplete: boolean;
  isTrialActive: boolean;
  isPaidPro: boolean;
  
  // Feature access check
  hasAccess: (feature: FeatureKey) => boolean;
  
  // State transition actions
  transitionTo: (action: 'complete_setup' | 'start_trial' | 'subscribe' | 'trial_expired' | 'reset') => Promise<boolean>;
  
  // Specific actions
  resetToInstall: () => Promise<boolean>;
  refreshState: () => Promise<void>;
  
  // Setup step persistence (for immediate feedback during onboarding)
  persistSetupStep: (step: 'business_type' | 'business_sector', value: string) => Promise<boolean>;
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
  const [setupProgress, setSetupProgress] = useState<SetupProgress>({
    companyName: null,
    businessType: null,
    businessSector: null,
    setupCompleted: false,
  });
  const [trials, setTrials] = useState<TrialRecord>({});
  const [paidFeatures, setPaidFeatures] = useState<Record<string, boolean>>({});
  const [dataLoading, setDataLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch all state-related data from database
  useEffect(() => {
    async function fetchStateData() {
      if (!user?.id) {
        setIsAdmin(false);
        setSetupProgress({
          companyName: null,
          businessType: null,
          businessSector: null,
          setupCompleted: false,
        });
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
              company_name,
              business_type,
              business_sector,
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

        // Set setup progress
        setSetupProgress({
          companyName: settingsResult.data?.company_name ?? null,
          businessType: settingsResult.data?.business_type ?? null,
          businessSector: settingsResult.data?.business_sector ?? null,
          setupCompleted: settingsResult.data?.setup_completed ?? false,
        });

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
  }, [user?.id, refreshTrigger]);

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
  // CRITICAL: This is the ONLY source of truth for app state
  const state = useMemo((): AppState => {
    // Still loading - default to INSTALL to prevent UI flash
    if (authLoading || dataLoading) {
      return AppState.INSTALL;
    }

    // No user session - INSTALL state (ProtectedRoute will redirect to /auth)
    if (!user) {
      return AppState.INSTALL;
    }

    // --- User is authenticated from here ---

    // Admin users get ADMIN_PREVIEW - bypasses all paywalls
    // Admins can replay setup (see wizard if incomplete) but always have full access
    if (isAdmin) {
      return AppState.ADMIN_PREVIEW;
    }

    // Setup not completed - user MUST complete setup before accessing main app
    // This immediately transitions from INSTALL -> SETUP_INCOMPLETE on first login
    if (!setupProgress.setupCompleted) {
      return AppState.SETUP_INCOMPLETE;
    }

    // --- Setup is complete from here ---

    // Has paid pro features (any of the pro add-ons purchased)
    if (isPaidPro) {
      return AppState.PAID_PRO;
    }

    // Has active trial (any trial not yet expired)
    if (isTrialActive) {
      return AppState.TRIAL_PRO;
    }

    // Default: setup complete, no pro features = base plan
    return AppState.READY_BASE;
  }, [authLoading, dataLoading, user, isAdmin, setupProgress.setupCompleted, isPaidPro, isTrialActive]);

  // Get capabilities for current state
  const capabilities = useMemo(() => getStateCapabilities(state), [state]);

  // Feature access check
  const hasAccess = useCallback((feature: FeatureKey): boolean => {
    return hasFeatureAccess(state, feature);
  }, [state]);

  // Persist a setup step immediately (for visible progress during onboarding)
  const persistSetupStep = useCallback(async (step: 'business_type' | 'business_sector', value: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          [step]: value,
          updated_at: new Date().toISOString(),
        } as { user_id: string; business_type?: string; business_sector?: string; updated_at: string }, 
        { onConflict: 'user_id' });

      if (error) {
        console.error('Error persisting setup step:', error);
        return false;
      }

      // Update local state immediately
      setSetupProgress(prev => ({
        ...prev,
        [step === 'business_type' ? 'businessType' : 'businessSector']: value,
      }));

      return true;
    } catch (err) {
      console.error('Error:', err);
      return false;
    }
  }, [user?.id]);

  // Generic state transition
  const transitionTo = useCallback(async (action: 'complete_setup' | 'start_trial' | 'subscribe' | 'trial_expired' | 'reset'): Promise<boolean> => {
    const nextState = getNextState(state, action);
    
    if (nextState === state) {
      // No transition needed
      return true;
    }

    // Handle the transition based on action
    switch (action) {
      case 'reset':
        // Use resetToInstall logic
        return await resetToInstallInternal();
      default:
        // Refresh state to pick up changes
        setRefreshTrigger(t => t + 1);
        return true;
    }
  }, [state]);

  // Internal reset function
  const resetToInstallInternal = async (): Promise<boolean> => {
    if (!user?.id) return false;
    
    // Only ADMIN_PREVIEW can reset
    if (state !== AppState.ADMIN_PREVIEW) {
      console.warn('Only admins can reset to install state');
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
          // Reset pro features
          scheduling_pro_enabled: false,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('Error resetting setup:', error);
        return false;
      }

      // Clear ALL local storage items related to features
      // Services & Menu
      localStorage.removeItem('nimble_services');
      localStorage.removeItem('nimble_services_preview');
      localStorage.removeItem('nimble_service_menu_settings');
      
      // Appointments
      localStorage.removeItem('nimble_appointments');
      localStorage.removeItem('nimble_active_appointment');
      
      // Projects (local cache)
      localStorage.removeItem('nimble_projects');
      
      // Feature flags and other settings
      localStorage.removeItem('nimble_feature_flags');

      // Update local state
      setSetupProgress({
        companyName: null,
        businessType: null,
        businessSector: null,
        setupCompleted: false,
      });

      console.log('[AppState] Reset to INSTALL - cleared all setup progress and feature data');

      return true;
    } catch (err) {
      console.error('Error:', err);
      return false;
    }
  };

  // Reset to install state (admin only)
  const resetToInstall = useCallback(async (): Promise<boolean> => {
    return await resetToInstallInternal();
  }, [user?.id, state]);

  // Refresh state from database
  const refreshState = useCallback(async (): Promise<void> => {
    setRefreshTrigger(t => t + 1);
  }, []);

  const loading = authLoading || dataLoading;

  return {
    state,
    loading,
    capabilities,
    setupProgress,
    isAdmin,
    isSetupComplete: setupProgress.setupCompleted,
    isTrialActive,
    isPaidPro,
    hasAccess,
    transitionTo,
    resetToInstall,
    refreshState,
    persistSetupStep,
  };
}
