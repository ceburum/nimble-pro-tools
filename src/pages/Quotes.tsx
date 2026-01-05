import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Quote, Client } from '@/types';
import { mockQuotes, mockClients } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QuoteCard } from '@/components/quotes/QuoteCard';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export default function Quotes() {
  const [quotes, setQuotes] = useState<Quote[]>(mockQuotes);
  const [clients] = useState<Client[]>(mockClients);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const filteredQuotes = quotes.filter((quote) => {
    const client = clients.find((c) => c.id === quote.clientId);
    return (
      quote.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleConvertToInvoice = (quote: Quote) => {
    toast({
      title: 'Invoice created',
      description: `Quote "${quote.title}" has been converted to an invoice.`,
    });
    navigate('/invoices');
  };

  const handleEdit = (quote: Quote) => {
    toast({
      title: 'Edit quote',
      description: 'Quote editing will be available with database integration.',
    });
  };

  const handleDelete = (id: string) => {
    const quote = quotes.find((q) => q.id === id);
    setQuotes((prev) => prev.filter((q) => q.id !== id));
    toast({
      title: 'Quote deleted',
      description: `"${quote?.title}" has been removed.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quotes</h1>
          <p className="text-muted-foreground mt-1">Create and manage project estimates</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Quote
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search quotes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredQuotes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No quotes found.</p>
          <Button variant="link" className="mt-2">
            Create your first quote
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredQuotes.map((quote) => (
            <QuoteCard
              key={quote.id}
              quote={quote}
              client={clients.find((c) => c.id === quote.clientId)}
              onConvertToInvoice={handleConvertToInvoice}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
