import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SubcontractorPayment {
  id: string;
  clientId: string;
  projectId: string | null;
  amount: number;
  paymentDate: Date;
  description: string | null;
  checkNumber: string | null;
  createdAt: Date;
}

interface DbSubcontractorPayment {
  id: string;
  client_id: string;
  project_id: string | null;
  amount: number;
  payment_date: string;
  description: string | null;
  check_number: string | null;
  created_at: string;
}

export function useSubcontractorPayments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<SubcontractorPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const mapDbToPayment = (db: DbSubcontractorPayment): SubcontractorPayment => ({
    id: db.id,
    clientId: db.client_id,
    projectId: db.project_id,
    amount: Number(db.amount),
    paymentDate: new Date(db.payment_date),
    description: db.description,
    checkNumber: db.check_number,
    createdAt: new Date(db.created_at)
  });

  const fetchPayments = useCallback(async () => {
    if (!user) {
      setPayments([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subcontractor_payments')
        .select('*')
        .eq('user_id', user.id)
        .order('payment_date', { ascending: false });

      if (error) {
        console.error('Error fetching subcontractor payments:', error);
        setPayments([]);
      } else {
        setPayments((data || []).map(mapDbToPayment));
      }
    } catch (err) {
      console.error('Error:', err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const addPayment = async (payment: Omit<SubcontractorPayment, 'id' | 'createdAt'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('subcontractor_payments')
        .insert({
          user_id: user.id,
          client_id: payment.clientId,
          project_id: payment.projectId,
          amount: payment.amount,
          payment_date: payment.paymentDate.toISOString().split('T')[0],
          description: payment.description,
          check_number: payment.checkNumber
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding subcontractor payment:', error);
        return null;
      }

      const newPayment = mapDbToPayment(data);
      setPayments(prev => [newPayment, ...prev]);
      return newPayment;
    } catch (err) {
      console.error('Error:', err);
      return null;
    }
  };

  const deletePayment = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('subcontractor_payments')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting subcontractor payment:', error);
        return false;
      }

      setPayments(prev => prev.filter(p => p.id !== id));
      return true;
    } catch (err) {
      console.error('Error:', err);
      return false;
    }
  };

  // Get payments by client for 1099 threshold tracking
  const getPaymentsByClient = (clientId: string, year?: number) => {
    return payments.filter(p => {
      const matchesClient = p.clientId === clientId;
      if (!year) return matchesClient;
      return matchesClient && p.paymentDate.getFullYear() === year;
    });
  };

  const getTotalByClient = (clientId: string, year?: number) => {
    return getPaymentsByClient(clientId, year).reduce((sum, p) => sum + p.amount, 0);
  };

  return {
    payments,
    loading,
    addPayment,
    deletePayment,
    getPaymentsByClient,
    getTotalByClient,
    refresh: fetchPayments
  };
}
