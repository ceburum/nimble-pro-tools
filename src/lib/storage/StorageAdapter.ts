// Storage adapter interface - operates on plain objects without generics
// Hooks perform strongly-typed mapping between adapter data and domain models

export type StorageRecord = Record<string, unknown> & { id: string };

export interface StorageAdapter {
  getAll(): Promise<StorageRecord[]>;
  getById(id: string): Promise<StorageRecord | null>;
  getByIndex?(indexName: string, value: string): Promise<StorageRecord[]>;
  create(data: Record<string, unknown>): Promise<StorageRecord>;
  update(id: string, data: Record<string, unknown>): Promise<StorageRecord | null>;
  delete(id: string): Promise<boolean>;
  count(): Promise<number>;
}

// Configuration for storage behavior
export interface StorageConfig {
  tableName: string;
  cloudTableName?: string; // Supabase table name if different
  requiresAuth: boolean;
  syncEnabled: () => boolean;
  getUserId: () => string | null;
}
