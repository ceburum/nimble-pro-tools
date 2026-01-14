import { useState, useEffect, useCallback } from 'react';
import { 
  FeatureFlags, 
  getFeatureFlags, 
  setFeatureFlags,
  setFeatureFlag,
  DEFAULT_FEATURE_FLAGS,
} from '@/lib/featureFlags';

export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FEATURE_FLAGS);
  const [loading, setLoading] = useState(true);

  // Load flags on mount
  useEffect(() => {
    const storedFlags = getFeatureFlags();
    setFlags(storedFlags);
    setLoading(false);
  }, []);

  // Update a single flag
  const updateFlag = useCallback(<K extends keyof FeatureFlags>(
    key: K,
    value: FeatureFlags[K]
  ) => {
    const updated = setFeatureFlag(key, value);
    setFlags(updated);
    return updated;
  }, []);

  // Update multiple flags at once
  const updateFlags = useCallback((updates: Partial<FeatureFlags>) => {
    const updated = setFeatureFlags(updates);
    setFlags(updated);
    return updated;
  }, []);

  // Enable a pro feature
  const enableProFeature = useCallback((feature: 'tax' | 'scheduling' | 'mileage' | 'financial') => {
    const key = `${feature}_pro_enabled` as keyof FeatureFlags;
    return updateFlag(key, true);
  }, [updateFlag]);

  // Disable a pro feature  
  const disableProFeature = useCallback((feature: 'tax' | 'scheduling' | 'mileage' | 'financial') => {
    const key = `${feature}_pro_enabled` as keyof FeatureFlags;
    return updateFlag(key, false);
  }, [updateFlag]);

  // Toggle dev mode
  const toggleDevMode = useCallback(() => {
    return updateFlag('dev_mode_enabled', !flags.dev_mode_enabled);
  }, [updateFlag, flags.dev_mode_enabled]);

  return {
    flags,
    loading,
    updateFlag,
    updateFlags,
    enableProFeature,
    disableProFeature,
    toggleDevMode,
    // Convenience getters - Tax and Financial Pro both resolve to Financial Tool
    isTaxProEnabled: flags.financial_tool_enabled,
    isSchedulingProEnabled: flags.scheduling_pro_enabled,
    isMileageProEnabled: flags.mileage_pro_enabled,
    isFinancialProEnabled: flags.financial_tool_enabled,
    isFinancialToolEnabled: flags.financial_tool_enabled,
    isServiceMenuEnabled: flags.service_menu_enabled,
    isDevModeEnabled: flags.dev_mode_enabled,
    hasMigrationCompleted: flags.migration_completed,
    isSetupCompleted: flags.setup_completed,
    businessType: flags.business_type,
    businessSector: flags.business_sector,
    cloudStorageTier: flags.cloud_storage_tier,
    isScannerActive: flags.scanner_subscription_active,
  };
}
