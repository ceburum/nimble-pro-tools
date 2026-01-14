import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Clock, User, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AppointmentDisplay {
  id: string;
  date: Date;
  startTime: string;
  duration: number;
  status: string;
  notes?: string;
  client?: { name: string };
  service?: { name: string; price?: number };
}

interface AppointmentDayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  appointments: AppointmentDisplay[];
  onAddAppointment: () => void;
  onViewAppointment?: (appointment: AppointmentDisplay) => void;
}

export function AppointmentDayDialog({
  open,
  onOpenChange,
  date,
  appointments,
  onAddAppointment,
  onViewAppointment,
}: AppointmentDayDialogProps) {
  // Sort appointments by start time
  const sortedAppointments = [...appointments].sort((a, b) => {
    const timeA = a.startTime.split(':').map(Number);
    const timeB = b.startTime.split(':').map(Number);
    return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
  });

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'no_show':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      default:
        return <Clock className="h-4 w-4 text-primary" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'no_show':
        return 'No Show';
      default:
        return 'Scheduled';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{format(date, 'EEEE, MMMM d, yyyy')}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="py-2">
          {sortedAppointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No appointments scheduled</p>
              <Button variant="link" className="mt-2" onClick={onAddAppointment}>
                Book an appointment
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {sortedAppointments.map(appt => (
                  <div
                    key={appt.id}
                    className={cn(
                      'p-3 rounded-lg border transition-colors',
                      appt.status === 'cancelled' && 'opacity-60',
                      onViewAppointment && 'cursor-pointer hover:bg-accent/50'
                    )}
                    onClick={() => onViewAppointment?.(appt)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(appt.status)}
                        <span className="font-semibold">{formatTime(appt.startTime)}</span>
                        <span className="text-sm text-muted-foreground">
                          ({appt.duration} min)
                        </span>
                      </div>
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full',
                        appt.status === 'scheduled' && 'bg-primary/10 text-primary',
                        appt.status === 'completed' && 'bg-success/10 text-success',
                        appt.status === 'cancelled' && 'bg-destructive/10 text-destructive',
                        appt.status === 'no_show' && 'bg-warning/10 text-warning'
                      )}>
                        {getStatusLabel(appt.status)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{appt.client?.name || 'Unknown Client'}</span>
                    </div>

                    {appt.service && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {appt.service.name}
                        {appt.service.price && ` - $${appt.service.price}`}
                      </div>
                    )}

                    {appt.notes && (
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        {appt.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={onAddAppointment}>
            <Plus className="h-4 w-4 mr-2" />
            Add Appointment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
