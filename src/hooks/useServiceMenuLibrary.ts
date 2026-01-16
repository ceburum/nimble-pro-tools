import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { ServiceMenuLibrary, ServiceMenuLibraryItem } from '@/types/profession';
import { toast } from 'sonner';

export function useServiceMenuLibrary(options?: { 
  professionId?: string; 
  availableInSetup?: boolean;
  activeOnly?: boolean;
  featuredOnly?: boolean;
}) {
  const { professionId, availableInSetup, activeOnly = true, featuredOnly } = options || {};

  return useQuery({
    queryKey: ['service-menu-library', professionId, availableInSetup, activeOnly, featuredOnly],
    queryFn: async () => {
      let query = supabase
        .from('service_menu_library')
        .select(`
          *,
          profession:professions(*)
        `)
        .order('created_at', { ascending: false });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      if (professionId) {
        query = query.eq('profession_id', professionId);
      }

      if (availableInSetup !== undefined) {
        query = query.eq('available_in_setup', availableInSetup);
      }

      if (featuredOnly) {
        query = query.eq('is_featured', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Parse JSONB fields
      return (data || []).map(item => ({
        ...item,
        preview_items: Array.isArray(item.preview_items) ? item.preview_items as string[] : [],
        services: Array.isArray(item.services) ? item.services as unknown as ServiceMenuLibraryItem[] : [],
      })) as ServiceMenuLibrary[];
    },
  });
}

export function useServiceMenuLibraryPack(id: string | undefined) {
  return useQuery({
    queryKey: ['service-menu-library-pack', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('service_menu_library')
        .select(`
          *,
          profession:professions(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      return {
        ...data,
        preview_items: Array.isArray(data.preview_items) ? data.preview_items as string[] : [],
        services: Array.isArray(data.services) ? data.services as unknown as ServiceMenuLibraryItem[] : [],
      } as ServiceMenuLibrary;
    },
    enabled: !!id,
  });
}

export function useInstallServicePack() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (packId: string) => {
      if (!user) throw new Error('Must be logged in');

      // Fetch the library pack
      const { data: pack, error: packError } = await supabase
        .from('service_menu_library')
        .select('services')
        .eq('id', packId)
        .single();

      if (packError) throw packError;
      if (!pack?.services) throw new Error('Pack has no services');

      const services = pack.services as unknown as ServiceMenuLibraryItem[];

      // Get current max sort_order for user
      const { data: existingServices } = await supabase
        .from('user_services')
        .select('sort_order')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: false })
        .limit(1);

      const maxSortOrder = existingServices?.[0]?.sort_order ?? -1;

      // Clone services into user's menu
      const newServices = services.map((service, index) => ({
        user_id: user.id,
        name: service.name,
        price: service.price,
        duration: service.duration || null,
        sort_order: maxSortOrder + index + 1,
        source_library_id: packId,
        is_active: true,
      }));

      const { data, error } = await supabase
        .from('user_services')
        .insert(newServices)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-services'] });
      toast.success('Service pack installed successfully!');
    },
    onError: (error) => {
      console.error('Failed to install service pack:', error);
      toast.error('Failed to install service pack');
    },
  });
}
