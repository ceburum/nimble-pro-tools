import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAppState } from '@/hooks/useAppState';
import { AppState } from '@/lib/appState';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute - Navigation enforcement based on AppState
 * 
 * Rules:
 * - INSTALL: Redirect to /auth (no user session)
 * - SETUP_INCOMPLETE: Only allow access to dashboard (which shows SetupWizard)
 *   EXCEPTION: Admins bypass this and can access all routes
 * - READY_BASE, TRIAL_PRO, PAID_PRO: Allow full app access
 * - ADMIN_PREVIEW: Allow full access including setup replay
 * 
 * CRITICAL: Navigation enforcement is PASSIVE. No billing redirects.
 * Feature gating uses disabled UI + explanatory messaging, not redirects.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { state, loading: stateLoading, isSetupComplete, isAdmin } = useAppState();
  const navigate = useNavigate();
  const location = useLocation();

  const loading = authLoading || stateLoading;

  useEffect(() => {
    if (loading) return;

    // No user - redirect to auth
    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }

    // ADMIN BYPASS: Check both state AND isAdmin flag
    // This handles the race condition where state might still be computing
    // but we already know the user is an admin from the database
    if (state === AppState.ADMIN_PREVIEW || isAdmin) {
      // Admins can access any route regardless of setup status
      return;
    }

    // Enforce navigation based on AppState for non-admin users
    switch (state) {
      case AppState.INSTALL:
        // DEFENSIVE: If user exists but state is INSTALL, this is a race condition
        // The database query hasn't completed yet - wait for next render
        // Only redirect if there's genuinely no user (already handled above)
        // Do nothing here - state will resolve on next render
        break;

      case AppState.SETUP_INCOMPLETE:
        // Only allow access to root (dashboard) which shows SetupWizard
        // Redirect any other routes back to root for setup completion
        if (location.pathname !== '/') {
          navigate('/', { replace: true });
        }
        break;

      case AppState.READY_BASE:
      case AppState.TRIAL_PRO:
      case AppState.PAID_PRO:
        // Full app access - no navigation restrictions after setup complete
        // Feature gating is handled by individual pages (disabled UI, not redirects)
        break;
    }
  }, [user, loading, state, location.pathname, navigate, isSetupComplete, isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
