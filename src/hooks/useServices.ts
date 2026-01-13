import { useState, useEffect, useCallback } from 'react';
import { Service } from '@/types/services';
import { generateLocalId } from '@/lib/localDb';
import { useFeatureFlags } from './useFeatureFlags';

// Storage key for services
const SERVICES_STORAGE_KEY = 'nimble_services';

function getStoredServices(): Service[] {
  try {
    const stored = localStorage.getItem(SERVICES_STORAGE_KEY);
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

function saveStoredServices(services: Service[]): void {
  try {
    localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(services));
  } catch (error) {
    console.error('Error saving services:', error);
  }
}

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { flags } = useFeatureFlags();

  const isEnabled = flags.service_menu_enabled ?? false;

  // Load services
  useEffect(() => {
    if (isEnabled) {
      const storedServices = getStoredServices();
      setServices(storedServices.sort((a, b) => a.name.localeCompare(b.name)));
    }
    setLoading(false);
  }, [isEnabled]);

  // Add a new service
  const addService = useCallback((data: { name: string; price: number; duration?: number }): Service | null => {
    if (!isEnabled) return null;

    const now = new Date();
    const newService: Service = {
      id: generateLocalId(),
      name: data.name.trim(),
      price: data.price,
      duration: data.duration,
      createdAt: now,
      updatedAt: now,
    };

    const allServices = getStoredServices();
    const updatedServices = [...allServices, newService];
    saveStoredServices(updatedServices);
    
    setServices(prev => [...prev, newService].sort((a, b) => a.name.localeCompare(b.name)));
    return newService;
  }, [isEnabled]);

  // Update an existing service
  const updateService = useCallback((serviceId: string, updates: Partial<Omit<Service, 'id' | 'createdAt'>>): boolean => {
    if (!isEnabled) return false;

    const allServices = getStoredServices();
    const serviceIndex = allServices.findIndex(s => s.id === serviceId);
    
    if (serviceIndex === -1) return false;

    const updatedService = {
      ...allServices[serviceIndex],
      ...updates,
      updatedAt: new Date(),
    };

    allServices[serviceIndex] = updatedService;
    saveStoredServices(allServices);

    setServices(prev => 
      prev.map(s => s.id === serviceId ? { ...updatedService, createdAt: new Date(updatedService.createdAt), updatedAt: new Date(updatedService.updatedAt) } : s)
        .sort((a, b) => a.name.localeCompare(b.name))
    );
    return true;
  }, [isEnabled]);

  // Delete a service
  const deleteService = useCallback((serviceId: string): boolean => {
    if (!isEnabled) return false;

    const allServices = getStoredServices();
    const filtered = allServices.filter(s => s.id !== serviceId);
    
    if (filtered.length === allServices.length) return false;

    saveStoredServices(filtered);
    setServices(prev => prev.filter(s => s.id !== serviceId));
    return true;
  }, [isEnabled]);

  return {
    services,
    loading,
    isEnabled,
    addService,
    updateService,
    deleteService,
  };
}
