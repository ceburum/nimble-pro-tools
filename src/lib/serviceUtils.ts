// Utility functions for loading services based on business sector

import { BusinessSector, SECTOR_PRESETS, PreloadedService } from '@/config/sectorPresets';
import { SERVICE_LIBRARY, getServiceCategoryById } from '@/config/serviceLibrary';

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
 * Get the preset ID for a given business sector.
 * Now maps directly since sectors match library IDs.
 */
export function getPresetIdForSector(sector: BusinessSector): string | null {
  if (sector === 'other') return null;
  return sector;
}

/**
 * Get services for a given business sector from the service library.
 */
export function getServicesForSector(sector: BusinessSector): PreviewService[] {
  if (sector === 'other') return [];
  
  const category = getServiceCategoryById(sector);
  if (category) {
    return category.services.map(s => ({
      id: generatePreviewId(),
      name: s.name,
      price: s.price,
      duration: s.duration,
    }));
  }
  
  // Fallback to sector preloaded services
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
  if (sector === 'other') return null;
  const category = getServiceCategoryById(sector);
  return category?.themeColor || null;
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
  return businessType === 'stationary_appointment' || businessType === 'mobile_job';
}

/**
 * Check if a business sector is project-focused (contractors, mobile)
 */
export function isProjectFocusedSector(sector: string): boolean {
  const mobileCategories = SERVICE_LIBRARY.filter(c => c.businessType === 'mobile').map(c => c.id);
  return mobileCategories.includes(sector) || sector === 'other';
}

/**
 * Validate that a preset ID matches the expected sector.
 */
export function isValidPresetForSector(presetId: string, sector: BusinessSector): boolean {
  if (sector === 'other') return !presetId;
  return presetId === sector;
}

// Re-export for backwards compatibility
export { SECTOR_PRESETS } from '@/config/sectorPresets';
