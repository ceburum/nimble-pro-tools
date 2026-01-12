import { AlertTriangle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TaxDisclaimerProps {
  variant?: 'inline' | 'card' | 'banner';
  className?: string;
}

export function TaxDisclaimer({ variant = 'inline', className = '' }: TaxDisclaimerProps) {
  const message = "Estimates are for informational purposes only. Consult a tax professional for advice.";
  const exportMessage = "For your tax professional — informational only. This is not tax advice.";

  if (variant === 'inline') {
    return (
      <p className={`text-xs text-muted-foreground flex items-center gap-1 ${className}`}>
        <Info className="h-3 w-3 flex-shrink-0" />
        <span>{message}</span>
      </p>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={`bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2 ${className}`}>
        <p className="text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{exportMessage}</span>
        </p>
      </div>
    );
  }

  return (
    <Alert variant="default" className={className}>
      <Info className="h-4 w-4" />
      <AlertDescription className="text-sm">
        {message}
      </AlertDescription>
    </Alert>
  );
}
