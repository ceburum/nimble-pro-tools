import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface IrsMileageRate {
  year: number;
  ratePerMile: number;
}

export function useIrsMileageRates() {
  const [rates, setRates] = useState<IrsMileageRate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRates = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('irs_mileage_rates')
        .select('year, rate_per_mile')
        .order('year', { ascending: false });

      if (error) {
        console.error('Error fetching IRS mileage rates:', error);
        setRates([]);
      } else {
        setRates((data || []).map(r => ({
          year: r.year,
          ratePerMile: Number(r.rate_per_mile)
        })));
      }
    } catch (err) {
      console.error('Error:', err);
      setRates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const getRateForYear = (year: number): number => {
    const rate = rates.find(r => r.year === year);
    if (rate) return rate.ratePerMile;
    
    // Fallback to current year or most recent rate
    const currentYear = new Date().getFullYear();
    const currentRate = rates.find(r => r.year === currentYear);
    if (currentRate) return currentRate.ratePerMile;
    
    // Default fallback
    return 0.67;
  };

  return {
    rates,
    loading,
    getRateForYear,
    refresh: fetchRates
  };
}
