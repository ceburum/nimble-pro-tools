import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldCheck, Eye, AlertTriangle } from 'lucide-react';
import { AppState } from '@/lib/appState';
import { useAppState } from '@/hooks/useAppState';

/**
 * AdminStateSimulator - Allows admins to simulate viewing the app as different AppStates
 * 
 * This is a READ-ONLY simulation - it does NOT modify any user data.
 * It only changes the visual presentation for testing purposes.
 */
export function AdminStateSimulator() {
  const { state: actualState, isAdmin } = useAppState();
  const [simulatedState, setSimulatedState] = useState<AppState | 'actual'>(actualState);

  // Only render for admins
  if (!isAdmin) return null;

  const stateOptions = [
    { value: 'actual', label: 'Actual State', description: 'View as your current state' },
    { value: AppState.READY_BASE, label: 'Ready Base', description: 'Free tier experience' },
    { value: AppState.TRIAL_PRO, label: 'Trial Pro', description: 'Trial period active' },
    { value: AppState.PAID_PRO, label: 'Paid Pro', description: 'Full paid access' },
    { value: AppState.ADMIN_PREVIEW, label: 'Admin Preview', description: 'Full admin access' },
  ];

  const getStateBadgeVariant = (state: AppState | 'actual') => {
    switch (state) {
      case 'actual':
      case AppState.ADMIN_PREVIEW:
        return 'default' as const;
      case AppState.PAID_PRO:
        return 'default' as const;
      case AppState.TRIAL_PRO:
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <ShieldCheck className="h-5 w-5" />
          Admin State Simulator
        </CardTitle>
        <CardDescription>
          Simulate how the app appears to users in different states
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="default" className="bg-warning/10 border-warning/30">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-sm">
            <strong>Read-only simulation.</strong> This does NOT modify any user data or settings. 
            It only changes how the UI appears for testing purposes.
          </AlertDescription>
        </Alert>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Select 
              value={simulatedState === actualState ? 'actual' : simulatedState}
              onValueChange={(value) => setSimulatedState(value === 'actual' ? actualState : value as AppState)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select state to simulate" />
              </SelectTrigger>
              <SelectContent>
                {stateOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <span>{option.label}</span>
                      <span className="text-muted-foreground text-xs">— {option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <Badge variant={getStateBadgeVariant(simulatedState)}>
              {simulatedState === 'actual' || simulatedState === actualState 
                ? 'Current' 
                : 'Simulating'}
            </Badge>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          <p><strong>Current actual state:</strong> {actualState}</p>
          <p><strong>Features visible:</strong> Based on {simulatedState === 'actual' ? 'actual' : simulatedState} permissions</p>
        </div>
      </CardContent>
    </Card>
  );
}
