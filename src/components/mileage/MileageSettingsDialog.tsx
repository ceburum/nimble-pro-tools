import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Bluetooth, Clock, DollarSign, Plus, X } from 'lucide-react';
import { MileageSettings, DEFAULT_IRS_RATE } from '@/lib/mileageUtils';

interface MileageSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: MileageSettings;
  onSave: (settings: Partial<MileageSettings>) => void;
}

export function MileageSettingsDialog({
  open,
  onOpenChange,
  settings,
  onSave,
}: MileageSettingsDialogProps) {
  const [irsRate, setIrsRate] = useState(settings.irsRate.toString());
  const [businessHoursStart, setBusinessHoursStart] = useState(settings.businessHoursStart);
  const [businessHoursEnd, setBusinessHoursEnd] = useState(settings.businessHoursEnd);
  const [autoStartEnabled, setAutoStartEnabled] = useState(settings.autoStartEnabled);
  const [bluetoothDevices, setBluetoothDevices] = useState<string[]>(settings.bluetoothDevices);
  const [newDevice, setNewDevice] = useState('');

  const handleSave = () => {
    onSave({
      irsRate: parseFloat(irsRate) || DEFAULT_IRS_RATE,
      businessHoursStart,
      businessHoursEnd,
      autoStartEnabled,
      bluetoothDevices,
    });
    onOpenChange(false);
  };

  const addBluetoothDevice = () => {
    if (newDevice.trim() && !bluetoothDevices.includes(newDevice.trim())) {
      setBluetoothDevices([...bluetoothDevices, newDevice.trim()]);
      setNewDevice('');
    }
  };

  const removeBluetoothDevice = (device: string) => {
    setBluetoothDevices(bluetoothDevices.filter(d => d !== device));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mileage Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* IRS Rate */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              IRS Mileage Rate (per mile)
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">$</span>
              <Input
                type="number"
                step="0.01"
                value={irsRate}
                onChange={(e) => setIrsRate(e.target.value)}
                placeholder="0.70"
                className="w-24"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIrsRate(DEFAULT_IRS_RATE.toString())}
              >
                Use 2024 Rate
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Current IRS rate: ${DEFAULT_IRS_RATE}/mile (2024)
            </p>
          </div>

          <Separator />

          {/* Business Hours */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Business Hours
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="time"
                value={businessHoursStart}
                onChange={(e) => setBusinessHoursStart(e.target.value)}
                className="w-32"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="time"
                value={businessHoursEnd}
                onChange={(e) => setBusinessHoursEnd(e.target.value)}
                className="w-32"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Trips during these hours are marked as business travel
            </p>
          </div>

          <Separator />

          {/* Bluetooth Auto-Start */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Bluetooth className="h-4 w-4" />
                Bluetooth Auto-Start
              </Label>
              <Switch
                checked={autoStartEnabled}
                onCheckedChange={setAutoStartEnabled}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Automatically start tracking when connected to paired devices
            </p>

            {autoStartEnabled && (
              <div className="space-y-2">
                <Label className="text-sm">Paired Devices</Label>
                <div className="flex flex-wrap gap-2">
                  {bluetoothDevices.map((device) => (
                    <Badge key={device} variant="secondary" className="gap-1">
                      {device}
                      <button
                        onClick={() => removeBluetoothDevice(device)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={newDevice}
                    onChange={(e) => setNewDevice(e.target.value)}
                    placeholder="Device name (e.g., Car Audio)"
                    className="flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && addBluetoothDevice()}
                  />
                  <Button size="icon" variant="outline" onClick={addBluetoothDevice}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Note: Native Bluetooth detection requires the mobile app
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
