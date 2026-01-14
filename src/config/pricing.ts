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

// Menu preset configurations for upsell (all 25 categories)
export const MENU_PRESETS_CONFIG = {
  handyman: { name: 'Handyman', price: 1.99, serviceCount: 50 },
  plumbing: { name: 'Plumbing', price: 1.99, serviceCount: 50 },
  salon: { name: 'Salon', price: 1.99, serviceCount: 50 },
  barber: { name: 'Barber', price: 1.99, serviceCount: 50 },
  cleaning: { name: 'Cleaning', price: 1.99, serviceCount: 50 },
  pet_grooming: { name: 'Pet Grooming', price: 1.99, serviceCount: 50 },
  lawn_care: { name: 'Lawn Care', price: 1.99, serviceCount: 50 },
  electrical: { name: 'Electrical', price: 1.99, serviceCount: 50 },
  hvac: { name: 'HVAC', price: 1.99, serviceCount: 50 },
  painting: { name: 'Painting', price: 1.99, serviceCount: 50 },
  tutoring: { name: 'Tutoring', price: 1.99, serviceCount: 50 },
  photography: { name: 'Photography', price: 1.99, serviceCount: 50 },
  fitness: { name: 'Fitness', price: 1.99, serviceCount: 50 },
  catering: { name: 'Catering', price: 1.99, serviceCount: 50 },
  car_wash: { name: 'Car Wash', price: 1.99, serviceCount: 50 },
  mobile_mechanic: { name: 'Mobile Mechanic', price: 1.99, serviceCount: 50 },
  it_support: { name: 'IT Support', price: 1.99, serviceCount: 50 },
  landscaping: { name: 'Landscaping', price: 1.99, serviceCount: 50 },
  moving: { name: 'Moving', price: 1.99, serviceCount: 50 },
  auto_repair: { name: 'Auto Repair', price: 1.99, serviceCount: 50 },
  hair_stylist: { name: 'Hair Stylist', price: 1.99, serviceCount: 50 },
  massage: { name: 'Massage', price: 1.99, serviceCount: 50 },
  bakery: { name: 'Bakery', price: 1.99, serviceCount: 50 },
  personal_training: { name: 'Personal Training', price: 1.99, serviceCount: 50 },
  event_planning: { name: 'Event Planning', price: 1.99, serviceCount: 50 },
} as const;

export type CloudStorageTier = 'standard' | 'premium' | null;
export type TrialableFeature = 'mileage' | 'financial_tool' | 'cloud_storage';
export type MenuPresetType = keyof typeof MENU_PRESETS_CONFIG;
