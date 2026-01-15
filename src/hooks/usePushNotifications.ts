import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface NotificationPreferences {
  push_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  invoice_reminders: boolean;
  appointment_reminders: boolean;
  payment_received: boolean;
  quote_accepted: boolean;
  marketing: boolean;
}

const defaultPreferences: NotificationPreferences = {
  push_enabled: false,
  email_enabled: true,
  sms_enabled: false,
  invoice_reminders: true,
  appointment_reminders: true,
  payment_received: true,
  quote_accepted: true,
  marketing: false,
};

/**
 * usePushNotifications - Manage push notification tokens and preferences
 * 
 * This hook provides scaffolding for future push notification support.
 * Currently, it manages notification preferences without sending actual push notifications.
 * 
 * To enable push notifications in the future:
 * 1. Integrate with Firebase Cloud Messaging, OneSignal, or similar service
 * 2. Register service worker for web push
 * 3. Use registerToken() to store device tokens
 * 4. Create edge function to send notifications using stored tokens
 */
export function usePushNotifications() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [tokens, setTokens] = useState<{ id: string; device_type: string; device_name?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [pushSupported, setPushSupported] = useState(false);

  // Check if push notifications are supported
  useEffect(() => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setPushSupported(supported);
  }, []);

  // Fetch notification preferences
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchPreferences = async () => {
      try {
        // Use 'any' cast for new tables until types are regenerated
        const client = supabase as unknown as { 
          from: (table: string) => { 
            select: (cols: string) => { 
              eq: (col: string, val: unknown) => { 
                maybeSingle: () => Promise<{ data: unknown; error: { code: string } | null }>;
                eq: (col2: string, val2: unknown) => Promise<{ data: unknown[] }>;
              } 
            } 
          } 
        };
        
        const { data, error } = await client
          .from('notification_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching notification preferences:', error);
        }

        if (data) {
          const prefs = data as Record<string, boolean>;
          setPreferences({
            push_enabled: prefs.push_enabled ?? false,
            email_enabled: prefs.email_enabled ?? true,
            sms_enabled: prefs.sms_enabled ?? false,
            invoice_reminders: prefs.invoice_reminders ?? true,
            appointment_reminders: prefs.appointment_reminders ?? true,
            payment_received: prefs.payment_received ?? true,
            quote_accepted: prefs.quote_accepted ?? true,
            marketing: prefs.marketing ?? false,
          });
        }

        // Fetch registered tokens
        const { data: tokenData } = await client
          .from('push_notification_tokens')
          .select('id, device_type, device_name')
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (tokenData) {
          setTokens(tokenData as { id: string; device_type: string; device_name?: string }[]);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [user]);

  // Update notification preferences
  const updatePreferences = useCallback(async (updates: Partial<NotificationPreferences>): Promise<boolean> => {
    if (!user) return false;

    try {
      const client = supabase as unknown as { from: (table: string) => { upsert: (data: Record<string, unknown>, opts: Record<string, string>) => Promise<{ error: unknown }> } };
      const { error } = await client
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
          ...updates,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('Error updating preferences:', error);
        return false;
      }

      setPreferences(prev => ({ ...prev, ...updates }));
      return true;
    } catch (err) {
      console.error('Error:', err);
      return false;
    }
  }, [user, preferences]);

  // Register a push notification token (for future use)
  const registerToken = useCallback(async (token: string, deviceType: 'web' | 'ios' | 'android', deviceName?: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const client = supabase as unknown as { from: (table: string) => { upsert: (data: Record<string, unknown>, opts: Record<string, string>) => Promise<{ error: unknown }> } };
      const { error } = await client
        .from('push_notification_tokens')
        .upsert({
          user_id: user.id,
          token,
          device_type: deviceType,
          device_name: deviceName,
          is_active: true,
          last_used_at: new Date().toISOString(),
        }, { onConflict: 'user_id,token' });

      if (error) {
        console.error('Error registering token:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error:', err);
      return false;
    }
  }, [user]);

  // Deactivate a token
  const deactivateToken = useCallback(async (tokenId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const client = supabase as unknown as { from: (table: string) => { update: (data: Record<string, unknown>) => { eq: (col: string, val: string) => { eq: (col2: string, val2: string) => Promise<{ error: unknown }> } } } };
      const { error } = await client
        .from('push_notification_tokens')
        .update({ is_active: false })
        .eq('id', tokenId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deactivating token:', error);
        return false;
      }

      setTokens(prev => prev.filter(t => t.id !== tokenId));
      return true;
    } catch (err) {
      console.error('Error:', err);
      return false;
    }
  }, [user]);

  // Request browser notification permission (for future use)
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!pushSupported) return 'denied';
    return await Notification.requestPermission();
  }, [pushSupported]);

  return {
    preferences,
    tokens,
    loading,
    pushSupported,
    updatePreferences,
    registerToken,
    deactivateToken,
    requestPermission,
    // Status flags
    hasPermission: pushSupported && Notification.permission === 'granted',
    canRequestPermission: pushSupported && Notification.permission === 'default',
  };
}
