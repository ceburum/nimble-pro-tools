import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Truck, Building2, Loader2 } from 'lucide-react';

interface BusinessTypeSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectType: (type: 'mobile_job' | 'stationary_appointment') => Promise<boolean>;
}

export function BusinessTypeSetupDialog({ open, onOpenChange, onSelectType }: BusinessTypeSetupDialogProps) {
  const [saving, setSaving] = useState(false);
  const [selectedType, setSelectedType] = useState<'mobile_job' | 'stationary_appointment' | null>(null);

  const handleSelect = async (type: 'mobile_job' | 'stationary_appointment') => {
    setSelectedType(type);
    setSaving(true);
    const success = await onSelectType(type);
    setSaving(false);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>How does your business operate?</DialogTitle>
          <DialogDescription>
            This helps us customize your scheduling experience. You can change this later in settings.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <button
            onClick={() => handleSelect('mobile_job')}
            disabled={saving}
            className={`relative flex items-start gap-4 p-4 rounded-lg border-2 text-left transition-all hover:border-primary hover:bg-primary/5 ${
              selectedType === 'mobile_job' ? 'border-primary bg-primary/5' : 'border-border'
            }`}
          >
            <div className="p-3 rounded-lg bg-primary/10 shrink-0">
              <Truck className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Mobile / Job-Based Business</h3>
              <p className="text-sm text-muted-foreground">
                I travel to clients — contractors, service providers, mobile services, field technicians
              </p>
            </div>
            {saving && selectedType === 'mobile_job' && (
              <Loader2 className="h-5 w-5 animate-spin absolute top-4 right-4" />
            )}
          </button>

          <button
            onClick={() => handleSelect('stationary_appointment')}
            disabled={saving}
            className={`relative flex items-start gap-4 p-4 rounded-lg border-2 text-left transition-all hover:border-primary hover:bg-primary/5 ${
              selectedType === 'stationary_appointment' ? 'border-primary bg-primary/5' : 'border-border'
            }`}
          >
            <div className="p-3 rounded-lg bg-primary/10 shrink-0">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Stationary / Appointment-Based Business</h3>
              <p className="text-sm text-muted-foreground">
                Clients come to me — salons, barbershops, clinics, offices, studios
              </p>
            </div>
            {saving && selectedType === 'stationary_appointment' && (
              <Loader2 className="h-5 w-5 animate-spin absolute top-4 right-4" />
            )}
          </button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          This selection customizes your calendar labels and scheduling workflow.
        </p>
      </DialogContent>
    </Dialog>
  );
}
