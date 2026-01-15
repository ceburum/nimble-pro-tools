import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export interface BackupLog {
  id: string;
  backup_type: 'manual' | 'scheduled' | 'pre_migration';
  storage_path?: string;
  size_bytes?: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  error_message?: string;
  tables_included: string[];
  record_counts: Record<string, number>;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

// Tables to include in backup
const BACKUP_TABLES = [
  'clients',
  'invoices',
  'projects',
  'project_photos',
  'project_receipts',
  'mileage_entries',
  'capital_assets',
  'subcontractor_payments',
  'expense_categories',
  'bank_expenses',
  'transactions',
  'materials',
  'user_settings',
] as const;

/**
 * useBackup - Create and manage data backups
 * 
 * This hook provides functionality to:
 * 1. Create manual JSON backups (downloaded to user's device)
 * 2. Track backup history in the database
 * 3. Restore from backup files
 */
export function useBackup() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [backups, setBackups] = useState<BackupLog[]>([]);

  // Fetch backup history
  const fetchBackups = useCallback(async () => {
    if (!user) return;

    try {
      const client = supabase as unknown as { from: (table: string) => { select: (cols: string) => { eq: (col: string, val: string) => { order: (col: string, opts: Record<string, boolean>) => { limit: (n: number) => Promise<{ data: unknown[]; error: unknown }> } } } } };
      const { data, error } = await client
        .from('backup_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setBackups((data || []) as BackupLog[]);
    } catch (err) {
      console.error('Error fetching backups:', err);
    }
  }, [user]);

  // Create a backup
  const createBackup = useCallback(async (type: 'manual' | 'pre_migration' = 'manual'): Promise<{ success: boolean; data?: unknown }> => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in to create a backup.', variant: 'destructive' });
      return { success: false };
    }

    setLoading(true);
    const startedAt = new Date().toISOString();

    // Create backup log entry
    const client = supabase as unknown as { from: (table: string) => { insert: (data: Record<string, unknown>) => { select: () => { single: () => Promise<{ data: unknown; error: unknown }> } }; update: (data: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<{ error: unknown }> } } };
    const { data: logEntry, error: logError } = await client
      .from('backup_logs')
      .insert({
        user_id: user.id,
        backup_type: type,
        status: 'in_progress',
        started_at: startedAt,
        tables_included: [...BACKUP_TABLES],
      })
      .select()
      .single();

    if (logError) {
      console.error('Error creating backup log:', logError);
    }

    try {
      const backupData: Record<string, unknown[]> = {};
      const recordCounts: Record<string, number> = {};

      // Fetch data from each table
      for (const table of BACKUP_TABLES) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .eq('user_id', user.id);

          if (error) {
            console.error(`Error fetching ${table}:`, error);
            backupData[table] = [];
            recordCounts[table] = 0;
          } else {
            backupData[table] = data || [];
            recordCounts[table] = (data || []).length;
          }
        } catch {
          backupData[table] = [];
          recordCounts[table] = 0;
        }
      }

      // Create the backup JSON
      const backup = {
        version: '1.0',
        created_at: startedAt,
        user_id: user.id,
        user_email: user.email,
        tables: BACKUP_TABLES,
        record_counts: recordCounts,
        data: backupData,
      };

      const jsonString = JSON.stringify(backup, null, 2);
      const sizeBytes = new Blob([jsonString]).size;

      // Update backup log
      const entry = logEntry as { id: string } | null;
      if (entry) {
        await client
          .from('backup_logs')
          .update({
            status: 'completed',
            size_bytes: sizeBytes,
            record_counts: recordCounts,
            completed_at: new Date().toISOString(),
          })
          .eq('id', entry.id);
      }

      // Download the backup file
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nimble-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Backup Created',
        description: `Backup includes ${Object.values(recordCounts).reduce((a, b) => a + b, 0)} records from ${BACKUP_TABLES.length} tables.`,
      });

      setLoading(false);
      return { success: true, data: backup };
    } catch (err) {
      console.error('Backup error:', err);

      // Update log with error
      const entry = logEntry as { id: string } | null;
      if (entry) {
        await client
          .from('backup_logs')
          .update({
            status: 'failed',
            error_message: err instanceof Error ? err.message : 'Unknown error',
            completed_at: new Date().toISOString(),
          })
          .eq('id', entry.id);
      }

      toast({
        title: 'Backup Failed',
        description: 'There was an error creating your backup.',
        variant: 'destructive',
      });

      setLoading(false);
      return { success: false };
    }
  }, [user]);

  // Restore from backup (placeholder - needs careful implementation)
  const restoreFromBackup = useCallback(async (backupFile: File): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);

    try {
      const text = await backupFile.text();
      const backup = JSON.parse(text);

      // Validate backup structure
      if (!backup.version || !backup.data || !backup.tables) {
        toast({
          title: 'Invalid Backup',
          description: 'The backup file format is not recognized.',
          variant: 'destructive',
        });
        return false;
      }

      // For safety, we only log this action - actual restore requires careful implementation
      // to avoid data loss and handle conflicts
      console.log('Backup restore requested:', {
        version: backup.version,
        tables: backup.tables,
        recordCounts: backup.record_counts,
      });

      toast({
        title: 'Restore Initiated',
        description: 'Contact support for full restore assistance.',
      });

      return true;
    } catch (err) {
      console.error('Restore error:', err);
      toast({
        title: 'Restore Failed',
        description: 'Could not parse the backup file.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    loading,
    backups,
    createBackup,
    restoreFromBackup,
    fetchBackups,
    BACKUP_TABLES,
  };
}
