import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { BusinessSector, BusinessType } from '@/config/sectorPresets';

interface SetupState {
  setupCompleted: boolean;
  businessType: BusinessType | null;
  businessSector: BusinessSector | null;
  companyName: string | null;
}

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

  const completeSetup = useCallback(async (data: {
    companyName: string;
    businessType: BusinessType;
    businessSector: BusinessSector;
  }) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          company_name: data.companyName,
          business_type: data.businessType,
          business_sector: data.businessSector,
          setup_completed: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('Error completing setup:', error);
        return false;
      }

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
  }, [user]);

  return {
    ...state,
    loading,
    completeSetup,
  };
}
