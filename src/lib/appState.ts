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
  
  // Navigation permissions
  canAccessSetup: boolean;
  canAccessApp: boolean;
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
    
    // Navigation
    canAccessSetup: false,
    canAccessApp: false,
  };

  switch (state) {
    case AppState.INSTALL:
      // Only setup access, no app access
      return {
        ...baseCapabilities,
        canAccessSetup: true,
        canAccessApp: false,
      };

    case AppState.SETUP_INCOMPLETE:
      // Only setup access, no app access
      return {
        ...baseCapabilities,
        canAccessSetup: true,
        canAccessApp: false,
      };

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
        // Can access full app, not setup
        canAccessSetup: false,
        canAccessApp: true,
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
        // Can access full app, not setup
        canAccessSetup: false,
        canAccessApp: true,
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
        // Can access full app, not setup
        canAccessSetup: false,
        canAccessApp: true,
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
        // Admin can access both setup AND app
        canAccessSetup: true,
        canAccessApp: true,
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

/**
 * Check if the state allows accessing the main app
 */
export function canAccessMainApp(state: AppState): boolean {
  return getStateCapabilities(state).canAccessApp;
}

/**
 * Check if the state allows accessing setup screens
 */
export function canAccessSetupScreens(state: AppState): boolean {
  return getStateCapabilities(state).canAccessSetup;
}

/**
 * Determine the next state after a user action
 */
export function getNextState(currentState: AppState, action: 'complete_setup' | 'start_trial' | 'subscribe' | 'trial_expired' | 'reset'): AppState {
  switch (action) {
    case 'complete_setup':
      if (currentState === AppState.SETUP_INCOMPLETE || currentState === AppState.INSTALL) {
        return AppState.READY_BASE;
      }
      return currentState;
      
    case 'start_trial':
      if (currentState === AppState.READY_BASE) {
        return AppState.TRIAL_PRO;
      }
      return currentState;
      
    case 'subscribe':
      if (currentState === AppState.READY_BASE || currentState === AppState.TRIAL_PRO) {
        return AppState.PAID_PRO;
      }
      return currentState;
      
    case 'trial_expired':
      if (currentState === AppState.TRIAL_PRO) {
        return AppState.READY_BASE;
      }
      return currentState;
      
    case 'reset':
      // Only admins can reset
      if (currentState === AppState.ADMIN_PREVIEW) {
        return AppState.INSTALL;
      }
      return currentState;
      
    default:
      return currentState;
  }
}
