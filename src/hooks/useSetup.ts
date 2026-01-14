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
   * Initialize default features based on business type, mobility, and menu choice
   * 
   * IMPORTANT: All users get a FREE blank editable service menu by default.
   * Pre-populated menus are UPGRADES that copy services into the user's menu space.
   */
  const initializeDefaultFeatures = useCallback((data: {
    businessType: BusinessType;
    businessSector: BusinessSector;
    services?: PreviewService[];
    themeColor?: string | null;
    menuChoice?: 'blank' | 'prepopulated' | 'skip';
  }) => {
    const isMobile = data.businessType === 'mobile_job';
    const isStationary = data.businessType === 'stationary_appointment';
    const isBlankOrOther = data.businessSector === 'other';
    
    // Determine if the user has a menu (blank or prepopulated both enable menu)
    // Skip means no menu for now
    const hasMenu = data.menuChoice === 'blank' || data.menuChoice === 'prepopulated';

    // Initialize Appointment Calendar data structure
    // Both mobile and stationary get appointments, but with different defaults
    if (isMobile || isStationary) {
      const existingAppointments = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
      if (!existingAppointments) {
        localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify([]));
      }
    }

    // Initialize Service Menu
    // ALL users with a menu choice (blank or prepopulated) get an editable menu
    if (hasMenu) {
      const now = new Date();
      
      if (data.menuChoice === 'prepopulated' && data.services && data.services.length > 0) {
        // Pre-populated: Copy the profession template into user's menu space
        const servicesToSave = data.services.map((s, index) => ({
          id: s.id || `service_${Date.now()}_${index}`,
          name: s.name,
          price: s.price,
          duration: s.duration,
          sortOrder: index,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        }));
        localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(servicesToSave));
        console.log(`[Setup] Saved ${servicesToSave.length} pre-populated services to menu`);
      } else {
        // Blank menu: Start with empty services array (user will add their own)
        // Only initialize if not already present
        const existingServices = localStorage.getItem(SERVICES_STORAGE_KEY);
        if (!existingServices) {
          localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify([]));
        }
      }
      
      // Initialize menu settings - menu is always unlocked and editable
      const menuSettings = {
        globalBgColor: data.themeColor || '',
        isUnlocked: true, // Menu is always unlocked and editable
        businessSector: data.businessSector,
        menuChoice: data.menuChoice,
        isPrepopulated: data.menuChoice === 'prepopulated',
      };
      localStorage.setItem(MENU_SETTINGS_KEY, JSON.stringify(menuSettings));
    }

    // Initialize Project Board for mobile businesses or blank/other
    if (isMobile || isBlankOrOther) {
      const existingProjects = localStorage.getItem(PROJECTS_STORAGE_KEY);
      if (!existingProjects) {
        localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify([]));
      }
    }

    console.log(`[Setup] Initialized features for ${data.businessType} / ${data.businessSector}:`, {
      appointments: isMobile || isStationary,
      serviceMenu: hasMenu,
      menuChoice: data.menuChoice,
      servicesCount: data.services?.length || 0,
      projects: isMobile || isBlankOrOther,
    });
  }, []);

  const completeSetup = useCallback(async (data: {
    companyName: string;
    businessType: BusinessType;
    businessSector: BusinessSector;
    services?: PreviewService[];
    themeColor?: string | null;
    menuChoice?: 'blank' | 'prepopulated' | 'skip';
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
