import { StorageAdapter, StorageConfig } from './StorageAdapter';
import { LocalStorageAdapter } from './LocalStorageAdapter';
import { CloudStorageAdapter } from './CloudStorageAdapter';
import { SyncMetadata, getDb, generateLocalId } from '../localDb';
import { isCloudSyncEnabled } from '../featureFlags';

type HybridRecord = SyncMetadata & { id: string; createdAt: string };

/**
 * HybridStorageAdapter - Primary storage is always local (IndexedDB)
 * 
 * Behavior:
 * - All reads/writes go to local storage first
 * - If cloud sync is enabled AND user is authenticated:
 *   - Writes are queued for background sync
 *   - Reads can optionally pull from cloud on cache miss
 * - App works fully offline
 */
export class HybridStorageAdapter<T extends HybridRecord> implements StorageAdapter<T> {
  private localAdapter: LocalStorageAdapter<T>;
  private cloudAdapter: CloudStorageAdapter<T>;
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;
    this.localAdapter = new LocalStorageAdapter<T>(config);
    this.cloudAdapter = new CloudStorageAdapter<T>(config);
  }

  private shouldSyncToCloud(): boolean {
    return isCloudSyncEnabled() && 
           (!this.config.requiresAuth || !!this.config.getUserId());
  }

  async getAll(): Promise<T[]> {
    // Always read from local first
    return await this.localAdapter.getAll();
  }

  async getById(id: string): Promise<T | null> {
    // Always read from local first
    return await this.localAdapter.getById(id);
  }

  async getByIndex(indexName: string, value: string): Promise<T[]> {
    return await this.localAdapter.getByIndex(indexName, value);
  }

  async create(data: Omit<T, 'id' | 'createdAt'>): Promise<T> {
    // Create locally first
    const record = await this.localAdapter.create(data);
    
    // If cloud sync is enabled, the LocalStorageAdapter already added to sync queue
    // Background sync will handle pushing to cloud
    
    return record;
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    // Update locally first
    const updated = await this.localAdapter.update(id, data);
    
    // If cloud sync is enabled, the LocalStorageAdapter already added to sync queue
    
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    // Delete locally first
    const deleted = await this.localAdapter.delete(id);
    
    // If cloud sync is enabled, the LocalStorageAdapter already added to sync queue
    
    return deleted;
  }

  async count(): Promise<number> {
    return await this.localAdapter.count();
  }

  /**
   * Pull all data from cloud to local (for migration/sync)
   * This merges cloud data with existing local data
   */
  async pullFromCloud(): Promise<{ added: number; updated: number; conflicts: number }> {
    if (!this.shouldSyncToCloud()) {
      return { added: 0, updated: 0, conflicts: 0 };
    }

    const cloudRecords = await this.cloudAdapter.getAll();
    const db = await getDb();
    
    let added = 0;
    let updated = 0;
    let conflicts = 0;

    for (const cloudRecord of cloudRecords) {
      const localRecord = await this.localAdapter.getById(cloudRecord.id);
      
      if (!localRecord) {
        // New record from cloud - add locally
        const withSyncMeta = {
          ...cloudRecord,
          localUpdatedAt: cloudRecord.createdAt,
          cloudUpdatedAt: cloudRecord.createdAt,
          syncStatus: 'synced' as const,
          cloudId: cloudRecord.id,
        } as T;
        
        await db.put(this.config.tableName as any, withSyncMeta);
        added++;
      } else if (localRecord.syncStatus === 'pending_push') {
        // Local has changes that haven't been pushed - conflict
        // For now, keep local changes (last write wins locally)
        // Mark as conflict for user review
        const conflictRecord = {
          ...localRecord,
          syncStatus: 'conflict' as const,
        } as T;
        await db.put(this.config.tableName as any, conflictRecord);
        conflicts++;
      } else {
        // Local is synced, update from cloud
        const withSyncMeta = {
          ...cloudRecord,
          localUpdatedAt: new Date().toISOString(),
          cloudUpdatedAt: cloudRecord.createdAt,
          syncStatus: 'synced' as const,
          cloudId: cloudRecord.id,
        } as T;
        
        await db.put(this.config.tableName as any, withSyncMeta);
        updated++;
      }
    }

    return { added, updated, conflicts };
  }

  /**
   * Push all pending local changes to cloud
   */
  async pushToCloud(): Promise<{ created: number; updated: number; deleted: number; failed: number }> {
    if (!this.shouldSyncToCloud()) {
      return { created: 0, updated: 0, deleted: 0, failed: 0 };
    }

    const db = await getDb();
    const syncQueue = await db.getAll('syncQueue');
    const tableItems = syncQueue.filter(item => item.tableName === this.config.tableName);

    let created = 0;
    let updated = 0;
    let deleted = 0;
    let failed = 0;

    for (const item of tableItems) {
      try {
        if (item.operation === 'create') {
          const localRecord = await this.localAdapter.getById(item.recordId);
          if (localRecord) {
            const cloudRecord = await this.cloudAdapter.create(localRecord as any);
            // Update local with cloud ID
            await this.localAdapter.update(item.recordId, {
              cloudId: cloudRecord.id,
              cloudUpdatedAt: new Date().toISOString(),
              syncStatus: 'synced',
            } as Partial<T>);
            created++;
          }
        } else if (item.operation === 'update') {
          const localRecord = await this.localAdapter.getById(item.recordId);
          if (localRecord && localRecord.cloudId) {
            await this.cloudAdapter.update(localRecord.cloudId, localRecord);
            await this.localAdapter.update(item.recordId, {
              cloudUpdatedAt: new Date().toISOString(),
              syncStatus: 'synced',
            } as Partial<T>);
            updated++;
          }
        } else if (item.operation === 'delete') {
          const data = item.data as { cloudId?: string };
          if (data?.cloudId) {
            await this.cloudAdapter.delete(data.cloudId);
            deleted++;
          }
        }

        // Remove from sync queue on success
        await db.delete('syncQueue', item.id);
      } catch (error) {
        console.error(`Sync failed for ${item.tableName}:${item.recordId}:`, error);
        // Update retry count
        await db.put('syncQueue', {
          ...item,
          retryCount: item.retryCount + 1,
          lastError: String(error),
        });
        failed++;
      }
    }

    return { created, updated, deleted, failed };
  }
}

export function createHybridStorageAdapter<T extends HybridRecord>(
  config: StorageConfig
): HybridStorageAdapter<T> {
  return new HybridStorageAdapter<T>(config);
}
