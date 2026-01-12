import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCategorizedExpenses } from '@/hooks/useCategorizedExpenses';
import { TaxDisclaimer } from './TaxDisclaimer';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, FileText } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ScheduleCBreakdownProps {
  selectedYear: number;
}

export function ScheduleCBreakdown({ selectedYear }: ScheduleCBreakdownProps) {
  const {
    byIrsCode,
    totalExpenses,
    uncategorizedCount,
    loading,
    irsLineNames,
  } = useCategorizedExpenses(undefined, selectedYear);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TaxDisclaimer variant="banner" />

      {uncategorizedCount > 0 && (
        <Alert variant="default" className="border-warning bg-warning/10">
          <AlertCircle className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning">Uncategorized Expenses</AlertTitle>
          <AlertDescription>
            You have {uncategorizedCount} expense{uncategorizedCount !== 1 ? 's' : ''} without IRS categories.
            Categorize them in Financial Pro for more accurate Schedule C reporting.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>Schedule C Expense Breakdown</CardTitle>
          </div>
          <CardDescription>
            Expenses organized by IRS Schedule C line items for {selectedYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60%]">Schedule C Line</TableHead>
                <TableHead className="text-center">Items</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byIrsCode.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    No expenses recorded for {selectedYear}
                  </TableCell>
                </TableRow>
              ) : (
                byIrsCode.map((item) => (
                  <TableRow key={item.irsCode}>
                    <TableCell>
                      <div className="space-y-1">
                        <span className="font-medium">{item.lineName}</span>
                        {item.categories.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.categories.map((cat) => (
                              <Badge key={cat} variant="secondary" className="text-xs">
                                {cat}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{item.count}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.total)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <Separator className="my-4" />

          <div className="flex justify-between items-center py-2 px-4 bg-muted rounded-lg">
            <span className="font-semibold text-lg">Total Expenses (Part II, Line 28)</span>
            <span className="font-bold text-lg">{formatCurrency(totalExpenses)}</span>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            This breakdown organizes your expenses according to IRS Schedule C (Form 1040) categories.
            Consult with your tax professional for accurate filing.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
