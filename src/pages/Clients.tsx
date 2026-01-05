import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Client } from '@/types';
import { mockClients } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ClientCard } from '@/components/clients/ClientCard';
import { ClientDialog } from '@/components/clients/ClientDialog';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export default function Clients() {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = (data: Omit<Client, 'id' | 'createdAt'>) => {
    if (editingClient) {
      setClients((prev) =>
        prev.map((c) =>
          c.id === editingClient.id ? { ...c, ...data } : c
        )
      );
      toast({
        title: 'Client updated',
        description: `${data.name}'s information has been updated.`,
      });
    } else {
      const newClient: Client = {
        ...data,
        id: Date.now().toString(),
        createdAt: new Date(),
      };
      setClients((prev) => [...prev, newClient]);
      toast({
        title: 'Client added',
        description: `${data.name} has been added to your clients.`,
      });
    }
    setEditingClient(null);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const client = clients.find((c) => c.id === id);
    setClients((prev) => prev.filter((c) => c.id !== id));
    toast({
      title: 'Client deleted',
      description: `${client?.name} has been removed.`,
    });
  };

  const handleCreateQuote = (client: Client) => {
    navigate('/quotes', { state: { selectedClient: client } });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clients</h1>
          <p className="text-muted-foreground mt-1">Manage your client contacts</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Client
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search clients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredClients.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No clients found.</p>
          <Button
            variant="link"
            onClick={() => setDialogOpen(true)}
            className="mt-2"
          >
            Add your first client
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCreateQuote={handleCreateQuote}
            />
          ))}
        </div>
      )}

      <ClientDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingClient(null);
        }}
        client={editingClient}
        onSave={handleSave}
      />
    </div>
  );
}
