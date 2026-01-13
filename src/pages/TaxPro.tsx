import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TaxProOverview } from '@/components/tax-pro/TaxProOverview';
import { Form1099Management } from '@/components/tax-pro/Form1099Management';
import { CapitalAssetList } from '@/components/tax-pro/CapitalAssetList';
import { TaxMileageSummary } from '@/components/tax-pro/TaxMileageSummary';
import { TaxExportDialog } from '@/components/tax-pro/TaxExportDialog';
import { TaxDisclaimer } from '@/components/tax-pro/TaxDisclaimer';
import { ScheduleCBreakdown } from '@/components/tax-pro/ScheduleCBreakdown';
import { UncategorizedExpensesList } from '@/components/tax-pro/UncategorizedExpensesList';
import { FeatureNotice } from '@/components/ui/feature-notice';
import { useTaxPro } from '@/hooks/useTaxPro';
import { Calculator } from 'lucide-react';
import { toast } from 'sonner';

export default function TaxPro() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [searchParams, setSearchParams] = useSearchParams();
  const { isEnabled, loading, enableTaxPro } = useTaxPro();

  const currentTab = searchParams.get('tab') || 'overview';
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  const handleEnableTaxPro = async () => {
    const success = await enableTaxPro();
    if (success) {
      toast.success('Tax Pro enabled!');
    } else {
      toast.error('Failed to enable Tax Pro');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tax Pro"
        description="Tax organization for contractors & small businesses"
        action={
          isEnabled ? (
            <div className="flex items-center gap-3">
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
            </div>
          ) : undefined
        }
      />

      {/* Show inline notice if feature is not enabled */}
      {!isEnabled && (
        <FeatureNotice
          icon={<Calculator className="h-8 w-8 text-primary" />}
          title="Tax Pro"
          description="Organize your tax data, track 1099 payments, manage capital assets, and generate CPA-ready exports — all in one place."
          features={[
            '1099 payment tracking & threshold alerts',
            'Capital asset & equipment registry',
            'Mileage tax summaries by year',
            'CPA-ready CSV & PDF exports',
          ]}
          onEnable={handleEnableTaxPro}
          className="max-w-2xl mx-auto"
        />
      )}

      {/* Show content when enabled */}
      {isEnabled && (
        <>
          <Tabs value={currentTab} onValueChange={(value) => setSearchParams({ tab: value })} className="space-y-6">
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
    </div>
  );
}
