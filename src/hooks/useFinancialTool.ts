import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useAppState } from './useAppState';
import { useTrials } from './useTrials';

/**
 * useFinancialTool - Financial feature hook using centralized AppState
 * 
 * Access is determined by AppState. This hook provides:
 * - Read access to enabled status (from AppState)
 * - Trial management
 * - Actions to enable/disable the feature (persists to DB)
 */
export function useFinancialTool() {
  const { user } = useAuth();
  const { hasAccess, loading: stateLoading, isTrialActive: globalTrialActive } = useAppState();
  const { isTrialActive, startTrial, hasTrialBeenUsed, getTrialDaysRemaining } = useTrials();
  const [actionLoading, setActionLoading] = useState(false);

  // Access determined by AppState - NOT by individual DB flag
  const isEnabled = hasAccess('financial');
  const loading = stateLoading;

  const enableFinancialTool = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    setActionLoading(true);

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

      return true;
    } catch (err) {
      console.error('Error:', err);
      return false;
    } finally {
      setActionLoading(false);
    }
  }, [user]);

  const startFinancialToolTrial = useCallback(async (): Promise<boolean> => {
    return startTrial('financial_tool');
  }, [startTrial]);

  // Check if active through purchase OR trial
  // In ADMIN_PREVIEW or PAID_PRO state, this is always true
  const isActive = isEnabled || isTrialActive('financial_tool');
  const trialDaysRemaining = getTrialDaysRemaining('financial_tool');
  const canStartTrial = !hasTrialBeenUsed('financial_tool') && !isEnabled;

  return {
    isEnabled,
    isActive,
    loading,
    actionLoading,
    enableFinancialTool,
    startTrial: startFinancialToolTrial,
    canStartTrial,
    trialDaysRemaining,
    isOnTrial: isTrialActive('financial_tool') && !isEnabled,
  };
}
