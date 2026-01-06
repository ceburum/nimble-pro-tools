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

// Job photos and receipts
export interface JobPhoto {
  id: string;
  jobId: string;
  type: 'before' | 'after';
  dataUrl: string; // Base64 stored locally
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

// Mileage tracking
export interface MileageEntry {
  id: string;
  jobId?: string;
  startLocation: string;
  endLocation: string;
  distance: number; // miles
  startTime: Date;
  endTime?: Date;
  isTracking: boolean;
  coordinates?: { lat: number; lng: number }[];
  notes?: string;
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
