import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Invoice, Client } from '@/types';
import { mockInvoices, mockClients } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InvoiceCard } from '@/components/invoices/InvoiceCard';
import { useToast } from '@/hooks/use-toast';

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [clients] = useState<Client[]>(mockClients);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const filteredInvoices = invoices.filter((invoice) => {
    const client = clients.find((c) => c.id === invoice.clientId);
    return (
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleSendEmail = (invoice: Invoice) => {
    const client = clients.find((c) => c.id === invoice.clientId);
    toast({
      title: 'Email sending',
      description: `Invoice will be emailed to ${client?.email}. Connect backend to enable.`,
    });
  };

  const handleSendText = (invoice: Invoice) => {
    const client = clients.find((c) => c.id === invoice.clientId);
    toast({
      title: 'Text sending',
      description: `Invoice will be texted to ${client?.phone}. Connect backend to enable.`,
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
