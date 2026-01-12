import { useMemo, useState, useCallback } from 'react';
import { useInvoices } from './useInvoices';
import { useProjects } from './useProjects';
import { useClients } from './useClients';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { format, differenceInDays, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, isWithinInterval } from 'date-fns';

export interface DateRange {
  from: Date;
  to: Date;
}

interface UserSettings {
  tax_rate_estimate: number;
}

export function useReportsData(dateRange?: DateRange) {
  const { invoices, loading: invoicesLoading } = useInvoices();
  const { projects, loading: projectsLoading } = useProjects();
  const { clients, loading: clientsLoading } = useClients();
  const [userSettings, setUserSettings] = useState<UserSettings>({ tax_rate_estimate: 0.25 });
  const [settingsLoading, setSettingsLoading] = useState(true);

  // Default to current year if no range provided
  const effectiveDateRange = dateRange || {
    from: startOfYear(new Date()),
    to: endOfYear(new Date()),
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase
          .from('user_settings')
          .select('tax_rate_estimate')
          .single();

        if (data) {
          setUserSettings({
            tax_rate_estimate: Number(data.tax_rate_estimate) || 0.25,
          });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setSettingsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const loading = invoicesLoading || projectsLoading || clientsLoading || settingsLoading;

  // Invoice Aging Report
  const invoiceAging = useMemo(() => {
    const now = new Date();
    const unpaidInvoices = invoices.filter((inv) => inv.status !== 'paid');

    const buckets = {
      current: [] as typeof unpaidInvoices,
      days30to60: [] as typeof unpaidInvoices,
      days60to90: [] as typeof unpaidInvoices,
      over90: [] as typeof unpaidInvoices,
    };

    unpaidInvoices.forEach((inv) => {
      const daysOverdue = differenceInDays(now, inv.dueDate);
      if (daysOverdue <= 0) {
        buckets.current.push(inv);
      } else if (daysOverdue <= 30) {
        buckets.days30to60.push(inv);
      } else if (daysOverdue <= 60) {
        buckets.days60to90.push(inv);
      } else {
        buckets.over90.push(inv);
      }
    });

    const getTotal = (list: typeof unpaidInvoices) =>
      list.reduce((sum, inv) => sum + inv.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0), 0);

    return {
      current: { invoices: buckets.current, total: getTotal(buckets.current) },
      days30to60: { invoices: buckets.days30to60, total: getTotal(buckets.days30to60) },
      days60to90: { invoices: buckets.days60to90, total: getTotal(buckets.days60to90) },
      over90: { invoices: buckets.over90, total: getTotal(buckets.over90) },
      totalOutstanding: getTotal(unpaidInvoices),
    };
  }, [invoices]);

  // Income by Client (filtered by date range)
  const incomeByClient = useMemo(() => {
    const filteredInvoices = invoices.filter((inv) => {
      const invDate = inv.paidAt ? new Date(inv.paidAt) : new Date(inv.createdAt);
      return isWithinInterval(invDate, { start: effectiveDateRange.from, end: effectiveDateRange.to });
    });

    const clientMap = new Map<string, { name: string; totalPaid: number; totalInvoiced: number; outstanding: number }>();

    filteredInvoices.forEach((inv) => {
      const client = clients.find((c) => c.id === inv.clientId);
      const clientName = client?.name || 'Unknown';
      const amount = inv.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

      if (!clientMap.has(inv.clientId)) {
        clientMap.set(inv.clientId, { name: clientName, totalPaid: 0, totalInvoiced: 0, outstanding: 0 });
      }

      const entry = clientMap.get(inv.clientId)!;
      entry.totalInvoiced += amount;
      if (inv.status === 'paid') {
        entry.totalPaid += amount;
      } else {
        entry.outstanding += amount;
      }
    });

    return Array.from(clientMap.values()).sort((a, b) => b.totalPaid - a.totalPaid);
  }, [invoices, clients, effectiveDateRange]);

  // Materials/Expenses by Category (filtered by date range)
  const expensesByCategory = useMemo(() => {
    const categoryMap = new Map<string, number>();

    projects.forEach((project) => {
      project.receipts.forEach((receipt) => {
        const receiptDate = new Date(receipt.createdAt);
        if (!isWithinInterval(receiptDate, { start: effectiveDateRange.from, end: effectiveDateRange.to })) {
          return;
        }
        const category = 'Supplies'; // Default - will enhance when category_id is available
        categoryMap.set(category, (categoryMap.get(category) || 0) + receipt.amount);
      });
    });

    return Array.from(categoryMap.entries()).map(([name, total]) => ({ name, total }));
  }, [projects, effectiveDateRange]);

  // P&L Summary (filtered by date range)
  const profitLoss = useMemo(() => {
    const paidInvoices = invoices.filter((inv) => {
      if (inv.status !== 'paid') return false;
      const paidDate = inv.paidAt ? new Date(inv.paidAt) : new Date(inv.createdAt);
      return isWithinInterval(paidDate, { start: effectiveDateRange.from, end: effectiveDateRange.to });
    });
    
    const totalIncome = paidInvoices.reduce(
      (sum, inv) => sum + inv.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0),
      0
    );

    const totalExpenses = projects.reduce((sum, project) => {
      return sum + project.receipts.reduce((s, r) => {
        const receiptDate = new Date(r.createdAt);
        if (!isWithinInterval(receiptDate, { start: effectiveDateRange.from, end: effectiveDateRange.to })) {
          return s;
        }
        return s + r.amount;
      }, 0);
    }, 0);

    return {
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
    };
  }, [invoices, projects, effectiveDateRange]);

  return {
    loading,
    invoiceAging,
    incomeByClient,
    expensesByCategory,
    profitLoss,
    userSettings,
  };
}
