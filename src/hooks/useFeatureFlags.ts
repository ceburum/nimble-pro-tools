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

  // Enable cloud backup
  const enableCloudBackup = useCallback(() => {
    return updateFlag('cloud_backup_enabled', true);
  }, [updateFlag]);

  // Disable cloud backup
  const disableCloudBackup = useCallback(() => {
    return updateFlag('cloud_backup_enabled', false);
  }, [updateFlag]);

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

  return {
    flags,
    loading,
    updateFlag,
    updateFlags,
    enableCloudBackup,
    disableCloudBackup,
    enableProFeature,
    disableProFeature,
    // Convenience getters
    isCloudBackupEnabled: flags.cloud_backup_enabled,
    isTaxProEnabled: flags.tax_pro_enabled,
    isSchedulingProEnabled: flags.scheduling_pro_enabled,
    isMileageProEnabled: flags.mileage_pro_enabled,
    isFinancialProEnabled: flags.financial_pro_enabled,
    hasMigrationCompleted: flags.migration_completed,
  };
}
