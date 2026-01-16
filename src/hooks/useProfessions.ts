import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Profession } from '@/types/profession';

export function useProfessions(options?: { businessType?: 'mobile_job' | 'stationary_appointment'; activeOnly?: boolean }) {
  const { businessType, activeOnly = true } = options || {};

  return useQuery({
    queryKey: ['professions', businessType, activeOnly],
    queryFn: async () => {
      let query = supabase
        .from('professions')
        .select('*')
        .order('setup_order', { ascending: true });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      if (businessType) {
        query = query.eq('business_type', businessType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Profession[];
    },
  });
}

export function useProfession(idOrSlug: string | undefined) {
  return useQuery({
    queryKey: ['profession', idOrSlug],
    queryFn: async () => {
      if (!idOrSlug) return null;

      // Try by ID first (UUID format), then by slug
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
      
      const { data, error } = await supabase
        .from('professions')
        .select('*')
        .eq(isUuid ? 'id' : 'slug', idOrSlug)
        .single();

      if (error) throw error;
      return data as Profession;
    },
    enabled: !!idOrSlug,
  });
}
