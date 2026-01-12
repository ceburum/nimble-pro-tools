import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useMileageTrips } from '@/hooks/useMileageTrips';
import { useIrsMileageRates } from '@/hooks/useIrsMileageRates';
import { TaxDisclaimer } from './TaxDisclaimer';
import { Car, TrendingUp } from 'lucide-react';

interface TaxMileageSummaryProps {
  selectedYear: number;
}

export function TaxMileageSummary({ selectedYear }: TaxMileageSummaryProps) {
  const { trips, loading: tripsLoading } = useMileageTrips();
  const { rates, getRateForYear, loading: ratesLoading } = useIrsMileageRates();

  const loading = tripsLoading || ratesLoading;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const formatNumber = (num: number) =>
    new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(num);

  // Group trips by year
  const tripsByYear = trips.reduce((acc, trip) => {
    if (!trip.startTime) return acc;
    const year = new Date(trip.startTime).getFullYear();
    if (!acc[year]) {
      acc[year] = { miles: 0, trips: 0 };
    }
    acc[year].miles += trip.distance || 0;
    acc[year].trips += 1;
    return acc;
  }, {} as Record<number, { miles: number; trips: number }>);

  // Get all years with data, sorted descending
  const yearsWithData = Object.keys(tripsByYear)
    .map(Number)
    .sort((a, b) => b - a);

  const currentYearData = tripsByYear[selectedYear] || { miles: 0, trips: 0 };
  const currentRate = getRateForYear(selectedYear);
  const estimatedDeduction = currentYearData.miles * currentRate;

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-24" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TaxDisclaimer variant="card" />

      {/* Selected Year Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Car className="h-4 w-4" />
              {selectedYear} Miles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(currentYearData.miles)}</div>
            <p className="text-xs text-muted-foreground">
              {currentYearData.trips} trip{currentYearData.trips !== 1 ? 's' : ''} logged
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">IRS Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${currentRate.toFixed(3)}</div>
            <p className="text-xs text-muted-foreground">per mile</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Est. Deduction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(estimatedDeduction)}</div>
            <p className="text-xs text-muted-foreground">informational only</p>
          </CardContent>
        </Card>
      </div>

      {/* Year-by-Year Summary */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Mileage by Year</h3>

        {yearsWithData.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No mileage recorded yet.</p>
              <p className="text-sm mt-2">Track trips in Mileage Pro to see tax summaries.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {yearsWithData.map((year) => {
              const data = tripsByYear[year];
              const rate = getRateForYear(year);
              const deduction = data.miles * rate;
              const isCurrentYear = year === new Date().getFullYear();

              return (
                <Card key={year} className={year === selectedYear ? 'border-primary' : ''}>
                  <CardContent className="py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="text-lg font-semibold">{year}</div>
                        {isCurrentYear && (
                          <Badge variant="secondary" className="text-xs">Current Year</Badge>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Miles: </span>
                          <span className="font-medium">{formatNumber(data.miles)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Trips: </span>
                          <span className="font-medium">{data.trips}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Rate: </span>
                          <span className="font-medium">${rate.toFixed(3)}/mi</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Est. Deduction: </span>
                          <span className="font-medium text-green-600">{formatCurrency(deduction)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* IRS Rate History */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">IRS Mileage Rates</h3>
        <Card>
          <CardContent className="py-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {rates.map((rate) => (
                <div key={rate.year} className="text-center">
                  <div className="text-sm text-muted-foreground">{rate.year}</div>
                  <div className="font-medium">${rate.ratePerMile.toFixed(3)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
