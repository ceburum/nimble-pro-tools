import { Receipt, Calendar, MoreVertical, Mail, Copy, CreditCard, Download, ImageDown, Link2 } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { PaylinkButton } from './PaylinkButton';
import { toast } from 'sonner';

interface InvoiceCardProps {
  invoice: Invoice;
  client?: Client;
  onSendEmail: (invoice: Invoice) => void;
  onCopyLink: (invoice: Invoice) => void;
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

export function InvoiceCard({ invoice, client, onSendEmail, onCopyLink, onMarkPaid, onDelete, onClick }: InvoiceCardProps) {
  const total = invoice.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const status = statusConfig[invoice.status];

  const handleDownloadReceipts = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!invoice.receiptAttachments || invoice.receiptAttachments.length === 0) {
      toast.error('No receipts attached to this invoice');
      return;
    }

    toast.info(`Downloading ${invoice.receiptAttachments.length} receipt(s)...`);

    let successCount = 0;
    for (const attachment of invoice.receiptAttachments) {
      try {
        // Handle both old string format and new object format
        const attAny = attachment as any;
        const storagePath = typeof attAny === 'string' ? attAny : attAny?.storagePath;
        
        if (!storagePath) {
          console.error('No storage path for attachment:', attachment);
          continue;
        }

        const { data, error } = await supabase.storage
          .from('project-files')
          .download(storagePath);

        if (error) throw error;

        // Create download link
        const url = URL.createObjectURL(data);
        const filename = storagePath.split('/').pop() || 'receipt.jpg';
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        successCount++;
      } catch (err) {
        console.error('Failed to download receipt:', err);
        const attAny = attachment as any;
        const storagePath = typeof attAny === 'string' ? attAny : attAny?.storagePath || 'unknown';
        toast.error(`Failed to download: ${storagePath.split('/').pop()}`);
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} receipt(s) downloaded!`);
    }
  };

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
              {invoice.receiptAttachments && invoice.receiptAttachments.length > 0 && (
                <DropdownMenuItem onClick={handleDownloadReceipts}>
                  <ImageDown className="h-4 w-4 mr-2" />
                  Download Receipts ({invoice.receiptAttachments.length})
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onSendEmail(invoice)}>
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCopyLink(invoice)}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Payment Link
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
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Due {invoice.dueDate.toLocaleDateString()}</span>
          </div>
          {invoice.receiptAttachments && invoice.receiptAttachments.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 gap-1 text-xs"
              onClick={handleDownloadReceipts}
            >
              <ImageDown className="h-3.5 w-3.5" />
              <span>Receipts ({invoice.receiptAttachments.length})</span>
            </Button>
          )}
          {/* Paylink button for sent/overdue invoices */}
          {invoice.status !== 'paid' && invoice.status !== 'draft' && (
            <div onClick={(e) => e.stopPropagation()}>
              <PaylinkButton 
                paymentToken={invoice.paymentToken}
                invoiceNumber={invoice.invoiceNumber}
                size="sm"
                className="h-7 px-2 text-xs"
              />
            </div>
          )}
        </div>
        <p className="text-xl font-bold text-card-foreground">
          ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>
      </div>
    </div>
  );
}
