import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useTrials } from './useTrials';

export function useFinancialTool() {
  const { user } = useAuth();
  const { isTrialActive, startTrial, hasTrialBeenUsed, getTrialDaysRemaining } = useTrials();
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsEnabled(false);
      setLoading(false);
      return;
    }

    const fetchStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('financial_tool_enabled, tax_pro_enabled, financial_pro_enabled')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching financial tool status:', error);
          setIsEnabled(false);
        } else {
          // Enabled if new flag is set OR either legacy flag is set
          setIsEnabled(
            data?.financial_tool_enabled ?? 
            data?.tax_pro_enabled ?? 
            data?.financial_pro_enabled ?? 
            false
          );
        }
      } catch (err) {
        console.error('Error:', err);
        setIsEnabled(false);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [user]);

  const enableFinancialTool = async () => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          financial_tool_enabled: true,
          tax_pro_enabled: true,
          financial_pro_enabled: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('Error enabling Financial Tool:', error);
        return false;
      }

      setIsEnabled(true);
      return true;
    } catch (err) {
      console.error('Error:', err);
      return false;
    }
  };

  const startFinancialToolTrial = async () => {
    return startTrial('financial_tool');
  };

  // Check if active through purchase OR trial
  const isActive = isEnabled || isTrialActive('financial_tool');
  const trialDaysRemaining = getTrialDaysRemaining('financial_tool');
  const canStartTrial = !hasTrialBeenUsed('financial_tool') && !isEnabled;

  return {
    isEnabled,
    isActive,
    loading,
    enableFinancialTool,
    startTrial: startFinancialToolTrial,
    canStartTrial,
    trialDaysRemaining,
    isOnTrial: isTrialActive('financial_tool') && !isEnabled,
  };
}
