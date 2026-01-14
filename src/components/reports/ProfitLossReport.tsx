import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, DollarSign, Download, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { ProfitLossExportDialog } from './ProfitLossExportDialog';

interface ProfitLossData {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
}

interface ExpenseCategory {
  name: string;
  total: number;
  irsCode?: string | null;
}

interface ProfitLossReportProps {
  data: ProfitLossData;
  expensesByCategory: ExpenseCategory[];
  dateRange?: { from: Date; to: Date };
  comparisonData?: ProfitLossData;
}

export function ProfitLossReport({ data, expensesByCategory, dateRange, comparisonData }: ProfitLossReportProps) {
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  
  const isProfit = data.netProfit >= 0;
  const profitMargin = data.totalIncome > 0 ? (data.netProfit / data.totalIncome) * 100 : 0;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  // Calculate comparison percentages if comparison data exists
  const getComparison = (current: number, previous: number | undefined) => {
    if (!previous || previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    return {
      percent: Math.abs(change).toFixed(1),
      isUp: change >= 0,
    };
  };

  const incomeComparison = comparisonData ? getComparison(data.totalIncome, comparisonData.totalIncome) : null;
  const expenseComparison = comparisonData ? getComparison(data.totalExpenses, comparisonData.totalExpenses) : null;
  const profitComparison = comparisonData ? getComparison(data.netProfit, comparisonData.netProfit) : null;

  // Sort categories by total (largest first)
  const sortedCategories = [...expensesByCategory].sort((a, b) => b.total - a.total);

  // Default date range if not provided
  const effectiveDateRange = dateRange || {
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date(new Date().getFullYear(), 11, 31),
  };

  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setExportDialogOpen(true)}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards with Visual Highlights */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-success">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-success/10">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Total Income</p>
                <p className="text-2xl font-semibold text-success">{formatCurrency(data.totalIncome)}</p>
                {incomeComparison && (
                  <div className={`flex items-center gap-1 text-xs mt-1 ${incomeComparison.isUp ? 'text-success' : 'text-destructive'}`}>
                    {incomeComparison.isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {incomeComparison.percent}% vs prior period
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-destructive/10">
                <TrendingDown className="h-6 w-6 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-semibold text-destructive">{formatCurrency(data.totalExpenses)}</p>
                {expenseComparison && (
                  <div className={`flex items-center gap-1 text-xs mt-1 ${!expenseComparison.isUp ? 'text-success' : 'text-destructive'}`}>
                    {expenseComparison.isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {expenseComparison.percent}% vs prior period
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${isProfit ? 'border-l-success' : 'border-l-destructive'}`}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${isProfit ? 'bg-success/10' : 'bg-destructive/10'}`}>
                <DollarSign className={`h-6 w-6 ${isProfit ? 'text-success' : 'text-destructive'}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Net {isProfit ? 'Profit' : 'Loss'}</p>
                <p className={`text-2xl font-semibold ${isProfit ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(Math.abs(data.netProfit))}
                </p>
                <p className="text-xs text-muted-foreground">{profitMargin.toFixed(1)}% margin</p>
                {profitComparison && (
                  <div className={`flex items-center gap-1 text-xs mt-1 ${profitComparison.isUp ? 'text-success' : 'text-destructive'}`}>
                    {profitComparison.isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {profitComparison.percent}% vs prior period
                  </div>
                )}
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
              <span className="font-medium">{formatCurrency(data.totalIncome)}</span>
            </div>
            <div className="flex justify-between py-2 px-4 border-t font-semibold">
              <span>Total Income</span>
              <span className="text-success">{formatCurrency(data.totalIncome)}</span>
            </div>
          </div>

          <Separator />

          {/* Expenses Section */}
          <div>
            <h3 className="font-medium text-destructive mb-2">Expenses by Category</h3>
            {sortedCategories.length > 0 ? (
              <div className="space-y-1">
                {sortedCategories.map((category, index) => (
                  <div key={index} className="flex justify-between items-center py-2 px-4 bg-muted/50 rounded">
                    <div className="flex items-center gap-2">
                      <span>{category.name}</span>
                      {category.irsCode && (
                        <Badge variant="outline" className="text-xs">
                          {category.irsCode}
                        </Badge>
                      )}
                    </div>
                    <span className="font-medium">{formatCurrency(category.total)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex justify-between py-2 px-4 bg-muted/50 rounded">
                <span className="text-muted-foreground">No categorized expenses</span>
                <span className="font-medium">{formatCurrency(data.totalExpenses)}</span>
              </div>
            )}
            <div className="flex justify-between py-2 px-4 border-t font-semibold mt-2">
              <span>Total Expenses</span>
              <span className="text-destructive">{formatCurrency(data.totalExpenses)}</span>
            </div>
          </div>

          <Separator />

          {/* Net Profit - Highlighted */}
          <div className={`flex justify-between py-4 px-4 rounded-lg ${isProfit ? 'bg-success/10 border border-success/20' : 'bg-destructive/10 border border-destructive/20'}`}>
            <span className="font-semibold text-lg">Net {isProfit ? 'Profit' : 'Loss'}</span>
            <span className={`font-bold text-lg ${isProfit ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(Math.abs(data.netProfit))}
            </span>
          </div>

          {sortedCategories.length === 0 && data.totalExpenses > 0 && (
            <p className="text-sm text-muted-foreground">
              💡 Tip: Assign IRS categories to your expenses in Statement Reconciliation for a detailed breakdown.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Export Dialog */}
      <ProfitLossExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        data={data}
        expensesByCategory={sortedCategories}
        dateRange={effectiveDateRange}
      />
    </div>
  );
}
