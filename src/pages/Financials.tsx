import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInvoices } from '@/hooks/useInvoices';
import { useCategorizedExpenses } from '@/hooks/useCategorizedExpenses';
import { useFinancialPro } from '@/hooks/useFinancialPro';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Receipt, Calculator, ChartBar, Loader2 } from 'lucide-react';
import { format, startOfYear, endOfYear, eachMonthOfInterval, isSameMonth, parseISO } from 'date-fns';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Financials() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  
  const { invoices, loading: invoicesLoading } = useInvoices();
  const { expenses, loading: expensesLoading } = useCategorizedExpenses();
  const { isEnabled: isFinancialProEnabled } = useFinancialPro();
  
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);
  
  // Calculate monthly data
  const monthlyData = useMemo(() => {
    const yearStart = startOfYear(new Date(selectedYear, 0, 1));
    const yearEnd = endOfYear(new Date(selectedYear, 0, 1));
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
    
    return months.map((month, index) => {
      // Calculate sales from paid invoices
      const monthSales = invoices
        .filter(inv => {
          if (inv.status !== 'paid' || !inv.paidAt) return false;
          const paidDate = typeof inv.paidAt === 'string' ? parseISO(inv.paidAt) : inv.paidAt;
          return isSameMonth(paidDate, month);
        })
        .reduce((sum, inv) => sum + inv.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0), 0);
      
      // Calculate expenses
      const monthExpenses = expenses
        .filter(exp => {
          const expDate = typeof exp.date === 'string' ? parseISO(exp.date) : exp.date;
          return isSameMonth(expDate, month);
        })
        .reduce((sum, exp) => sum + exp.amount, 0);
      
      const net = monthSales - monthExpenses;
      
      return {
        month: MONTHS[index],
        monthIndex: index,
        sales: monthSales,
        expenses: monthExpenses,
        net,
      };
    });
  }, [invoices, expenses, selectedYear]);
  
  // Calculate totals
  const totals = useMemo(() => {
    const totalSales = monthlyData.reduce((sum, m) => sum + m.sales, 0);
    const totalExpenses = monthlyData.reduce((sum, m) => sum + m.expenses, 0);
    const totalNet = totalSales - totalExpenses;
    return { sales: totalSales, expenses: totalExpenses, net: totalNet };
  }, [monthlyData]);
  
  // Filter chart data for selected month
  const chartData = selectedMonth !== null 
    ? monthlyData.filter(m => m.monthIndex === selectedMonth)
    : monthlyData;
  
  const loading = invoicesLoading || expensesLoading;
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Financials at a Glance"
        description="Year-to-date overview of your business performance"
        action={
          <div className="flex items-center gap-3">
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-28">
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
            {isFinancialProEnabled && (
              <Button variant="outline" asChild>
                <Link to="/reports">View Detailed Reports</Link>
              </Button>
            )}
          </div>
        }
      />
      
      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totals.sales.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Sales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Receipt className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totals.expenses.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Expenses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${totals.net >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                {totals.net >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-500" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div>
                <p className={`text-2xl font-bold ${totals.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${Math.abs(totals.net).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Net {totals.net >= 0 ? 'Profit' : 'Loss'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Overview Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2">
            <ChartBar className="h-5 w-5" />
            {selectedYear} Overview
          </CardTitle>
          {selectedMonth !== null && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedMonth(null)}>
              View All Months
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} className="text-xs" />
                <Tooltip
                  formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="sales" name="Sales" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Month by Month Grid */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Month by Month</h3>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {monthlyData.map((month) => {
            const isSelected = selectedMonth === month.monthIndex;
            const hasData = month.sales > 0 || month.expenses > 0;
            
            return (
              <button
                key={month.month}
                onClick={() => setSelectedMonth(isSelected ? null : month.monthIndex)}
                className={`p-4 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border bg-card hover:border-primary/50 hover:bg-primary/5'
                } ${!hasData ? 'opacity-60' : ''}`}
              >
                <p className="font-semibold text-sm mb-2">{month.month}</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sales</span>
                    <span className="text-green-600 font-medium">${month.sales.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Exp.</span>
                    <span className="text-red-600 font-medium">${month.expenses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-border">
                    <span className="text-muted-foreground">Net</span>
                    <span className={`font-bold ${month.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${Math.abs(month.net).toLocaleString()}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Financial Pro Upsell */}
      {!isFinancialProEnabled && (
        <Card className="bg-muted/50">
          <CardContent className="p-6 text-center">
            <Calculator className="h-10 w-10 mx-auto mb-3 text-primary" />
            <h3 className="font-semibold mb-2">Want more detailed reports?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Financial Pro includes P&L statements, bank reconciliation, and Schedule C preparation.
            </p>
            <Button variant="outline" asChild>
              <Link to="/reports">Explore Financial Pro</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
