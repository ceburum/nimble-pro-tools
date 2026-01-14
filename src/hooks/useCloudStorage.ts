import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { STORAGE_LIMITS, CloudStorageTier } from '@/config/pricing';

export function useCloudStorage() {
  const { user } = useAuth();
  const [tier, setTier] = useState<CloudStorageTier>(null);
  const [usedBytes, setUsedBytes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchStorageInfo = async () => {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('cloud_storage_tier, cloud_storage_used_bytes')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching storage info:', error);
        } else if (data) {
          setTier((data.cloud_storage_tier as CloudStorageTier) ?? null);
          setUsedBytes(data.cloud_storage_used_bytes ?? 0);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStorageInfo();
  }, [user]);

  const limitBytes = tier === 'premium' 
    ? STORAGE_LIMITS.PREMIUM 
    : tier === 'standard' 
      ? STORAGE_LIMITS.STANDARD 
      : STORAGE_LIMITS.FREE;

  const percentUsed = limitBytes > 0 ? Math.min(100, (usedBytes / limitBytes) * 100) : 0;

  const canUpload = useCallback((fileSize: number): boolean => {
    if (!tier) return false; // No cloud storage, local only
    return usedBytes + fileSize <= limitBytes;
  }, [tier, usedBytes, limitBytes]);

  const updateUsedBytes = useCallback(async (bytes: number) => {
    if (!user) return false;

    const newUsedBytes = Math.max(0, usedBytes + bytes);

    try {
      const { error } = await supabase
        .from('user_settings')
        .update({
          cloud_storage_used_bytes: newUsedBytes,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating storage usage:', error);
        return false;
      }

      setUsedBytes(newUsedBytes);
      return true;
    } catch (err) {
      console.error('Error:', err);
      return false;
    }
  }, [user, usedBytes]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return {
    tier,
    usedBytes,
    limitBytes,
    percentUsed,
    loading,
    canUpload,
    updateUsedBytes,
    formatBytes,
    formattedUsed: formatBytes(usedBytes),
    formattedLimit: formatBytes(limitBytes),
    hasCloudStorage: tier !== null,
  };
}
