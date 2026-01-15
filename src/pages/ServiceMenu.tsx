import { useState, useCallback } from 'react';
import { Plus, Scissors, Loader2, Sparkles } from 'lucide-react';
import { useServices } from '@/hooks/useServices';
import { Service } from '@/types/services';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useToast } from '@/hooks/use-toast';
import { useAppState } from '@/hooks/useAppState';
import { useInvoices } from '@/hooks/useInvoices';
import { useClients } from '@/hooks/useClients';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { useAppointmentInvoice } from '@/hooks/useAppointmentInvoice';
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
import { useSetup } from '@/hooks/useSetup';

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
    resetMenu,
  } = useServices();
  
  const { updateFlag } = useFeatureFlags();
  const { state, capabilities, setupProgress } = useAppState();
  const { addInvoice, invoices } = useInvoices();
  const { clients } = useClients();
  const { profile } = useBusinessProfile();
  const { 
    activeAppointmentId, 
    activeInvoice, 
    addServiceToAppointmentInvoice,
    isStationaryBusiness,
  } = useAppointmentInvoice();
  const { businessSector } = useSetup();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [enabling, setEnabling] = useState(false);
  const [loadingPreset, setLoadingPreset] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [pendingService, setPendingService] = useState<Service | null>(null);
  const [importingServices, setImportingServices] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Get preset configuration for the user's sector
  const presetConfig = businessSector ? MENU_PRESETS_CONFIG[businessSector as keyof typeof MENU_PRESETS_CONFIG] : null;
  const hasPreset = presetConfig?.hasPreset ?? false;
  const presetServices = businessSector 
    ? SERVICE_LIBRARY.find(cat => cat.id === businessSector)?.services || []
    : [];

  // Handle importing ready-made list
  const handleImportReadyMadeList = async () => {
    if (!businessSector || !hasPreset) return;
    
    setImportingServices(true);
    try {
      // Load the preset services and commit them directly
      loadPreset(businessSector);
      // Since loadPreset puts them in preview mode, we need to commit immediately
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

  // Check if user can add services to invoices based on AppState
  const canAddToInvoice = [
    AppState.READY_BASE,
    AppState.TRIAL_PRO,
    AppState.PAID_PRO,
    AppState.ADMIN_PREVIEW
  ].includes(state);

  const handleEnableServiceMenu = async (): Promise<boolean> => {
    setEnabling(true);
    try {
      updateFlag('service_menu_enabled', true);
      toast({ title: 'Service Menu activated!' });
      return true;
    } finally {
      setEnabling(false);
    }
  };

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
    // In production, this would trigger a payment flow
    // For now, we'll just commit the preview
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
      toast({ title: 'Service deleted' });
    }
  };

  const handleMoveUp = (serviceId: string) => {
    reorderService(serviceId, 'up');
  };

  const handleMoveDown = (serviceId: string) => {
    reorderService(serviceId, 'down');
  };

  // Handle adding a service to an invoice
  const handleAddToInvoice = useCallback(async (service: Service) => {
    if (!canAddToInvoice) {
      toast({
        title: 'Feature not available',
        description: 'Complete setup to add services to invoices.',
        variant: 'destructive',
      });
      return;
    }

    // For stationary businesses with an active appointment, add directly to appointment invoice
    if (isStationaryBusiness && activeAppointmentId && activeInvoice) {
      const success = await addServiceToAppointmentInvoice(service);
      if (success) {
        // Toast already shown by the hook
        return;
      }
    }

    // Otherwise, open the invoice dialog for manual invoice creation
    // Check if there are any clients
    if (clients.length === 0) {
      toast({
        title: 'No clients found',
        description: 'Please add a client first before creating an invoice.',
        variant: 'destructive',
      });
      navigate('/clients');
      return;
    }

    // Store the pending service and open invoice dialog
    setPendingService(service);
    setInvoiceDialogOpen(true);
  }, [canAddToInvoice, isStationaryBusiness, activeAppointmentId, activeInvoice, addServiceToAppointmentInvoice, clients, navigate, toast]);

  // Handle invoice creation with the pending service
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
        description: `Invoice ${newInvoice.invoiceNumber} created with ${pendingService?.name || 'service'}.`,
      });
      setInvoiceDialogOpen(false);
      setPendingService(null);
      
      // Navigate to invoices page to view the new invoice
      navigate('/invoices');
    }
  }, [addInvoice, pendingService, navigate, toast]);

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

  // Create initial line items from pending service
  const getInitialLineItems = useCallback(() => {
    if (!pendingService) return [];
    
    return [{
      id: crypto.randomUUID(),
      description: pendingService.name,
      quantity: 1,
      unitPrice: pendingService.price,
    }];
  }, [pendingService]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service Menu"
        description="Manage your service offerings"
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
                  onEdit={handleOpenDialog}
                  onDelete={handleDelete}
                  onAddToInvoice={handleAddToInvoice}
                  onMoveUp={() => handleMoveUp(service.id)}
                  onMoveDown={() => handleMoveDown(service.id)}
                  isFirst={index === 0}
                  isLast={index === services.length - 1}
                  isPreviewMode={isPreviewMode}
                  canAddToInvoice={canAddToInvoice}
                />
              ))}
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

          {/* Invoice Dialog - opened when adding service to invoice */}
          <InvoiceDialog
            open={invoiceDialogOpen}
            onOpenChange={setInvoiceDialogOpen}
            clients={clients}
            onSave={handleCreateInvoice}
            defaultItems={getInitialLineItems()}
            defaultInvoiceNumber={getNextInvoiceNumber()}
          />
        </>
      )}
    </div>
  );
}
