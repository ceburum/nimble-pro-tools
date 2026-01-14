import { useState, useCallback, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, User, Calendar, Receipt, CheckCircle, XCircle, 
  AlertTriangle, FileText, Plus, ExternalLink 
} from 'lucide-react';
import { format, addMinutes } from 'date-fns';
import { cn } from '@/lib/utils';
import { Invoice, LineItem } from '@/types';
import { Service } from '@/types/services';
import { useAppointmentInvoice } from '@/hooks/useAppointmentInvoice';
import { useInvoices } from '@/hooks/useInvoices';
import { useServices } from '@/hooks/useServices';
import { AppointmentInvoicePanel } from '@/components/appointments/AppointmentInvoicePanel';
import { AddToCalendarButton } from '@/components/scheduling/AddToCalendarButton';
import { CalendarEvent } from '@/lib/calendarUtils';
import { toast } from 'sonner';

interface AppointmentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: {
    id: string;
    date: Date;
    startTime: string;
    duration: number;
    status: string;
    notes?: string;
    clientId: string;
    client?: { id: string; name: string };
    service?: { id: string; name: string; price?: number };
  } | null;
  onComplete?: (appointmentId: string) => void;
  onCancel?: (appointmentId: string) => void;
  onNavigateToInvoices?: () => void;
}

export function AppointmentDetailDialog({
  open,
  onOpenChange,
  appointment,
  onComplete,
  onCancel,
  onNavigateToInvoices,
}: AppointmentDetailDialogProps) {
  const { 
    getInvoiceForAppointment, 
    createInvoiceForAppointment,
    setActiveAppointmentId,
    canAddToInvoice,
  } = useAppointmentInvoice();
  const { updateInvoice, refetch: refetchInvoices } = useInvoices();
  const { services } = useServices();
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);

  // Load invoice when dialog opens
  useEffect(() => {
    if (open && appointment) {
      const existingInvoice = getInvoiceForAppointment(appointment.id);
      setInvoice(existingInvoice || null);
      
      // Set as active appointment for service menu integration
      setActiveAppointmentId(appointment.id);
    } else {
      setActiveAppointmentId(null);
    }
  }, [open, appointment, getInvoiceForAppointment, setActiveAppointmentId]);

  // Format time display
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Get status info
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle, label: 'Completed', color: 'text-success bg-success/10' };
      case 'cancelled':
        return { icon: XCircle, label: 'Cancelled', color: 'text-destructive bg-destructive/10' };
      case 'no_show':
        return { icon: AlertTriangle, label: 'No Show', color: 'text-warning bg-warning/10' };
      default:
        return { icon: Clock, label: 'Scheduled', color: 'text-primary bg-primary/10' };
    }
  };

  // Create invoice for appointment
  const handleCreateInvoice = useCallback(async () => {
    if (!appointment || !canAddToInvoice) return;
    
    setLoading(true);
    try {
      // Create initial items from service if available
      const initialItems: LineItem[] = [];
      if (appointment.service) {
        initialItems.push({
          id: crypto.randomUUID(),
          description: appointment.service.name,
          quantity: 1,
          unitPrice: appointment.service.price || 0,
        });
      }

      const newInvoice = await createInvoiceForAppointment(
        appointment.id,
        appointment.clientId,
        initialItems
      );
      
      if (newInvoice) {
        setInvoice(newInvoice);
        await refetchInvoices();
      }
    } finally {
      setLoading(false);
    }
  }, [appointment, canAddToInvoice, createInvoiceForAppointment, refetchInvoices]);

  // Handle complete appointment
  const handleComplete = useCallback(() => {
    if (appointment && onComplete) {
      onComplete(appointment.id);
      onOpenChange(false);
    }
  }, [appointment, onComplete, onOpenChange]);

  // Handle cancel appointment
  const handleCancel = useCallback(() => {
    if (appointment && onCancel) {
      if (confirm('Are you sure you want to cancel this appointment?')) {
        onCancel(appointment.id);
        onOpenChange(false);
      }
    }
  }, [appointment, onCancel, onOpenChange]);

  if (!appointment) return null;

  const statusInfo = getStatusInfo(appointment.status);
  const StatusIcon = statusInfo.icon;

  // Create calendar event for export
  const calendarEvent: CalendarEvent = useMemo(() => {
    // Calculate end time from start time and duration
    const [startHour, startMin] = appointment.startTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = startMinutes + appointment.duration;
    const endHour = Math.floor(endMinutes / 60);
    const endMin = endMinutes % 60;
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;

    return {
      title: appointment.service?.name || 'Appointment',
      description: [
        `Client: ${appointment.client?.name || 'Unknown'}`,
        appointment.service ? `Service: ${appointment.service.name}` : '',
        appointment.notes || '',
      ].filter(Boolean).join('\n'),
      location: '', // Could be populated from business profile
      startDate: appointment.date,
      startTime: appointment.startTime,
      endTime,
    };
  }, [appointment]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Appointment Details</span>
            <Badge className={cn('ml-2', statusInfo.color)}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusInfo.label}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date & Time */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{format(appointment.date, 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{formatTime(appointment.startTime)} ({appointment.duration} min)</span>
            </div>
          </div>

          {/* Client */}
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{appointment.client?.name || 'Unknown Client'}</span>
          </div>

          {/* Service */}
          {appointment.service && (
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>{appointment.service.name}</span>
              {appointment.service.price && (
                <span className="text-muted-foreground">- ${appointment.service.price}</span>
              )}
            </div>
          )}

          {/* Notes */}
          {appointment.notes && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">{appointment.notes}</p>
            </div>
          )}

          <Separator />

          {/* Invoice Section */}
          {canAddToInvoice && (
            <AppointmentInvoicePanel
              invoice={invoice}
              appointmentId={appointment.id}
              clientId={appointment.clientId}
              onCreateInvoice={handleCreateInvoice}
            />
          )}

          {/* Actions */}
          {appointment.status === 'scheduled' && (
            <>
              <Separator />
              <div className="flex gap-2 flex-wrap">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCancel}
                  className="text-destructive hover:text-destructive"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleComplete}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Complete
                </Button>
                <AddToCalendarButton event={calendarEvent} size="sm" />
                {invoice && onNavigateToInvoices && (
                  <Button variant="outline" size="sm" onClick={onNavigateToInvoices}>
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View Invoice
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
