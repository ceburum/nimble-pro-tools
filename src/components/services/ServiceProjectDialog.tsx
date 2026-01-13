import { useState } from 'react';
import { Service } from '@/types/services';
import { useServices } from '@/hooks/useServices';
import { Client, Project } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Scissors, DollarSign, Clock, Loader2 } from 'lucide-react';

interface ServiceProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  onSave: (data: { clientId: string; services: Service[] }) => void;
}

export function ServiceProjectDialog({
  open,
  onOpenChange,
  clients,
  onSave,
}: ServiceProjectDialogProps) {
  const { services, loading } = useServices();
  const [clientId, setClientId] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());

  const handleToggleService = (serviceId: string) => {
    setSelectedServiceIds(prev => {
      const next = new Set(prev);
      if (next.has(serviceId)) {
        next.delete(serviceId);
      } else {
        next.add(serviceId);
      }
      return next;
    });
  };

  const handleSubmit = () => {
    if (!clientId || selectedServiceIds.size === 0) return;
    
    const selectedServices = services.filter(s => selectedServiceIds.has(s.id));
    onSave({ clientId, services: selectedServices });
    
    // Reset state
    setClientId('');
    setSelectedServiceIds(new Set());
    onOpenChange(false);
  };

  const selectedServices = services.filter(s => selectedServiceIds.has(s.id));
  const total = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + (s.duration || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5" />
            New Appointment
          </DialogTitle>
          <DialogDescription>
            Select a client and services to create an appointment
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Client Selection */}
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Service Selection */}
            <div className="space-y-2">
              <Label>Services</Label>
              {services.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No services available. Add services in the Service Menu.
                </div>
              ) : (
                <ScrollArea className="h-[200px] border border-border rounded-lg">
                  <div className="p-2 space-y-1">
                    {services.map((service) => (
                      <label
                        key={service.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedServiceIds.has(service.id)}
                          onCheckedChange={() => handleToggleService(service.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{service.name}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-0.5">
                              <DollarSign className="h-3 w-3" />
                              {service.price.toFixed(2)}
                            </span>
                            {service.duration && (
                              <span className="flex items-center gap-0.5">
                                <Clock className="h-3 w-3" />
                                {service.duration} min
                              </span>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Summary */}
            {selectedServiceIds.size > 0 && (
              <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {selectedServiceIds.size} service{selectedServiceIds.size > 1 ? 's' : ''} selected
                  </span>
                  {totalDuration > 0 && (
                    <span className="text-muted-foreground">{totalDuration} min total</span>
                  )}
                </div>
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!clientId || selectedServiceIds.size === 0}
              >
                Create Appointment
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
