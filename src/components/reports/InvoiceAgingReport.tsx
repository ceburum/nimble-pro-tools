import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useClients } from '@/hooks/useClients';
import { format } from 'date-fns';
import { AlertCircle, Clock, AlertTriangle, XCircle } from 'lucide-react';

interface InvoiceAgingData {
  current: { invoices: any[]; total: number };
  days30to60: { invoices: any[]; total: number };
  days60to90: { invoices: any[]; total: number };
  over90: { invoices: any[]; total: number };
  totalOutstanding: number;
}

interface InvoiceAgingReportProps {
  data: InvoiceAgingData;
}

export function InvoiceAgingReport({ data }: InvoiceAgingReportProps) {
  const { clients } = useClients();

  const getClientName = (clientId: string) => {
    return clients.find((c) => c.id === clientId)?.name || 'Unknown';
  };

  const getInvoiceTotal = (invoice: any) => {
    return invoice.items.reduce((sum: number, item: any) => sum + item.quantity * item.unitPrice, 0);
  };

  const buckets = [
    { key: 'current', label: 'Current (Not Due)', data: data.current, icon: Clock, color: 'bg-success/10 text-success' },
    { key: 'days30to60', label: '1-30 Days Overdue', data: data.days30to60, icon: AlertCircle, color: 'bg-warning/10 text-warning' },
    { key: 'days60to90', label: '31-60 Days Overdue', data: data.days60to90, icon: AlertTriangle, color: 'bg-orange-100 text-orange-600' },
    { key: 'over90', label: '60+ Days Overdue', data: data.over90, icon: XCircle, color: 'bg-destructive/10 text-destructive' },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {buckets.map((bucket) => (
          <Card key={bucket.key}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${bucket.color}`}>
                  <bucket.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{bucket.label}</p>
                  <p className="text-lg font-semibold">${bucket.data.total.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{bucket.data.invoices.length} invoice(s)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Total Outstanding */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Total Outstanding</span>
            <span className="text-2xl text-primary">${data.totalOutstanding.toLocaleString()}</span>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Detail Tables */}
      {buckets.map((bucket) => (
        bucket.data.invoices.length > 0 && (
          <Card key={bucket.key}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <bucket.icon className="h-4 w-4" />
                {bucket.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bucket.data.invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{getClientName(invoice.clientId)}</TableCell>
                      <TableCell>{format(invoice.dueDate, 'MMM d, yyyy')}</TableCell>
                      <TableCell className="text-right">${getInvoiceTotal(invoice).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )
      ))}
    </div>
  );
}
