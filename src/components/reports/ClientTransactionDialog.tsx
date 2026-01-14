import { useState } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useInvoices, Invoice } from '@/hooks/useInvoices';
import { useClients } from '@/hooks/useClients';
import { InvoiceEditDialog } from '@/components/invoices/InvoiceEditDialog';
import { Mail, Phone, MapPin, Eye, Edit, DollarSign, Clock, CheckCircle } from 'lucide-react';

interface ClientTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
}

export function ClientTransactionDialog({ open, onOpenChange, clientId, clientName }: ClientTransactionDialogProps) {
  const { invoices, updateInvoice } = useInvoices();
  const { clients } = useClients();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const client = clients.find(c => c.id === clientId);
  const clientInvoices = invoices.filter(inv => inv.clientId === clientId);
  
  // Sort by date, newest first
  const sortedInvoices = [...clientInvoices].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const totalInvoiced = clientInvoices.reduce((sum, inv) => 
    sum + inv.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0), 0
  );
  
  const totalPaid = clientInvoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0), 0);
  
  const totalOutstanding = totalInvoiced - totalPaid;

  const handleInvoiceClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setEditDialogOpen(true);
  };

  const handleSaveInvoice = async (updatedInvoice: Invoice) => {
    await updateInvoice(updatedInvoice.id, updatedInvoice);
    setEditDialogOpen(false);
  };

  const getInvoiceTotal = (invoice: Invoice) => {
    return invoice.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  };

  const initials = clientName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Client Details & Transaction History</DialogTitle>
          </DialogHeader>

          {/* Client Info Header */}
          <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-primary">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold">{clientName}</h3>
              {client && (
                <div className="space-y-1 mt-2 text-sm text-muted-foreground">
                  {client.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5" />
                      <span>{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{client.address}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-full bg-muted">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Invoiced</p>
                  <p className="text-lg font-semibold">${totalInvoiced.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-full bg-success/10">
                  <CheckCircle className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Paid</p>
                  <p className="text-lg font-semibold text-success">${totalPaid.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-full bg-warning/10">
                  <Clock className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Outstanding</p>
                  <p className="text-lg font-semibold text-warning">${totalOutstanding.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transaction History */}
          <div className="space-y-3">
            <h4 className="font-medium">Transaction History ({sortedInvoices.length})</h4>
            
            {sortedInvoices.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No transactions found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedInvoices.map((invoice) => (
                    <TableRow 
                      key={invoice.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleInvoiceClick(invoice)}
                    >
                      <TableCell className="text-sm">
                        {format(new Date(invoice.createdAt), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={invoice.status === 'paid' ? 'default' : 'secondary'}
                          className={invoice.status === 'paid' ? 'bg-success/20 text-success border-success/30' : ''}
                        >
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${getInvoiceTotal(invoice).toLocaleString()}
                      </TableCell>
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
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Edit Dialog */}
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
