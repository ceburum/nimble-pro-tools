import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { 
  Plus, 
  Minus, 
  Loader2, 
  Calendar as CalendarIcon,
  Clock,
  X,
  QrCode
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Client, LineItem } from '@/types';
import { Service } from '@/types/services';
import { cn } from '@/lib/utils';
import { PaylinkQRDialog } from '@/components/invoices/PaylinkQRDialog';
import { useAppointmentInvoice } from '@/hooks/useAppointmentInvoice';
import { useInvoices } from '@/hooks/useInvoices';
import { toast } from 'sonner';

interface QuickAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  services: Service[];
  selectedDate?: Date;
  onSave: (data: {
    clientId: string;
    serviceId?: string;
    date: Date;
    startTime: string;
    duration: number;
    notes?: string;
    items: LineItem[];
  }) => Promise<{ appointmentId: string; invoiceId?: string; paymentToken?: string } | null>;
  onAddClient?: () => void;
}

const TIME_SLOTS = [
  { value: '08:00', label: '8:00 AM' },
  { value: '08:30', label: '8:30 AM' },
  { value: '09:00', label: '9:00 AM' },
  { value: '09:30', label: '9:30 AM' },
  { value: '10:00', label: '10:00 AM' },
  { value: '10:30', label: '10:30 AM' },
  { value: '11:00', label: '11:00 AM' },
  { value: '11:30', label: '11:30 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '12:30', label: '12:30 PM' },
  { value: '13:00', label: '1:00 PM' },
  { value: '13:30', label: '1:30 PM' },
  { value: '14:00', label: '2:00 PM' },
  { value: '14:30', label: '2:30 PM' },
  { value: '15:00', label: '3:00 PM' },
  { value: '15:30', label: '3:30 PM' },
  { value: '16:00', label: '4:00 PM' },
  { value: '16:30', label: '4:30 PM' },
  { value: '17:00', label: '5:00 PM' },
  { value: '17:30', label: '5:30 PM' },
  { value: '18:00', label: '6:00 PM' },
];

export function QuickAppointmentDialog({
  open,
  onOpenChange,
  clients,
  services,
  selectedDate,
  onSave,
  onAddClient,
}: QuickAppointmentDialogProps) {
  const [step, setStep] = useState<'services' | 'schedule' | 'paylink'>('services');
  const [clientId, setClientId] = useState('');
  const [date, setDate] = useState<Date>(selectedDate || new Date());
  const [startTime, setStartTime] = useState('09:00');
  const [notes, setNotes] = useState('');
  const [selectedServices, setSelectedServices] = useState<{ service: Service; quantity: number }[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Paylink state
  const [paylinkOpen, setPaylinkOpen] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<{
    paymentToken: string;
    invoiceNumber: string;
    total: number;
  } | null>(null);

  const { generateInvoiceNumber, createInvoiceForAppointment } = useAppointmentInvoice();
  const { addInvoice } = useInvoices();

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setStep('services');
      setClientId('');
      setDate(selectedDate || new Date());
      setStartTime('09:00');
      setNotes('');
      setSelectedServices([]);
      setCreatedInvoice(null);
    }
  }, [open, selectedDate]);

  // Calculate totals
  const { items, total, totalDuration } = useMemo(() => {
    const items: LineItem[] = selectedServices.map(({ service, quantity }) => ({
      id: `item_${service.id}`,
      description: service.name,
      quantity,
      unitPrice: service.price,
    }));

    const total = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const totalDuration = selectedServices.reduce(
      (sum, { service, quantity }) => sum + ((service.duration || 30) * quantity),
      0
    );

    return { items, total, totalDuration };
  }, [selectedServices]);

  const selectedClient = clients.find(c => c.id === clientId);

  const addService = (service: Service) => {
    setSelectedServices(prev => {
      const existing = prev.find(s => s.service.id === service.id);
      if (existing) {
        return prev.map(s => 
          s.service.id === service.id 
            ? { ...s, quantity: s.quantity + 1 }
            : s
        );
      }
      return [...prev, { service, quantity: 1 }];
    });
  };

  const updateQuantity = (serviceId: string, delta: number) => {
    setSelectedServices(prev => {
      return prev
        .map(s => 
          s.service.id === serviceId 
            ? { ...s, quantity: Math.max(0, s.quantity + delta) }
            : s
        )
        .filter(s => s.quantity > 0);
    });
  };

  const handleSubmit = async () => {
    if (!clientId) {
      toast.error('Please select a client');
      return;
    }
    if (selectedServices.length === 0) {
      toast.error('Please add at least one service');
      return;
    }

    setLoading(true);
    try {
      // First, create the appointment
      const result = await onSave({
        clientId,
        date,
        startTime,
        duration: totalDuration,
        notes: notes || undefined,
        items,
      });

      if (result) {
        // Generate invoice for appointment
        const invoiceNumber = generateInvoiceNumber();
        
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);

        // Create invoice (payment token is auto-generated by DB)
        const invoice = await addInvoice({
          clientId,
          invoiceNumber,
          items,
          status: 'sent',
          dueDate,
          contextType: 'appointment',
          contextId: result.appointmentId,
        });

        if (invoice && invoice.paymentToken) {
          // Show Paylink dialog
          setCreatedInvoice({
            paymentToken: invoice.paymentToken,
            invoiceNumber: invoice.invoiceNumber,
            total,
          });
          setPaylinkOpen(true);
          setStep('paylink');
          toast.success('Appointment created with invoice!');
        } else {
          toast.success('Appointment created!');
          onOpenChange(false);
        }
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast.error('Failed to create appointment');
    } finally {
      setLoading(false);
    }
  };

  const canProceedToSchedule = selectedServices.length > 0;
  const canSubmit = clientId && selectedServices.length > 0;

  return (
    <>
      <Dialog open={open && step !== 'paylink'} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {step === 'services' ? 'Add Services' : 'Schedule Appointment'}
            </DialogTitle>
            <DialogDescription>
              {step === 'services' 
                ? 'Select services for this appointment'
                : 'Choose a time for the appointment'}
            </DialogDescription>
          </DialogHeader>

          {step === 'services' && (
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Service Grid */}
              <ScrollArea className="flex-1 pr-2">
                {services.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {services.map(service => {
                      const selected = selectedServices.find(s => s.service.id === service.id);
                      return (
                        <button
                          key={service.id}
                          onClick={() => addService(service)}
                          className={cn(
                            "p-3 rounded-lg border text-left transition-all relative",
                            selected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <p className="font-medium text-sm line-clamp-2">{service.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            ${service.price.toFixed(2)}
                            {service.duration && ` · ${service.duration}min`}
                          </p>
                          {selected && (
                            <span className="absolute top-1 right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">
                              {selected.quantity}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No services yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add services from your Service Menu first
                    </p>
                  </div>
                )}
              </ScrollArea>

              {/* Selected Services Summary */}
              {selectedServices.length > 0 && (
                <div className="border-t pt-4 mt-4 space-y-3">
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {selectedServices.map(({ service, quantity }) => (
                      <div key={service.id} className="flex items-center justify-between text-sm">
                        <span className="flex-1">{service.name}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(service.id, -1)}
                            className="p-1 rounded hover:bg-muted"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center">{quantity}</span>
                          <button
                            onClick={() => updateQuantity(service.id, 1)}
                            className="p-1 rounded hover:bg-muted"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <span className="w-16 text-right font-medium">
                            ${(service.price * quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setStep('schedule')}
                  disabled={!canProceedToSchedule}
                  className="flex-1"
                >
                  Next: Schedule
                </Button>
              </div>
            </div>
          )}

          {step === 'schedule' && (
            <div className="space-y-4">
              {/* Client Selection */}
              <div className="space-y-2">
                <Label>Client</Label>
                <div className="flex gap-2">
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {onAddClient && (
                    <Button variant="outline" onClick={onAddClient}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(date, 'MMM d, yyyy')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(d) => d && setDate(d)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Time</Label>
                  <Select value={startTime} onValueChange={setStartTime}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map(slot => (
                        <SelectItem key={slot.value} value={slot.value}>
                          {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Duration Display */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Estimated duration: {totalDuration} minutes</span>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special requests or notes..."
                />
              </div>

              {/* Summary */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Services</span>
                  <span>{selectedServices.length} items</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep('services')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit || loading}
                  className="flex-1 gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <QrCode className="h-4 w-4" />
                      Create & Get Paylink
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Paylink QR Dialog */}
      {createdInvoice && (
        <PaylinkQRDialog
          open={paylinkOpen}
          onOpenChange={(open) => {
            setPaylinkOpen(open);
            if (!open) {
              onOpenChange(false);
            }
          }}
          paymentToken={createdInvoice.paymentToken}
          invoiceNumber={createdInvoice.invoiceNumber}
          total={createdInvoice.total}
          clientName={selectedClient?.name}
          clientEmail={selectedClient?.email}
        />
      )}
    </>
  );
}
