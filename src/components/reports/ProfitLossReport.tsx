import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface ProfitLossData {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
}

interface ExpenseCategory {
  name: string;
  total: number;
}

interface ProfitLossReportProps {
  data: ProfitLossData;
  expensesByCategory: ExpenseCategory[];
}

export function ProfitLossReport({ data, expensesByCategory }: ProfitLossReportProps) {
  const isProfit = data.netProfit >= 0;
  const profitMargin = data.totalIncome > 0 ? (data.netProfit / data.totalIncome) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-success/10">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Income</p>
                <p className="text-2xl font-semibold text-success">${data.totalIncome.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-destructive/10">
                <TrendingDown className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-semibold text-destructive">${data.totalExpenses.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${isProfit ? 'bg-success/10' : 'bg-destructive/10'}`}>
                <DollarSign className={`h-6 w-6 ${isProfit ? 'text-success' : 'text-destructive'}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net {isProfit ? 'Profit' : 'Loss'}</p>
                <p className={`text-2xl font-semibold ${isProfit ? 'text-success' : 'text-destructive'}`}>
                  ${Math.abs(data.netProfit).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">{profitMargin.toFixed(1)}% margin</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed P&L */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profit & Loss Statement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Income Section */}
          <div>
            <h3 className="font-medium text-success mb-2">Income</h3>
            <div className="flex justify-between py-2 px-4 bg-muted/50 rounded">
              <span>Paid Invoices</span>
              <span className="font-medium">${data.totalIncome.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-2 px-4 border-t font-semibold">
              <span>Total Income</span>
              <span className="text-success">${data.totalIncome.toLocaleString()}</span>
            </div>
          </div>

          <Separator />

          {/* Expenses Section */}
          <div>
            <h3 className="font-medium text-destructive mb-2">Expenses</h3>
            {expensesByCategory.length > 0 ? (
              expensesByCategory.map((category, index) => (
                <div key={index} className="flex justify-between py-2 px-4 bg-muted/50 rounded mb-1">
                  <span>{category.name}</span>
                  <span className="font-medium">${category.total.toLocaleString()}</span>
                </div>
              ))
            ) : (
              <div className="flex justify-between py-2 px-4 bg-muted/50 rounded">
                <span>Materials & Supplies</span>
                <span className="font-medium">${data.totalExpenses.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between py-2 px-4 border-t font-semibold">
              <span>Total Expenses</span>
              <span className="text-destructive">${data.totalExpenses.toLocaleString()}</span>
            </div>
          </div>

          <Separator />

          {/* Net Profit */}
          <div className={`flex justify-between py-4 px-4 rounded-lg ${isProfit ? 'bg-success/10' : 'bg-destructive/10'}`}>
            <span className="font-semibold text-lg">Net {isProfit ? 'Profit' : 'Loss'}</span>
            <span className={`font-bold text-lg ${isProfit ? 'text-success' : 'text-destructive'}`}>
              ${Math.abs(data.netProfit).toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
