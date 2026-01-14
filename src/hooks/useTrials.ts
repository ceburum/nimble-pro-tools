import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { TRIAL_DURATIONS, TrialableFeature } from '@/config/pricing';

interface TrialInfo {
  started_at: string;
  expires_at: string;
}

type TrialRecord = Record<string, TrialInfo>;

export function useTrials() {
  const { user } = useAuth();
  const [trials, setTrials] = useState<TrialRecord>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchTrials = async () => {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('trial_started_at')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching trials:', error);
        } else if (data?.trial_started_at && typeof data.trial_started_at === 'object') {
          setTrials(data.trial_started_at as unknown as TrialRecord);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrials();
  }, [user]);

  const startTrial = useCallback(async (feature: TrialableFeature): Promise<boolean> => {
    if (!user) return false;

    const durationDays = TRIAL_DURATIONS[feature.toUpperCase() as keyof typeof TRIAL_DURATIONS] || 7;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const newTrialInfo: TrialInfo = {
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    };

    const updatedTrials = {
      ...trials,
      [feature]: newTrialInfo,
    };

    try {
      const { error } = await supabase
        .from('user_settings')
        .update({
          trial_started_at: JSON.parse(JSON.stringify(updatedTrials)),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error starting trial:', error);
        return false;
      }

      setTrials(updatedTrials);
      return true;
    } catch (err) {
      console.error('Error:', err);
      return false;
    }
  }, [user, trials]);

  const isTrialActive = useCallback((feature: TrialableFeature): boolean => {
    const trial = trials[feature];
    if (!trial) return false;

    const expiresAt = new Date(trial.expires_at);
    return expiresAt > new Date();
  }, [trials]);

  const getTrialDaysRemaining = useCallback((feature: TrialableFeature): number => {
    const trial = trials[feature];
    if (!trial) return 0;

    const expiresAt = new Date(trial.expires_at);
    const now = new Date();
    const remaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    return Math.max(0, remaining);
  }, [trials]);

  const hasTrialBeenUsed = useCallback((feature: TrialableFeature): boolean => {
    return !!trials[feature];
  }, [trials]);

  return {
    trials,
    loading,
    startTrial,
    isTrialActive,
    getTrialDaysRemaining,
    hasTrialBeenUsed,
  };
}
