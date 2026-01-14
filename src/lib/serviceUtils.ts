// Utility functions for loading services based on business sector

import { BusinessSector, SECTOR_PRESETS, PreloadedService } from '@/config/sectorPresets';
import { SERVICE_PRESETS, PresetService } from '@/config/servicePresets';

// Map sectors to their richer service preset (if available)
export const SECTOR_TO_PRESET_MAP: Record<BusinessSector, string | null> = {
  'salon_beauty': 'barber_shop',      // Full 50-item barber list
  'contractor_trades': null,          // Uses sectorPresets.preloadedServices
  'mobile_services': null,            // Uses sectorPresets.preloadedServices
  'appointment_services': null,       // Uses sectorPresets.preloadedServices
  'retail_sales': null,               // Uses sectorPresets.preloadedServices
  'blank_minimal': null,              // No services
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
