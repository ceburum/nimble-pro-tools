// Business sector presets mapped to service library categories

import { SERVICE_LIBRARY, ServiceCategory } from './serviceLibrary';

export type BusinessSector =
  | 'handyman' | 'plumbing' | 'salon' | 'barber' | 'cleaning'
  | 'pet_grooming' | 'lawn_care' | 'electrical' | 'hvac' | 'painting'
  | 'tutoring' | 'photography' | 'fitness' | 'catering' | 'car_wash'
  | 'mobile_mechanic' | 'it_support' | 'landscaping' | 'moving' | 'auto_repair'
  | 'hair_stylist' | 'massage' | 'bakery' | 'personal_training' | 'event_planning'
  | 'other';

export type BusinessType = 'mobile_job' | 'stationary_appointment';

export interface PreloadedService {
  name: string;
  description?: string;
  price: number;
  duration?: number;
}

export interface SectorPreset {
  name: string;
  description: string;
  suggestedAddons: ('service_menu' | 'mileage' | 'financial_tool' | 'scanner' | 'cloud')[];
  defaultBusinessType: BusinessType;
  preloadedServices: PreloadedService[];
  icon: string;
  serviceCount: number;
}

// Build presets from the service library
function buildPresetFromLibrary(category: ServiceCategory): SectorPreset {
  const isMobile = category.businessType === 'mobile';
  return {
    name: category.name,
    description: category.description,
    suggestedAddons: isMobile 
      ? ['mileage', 'financial_tool'] 
      : ['service_menu', 'financial_tool'],
    defaultBusinessType: isMobile ? 'mobile_job' : 'stationary_appointment',
    icon: category.icon,
    serviceCount: category.services.length,
    preloadedServices: category.services.slice(0, 5).map(s => ({
      name: s.name,
      price: s.price,
      duration: s.duration,
    })),
  };
}

// Generate SECTOR_PRESETS from SERVICE_LIBRARY
export const SECTOR_PRESETS: Record<BusinessSector, SectorPreset> = {
  ...Object.fromEntries(
    SERVICE_LIBRARY.map(cat => [cat.id, buildPresetFromLibrary(cat)])
  ) as Record<Exclude<BusinessSector, 'other'>, SectorPreset>,
  other: {
    name: 'Other / Blank',
    description: 'Start fresh with a blank service menu',
    suggestedAddons: [],
    defaultBusinessType: 'mobile_job',
    icon: 'FileText',
    serviceCount: 0,
    preloadedServices: [],
  },
};

export const SECTOR_OPTIONS = Object.entries(SECTOR_PRESETS).map(([key, preset]) => ({
  value: key as BusinessSector,
  label: preset.name,
  description: preset.description,
  icon: preset.icon,
  serviceCount: preset.serviceCount,
  businessType: preset.defaultBusinessType,
  hasPreset: preset.serviceCount > 0, // Determines if pre-populated list is available
}));

// Group sectors by business type for UI filtering
export const MOBILE_SECTORS = SECTOR_OPTIONS.filter(s => s.businessType === 'mobile_job');
export const STATIONARY_SECTORS = SECTOR_OPTIONS.filter(s => s.businessType === 'stationary_appointment');

// Get sectors available for a specific business type
export function getSectorsForBusinessType(businessType: BusinessType): typeof SECTOR_OPTIONS {
  if (businessType === 'mobile_job') {
    return MOBILE_SECTORS;
  }
  return STATIONARY_SECTORS;
}
