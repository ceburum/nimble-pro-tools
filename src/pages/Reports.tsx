import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useReportsData, DateRange } from '@/hooks/useReportsData';
import { useFinancialPro } from '@/hooks/useFinancialPro';
import { InvoiceAgingReport } from '@/components/reports/InvoiceAgingReport';
import { IncomeByClientReport } from '@/components/reports/IncomeByClientReport';
import { ProfitLossReport } from '@/components/reports/ProfitLossReport';
import { DateRangeFilter } from '@/components/reports/DateRangeFilter';
import { StatementReconciliation } from '@/components/reports/StatementReconciliation';
import { Clock, Users, TrendingUp, FileCheck, Lock, BarChart3, FileText, Calculator } from 'lucide-react';
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

  // Show upgrade prompt if not enabled
  if (!loading && !isEnabled) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Financial Pro"
          description="Financial insights, tax reporting & reconciliation"
        />

        <Card className="max-w-2xl mx-auto">
          <CardContent className="py-12 text-center">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            
            <h2 className="text-2xl font-bold mb-4">Unlock Financial Pro</h2>
            
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Advanced financial reporting, bank statement reconciliation, 
              P&L statements, and expense categorization — all in one place.
            </p>

            <div className="grid gap-3 text-left max-w-sm mx-auto mb-8">
              <div className="flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span>Invoice aging & client income reports</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span>Profit & Loss statements by category</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FileCheck className="h-4 w-4 text-primary" />
                <span>Bank statement reconciliation (CSV)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calculator className="h-4 w-4 text-primary" />
                <span>IRS Schedule C expense categorization</span>
              </div>
            </div>

            <Button size="lg" onClick={handleEnableFinancialPro}>
              Enable Financial Pro
            </Button>

            <p className="text-xs text-muted-foreground mt-6">
              Works standalone or integrates with Tax Pro for complete tax preparation
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
