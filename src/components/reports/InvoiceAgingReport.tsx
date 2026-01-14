import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useClients } from '@/hooks/useClients';
import { useInvoices, Invoice } from '@/hooks/useInvoices';
import { InvoiceAgingDialog } from './InvoiceAgingDialog';
import { InvoiceEditDialog } from '@/components/invoices/InvoiceEditDialog';
import { format } from 'date-fns';
import { AlertCircle, Clock, AlertTriangle, XCircle, ChevronRight } from 'lucide-react';

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
  const { updateInvoice } = useInvoices();
  const [selectedBucket, setSelectedBucket] = useState<{ key: string; label: string; invoices: Invoice[] } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const getClientName = (clientId: string) => {
    return clients.find((c) => c.id === clientId)?.name || 'Unknown';
  };

  const getInvoiceTotal = (invoice: any) => {
    return invoice.items.reduce((sum: number, item: any) => sum + item.quantity * item.unitPrice, 0);
  };

  const buckets = [
    { key: 'current', label: 'Current (Not Due)', data: data.current, icon: Clock, color: 'bg-success/10 text-success', hoverColor: 'hover:bg-success/20' },
    { key: 'days30to60', label: '1-30 Days Overdue', data: data.days30to60, icon: AlertCircle, color: 'bg-warning/10 text-warning', hoverColor: 'hover:bg-warning/20' },
    { key: 'days60to90', label: '31-60 Days Overdue', data: data.days60to90, icon: AlertTriangle, color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/20', hoverColor: 'hover:bg-orange-200 dark:hover:bg-orange-900/30' },
    { key: 'over90', label: '60+ Days Overdue', data: data.over90, icon: XCircle, color: 'bg-destructive/10 text-destructive', hoverColor: 'hover:bg-destructive/20' },
  ];

  const handleBucketClick = (bucket: typeof buckets[0]) => {
    if (bucket.data.invoices.length > 0) {
      setSelectedBucket({
        key: bucket.key,
        label: bucket.label,
        invoices: bucket.data.invoices as Invoice[],
      });
      setDialogOpen(true);
    }
  };

  const handleInvoiceRowClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setEditDialogOpen(true);
  };

  const handleSaveInvoice = async (updatedInvoice: Invoice) => {
    await updateInvoice(updatedInvoice.id, updatedInvoice);
    setEditDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards - Now Clickable */}
      <div className="grid gap-4 md:grid-cols-4">
        {buckets.map((bucket) => (
          <Card 
            key={bucket.key}
            className={`cursor-pointer transition-all duration-200 ${bucket.data.invoices.length > 0 ? bucket.hoverColor : 'opacity-60'}`}
            onClick={() => handleBucketClick(bucket)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${bucket.color}`}>
                  <bucket.icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">{bucket.label}</p>
                  <p className="text-lg font-semibold">${bucket.data.total.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{bucket.data.invoices.length} invoice(s)</p>
                </div>
                {bucket.data.invoices.length > 0 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
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

      {/* Detail Tables - With Clickable Rows */}
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
                    <TableRow 
                      key={invoice.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleInvoiceRowClick(invoice)}
                    >
                      <TableCell className="font-medium text-primary">{invoice.invoiceNumber}</TableCell>
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

      {/* Dialog for viewing all invoices in a bucket */}
      {selectedBucket && (
        <InvoiceAgingDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title={selectedBucket.label}
          invoices={selectedBucket.invoices}
        />
      )}

      {/* Inline Edit Dialog */}
      <InvoiceEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        invoice={selectedInvoice}
        clients={clients}
        onSave={handleSaveInvoice}
      />
    </div>
  );
}
