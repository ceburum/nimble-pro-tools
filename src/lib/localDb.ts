import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Sync metadata added to all records
export interface SyncMetadata {
  localUpdatedAt: string;
  cloudUpdatedAt: string | null;
  syncStatus: 'synced' | 'pending_push' | 'pending_pull' | 'conflict';
  cloudId: string | null;
}

// Local record types matching Supabase schema with sync metadata
export interface LocalClient extends SyncMetadata {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
  legalName?: string;
  tinType?: string;
  tinEncrypted?: string;
  is1099Eligible?: boolean;
  isSubcontractor?: boolean;
}

export interface LocalLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface LocalInvoice extends SyncMetadata {
  id: string;
  clientId: string;
  invoiceNumber: string;
  items: LocalLineItem[];
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  createdAt: string;
  dueDate: string;
  paidAt?: string;
  notes?: string;
  paymentToken?: string;
  receiptAttachments?: { storagePath: string; storeName: string; amount: number }[];
}

export interface LocalProject extends SyncMetadata {
  id: string;
  clientId: string;
  title: string;
  description?: string;
  items: LocalLineItem[];
  status: 'draft' | 'sent' | 'accepted' | 'in_progress' | 'completed' | 'invoiced';
  validUntil?: string;
  quoteNotes?: string;
  invoiceId?: string;
  scheduledDate?: string;
  arrivalWindowStart?: string;
  arrivalWindowEnd?: string;
  scheduleNotes?: string;
  scheduleNotificationSentAt?: string;
  createdAt: string;
  sentAt?: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  responseToken?: string;
}

export interface LocalProjectPhoto extends SyncMetadata {
  id: string;
  projectId: string;
  type: 'before' | 'after' | 'progress';
  storagePath: string;
  localBlob?: Blob; // For offline storage
  caption?: string;
  createdAt: string;
}

export interface LocalProjectReceipt extends SyncMetadata {
  id: string;
  projectId: string;
  storagePath: string;
  localBlob?: Blob;
  description: string;
  amount: number;
  vendor?: string;
  categoryId?: string;
  isCapitalAsset?: boolean;
  taxNotes?: string;
  createdAt: string;
}

export interface LocalMileageEntry extends SyncMetadata {
  id: string;
  projectId?: string;
  clientId?: string;
  startLocation?: string;
  endLocation?: string;
  distance: number;
  startTime?: string;
  endTime?: string;
  isTracking: boolean;
  coordinates?: { lat: number; lng: number }[];
  purpose?: string;
  taxYear?: number;
  createdAt: string;
}

