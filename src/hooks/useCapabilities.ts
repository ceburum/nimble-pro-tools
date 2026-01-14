import { useCallback } from 'react';
import { useAppState } from './useAppState';
import { FeatureKey as AppFeatureKey } from '@/lib/appState';

/**
 * Legacy feature keys for backward compatibility
 */
export type FeatureKey = 
  | 'scheduling_pro'
  | 'financial_tool'
  | 'mileage_pro'
  | 'service_menu'
  | 'ai_scanning';

/**
 * Map legacy feature keys to new AppState feature keys
 */
const featureKeyMap: Record<FeatureKey, AppFeatureKey> = {
  'scheduling_pro': 'scheduling',
  'financial_tool': 'financial',
  'mileage_pro': 'mileage',
  'service_menu': 'serviceMenu',
  'ai_scanning': 'aiScanning',
};

interface UseCapabilitiesReturn {
  // Admin check (from AppState, determined by user_roles table)
  isAdmin: boolean;
  adminLoading: boolean;
  
  // Feature capability checks
  hasCapability: (feature: FeatureKey) => boolean;
  isLoading: (feature: FeatureKey) => boolean;
  
  // Enable features (placeholder - actual implementation depends on billing)
  enableFeature: (feature: FeatureKey) => Promise<boolean>;
  
  // Dev mode check (admin = dev mode in ADMIN_PREVIEW state)
  isDevMode: boolean;
  
  // Upgrade prompts visibility
  showUpgradePrompts: boolean;
}

/**
 * useCapabilities - Feature access hook using centralized AppState
 * 
 * This hook provides backward-compatible feature checking while
 * using the centralized AppState as the single source of truth.
 * 
 * Feature gating is now LOGICAL (disabled UI + explanation),
 * NOT redirect-based.
 */
export function useCapabilities(): UseCapabilitiesReturn {
  const { 
    state, 
    loading, 
    isAdmin, 
    hasAccess, 
    capabilities 
  } = useAppState();

  // Check if user has capability for a feature
  const hasCapability = useCallback((feature: FeatureKey): boolean => {
    const mappedKey = featureKeyMap[feature];
    return hasAccess(mappedKey);
  }, [hasAccess]);

  // Check if a feature is still loading
  const isLoading = useCallback((_feature: FeatureKey): boolean => {
    return loading;
  }, [loading]);

  // Enable a feature - placeholder that returns false
  // Actual billing/purchase flow is handled elsewhere
  // This should NEVER auto-redirect to billing
  const enableFeature = useCallback(async (_feature: FeatureKey): Promise<boolean> => {
    // In the state-driven architecture, enabling features
    // is handled through explicit user action (upgrade page)
    // not through automatic prompts
    console.warn('enableFeature called - use explicit upgrade flow instead');
    return false;
  }, []);

  return {
    isAdmin,
    adminLoading: loading,
    hasCapability,
    isLoading,
    enableFeature,
    isDevMode: isAdmin, // Admin = dev mode in ADMIN_PREVIEW
    showUpgradePrompts: capabilities.showUpgradePrompts,
  };
}
