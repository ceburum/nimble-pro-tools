// Feature flags stored locally, control cloud sync and pro features

export interface FeatureFlags {
  // Core sync control
  cloud_backup_enabled: boolean;
  
  // Pro feature flags
  tax_pro_enabled: boolean;
  scheduling_pro_enabled: boolean;
  mileage_pro_enabled: boolean;
  financial_pro_enabled: boolean;
  
  // Migration flags
  migration_completed: boolean;
  migration_started_at: string | null;
  migration_completed_at: string | null;
}

const FEATURE_FLAGS_KEY = 'nimble_feature_flags';

// Default values - local-only mode by default
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  cloud_backup_enabled: false,
  tax_pro_enabled: false,
  scheduling_pro_enabled: false,
  mileage_pro_enabled: false,
  financial_pro_enabled: false,
  migration_completed: false,
  migration_started_at: null,
  migration_completed_at: null,
};

export function getFeatureFlags(): FeatureFlags {
  try {
    const stored = localStorage.getItem(FEATURE_FLAGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to handle new flags added in updates
      return { ...DEFAULT_FEATURE_FLAGS, ...parsed };
    }
  } catch (error) {
    console.error('Error reading feature flags:', error);
  }
  return { ...DEFAULT_FEATURE_FLAGS };
}

export function setFeatureFlags(flags: Partial<FeatureFlags>): FeatureFlags {
  try {
    const current = getFeatureFlags();
    const updated = { ...current, ...flags };
    localStorage.setItem(FEATURE_FLAGS_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Error saving feature flags:', error);
    return getFeatureFlags();
  }
}

export function setFeatureFlag<K extends keyof FeatureFlags>(
  key: K,
  value: FeatureFlags[K]
): FeatureFlags {
  return setFeatureFlags({ [key]: value });
}

export function isCloudSyncEnabled(): boolean {
  return getFeatureFlags().cloud_backup_enabled;
}

export function isProFeatureEnabled(feature: 'tax' | 'scheduling' | 'mileage' | 'financial'): boolean {
  const flags = getFeatureFlags();
  switch (feature) {
    case 'tax':
      return flags.tax_pro_enabled;
    case 'scheduling':
      return flags.scheduling_pro_enabled;
    case 'mileage':
      return flags.mileage_pro_enabled;
    case 'financial':
      return flags.financial_pro_enabled;
    default:
      return false;
  }
}

export function enableCloudBackup(): FeatureFlags {
  return setFeatureFlag('cloud_backup_enabled', true);
}

export function disableCloudBackup(): FeatureFlags {
  return setFeatureFlag('cloud_backup_enabled', false);
}

export function markMigrationStarted(): FeatureFlags {
  return setFeatureFlags({
    migration_started_at: new Date().toISOString(),
    migration_completed: false,
  });
}

export function markMigrationCompleted(): FeatureFlags {
  return setFeatureFlags({
    migration_completed: true,
    migration_completed_at: new Date().toISOString(),
  });
}

export function hasMigrationCompleted(): boolean {
  return getFeatureFlags().migration_completed;
}