export interface LocalCapitalAsset extends SyncMetadata {
  id: string;
  description: string;
  cost: number;
  purchaseDate: string;
  assetType: string;
  depreciationHint?: string;
  notes?: string;
  receiptId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocalSubcontractorPayment extends SyncMetadata {
  id: string;
  clientId: string;
  projectId?: string;
  amount: number;
  paymentDate: string;
  description?: string;
  checkNumber?: string;
  createdAt: string;
}

export interface LocalExpenseCategory extends SyncMetadata {
  id: string;
  name: string;
  irsCode?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface LocalBankExpense extends SyncMetadata {
  id: string;
  description: string;
  amount: number;
  expenseDate: string;
  vendor?: string;
  categoryId?: string;
  isReconciled: boolean;
  bankStatementRef?: string;
  createdAt: string;
}

export interface LocalTransaction extends SyncMetadata {
  id: string;
  description: string;
  amount: number;
  transactionDate: string;
  transactionType: 'income' | 'expense';
  categoryId?: string;
  matchedInvoiceId?: string;
  matchedReceiptId?: string;
  matchConfidence?: string;
  source: string;
  sourceReference?: string;
  isIgnored: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LocalMaterial extends SyncMetadata {
  id: string;
  name: string;
  unit: string;
  unitPrice: number;
  description?: string;
  sku?: string;
  category?: string;
  supplier?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocalUserSettings extends SyncMetadata {
  id: string;
  companyName?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  tagline?: string;
  licenseNumber?: string;
  invoicePrefix?: string;
  paymentInstructions?: string;
  dashboardLogoUrl?: string;
  localLogoBlob?: Blob;
  irsMileageRate?: number;
  taxRateEstimate?: number;
  mileageProEnabled: boolean;
  schedulingProEnabled: boolean;
  financialProEnabled: boolean;
  taxProEnabled: boolean;
  aiScansUsed: number;
  aiScansPeriod?: string;
  partnerSuggestionsDismissed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LocalIrsMileageRate {
  year: number;
  ratePerMile: number;
  createdAt: string;
}

// Pending sync queue item
export interface SyncQueueItem {
  id: string;
  tableName: string;
  recordId: string;
  operation: 'create' | 'update' | 'delete';
  data?: unknown;
  createdAt: string;
  retryCount: number;
  lastError?: string;
}

// Migration status
export interface MigrationStatus {
  id: string;
  cloudMigrationCompleted: boolean;
  cloudMigrationDate?: string;
  localDataCreated: boolean;
  lastSyncDate?: string;
}

// IndexedDB Schema
interface NimbleDBSchema extends DBSchema {
  clients: {
    key: string;
    value: LocalClient;
    indexes: { 'by-sync-status': string };
  };
  invoices: {
    key: string;
    value: LocalInvoice;
    indexes: { 'by-client': string; 'by-sync-status': string };
  };
  projects: {
    key: string;
    value: LocalProject;
    indexes: { 'by-client': string; 'by-sync-status': string };
  };
  projectPhotos: {
    key: string;
    value: LocalProjectPhoto;
    indexes: { 'by-project': string; 'by-sync-status': string };
  };
  projectReceipts: {
    key: string;
    value: LocalProjectReceipt;
    indexes: { 'by-project': string; 'by-sync-status': string };
  };
  mileageEntries: {
    key: string;
    value: LocalMileageEntry;
    indexes: { 'by-project': string; 'by-client': string; 'by-sync-status': string };
  };
  capitalAssets: {
    key: string;
    value: LocalCapitalAsset;
    indexes: { 'by-sync-status': string };
  };
  subcontractorPayments: {
    key: string;
    value: LocalSubcontractorPayment;
    indexes: { 'by-client': string; 'by-sync-status': string };
  };
  expenseCategories: {
    key: string;
    value: LocalExpenseCategory;
    indexes: { 'by-sync-status': string };
  };
  bankExpenses: {
    key: string;
    value: LocalBankExpense;
    indexes: { 'by-sync-status': string };
  };
  transactions: {
    key: string;
    value: LocalTransaction;
    indexes: { 'by-sync-status': string };
  };
  materials: {
    key: string;
    value: LocalMaterial;
    indexes: { 'by-sync-status': string };
  };
  userSettings: {
    key: string;
    value: LocalUserSettings;
  };
  irsMileageRates: {
    key: number;
    value: LocalIrsMileageRate;
  };
  syncQueue: {
    key: string;
    value: SyncQueueItem;
    indexes: { 'by-table': string };
  };
  migrationStatus: {
    key: string;
    value: MigrationStatus;
  };
}

const DB_NAME = 'nimble-pro-tools';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<NimbleDBSchema> | null = null;

export async function getDb(): Promise<IDBPDatabase<NimbleDBSchema>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<NimbleDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Clients
      const clientStore = db.createObjectStore('clients', { keyPath: 'id' });
      clientStore.createIndex('by-sync-status', 'syncStatus');

      // Invoices
      const invoiceStore = db.createObjectStore('invoices', { keyPath: 'id' });
      invoiceStore.createIndex('by-client', 'clientId');
      invoiceStore.createIndex('by-sync-status', 'syncStatus');

      // Projects
      const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
      projectStore.createIndex('by-client', 'clientId');
      projectStore.createIndex('by-sync-status', 'syncStatus');

      // Project Photos
      const photoStore = db.createObjectStore('projectPhotos', { keyPath: 'id' });
      photoStore.createIndex('by-project', 'projectId');
      photoStore.createIndex('by-sync-status', 'syncStatus');

      // Project Receipts
      const receiptStore = db.createObjectStore('projectReceipts', { keyPath: 'id' });
      receiptStore.createIndex('by-project', 'projectId');
      receiptStore.createIndex('by-sync-status', 'syncStatus');

      // Mileage Entries
      const mileageStore = db.createObjectStore('mileageEntries', { keyPath: 'id' });
      mileageStore.createIndex('by-project', 'projectId');
      mileageStore.createIndex('by-client', 'clientId');
      mileageStore.createIndex('by-sync-status', 'syncStatus');

      // Capital Assets
      const assetStore = db.createObjectStore('capitalAssets', { keyPath: 'id' });
      assetStore.createIndex('by-sync-status', 'syncStatus');

      // Subcontractor Payments
      const paymentStore = db.createObjectStore('subcontractorPayments', { keyPath: 'id' });
      paymentStore.createIndex('by-client', 'clientId');
      paymentStore.createIndex('by-sync-status', 'syncStatus');

      // Expense Categories
      const categoryStore = db.createObjectStore('expenseCategories', { keyPath: 'id' });
      categoryStore.createIndex('by-sync-status', 'syncStatus');

      // Bank Expenses
      const bankExpenseStore = db.createObjectStore('bankExpenses', { keyPath: 'id' });
      bankExpenseStore.createIndex('by-sync-status', 'syncStatus');

      // Transactions
      const transactionStore = db.createObjectStore('transactions', { keyPath: 'id' });
      transactionStore.createIndex('by-sync-status', 'syncStatus');

      // Materials
      const materialStore = db.createObjectStore('materials', { keyPath: 'id' });
      materialStore.createIndex('by-sync-status', 'syncStatus');

      // User Settings (single record per user)
      db.createObjectStore('userSettings', { keyPath: 'id' });

      // IRS Mileage Rates (reference data)
      db.createObjectStore('irsMileageRates', { keyPath: 'year' });

      // Sync Queue
      const syncQueueStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
      syncQueueStore.createIndex('by-table', 'tableName');

      // Migration Status
      db.createObjectStore('migrationStatus', { keyPath: 'id' });
    },
  });

