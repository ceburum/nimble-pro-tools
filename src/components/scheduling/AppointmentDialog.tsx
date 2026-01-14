import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Client } from '@/types';
import { Service } from '@/types/services';
import { format } from 'date-fns';
import { CalendarIcon, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditingAppointment {
  id: string;
  date: Date;
  startTime: string;
  duration: number;
  status: string;
  notes?: string;
  clientId: string;
  client?: { id: string; name: string };
  service?: { id: string; name: string; price?: number };
}

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  services?: Service[];
  selectedDate?: Date;
  editingAppointment?: EditingAppointment | null;
  preSelectedClientId?: string | null;
  onSave: (appointment: {
    clientId: string;
    serviceId?: string;
    date: Date;
    startTime: string;
    duration: number;
    notes?: string;
  }) => Promise<void>;
  onUpdate?: (appointmentId: string, data: {
    clientId: string;
    serviceId?: string;
    date: Date;
    startTime: string;
    duration: number;
    notes?: string;
  }) => Promise<void>;
}

const DURATION_OPTIONS = [
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '45', label: '45 minutes' },
  { value: '60', label: '1 hour' },
  { value: '90', label: '1.5 hours' },
  { value: '120', label: '2 hours' },
];

const TIME_SLOTS = Array.from({ length: 28 }, (_, i) => {
  const hour = Math.floor(i / 2) + 7; // Start at 7 AM
  const minutes = i % 2 === 0 ? '00' : '30';
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return {
    value: `${hour.toString().padStart(2, '0')}:${minutes}`,
    label: `${displayHour}:${minutes} ${period}`,
  };
});

export function AppointmentDialog({
  open,
  onOpenChange,
  clients,
  services = [],
  selectedDate,
  editingAppointment,
  preSelectedClientId,
  onSave,
  onUpdate,
}: AppointmentDialogProps) {
  const [clientId, setClientId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState<Date | undefined>(selectedDate);
  const [startTime, setStartTime] = useState('09:00');
  const [duration, setDuration] = useState('60');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const isEditing = !!editingAppointment;

  useEffect(() => {
    if (open) {
      if (editingAppointment) {
        // Populate form with existing appointment data for editing
        setClientId(editingAppointment.clientId);
        setServiceId(editingAppointment.service?.id || '');
        setDate(editingAppointment.date);
        setStartTime(editingAppointment.startTime);
        setDuration(editingAppointment.duration.toString());
        setNotes(editingAppointment.notes || '');
      } else {
        // New appointment - reset form
        setDate(selectedDate);
        setClientId(preSelectedClientId || '');
        setServiceId('');
        setStartTime('09:00');
        setDuration('60');
        setNotes('');
      }
    }
  }, [open, selectedDate, editingAppointment, preSelectedClientId]);

  // Auto-set duration when service is selected (only for new appointments)
  useEffect(() => {
    if (serviceId && services.length > 0 && !editingAppointment) {
      const service = services.find(s => s.id === serviceId);
      if (service?.duration) {
        setDuration(service.duration.toString());
      }
    }
  }, [serviceId, services, editingAppointment]);

  const handleSubmit = async () => {
    if (!clientId || !date) return;

    setSaving(true);
    try {
      const appointmentData = {
        clientId,
        serviceId: serviceId || undefined,
        date,
        startTime,
        duration: parseInt(duration),
        notes: notes || undefined,
      };

      if (isEditing && onUpdate && editingAppointment) {
        await onUpdate(editingAppointment.id, appointmentData);
      } else {
        await onSave(appointmentData);
      }
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Appointment' : 'Book Appointment'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="client">Client</Label>
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

          {/* Service Selection (if services available) */}
          {services.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="service">Service (optional)</Label>
              <Select value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} - ${service.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time and Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger>
                  <Clock className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((slot) => (
                    <SelectItem key={slot.value} value={slot.value}>
                      {slot.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional details..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!clientId || !date || saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Update Appointment' : 'Book Appointment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
