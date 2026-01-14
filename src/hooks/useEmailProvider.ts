import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';
import { EmailProviderSettings, EmailProviderType } from '@/types/emailProvider';

interface EmailProviderRow {
  id: string;
  user_id: string;
  provider_type: string;
  is_active: boolean;
  api_key_encrypted: string | null;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_username: string | null;
  smtp_password_encrypted: string | null;
  smtp_use_tls: boolean | null;
  from_email: string | null;
  from_name: string | null;
  last_test_at: string | null;
  last_test_success: boolean | null;
  last_test_error: string | null;
  created_at: string;
  updated_at: string;
}

function mapRowToSettings(row: EmailProviderRow): EmailProviderSettings {
  return {
    id: row.id,
    userId: row.user_id,
    providerType: row.provider_type as EmailProviderType,
    isActive: row.is_active,
    smtpHost: row.smtp_host || undefined,
    smtpPort: row.smtp_port || undefined,
    smtpUsername: row.smtp_username || undefined,
    smtpUseTls: row.smtp_use_tls ?? true,
    fromEmail: row.from_email || undefined,
    fromName: row.from_name || undefined,
    lastTestAt: row.last_test_at || undefined,
    lastTestSuccess: row.last_test_success ?? undefined,
    lastTestError: row.last_test_error || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useEmailProvider() {
  const [provider, setProvider] = useState<EmailProviderSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const { user } = useAuth();

  const fetchProvider = useCallback(async () => {
    if (!user) {
      setProvider(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('email_provider_settings')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProvider(mapRowToSettings(data as EmailProviderRow));
      } else {
        setProvider(null);
      }
    } catch (error) {
      console.error('Error fetching email provider:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProvider();
  }, [fetchProvider]);

  const saveProvider = async (
    providerType: EmailProviderType,
    credentials: {
      apiKey?: string;
      smtpHost?: string;
      smtpPort?: number;
      smtpUsername?: string;
      smtpPassword?: string;
      smtpUseTls?: boolean;
      fromEmail?: string;
      fromName?: string;
    }
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      // Call edge function to encrypt and save
      const { data: session } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('email-provider-manage', {
        body: {
          action: 'save',
          providerType,
          credentials,
        },
        headers: {
          Authorization: `Bearer ${session?.session?.access_token}`,
        },
      });

      if (response.error) throw new Error(response.error.message);

      toast({
        title: 'Provider saved',
        description: 'Your email provider has been configured.',
      });

      await fetchProvider();
      return true;
    } catch (error) {
      console.error('Error saving email provider:', error);
      toast({
        title: 'Error',
        description: 'Failed to save email provider configuration.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const testConnection = async (): Promise<{ success: boolean; error?: string }> => {
    if (!user || !provider) {
      return { success: false, error: 'No provider configured' };
    }

    setTesting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('email-provider-manage', {
        body: {
          action: 'test',
        },
        headers: {
          Authorization: `Bearer ${session?.session?.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;
      
      if (result.success) {
        toast({
          title: 'Connection successful',
          description: 'Your email provider is working correctly.',
        });
        await fetchProvider();
        return { success: true };
      } else {
        toast({
          title: 'Connection failed',
          description: result.error || 'Could not connect to email provider.',
          variant: 'destructive',
        });
        await fetchProvider();
        return { success: false, error: result.error };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: 'Test failed',
        description: message,
        variant: 'destructive',
      });
      return { success: false, error: message };
    } finally {
      setTesting(false);
    }
  };

  const deleteProvider = async (): Promise<boolean> => {
    if (!user || !provider) return false;

    try {
      const { error } = await supabase
        .from('email_provider_settings')
        .delete()
        .eq('id', provider.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setProvider(null);
      toast({
        title: 'Provider removed',
        description: 'Your email provider has been disconnected.',
      });
      return true;
    } catch (error) {
      console.error('Error deleting email provider:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove email provider.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    provider,
    loading,
    testing,
    saveProvider,
    testConnection,
    deleteProvider,
    refetch: fetchProvider,
  };
}
