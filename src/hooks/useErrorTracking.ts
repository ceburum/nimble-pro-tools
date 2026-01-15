import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type ErrorType = 'frontend' | 'edge_function' | 'database' | 'external_api';

export interface ErrorLogEntry {
  error_type: ErrorType;
  error_code?: string;
  error_message: string;
  stack_trace?: string;
  context?: Record<string, unknown>;
  url?: string;
}

/**
 * useErrorTracking - Track application errors
 * 
 * This hook provides methods to log errors to the database for admin review.
 * Errors are stored in the error_logs table.
 * 
 * Use this for:
 * - API call failures
 * - Unexpected exceptions
 * - Edge function errors
 * - External service errors
 */
export function useErrorTracking() {
  const { user } = useAuth();

  // Log an error
  const logError = useCallback(async (entry: ErrorLogEntry): Promise<boolean> => {
    try {
      // Use 'any' cast for new tables until types are regenerated
      const client = supabase as unknown as { from: (table: string) => { insert: (data: Record<string, unknown>) => Promise<{ error: unknown }> } };
      const { error } = await client.from('error_logs').insert({
        user_id: user?.id || null,
        error_type: entry.error_type,
        error_code: entry.error_code,
        error_message: entry.error_message,
        stack_trace: entry.stack_trace,
        context: entry.context || {},
        url: entry.url || window.location.href,
        user_agent: navigator.userAgent,
      });

      if (error) {
        console.error('Error logging to database:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error tracking error:', err);
      return false;
    }
  }, [user?.id]);

  // Log a frontend error
  const logFrontendError = useCallback((error: Error, context?: Record<string, unknown>) => {
    return logError({
      error_type: 'frontend',
      error_code: error.name,
      error_message: error.message,
      stack_trace: error.stack,
      context,
    });
  }, [logError]);

  // Log an API/edge function error
  const logApiError = useCallback((endpoint: string, statusCode: number, message: string, context?: Record<string, unknown>) => {
    return logError({
      error_type: 'edge_function',
      error_code: `HTTP_${statusCode}`,
      error_message: `${endpoint}: ${message}`,
      context,
    });
  }, [logError]);

  // Log a database error
  const logDatabaseError = useCallback((operation: string, table: string, error: Error | string, context?: Record<string, unknown>) => {
    const message = error instanceof Error ? error.message : error;
    return logError({
      error_type: 'database',
      error_code: operation.toUpperCase(),
      error_message: `${table}: ${message}`,
      context,
    });
  }, [logError]);

  // Log an external API error
  const logExternalApiError = useCallback((service: string, message: string, context?: Record<string, unknown>) => {
    return logError({
      error_type: 'external_api',
      error_code: service.toUpperCase(),
      error_message: message,
      context,
    });
  }, [logError]);

  return {
    logError,
    logFrontendError,
    logApiError,
    logDatabaseError,
    logExternalApiError,
  };
}

/**
 * Global error handler setup
 * Call this once in your app's entry point to catch unhandled errors
 */
export function setupGlobalErrorTracking(logError: (entry: ErrorLogEntry) => Promise<boolean>) {
  // Catch unhandled errors
  window.addEventListener('error', (event) => {
    logError({
      error_type: 'frontend',
      error_code: 'UNHANDLED_ERROR',
      error_message: event.message,
      stack_trace: event.error?.stack,
      context: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
      url: window.location.href,
    });
  });

  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    logError({
      error_type: 'frontend',
      error_code: 'UNHANDLED_REJECTION',
      error_message: error?.message || String(error),
      stack_trace: error?.stack,
      url: window.location.href,
    });
  });
}
