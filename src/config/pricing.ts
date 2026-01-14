// Pricing configuration - all prices in USD
// Adjust these values to customize pricing for your app

export const PRICING = {
  // One-time purchases
  BASE_PRICE: 49.99,
  SERVICE_MENU_PRICE: 12.99,
  MILEAGE_PRICE: 24.99,
  FINANCIAL_TOOL_PRICE: 34.99,
  FULL_BUNDLE_PRICE: 99.99,

  // Menu options (one-time)
  BLANK_MENU_PRICE: 3.00,
  PREPOPULATED_MENU_PRICE: 2.00,

  // Legacy preset prices (keeping for backwards compatibility)
  MENU_PRESET_BARBER: 2.00,
  MENU_PRESET_SALON: 2.00,
  MENU_PRESET_SPA: 2.00,
  MENU_PRESET_DEFAULT: 2.00,

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

// Menu preset configurations for upsell (all 25 categories)
// hasPreset indicates if the pre-populated list is available
export const MENU_PRESETS_CONFIG = {
  handyman: { name: 'Handyman', price: 2.00, serviceCount: 50, hasPreset: true },
  plumbing: { name: 'Plumbing', price: 2.00, serviceCount: 50, hasPreset: true },
  salon: { name: 'Salon', price: 2.00, serviceCount: 50, hasPreset: true },
  barber: { name: 'Barber', price: 2.00, serviceCount: 50, hasPreset: true },
  cleaning: { name: 'Cleaning', price: 2.00, serviceCount: 50, hasPreset: true },
  pet_grooming: { name: 'Pet Grooming', price: 2.00, serviceCount: 50, hasPreset: true },
  lawn_care: { name: 'Lawn Care', price: 2.00, serviceCount: 50, hasPreset: true },
  electrical: { name: 'Electrical', price: 2.00, serviceCount: 50, hasPreset: true },
  hvac: { name: 'HVAC', price: 2.00, serviceCount: 50, hasPreset: true },
  painting: { name: 'Painting', price: 2.00, serviceCount: 50, hasPreset: true },
  tutoring: { name: 'Tutoring', price: 2.00, serviceCount: 50, hasPreset: true },
  photography: { name: 'Photography', price: 2.00, serviceCount: 50, hasPreset: true },
  fitness: { name: 'Fitness', price: 2.00, serviceCount: 50, hasPreset: true },
  catering: { name: 'Catering', price: 2.00, serviceCount: 50, hasPreset: true },
  car_wash: { name: 'Car Wash', price: 2.00, serviceCount: 50, hasPreset: true },
  mobile_mechanic: { name: 'Mobile Mechanic', price: 2.00, serviceCount: 50, hasPreset: true },
  it_support: { name: 'IT Support', price: 2.00, serviceCount: 50, hasPreset: true },
  landscaping: { name: 'Landscaping', price: 2.00, serviceCount: 50, hasPreset: true },
  moving: { name: 'Moving', price: 2.00, serviceCount: 50, hasPreset: true },
  auto_repair: { name: 'Auto Repair', price: 2.00, serviceCount: 50, hasPreset: true },
  hair_stylist: { name: 'Hair Stylist', price: 2.00, serviceCount: 50, hasPreset: true },
  massage: { name: 'Massage', price: 2.00, serviceCount: 50, hasPreset: true },
  bakery: { name: 'Bakery', price: 2.00, serviceCount: 50, hasPreset: true },
  personal_training: { name: 'Personal Training', price: 2.00, serviceCount: 50, hasPreset: true },
  event_planning: { name: 'Event Planning', price: 2.00, serviceCount: 50, hasPreset: true },
} as const;

export type CloudStorageTier = 'standard' | 'premium' | null;
export type TrialableFeature = 'mileage' | 'financial_tool' | 'cloud_storage';
export type MenuPresetType = keyof typeof MENU_PRESETS_CONFIG;
