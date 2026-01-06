import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Quote, Client } from '@/types';
import { mockQuotes, mockClients } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QuoteCard } from '@/components/quotes/QuoteCard';
import { QuoteDialog } from '@/components/quotes/QuoteDialog';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export default function Quotes() {
  const [quotes, setQuotes] = useLocalStorage<Quote[]>('ceb-quotes', mockQuotes);
  const [clients] = useLocalStorage<Client[]>('ceb-clients', mockClients);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | undefined>();
  const { toast } = useToast();
  const navigate = useNavigate();

  const filteredQuotes = quotes.filter((quote) => {
    const client = clients.find((c) => c.id === quote.clientId);
    return (
      quote.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleCreateQuote = (quoteData: Omit<Quote, 'id' | 'createdAt'>) => {
    const newQuote: Quote = {
      ...quoteData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    setQuotes((prev) => [...prev, newQuote]);
    toast({
      title: 'Quote created',
      description: `"${newQuote.title}" has been created.`,
    });
  };

  const handleUpdateQuote = (quoteData: Omit<Quote, 'id' | 'createdAt'>) => {
    if (!editingQuote) return;
    setQuotes((prev) =>
      prev.map((q) =>
        q.id === editingQuote.id
          ? { ...q, ...quoteData }
          : q
      )
    );
    toast({
      title: 'Quote updated',
      description: `"${quoteData.title}" has been updated.`,
    });
    setEditingQuote(undefined);
  };

  const handleConvertToInvoice = (quote: Quote) => {
    toast({
      title: 'Invoice created',
      description: `Quote "${quote.title}" has been converted to an invoice.`,
    });
    navigate('/invoices');
  };

  const handleEdit = (quote: Quote) => {
    setEditingQuote(quote);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const quote = quotes.find((q) => q.id === id);
    setQuotes((prev) => prev.filter((q) => q.id !== id));
    toast({
      title: 'Quote deleted',
      description: `"${quote?.title}" has been removed.`,
    });
  };

  const handleNewQuote = () => {
    setEditingQuote(undefined);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quotes</h1>
          <p className="text-muted-foreground mt-1">Create and manage project estimates</p>
        </div>
        <Button className="gap-2" onClick={handleNewQuote}>
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
          <Button variant="link" className="mt-2" onClick={handleNewQuote}>
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

      <QuoteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        quote={editingQuote}
        clients={clients}
        onSave={editingQuote ? handleUpdateQuote : handleCreateQuote}
      />
    </div>
  );
}
