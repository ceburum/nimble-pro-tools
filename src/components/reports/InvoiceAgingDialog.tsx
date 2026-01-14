import { useState } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useClients } from '@/hooks/useClients';
import { useInvoices, Invoice } from '@/hooks/useInvoices';
import { InvoiceEditDialog } from '@/components/invoices/InvoiceEditDialog';
import { Eye, Edit } from 'lucide-react';

interface InvoiceAgingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  invoices: Invoice[];
}

export function InvoiceAgingDialog({ open, onOpenChange, title, invoices }: InvoiceAgingDialogProps) {
  const { clients } = useClients();
  const { updateInvoice } = useInvoices();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [viewMode, setViewMode] = useState(false);

  const getClientName = (clientId: string) => {
    return clients.find((c) => c.id === clientId)?.name || 'Unknown';
  };

  const getInvoiceTotal = (invoice: Invoice) => {
    return invoice.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  };

  const handleInvoiceClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setViewMode(invoice.status === 'paid');
    setEditDialogOpen(true);
  };

  const handleSaveInvoice = async (updatedInvoice: Invoice) => {
    await updateInvoice(updatedInvoice.id, updatedInvoice);
    setEditDialogOpen(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>

          {invoices.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No invoices in this category</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow 
                    key={invoice.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleInvoiceClick(invoice)}
                  >
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{getClientName(invoice.clientId)}</TableCell>
                    <TableCell>{format(invoice.dueDate, 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">${getInvoiceTotal(invoice).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        {invoice.status === 'paid' ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <Edit className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      {/* Invoice Edit Dialog - read-only for paid invoices */}
      <InvoiceEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        invoice={selectedInvoice}
        clients={clients}
        onSave={handleSaveInvoice}
      />
    </>
  );
}
