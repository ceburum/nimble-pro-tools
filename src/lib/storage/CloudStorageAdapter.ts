import { StorageAdapter, StorageConfig, StorageRecord } from './StorageAdapter';
import { supabase } from '@/integrations/supabase/client';

// Field name mapping: camelCase (local) -> snake_case (cloud)
const FIELD_MAPPINGS: Record<string, Record<string, string>> = {
  clients: {
    createdAt: 'created_at',
    legalName: 'legal_name',
    tinType: 'tin_type',
    tinEncrypted: 'tin_encrypted',
    is1099Eligible: 'is_1099_eligible',
    isSubcontractor: 'is_subcontractor',
    userId: 'user_id',
  },
  invoices: {
    createdAt: 'created_at',
    clientId: 'client_id',
    invoiceNumber: 'invoice_number',
    dueDate: 'due_date',
    paidAt: 'paid_at',
    quoteId: 'quote_id',
    paymentToken: 'payment_token',
    receiptAttachments: 'receipt_attachments',
    userId: 'user_id',
  },
  projects: {
    createdAt: 'created_at',
    clientId: 'client_id',
    invoiceId: 'invoice_id',
    quoteNotes: 'quote_notes',
    validUntil: 'valid_until',
    scheduledDate: 'scheduled_date',
    arrivalWindowStart: 'arrival_window_start',
    arrivalWindowEnd: 'arrival_window_end',
    scheduleNotes: 'schedule_notes',
    scheduleNotificationSentAt: 'schedule_notification_sent_at',
    responseToken: 'response_token',
    responseTokenUsedAt: 'response_token_used_at',
    sentAt: 'sent_at',
    acceptedAt: 'accepted_at',
    startedAt: 'started_at',
    completedAt: 'completed_at',
    userId: 'user_id',
  },
  mileage_entries: {
    createdAt: 'created_at',
    projectId: 'project_id',
    clientId: 'client_id',
    startLocation: 'start_location',
    endLocation: 'end_location',
    startTime: 'start_time',
    endTime: 'end_time',
    isTracking: 'is_tracking',
    taxYear: 'tax_year',
    userId: 'user_id',
  },
  capital_assets: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    purchaseDate: 'purchase_date',
    assetType: 'asset_type',
    depreciationHint: 'depreciation_hint',
    receiptId: 'receipt_id',
    userId: 'user_id',
  },
  subcontractor_payments: {
    createdAt: 'created_at',
    clientId: 'client_id',
    projectId: 'project_id',
    paymentDate: 'payment_date',
    checkNumber: 'check_number',
    userId: 'user_id',
  },
  expense_categories: {
    createdAt: 'created_at',
    irsCode: 'irs_code',
    isDefault: 'is_default',
    userId: 'user_id',
  },
  bank_expenses: {
    createdAt: 'created_at',
    expenseDate: 'expense_date',
    categoryId: 'category_id',
    isReconciled: 'is_reconciled',
    bankStatementRef: 'bank_statement_ref',
    userId: 'user_id',
  },
  project_photos: {
    createdAt: 'created_at',
    projectId: 'project_id',
    storagePath: 'storage_path',
    userId: 'user_id',
  },
  project_receipts: {
    createdAt: 'created_at',
    projectId: 'project_id',
    storagePath: 'storage_path',
    categoryId: 'category_id',
    isCapitalAsset: 'is_capital_asset',
    taxNotes: 'tax_notes',
    userId: 'user_id',
  },
};

export class CloudStorageAdapter implements StorageAdapter {
  private config: StorageConfig;
  private tableName: string;

  constructor(config: StorageConfig) {
    this.config = config;
    this.tableName = config.cloudTableName || config.tableName;
  }

  private toCloudFormat(data: Record<string, unknown>): Record<string, unknown> {
    const mapping = FIELD_MAPPINGS[this.tableName] || {};
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      // Skip sync metadata fields
      if (['localUpdatedAt', 'cloudUpdatedAt', 'syncStatus', 'cloudId', 'localBlob'].includes(key)) {
        continue;
      }
      const cloudKey = mapping[key] || key;
      result[cloudKey] = value;
    }

    // Add user_id if required
    if (this.config.requiresAuth && this.config.getUserId()) {
      result['user_id'] = this.config.getUserId();
    }