  return dbInstance;
}

// Helper to generate UUIDs locally
export function generateLocalId(): string {
  return crypto.randomUUID();
}

// Helper to create sync metadata for new local records
export function createSyncMetadata(cloudId: string | null = null): SyncMetadata {
  return {
    localUpdatedAt: new Date().toISOString(),
    cloudUpdatedAt: null,
    syncStatus: cloudId ? 'synced' : 'pending_push',
    cloudId,
  };
}

// Helper to update sync metadata after local change
export function updateSyncMetadata(existing: SyncMetadata): SyncMetadata {
  return {
    ...existing,
    localUpdatedAt: new Date().toISOString(),
    syncStatus: existing.cloudId ? 'pending_push' : 'pending_push',
  };
}

// Get all records pending sync
export async function getPendingSyncRecords(
  tableName: string
): Promise<unknown[]> {
  const db = await getDb();
  
  // Check if this store has the sync status index
  if (['userSettings', 'irsMileageRates', 'migrationStatus'].includes(tableName)) {
    return [];
  }

  // Get all records and filter by sync status
  const storeName = tableName as 'clients' | 'invoices' | 'projects' | 'mileageEntries';
  const allRecords = await db.getAll(storeName);
  return allRecords.filter((record: any) => record.syncStatus === 'pending_push');
}

// Clear database (for testing/reset)
export async function clearDatabase(): Promise<void> {
  const db = await getDb();
  const storeNames = Array.from(db.objectStoreNames);
  const tx = db.transaction(storeNames, 'readwrite');
  
  for (const storeName of storeNames) {
    await tx.objectStore(storeName).clear();
  }
  
  await tx.done;
}
