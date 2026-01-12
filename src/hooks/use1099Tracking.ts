import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useSubcontractorPayments } from './useSubcontractorPayments';

export interface Client1099Info {
  id: string;
  name: string;
  email: string;
  address: string;
  is1099Eligible: boolean;
  legalName: string | null;
  tinEncrypted: string | null;
  tinType: 'ein' | 'ssn' | null;
  isSubcontractor: boolean;
}

interface DbClient {
  id: string;
  name: string;
  email: string;
  address: string;
  is_1099_eligible: boolean | null;
  legal_name: string | null;
  tin_encrypted: string | null;
  tin_type: string | null;
  is_subcontractor: boolean | null;
}

export const THRESHOLD_1099 = 600;

export function use1099Tracking() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client1099Info[]>([]);
  const [loading, setLoading] = useState(true);
  const { getTotalByClient } = useSubcontractorPayments();

  const mapDbToClient = (db: DbClient): Client1099Info => ({
    id: db.id,
    name: db.name,
    email: db.email,
    address: db.address,
    is1099Eligible: db.is_1099_eligible ?? false,
    legalName: db.legal_name,
    tinEncrypted: db.tin_encrypted,
    tinType: db.tin_type as Client1099Info['tinType'],
    isSubcontractor: db.is_subcontractor ?? false
  });

  const fetchClients = useCallback(async () => {
    if (!user) {
      setClients([]);
      setLoading(false);
      return;
    }

    try {
      // Don't fetch tin_encrypted from client side - it's handled securely via Edge Function
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, email, address, is_1099_eligible, legal_name, tin_type, is_subcontractor')
        .eq('user_id', user.id)
        .order('name');

      if (error) {
        console.error('Error fetching clients for 1099:', error);
        setClients([]);
      } else {
        // Map clients without tin_encrypted (it's handled server-side now)
        setClients((data || []).map((db: any) => ({
          id: db.id,
          name: db.name,
          email: db.email,
          address: db.address,
          is1099Eligible: db.is_1099_eligible ?? false,
          legalName: db.legal_name,
          tinEncrypted: null, // Don't expose - check via Edge Function
          tinType: db.tin_type as Client1099Info['tinType'],
          isSubcontractor: db.is_subcontractor ?? false
        })));
      }
    } catch (err) {
      console.error('Error:', err);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const update1099Info = async (
    clientId: string,
    updates: Partial<{
      is1099Eligible: boolean;
      legalName: string | null;
      tinEncrypted: string | null;
      tinType: 'ein' | 'ssn' | null;
      isSubcontractor: boolean;
    }>
  ) => {
    if (!user) return false;

    try {
      const updateData: Record<string, unknown> = {};
      if (updates.is1099Eligible !== undefined) updateData.is_1099_eligible = updates.is1099Eligible;
      if (updates.legalName !== undefined) updateData.legal_name = updates.legalName;
      // Don't update tin_encrypted via client - it's handled by manage-tin Edge Function
      if (updates.tinType !== undefined) updateData.tin_type = updates.tinType;
      if (updates.isSubcontractor !== undefined) updateData.is_subcontractor = updates.isSubcontractor;

      const { error } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', clientId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating 1099 info:', error);
        return false;
      }

      await fetchClients();
      return true;
    } catch (err) {
      console.error('Error:', err);
      return false;
    }
  };

  // Get all 1099-eligible clients
  const eligible1099Clients = useMemo(() => 
    clients.filter(c => c.is1099Eligible || c.isSubcontractor),
    [clients]
  );

  // Get clients approaching or exceeding $600 threshold
  const getClientsNear1099Threshold = (year: number) => {
    return eligible1099Clients.map(client => {
      const total = getTotalByClient(client.id, year);
      return {
        client,
        totalPayments: total,
        meetsThreshold: total >= THRESHOLD_1099,
        approaching: total >= THRESHOLD_1099 * 0.8 && total < THRESHOLD_1099
      };
    }).filter(c => c.totalPayments > 0);
  };

  // Mask TIN for display (show last 4 only)
  const maskTin = (tin: string | null): string => {
    if (!tin) return '---';
    // If encrypted, we can't mask, show placeholder
    if (tin.length < 4) return '***';
    return `***-**-${tin.slice(-4)}`;
  };

  return {
    clients,
    eligible1099Clients,
    loading,
    update1099Info,
    getClientsNear1099Threshold,
    maskTin,
    refresh: fetchClients,
    THRESHOLD_1099
  };
}
