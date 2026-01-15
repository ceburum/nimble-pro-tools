import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Event types for categorization
export type AnalyticsEventType = 
  | 'page_view' 
  | 'feature_use' 
  | 'error' 
  | 'revenue' 
  | 'conversion'
  | 'user_action';

export interface AnalyticsEvent {
  event_type: AnalyticsEventType;
  event_name: string;
  event_data?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// Generate a session ID for tracking user sessions
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

// Get device info for context
const getDeviceInfo = (): Record<string, unknown> => {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
};

/**
 * useAnalytics - Track app usage, errors, and conversions
 * 
 * This hook provides methods to track various events in the app.
 * Events are stored in the app_analytics table for admin review.
 * 
 * Note: Analytics are NOT sent externally - they stay in your database.
 */
export function useAnalytics() {
  const { user } = useAuth();

  // Track a generic event
  const trackEvent = useCallback(async (event: AnalyticsEvent): Promise<boolean> => {
    try {
      // Use 'any' cast for new tables until types are regenerated
      const client = supabase as unknown as { from: (table: string) => { insert: (data: Record<string, unknown>) => Promise<{ error: unknown }> } };
      const { error } = await client.from('app_analytics').insert({
        user_id: user?.id || null,
        event_type: event.event_type,
        event_name: event.event_name,
        event_data: event.event_data || {},
        metadata: event.metadata || {},
        session_id: getSessionId(),
        device_info: getDeviceInfo(),
      });

      if (error) {
        console.error('Analytics tracking error:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Analytics error:', err);
      return false;
    }
  }, [user?.id]);

  // Track page views
  const trackPageView = useCallback((pageName: string, metadata?: Record<string, unknown>) => {
    return trackEvent({
      event_type: 'page_view',
      event_name: pageName,
      metadata: {
        url: window.location.pathname,
        referrer: document.referrer,
        ...metadata,
      },
    });
  }, [trackEvent]);

  // Track feature usage
  const trackFeatureUse = useCallback((featureName: string, action: string, data?: Record<string, unknown>) => {
    return trackEvent({
      event_type: 'feature_use',
      event_name: `${featureName}:${action}`,
      event_data: data,
    });
  }, [trackEvent]);

  // Track errors (for error monitoring)
  const trackError = useCallback((errorCode: string, errorMessage: string, context?: Record<string, unknown>) => {
    return trackEvent({
      event_type: 'error',
      event_name: errorCode,
      event_data: {
        message: errorMessage,
        ...context,
      },
      metadata: {
        url: window.location.href,
      },
    });
  }, [trackEvent]);

  // Track revenue events
  const trackRevenue = useCallback((eventName: string, amount: number, currency: string = 'USD', metadata?: Record<string, unknown>) => {
    return trackEvent({
      event_type: 'revenue',
      event_name: eventName,
      event_data: {
        amount,
        currency,
      },
      metadata,
    });
  }, [trackEvent]);

  // Track conversions (upgrades, signups, etc.)
  const trackConversion = useCallback((conversionType: string, data?: Record<string, unknown>) => {
    return trackEvent({
      event_type: 'conversion',
      event_name: conversionType,
      event_data: data,
    });
  }, [trackEvent]);

  // Track user actions (clicks, form submissions, etc.)
  const trackUserAction = useCallback((actionName: string, data?: Record<string, unknown>) => {
    return trackEvent({
      event_type: 'user_action',
      event_name: actionName,
      event_data: data,
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackFeatureUse,
    trackError,
    trackRevenue,
    trackConversion,
    trackUserAction,
  };
}
