import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useReportsData, DateRange } from '@/hooks/useReportsData';
import { InvoiceAgingReport } from '@/components/reports/InvoiceAgingReport';
import { IncomeByClientReport } from '@/components/reports/IncomeByClientReport';
import { ProfitLossReport } from '@/components/reports/ProfitLossReport';

import { PartnerSuggestions } from '@/components/reports/PartnerSuggestions';
import { DateRangeFilter } from '@/components/reports/DateRangeFilter';
import { StatementReconciliation } from '@/components/reports/StatementReconciliation';
import { Clock, Users, TrendingUp, FileCheck } from 'lucide-react';
import { startOfYear, endOfYear } from 'date-fns';

export default function Reports() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfYear(new Date()),
    to: endOfYear(new Date()),
  });

  const { loading, invoiceAging, incomeByClient, expensesByCategory, profitLoss } = useReportsData(dateRange);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Reports" description="Financial insights and analytics" />
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
      <PageHeader title="Reports" description="Financial insights and analytics" />

      <PartnerSuggestions />

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
    </div>
  );
}
