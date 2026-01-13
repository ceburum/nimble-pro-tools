import { StorageAdapter, StorageConfig, StorageRecord } from './StorageAdapter';
import { LocalStorageAdapter } from './LocalStorageAdapter';
import { CloudStorageAdapter } from './CloudStorageAdapter';
import { getDb, generateLocalId } from '../localDb';
import { isCloudSyncEnabled } from '../featureFlags';

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
export class HybridStorageAdapter implements StorageAdapter {
  private localAdapter: LocalStorageAdapter;
  private cloudAdapter: CloudStorageAdapter;
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;
    this.localAdapter = new LocalStorageAdapter(config);
    this.cloudAdapter = new CloudStorageAdapter(config);
  }

  private shouldSyncToCloud(): boolean {
    return isCloudSyncEnabled() && 
           (!this.config.requiresAuth || !!this.config.getUserId());
  }

  async getAll(): Promise<StorageRecord[]> {
    // Always read from local first
    return await this.localAdapter.getAll();
  }

  async getById(id: string): Promise<StorageRecord | null> {
    // Always read from local first
    return await this.localAdapter.getById(id);
  }

  async getByIndex(indexName: string, value: string): Promise<StorageRecord[]> {
    return await this.localAdapter.getByIndex(indexName, value);
  }

  async create(data: Record<string, unknown>): Promise<StorageRecord> {
    // Create locally first
    const record = await this.localAdapter.create(data);
    
    // If cloud sync is enabled, the LocalStorageAdapter already added to sync queue
    // Background sync will handle pushing to cloud
    
    return record;
  }

  async update(id: string, data: Record<string, unknown>): Promise<StorageRecord | null> {
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
        const withSyncMeta: StorageRecord = {
          ...cloudRecord,
          localUpdatedAt: cloudRecord.createdAt as string,
          cloudUpdatedAt: cloudRecord.createdAt as string,
          syncStatus: 'synced',
          cloudId: cloudRecord.id,
        };
        
        await db.put(this.config.tableName as any, withSyncMeta);
        added++;
      } else if (localRecord.syncStatus === 'pending_push') {
        // Local has changes that haven't been pushed - conflict
        // For now, keep local changes (last write wins locally)
        // Mark as conflict for user review
        const conflictRecord: StorageRecord = {
          ...localRecord,
          syncStatus: 'conflict',
        };
        await db.put(this.config.tableName as any, conflictRecord);
        conflicts++;
      } else {
        // Local is synced, update from cloud
        const withSyncMeta: StorageRecord = {
          ...cloudRecord,
          localUpdatedAt: new Date().toISOString(),
          cloudUpdatedAt: cloudRecord.createdAt as string,
          syncStatus: 'synced',
          cloudId: cloudRecord.id,
        };
        
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
            const cloudRecord = await this.cloudAdapter.create(localRecord);
            // Update local with cloud ID
            await this.localAdapter.update(item.recordId, {
              cloudId: cloudRecord.id,
              cloudUpdatedAt: new Date().toISOString(),
              syncStatus: 'synced',
            });
            created++;
          }
        } else if (item.operation === 'update') {
          const localRecord = await this.localAdapter.getById(item.recordId);
          if (localRecord && localRecord.cloudId) {
            await this.cloudAdapter.update(localRecord.cloudId as string, localRecord);
            await this.localAdapter.update(item.recordId, {
              cloudUpdatedAt: new Date().toISOString(),
              syncStatus: 'synced',
            });
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

export function createHybridStorageAdapter(config: StorageConfig): HybridStorageAdapter {
  return new HybridStorageAdapter(config);
}
