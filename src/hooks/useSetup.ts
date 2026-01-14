import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { BusinessSector, BusinessType, SECTOR_PRESETS } from '@/config/sectorPresets';
import { PreviewService } from '@/lib/serviceUtils';

// Storage keys (must match other hooks)
const SERVICES_STORAGE_KEY = 'nimble_services';
const MENU_SETTINGS_KEY = 'nimble_service_menu_settings';
const APPOINTMENTS_STORAGE_KEY = 'nimble_appointments';
const PROJECTS_STORAGE_KEY = 'nimble_projects';

interface SetupState {
  setupCompleted: boolean;
  businessType: BusinessType | null;
  businessSector: BusinessSector | null;
  companyName: string | null;
}

/**
 * Feature Initialization Rules:
 * 
 * Mobile Businesses (mobile_job):
 * - Initialize appointment calendar with location support
 * - Projects enabled for job tracking
 * - No service menu by default
 * 
 * Stationary Businesses (stationary_appointment):
 * - Initialize appointment calendar
 * - Initialize service menu (editable)
 * - Initialize invoice system linked to menu
 * 
 * Other / Blank:
 * - Initialize project board only
 * - No appointment calendar or service menu by default
 */

export function useSetup() {
  const { user } = useAuth();
  const [state, setState] = useState<SetupState>({
    setupCompleted: true, // Default to true to avoid flash
    businessType: null,
    businessSector: null,
    companyName: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchSetupState = async () => {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('setup_completed, business_type, business_sector, company_name')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching setup state:', error);
          setState(prev => ({ ...prev, setupCompleted: true }));
        } else if (data) {
          setState({
            setupCompleted: data.setup_completed ?? false,
            businessType: (data.business_type as BusinessType) ?? null,
            businessSector: (data.business_sector as BusinessSector) ?? null,
            companyName: data.company_name ?? null,
          });
        } else {
          // No settings record exists yet
          setState(prev => ({ ...prev, setupCompleted: false }));
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSetupState();
  }, [user]);

  /**
   * Initialize default features based on business type and mobility
   */
  const initializeDefaultFeatures = useCallback((data: {
    businessType: BusinessType;
    businessSector: BusinessSector;
    services?: PreviewService[];
    themeColor?: string | null;
  }) => {
    const isMobile = data.businessType === 'mobile_job';
    const isStationary = data.businessType === 'stationary_appointment';
    const isBlankOrOther = data.businessSector === 'other';

    // Initialize Appointment Calendar data structure
    // Both mobile and stationary get appointments, but with different defaults
    if (isMobile || isStationary) {
      const existingAppointments = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
      if (!existingAppointments) {
        // Initialize empty appointments array
        localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify([]));
      }
    }

    // Initialize Service Menu for Stationary businesses
    if (isStationary) {
      // Save services if provided
      if (data.services && data.services.length > 0) {
        const now = new Date();
        const servicesToSave = data.services.map((s, index) => ({
          id: s.id,
          name: s.name,
          price: s.price,
          duration: s.duration,
          sortOrder: index,
          createdAt: now,
          updatedAt: now,
        }));
        localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(servicesToSave));
      }
      
      // Initialize menu settings (always for stationary, even without services)
      // Include businessSector as source of truth for which profession's menu to show
      const menuSettings = {
        globalBgColor: data.themeColor || '',
        isUnlocked: true, // Stationary businesses always have menu unlocked
        businessSector: data.businessSector, // Store sector as source of truth
      };
      localStorage.setItem(MENU_SETTINGS_KEY, JSON.stringify(menuSettings));
    }

    // Initialize Project Board for mobile businesses or blank/other
    if (isMobile || isBlankOrOther) {
      const existingProjects = localStorage.getItem(PROJECTS_STORAGE_KEY);
      if (!existingProjects) {
        // Initialize empty projects array (DB will handle actual storage)
        // This is just a marker that projects feature is initialized
        localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify([]));
      }
    }

    console.log(`[Setup] Initialized features for ${data.businessType} / ${data.businessSector}:`, {
      appointments: isMobile || isStationary,
      serviceMenu: isStationary,
      projects: isMobile || isBlankOrOther,
    });
  }, []);

  const completeSetup = useCallback(async (data: {
    companyName: string;
    businessType: BusinessType;
    businessSector: BusinessSector;
    services?: PreviewService[];
    themeColor?: string | null;
  }) => {
    if (!user) return false;

    try {
      // Determine which pro features to auto-enable based on business type
      const isStationary = data.businessType === 'stationary_appointment';
      const isMobile = data.businessType === 'mobile_job';
      
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          company_name: data.companyName,
          business_type: data.businessType,
          business_sector: data.businessSector,
          setup_completed: true,
          // Auto-enable scheduling for stationary businesses (appointment calendar)
          scheduling_pro_enabled: isStationary,
          // Enable mileage tracking hint for mobile businesses
          // (actual mileage pro requires purchase, but we track that they're mobile)
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('Error completing setup:', error);
        return false;
      }

      // Initialize default features in localStorage
      initializeDefaultFeatures(data);

      setState({
        setupCompleted: true,
        businessType: data.businessType,
        businessSector: data.businessSector,
        companyName: data.companyName,
      });

      return true;
    } catch (err) {
      console.error('Error:', err);
      return false;
    }
  }, [user, initializeDefaultFeatures]);

  /**
   * Clear all default feature data (for admin reset)
   */
  const clearDefaultFeatures = useCallback(() => {
    // Clear all feature-related localStorage items
    localStorage.removeItem(SERVICES_STORAGE_KEY);
    localStorage.removeItem(MENU_SETTINGS_KEY);
    localStorage.removeItem(APPOINTMENTS_STORAGE_KEY);
    localStorage.removeItem(PROJECTS_STORAGE_KEY);
    localStorage.removeItem('nimble_services_preview');
    localStorage.removeItem('nimble_feature_flags');
    
    console.log('[Setup] Cleared all default feature data');
  }, []);

  const resetSetup = useCallback(async () => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          setup_completed: false,
          business_type: null,
          business_sector: null,
          company_name: null,
          // Reset pro features to false
          scheduling_pro_enabled: false,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('Error resetting setup:', error);
        return false;
      }

      // Clear all default feature data
      clearDefaultFeatures();

      setState({
        setupCompleted: false,
        businessType: null,
        businessSector: null,
        companyName: null,
      });

      return true;
    } catch (err) {
      console.error('Error:', err);
      return false;
    }
  }, [user, clearDefaultFeatures]);

  return {
    ...state,
    loading,
    completeSetup,
    resetSetup,
    clearDefaultFeatures, // Expose for admin reset
  };
}
