import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Invoice, Client } from '@/types';
import { mockInvoices, mockClients } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InvoiceCard } from '@/components/invoices/InvoiceCard';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export default function Invoices() {
  const [invoices, setInvoices] = useLocalStorage<Invoice[]>('ceb-invoices', mockInvoices);
  const [clients] = useLocalStorage<Client[]>('ceb-clients', mockClients);
  const [searchQuery, setSearchQuery] = useState('');
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const { toast } = useToast();

  const filteredInvoices = invoices.filter((invoice) => {
    const client = clients.find((c) => c.id === invoice.clientId);
    return (
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleSendEmail = async (invoice: Invoice) => {
    const client = clients.find((c) => c.id === invoice.clientId);
    if (!client) {
      toast({
        title: 'Error',
        description: 'Client not found.',
        variant: 'destructive',
      });
      return;
    }

    setSendingEmail(invoice.id);
    
    try {
      // Use AbortController with longer timeout for SMTP operations
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const { data, error } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          clientName: client.name,
          clientEmail: client.email,
          invoiceNumber: invoice.invoiceNumber,
          items: invoice.items,
          dueDate: invoice.dueDate.toLocaleDateString(),
          notes: invoice.notes,
          businessName: 'C.E.B.',
        },
      });
      
      clearTimeout(timeoutId);

      if (error) throw error;

      // Update invoice status to sent
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoice.id ? { ...inv, status: 'sent' as const } : inv
        )
      );

      toast({
        title: 'Invoice sent!',
        description: `Invoice emailed to ${client.email}`,
      });
    } catch (error: any) {
      console.error('Failed to send invoice:', error);
      // Check if it's an abort/timeout - the email may have still sent
      const isTimeout = error.name === 'AbortError' || error.message?.includes('fetch');
      toast({
        title: isTimeout ? 'Sending...' : 'Failed to send',
        description: isTimeout 
          ? 'Email is being sent. Check your inbox shortly.' 
          : (error.message || 'Could not send invoice email.'),
        variant: isTimeout ? 'default' : 'destructive',
      });
    } finally {
      setSendingEmail(null);
    }
  };

  const handleSendText = (invoice: Invoice) => {
    const client = clients.find((c) => c.id === invoice.clientId);
    toast({
      title: 'Coming soon',
      description: `Text messaging to ${client?.phone} will be available soon.`,
    });
  };

  const handleMarkPaid = (invoice: Invoice) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoice.id
          ? { ...inv, status: 'paid' as const, paidAt: new Date() }
          : inv
      )
    );
    toast({
      title: 'Payment recorded',
      description: `${invoice.invoiceNumber} has been marked as paid.`,
    });
  };

  const handleDelete = (id: string) => {
    const invoice = invoices.find((inv) => inv.id === id);
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    toast({
      title: 'Invoice deleted',
      description: `${invoice?.invoiceNumber} has been removed.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground mt-1">Track and manage your invoices</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Invoice
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search invoices..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredInvoices.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No invoices found.</p>
          <Button variant="link" className="mt-2">
            Create your first invoice
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredInvoices.map((invoice) => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              client={clients.find((c) => c.id === invoice.clientId)}
              onSendEmail={handleSendEmail}
              onSendText={handleSendText}
              onMarkPaid={handleMarkPaid}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
