import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface CapitalAsset {
  id: string;
  description: string;
  purchaseDate: Date;
  cost: number;
  assetType: 'equipment' | 'vehicle' | 'tools' | 'other';
  depreciationHint: 'likely_depreciable' | 'section_179_candidate' | null;
  notes: string | null;
  receiptId: string | null;
  createdAt: Date;
}

interface DbCapitalAsset {
  id: string;
  description: string;
  purchase_date: string;
  cost: number;
  asset_type: string;
  depreciation_hint: string | null;
  notes: string | null;
  receipt_id: string | null;
  created_at: string;
}

export function useCapitalAssets() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<CapitalAsset[]>([]);
  const [loading, setLoading] = useState(true);

  const mapDbToAsset = (db: DbCapitalAsset): CapitalAsset => ({
    id: db.id,
    description: db.description,
    purchaseDate: new Date(db.purchase_date),
    cost: Number(db.cost),
    assetType: db.asset_type as CapitalAsset['assetType'],
    depreciationHint: db.depreciation_hint as CapitalAsset['depreciationHint'],
    notes: db.notes,
    receiptId: db.receipt_id,
    createdAt: new Date(db.created_at)
  });

  const fetchAssets = useCallback(async () => {
    if (!user) {
      setAssets([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('capital_assets')
        .select('*')
        .eq('user_id', user.id)
        .order('purchase_date', { ascending: false });

      if (error) {
        console.error('Error fetching capital assets:', error);
        setAssets([]);
      } else {
        setAssets((data || []).map(mapDbToAsset));
      }
    } catch (err) {
      console.error('Error:', err);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const addAsset = async (asset: Omit<CapitalAsset, 'id' | 'createdAt'>) => {
    if (!user) return null;

    // Determine depreciation hint based on cost
    let depreciationHint: CapitalAsset['depreciationHint'] = null;
    if (asset.cost >= 2500) {
      depreciationHint = 'likely_depreciable';
    }
    if (asset.assetType === 'equipment' || asset.assetType === 'vehicle') {
      depreciationHint = 'section_179_candidate';
    }

    try {
      const { data, error } = await supabase
        .from('capital_assets')
        .insert({
          user_id: user.id,
          description: asset.description,
          purchase_date: asset.purchaseDate.toISOString().split('T')[0],
          cost: asset.cost,
          asset_type: asset.assetType,
          depreciation_hint: depreciationHint,
          notes: asset.notes,
          receipt_id: asset.receiptId
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding capital asset:', error);
        return null;
      }

      const newAsset = mapDbToAsset(data);
      setAssets(prev => [newAsset, ...prev]);
      return newAsset;
    } catch (err) {
      console.error('Error:', err);
      return null;
    }
  };

  const updateAsset = async (id: string, updates: Partial<Omit<CapitalAsset, 'id' | 'createdAt'>>) => {
    if (!user) return false;

    try {
      const updateData: Record<string, unknown> = {};
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.purchaseDate !== undefined) updateData.purchase_date = updates.purchaseDate.toISOString().split('T')[0];
      if (updates.cost !== undefined) updateData.cost = updates.cost;
      if (updates.assetType !== undefined) updateData.asset_type = updates.assetType;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.receiptId !== undefined) updateData.receipt_id = updates.receiptId;

      const { error } = await supabase
        .from('capital_assets')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating capital asset:', error);
        return false;
      }

      await fetchAssets();
      return true;
    } catch (err) {
      console.error('Error:', err);
      return false;
    }
  };

  const deleteAsset = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('capital_assets')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting capital asset:', error);
        return false;
      }

      setAssets(prev => prev.filter(a => a.id !== id));
      return true;
    } catch (err) {
      console.error('Error:', err);
      return false;
    }
  };

  const totalAssetValue = assets.reduce((sum, a) => sum + a.cost, 0);

  return {
    assets,
    loading,
    addAsset,
    updateAsset,
    deleteAsset,
    totalAssetValue,
    refresh: fetchAssets
  };
}
