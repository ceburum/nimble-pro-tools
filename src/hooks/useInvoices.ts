import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { LineItem } from '@/types';

export interface Invoice {
  id: string;
  clientId: string;
  invoiceNumber: string;
  items: LineItem[];
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: Date;
  createdAt: Date;
  notes?: string;
  paidAt?: Date;
  paymentToken?: string;
  userId?: string;
  receiptAttachments?: string[];
}

interface DbInvoice {
  id: string;
  client_id: string;
  invoice_number: string;
  items: unknown;
  status: string;
  due_date: string;
  created_at: string;
  notes: string | null;
  paid_at: string | null;
  payment_token: string | null;
  user_id: string | null;
  receipt_attachments: unknown;
}

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const parseInvoice = (inv: DbInvoice): Invoice => {
    const rawItems = inv.items;
    const items: LineItem[] = Array.isArray(rawItems)
      ? (rawItems as unknown as LineItem[])
      : [];

    const rawAttachments = inv.receipt_attachments;
    const receiptAttachments: string[] = Array.isArray(rawAttachments)
      ? (rawAttachments as string[])
      : [];

    return {
      id: inv.id,
      clientId: inv.client_id,
      invoiceNumber: inv.invoice_number,
      items,
      status: inv.status as Invoice['status'],
      dueDate: new Date(inv.due_date),
      createdAt: new Date(inv.created_at),
      notes: inv.notes || undefined,
      paidAt: inv.paid_at ? new Date(inv.paid_at) : undefined,
      paymentToken: inv.payment_token || undefined,
      userId: inv.user_id || undefined,
      receiptAttachments: receiptAttachments.length > 0 ? receiptAttachments : undefined,
    };
  };

  const fetchInvoices = async () => {
    if (!user) {
      setInvoices([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setInvoices((data as DbInvoice[]).map(parseInvoice));
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      toast({
        title: 'Error',
        description: 'Failed to load invoices.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [user]);

  const addInvoice = async (
    data: Omit<Invoice, 'id' | 'createdAt' | 'paymentToken' | 'userId'>
  ) => {
    if (!user) return null;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newInvoice, error } = await supabase
        .from('invoices')
        .insert([{
          client_id: data.clientId,
          invoice_number: data.invoiceNumber,
          items: data.items as any, // jsonb accepts arrays directly
          status: data.status,
          due_date: data.dueDate.toISOString(),
          notes: data.notes || null,
          user_id: user.id,
          receipt_attachments: data.receiptAttachments || [],
        }])
        .select()
        .single();

      if (error) throw error;

      const invoice = parseInvoice(newInvoice as DbInvoice);
      setInvoices((prev) => [invoice, ...prev]);
      return invoice;
    } catch (error: any) {
      console.error('Error adding invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to create invoice.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateInvoice = async (id: string, data: Partial<Invoice>) => {
    try {
      const updateData: Record<string, unknown> = {};
      if (data.clientId !== undefined) updateData.client_id = data.clientId;
      if (data.invoiceNumber !== undefined) updateData.invoice_number = data.invoiceNumber;
      if (data.items !== undefined) updateData.items = data.items as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (data.status !== undefined) updateData.status = data.status;
      if (data.dueDate !== undefined) updateData.due_date = data.dueDate.toISOString();
      if (data.notes !== undefined) updateData.notes = data.notes || null;
      if (data.paidAt !== undefined) updateData.paid_at = data.paidAt?.toISOString() || null;

      const { error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setInvoices((prev) =>
        prev.map((inv) => (inv.id === id ? { ...inv, ...data } : inv))
      );
      return true;
    } catch (error: any) {
      console.error('Error updating invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to update invoice.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteInvoice = async (id: string) => {
    try {
      const { error } = await supabase.from('invoices').delete().eq('id', id);

      if (error) throw error;

      setInvoices((prev) => prev.filter((inv) => inv.id !== id));
      return true;
    } catch (error: any) {
      console.error('Error deleting invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete invoice.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    invoices,
    loading,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    refetch: fetchInvoices,
  };
}
