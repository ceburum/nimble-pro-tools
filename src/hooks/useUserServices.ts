import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { UserService } from '@/types/profession';
import { toast } from 'sonner';

export function useUserServices() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-services', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_services')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as UserService[];
    },
    enabled: !!user,
  });
}

export function useAddUserService() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (service: Omit<UserService, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('user_services')
        .insert({
          ...service,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as UserService;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-services'] });
    },
    onError: (error) => {
      console.error('Failed to add service:', error);
      toast.error('Failed to add service');
    },
  });
}

export function useUpdateUserService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<UserService> & { id: string }) => {
      const { data, error } = await supabase
        .from('user_services')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as UserService;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-services'] });
    },
    onError: (error) => {
      console.error('Failed to update service:', error);
      toast.error('Failed to update service');
    },
  });
}

export function useDeleteUserService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_services')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-services'] });
      toast.success('Service deleted');
    },
    onError: (error) => {
      console.error('Failed to delete service:', error);
      toast.error('Failed to delete service');
    },
  });
}

export function useReorderUserServices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      // Update sort_order for each service
      const updates = orderedIds.map((id, index) => 
        supabase
          .from('user_services')
          .update({ sort_order: index })
          .eq('id', id)
      );

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-services'] });
    },
    onError: (error) => {
      console.error('Failed to reorder services:', error);
      toast.error('Failed to reorder services');
    },
  });
}
