import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface CommissionEvent {
  id: string;
  user_id: string;
  salesperson_id?: string;
  affiliate_id?: string;
  event_type: 'sale' | 'subscription' | 'addon' | 'referral';
  product_type?: string;
  product_name?: string;
  sale_amount: number;
  commission_rate: number;
  commission_amount: number;
  commission_type: 'percentage' | 'flat';
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  paid_at?: string;
  stripe_transfer_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CommissionSummary {
  total_sales: number;
  total_commissions: number;
  pending_commissions: number;
  paid_commissions: number;
  approved_commissions: number;
}

/**
 * useCommissionTracking - Track sales commissions
 * 
 * This hook provides the framework for tracking commissions from:
 * - Direct sales (base app, add-ons)
 * - Subscriptions (Scanner Vision, Cloud Storage)
 * - Affiliate referrals
 * 
 * Note: This is the tracking framework only.
 * Actual commission calculations and payouts should be handled by edge functions
 * when payments are processed.
 */
export function useCommissionTracking() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [commissions, setCommissions] = useState<CommissionEvent[]>([]);
  const [summary, setSummary] = useState<CommissionSummary>({
    total_sales: 0,
    total_commissions: 0,
    pending_commissions: 0,
    paid_commissions: 0,
    approved_commissions: 0,
  });

  // Fetch commissions where user is the salesperson
  const fetchCommissions = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const client = supabase as unknown as { from: (table: string) => { select: (cols: string) => { or: (filter: string) => { order: (col: string, opts: Record<string, boolean>) => Promise<{ data: unknown[]; error: unknown }> } } } };
      const { data, error } = await client
        .from('commission_events')
        .select('*')
        .or(`salesperson_id.eq.${user.id},user_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching commissions:', error);
        return;
      }

      const events = (data || []) as CommissionEvent[];
      setCommissions(events);

      // Calculate summary
      const summary: CommissionSummary = {
        total_sales: events.reduce((sum, e) => sum + (e.sale_amount || 0), 0),
        total_commissions: events.reduce((sum, e) => sum + (e.commission_amount || 0), 0),
        pending_commissions: events.filter(e => e.status === 'pending').reduce((sum, e) => sum + (e.commission_amount || 0), 0),
        paid_commissions: events.filter(e => e.status === 'paid').reduce((sum, e) => sum + (e.commission_amount || 0), 0),
        approved_commissions: events.filter(e => e.status === 'approved').reduce((sum, e) => sum + (e.commission_amount || 0), 0),
      };
      setSummary(summary);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCommissions();
  }, [fetchCommissions]);

  // Record a commission event (typically called by edge functions, but can be used for manual entry by admins)
  const recordCommission = useCallback(async (event: Omit<CommissionEvent, 'id' | 'created_at' | 'updated_at'>): Promise<CommissionEvent | null> => {
    try {
      // Use 'any' cast for new tables until types are regenerated
      const client = supabase as unknown as { from: (table: string) => { insert: (data: Record<string, unknown>) => { select: () => { single: () => Promise<{ data: unknown; error: unknown }> } } } };
      const { data, error } = await client
        .from('commission_events')
        .insert(event as Record<string, unknown>)
        .select()
        .single();

      if (error) {
        console.error('Error recording commission:', error);
        return null;
      }

      // Refresh list
      fetchCommissions();
      return data as CommissionEvent;
    } catch (err) {
      console.error('Error:', err);
      return null;
    }
  }, [fetchCommissions]);

  // Calculate commission amount
  const calculateCommission = useCallback((
    saleAmount: number, 
    rate: number, 
    type: 'percentage' | 'flat'
  ): number => {
    if (type === 'flat') {
      return rate;
    }
    return Number((saleAmount * rate).toFixed(2));
  }, []);

  return {
    loading,
    commissions,
    summary,
    fetchCommissions,
    recordCommission,
    calculateCommission,
  };
}
