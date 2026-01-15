import { useState, useCallback } from 'react';
import { Plus, Scissors, Loader2, Sparkles, X, FileText, CalendarPlus, Receipt } from 'lucide-react';
import { useServices } from '@/hooks/useServices';
import { Service } from '@/types/services';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { useToast } from '@/hooks/use-toast';
import { useAppState } from '@/hooks/useAppState';
import { useInvoices } from '@/hooks/useInvoices';
import { useClients } from '@/hooks/useClients';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { AppState } from '@/lib/appState';
import { ServiceCard } from '@/components/services/ServiceCard';
import { ServiceEditDialog } from '@/components/services/ServiceEditDialog';
import { ServiceMenuInitDialog } from '@/components/services/ServiceMenuInitDialog';
import { ServiceMenuPreviewBanner } from '@/components/services/ServiceMenuPreviewBanner';
import { ServiceColorPicker } from '@/components/services/ServiceColorPicker';
import { SERVICE_PRESETS } from '@/config/servicePresets';
import { PRICING, MENU_PRESETS_CONFIG } from '@/config/pricing';
import { SERVICE_LIBRARY } from '@/config/serviceLibrary';
import { useNavigate } from 'react-router-dom';
import { InvoiceDialog } from '@/components/invoices/InvoiceDialog';
import { QuoteDialog } from '@/components/quotes/QuoteDialog';
import { QuickAppointmentDialog } from '@/components/scheduling/QuickAppointmentDialog';
import { useSetup } from '@/hooks/useSetup';
import { useAppointments } from '@/hooks/useAppointments';