    return result;
  }

  private toLocalFormat(data: Record<string, unknown>): StorageRecord {
    const mapping = FIELD_MAPPINGS[this.tableName] || {};
    const reverseMapping: Record<string, string> = {};
    
    for (const [local, cloud] of Object.entries(mapping)) {
      reverseMapping[cloud] = local;
    }

    const result: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (key === 'user_id') continue; // Skip user_id in local format
      const localKey = reverseMapping[key] || key;
      result[localKey] = value;
    }

    return result as StorageRecord;
  }

  // Helper to execute queries with type safety bypass
  private async executeQuery(
    queryFn: () => Promise<{ data: unknown; error: unknown }>
  ): Promise<Record<string, unknown>[]> {
    const { data, error } = await queryFn();
    if (error) throw error;
    return (data || []) as Record<string, unknown>[];
  }

  private async executeSingleQuery(
    queryFn: () => Promise<{ data: unknown; error: unknown }>
  ): Promise<Record<string, unknown> | null> {
    const { data, error } = await queryFn();
    if (error) throw error;
    return data as Record<string, unknown> | null;
  }

  async getAll(): Promise<StorageRecord[]> {
    try {
      // Use any to bypass Supabase's complex generic inference
      const client = supabase as any;
      const { data, error } = await client.from(this.tableName).select('*');
      
      if (error) {
        console.error(`Error fetching from ${this.tableName}:`, error);
        throw error;
      }

      return (data || []).map((record: Record<string, unknown>) => this.toLocalFormat(record));
    } catch (err) {
      console.error(`Error in getAll for ${this.tableName}:`, err);
      throw err;
    }
  }

  async getById(id: string): Promise<StorageRecord | null> {
    try {
      const client = supabase as any;
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error(`Error fetching ${this.tableName} by id:`, error);
        throw error;
      }

      return data ? this.toLocalFormat(data) : null;
    } catch (err) {
      console.error(`Error in getById for ${this.tableName}:`, err);
      throw err;
    }
  }

  async getByIndex(indexName: string, value: string): Promise<StorageRecord[]> {
    try {
      // Convert index name to cloud format (e.g., 'by-client' -> 'client_id')
      const columnName = indexName.replace('by-', '') + '_id';
      
      const client = supabase as any;
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq(columnName, value);

      if (error) {
        console.error(`Error fetching ${this.tableName} by ${columnName}:`, error);
        throw error;
      }

      return (data || []).map((record: Record<string, unknown>) => this.toLocalFormat(record));
    } catch (err) {
      console.error(`Error in getByIndex for ${this.tableName}:`, err);
      throw err;
    }
  }

  async create(data: Record<string, unknown>): Promise<StorageRecord> {
    try {
      const cloudData = this.toCloudFormat(data);
      
      const client = supabase as any;
      const { data: created, error } = await client
        .from(this.tableName)
        .insert(cloudData)
        .select()
        .single();

      if (error) {
        console.error(`Error creating in ${this.tableName}:`, error);
        throw error;
      }

      return this.toLocalFormat(created);
    } catch (err) {
      console.error(`Error in create for ${this.tableName}:`, err);
      throw err;
    }
  }

  async update(id: string, data: Record<string, unknown>): Promise<StorageRecord | null> {
    try {
      const cloudData = this.toCloudFormat(data);
      
      const client = supabase as any;
      const { data: updated, error } = await client
        .from(this.tableName)
        .update(cloudData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(`Error updating ${this.tableName}:`, error);
        throw error;
      }

      return updated ? this.toLocalFormat(updated) : null;
    } catch (err) {
      console.error(`Error in update for ${this.tableName}:`, err);
      throw err;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const client = supabase as any;
      const { error } = await client
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        console.error(`Error deleting from ${this.tableName}:`, error);
        throw error;
      }

      return true;
    } catch (err) {
      console.error(`Error in delete for ${this.tableName}:`, err);
      throw err;
    }
  }

  async count(): Promise<number> {
    try {
      const client = supabase as any;
      const { count, error } = await client
        .from(this.tableName)
        .select('id', { count: 'exact', head: true });

      if (error) {
        console.error(`Error counting ${this.tableName}:`, error);
        throw error;
      }

      return count || 0;
    } catch (err) {
      console.error(`Error in count for ${this.tableName}:`, err);
      throw err;
    }
  }
}

export function createCloudStorageAdapter(config: StorageConfig): CloudStorageAdapter {
  return new CloudStorageAdapter(config);
}
