import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useMileagePro() {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsEnabled(false);
      setLoading(false);
      return;
    }

    const fetchMileageProStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('mileage_pro_enabled')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching mileage pro status:', error);
          setIsEnabled(false);
        } else {
          setIsEnabled(data?.mileage_pro_enabled ?? false);
        }
      } catch (err) {
        console.error('Error:', err);
        setIsEnabled(false);
      } finally {
        setLoading(false);
      }
    };

    fetchMileageProStatus();
  }, [user]);

  const enableMileagePro = async () => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          mileage_pro_enabled: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('Error enabling Mileage Pro:', error);
        return false;
      }

      setIsEnabled(true);
      return true;
    } catch (err) {
      console.error('Error:', err);
      return false;
    }
  };

  const disableMileagePro = async () => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_settings')
        .update({ mileage_pro_enabled: false, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error disabling Mileage Pro:', error);
        return false;
      }

      setIsEnabled(false);
      return true;
    } catch (err) {
      console.error('Error:', err);
      return false;
    }
  };

  return {
    isEnabled,
    loading,
    enableMileagePro,
    disableMileagePro
  };
}
