import { 
  Car, Calculator, BarChart3, Scissors, Cloud, Sparkles, 
  Check, Lock, Zap, CreditCard
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PRICING, FEATURE_NAMES } from '@/config/pricing';
import { useMileagePro } from '@/hooks/useMileagePro';
import { useFinancialTool } from '@/hooks/useFinancialTool';
import { useServices } from '@/hooks/useServices';
import { useCloudStorage } from '@/hooks/useCloudStorage';
import { useTrials } from '@/hooks/useTrials';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { toast } from '@/hooks/use-toast';

interface AddOnCardProps {
  title: string;
  description: string;
  price: number;
  priceType: 'one-time' | 'monthly';
  icon: React.ReactNode;
  features: string[];
  isOwned: boolean;
  isOnTrial?: boolean;
  trialDaysRemaining?: number;
  canStartTrial?: boolean;
  onPurchase: () => void;
  onStartTrial?: () => void;
  loading?: boolean;
}

function AddOnCard({
  title,
  description,
  price,
  priceType,
  icon,
  features,
  isOwned,
  isOnTrial,
  trialDaysRemaining,
  canStartTrial,
  onPurchase,
  onStartTrial,
  loading,
}: AddOnCardProps) {
  return (
    <Card className={isOwned ? 'border-primary/50 bg-primary/5' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          {isOwned && (
            <Badge variant="default" className="gap-1">
              <Check className="h-3 w-3" />
              Owned
            </Badge>
          )}
          {isOnTrial && !isOwned && (
            <Badge variant="secondary" className="gap-1">
              <Zap className="h-3 w-3" />
              Trial ({trialDaysRemaining}d left)
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t pt-4">
        <div>
          <span className="text-2xl font-bold">${price.toFixed(2)}</span>
          <span className="text-muted-foreground text-sm">
            {priceType === 'monthly' ? '/mo' : ' one-time'}
          </span>
        </div>
        {isOwned ? (
          <Button disabled variant="outline">
            <Check className="h-4 w-4 mr-2" />
            Purchased
          </Button>
        ) : (
          <div className="flex gap-2">
            {canStartTrial && onStartTrial && (
              <Button variant="outline" onClick={onStartTrial} disabled={loading}>
                Start Trial
              </Button>
            )}
            <Button onClick={onPurchase} disabled={loading}>
              {loading ? 'Processing...' : 'Purchase'}
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

export default function Upgrade() {
  const { isEnabled: mileageEnabled, enableMileagePro } = useMileagePro();
  const { isEnabled: financialEnabled, enableFinancialTool, canStartTrial: canTrialFinancial, startTrial: startFinancialTrial, trialDaysRemaining: financialTrialDays, isOnTrial: financialOnTrial } = useFinancialTool();
  const { isEnabled: serviceMenuEnabled } = useServices();
  const { hasCloudStorage, tier: cloudTier } = useCloudStorage();
  const { isTrialActive, startTrial, getTrialDaysRemaining, hasTrialBeenUsed } = useTrials();
  const { updateFlag, isScannerActive } = useFeatureFlags();

  const handleEnableServiceMenu = async () => {
    updateFlag('service_menu_enabled', true);
    toast({ title: 'Service Menu activated!' });
  };

  const handleEnableMileage = async () => {
    await enableMileagePro();
    toast({ title: 'Mileage Pro activated!' });
  };

  const handleEnableFinancial = async () => {
    await enableFinancialTool();
    toast({ title: 'Financial Tool activated!' });
  };

  const handleStartMileageTrial = async () => {
    await startTrial('mileage');
    toast({ title: 'Mileage Pro trial started!', description: '7 days free access' });
  };

  const handleStartFinancialTrial = async () => {
    await startFinancialTrial();
    toast({ title: 'Financial Tool trial started!', description: '7 days free access' });
  };

  const mileageOnTrial = isTrialActive('mileage') && !mileageEnabled;
  const mileageTrialDays = getTrialDaysRemaining('mileage');
  const canTrialMileage = !hasTrialBeenUsed('mileage') && !mileageEnabled;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Upgrade Your App"
        description="Unlock powerful features to grow your business"
      />

      {/* One-Time Purchases */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          One-Time Purchases
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AddOnCard
            title={FEATURE_NAMES.service_menu}
            description="Perfect for salons and service businesses"
            price={PRICING.SERVICE_MENU_PRICE}
            priceType="one-time"
            icon={<Scissors className="h-5 w-5" />}
            features={[
              'Create and manage service offerings',
              'Set prices and durations',
              'Quick invoice population',
              'Preloaded sector templates',
            ]}
            isOwned={serviceMenuEnabled}
            onPurchase={handleEnableServiceMenu}
          />

          <AddOnCard
            title={FEATURE_NAMES.mileage}
            description="Track business mileage for tax deductions"
            price={PRICING.MILEAGE_PRICE}
            priceType="one-time"
            icon={<Car className="h-5 w-5" />}
            features={[
              'GPS-based trip tracking',
              'IRS-compliant mileage logs',
              'Project/client attribution',
              'Tax deduction calculator',
            ]}
            isOwned={mileageEnabled}
            isOnTrial={mileageOnTrial}
            trialDaysRemaining={mileageTrialDays}
            canStartTrial={canTrialMileage}
            onPurchase={handleEnableMileage}
            onStartTrial={handleStartMileageTrial}
          />

          <AddOnCard
            title={FEATURE_NAMES.financial_tool}
            description="Complete financial management suite"
            price={PRICING.FINANCIAL_TOOL_PRICE}
            priceType="one-time"
            icon={<BarChart3 className="h-5 w-5" />}
            features={[
              'Profit & Loss reports',
              'Expense categorization',
              '1099 tracking & management',
              'Bank statement reconciliation',
              'AI Vision for receipts & PDFs',
              'Schedule C breakdown',
            ]}
            isOwned={financialEnabled}
            isOnTrial={financialOnTrial}
            trialDaysRemaining={financialTrialDays}
            canStartTrial={canTrialFinancial}
            onPurchase={handleEnableFinancial}
            onStartTrial={handleStartFinancialTrial}
          />
        </div>
      </div>

      {/* Subscriptions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Subscriptions
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AddOnCard
            title={FEATURE_NAMES.scanner}
            description="Unlimited AI-powered document scanning"
            price={PRICING.SCANNER_PRICE}
            priceType="monthly"
            icon={<Sparkles className="h-5 w-5" />}
            features={[
              'Unlimited receipt scans',
              'Bank statement PDF extraction',
              'Supplier quote scanning',
              'Auto-categorization',
            ]}
            isOwned={isScannerActive}
            onPurchase={() => toast({ title: 'Coming soon', description: 'Scanner subscription will be available shortly.' })}
          />

          <AddOnCard
            title={FEATURE_NAMES.cloud_standard}
            description="Sync your data across devices"
            price={PRICING.CLOUD_STANDARD_PRICE}
            priceType="monthly"
            icon={<Cloud className="h-5 w-5" />}
            features={[
              '2 GB cloud storage',
              'Multi-device sync',
              'Automatic backups',
              'Photo & document storage',
            ]}
            isOwned={cloudTier === 'standard' || cloudTier === 'premium'}
            onPurchase={() => toast({ title: 'Coming soon', description: 'Cloud storage will be available shortly.' })}
          />

          <AddOnCard
            title={FEATURE_NAMES.cloud_premium}
            description="Maximum storage for power users"
            price={PRICING.CLOUD_PREMIUM_PRICE}
            priceType="monthly"
            icon={<Cloud className="h-5 w-5" />}
            features={[
              '10 GB cloud storage',
              'Priority sync',
              'Extended backup history',
              'All Standard features',
            ]}
            isOwned={cloudTier === 'premium'}
            onPurchase={() => toast({ title: 'Coming soon', description: 'Cloud storage will be available shortly.' })}
          />
        </div>
      </div>

      {/* Bundle */}
      <Card className="border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary text-primary-foreground">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl">Complete Business Bundle</CardTitle>
              <CardDescription>Get everything at a discount</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary">Service Menu</Badge>
            <Badge variant="secondary">Mileage Pro</Badge>
            <Badge variant="secondary">Financial Tool</Badge>
          </div>
          <p className="text-muted-foreground">
            Unlock all one-time purchase add-ons and save over 30% compared to buying separately.
          </p>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t pt-4">
          <div>
            <span className="text-3xl font-bold">${PRICING.FULL_BUNDLE_PRICE.toFixed(2)}</span>
            <span className="text-muted-foreground text-sm ml-2">one-time</span>
            <p className="text-sm text-muted-foreground line-through">
              ${(PRICING.SERVICE_MENU_PRICE + PRICING.MILEAGE_PRICE + PRICING.FINANCIAL_TOOL_PRICE).toFixed(2)} if purchased separately
            </p>
          </div>
          <Button size="lg" onClick={() => toast({ title: 'Coming soon', description: 'Bundle purchase will be available shortly.' })}>
            Get the Bundle
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
