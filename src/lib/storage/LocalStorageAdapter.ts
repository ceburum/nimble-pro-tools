import { StorageAdapter, StorageConfig, StorageRecord } from './StorageAdapter';
import { 
  getDb, 
  generateLocalId, 
  createSyncMetadata, 
  updateSyncMetadata 
} from '../localDb';

// Map of table names to their IndexedDB store names
const TABLE_STORE_MAP: Record<string, string> = {
  clients: 'clients',
  invoices: 'invoices',
  projects: 'projects',
  project_photos: 'projectPhotos',
  project_receipts: 'projectReceipts',
  mileage_entries: 'mileageEntries',
  capital_assets: 'capitalAssets',
  subcontractor_payments: 'subcontractorPayments',
  expense_categories: 'expenseCategories',
  bank_expenses: 'bankExpenses',
  transactions: 'transactions',
  materials: 'materials',
  user_settings: 'userSettings',
  irs_mileage_rates: 'irsMileageRates',
};

export class LocalStorageAdapter implements StorageAdapter {
  private storeName: string;
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;
    this.storeName = TABLE_STORE_MAP[config.tableName] || config.tableName;
  }

  async getAll(): Promise<StorageRecord[]> {
    const db = await getDb();
    const records = await db.getAll(this.storeName as any);
    return records as StorageRecord[];
  }

  async getById(id: string): Promise<StorageRecord | null> {
    const db = await getDb();
    const record = await db.get(this.storeName as any, id);
    return (record as StorageRecord) || null;
  }

  async getByIndex(indexName: string, value: string): Promise<StorageRecord[]> {
    const db = await getDb();
    const tx = db.transaction(this.storeName as any, 'readonly');
    const index = tx.store.index(indexName);
    const records = await index.getAll(value);
    return records as StorageRecord[];
  }

  async create(data: Record<string, unknown>): Promise<StorageRecord> {
    const db = await getDb();
    const now = new Date().toISOString();
    
    const record: StorageRecord = {
      ...data,
      id: generateLocalId(),
      createdAt: now,
      ...createSyncMetadata(null),
    };

    await db.put(this.storeName as any, record);
    
    // Add to sync queue if sync is enabled
    if (this.config.syncEnabled()) {
      await this.addToSyncQueue(record.id, 'create', record);
    }

    return record;
  }

  async update(id: string, data: Record<string, unknown>): Promise<StorageRecord | null> {
    const db = await getDb();
    const existing = await db.get(this.storeName as any, id);
    
    if (!existing) return null;

    const updated: StorageRecord = {
      ...existing,
      ...data,
      id, // Ensure id is preserved
      ...updateSyncMetadata(existing as any),
    };

    await db.put(this.storeName as any, updated);

    // Add to sync queue if sync is enabled
    if (this.config.syncEnabled()) {
      await this.addToSyncQueue(id, 'update', updated);
    }

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const db = await getDb();
    const existing = await db.get(this.storeName as any, id);
    
    if (!existing) return false;

    await db.delete(this.storeName as any, id);

    // Add to sync queue if sync is enabled and record was synced to cloud
    const record = existing as StorageRecord;
    if (this.config.syncEnabled() && record.cloudId) {
      await this.addToSyncQueue(id, 'delete', { cloudId: record.cloudId });
    }

    return true;
  }

  async count(): Promise<number> {
    const db = await getDb();
    return await db.count(this.storeName as any);
  }

  private async addToSyncQueue(
    recordId: string, 
    operation: 'create' | 'update' | 'delete',
    data: unknown
  ): Promise<void> {
    const db = await getDb();
    await db.put('syncQueue', {
      id: generateLocalId(),
      tableName: this.config.tableName,
      recordId,
      operation,
      data,
      createdAt: new Date().toISOString(),
      retryCount: 0,
    });
  }
}

export function createLocalStorageAdapter(config: StorageConfig): LocalStorageAdapter {
  return new LocalStorageAdapter(config);
}
