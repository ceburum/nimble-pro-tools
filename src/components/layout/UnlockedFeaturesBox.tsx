import { CalendarDays, BarChart3, Car, Scissors, Sparkles, CheckCircle } from 'lucide-react';
import { useAppState } from '@/hooks/useAppState';
import { Badge } from '@/components/ui/badge';

interface UnlockedFeature {
  name: string;
  icon: typeof CalendarDays;
  featureKey: 'scheduling' | 'financial' | 'mileage' | 'serviceMenu';
}

const featureList: UnlockedFeature[] = [
  { name: 'Scheduling Pro', icon: CalendarDays, featureKey: 'scheduling' },
  { name: 'Financial Pro', icon: BarChart3, featureKey: 'financial' },
  { name: 'Mileage Pro', icon: Car, featureKey: 'mileage' },
  { name: 'Service Menu', icon: Scissors, featureKey: 'serviceMenu' },
];

export function UnlockedFeaturesBox() {
  const { hasAccess, setupProgress, isTrialActive, isPaidPro } = useAppState();
  const isStationary = setupProgress.businessType === 'stationary_appointment';

  // Get unlocked features
  const unlockedFeatures = featureList.filter(f => {
    // Filter service menu for stationary only
    if (f.featureKey === 'serviceMenu' && !isStationary) return false;
    return hasAccess(f.featureKey);
  });

  // Don't render if no unlocked features
  if (unlockedFeatures.length === 0) return null;

  return (
    <div className="px-4 mt-2">
      <div className="rounded-lg bg-sidebar-accent/30 border border-sidebar-border p-3">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider">
            Unlocked Features
          </span>
        </div>
        <div className="space-y-1.5">
          {unlockedFeatures.map((feature) => (
            <div 
              key={feature.featureKey} 
              className="flex items-center gap-2 text-xs text-sidebar-foreground/80"
            >
              <feature.icon className="h-3.5 w-3.5 text-primary/70" />
              <span className="flex-1 truncate">{feature.name}</span>
              {isTrialActive && !isPaidPro ? (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  Trial
                </Badge>
              ) : (
                <CheckCircle className="h-3 w-3 text-primary/60" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}