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
 * - READY_BASE, TRIAL_PRO, PAID_PRO: Allow full app access
 * - ADMIN_PREVIEW: Allow full access including setup replay
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { state, loading: stateLoading, capabilities } = useAppState();
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

    // Enforce navigation based on AppState
    switch (state) {
      case AppState.INSTALL:
        // Should have been caught by !user check, but just in case
        navigate('/auth', { replace: true });
        break;

      case AppState.SETUP_INCOMPLETE:
        // Only allow access to root (dashboard) which shows SetupWizard
        // Redirect any other routes back to root
        if (location.pathname !== '/') {
          navigate('/', { replace: true });
        }
        break;

      case AppState.ADMIN_PREVIEW:
        // Admins can access everything - including replaying setup at root
        // No restrictions
        break;

      case AppState.READY_BASE:
      case AppState.TRIAL_PRO:
      case AppState.PAID_PRO:
        // Full app access - no restrictions after setup complete
        break;
    }
  }, [user, loading, state, location.pathname, navigate, capabilities]);

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
