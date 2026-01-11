import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Material {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  unitPrice: number;
  category: string | null;
  supplier: string | null;
  sku: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaterialInput {
  name: string;
  description?: string;
  unit: string;
  unitPrice: number;
  category?: string;
  supplier?: string;
  sku?: string;
}

export function useMaterials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchMaterials = async () => {
    if (!user) {
      setMaterials([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      setMaterials(
        (data || []).map((m) => ({
          id: m.id,
          name: m.name,
          description: m.description,
          unit: m.unit,
          unitPrice: Number(m.unit_price),
          category: m.category,
          supplier: m.supplier,
          sku: m.sku,
          createdAt: new Date(m.created_at),
          updatedAt: new Date(m.updated_at),
        }))
      );
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast.error('Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [user]);

  const addMaterial = async (input: MaterialInput): Promise<Material | null> => {
    if (!user) {
      toast.error('You must be logged in');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('materials')
        .insert({
          user_id: user.id,
          name: input.name,
          description: input.description || null,
          unit: input.unit,
          unit_price: input.unitPrice,
          category: input.category || null,
          supplier: input.supplier || null,
          sku: input.sku || null,
        })
        .select()
        .single();

      if (error) throw error;

      const newMaterial: Material = {
        id: data.id,
        name: data.name,
        description: data.description,
        unit: data.unit,
        unitPrice: Number(data.unit_price),
        category: data.category,
        supplier: data.supplier,
        sku: data.sku,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      setMaterials((prev) => [...prev, newMaterial].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success('Material added');
      return newMaterial;
    } catch (error) {
      console.error('Error adding material:', error);
      toast.error('Failed to add material');
      return null;
    }
  };

  const updateMaterial = async (id: string, input: Partial<MaterialInput>): Promise<boolean> => {
    if (!user) {
      toast.error('You must be logged in');
      return false;
    }

    try {
      const updateData: Record<string, unknown> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description || null;
      if (input.unit !== undefined) updateData.unit = input.unit;
      if (input.unitPrice !== undefined) updateData.unit_price = input.unitPrice;
      if (input.category !== undefined) updateData.category = input.category || null;
      if (input.supplier !== undefined) updateData.supplier = input.supplier || null;
      if (input.sku !== undefined) updateData.sku = input.sku || null;

      const { error } = await supabase
        .from('materials')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setMaterials((prev) =>
        prev
          .map((m) =>
            m.id === id
              ? {
                  ...m,
                  ...input,
                  updatedAt: new Date(),
                }
              : m
          )
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      toast.success('Material updated');
      return true;
    } catch (error) {
      console.error('Error updating material:', error);
      toast.error('Failed to update material');
      return false;
    }
  };

  const deleteMaterial = async (id: string): Promise<boolean> => {
    if (!user) {
      toast.error('You must be logged in');
      return false;
    }

    try {
      const { error } = await supabase.from('materials').delete().eq('id', id);

      if (error) throw error;

      setMaterials((prev) => prev.filter((m) => m.id !== id));
      toast.success('Material deleted');
      return true;
    } catch (error) {
      console.error('Error deleting material:', error);
      toast.error('Failed to delete material');
      return false;
    }
  };

  return {
    materials,
    loading,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    refetch: fetchMaterials,
  };
}
