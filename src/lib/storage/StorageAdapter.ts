// Storage adapter interface - abstracts local vs cloud storage

export interface StorageAdapter<T> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  getByIndex?(indexName: string, value: string): Promise<T[]>;
  create(data: Omit<T, 'id' | 'createdAt'>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T | null>;
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

// Adapter factory type
export type StorageAdapterFactory<T> = (config: StorageConfig) => StorageAdapter<T>;
