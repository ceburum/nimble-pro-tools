// Feature flags stored locally, control pro features and dev mode
import { BusinessSector, BusinessType } from '@/config/sectorPresets';
import { CloudStorageTier } from '@/config/pricing';

export interface FeatureFlags {
  // Pro feature flags (local state, synced with user_settings)
  tax_pro_enabled: boolean;
  scheduling_pro_enabled: boolean;
  mileage_pro_enabled: boolean;
  financial_pro_enabled: boolean;
  financial_tool_enabled: boolean;  // Merged Financial + Tax
  
  // Add-on feature flags
  service_menu_enabled: boolean;
  
  // Subscription flags
  scanner_subscription_active: boolean;
  cloud_storage_tier: CloudStorageTier;
  
  // Developer mode (admin only - unlocks all features for testing)
  dev_mode_enabled: boolean;
  
  // Setup flags
  setup_completed: boolean;
  business_type: BusinessType | null;
  business_sector: BusinessSector | null;
  
  // Migration flags
  migration_completed: boolean;
  migration_started_at: string | null;
  migration_completed_at: string | null;
}

const FEATURE_FLAGS_KEY = 'nimble_feature_flags';

// Default values
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  tax_pro_enabled: false,
  scheduling_pro_enabled: false,
  mileage_pro_enabled: false,
  financial_pro_enabled: false,
  financial_tool_enabled: false,
  service_menu_enabled: false,
  scanner_subscription_active: false,
  cloud_storage_tier: null,
  dev_mode_enabled: false,
  setup_completed: false,
  business_type: null,
  business_sector: null,
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

export function isDevModeEnabled(): boolean {
  return getFeatureFlags().dev_mode_enabled;
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
