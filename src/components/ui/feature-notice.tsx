import { ReactNode } from 'react';
import { Lock, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FeatureNoticeProps {
  icon?: ReactNode;
  title: string;
  description: string;
  features?: string[];
  onEnable?: () => Promise<boolean> | Promise<void> | void;
  onStartTrial?: () => Promise<boolean> | Promise<void> | void;
  loading?: boolean;
  className?: string;
  variant?: 'inline' | 'card';
}

/**
 * Passive inline notice for locked features.
 * Does NOT redirect or navigate users away from their current screen.
 * Provides a user-initiated button to view upgrade options.
 */
export function FeatureNotice({
  icon,
  title,
  description,
  features = [],
  onEnable,
  onStartTrial,
  loading = false,
  className,
  variant = 'card',
}: FeatureNoticeProps) {
  const handleEnable = async () => {
    if (onEnable) {
      await onEnable();
    }
  };

  const handleStartTrial = async () => {
    if (onStartTrial) {
      await onStartTrial();
    }
  };

  if (variant === 'inline') {
    return (
      <div className={cn(
        "flex items-center gap-4 p-4 rounded-lg border border-dashed border-primary/30 bg-primary/5",
        className
      )}>
        <div className="p-2 rounded-full bg-primary/10">
          {icon || <Lock className="h-5 w-5 text-primary" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        {onEnable && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleEnable}
            disabled={loading}
          >
            {loading ? 'Activating...' : 'Enable'}
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={cn(
      "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20",
      className
    )}>
      <CardContent className="py-8 text-center">
        <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10 w-fit">
          {icon || <Lock className="h-8 w-8 text-primary" />}
        </div>
        
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
          {description}
        </p>

        {features.length > 0 && (
          <ul className="space-y-2 text-left max-w-sm mx-auto mb-6">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-3 justify-center">
          {onStartTrial && (
            <Button 
              onClick={handleStartTrial} 
              variant="outline"
              disabled={loading}
              className="gap-2"
            >
              Start Free Trial
            </Button>
          )}
          
          {onEnable && (
            <Button 
              onClick={handleEnable} 
              disabled={loading}
              className="gap-2"
            >
              {loading ? 'Activating...' : `Activate ${title}`}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          Free during beta. Premium pricing coming soon.
        </p>
      </CardContent>
    </Card>
  );
}

interface FeatureGatedContentProps {
  children: ReactNode;
  hasAccess: boolean;
  loading?: boolean;
  featureNotice: ReactNode;
  showContentWhenLocked?: boolean;
}

/**
 * Wrapper component for feature-gated content.
 * Shows either the content or a feature notice based on access.
 * Never auto-navigates or redirects users.
 */
export function FeatureGatedContent({
  children,
  hasAccess,
  loading = false,
  featureNotice,
  showContentWhenLocked = false,
}: FeatureGatedContentProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!hasAccess && !showContentWhenLocked) {
    return <>{featureNotice}</>;
  }

  return (
    <>
      {!hasAccess && featureNotice}
      {children}
    </>
  );
}
