import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface ExpenseCategory {
  id: string;
  name: string;
  irsCode: string | null;
  isDefault: boolean;
}

export function useExpenseCategories() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .order('name');

      if (error) throw error;

      setCategories(
        (data || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          irsCode: c.irs_code,
          isDefault: c.is_default,
        }))
      );
    } catch (error) {
      console.error('Error fetching expense categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load expense categories.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const addCategory = async (name: string): Promise<ExpenseCategory | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .insert({
          user_id: user.id,
          name,
          is_default: false,
        })
        .select()
        .single();

      if (error) throw error;

      const newCategory: ExpenseCategory = {
        id: data.id,
        name: data.name,
        irsCode: data.irs_code,
        isDefault: data.is_default,
      };

      setCategories((prev) => [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)));
      return newCategory;
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: 'Error',
        description: 'Failed to add category.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateCategory = async (id: string, name: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('expense_categories')
        .update({ name })
        .eq('id', id);

      if (error) throw error;

      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, name } : c))
      );
      return true;
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: 'Error',
        description: 'Failed to update category.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteCategory = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('expense_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCategories((prev) => prev.filter((c) => c.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete category.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    categories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
}
