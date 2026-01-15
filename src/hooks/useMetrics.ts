import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AppMetrics {
  // User-specific metrics
  totalClients: number;
  totalProjects: number;
  totalInvoices: number;
  totalRevenue: number;
  pendingInvoices: number;
  overdueInvoices: number;
  completedProjects: number;
  activeProjects: number;
  
  // For admins - app-wide metrics
  totalUsers?: number;
  activeUsers?: number;
  totalAppRevenue?: number;
}

/**
 * useMetrics - Get aggregated metrics for dashboards
 * 
 * This hook provides real-time metrics for the user's account.
 * Admins can also see app-wide metrics.
 */
export function useMetrics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<AppMetrics>({
    totalClients: 0,
    totalProjects: 0,
    totalInvoices: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
    completedProjects: 0,
    activeProjects: 0,
  });

  const fetchMetrics = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Parallel fetch for performance
      const [
        clientsResult,
        projectsResult,
        invoicesResult,
      ] = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('projects').select('id, status', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('invoices').select('id, status, items', { count: 'exact' }).eq('user_id', user.id),
      ]);

      const projects = projectsResult.data || [];
      const invoices = invoicesResult.data || [];

      // Calculate revenue from paid invoices
      const totalRevenue = invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => {
          const items = inv.items as Array<{ quantity: number; unitPrice: number }> || [];
          return sum + items.reduce((itemSum, item) => itemSum + (item.quantity * item.unitPrice), 0);
        }, 0);

      // Count invoice statuses
      const pendingInvoices = invoices.filter(inv => inv.status === 'sent' || inv.status === 'draft').length;
      const overdueInvoices = invoices.filter(inv => inv.status === 'overdue').length;

      // Count project statuses
      const completedProjects = projects.filter(p => p.status === 'completed' || p.status === 'invoiced').length;
      const activeProjects = projects.filter(p => p.status === 'in_progress' || p.status === 'accepted').length;

      setMetrics({
        totalClients: clientsResult.count || 0,
        totalProjects: projectsResult.count || 0,
        totalInvoices: invoicesResult.count || 0,
        totalRevenue,
        pendingInvoices,
        overdueInvoices,
        completedProjects,
        activeProjects,
      });
    } catch (err) {
      console.error('Error fetching metrics:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    loading,
    metrics,
    refreshMetrics: fetchMetrics,
  };
}
