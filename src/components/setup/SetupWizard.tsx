import { useState, useCallback, useMemo } from 'react';
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
  Loader2,
  Search
} from 'lucide-react';
import { BusinessSector, BusinessType, SECTOR_PRESETS, getSectorsForBusinessType } from '@/config/sectorPresets';
import { cn } from '@/lib/utils';
import { getServicesForSector, getThemeForSector, PreviewService, getSectorPresetId } from '@/lib/serviceUtils';
import { ServicePreviewCard } from './ServicePreviewCard';
import { MenuOptionsStep } from './MenuOptionsStep';
import { useAppState } from '@/hooks/useAppState';
import { SERVICE_LIBRARY } from '@/config/serviceLibrary';
import { PRICING, MENU_PRESETS_CONFIG } from '@/config/pricing';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SetupWizardProps {
  onComplete: (data: {
    companyName: string;
    businessType: BusinessType;
    businessSector: BusinessSector;
    services?: PreviewService[];
    themeColor?: string | null;
    menuPresetPurchased?: boolean;
    menuChoice?: 'blank' | 'prepopulated' | 'skip';
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

type WizardStep = 'name' | 'type' | 'sector' | 'menu_options' | 'review';

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
  const [menuChoice, setMenuChoice] = useState<'blank' | 'prepopulated' | 'skip' | null>(null);
  const [loading, setLoading] = useState(false);
  const [stepSaving, setStepSaving] = useState(false);
  const [sectorSearch, setSectorSearch] = useState('');
  const [requestSent, setRequestSent] = useState(false);

  // Get filtered sectors based on business type
  const filteredSectors = useMemo(() => {
    if (!businessType) return [];
    
    const sectorsForType = getSectorsForBusinessType(businessType);
    
    // Apply search filter
    if (sectorSearch.trim()) {
      const searchLower = sectorSearch.toLowerCase();
      return sectorsForType.filter(s => 
        s.label.toLowerCase().includes(searchLower) ||
        s.description.toLowerCase().includes(searchLower)
      );
    }
    
    return sectorsForType;
  }, [businessType, sectorSearch]);

  // Get preset configuration for selected sector
  const presetId = businessSector ? getSectorPresetId(businessSector) : null;
  const presetConfig = presetId ? MENU_PRESETS_CONFIG[presetId as keyof typeof MENU_PRESETS_CONFIG] : null;
  const hasMenuPreset = presetConfig?.hasPreset ?? false;

  // Load services from the library for preview
  const presetServices = useMemo(() => {
    if (!businessSector || businessSector === 'other') return [];
    
    const category = SERVICE_LIBRARY.find(cat => cat.id === businessSector);
    if (category) {
      return category.services.map((s, i) => ({
        id: `preview_${Date.now()}_${i}`,
        name: s.name,
        price: s.price,
        duration: s.duration,
      }));
    }
    return [];
  }, [businessSector]);

  // Get step order - all business types now get menu options
  const getStepOrder = (): WizardStep[] => {
    const steps: WizardStep[] = ['name', 'type', 'sector'];
    
    // Add menu options step for all sectors except 'other'
    if (businessSector && businessSector !== 'other') {
      steps.push('menu_options');
    }
    
    // Add review step if there are services to review
    if (previewServices.length > 0 && menuChoice === 'prepopulated') {
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
    
    // Clear sector and services when business type changes
    setBusinessSector(null);
    setPreviewServices([]);
    setMenuChoice(null);
    setMenuPresetPurchased(false);
    setSectorSearch('');
    
    // Persist to database immediately for visible progress
    await persistSetupStep('business_type', type);
    setStepSaving(false);
  }, [persistSetupStep]);

  // Handle sector selection with immediate persistence
  const handleSectorSelect = useCallback(async (sector: BusinessSector) => {
    setBusinessSector(sector);
    setStepSaving(true);
    
    // Clear any previous preview services and menu state
    setPreviewServices([]);
    setMenuPresetPurchased(false);
    setMenuChoice(null);
    setRequestSent(false);
    
    // Auto-set business type based on sector default if not already set
    const preset = SECTOR_PRESETS[sector];
    if (preset && !businessType) {
      setBusinessType(preset.defaultBusinessType);
      await persistSetupStep('business_type', preset.defaultBusinessType);
    }
    
    // Persist sector selection immediately
    await persistSetupStep('business_sector', sector);
    
    setStepSaving(false);
  }, [businessType, persistSetupStep]);

  // Handle menu option: Blank Menu ($3)
  const handleChooseBlankMenu = useCallback(async () => {
    if (!companyName || !businessType || !businessSector) return;
    
    setLoading(true);
    setMenuChoice('blank');
    
    // Clear any preset services
    setPreviewServices([]);
    setMenuPresetPurchased(false);
    
    // Complete setup with blank menu
    const themeColor = getThemeForSector(businessSector);
    const success = await onComplete({
      companyName,
      businessType,
      businessSector,
      services: undefined,
      themeColor,
      menuPresetPurchased: false,
      menuChoice: 'blank',
    });
    
    setLoading(false);
    
    if (!success) {
      console.error('Setup completion failed');
      toast.error('Failed to complete setup');
    }
  }, [companyName, businessType, businessSector, onComplete]);

  // Handle menu option: Pre-populated list ($2)
  const handleChoosePrePopulated = useCallback(async () => {
    if (!businessSector) return;
    
    setLoading(true);
    setMenuChoice('prepopulated');
    
    // Load the full preset services from library
    const category = SERVICE_LIBRARY.find(cat => cat.id === businessSector);
    if (category) {
      const services: PreviewService[] = category.services.map((s, index) => ({
        id: `preset_${Date.now()}_${index}`,
        name: s.name,
        price: s.price,
        duration: s.duration,
      }));
      setPreviewServices(services);
      setMenuPresetPurchased(true);
    }
    
    setLoading(false);
    
    // Move to review step if services were loaded
    if (stepOrder.includes('review')) {
      setStep('review');
    } else {
      // Complete immediately if no review step
      handleCompleteWithServices();
    }
  }, [businessSector, stepOrder]);

  // Handle menu option: Skip (Free)
  const handleSkipMenu = useCallback(async () => {
    if (!companyName || !businessType || !businessSector) return;
    
    setLoading(true);
    setMenuChoice('skip');
    setPreviewServices([]);
    setMenuPresetPurchased(false);
    
    // Complete setup without menu
    const themeColor = getThemeForSector(businessSector);
    const success = await onComplete({
      companyName,
      businessType,
      businessSector,
      services: undefined,
      themeColor,
      menuPresetPurchased: false,
      menuChoice: 'skip',
    });
    
    setLoading(false);
    
    if (!success) {
      console.error('Setup completion failed');
      toast.error('Failed to complete setup');
    }
  }, [companyName, businessType, businessSector, onComplete]);

  // Handle request for missing list
  const handleRequestMissingList = useCallback(async () => {
    if (!businessSector) return;
    
    setLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('request-service-list', {
        body: {
          sectorId: businessSector,
          sectorName: presetConfig?.name || businessSector,
        },
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`,
        } : undefined,
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      setRequestSent(true);
      toast.success('Request submitted! We\'ll notify you when the list is available.');
    } catch (error) {
      console.error('Failed to submit request:', error);
      toast.error('Failed to submit request. Please try again.');
    }
    
    setLoading(false);
  }, [businessSector, presetConfig]);

  const handleDeleteService = useCallback((serviceId: string) => {
    setPreviewServices(prev => prev.filter(s => s.id !== serviceId));
  }, []);

  const handleCompleteWithServices = useCallback(async () => {
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
      menuChoice: menuChoice || undefined,
    });
    setLoading(false);
    
    if (!success) {
      toast.error('Failed to complete setup');
    }
  }, [companyName, businessType, businessSector, previewServices, menuPresetPurchased, menuChoice, onComplete]);

  const canProceed = () => {
    switch (step) {
      case 'name':
        return companyName.trim().length > 0;
      case 'type':
        return businessType !== null;
      case 'sector':
        return businessSector !== null;
      case 'menu_options':
        return true; // Handled by specific buttons
      case 'review':
        return true;
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
      case 'menu_options':
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
      case 'menu_options':
        return 'Choose how you want to set up your service menu';
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

            {/* Step: Business Sector with Search */}
            {step === 'sector' && businessType && (
              <div className="space-y-4">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search professions..."
                    value={sectorSearch}
                    onChange={(e) => setSectorSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Sector Grid */}
                <ScrollArea className="h-[320px] pr-2">
                  <div className="grid gap-3 md:grid-cols-2">
                    {filteredSectors.map((option) => {
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
                            <div className="flex-1 flex items-center justify-between">
                              <span className="font-medium">{option.label}</span>
                              {option.serviceCount > 0 && (
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                  {option.serviceCount} services
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {option.description}
                          </p>
                        </button>
                      );
                    })}
                    
                    {filteredSectors.length === 0 && (
                      <div className="col-span-2 text-center py-8 text-muted-foreground">
                        No professions found matching "{sectorSearch}"
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Step: Menu Options (3 choices for all business types) */}
            {step === 'menu_options' && businessSector && (
              <MenuOptionsStep
                sectorName={presetConfig?.name || businessSector}
                hasPreset={hasMenuPreset}
                presetServices={presetServices}
                blankMenuPrice={PRICING.BLANK_MENU_PRICE}
                prePopulatedPrice={PRICING.PREPOPULATED_MENU_PRICE}
                onSelectBlankMenu={handleChooseBlankMenu}
                onSelectPrePopulated={handleChoosePrePopulated}
                onSelectNoMenu={handleSkipMenu}
                onRequestMissingList={handleRequestMissingList}
                loading={loading}
                requestSent={requestSent}
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

            {/* Navigation (except for menu_options which has its own buttons) */}
            {step !== 'menu_options' && (
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
                  <Button onClick={handleCompleteWithServices} disabled={!canProceed() || loading}>
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
