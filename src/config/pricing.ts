// Pricing configuration - all prices in USD
// Adjust these values to customize pricing for your app

export const PRICING = {
  // One-time purchases
  BASE_PRICE: 49.99,
  SERVICE_MENU_PRICE: 12.99,
  MILEAGE_PRICE: 24.99,
  FINANCIAL_TOOL_PRICE: 34.99,
  FULL_BUNDLE_PRICE: 99.99,

  // Pre-populated menu presets (one-time)
  MENU_PRESET_BARBER: 1.99,
  MENU_PRESET_SALON: 1.99,
  MENU_PRESET_SPA: 1.99,
  MENU_PRESET_DEFAULT: 1.99,

  // Subscriptions (monthly)
  SCANNER_PRICE: 5.99,
  CLOUD_STANDARD_PRICE: 2.99,
  CLOUD_PREMIUM_PRICE: 4.99,
  BUNDLE_SCANNER_CLOUD_PRICE: 7.99,
} as const;

// Storage limits in bytes
export const STORAGE_LIMITS = {
  FREE: 0,
  STANDARD: 2 * 1024 * 1024 * 1024, // 2 GB
  PREMIUM: 10 * 1024 * 1024 * 1024, // 10 GB
} as const;

// Trial durations in days
export const TRIAL_DURATIONS = {
  MILEAGE: 7,
  FINANCIAL_TOOL: 7,
  CLOUD_STORAGE: 14,
} as const;

// Feature display names
export const FEATURE_NAMES = {
  service_menu: 'Service Menu',
  mileage: 'Mileage Pro',
  financial_tool: 'Financial Tool',
  scanner: 'AI Scanner',
  cloud_standard: 'Cloud Storage (Standard)',
  cloud_premium: 'Cloud Storage (Premium)',
} as const;

// Menu preset configurations for upsell
export const MENU_PRESETS_CONFIG = {
  barber_shop: {
    name: 'Barber Shop',
    price: 1.99,
    serviceCount: 50,
  },
  salon: {
    name: 'Salon & Beauty',
    price: 1.99,
    serviceCount: 45,
  },
  spa: {
    name: 'Spa & Wellness',
    price: 1.99,
    serviceCount: 40,
  },
} as const;

export type CloudStorageTier = 'standard' | 'premium' | null;
export type TrialableFeature = 'mileage' | 'financial_tool' | 'cloud_storage';
export type MenuPresetType = keyof typeof MENU_PRESETS_CONFIG;
