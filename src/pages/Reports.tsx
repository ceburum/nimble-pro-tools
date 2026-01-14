import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useReportsData, DateRange } from '@/hooks/useReportsData';
import { useFinancialTool } from '@/hooks/useFinancialTool';
import { InvoiceAgingReport } from '@/components/reports/InvoiceAgingReport';
import { IncomeByClientReport } from '@/components/reports/IncomeByClientReport';
import { ProfitLossReport } from '@/components/reports/ProfitLossReport';
import { DateRangeFilter } from '@/components/reports/DateRangeFilter';
import { StatementReconciliation } from '@/components/reports/StatementReconciliation';
import { TaxProOverview } from '@/components/tax-pro/TaxProOverview';
import { Form1099Management } from '@/components/tax-pro/Form1099Management';
import { CapitalAssetList } from '@/components/tax-pro/CapitalAssetList';
import { TaxMileageSummary } from '@/components/tax-pro/TaxMileageSummary';
import { ScheduleCBreakdown } from '@/components/tax-pro/ScheduleCBreakdown';
import { UncategorizedExpensesList } from '@/components/tax-pro/UncategorizedExpensesList';
import { QuickExpenseEntry } from '@/components/tax-pro/QuickExpenseEntry';
import { TaxExportDialog } from '@/components/tax-pro/TaxExportDialog';
import { TaxDisclaimer } from '@/components/tax-pro/TaxDisclaimer';
import { FeatureNotice } from '@/components/ui/feature-notice';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Users, TrendingUp, FileCheck, BarChart3, Calculator, Receipt, FileText } from 'lucide-react';
import { startOfYear, endOfYear } from 'date-fns';
import { toast } from 'sonner';

export default function Reports() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);
  
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfYear(new Date()),
    to: endOfYear(new Date()),
  });

  const { loading: reportsLoading, invoiceAging, incomeByClient, expensesByCategory, profitLoss } = useReportsData(dateRange);
  const { isActive, loading: featureLoading, enableFinancialTool, startTrial, canStartTrial, isOnTrial, trialDaysRemaining } = useFinancialTool();

  const loading = reportsLoading || featureLoading;

  // Get current section from URL params (defaults to 'reports')
  const currentSection = searchParams.get('section') || 'reports';
  const currentTab = searchParams.get('tab') || (currentSection === 'reports' ? 'aging' : 'overview');

  const handleEnableFinancialTool = async () => {
    const success = await enableFinancialTool();
    if (success) {
      toast.success('Financial Tool enabled!');
    } else {
      toast.error('Failed to enable Financial Tool');
    }
  };

  const handleStartTrial = async () => {
    const success = await startTrial();
    if (success) {
      toast.success('Trial started! You have 7 days to explore all features.');
    } else {
      toast.error('Failed to start trial');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Financial Pro" description="Reports, tax prep & expense tracking" />
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
      <PageHeader 
        title="Financial Pro" 
        description="Reports, tax prep & expense tracking"
        action={
          isActive ? (
            <div className="flex items-center gap-3">
              {currentSection === 'tax' && (
                <>
                  <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <TaxExportDialog selectedYear={selectedYear} />
                </>
              )}
              {isOnTrial && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  Trial: {trialDaysRemaining} days left
                </span>
              )}
            </div>
          ) : undefined
        }
      />

      {/* Show inline notice if feature is not active */}
      {!isActive && (
        <FeatureNotice
          icon={<BarChart3 className="h-8 w-8 text-primary" />}
          title="Financial Pro"
          description="Complete financial management: P&L reports, bank reconciliation, 1099 tracking, Schedule C categorization, and AI-powered receipt scanning — all in one powerful add-on."
          features={[
            'Invoice aging & client income reports',
            'Profit & Loss statements with expense categories',
            'Bank statement reconciliation (CSV import)',
            'IRS Schedule C expense categorization',
            '1099 payment tracking & management',
            'Capital asset registry & depreciation hints',
            'AI Vision for receipts and documents',
          ]}
          onEnable={handleEnableFinancialTool}
          onStartTrial={canStartTrial ? handleStartTrial : undefined}
          className="max-w-2xl mx-auto"
        />
      )}

      {/* Show content when active */}
      {isActive && (
        <>
          {/* Section Tabs */}
          <Tabs 
            value={currentSection} 
            onValueChange={(value) => setSearchParams({ section: value })} 
            className="w-full"
          >
            <TabsList className="grid w-full max-w-xs grid-cols-2">
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Reports
              </TabsTrigger>
              <TabsTrigger value="tax" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Tax Prep
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Reports Section */}
          {currentSection === 'reports' && (
            <>
              <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />

              <Tabs 
                value={currentTab} 
                onValueChange={(value) => setSearchParams({ section: 'reports', tab: value })} 
                className="w-full"
              >
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
                    <ProfitLossReport 
                      data={profitLoss} 
                      expensesByCategory={expensesByCategory}
                      dateRange={dateRange}
                    />
                  </TabsContent>

                  <TabsContent value="reconcile">
                    <StatementReconciliation />
                  </TabsContent>
                </div>
              </Tabs>
            </>
          )}

          {/* Tax Prep Section */}
          {currentSection === 'tax' && (
            <>
              <QuickExpenseEntry />
              
              <Tabs 
                value={currentTab} 
                onValueChange={(value) => setSearchParams({ section: 'tax', tab: value })} 
                className="space-y-6"
              >
                <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 lg:w-auto lg:inline-grid">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="categorize">Categorize</TabsTrigger>
                  <TabsTrigger value="schedule-c">Schedule C</TabsTrigger>
                  <TabsTrigger value="1099">1099s</TabsTrigger>
                  <TabsTrigger value="assets">Assets</TabsTrigger>
                  <TabsTrigger value="mileage">Mileage</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <TaxProOverview selectedYear={selectedYear} />
                </TabsContent>

                <TabsContent value="categorize">
                  <UncategorizedExpensesList selectedYear={selectedYear} />
                </TabsContent>

                <TabsContent value="schedule-c">
                  <ScheduleCBreakdown selectedYear={selectedYear} />
                </TabsContent>

                <TabsContent value="1099">
                  <Form1099Management selectedYear={selectedYear} />
                </TabsContent>

                <TabsContent value="assets">
                  <CapitalAssetList />
                </TabsContent>

                <TabsContent value="mileage">
                  <TaxMileageSummary selectedYear={selectedYear} />
                </TabsContent>
              </Tabs>

              <TaxDisclaimer variant="inline" className="justify-center" />
            </>
          )}
        </>
      )}
    </div>
  );
}