export default function ServiceMenu() {
  const {
    services,
    loading,
    isEnabled,
    isPreviewMode,
    menuSettings,
    needsInit,
    addService,
    updateService,
    deleteService,
    reorderService,
    updateGlobalColor,
    loadPreset,
    startBlank,
    commitPreview,
    discardPreview,
  } = useServices();
  
  const { state, setupProgress } = useAppState();
  const { addInvoice, invoices } = useInvoices();
  const { clients } = useClients();
  const { profile } = useBusinessProfile();
  const { businessSector } = useSetup();
  const { addAppointment } = useAppointments();
  const navigate = useNavigate();
  const { toast } = useToast();

  // State management
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [loadingPreset, setLoadingPreset] = useState(false);
  const [importingServices, setImportingServices] = useState(false);
  
  // Multi-select state
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  
  // Dialog states for destinations
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);

  // Business type check
  const isStationaryBusiness = setupProgress.businessType === 'stationary_appointment';

  // Get preset configuration for the user's sector
  const presetConfig = businessSector ? MENU_PRESETS_CONFIG[businessSector as keyof typeof MENU_PRESETS_CONFIG] : null;
  const hasPreset = presetConfig?.hasPreset ?? false;
  const presetServices = businessSector 
    ? SERVICE_LIBRARY.find(cat => cat.id === businessSector)?.services || []
    : [];

  // Check if user can use services based on AppState
  const canUseServices = [
    AppState.READY_BASE,
    AppState.TRIAL_PRO,
    AppState.PAID_PRO,
    AppState.ADMIN_PREVIEW
  ].includes(state);

  // Handle importing ready-made list
  const handleImportReadyMadeList = async () => {
    if (!businessSector || !hasPreset) return;
    
    setImportingServices(true);
    try {
      loadPreset(businessSector);
      setTimeout(() => {
        commitPreview();
        setImportingServices(false);
        toast({
          title: 'Services imported!',
          description: `${presetServices.length} services added to your menu.`,
        });
      }, 500);
    } catch (error) {
      setImportingServices(false);
      toast({
        title: 'Import failed',
        description: 'Could not import services. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Selection handlers
  const handleToggleSelect = (service: Service) => {
    setSelectedServices(prev => {
      const isAlreadySelected = prev.some(s => s.id === service.id);
      if (isAlreadySelected) {
        return prev.filter(s => s.id !== service.id);
      }
      return [...prev, service];
    });
  };

  const clearSelection = () => {
    setSelectedServices([]);
  };

  // Calculate selection total
  const selectionTotal = selectedServices.reduce((sum, s) => sum + s.price, 0);

  // Action handlers for destinations
  const handleAddToQuote = () => {
    if (selectedServices.length === 0) return;
    if (clients.length === 0) {
      toast({
        title: 'No clients found',
        description: 'Please add a client first.',
        variant: 'destructive',
      });
      navigate('/clients');
      return;
    }
    setQuoteDialogOpen(true);
  };

  const handleAddToInvoice = () => {
    if (selectedServices.length === 0) return;
    if (clients.length === 0) {
      toast({
        title: 'No clients found',
        description: 'Please add a client first.',
        variant: 'destructive',
      });
      navigate('/clients');
      return;
    }
    setInvoiceDialogOpen(true);
  };

  const handleAddToAppointment = () => {
    if (selectedServices.length === 0) return;
    if (clients.length === 0) {
      toast({
        title: 'No clients found',
        description: 'Please add a client first.',
        variant: 'destructive',
      });
      navigate('/clients');
      return;
    }
    setAppointmentDialogOpen(true);
  };

  // Generate line items from selected services
  const getSelectedLineItems = useCallback(() => {
    return selectedServices.map(service => ({
      id: crypto.randomUUID(),
      description: service.name,
      quantity: 1,
      unitPrice: service.price,
    }));
  }, [selectedServices]);

  // Generate the next invoice number
  const getNextInvoiceNumber = useCallback(() => {
    const prefix = profile.invoicePrefix || 'INV-';
    const existingNumbers = invoices
      .map(inv => {
        const match = inv.invoiceNumber.match(/(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(n => !isNaN(n));
    
    const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    return `${prefix}${String(maxNumber + 1).padStart(4, '0')}`;
  }, [invoices, profile.invoicePrefix]);

  // Handle invoice creation
  const handleCreateInvoice = useCallback(async (invoiceData: {
    clientId: string;
    invoiceNumber: string;
    items: Array<{ id: string; description: string; quantity: number; unitPrice: number }>;
    status: 'draft' | 'sent' | 'paid' | 'overdue';
    dueDate: Date;
    notes?: string;
  }) => {
    const newInvoice = await addInvoice(invoiceData);
    
    if (newInvoice) {
      toast({
        title: 'Invoice created',
        description: `Invoice ${newInvoice.invoiceNumber} created with ${selectedServices.length} service(s).`,
      });
      setInvoiceDialogOpen(false);
      clearSelection();
      navigate('/invoices');
    }
  }, [addInvoice, selectedServices.length, navigate, toast]);

  // Handle quote save
  const handleSaveQuote = useCallback(async (quoteData: any) => {
    // Quote saving handled by QuoteDialog's internal logic
    toast({
      title: 'Quote created',
      description: `Quote created with ${selectedServices.length} service(s).`,
    });
    setQuoteDialogOpen(false);
    clearSelection();
    navigate('/quotes');
  }, [selectedServices.length, navigate, toast]);

  // Handle appointment save
  const handleSaveAppointment = useCallback(async (appointmentData: any) => {
    const result = await addAppointment(appointmentData);
    if (result) {
      toast({
        title: 'Appointment created',
        description: 'Appointment created successfully.',
      });
      setAppointmentDialogOpen(false);
      clearSelection();
      navigate('/appointments');
      // Return the expected format for QuickAppointmentDialog
      return { appointmentId: result.id, invoiceId: undefined, paymentToken: undefined };
    }
    return null;
  }, [addAppointment, navigate, toast]);

  // Setup flow handlers
  const handleSelectBlank = () => {
    setLoadingPreset(true);
    setTimeout(() => {
      startBlank();
      setLoadingPreset(false);
      toast({ title: 'Service Menu ready', description: 'Start adding your services!' });
    }, 300);
  };

  const handleSelectPreset = (presetId: string) => {
    setLoadingPreset(true);
    setTimeout(() => {
      loadPreset(presetId);
      setLoadingPreset(false);
      const preset = SERVICE_PRESETS[presetId];
      toast({ 
        title: `${preset?.name || 'Preset'} loaded!`,
        description: 'Preview and customize your menu. Unlock when ready.'
      });
    }, 300);
  };

  const handleUnlock = () => {
    commitPreview();
    toast({ 
      title: 'Service Menu unlocked!',
      description: 'All your services have been saved.'
    });
  };

  const handleDiscard = () => {
    if (confirm('Start fresh with a blank menu? Your preview changes will be lost.')) {
      discardPreview();
      toast({ title: 'Preview cleared' });
    }
  };

  // Service edit handlers
  const handleOpenDialog = (service?: Service) => {
    if (service) {
      setEditingService(service);
    } else {
      setEditingService(null);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingService(null);
  };

  const handleSave = (data: {
    name: string;
    price: number;
    duration?: number;
    thumbnailUrl?: string;
    bgColor?: string;
  }) => {
    if (editingService) {
      updateService(editingService.id, data);
      toast({ title: 'Service updated' });
    } else {
      addService(data);
      toast({ title: 'Service added' });
    }
    handleCloseDialog();
  };

  const handleDelete = (service: Service) => {
    if (confirm(`Delete "${service.name}"?`)) {
      deleteService(service.id);
      // Also remove from selection if selected
      setSelectedServices(prev => prev.filter(s => s.id !== service.id));
      toast({ title: 'Service deleted' });
    }
  };

  const handleMoveUp = (serviceId: string) => {
    reorderService(serviceId, 'up');
  };

  const handleMoveDown = (serviceId: string) => {
    reorderService(serviceId, 'down');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        title="Services"
        description="Select services to add to quotes, invoices, or appointments"
        action={
          isEnabled && !needsInit ? (
            <div className="flex items-center gap-2">
              <ServiceColorPicker
                value={menuSettings.globalBgColor}
                onChange={updateGlobalColor}
              />
              <Button className="gap-2" onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4" />
                Add Service
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Init dialog only if menu is not unlocked (new users who haven't been through setup yet) */}
      <ServiceMenuInitDialog
        open={isEnabled && needsInit}
        onSelectBlank={handleSelectBlank}
        onSelectPreset={handleSelectPreset}
        loading={loadingPreset}
      />

      {/* Show content when enabled and initialized */}
      {isEnabled && !needsInit && (
        <>
          {/* Preview mode banner */}
          {isPreviewMode && (
            <ServiceMenuPreviewBanner
              onUnlock={handleUnlock}
              onDiscard={handleDiscard}
              presetName={menuSettings.presetId ? SERVICE_PRESETS[menuSettings.presetId]?.name : undefined}
            />
          )}

          {services.length === 0 ? (
            <div className="space-y-6">
              {/* Empty state with add button */}
              <div className="text-center py-8">
                <Scissors className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No services yet</p>
                <Button className="gap-2" onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4" />
                  Add your first service
                </Button>
              </div>
              
              {/* Inline upsell for importing ready-made list */}
              {hasPreset && presetServices.length > 0 && (
                <Card className="p-4 border-dashed bg-muted/30">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Sparkles className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          Skip the typing — import a ready-made list
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ${PRICING.PREPOPULATED_MENU_PRICE.toFixed(2)} • {presetServices.length} {presetConfig?.name || 'professional'} services
                        </p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={handleImportReadyMadeList}
                      disabled={importingServices}
                      className="gap-2 shrink-0"
                    >
                      {importingServices ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          Import List
                          <Badge variant="secondary" className="ml-1 text-xs">
                            ${PRICING.PREPOPULATED_MENU_PRICE.toFixed(2)}
                          </Badge>
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {services.map((service, index) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  globalBgColor={menuSettings.globalBgColor}
                  isSelected={selectedServices.some(s => s.id === service.id)}
                  onToggleSelect={canUseServices ? handleToggleSelect : undefined}
                  onEdit={handleOpenDialog}
                  onDelete={handleDelete}
                  onMoveUp={() => handleMoveUp(service.id)}
                  onMoveDown={() => handleMoveDown(service.id)}
                  isFirst={index === 0}
                  isLast={index === services.length - 1}
                  isPreviewMode={isPreviewMode}
                />
              ))}
            </div>
          )}

          {/* Floating Selection Action Bar */}
          {selectedServices.length > 0 && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 lg:left-[calc(50%+8rem)] z-50">
              <Card className="p-4 shadow-lg border-primary/20 bg-background">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium">{selectedServices.length} service(s) selected</p>
                    <p className="text-sm text-muted-foreground">
                      Total: ${selectionTotal.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {/* Mobile business: Add to Quote */}
                    {!isStationaryBusiness && (
                      <Button onClick={handleAddToQuote} variant="outline" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Add to Quote
                      </Button>
                    )}
                    {/* Stationary business: Add to Appointment */}
                    {isStationaryBusiness && (
                      <Button onClick={handleAddToAppointment} variant="outline" className="gap-2">
                        <CalendarPlus className="h-4 w-4" />
                        Add to Appointment
                      </Button>
                    )}
                    {/* Both: Add to Invoice */}
                    <Button onClick={handleAddToInvoice} className="gap-2">
                      <Receipt className="h-4 w-4" />
                      Add to Invoice
                    </Button>
                    {/* Clear selection */}
                    <Button variant="ghost" size="icon" onClick={clearSelection}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Edit Dialog */}
          <ServiceEditDialog
            open={dialogOpen}
            onClose={handleCloseDialog}
            onSave={handleSave}
            service={editingService}
            globalBgColor={menuSettings.globalBgColor}
          />

          {/* Invoice Dialog */}
          <InvoiceDialog
            open={invoiceDialogOpen}
            onOpenChange={setInvoiceDialogOpen}
            clients={clients}
            onSave={handleCreateInvoice}
            defaultItems={getSelectedLineItems()}
            defaultInvoiceNumber={getNextInvoiceNumber()}
          />

          {/* Quote Dialog - Mobile only */}
          {!isStationaryBusiness && (
            <QuoteDialog
              open={quoteDialogOpen}
              onOpenChange={setQuoteDialogOpen}
              clients={clients}
              onSave={handleSaveQuote}
            />
          )}

          {/* Appointment Dialog - Stationary only */}
          {isStationaryBusiness && (
            <QuickAppointmentDialog
              open={appointmentDialogOpen}
              onOpenChange={setAppointmentDialogOpen}
              clients={clients}
              services={services}
              onSave={handleSaveAppointment}
            />
          )}
        </>
      )}
    </div>
  );
}