import { Receipt, Calendar, MoreVertical, Mail, MessageSquare, CreditCard, Download } from 'lucide-react';
import { Invoice, Client } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { downloadInvoice } from '@/lib/generateInvoicePdf';

interface InvoiceCardProps {
  invoice: Invoice;
  client?: Client;
  onSendEmail: (invoice: Invoice) => void;
  onSendText: (invoice: Invoice) => void;
  onMarkPaid: (invoice: Invoice) => void;
  onDelete: (id: string) => void;
  onClick?: (invoice: Invoice) => void;
}

const statusConfig = {
  draft: { label: 'Draft', className: 'bg-secondary text-secondary-foreground' },
  sent: { label: 'Sent', className: 'bg-primary/10 text-primary' },
  paid: { label: 'Paid', className: 'bg-success/10 text-success' },
  overdue: { label: 'Overdue', className: 'bg-destructive/10 text-destructive' },
};

export function InvoiceCard({ invoice, client, onSendEmail, onSendText, onMarkPaid, onDelete, onClick }: InvoiceCardProps) {
  const total = invoice.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const status = statusConfig[invoice.status];

  return (
    <div 
      className="bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer"
      onClick={() => onClick?.(invoice)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <Receipt className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-card-foreground">{invoice.invoiceNumber}</h3>
            <p className="text-sm text-muted-foreground">{client?.name || 'Unknown Client'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className={cn("font-medium", status.className)}>
            {status.label}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => downloadInvoice(invoice, client)}>
                <Download className="h-4 w-4 mr-2" />
                Download / Print
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onSendEmail(invoice)}>
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSendText(invoice)}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Text
              </DropdownMenuItem>
              {invoice.status !== 'paid' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onMarkPaid(invoice)}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Mark as Paid
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(invoice.id)}
                className="text-destructive focus:text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {invoice.items.slice(0, 2).map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-muted-foreground truncate flex-1 mr-4">{item.description}</span>
            <span className="text-card-foreground font-medium">
              ${(item.quantity * item.unitPrice).toLocaleString()}
            </span>
          </div>
        ))}
        {invoice.items.length > 2 && (
          <p className="text-sm text-muted-foreground">
            +{invoice.items.length - 2} more items
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Due {invoice.dueDate.toLocaleDateString()}</span>
        </div>
        <p className="text-xl font-bold text-card-foreground">
          ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>
      </div>
    </div>
  );
}
