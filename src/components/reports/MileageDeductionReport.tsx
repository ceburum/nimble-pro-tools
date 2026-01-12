import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, DollarSign, Calculator } from 'lucide-react';

interface MileageDeductionData {
  totalMiles: number;
  rate: number;
  deduction: number;
}

interface MileageDeductionReportProps {
  data: MileageDeductionData;
}

export function MileageDeductionReport({ data }: MileageDeductionReportProps) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Car className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Miles</p>
                <p className="text-2xl font-semibold">{data.totalMiles.toLocaleString()} mi</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-muted">
                <Calculator className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">IRS Rate (2024)</p>
                <p className="text-2xl font-semibold">${data.rate.toFixed(2)}/mile</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-success/10">
                <DollarSign className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estimated Deduction</p>
                <p className="text-2xl font-semibold text-success">${data.deduction.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calculation Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Deduction Calculation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Business Miles</span>
              <span className="font-medium">{data.totalMiles.toLocaleString()} miles</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">× IRS Standard Rate</span>
              <span className="font-medium">${data.rate.toFixed(2)}</span>
            </div>
            <div className="border-t pt-3 flex justify-between">
              <span className="font-semibold">Mileage Deduction</span>
              <span className="font-bold text-success">${data.deduction.toLocaleString()}</span>
            </div>
          </div>

          <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-4">
            <p className="font-medium mb-2">📋 Important Notes:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>This is an estimate based on the IRS standard mileage rate for 2024</li>
              <li>Keep detailed mileage logs for tax documentation</li>
              <li>You may also deduct actual vehicle expenses instead (gas, maintenance, insurance)</li>
              <li>Consult a tax professional for personalized advice</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
