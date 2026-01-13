import * as React from 'react';
import { X, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface DismissibleBannerProps {
  variant?: 'warning' | 'info' | 'error';
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
  storageKey?: string; // If provided, dismissal is persisted to session storage
}

export function DismissibleBanner({
  variant = 'info',
  title,
  children,
  onDismiss,
  className,
  storageKey,
}: DismissibleBannerProps) {
  const [isDismissed, setIsDismissed] = React.useState(() => {
    if (storageKey) {
      return sessionStorage.getItem(`banner_dismissed_${storageKey}`) === 'true';
    }
    return false;
  });

  const handleDismiss = () => {
    setIsDismissed(true);
    if (storageKey) {
      sessionStorage.setItem(`banner_dismissed_${storageKey}`, 'true');
    }
    onDismiss?.();
  };

  if (isDismissed) return null;

  const variantStyles = {
    warning: 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-100',
    info: 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-100',
    error: 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950/50 dark:border-red-800 dark:text-red-100',
  };

  const icons = {
    warning: AlertTriangle,
    info: Info,
    error: AlertCircle,
  };

  const Icon = icons[variant];

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 p-3 rounded-lg border',
        variantStyles[variant],
        className
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        {title && <p className="font-medium text-sm mb-0.5">{title}</p>}
        <div className="text-sm opacity-90">{children}</div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 -mr-1 -mt-1 hover:bg-black/10 dark:hover:bg-white/10"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
