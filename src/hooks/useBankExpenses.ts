import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface BankExpense {
  id: string;
  userId: string;
  amount: number;
  description: string;
  expenseDate: Date;
  vendor: string | null;
  categoryId: string | null;
  bankStatementRef: string | null;
  isReconciled: boolean;
  createdAt: Date;
}

interface BankExpenseInsert {
  amount: number;
  description: string;
  expenseDate: Date;
  vendor?: string;
  categoryId?: string;
  bankStatementRef?: string;
  isReconciled?: boolean;
}

export function useBankExpenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<BankExpense[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = useCallback(async () => {
    if (!user) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('bank_expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('expense_date', { ascending: false });

      if (error) {
        console.error('Error fetching bank expenses:', error);
        return;
      }

      const mapped = (data || []).map((e) => ({
        id: e.id,
        userId: e.user_id,
        amount: Number(e.amount),
        description: e.description,
        expenseDate: new Date(e.expense_date),
        vendor: e.vendor,
        categoryId: e.category_id,
        bankStatementRef: e.bank_statement_ref,
        isReconciled: e.is_reconciled,
        createdAt: new Date(e.created_at),
      }));

      setExpenses(mapped);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const addExpense = async (expense: BankExpenseInsert): Promise<BankExpense | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('bank_expenses')
        .insert({
          user_id: user.id,
          amount: expense.amount,
          description: expense.description,
          expense_date: expense.expenseDate.toISOString().split('T')[0],
          vendor: expense.vendor || null,
          category_id: expense.categoryId || null,
          bank_statement_ref: expense.bankStatementRef || null,
          is_reconciled: expense.isReconciled ?? false,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding bank expense:', error);
        return null;
      }

      const newExpense: BankExpense = {
        id: data.id,
        userId: data.user_id,
        amount: Number(data.amount),
        description: data.description,
        expenseDate: new Date(data.expense_date),
        vendor: data.vendor,
        categoryId: data.category_id,
        bankStatementRef: data.bank_statement_ref,
        isReconciled: data.is_reconciled,
        createdAt: new Date(data.created_at),
      };

      setExpenses((prev) => [newExpense, ...prev]);
      return newExpense;
    } catch (err) {
      console.error('Error:', err);
      return null;
    }
  };

  const updateExpense = async (id: string, updates: Partial<BankExpenseInsert>): Promise<boolean> => {
    if (!user) return false;

    try {
      const updateData: Record<string, unknown> = {};
      if (updates.amount !== undefined) updateData.amount = updates.amount;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.expenseDate !== undefined) updateData.expense_date = updates.expenseDate.toISOString().split('T')[0];
      if (updates.vendor !== undefined) updateData.vendor = updates.vendor;
      if (updates.categoryId !== undefined) updateData.category_id = updates.categoryId;
      if (updates.bankStatementRef !== undefined) updateData.bank_statement_ref = updates.bankStatementRef;
      if (updates.isReconciled !== undefined) updateData.is_reconciled = updates.isReconciled;

      const { error } = await supabase
        .from('bank_expenses')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating bank expense:', error);
        return false;
      }

      await fetchExpenses();
      return true;
    } catch (err) {
      console.error('Error:', err);
      return false;
    }
  };

  const deleteExpense = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('bank_expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting bank expense:', error);
        return false;
      }

      setExpenses((prev) => prev.filter((e) => e.id !== id));
      return true;
    } catch (err) {
      console.error('Error:', err);
      return false;
    }
  };

  return {
    expenses,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    refetch: fetchExpenses,
  };
}
