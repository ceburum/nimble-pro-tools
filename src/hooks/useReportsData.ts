import { useMemo } from 'react';
import { useInvoices } from './useInvoices';
import { useProjects } from './useProjects';
import { useClients } from './useClients';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { format, differenceInDays, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';

interface MileageEntry {
  id: string;
  distance: number;
  start_time: string;
  end_time: string | null;
  purpose: string | null;
}

interface UserSettings {
  irs_mileage_rate: number;
  tax_rate_estimate: number;
}

export function useReportsData() {
  const { invoices, loading: invoicesLoading } = useInvoices();
  const { projects, loading: projectsLoading } = useProjects();
  const { clients, loading: clientsLoading } = useClients();
  const [mileageEntries, setMileageEntries] = useState<MileageEntry[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings>({ irs_mileage_rate: 0.67, tax_rate_estimate: 0.25 });
  const [mileageLoading, setMileageLoading] = useState(true);

  useEffect(() => {
    const fetchMileageAndSettings = async () => {
      try {
        const [mileageResult, settingsResult] = await Promise.all([
          supabase.from('mileage_entries').select('*').order('start_time', { ascending: false }),
          supabase.from('user_settings').select('irs_mileage_rate, tax_rate_estimate').single(),
        ]);

        if (mileageResult.data) {
          setMileageEntries(mileageResult.data as MileageEntry[]);
        }

        if (settingsResult.data) {
          setUserSettings({
            irs_mileage_rate: Number(settingsResult.data.irs_mileage_rate) || 0.67,
            tax_rate_estimate: Number(settingsResult.data.tax_rate_estimate) || 0.25,
          });
        }
      } catch (error) {
        console.error('Error fetching mileage/settings:', error);
      } finally {
        setMileageLoading(false);
      }
    };

    fetchMileageAndSettings();
  }, []);

  const loading = invoicesLoading || projectsLoading || clientsLoading || mileageLoading;

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

  // Income by Client
  const incomeByClient = useMemo(() => {
    const paidInvoices = invoices.filter((inv) => inv.status === 'paid');
    const clientMap = new Map<string, { name: string; totalPaid: number; totalInvoiced: number; outstanding: number }>();

    invoices.forEach((inv) => {
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
  }, [invoices, clients]);

  // Materials/Expenses by Category
  const expensesByCategory = useMemo(() => {
    const categoryMap = new Map<string, number>();

    projects.forEach((project) => {
      project.receipts.forEach((receipt) => {
        const category = 'Supplies'; // Default - will enhance when category_id is available
        categoryMap.set(category, (categoryMap.get(category) || 0) + receipt.amount);
      });
    });

    return Array.from(categoryMap.entries()).map(([name, total]) => ({ name, total }));
  }, [projects]);

  // P&L Summary
  const profitLoss = useMemo(() => {
    const paidInvoices = invoices.filter((inv) => inv.status === 'paid');
    const totalIncome = paidInvoices.reduce(
      (sum, inv) => sum + inv.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0),
      0
    );

    const totalExpenses = projects.reduce(
      (sum, project) => sum + project.receipts.reduce((s, r) => s + r.amount, 0),
      0
    );

    return {
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
    };
  }, [invoices, projects]);

  // Mileage Deduction
  const mileageDeduction = useMemo(() => {
    // Combine project mileage and standalone mileage entries
    const projectMiles = projects.reduce(
      (sum, project) => sum + project.mileageEntries.reduce((s, m) => s + m.distance, 0),
      0
    );

    const standaloneMiles = mileageEntries.reduce((sum, m) => sum + Number(m.distance), 0);
    const totalMiles = projectMiles + standaloneMiles;
    const deduction = totalMiles * userSettings.irs_mileage_rate;

    return {
      totalMiles,
      rate: userSettings.irs_mileage_rate,
      deduction,
    };
  }, [projects, mileageEntries, userSettings]);

  return {
    loading,
    invoiceAging,
    incomeByClient,
    expensesByCategory,
    profitLoss,
    mileageDeduction,
    userSettings,
  };
}
