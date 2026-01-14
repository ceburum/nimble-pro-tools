import { useState, useEffect, useCallback } from 'react';
import { Service, ServiceMenuSettings } from '@/types/services';
import { generateLocalId } from '@/lib/localDb';
import { useAppState } from './useAppState';
import { useSetup } from './useSetup';
import { SERVICE_PRESETS } from '@/config/servicePresets';
import { getPresetIdForSector, isValidPresetForSector } from '@/lib/serviceUtils';
import { BusinessSector } from '@/config/sectorPresets';

// Storage keys
const SERVICES_STORAGE_KEY = 'nimble_services';
const PREVIEW_SERVICES_KEY = 'nimble_services_preview';
const MENU_SETTINGS_KEY = 'nimble_service_menu_settings';

function getStoredServices(key: string = SERVICES_STORAGE_KEY): Service[] {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((s: any) => ({
        ...s,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
      }));
    }
  } catch (error) {
    console.error('Error reading services:', error);
  }
  return [];
}

function saveStoredServices(services: Service[], key: string = SERVICES_STORAGE_KEY): void {
  try {
    localStorage.setItem(key, JSON.stringify(services));
  } catch (error) {
    console.error('Error saving services:', error);
  }
}

function getMenuSettings(): ServiceMenuSettings {
  try {
    const stored = localStorage.getItem(MENU_SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading menu settings:', error);
  }
  // Default: menu is unlocked and editable (blank menu is free for all)
  return { globalBgColor: '', isUnlocked: true };
}

function saveMenuSettings(settings: ServiceMenuSettings): void {
  try {
    localStorage.setItem(MENU_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving menu settings:', error);
  }
}

/**
 * useServices - Service menu hook using centralized AppState
 * 
 * SERVICE MENU BEHAVIOR:
 * - All users get a FREE blank editable service menu by default
 * - Pre-populated menus are UPGRADES that copy services into the user's menu
 * - Services attach to: Quotes/Invoices (mobile), Appointments/Invoices (stationary)
 * - The menu is always editable - users own their service list
 * 
 * FALLBACK:
 * - If no services exist, show empty menu with "Add Service" prompt
 * - Never prompt for initialization if menu is already unlocked
 * 
 * Access is determined by AppState for the serviceMenu feature.
 */
export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [previewServices, setPreviewServices] = useState<Service[]>([]);
  const [menuSettings, setMenuSettings] = useState<ServiceMenuSettings>(getMenuSettings);
  const [loading, setLoading] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  const { hasAccess, loading: stateLoading } = useAppState();
  const { businessSector, loading: setupLoading } = useSetup();
  
  // Access determined by AppState
  const isEnabled = hasAccess('serviceMenu');
  
  // Get the valid preset ID for the current business sector
  const validPresetId = businessSector ? getPresetIdForSector(businessSector as BusinessSector) : null;

  // Load services on mount
  useEffect(() => {
    if (isEnabled && !setupLoading) {
      const storedServices = getStoredServices();
      const storedPreview = getStoredServices(PREVIEW_SERVICES_KEY);
      const settings = getMenuSettings();
      
      // Validate that stored preset matches current sector
      // If mismatch (e.g., sector changed), clear the preset services
      if (settings.presetId && businessSector) {
        const isValidPreset = isValidPresetForSector(settings.presetId, businessSector as BusinessSector);
        if (!isValidPreset) {
          console.log('[useServices] Preset mismatch for sector, clearing invalid preset');
          // Clear invalid preset data - user should see blank menu
          localStorage.removeItem(PREVIEW_SERVICES_KEY);
          const cleanSettings = { ...settings, presetId: undefined };
          saveMenuSettings(cleanSettings);
          setMenuSettings(cleanSettings);
          setPreviewServices([]);
          setIsPreviewMode(false);
        } else {
          setPreviewServices(storedPreview.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
          setMenuSettings(settings);
          setIsPreviewMode(storedPreview.length > 0 && !settings.isUnlocked);
        }
      } else {
        setPreviewServices(storedPreview.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
        setMenuSettings(settings);
        setIsPreviewMode(storedPreview.length > 0 && !settings.isUnlocked);
      }
      
      setServices(storedServices.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
    }
    if (!setupLoading) {
      setLoading(false);
    }
  }, [isEnabled, setupLoading, businessSector]);

  // Get the active services list (preview or permanent)
  const activeServices = isPreviewMode ? previewServices : services;

  /**
   * Load a preset into preview mode.
   * Validates that the preset matches the current business sector.
   */
  const loadPreset = useCallback((presetId: string) => {
    // Validate preset matches current sector
    if (businessSector && !isValidPresetForSector(presetId, businessSector as BusinessSector)) {
      console.warn('[useServices] Attempted to load invalid preset for sector:', presetId, businessSector);
      return false;
    }
    
    const preset = SERVICE_PRESETS[presetId];
    if (!preset) return false;

    const now = new Date();
    const presetServices: Service[] = preset.services.map((s, index) => ({
      id: generateLocalId(),
      name: s.name,
      price: s.price,
      duration: s.duration,
      sortOrder: index,
      createdAt: now,
      updatedAt: now,
    }));

    // Save to preview storage
    saveStoredServices(presetServices, PREVIEW_SERVICES_KEY);
    setPreviewServices(presetServices);
    
    // Update settings with preset info and sector reference
    const newSettings: ServiceMenuSettings = {
      globalBgColor: preset.themeColor,
      presetId: presetId,
      isUnlocked: false,
      businessSector: businessSector || undefined,
    };
    saveMenuSettings(newSettings);
    setMenuSettings(newSettings);
    
    setIsPreviewMode(true);
    return true;
  }, [businessSector]);

  // Start with a blank menu (no preset)
  const startBlank = useCallback(() => {
    // Clear any preview data
    localStorage.removeItem(PREVIEW_SERVICES_KEY);
    setPreviewServices([]);
    
    // Mark as unlocked with blank settings, including sector reference
    const newSettings: ServiceMenuSettings = {
      globalBgColor: '',
      isUnlocked: true,
      businessSector: businessSector || undefined,
    };
    saveMenuSettings(newSettings);
    setMenuSettings(newSettings);
    
    setIsPreviewMode(false);
  }, [businessSector]);

  // Commit preview to permanent storage (after unlock/purchase)
  const commitPreview = useCallback(() => {
    if (previewServices.length === 0) return false;
    
    // Move preview services to permanent storage
    saveStoredServices(previewServices, SERVICES_STORAGE_KEY);
    setServices(previewServices);
    
    // Clear preview storage
    localStorage.removeItem(PREVIEW_SERVICES_KEY);
    setPreviewServices([]);
    
    // Mark as unlocked
    const newSettings = { ...menuSettings, isUnlocked: true };
    saveMenuSettings(newSettings);
    setMenuSettings(newSettings);
    
    setIsPreviewMode(false);
    return true;
  }, [previewServices, menuSettings]);

  // Discard preview and return to init state
  const discardPreview = useCallback(() => {
    localStorage.removeItem(PREVIEW_SERVICES_KEY);
    localStorage.removeItem(MENU_SETTINGS_KEY);
    setPreviewServices([]);
    setMenuSettings({ globalBgColor: '', isUnlocked: false });
    setIsPreviewMode(false);
  }, []);

  // Add a new service
  const addService = useCallback((data: { 
    name: string; 
    price: number; 
    duration?: number;
    thumbnailUrl?: string;
    bgColor?: string;
  }): Service | null => {
    if (!isEnabled) return null;

    const now = new Date();
    const targetServices = isPreviewMode ? previewServices : services;
    const maxOrder = targetServices.reduce((max, s) => Math.max(max, s.sortOrder ?? 0), -1);
    
    const newService: Service = {
      id: generateLocalId(),
      name: data.name.trim(),
      price: data.price,
      duration: data.duration,
      thumbnailUrl: data.thumbnailUrl,
      bgColor: data.bgColor,
      sortOrder: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    };

    if (isPreviewMode) {
      const updated = [...previewServices, newService];
      saveStoredServices(updated, PREVIEW_SERVICES_KEY);
      setPreviewServices(updated);
    } else {
      const updated = [...services, newService];
      saveStoredServices(updated, SERVICES_STORAGE_KEY);
      setServices(updated);
    }
    
    return newService;
  }, [isEnabled, isPreviewMode, previewServices, services]);

  // Update an existing service
  const updateService = useCallback((serviceId: string, updates: Partial<Omit<Service, 'id' | 'createdAt'>>): boolean => {
    if (!isEnabled) return false;

    const targetServices = isPreviewMode ? previewServices : services;
    const storageKey = isPreviewMode ? PREVIEW_SERVICES_KEY : SERVICES_STORAGE_KEY;
    const setTarget = isPreviewMode ? setPreviewServices : setServices;

    const serviceIndex = targetServices.findIndex(s => s.id === serviceId);
    if (serviceIndex === -1) return false;

    const updatedService = {
      ...targetServices[serviceIndex],
      ...updates,
      updatedAt: new Date(),
    };

    const updated = [...targetServices];
    updated[serviceIndex] = updatedService;
    
    saveStoredServices(updated, storageKey);
    setTarget(updated);
    return true;
  }, [isEnabled, isPreviewMode, previewServices, services]);

  // Delete a service
  const deleteService = useCallback((serviceId: string): boolean => {
    if (!isEnabled) return false;

    const targetServices = isPreviewMode ? previewServices : services;
    const storageKey = isPreviewMode ? PREVIEW_SERVICES_KEY : SERVICES_STORAGE_KEY;
    const setTarget = isPreviewMode ? setPreviewServices : setServices;

    const filtered = targetServices.filter(s => s.id !== serviceId);
    if (filtered.length === targetServices.length) return false;

    saveStoredServices(filtered, storageKey);
    setTarget(filtered);
    return true;
  }, [isEnabled, isPreviewMode, previewServices, services]);

  // Reorder a service (move up or down)
  const reorderService = useCallback((serviceId: string, direction: 'up' | 'down'): boolean => {
    if (!isEnabled) return false;

    const targetServices = isPreviewMode ? previewServices : services;
    const storageKey = isPreviewMode ? PREVIEW_SERVICES_KEY : SERVICES_STORAGE_KEY;
    const setTarget = isPreviewMode ? setPreviewServices : setServices;

    const sorted = [...targetServices].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const currentIndex = sorted.findIndex(s => s.id === serviceId);
    
    if (currentIndex === -1) return false;
    if (direction === 'up' && currentIndex === 0) return false;
    if (direction === 'down' && currentIndex === sorted.length - 1) return false;

    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    // Swap sort orders
    const tempOrder = sorted[currentIndex].sortOrder;
    sorted[currentIndex] = { ...sorted[currentIndex], sortOrder: sorted[swapIndex].sortOrder, updatedAt: new Date() };
    sorted[swapIndex] = { ...sorted[swapIndex], sortOrder: tempOrder, updatedAt: new Date() };

    saveStoredServices(sorted, storageKey);
    setTarget(sorted);
    return true;
  }, [isEnabled, isPreviewMode, previewServices, services]);

  // Update global background color
  const updateGlobalColor = useCallback((color: string) => {
    const newSettings = { ...menuSettings, globalBgColor: color };
    saveMenuSettings(newSettings);
    setMenuSettings(newSettings);
  }, [menuSettings]);

  // Reset the entire menu (admin function for maintenance)
  const resetMenu = useCallback(() => {
    // Clear all service menu storage
    localStorage.removeItem(SERVICES_STORAGE_KEY);
    localStorage.removeItem(PREVIEW_SERVICES_KEY);
    localStorage.removeItem(MENU_SETTINGS_KEY);
    
    // Reset state
    setServices([]);
    setPreviewServices([]);
    setMenuSettings({ globalBgColor: '', isUnlocked: false });
    setIsPreviewMode(false);
  }, []);

  // Check if we need to show the init dialog
  // Now we only show init if: enabled, no services, no preview services, AND menu is not unlocked
  // Since blank menu is free, isUnlocked should be true after setup completes
  // This means users who completed setup should never see the init dialog again
  const needsInit = isEnabled && 
    services.length === 0 && 
    previewServices.length === 0 && 
    !menuSettings.isUnlocked &&
    !setupLoading; // Don't show during setup loading

  return {
    services: activeServices,
    loading: loading || stateLoading || setupLoading,
    isEnabled,
    isPreviewMode,
    menuSettings,
    needsInit,
    businessSector, // Expose current sector for components
    validPresetId, // Expose valid preset for current sector
    addService,
    updateService,
    deleteService,
    reorderService,
    updateGlobalColor,
    loadPreset,
    startBlank,
    commitPreview,
    discardPreview,
    resetMenu,
  };
}
