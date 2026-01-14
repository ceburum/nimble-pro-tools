import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Hammer, 
  Truck, 
  Scissors, 
  Calendar, 
  ShoppingBag, 
  FileText,
  Building2,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles
} from 'lucide-react';
import { BusinessSector, BusinessType, SECTOR_PRESETS, SECTOR_OPTIONS } from '@/config/sectorPresets';
import { cn } from '@/lib/utils';

interface SetupWizardProps {
  onComplete: (data: {
    companyName: string;
    businessType: BusinessType;
    businessSector: BusinessSector;
  }) => Promise<boolean>;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Hammer,
  Truck,
  Scissors,
  Calendar,
  ShoppingBag,
  FileText,
};

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType | null>(null);
  const [businessSector, setBusinessSector] = useState<BusinessSector | null>(null);
  const [loading, setLoading] = useState(false);

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSectorSelect = (sector: BusinessSector) => {
    setBusinessSector(sector);
    // Auto-set business type based on sector default
    const preset = SECTOR_PRESETS[sector];
    if (preset) {
      setBusinessType(preset.defaultBusinessType);
    }
  };

  const handleComplete = async () => {
    if (!companyName || !businessType || !businessSector) return;
    
    setLoading(true);
    const success = await onComplete({
      companyName,
      businessType,
      businessSector,
    });
    setLoading(false);
    
    if (!success) {
      // Handle error - could show toast
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return companyName.trim().length > 0;
      case 2:
        return businessType !== null;
      case 3:
        return businessSector !== null;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Welcome to Nimble</h1>
          </div>
          <p className="text-muted-foreground">Let's set up your business in just a few steps</p>
        </div>

        <Progress value={progress} className="mb-6 h-2" />

        <Card className="border-2">
          <CardHeader>
            <CardTitle>
              {step === 1 && 'Your Business Name'}
              {step === 2 && 'How Do You Operate?'}
              {step === 3 && 'What Best Describes Your Business?'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'This will appear on your invoices and quotes'}
              {step === 2 && 'Choose how you typically serve your customers'}
              {step === 3 && 'We\'ll suggest features and services based on your industry'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Business Name */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Business Name</Label>
                  <Input
                    id="companyName"
                    placeholder="e.g., Smith's Plumbing Services"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="text-lg py-6"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* Step 2: Business Type */}
            {step === 2 && (
              <div className="grid gap-4 md:grid-cols-2">
                <button
                  onClick={() => setBusinessType('mobile_job')}
                  className={cn(
                    "p-6 rounded-lg border-2 text-left transition-all",
                    businessType === 'mobile_job'
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn(
                      "p-2 rounded-full",
                      businessType === 'mobile_job' ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      <MapPin className="h-5 w-5" />
                    </div>
                    <span className="font-semibold">Mobile / Job-Based</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You travel to customers for jobs or services. Great for contractors, 
                    mobile services, field work.
                  </p>
                </button>

                <button
                  onClick={() => setBusinessType('stationary_appointment')}
                  className={cn(
                    "p-6 rounded-lg border-2 text-left transition-all",
                    businessType === 'stationary_appointment'
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn(
                      "p-2 rounded-full",
                      businessType === 'stationary_appointment' ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      <Building2 className="h-5 w-5" />
                    </div>
                    <span className="font-semibold">Stationary / Appointment</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Customers come to you by appointment. Great for salons, studios, 
                    offices, retail.
                  </p>
                </button>
              </div>
            )}

            {/* Step 3: Business Sector */}
            {step === 3 && (
              <div className="grid gap-3 md:grid-cols-2">
                {SECTOR_OPTIONS.map((option) => {
                  const IconComponent = ICON_MAP[option.icon] || FileText;
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleSectorSelect(option.value)}
                      className={cn(
                        "p-4 rounded-lg border-2 text-left transition-all",
                        businessSector === option.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={cn(
                          "p-2 rounded-full",
                          businessSector === option.value ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{option.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={step === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              {step < totalSteps ? (
                <Button onClick={handleNext} disabled={!canProceed()}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleComplete} disabled={!canProceed() || loading}>
                  {loading ? (
                    'Setting up...'
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Complete Setup
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          You can change these settings anytime in your business profile
        </p>
      </div>
    </div>
  );
}
