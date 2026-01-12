import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { DollarSign, Car, Package, Users, FileText, TrendingUp, AlertCircle } from 'lucide-react';
import { TaxDisclaimer } from './TaxDisclaimer';
import { useCapitalAssets } from '@/hooks/useCapitalAssets';
import { use1099Tracking } from '@/hooks/use1099Tracking';
import { useIrsMileageRates } from '@/hooks/useIrsMileageRates';
import { useMileageTrips } from '@/hooks/useMileageTrips';
import { useInvoices } from '@/hooks/useInvoices';
import { useCategorizedExpenses } from '@/hooks/useCategorizedExpenses';
import { useFinancialPro } from '@/hooks/useFinancialPro';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

interface TaxProOverviewProps {
  selectedYear: number;
}

export function TaxProOverview({ selectedYear }: TaxProOverviewProps) {
  const { totalAssetValue, assets, loading: assetsLoading } = useCapitalAssets();
  const { eligible1099Clients, getClientsNear1099Threshold, loading: clientsLoading } = use1099Tracking();
  const { getRateForYear } = useIrsMileageRates();
  const { trips, loading: mileageLoading } = useMileageTrips();
  const { invoices, loading: invoicesLoading } = useInvoices();
  const { isEnabled: hasFinancialPro } = useFinancialPro();
  
  // Use categorized expenses for accurate tax reporting
  const { 
    totalCategorized, 
    totalUncategorized, 
    uncategorizedExpenses,
    byIrsCode,
    loading: expensesLoading 
  } = useCategorizedExpenses(undefined, selectedYear);

  const loading = assetsLoading || clientsLoading || mileageLoading || invoicesLoading || expensesLoading;

  // Calculate year-specific data
  const yearTrips = trips.filter(t => t.startTime && new Date(t.startTime).getFullYear() === selectedYear);
  const totalMiles = yearTrips.reduce((sum, t) => sum + (t.distance || 0), 0);
  const mileageRate = getRateForYear(selectedYear);
  const estimatedMileageDeduction = totalMiles * mileageRate;

  const yearInvoices = invoices.filter(inv => new Date(inv.createdAt).getFullYear() === selectedYear && inv.status === 'paid');
  const totalIncome = yearInvoices.reduce((sum, inv) => 
    sum + inv.items.reduce((itemSum, item) => itemSum + (item.quantity * item.unitPrice), 0), 0
  );

  // Total expenses now includes categorized + uncategorized
  const totalExpenses = totalCategorized + totalUncategorized;

  const clients1099 = getClientsNear1099Threshold(selectedYear);
  const clientsMeetingThreshold = clients1099.filter(c => c.meetsThreshold).length;

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const formatNumber = (num: number) => 
    new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(num);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TaxDisclaimer variant="card" />

      {/* Uncategorized Expense Prompt */}
      {uncategorizedExpenses.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="text-amber-800">
              You have {uncategorizedExpenses.length} expense{uncategorizedExpenses.length !== 1 ? 's' : ''} without IRS categories ({formatCurrency(totalUncategorized)}).
              Assign IRS Schedule C categories for accurate tax reporting.
            </span>
            <Button asChild variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-100">
              <Link to="/tax-pro?tab=categorize">Categorize Now</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Income */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
            <p className="text-xs text-muted-foreground">
              From {yearInvoices.length} paid invoice{yearInvoices.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">
              {byIrsCode.length} categor{byIrsCode.length !== 1 ? 'ies' : 'y'}
              {totalUncategorized > 0 && ` + ${formatCurrency(totalUncategorized)} uncategorized`}
            </p>
          </CardContent>
        </Card>

        {/* Mileage Deduction */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mileage Deduction</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(estimatedMileageDeduction)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(totalMiles)} miles @ ${mileageRate}/mi
            </p>
          </CardContent>
        </Card>

        {/* Capital Assets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capital Assets</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAssetValue)}</div>
            <p className="text-xs text-muted-foreground">
              {assets.length} asset{assets.length !== 1 ? 's' : ''} tracked
            </p>
          </CardContent>
        </Card>

        {/* 1099 Recipients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">1099 Recipients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientsMeetingThreshold}</div>
            <p className="text-xs text-muted-foreground">
              Of {eligible1099Clients.length} eligible client{eligible1099Clients.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        {/* Net Profit */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit (Est.)</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalIncome - totalExpenses - estimatedMileageDeduction >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalIncome - totalExpenses - estimatedMileageDeduction)}
            </div>
            <p className="text-xs text-muted-foreground">
              Income - Expenses - Mileage
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
