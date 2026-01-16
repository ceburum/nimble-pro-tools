import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAppState } from '@/hooks/useAppState';
import { AppState } from '@/lib/appState';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Admin routes that should always be accessible to admins
const ADMIN_ROUTES = ['/admin', '/admin/settings'];

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

  // Both auth and state must be fully loaded before any redirect decisions
  const loading = authLoading || stateLoading;

  // Check if current route is an admin route
  const isAdminRoute = ADMIN_ROUTES.some(route => 
    location.pathname === route || location.pathname.startsWith(route + '/')
  );

  useEffect(() => {
    // CRITICAL: Wait for ALL loading to complete before any navigation
    if (loading) return;

    // No user - redirect to auth
    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }

    // ADMIN BYPASS: Admins can access any route regardless of setup status
    // Check both the AppState AND the isAdmin flag for redundancy
    if (state === AppState.ADMIN_PREVIEW || isAdmin) {
      // Admins have full access - no redirects ever
      return;
    }

    // DEFENSIVE: If user exists but state is INSTALL, this is a race condition
    // The database query hasn't finished resolving the true state yet
    // Wait for the next render cycle - do NOT redirect authenticated users
    if (state === AppState.INSTALL) {
      return;
    }

    // Enforce navigation based on AppState for non-admin users
    switch (state) {
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

  // Show loading spinner while auth or state is loading
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No user after loading complete - render nothing (redirect will happen)
  if (!user) {
    return null;
  }

  return <>{children}</>;
}
