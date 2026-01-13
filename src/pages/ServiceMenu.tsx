import { useState } from 'react';
import { Plus, Scissors, Trash2, Pencil, Clock, DollarSign, Loader2 } from 'lucide-react';
import { useServices } from '@/hooks/useServices';
import { Service } from '@/types/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProUpgradePage } from '@/components/pro/ProUpgradePage';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export default function ServiceMenu() {
  const { services, loading, isEnabled, addService, updateService, deleteService } = useServices();
  const { updateFlag } = useFeatureFlags();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [enabling, setEnabling] = useState(false);
  const { toast } = useToast();

  // Form state
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');

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

  if (!isEnabled) {
    return (
      <ProUpgradePage
        icon={<Scissors className="h-8 w-8 text-primary" />}
        title="Service Menu"
        description="Perfect for salons, barbershops, massage therapists, and other service-based businesses."
        features={[
          'Create and manage your service offerings',
          'Set prices and optional durations',
          'Quick appointment creation from services',
          'Automatic invoice line items',
        ]}
        onEnable={handleEnableServiceMenu}
        loading={enabling}
      />
    );
  }

  const handleOpenDialog = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setName(service.name);
      setPrice(service.price.toString());
      setDuration(service.duration?.toString() || '');
    } else {
      setEditingService(null);
      setName('');
      setPrice('');
      setDuration('');
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingService(null);
    setName('');
    setPrice('');
    setDuration('');
  };

  const handleSave = () => {
    const priceNum = parseFloat(price);
    const durationNum = duration ? parseInt(duration) : undefined;

    if (!name.trim() || isNaN(priceNum) || priceNum < 0) {
      toast({ title: 'Invalid input', description: 'Please enter a valid name and price', variant: 'destructive' });
      return;
    }

    if (editingService) {
      updateService(editingService.id, { name: name.trim(), price: priceNum, duration: durationNum });
      toast({ title: 'Service updated' });
    } else {
      addService({ name: name.trim(), price: priceNum, duration: durationNum });
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
          <Button className="gap-2" onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4" />
            Add Service
          </Button>
        }
      />

      {services.length === 0 ? (
        <div className="text-center py-12">
          <Scissors className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No services yet</p>
          <Button variant="link" className="mt-2" onClick={() => handleOpenDialog()}>
            Add your first service
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate">{service.name}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5" />
                      ${service.price.toFixed(2)}
                    </span>
                    {service.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {service.duration} min
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleOpenDialog(service)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(service)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{editingService ? 'Edit Service' : 'Add Service'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="service-name">Service Name</Label>
              <Input
                id="service-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Manicure, Haircut"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-price">Price ($)</Label>
              <Input
                id="service-price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-duration">Duration (minutes, optional)</Label>
              <Input
                id="service-duration"
                type="number"
                min="0"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="30"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingService ? 'Save Changes' : 'Add Service'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
