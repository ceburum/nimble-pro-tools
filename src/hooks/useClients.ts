import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: Date;
  userId?: string;
}

interface DbClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
  user_id: string | null;
}

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchClients = async () => {
    if (!user) {
      setClients([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setClients(
        (data as DbClient[]).map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          address: c.address,
          createdAt: new Date(c.created_at),
          userId: c.user_id || undefined,
        }))
      );
    } catch (error: any) {
      console.error('Error fetching clients:', error);
      toast({
        title: 'Error',
        description: 'Failed to load clients.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [user]);

  const addClient = async (data: Omit<Client, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) return null;

    try {
      const { data: newClient, error } = await supabase
        .from('clients')
        .insert({
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      const client: Client = {
        id: newClient.id,
        name: newClient.name,
        email: newClient.email,
        phone: newClient.phone,
        address: newClient.address,
        createdAt: new Date(newClient.created_at),
        userId: newClient.user_id || undefined,
      };

      setClients((prev) => [client, ...prev]);
      return client;
    } catch (error: any) {
      console.error('Error adding client:', error);
      toast({
        title: 'Error',
        description: 'Failed to add client.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateClient = async (id: string, data: Partial<Client>) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
        })
        .eq('id', id);

      if (error) throw error;

      setClients((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...data } : c))
      );
      return true;
    } catch (error: any) {
      console.error('Error updating client:', error);
      toast({
        title: 'Error',
        description: 'Failed to update client.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteClient = async (id: string) => {
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);

      if (error) throw error;

      setClients((prev) => prev.filter((c) => c.id !== id));
      return true;
    } catch (error: any) {
      console.error('Error deleting client:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete client.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    clients,
    loading,
    addClient,
    updateClient,
    deleteClient,
    refetch: fetchClients,
  };
}
