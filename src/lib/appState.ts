/**
 * AppState - Single authoritative application state
 * 
 * This enum defines ALL possible states of the application.
 * Navigation and feature access MUST depend ONLY on this state.
 * Billing screens are NEVER triggered automatically by feature access.
 */

export enum AppState {
  /** First launch - app just installed, no user session */
  INSTALL = 'INSTALL',
  
  /** User authenticated but setup wizard not completed */
  SETUP_INCOMPLETE = 'SETUP_INCOMPLETE',
  
  /** Base plan - setup complete, no pro features, no cloud usage */
  READY_BASE = 'READY_BASE',
  
  /** Trial period active - GPS and cloud features enabled temporarily */
  TRIAL_PRO = 'TRIAL_PRO',
  
  /** Paid pro user - full feature access */
  PAID_PRO = 'PAID_PRO',
  
  /** Admin preview mode - bypasses all paywalls, billing disabled */
  ADMIN_PREVIEW = 'ADMIN_PREVIEW',
}

/**
 * Feature capabilities available in each state
 */
export interface StateCapabilities {
  // Core features (always available after setup)
  clients: boolean;
  projects: boolean;
  invoices: boolean;
  notepad: boolean;
  
  // Pro features (state-dependent)
  scheduling: boolean;
  financial: boolean;
  mileage: boolean;
  serviceMenu: boolean;
  
  // Cloud features (state-dependent)
  cloudStorage: boolean;
  gpsTracking: boolean;
  aiScanning: boolean;
  
  // Admin features
  canResetSetup: boolean;
  showUpgradePrompts: boolean;
}

/**
 * Get capabilities for a given app state
 */
export function getStateCapabilities(state: AppState): StateCapabilities {
  const baseCapabilities: StateCapabilities = {
    // Core - always available after setup
    clients: false,
    projects: false,
    invoices: false,
    notepad: false,
    
    // Pro - disabled by default
    scheduling: false,
    financial: false,
    mileage: false,
    serviceMenu: false,
    
    // Cloud - disabled by default
    cloudStorage: false,
    gpsTracking: false,
    aiScanning: false,
    
    // Admin
    canResetSetup: false,
    showUpgradePrompts: false,
  };

  switch (state) {
    case AppState.INSTALL:
      // No features during install
      return baseCapabilities;

    case AppState.SETUP_INCOMPLETE:
      // Still no features during setup
      return baseCapabilities;

    case AppState.READY_BASE:
      return {
        ...baseCapabilities,
        // Core features enabled
        clients: true,
        projects: true,
        invoices: true,
        notepad: true,
        // Show upgrade prompts for pro features
        showUpgradePrompts: true,
      };

    case AppState.TRIAL_PRO:
      return {
        // All core features
        clients: true,
        projects: true,
        invoices: true,
        notepad: true,
        // Pro features during trial
        scheduling: true,
        financial: true,
        mileage: true,
        serviceMenu: true,
        // Cloud features during trial
        cloudStorage: true,
        gpsTracking: true,
        aiScanning: true,
        // No upgrade prompts during trial
        canResetSetup: false,
        showUpgradePrompts: false,
      };

    case AppState.PAID_PRO:
      return {
        // All features enabled
        clients: true,
        projects: true,
        invoices: true,
        notepad: true,
        scheduling: true,
        financial: true,
        mileage: true,
        serviceMenu: true,
        cloudStorage: true,
        gpsTracking: true,
        aiScanning: true,
        // Admin
        canResetSetup: false,
        showUpgradePrompts: false,
      };

    case AppState.ADMIN_PREVIEW:
      return {
        // All features enabled
        clients: true,
        projects: true,
        invoices: true,
        notepad: true,
        scheduling: true,
        financial: true,
        mileage: true,
        serviceMenu: true,
        cloudStorage: true,
        gpsTracking: true,
        aiScanning: true,
        // Admin can reset, never sees upgrade prompts
        canResetSetup: true,
        showUpgradePrompts: false,
      };

    default:
      return baseCapabilities;
  }
}

/**
 * Feature keys for capability checking
 */
export type FeatureKey = 
  | 'clients'
  | 'projects'
  | 'invoices'
  | 'notepad'
  | 'scheduling'
  | 'financial'
  | 'mileage'
  | 'serviceMenu'
  | 'cloudStorage'
  | 'gpsTracking'
  | 'aiScanning';

/**
 * Check if a specific feature is available in a state
 */
export function hasFeatureAccess(state: AppState, feature: FeatureKey): boolean {
  const capabilities = getStateCapabilities(state);
  return capabilities[feature] ?? false;
}

/**
 * Determine if the state allows showing upgrade prompts
 */
export function shouldShowUpgradePrompts(state: AppState): boolean {
  return getStateCapabilities(state).showUpgradePrompts;
}

/**
 * Determine if the state allows admin reset
 */
export function canPerformAdminReset(state: AppState): boolean {
  return getStateCapabilities(state).canResetSetup;
}
