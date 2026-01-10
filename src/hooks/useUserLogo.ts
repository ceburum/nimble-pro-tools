import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useUserLogo() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchLogo = async () => {
      if (!user) {
        setLogoUrl(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('dashboard_logo_url')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        setLogoUrl(data?.dashboard_logo_url || null);
      } catch (error) {
        console.error('Error fetching user logo:', error);
        setLogoUrl(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLogo();
  }, [user]);

  return { logoUrl, loading };
}
