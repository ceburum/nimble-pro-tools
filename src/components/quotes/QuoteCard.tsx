import { FileText, Calendar, MoreVertical, ArrowRight } from 'lucide-react';
import { Quote, Client } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface QuoteCardProps {
  quote: Quote;
  client?: Client;
  onConvertToInvoice: (quote: Quote) => void;
  onEdit: (quote: Quote) => void;
  onDelete: (id: string) => void;
}

const statusConfig = {
  draft: { label: 'Draft', className: 'bg-secondary text-secondary-foreground' },
  sent: { label: 'Sent', className: 'bg-primary/10 text-primary' },
  accepted: { label: 'Accepted', className: 'bg-success/10 text-success' },
  declined: { label: 'Declined', className: 'bg-destructive/10 text-destructive' },
};

export function QuoteCard({ quote, client, onConvertToInvoice, onEdit, onDelete }: QuoteCardProps) {
  const total = quote.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const status = statusConfig[quote.status];

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-all duration-200 group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-card-foreground">{quote.title}</h3>
            <p className="text-sm text-muted-foreground">{client?.name || 'Unknown Client'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className={cn("font-medium", status.className)}>
            {status.label}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={(e) => e.stopPropagation()}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(quote)}>
                Edit Quote
              </DropdownMenuItem>
              {quote.status === 'accepted' && (
                <DropdownMenuItem onClick={() => onConvertToInvoice(quote)}>
                  Convert to Invoice
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={() => onDelete(quote.id)}
                className="text-destructive focus:text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Valid until {quote.validUntil.toLocaleDateString()}</span>
        </div>
        <p className="text-xl font-bold text-card-foreground">
          ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>
      </div>

      {quote.status === 'accepted' && (
        <Button 
          className="w-full mt-4 gap-2"
          onClick={() => onConvertToInvoice(quote)}
        >
          Convert to Invoice
          <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
