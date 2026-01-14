import { useState } from 'react';
import { Plus, Search, Loader2 } from 'lucide-react';
import { Client } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ClientCard } from '@/components/clients/ClientCard';
import { ClientDialog } from '@/components/clients/ClientDialog';
import { ClientDetailDialog } from '@/components/clients/ClientDetailDialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useClients } from '@/hooks/useClients';

export default function Clients() {
  const { clients, loading, addClient, updateClient, deleteClient } = useClients();
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = async (data: Omit<Client, 'id' | 'createdAt'>) => {
    if (editingClient) {
      const success = await updateClient(editingClient.id, data);
      if (success) {
        toast({
          title: 'Client updated',
          description: `${data.name}'s information has been updated.`,
        });
      }
    } else {
      const newClient = await addClient(data);
      if (newClient) {
        toast({
          title: 'Client added',
          description: `${data.name} has been added to your clients.`,
        });
      }
    }
    setEditingClient(null);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const client = clients.find((c) => c.id === id);
    const success = await deleteClient(id);
    if (success) {
      toast({
        title: 'Client deleted',
        description: `${client?.name} has been removed.`,
      });
    }
  };

  const handleCreateProject = (client: Client) => {
    navigate('/projects', { state: { openNewProject: true, selectedClientId: client.id } });
  };

  const handleCreateAppointment = (client: Client) => {
    navigate('/appointments', { state: { openNewAppointment: true, selectedClientId: client.id } });
  };

  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
    setDetailDialogOpen(true);
  };

  const handleSendInvoice = (client: Client) => {
    navigate('/invoices', { state: { openNewInvoice: true, selectedClientId: client.id } });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Manage your client contacts"
        action={
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Client
          </Button>
        }
      />

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
              onCreateProject={handleCreateProject}
              onClick={handleClientClick}
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

      <ClientDetailDialog
        client={selectedClient}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onEdit={handleEdit}
        onCreateProject={handleCreateProject}
        onCreateAppointment={handleCreateAppointment}
        onSendInvoice={handleSendInvoice}
      />
    </div>
  );
}
