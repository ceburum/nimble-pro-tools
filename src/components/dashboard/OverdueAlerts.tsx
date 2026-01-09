import { AlertTriangle, Clock, Mail, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Invoice, Client } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
interface OverdueAlertsProps {
  invoices: Invoice[];
  clients: Client[];
  onSendReminder: (invoice: Invoice, method: 'email' | 'text') => void;
}
export function OverdueAlerts({
  invoices,
  clients,
  onSendReminder
}: OverdueAlertsProps) {
  const now = new Date();
  const overdueInvoices = invoices.filter(inv => {
    if (inv.status === 'paid') return false;
    const dueDate = new Date(inv.dueDate);
    return dueDate < now;
  }).map(inv => {
    const dueDate = new Date(inv.dueDate);
    const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    const client = clients.find(c => c.id === inv.clientId);
    const total = inv.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    return {
      ...inv,
      daysOverdue,
      client,
      total
    };
  }).sort((a, b) => b.daysOverdue - a.daysOverdue);
  if (overdueInvoices.length === 0) return null;
  return <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <h3 className="font-semibold text-destructive text-xl">Overdue Invoices</h3>
        <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-full">
          {overdueInvoices.length}
        </span>
      </div>
      
      <div className="space-y-3">
        {overdueInvoices.slice(0, 5).map(invoice => <div key={invoice.id} className={cn("bg-card rounded-lg p-4 border", invoice.daysOverdue > 14 ? "border-destructive/50" : invoice.daysOverdue > 7 ? "border-accent/50" : "border-border")}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <Link to="/invoices" className="text-card-foreground hover:text-primary transition-colors font-extrabold">
                  {invoice.invoiceNumber}
                </Link>
                <p className="text-muted-foreground truncate text-base">
                  {invoice.client?.name || 'Unknown Client'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-3 w-3 text-destructive" />
                  <span className={cn("text-xs font-medium", invoice.daysOverdue > 14 ? "text-destructive" : invoice.daysOverdue > 7 ? "text-accent" : "text-muted-foreground")}>
                    {invoice.daysOverdue} days overdue
                  </span>
                </div>
              </div>
              
              <div className="text-right">
                <p className="font-bold text-card-foreground">${invoice.total.toLocaleString()}</p>
                <div className="flex gap-1 mt-2">
                  <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => onSendReminder(invoice, 'email')}>
                    <Mail className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => onSendReminder(invoice, 'text')}>
                    <MessageSquare className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>)}
        
        {overdueInvoices.length > 5 && <Link to="/invoices" className="block text-center text-sm text-primary hover:underline py-2">
            View all {overdueInvoices.length} overdue invoices →
          </Link>}
      </div>
    </div>;
}