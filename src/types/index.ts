export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: Date;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Quote {
  id: string;
  clientId: string;
  client?: Client;
  title: string;
  items: LineItem[];
  status: 'draft' | 'sent' | 'accepted' | 'declined';
  createdAt: Date;
  validUntil: Date;
  notes?: string;
}

export interface Invoice {
  id: string;
  quoteId?: string;
  clientId: string;
  client?: Client;
  invoiceNumber: string;
  items: LineItem[];
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  createdAt: Date;
  dueDate: Date;
  paidAt?: Date;
  notes?: string;
}

// Project photos and receipts
export interface ProjectPhoto {
  id: string;
  projectId: string;
  type: 'before' | 'after' | 'progress';
  dataUrl: string; // Base64 stored locally
  caption?: string;
  createdAt: Date;
}

export interface ProjectReceipt {
  id: string;
  projectId: string;
  dataUrl: string;
  description: string;
  amount: number;
  createdAt: Date;
}

// Mileage tracking
export interface MileageEntry {
  id: string;
  projectId?: string;
  startLocation: string;
  endLocation: string;
  distance: number; // miles
  startTime: Date;
  endTime?: Date;
  isTracking: boolean;
  coordinates?: { lat: number; lng: number }[];
  notes?: string;
}

// Unified Project type (combines Quote + Job)
export interface Project {
  id: string;
  clientId: string;
  title: string;
  description?: string;
  // Quote fields
  items: LineItem[];
  validUntil?: Date;
  quoteNotes?: string;
  // Status flows: draft -> sent -> accepted -> in_progress -> completed -> invoiced
  status: 'draft' | 'sent' | 'accepted' | 'in_progress' | 'completed' | 'invoiced';
  // Job tracking fields
  photos: ProjectPhoto[];
  receipts: ProjectReceipt[];
  mileageEntries: MileageEntry[];
  // Invoice reference
  invoiceId?: string;
  // Timestamps
  createdAt: Date;
  sentAt?: Date;
  acceptedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
}

// Legacy types for backwards compatibility
export interface JobPhoto {
  id: string;
  jobId: string;
  type: 'before' | 'after';
  dataUrl: string;
  caption?: string;
  createdAt: Date;
}

export interface Receipt {
  id: string;
  jobId: string;
  dataUrl: string;
  description: string;
  amount: number;
  createdAt: Date;
}

export interface Job {
  id: string;
  clientId: string;
  quoteId?: string;
  invoiceId?: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  photos: JobPhoto[];
  receipts: Receipt[];
  mileageEntries: MileageEntry[];
  createdAt: Date;
  completedAt?: Date;
}
