import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useReportsData } from '@/hooks/useReportsData';
import { InvoiceAgingReport } from '@/components/reports/InvoiceAgingReport';
import { IncomeByClientReport } from '@/components/reports/IncomeByClientReport';
import { ProfitLossReport } from '@/components/reports/ProfitLossReport';
import { MileageDeductionReport } from '@/components/reports/MileageDeductionReport';
import { PartnerSuggestions } from '@/components/reports/PartnerSuggestions';
import { Clock, Users, TrendingUp, Car } from 'lucide-react';

export default function Reports() {
  const { loading, invoiceAging, incomeByClient, expensesByCategory, profitLoss, mileageDeduction } = useReportsData();

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
          <TabsTrigger value="mileage" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            <span className="hidden sm:inline">Mileage</span>
            <span className="sm:hidden">Miles</span>
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

          <TabsContent value="mileage">
            <MileageDeductionReport data={mileageDeduction} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
