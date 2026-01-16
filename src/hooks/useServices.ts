import { useState, useEffect, useCallback, useMemo } from 'react';
import { Service, ServiceMenuSettings } from '@/types/services';
import { UserService } from '@/types/profession';
import { generateLocalId } from '@/lib/localDb';
import { useAppState } from './useAppState';
import { useSetup } from './useSetup';
import { useUserServices, useAddUserService, useUpdateUserService, useDeleteUserService, useReorderUserServices } from './useUserServices';
import { useAuth } from './useAuth';
import { SERVICE_PRESETS } from '@/config/servicePresets';
import { getPresetIdForSector, isValidPresetForSector } from '@/lib/serviceUtils';
import { BusinessSector } from '@/config/sectorPresets';

// Storage keys (for backwards compat / fallback)
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
  return { globalBgColor: '', isUnlocked: true };
}

function saveMenuSettings(settings: ServiceMenuSettings): void {
  try {
    localStorage.setItem(MENU_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving menu settings:', error);
  }
}

// Convert UserService (DB) to Service (local format)
function userServiceToService(us: UserService): Service {
  return {
    id: us.id,
    name: us.name,
    price: Number(us.price),
    duration: us.duration ?? undefined,
    thumbnailUrl: us.thumbnail_url ?? undefined,
    bgColor: us.bg_color ?? undefined,
    sortOrder: us.sort_order,
    createdAt: new Date(us.created_at),
    updatedAt: new Date(us.updated_at),
  };
}

/**
 * useServices - Service menu hook with database persistence
 * 
 * For authenticated users: uses Supabase user_services table
 * For unauthenticated/demo: falls back to localStorage
 */
export function useServices() {
  const { user } = useAuth();
  const { hasAccess, loading: stateLoading } = useAppState();
  const { businessSector, loading: setupLoading } = useSetup();
  
  // Database hooks (only work when authenticated)
  const { data: dbServices = [], isLoading: dbLoading } = useUserServices();
  const addUserServiceMutation = useAddUserService();
  const updateUserServiceMutation = useUpdateUserService();
  const deleteUserServiceMutation = useDeleteUserService();
  const reorderMutation = useReorderUserServices();
  
  // Local state for unauthenticated/preview mode
  const [localServices, setLocalServices] = useState<Service[]>([]);
  const [previewServices, setPreviewServices] = useState<Service[]>([]);
  const [menuSettings, setMenuSettings] = useState<ServiceMenuSettings>(getMenuSettings);
  const [loading, setLoading] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  const isEnabled = hasAccess('serviceMenu');
  const validPresetId = businessSector ? getPresetIdForSector(businessSector as BusinessSector) : null;

  // Use database services if authenticated, otherwise local
  const isUsingDb = !!user;
  
  // Convert DB services to local format
  const services = useMemo(() => {
    if (isUsingDb) {
      return dbServices.map(userServiceToService);
    }
    return localServices;
  }, [isUsingDb, dbServices, localServices]);

  // Load local services on mount (for fallback)
  useEffect(() => {
    if (!isUsingDb && isEnabled && !setupLoading) {
      const storedServices = getStoredServices();
      const storedPreview = getStoredServices(PREVIEW_SERVICES_KEY);
      const settings = getMenuSettings();
      
      if (settings.presetId && businessSector) {
        const isValidPreset = isValidPresetForSector(settings.presetId, businessSector as BusinessSector);
        if (!isValidPreset) {
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
      
      setLocalServices(storedServices.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
    }
    if (!setupLoading) {
      setLoading(false);
    }
  }, [isUsingDb, isEnabled, setupLoading, businessSector]);

  const activeServices = isPreviewMode ? previewServices : services;

  // Load a preset into preview mode
  const loadPreset = useCallback((presetId: string) => {
    if (businessSector && !isValidPresetForSector(presetId, businessSector as BusinessSector)) {
      console.warn('[useServices] Invalid preset for sector:', presetId, businessSector);
      return false;
    }
    
    const preset = SERVICE_PRESETS[presetId];
    if (!preset) return false;

    const now = new Date();
    const newPresetServices: Service[] = preset.services.map((s, index) => ({
      id: generateLocalId(),
      name: s.name,
      price: s.price,
      duration: s.duration,
      sortOrder: index,
      createdAt: now,
      updatedAt: now,
    }));

    saveStoredServices(newPresetServices, PREVIEW_SERVICES_KEY);
    setPreviewServices(newPresetServices);
    
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

  const startBlank = useCallback(() => {
    localStorage.removeItem(PREVIEW_SERVICES_KEY);
    setPreviewServices([]);
    
    const newSettings: ServiceMenuSettings = {
      globalBgColor: '',
      isUnlocked: true,
      businessSector: businessSector || undefined,
    };
    saveMenuSettings(newSettings);
    setMenuSettings(newSettings);
    
    setIsPreviewMode(false);
  }, [businessSector]);

  const commitPreview = useCallback(async () => {
    if (previewServices.length === 0) return false;
    
    if (isUsingDb) {
      // Add all preview services to database
      for (const service of previewServices) {
        await addUserServiceMutation.mutateAsync({
          name: service.name,
          price: service.price,
          duration: service.duration ?? null,
          thumbnail_url: service.thumbnailUrl ?? null,
          bg_color: service.bgColor ?? null,
          sort_order: service.sortOrder ?? 0,
          source_library_id: null,
          is_active: true,
        });
      }
    } else {
      saveStoredServices(previewServices, SERVICES_STORAGE_KEY);
      setLocalServices(previewServices);
    }
    
    localStorage.removeItem(PREVIEW_SERVICES_KEY);
    setPreviewServices([]);
    
    const newSettings = { ...menuSettings, isUnlocked: true };
    saveMenuSettings(newSettings);
    setMenuSettings(newSettings);
    
    setIsPreviewMode(false);
    return true;
  }, [previewServices, menuSettings, isUsingDb, addUserServiceMutation]);

  const discardPreview = useCallback(() => {
    localStorage.removeItem(PREVIEW_SERVICES_KEY);
    localStorage.removeItem(MENU_SETTINGS_KEY);
    setPreviewServices([]);
    setMenuSettings({ globalBgColor: '', isUnlocked: false });
    setIsPreviewMode(false);
  }, []);

  const addService = useCallback(async (data: { 
    name: string; 
    price: number; 
    duration?: number;
    thumbnailUrl?: string;
    bgColor?: string;
  }): Promise<Service | null> => {
    if (!isEnabled) return null;

    if (isPreviewMode) {
      const now = new Date();
      const maxOrder = previewServices.reduce((max, s) => Math.max(max, s.sortOrder ?? 0), -1);
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
      const updated = [...previewServices, newService];
      saveStoredServices(updated, PREVIEW_SERVICES_KEY);
      setPreviewServices(updated);
      return newService;
    }
    
    if (isUsingDb) {
      const maxOrder = services.reduce((max, s) => Math.max(max, s.sortOrder ?? 0), -1);
      const result = await addUserServiceMutation.mutateAsync({
        name: data.name.trim(),
        price: data.price,
        duration: data.duration ?? null,
        thumbnail_url: data.thumbnailUrl ?? null,
        bg_color: data.bgColor ?? null,
        sort_order: maxOrder + 1,
        source_library_id: null,
        is_active: true,
      });
      return userServiceToService(result);
    }
    
    // Fallback to local
    const now = new Date();
    const maxOrder = localServices.reduce((max, s) => Math.max(max, s.sortOrder ?? 0), -1);
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
    const updated = [...localServices, newService];
    saveStoredServices(updated, SERVICES_STORAGE_KEY);
    setLocalServices(updated);
    return newService;
  }, [isEnabled, isPreviewMode, previewServices, services, localServices, isUsingDb, addUserServiceMutation]);

  const updateService = useCallback(async (serviceId: string, updates: Partial<Omit<Service, 'id' | 'createdAt'>>): Promise<boolean> => {
    if (!isEnabled) return false;

    if (isPreviewMode) {
      const serviceIndex = previewServices.findIndex(s => s.id === serviceId);
      if (serviceIndex === -1) return false;
      const updatedService = { ...previewServices[serviceIndex], ...updates, updatedAt: new Date() };
      const updated = [...previewServices];
      updated[serviceIndex] = updatedService;
      saveStoredServices(updated, PREVIEW_SERVICES_KEY);
      setPreviewServices(updated);
      return true;
    }
    
    if (isUsingDb) {
      await updateUserServiceMutation.mutateAsync({
        id: serviceId,
        name: updates.name,
        price: updates.price,
        duration: updates.duration ?? null,
        thumbnail_url: updates.thumbnailUrl ?? null,
        bg_color: updates.bgColor ?? null,
      });
      return true;
    }
    
    // Fallback to local
    const serviceIndex = localServices.findIndex(s => s.id === serviceId);
    if (serviceIndex === -1) return false;
    const updatedService = { ...localServices[serviceIndex], ...updates, updatedAt: new Date() };
    const updated = [...localServices];
    updated[serviceIndex] = updatedService;
    saveStoredServices(updated, SERVICES_STORAGE_KEY);
    setLocalServices(updated);
    return true;
  }, [isEnabled, isPreviewMode, previewServices, localServices, isUsingDb, updateUserServiceMutation]);

  const deleteService = useCallback(async (serviceId: string): Promise<boolean> => {
    if (!isEnabled) return false;

    if (isPreviewMode) {
      const filtered = previewServices.filter(s => s.id !== serviceId);
      if (filtered.length === previewServices.length) return false;
      saveStoredServices(filtered, PREVIEW_SERVICES_KEY);
      setPreviewServices(filtered);
      return true;
    }
    
    if (isUsingDb) {
      await deleteUserServiceMutation.mutateAsync(serviceId);
      return true;
    }
    
    // Fallback to local
    const filtered = localServices.filter(s => s.id !== serviceId);
    if (filtered.length === localServices.length) return false;
    saveStoredServices(filtered, SERVICES_STORAGE_KEY);
    setLocalServices(filtered);
    return true;
  }, [isEnabled, isPreviewMode, previewServices, localServices, isUsingDb, deleteUserServiceMutation]);

  const reorderService = useCallback(async (serviceId: string, direction: 'up' | 'down'): Promise<boolean> => {
    if (!isEnabled) return false;

    const targetServices = isPreviewMode ? previewServices : services;
    const sorted = [...targetServices].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const currentIndex = sorted.findIndex(s => s.id === serviceId);
    
    if (currentIndex === -1) return false;
    if (direction === 'up' && currentIndex === 0) return false;
    if (direction === 'down' && currentIndex === sorted.length - 1) return false;

    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    // Swap positions
    const tempOrder = sorted[currentIndex].sortOrder;
    sorted[currentIndex] = { ...sorted[currentIndex], sortOrder: sorted[swapIndex].sortOrder, updatedAt: new Date() };
    sorted[swapIndex] = { ...sorted[swapIndex], sortOrder: tempOrder, updatedAt: new Date() };

    if (isPreviewMode) {
      saveStoredServices(sorted, PREVIEW_SERVICES_KEY);
      setPreviewServices(sorted);
    } else if (isUsingDb) {
      // For database, just update the two affected services
      await updateUserServiceMutation.mutateAsync({ id: sorted[currentIndex].id, sort_order: sorted[currentIndex].sortOrder });
      await updateUserServiceMutation.mutateAsync({ id: sorted[swapIndex].id, sort_order: sorted[swapIndex].sortOrder });
    } else {
      saveStoredServices(sorted, SERVICES_STORAGE_KEY);
      setLocalServices(sorted);
    }
    return true;
  }, [isEnabled, isPreviewMode, previewServices, services, isUsingDb, updateUserServiceMutation]);

  const updateGlobalColor = useCallback((color: string) => {
    const newSettings = { ...menuSettings, globalBgColor: color };
    saveMenuSettings(newSettings);
    setMenuSettings(newSettings);
  }, [menuSettings]);

  const resetMenu = useCallback(() => {
    localStorage.removeItem(SERVICES_STORAGE_KEY);
    localStorage.removeItem(PREVIEW_SERVICES_KEY);
    localStorage.removeItem(MENU_SETTINGS_KEY);
    setLocalServices([]);
    setPreviewServices([]);
    setMenuSettings({ globalBgColor: '', isUnlocked: false });
    setIsPreviewMode(false);
  }, []);

  const needsInit = isEnabled && 
    services.length === 0 && 
    previewServices.length === 0 && 
    !menuSettings.isUnlocked &&
    !setupLoading &&
    !dbLoading;

  return {
    services: activeServices,
    loading: loading || stateLoading || setupLoading || (isUsingDb && dbLoading),
    isEnabled,
    isPreviewMode,
    menuSettings,
    needsInit,
    businessSector,
    validPresetId,
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
