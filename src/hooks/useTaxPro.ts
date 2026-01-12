import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface TaxProSettings {
  taxProEnabled: boolean;
}

export function useTaxPro() {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsEnabled(false);
      setLoading(false);
      return;
    }

    const fetchTaxProStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('tax_pro_enabled')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching tax pro status:', error);
          setIsEnabled(false);
        } else {
          setIsEnabled(data?.tax_pro_enabled ?? false);
        }
      } catch (err) {
        console.error('Error:', err);
        setIsEnabled(false);
      } finally {
        setLoading(false);
      }
    };

    fetchTaxProStatus();
  }, [user]);

  const enableTaxPro = async () => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          tax_pro_enabled: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('Error enabling Tax Pro:', error);
        return false;
      }

      setIsEnabled(true);
      return true;
    } catch (err) {
      console.error('Error:', err);
      return false;
    }
  };

  const disableTaxPro = async () => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_settings')
        .update({ tax_pro_enabled: false, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error disabling Tax Pro:', error);
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
    enableTaxPro,
    disableTaxPro
  };
}
