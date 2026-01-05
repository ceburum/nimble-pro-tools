import { Client, Quote, Invoice } from '@/types';

export const mockClients: Client[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '(555) 123-4567',
    address: '123 Main St, Anytown, ST 12345',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    phone: '(555) 234-5678',
    address: '456 Oak Ave, Somewhere, ST 23456',
    createdAt: new Date('2024-02-20'),
  },
  {
    id: '3',
    name: 'Mike Williams',
    email: 'mike.w@email.com',
    phone: '(555) 345-6789',
    address: '789 Pine Rd, Elsewhere, ST 34567',
    createdAt: new Date('2024-03-10'),
  },
];

export const mockQuotes: Quote[] = [
  {
    id: '1',
    clientId: '1',
    title: 'Kitchen Renovation',
    items: [
      { id: '1', description: 'Cabinet installation', quantity: 1, unitPrice: 3500 },
      { id: '2', description: 'Countertop replacement', quantity: 1, unitPrice: 2200 },
      { id: '3', description: 'Labor (hours)', quantity: 40, unitPrice: 75 },
    ],
    status: 'sent',
    createdAt: new Date('2024-12-01'),
    validUntil: new Date('2025-01-01'),
    notes: 'Materials included in price.',
  },
  {
    id: '2',
    clientId: '2',
    title: 'Bathroom Remodel',
    items: [
      { id: '1', description: 'Tile installation', quantity: 120, unitPrice: 15 },
      { id: '2', description: 'Plumbing fixtures', quantity: 3, unitPrice: 450 },
      { id: '3', description: 'Labor (hours)', quantity: 24, unitPrice: 75 },
    ],
    status: 'accepted',
    createdAt: new Date('2024-11-20'),
    validUntil: new Date('2024-12-20'),
  },
];

export const mockInvoices: Invoice[] = [
  {
    id: '1',
    quoteId: '2',
    clientId: '2',
    invoiceNumber: 'INV-2024-001',
    items: [
      { id: '1', description: 'Tile installation', quantity: 120, unitPrice: 15 },
      { id: '2', description: 'Plumbing fixtures', quantity: 3, unitPrice: 450 },
      { id: '3', description: 'Labor (hours)', quantity: 24, unitPrice: 75 },
    ],
    status: 'paid',
    createdAt: new Date('2024-12-01'),
    dueDate: new Date('2024-12-31'),
    paidAt: new Date('2024-12-15'),
  },
  {
    id: '2',
    clientId: '3',
    invoiceNumber: 'INV-2024-002',
    items: [
      { id: '1', description: 'Deck repair', quantity: 1, unitPrice: 1200 },
      { id: '2', description: 'Materials', quantity: 1, unitPrice: 450 },
    ],
    status: 'sent',
    createdAt: new Date('2024-12-20'),
    dueDate: new Date('2025-01-20'),
  },
];
