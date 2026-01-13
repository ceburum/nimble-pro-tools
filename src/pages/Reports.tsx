import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useReportsData, DateRange } from '@/hooks/useReportsData';
import { useFinancialPro } from '@/hooks/useFinancialPro';
import { InvoiceAgingReport } from '@/components/reports/InvoiceAgingReport';
import { IncomeByClientReport } from '@/components/reports/IncomeByClientReport';
import { ProfitLossReport } from '@/components/reports/ProfitLossReport';
import { DateRangeFilter } from '@/components/reports/DateRangeFilter';
import { StatementReconciliation } from '@/components/reports/StatementReconciliation';
import { FeatureNotice } from '@/components/ui/feature-notice';
import { Clock, Users, TrendingUp, FileCheck, BarChart3, Calculator } from 'lucide-react';
import { startOfYear, endOfYear } from 'date-fns';
import { toast } from 'sonner';

export default function Reports() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfYear(new Date()),
    to: endOfYear(new Date()),
  });

  const { loading: reportsLoading, invoiceAging, incomeByClient, expensesByCategory, profitLoss } = useReportsData(dateRange);
  const { isEnabled, loading: featureLoading, enableFinancialPro } = useFinancialPro();

  const loading = reportsLoading || featureLoading;

  const handleEnableFinancialPro = async () => {
    const success = await enableFinancialPro();
    if (success) {
      toast.success('Financial Pro enabled!');
    } else {
      toast.error('Failed to enable Financial Pro');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Financial Pro" description="Financial insights, tax reporting & reconciliation" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-full max-w-md" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Financial Pro" description="Financial insights, tax reporting & reconciliation" />

      {/* Show inline notice if feature is not enabled */}
      {!isEnabled && (
        <FeatureNotice
          icon={<BarChart3 className="h-8 w-8 text-primary" />}
          title="Financial Pro"
          description="Advanced financial reporting, bank statement reconciliation, P&L statements, and expense categorization — all in one place."
          features={[
            'Invoice aging & client income reports',
            'Profit & Loss statements by category',
            'Bank statement reconciliation (CSV)',
            'IRS Schedule C expense categorization',
          ]}
          onEnable={handleEnableFinancialPro}
          className="max-w-2xl mx-auto"
        />
      )}

      {/* Show content when enabled */}
      {isEnabled && (
        <>
          <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />

          <Tabs defaultValue="aging" className="w-full">
            <TabsList className="grid w-full max-w-2xl grid-cols-4">
              <TabsTrigger value="aging" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Invoice Aging</span>
                <span className="sm:hidden">Aging</span>
              </TabsTrigger>
              <TabsTrigger value="clients" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">By Client</span>
                <span className="sm:hidden">Clients</span>
              </TabsTrigger>
              <TabsTrigger value="pnl" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Profit & Loss</span>
                <span className="sm:hidden">P&L</span>
              </TabsTrigger>
              <TabsTrigger value="reconcile" className="flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Reconcile</span>
                <span className="sm:hidden">Match</span>
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="aging">
                <InvoiceAgingReport data={invoiceAging} />
              </TabsContent>

              <TabsContent value="clients">
                <IncomeByClientReport data={incomeByClient} />
              </TabsContent>

              <TabsContent value="pnl">
                <ProfitLossReport data={profitLoss} expensesByCategory={expensesByCategory} />
              </TabsContent>

              <TabsContent value="reconcile">
                <StatementReconciliation />
              </TabsContent>
            </div>
          </Tabs>
        </>
      )}
    </div>
  );
}
