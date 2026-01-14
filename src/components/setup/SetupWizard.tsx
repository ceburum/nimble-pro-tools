import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Sparkles,
  ListChecks,
  Loader2
} from 'lucide-react';
import { BusinessSector, BusinessType, SECTOR_PRESETS, SECTOR_OPTIONS } from '@/config/sectorPresets';
import { cn } from '@/lib/utils';
import { getServicesForSector, getThemeForSector, PreviewService, getSectorPresetId } from '@/lib/serviceUtils';
import { ServicePreviewCard } from './ServicePreviewCard';
import { MenuUpsellStep } from './MenuUpsellStep';
import { useAppState } from '@/hooks/useAppState';
import { SERVICE_PRESETS } from '@/config/servicePresets';
import { MENU_PRESETS_CONFIG } from '@/config/pricing';

interface SetupWizardProps {
  onComplete: (data: {
    companyName: string;
    businessType: BusinessType;
    businessSector: BusinessSector;
    services?: PreviewService[];
    themeColor?: string | null;
    menuPresetPurchased?: boolean;
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

type WizardStep = 'name' | 'type' | 'sector' | 'menu_upsell' | 'review';

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const { persistSetupStep, setupProgress } = useAppState();
  
  const [step, setStep] = useState<WizardStep>('name');
  const [companyName, setCompanyName] = useState(setupProgress.companyName || '');
  const [businessType, setBusinessType] = useState<BusinessType | null>(
    (setupProgress.businessType as BusinessType) || null
  );
  const [businessSector, setBusinessSector] = useState<BusinessSector | null>(
    (setupProgress.businessSector as BusinessSector) || null
  );
  const [previewServices, setPreviewServices] = useState<PreviewService[]>([]);
  const [menuPresetPurchased, setMenuPresetPurchased] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stepSaving, setStepSaving] = useState(false);

  // Check if stationary business should see menu upsell
  const isStationaryBusiness = businessType === 'stationary_appointment';
  const presetId = businessSector ? getSectorPresetId(businessSector) : null;
  const hasMenuPreset = presetId !== null;
  const presetConfig = presetId ? MENU_PRESETS_CONFIG[presetId as keyof typeof MENU_PRESETS_CONFIG] : null;
  const showMenuUpsell = isStationaryBusiness && hasMenuPreset && presetId;

  // Get step order based on business type
  const getStepOrder = (): WizardStep[] => {
    const steps: WizardStep[] = ['name', 'type', 'sector'];
    
    // Add menu upsell step for stationary businesses with presets
    if (isStationaryBusiness && hasMenuPreset) {
      steps.push('menu_upsell');
    }
    
    // Add review step if there are services
    if (previewServices.length > 0) {
      steps.push('review');
    }
    
    return steps;
  };

  const stepOrder = getStepOrder();
  const currentStepIndex = stepOrder.indexOf(step);
  const totalSteps = stepOrder.length;
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;
  const isFinalStep = currentStepIndex === totalSteps - 1;

  const handleNext = useCallback(() => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < stepOrder.length) {
      setStep(stepOrder[nextIndex]);
    }
  }, [currentStepIndex, stepOrder]);

  const handleBack = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(stepOrder[prevIndex]);
    }
  }, [currentStepIndex, stepOrder]);

  // Handle business type selection with immediate persistence
  const handleBusinessTypeSelect = useCallback(async (type: BusinessType) => {
    setBusinessType(type);
    setStepSaving(true);
    
    // Persist to database immediately for visible progress
    await persistSetupStep('business_type', type);
    setStepSaving(false);
  }, [persistSetupStep]);

  // Handle sector selection with immediate persistence and service loading
  const handleSectorSelect = useCallback(async (sector: BusinessSector) => {
    setBusinessSector(sector);
    setStepSaving(true);
    
    // Auto-set business type based on sector default if not already set
    const preset = SECTOR_PRESETS[sector];
    if (preset && !businessType) {
      setBusinessType(preset.defaultBusinessType);
      await persistSetupStep('business_type', preset.defaultBusinessType);
    }
    
    // Persist sector selection immediately
    await persistSetupStep('business_sector', sector);
    
    // For non-stationary or non-preset sectors, load services now
    // For stationary with preset, services will be loaded based on menu upsell choice
    const isStationary = businessType === 'stationary_appointment' || preset?.defaultBusinessType === 'stationary_appointment';
    const sectorPresetId = getSectorPresetId(sector);
    
    if (!isStationary || !sectorPresetId) {
      // Load basic sector services
      const services = getServicesForSector(sector);
      setPreviewServices(services);
    }
    
    setStepSaving(false);
  }, [businessType, persistSetupStep]);

  // Handle menu upsell - user chooses pre-populated menu
  const handleChoosePreset = useCallback(async () => {
    if (!presetId) return;
    
    setLoading(true);
    
    // Load the full preset services
    const preset = SERVICE_PRESETS[presetId];
    if (preset) {
      const services: PreviewService[] = preset.services.map((s, index) => ({
        id: `preset_${Date.now()}_${index}`,
        name: s.name,
        price: s.price,
        duration: s.duration,
      }));
      setPreviewServices(services);
      setMenuPresetPurchased(true);
    }
    
    setLoading(false);
    
    // Move to next step (review if services, or complete)
    if (stepOrder.includes('review')) {
      setStep('review');
    } else {
      handleComplete();
    }
  }, [presetId, stepOrder]);

  // Handle menu upsell - user chooses blank menu
  const handleChooseBlank = useCallback(async () => {
    if (!companyName || !businessType || !businessSector) return;
    
    setLoading(true);
    
    // Clear any preset services, start with blank
    setPreviewServices([]);
    setMenuPresetPurchased(false);
    
    // Complete setup immediately with blank menu
    const themeColor = getThemeForSector(businessSector);
    const success = await onComplete({
      companyName,
      businessType,
      businessSector,
      services: undefined, // No services - blank menu
      themeColor,
      menuPresetPurchased: false,
    });
    
    setLoading(false);
    
    if (!success) {
      console.error('Setup completion failed');
    }
  }, [companyName, businessType, businessSector, onComplete]);

  // Skip menu entirely
  const handleSkipMenu = useCallback(async () => {
    if (!companyName || !businessType || !businessSector) return;
    
    setLoading(true);
    setPreviewServices([]);
    setMenuPresetPurchased(false);
    
    // Complete setup
    const themeColor = getThemeForSector(businessSector);
    await onComplete({
      companyName,
      businessType,
      businessSector,
      services: undefined,
      themeColor,
      menuPresetPurchased: false,
    });
    
    setLoading(false);
  }, [companyName, businessType, businessSector, onComplete]);

  const handleDeleteService = useCallback((serviceId: string) => {
    setPreviewServices(prev => prev.filter(s => s.id !== serviceId));
  }, []);

  const handleComplete = useCallback(async () => {
    if (!companyName || !businessType || !businessSector) return;
    
    setLoading(true);
    const themeColor = getThemeForSector(businessSector);
    const success = await onComplete({
      companyName,
      businessType,
      businessSector,
      services: previewServices.length > 0 ? previewServices : undefined,
      themeColor,
      menuPresetPurchased,
    });
    setLoading(false);
    
    if (!success) {
      // Handle error - could show toast
    }
  }, [companyName, businessType, businessSector, previewServices, menuPresetPurchased, onComplete]);

  const canProceed = () => {
    switch (step) {
      case 'name':
        return companyName.trim().length > 0;
      case 'type':
        return businessType !== null;
      case 'sector':
        return businessSector !== null;
      case 'menu_upsell':
        return true; // Can always proceed (handled by specific buttons)
      case 'review':
        return true; // Can always proceed from service review
      default:
        return false;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'name':
        return 'Your Business Name';
      case 'type':
        return 'How Do You Operate?';
      case 'sector':
        return 'What Best Describes Your Business?';
      case 'menu_upsell':
        return 'Set Up Your Service Menu';
      case 'review':
        return 'Review Your Services';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'name':
        return 'This will appear on your invoices and quotes';
      case 'type':
        return 'Choose how you typically serve your customers';
      case 'sector':
        return "We'll suggest features and services based on your industry";
      case 'menu_upsell':
        return 'Start with a pre-built menu or create your own';
      case 'review':
        return `We've prepared ${previewServices.length} services for you. Remove any you don't need.`;
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
            <CardTitle>{getStepTitle()}</CardTitle>
            <CardDescription>{getStepDescription()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step: Business Name */}
            {step === 'name' && (
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

            {/* Step: Business Type */}
            {step === 'type' && (
              <div className="grid gap-4 md:grid-cols-2">
                <button
                  onClick={() => handleBusinessTypeSelect('mobile_job')}
                  disabled={stepSaving}
                  className={cn(
                    "p-6 rounded-lg border-2 text-left transition-all relative",
                    businessType === 'mobile_job'
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {stepSaving && businessType === 'mobile_job' && (
                    <Loader2 className="absolute top-4 right-4 h-4 w-4 animate-spin" />
                  )}
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
                  onClick={() => handleBusinessTypeSelect('stationary_appointment')}
                  disabled={stepSaving}
                  className={cn(
                    "p-6 rounded-lg border-2 text-left transition-all relative",
                    businessType === 'stationary_appointment'
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {stepSaving && businessType === 'stationary_appointment' && (
                    <Loader2 className="absolute top-4 right-4 h-4 w-4 animate-spin" />
                  )}
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

            {/* Step: Business Sector */}
            {step === 'sector' && (
              <div className="grid gap-3 md:grid-cols-2">
                {SECTOR_OPTIONS.map((option) => {
                  const IconComponent = ICON_MAP[option.icon] || FileText;
                  const isSelected = businessSector === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleSectorSelect(option.value)}
                      disabled={stepSaving}
                      className={cn(
                        "p-4 rounded-lg border-2 text-left transition-all relative",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      {stepSaving && isSelected && (
                        <Loader2 className="absolute top-3 right-3 h-4 w-4 animate-spin" />
                      )}
                      <div className="flex items-center gap-3 mb-2">
                        <div className={cn(
                          "p-2 rounded-full",
                          isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
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

            {/* Step: Menu Upsell (for stationary businesses with presets) */}
            {step === 'menu_upsell' && presetId && (
              <MenuUpsellStep
                services={SERVICE_PRESETS[presetId]?.services.map((s, i) => ({
                  id: `preview_${i}`,
                  name: s.name,
                  price: s.price,
                  duration: s.duration,
                })) || []}
                presetName={presetConfig?.name || 'Service'}
                price={presetConfig?.price || 1.99}
                onSelectPurchase={handleChoosePreset}
                onSelectFree={handleChooseBlank}
                onSkip={handleSkipMenu}
                loading={loading}
              />
            )}

            {/* Step: Service Review */}
            {step === 'review' && (
              <div className="space-y-4">
                {previewServices.length > 0 ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ListChecks className="h-4 w-4" />
                      <span>{previewServices.length} services ready to import</span>
                    </div>
                    <ScrollArea className="h-[320px] pr-4">
                      <div className="space-y-2">
                        {previewServices.map(service => (
                          <ServicePreviewCard
                            key={service.id}
                            service={service}
                            onDelete={handleDeleteService}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                    <p className="text-xs text-muted-foreground">
                      You can add more services later from your Service Menu
                    </p>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <ListChecks className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No services to import</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      You can add services manually after setup
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Navigation (except for menu_upsell which has its own buttons) */}
            {step !== 'menu_upsell' && (
              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStepIndex === 0}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>

                {!isFinalStep ? (
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
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          You can change these settings anytime in your business profile
        </p>
      </div>
    </div>
  );
}
