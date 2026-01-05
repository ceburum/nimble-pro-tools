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
