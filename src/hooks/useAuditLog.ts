import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AuditAction = 
  | 'login' 
  | 'logout' 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'export' 
  | 'admin_action'
  | 'view'
  | 'send'
  | 'payment';

export type ResourceType = 
  | 'client' 
  | 'invoice' 
  | 'project' 
  | 'quote'
  | 'user' 
  | 'settings'
  | 'appointment'
  | 'mileage'
  | 'receipt'
  | 'subscription';

export interface AuditLogEntry {
  action: AuditAction;
  resource_type?: ResourceType;
  resource_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * useAuditLog - Track sensitive user actions for security and compliance
 * 
 * This hook provides methods to log important user actions.
 * Audit logs are stored in the audit_logs table and can be reviewed by admins.
 */
export function useAuditLog() {
  const { user } = useAuth();

  // Log an action
  const logAction = useCallback(async (entry: AuditLogEntry): Promise<boolean> => {
    try {
      // Use 'any' cast for new tables until types are regenerated
      const client = supabase as unknown as { from: (table: string) => { insert: (data: Record<string, unknown>) => Promise<{ error: unknown }> } };
      const { error } = await client.from('audit_logs').insert({
        user_id: user?.id || null,
        action: entry.action,
        resource_type: entry.resource_type,
        resource_id: entry.resource_id,
        old_values: entry.old_values,
        new_values: entry.new_values,
        user_agent: navigator.userAgent,
        metadata: entry.metadata || {},
      });

      if (error) {
        console.error('Audit log error:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Audit log error:', err);
      return false;
    }
  }, [user?.id]);

  // Convenience methods for common actions
  const logCreate = useCallback((resourceType: ResourceType, resourceId: string, newValues?: Record<string, unknown>) => {
    return logAction({ action: 'create', resource_type: resourceType, resource_id: resourceId, new_values: newValues });
  }, [logAction]);

  const logUpdate = useCallback((resourceType: ResourceType, resourceId: string, oldValues?: Record<string, unknown>, newValues?: Record<string, unknown>) => {
    return logAction({ action: 'update', resource_type: resourceType, resource_id: resourceId, old_values: oldValues, new_values: newValues });
  }, [logAction]);

  const logDelete = useCallback((resourceType: ResourceType, resourceId: string, oldValues?: Record<string, unknown>) => {
    return logAction({ action: 'delete', resource_type: resourceType, resource_id: resourceId, old_values: oldValues });
  }, [logAction]);

  const logExport = useCallback((resourceType: ResourceType, metadata?: Record<string, unknown>) => {
    return logAction({ action: 'export', resource_type: resourceType, metadata });
  }, [logAction]);

  const logAdminAction = useCallback((description: string, metadata?: Record<string, unknown>) => {
    return logAction({ action: 'admin_action', metadata: { description, ...metadata } });
  }, [logAction]);

  const logPayment = useCallback((resourceType: ResourceType, resourceId: string, amount: number, metadata?: Record<string, unknown>) => {
    return logAction({ action: 'payment', resource_type: resourceType, resource_id: resourceId, metadata: { amount, ...metadata } });
  }, [logAction]);

  return {
    logAction,
    logCreate,
    logUpdate,
    logDelete,
    logExport,
    logAdminAction,
    logPayment,
  };
}
