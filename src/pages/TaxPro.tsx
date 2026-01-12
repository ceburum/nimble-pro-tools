import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TaxProOverview } from '@/components/tax-pro/TaxProOverview';
import { Form1099Management } from '@/components/tax-pro/Form1099Management';
import { CapitalAssetList } from '@/components/tax-pro/CapitalAssetList';
import { TaxMileageSummary } from '@/components/tax-pro/TaxMileageSummary';
import { TaxExportDialog } from '@/components/tax-pro/TaxExportDialog';
import { TaxDisclaimer } from '@/components/tax-pro/TaxDisclaimer';
import { useTaxPro } from '@/hooks/useTaxPro';
import { Calculator, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function TaxPro() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const { isEnabled, loading, enableTaxPro } = useTaxPro();

  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  const handleEnableTaxPro = async () => {
    const success = await enableTaxPro();
    if (success) {
      toast.success('Tax Pro enabled!');
    } else {
      toast.error('Failed to enable Tax Pro');
    }
  };

  // Show upgrade prompt if not enabled
  if (!loading && !isEnabled) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Tax Pro"
          description="Tax organization for contractors & small businesses"
        />

        <Card className="max-w-2xl mx-auto">
          <CardContent className="py-12 text-center">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            
            <h2 className="text-2xl font-bold mb-4">Unlock Tax Pro</h2>
            
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Organize your tax data, track 1099 payments, manage capital assets, 
              and generate CPA-ready exports — all in one place.
            </p>

            <div className="grid gap-3 text-left max-w-sm mx-auto mb-8">
              <div className="flex items-center gap-2 text-sm">
                <Calculator className="h-4 w-4 text-primary" />
                <span>1099 payment tracking & threshold alerts</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calculator className="h-4 w-4 text-primary" />
                <span>Capital asset & equipment registry</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calculator className="h-4 w-4 text-primary" />
                <span>Mileage tax summaries by year</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calculator className="h-4 w-4 text-primary" />
                <span>CPA-ready CSV & PDF exports</span>
              </div>
            </div>

            <Button size="lg" onClick={handleEnableTaxPro}>
              Enable Tax Pro
            </Button>

            <TaxDisclaimer variant="inline" className="mt-6 justify-center" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tax Pro"
        description="Tax organization for contractors & small businesses"
        action={
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
        }
      />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="1099">1099s</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="mileage">Mileage</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <TaxProOverview selectedYear={selectedYear} />
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
    </div>
  );
}
