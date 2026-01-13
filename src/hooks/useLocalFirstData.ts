import { useState, useEffect, useCallback, useRef } from 'react';
import { StorageConfig, StorageRecord } from '@/lib/storage/StorageAdapter';
import { HybridStorageAdapter } from '@/lib/storage/HybridStorageAdapter';
import { SyncMetadata } from '@/lib/localDb';
import { isCloudSyncEnabled } from '@/lib/featureFlags';
import { useAuth } from './useAuth';

type LocalRecord = SyncMetadata & { id: string; createdAt: string };

interface UseLocalFirstDataOptions {
  tableName: string;
  cloudTableName?: string;
  requiresAuth?: boolean;
}

interface UseLocalFirstDataResult<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  add: (item: Omit<T, 'id' | 'createdAt' | keyof SyncMetadata>) => Promise<T | null>;
  update: (id: string, updates: Partial<T>) => Promise<T | null>;
  remove: (id: string) => Promise<boolean>;
  refetch: () => Promise<void>;
  syncStatus: {
    pendingCount: number;
    lastSynced: Date | null;
    isSyncing: boolean;
  };
}

/**
 * Generic hook factory for local-first data management
 * 
 * Features:
 * - Primary storage in IndexedDB (works offline)
 * - Optional cloud sync when enabled
 * - Maintains same interface as existing hooks for UI compatibility
 * 
 * The hook handles type mapping: adapters work with StorageRecord,
 * but the hook casts to/from the domain type T for type safety in components.
 */
export function useLocalFirstData<T extends LocalRecord>(
  options: UseLocalFirstDataOptions
): UseLocalFirstDataResult<T> {
  const { tableName, cloudTableName, requiresAuth = false } = options;
  const { user } = useAuth();
  
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Create adapter with current config - adapter is non-generic
  const adapterRef = useRef<HybridStorageAdapter | null>(null);

  const getAdapter = useCallback(() => {
    const config: StorageConfig = {
      tableName,
      cloudTableName,
      requiresAuth,
      syncEnabled: () => isCloudSyncEnabled(),
      getUserId: () => user?.id || null,
    };

    if (!adapterRef.current) {
      adapterRef.current = new HybridStorageAdapter(config);
    }
    
    return adapterRef.current;
  }, [tableName, cloudTableName, requiresAuth, user?.id]);

  // Fetch all data - cast from StorageRecord to T
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const adapter = getAdapter();
      const records = await adapter.getAll();
      // Cast StorageRecord[] to T[] - hooks are responsible for type safety
      setData(records as unknown as T[]);
      
      // Count pending sync items
      const pending = records.filter(r => r.syncStatus === 'pending_push').length;
      setPendingCount(pending);
    } catch (err) {
      console.error(`Error fetching ${tableName}:`, err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [getAdapter, tableName]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Add new record
  const add = useCallback(async (
    item: Omit<T, 'id' | 'createdAt' | keyof SyncMetadata>
  ): Promise<T | null> => {
    try {
      const adapter = getAdapter();
      // Cast input to Record and output back to T
      const created = await adapter.create(item as Record<string, unknown>);
      const typedRecord = created as unknown as T;
      setData(prev => [...prev, typedRecord]);
      setPendingCount(prev => prev + 1);
      return typedRecord;
    } catch (err) {
      console.error(`Error adding to ${tableName}:`, err);
      setError(err as Error);
      return null;
    }
  }, [getAdapter, tableName]);

  // Update existing record
  const update = useCallback(async (
    id: string, 
    updates: Partial<T>
  ): Promise<T | null> => {
    try {
      const adapter = getAdapter();
      const updated = await adapter.update(id, updates as Record<string, unknown>);
      if (updated) {
        const typedRecord = updated as unknown as T;
        setData(prev => prev.map(item => item.id === id ? typedRecord : item));
        // If record was synced, it's now pending
        const wasSync = data.find(d => d.id === id)?.syncStatus === 'synced';
        if (wasSync) setPendingCount(prev => prev + 1);
        return typedRecord;
      }
      return null;
    } catch (err) {
      console.error(`Error updating ${tableName}:`, err);
      setError(err as Error);
      return null;
    }
  }, [getAdapter, tableName, data]);

  // Remove record
  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      const adapter = getAdapter();
      const deleted = await adapter.delete(id);
      if (deleted) {
        const wasSync = data.find(d => d.id === id)?.syncStatus === 'synced';
        setData(prev => prev.filter(item => item.id !== id));
        // If record was synced, add to pending (delete needs to sync)
        if (wasSync && isCloudSyncEnabled()) {
          setPendingCount(prev => prev + 1);
        } else {
          // Local-only record deleted, reduce pending if it was pending
          const wasPending = data.find(d => d.id === id)?.syncStatus === 'pending_push';
          if (wasPending) setPendingCount(prev => Math.max(0, prev - 1));
        }
      }
      return deleted;
    } catch (err) {
      console.error(`Error deleting from ${tableName}:`, err);
      setError(err as Error);
      return false;
    }
  }, [getAdapter, tableName, data]);

  // Manual refetch
  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    add,
    update,
    remove,
    refetch,
    syncStatus: {
      pendingCount,
      lastSynced,
      isSyncing,
    },
  };
}
