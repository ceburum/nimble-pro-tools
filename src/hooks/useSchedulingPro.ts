import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type BusinessType = 'mobile_job' | 'stationary_appointment' | null;

export function useSchedulingPro() {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [businessType, setBusinessTypeState] = useState<BusinessType>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsEnabled(false);
      setBusinessTypeState(null);
      setLoading(false);
      return;
    }

    const fetchSchedulingProStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('scheduling_pro_enabled, business_type')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching scheduling pro status:', error);
          setIsEnabled(false);
          setBusinessTypeState(null);
        } else {
          setIsEnabled(data?.scheduling_pro_enabled ?? false);
          setBusinessTypeState((data?.business_type as BusinessType) ?? null);
        }
      } catch (err) {
        console.error('Error:', err);
        setIsEnabled(false);
        setBusinessTypeState(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedulingProStatus();
  }, [user]);

  const enableSchedulingPro = async () => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          scheduling_pro_enabled: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('Error enabling Scheduling Pro:', error);
        return false;
      }

      setIsEnabled(true);
      return true;
    } catch (err) {
      console.error('Error:', err);
      return false;
    }
  };

  const disableSchedulingPro = async () => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_settings')
        .update({ scheduling_pro_enabled: false, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error disabling Scheduling Pro:', error);
        return false;
      }

      setIsEnabled(false);
      return true;
    } catch (err) {
      console.error('Error:', err);
      return false;
    }
  };

  const setBusinessType = async (type: BusinessType) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          business_type: type,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('Error setting business type:', error);
        return false;
      }

      setBusinessTypeState(type);
      return true;
    } catch (err) {
      console.error('Error:', err);
      return false;
    }
  };

  return {
    isEnabled,
    businessType,
    loading,
    enableSchedulingPro,
    disableSchedulingPro,
    setBusinessType,
  };
}
