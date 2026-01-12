import { useState } from 'react';
import { Sparkles, CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FREE_SCANS_PER_MONTH, SCANNER_SUBSCRIPTION_PRICE } from '@/config/aiScanner';

interface ScanUpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scansUsed: number;
  onContinueManually: () => void;
  hasSubscription?: boolean;
}

export function ScanUpgradeDialog({
  open,
  onOpenChange,
  scansUsed,
  onContinueManually,
  hasSubscription = false,
}: ScanUpgradeDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isManaging, setIsManaging] = useState(false);

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-scan-create-checkout');

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsManaging(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-scan-customer-portal');

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Portal error:', error);
      toast.error('Failed to open subscription portal.');
    } finally {
      setIsManaging(false);
    }
  };

  const handleContinue = () => {
    onContinueManually();
    onOpenChange(false);
  };

  const scansRemaining = Math.max(0, FREE_SCANS_PER_MONTH - scansUsed);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {hasSubscription ? 'Manage Subscription' : 'Upgrade to Unlimited Scans'}
          </DialogTitle>
          <DialogDescription>
            {hasSubscription ? (
              'You have an active scanner subscription.'
            ) : scansRemaining > 0 ? (
              `You have ${scansRemaining} free scan${scansRemaining !== 1 ? 's' : ''} remaining this month.`
            ) : (
              "You've used all your free scans for this month."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!hasSubscription && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">AI Scanner Unlimited</span>
                <span className="text-lg font-bold text-primary">{SCANNER_SUBSCRIPTION_PRICE}</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Unlimited receipt scans</li>
                <li>• Unlimited supplier quote scans</li>
                <li>• Auto-extract store names, totals, & line items</li>
              </ul>
            </div>
          )}

          <div className="text-sm text-muted-foreground text-center">
            Free tier: {FREE_SCANS_PER_MONTH} scans/month • Used: {scansUsed}/{FREE_SCANS_PER_MONTH}
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {hasSubscription ? (
            <Button onClick={handleManageSubscription} disabled={isManaging} className="w-full">
              {isManaging ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Opening...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Manage Subscription
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleUpgrade} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Upgrade to Unlimited
                </>
              )}
            </Button>
          )}
          <Button variant="outline" onClick={handleContinue} className="w-full">
            Continue Manually
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
