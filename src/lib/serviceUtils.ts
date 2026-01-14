// Utility functions for loading services based on business sector

import { BusinessSector, SECTOR_PRESETS, PreloadedService } from '@/config/sectorPresets';
import { SERVICE_PRESETS, PresetService } from '@/config/servicePresets';

// Map sectors to their richer service preset (if available)
export const SECTOR_TO_PRESET_MAP: Record<BusinessSector, string | null> = {
  'salon_beauty': 'barber_shop',           // Full 50-item barber list
  'contractor_trades': 'contractor_general', // Contractor services list
  'mobile_services': 'mobile_service',      // Mobile service business list
  'appointment_services': null,             // Uses sectorPresets.preloadedServices
  'retail_sales': null,                     // Uses sectorPresets.preloadedServices
  'blank_minimal': null,                    // No services
};

export interface PreviewService {
  id: string;
  name: string;
  price: number;
  duration?: number;
  description?: string;
}

// Generate a simple unique ID for preview services
function generatePreviewId(): string {
  return `preview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get services for a given business sector.
 * Checks for a richer preset first, then falls back to sector's preloaded services.
 */
export function getServicesForSector(sector: BusinessSector): PreviewService[] {
  // Check if there's a full preset (like barber_shop for salon_beauty)
  const presetId = SECTOR_TO_PRESET_MAP[sector];
  
  if (presetId && SERVICE_PRESETS[presetId]) {
    const preset = SERVICE_PRESETS[presetId];
    return preset.services.map((s: PresetService) => ({
      id: generatePreviewId(),
      name: s.name,
      price: s.price,
      duration: s.duration,
    }));
  }
  
  // Fall back to sector's preloaded services
  const sectorPreset = SECTOR_PRESETS[sector];
  if (sectorPreset?.preloadedServices?.length > 0) {
    return sectorPreset.preloadedServices.map((s: PreloadedService) => ({
      id: generatePreviewId(),
      name: s.name,
      price: s.price,
      duration: s.duration,
      description: s.description,
    }));
  }
  
  return [];
}

/**
 * Get the theme color for a sector's service preset
 */
export function getThemeForSector(sector: BusinessSector): string | null {
  const presetId = SECTOR_TO_PRESET_MAP[sector];
  
  if (presetId && SERVICE_PRESETS[presetId]) {
    return SERVICE_PRESETS[presetId].themeColor;
  }
  
  return null;
}

/**
 * Check if a business type should have service menu enabled by default
 */
export function shouldEnableServiceMenu(businessType: string): boolean {
  return businessType === 'stationary_appointment';
}

/**
 * Check if a business type should have appointment calendar enabled
 */
export function shouldEnableAppointments(businessType: string): boolean {
  // Both mobile and stationary get appointments
  return businessType === 'stationary_appointment' || businessType === 'mobile_job';
}

/**
 * Check if a business sector is project-focused (contractors, generic)
 */
export function isProjectFocusedSector(sector: string): boolean {
  return sector === 'contractor_trades' || sector === 'blank_minimal';
}
