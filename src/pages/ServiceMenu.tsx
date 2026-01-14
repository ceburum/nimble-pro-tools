import { useState } from 'react';
import { Plus, Scissors, Loader2, RotateCcw } from 'lucide-react';
import { useServices } from '@/hooks/useServices';
import { useCapabilities } from '@/hooks/useCapabilities';
import { Service } from '@/types/services';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { FeatureNotice } from '@/components/ui/feature-notice';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useToast } from '@/hooks/use-toast';
import { ServiceCard } from '@/components/services/ServiceCard';
import { ServiceEditDialog } from '@/components/services/ServiceEditDialog';
import { ServiceMenuInitDialog } from '@/components/services/ServiceMenuInitDialog';
import { ServiceMenuPreviewBanner } from '@/components/services/ServiceMenuPreviewBanner';
import { ServiceColorPicker } from '@/components/services/ServiceColorPicker';
import { SERVICE_PRESETS } from '@/config/servicePresets';
import { useNavigate } from 'react-router-dom';

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
  const { isAdmin } = useCapabilities();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [enabling, setEnabling] = useState(false);
  const [loadingPreset, setLoadingPreset] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleResetMenu = () => {
    if (confirm('Reset the entire Service Menu? This will delete all services and return to the setup screen.')) {
      resetMenu();
      updateFlag('service_menu_enabled', false);
      toast({ 
        title: 'Service Menu reset', 
        description: 'You can now reinitialize with a preset or blank menu.' 
      });
    }
  };

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
              {isAdmin && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleResetMenu}
                  className="text-muted-foreground"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              )}
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

      {/* Show inline notice if feature is not enabled */}
      {!isEnabled && (
        <FeatureNotice
          icon={<Scissors className="h-8 w-8 text-primary" />}
          title="Service Menu"
          description="Perfect for salons, barbershops, massage therapists, and other service-based businesses."
          features={[
            'Create and manage your service offerings',
            'Set prices and optional durations',
            'Add images and custom colors to tiles',
            'Quick appointment creation from services',
          ]}
          onEnable={handleEnableServiceMenu}
          loading={enabling}
          className="max-w-2xl mx-auto"
        />
      )}

      {/* Init dialog - choose blank or preset */}
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
            <div className="text-center py-12">
              <Scissors className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No services yet</p>
              <Button variant="link" className="mt-2" onClick={() => handleOpenDialog()}>
                Add your first service
              </Button>
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
                  onMoveUp={() => handleMoveUp(service.id)}
                  onMoveDown={() => handleMoveDown(service.id)}
                  isFirst={index === 0}
                  isLast={index === services.length - 1}
                  isPreviewMode={isPreviewMode}
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
        </>
      )}
    </div>
  );
}
