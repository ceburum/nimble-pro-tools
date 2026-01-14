import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Download, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday as isDateToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { cn } from '@/lib/utils';

interface AppointmentDisplay {
  id: string;
  date: Date;
  startTime: string;
  duration: number;
  status: string;
  client?: { name: string };
  service?: { name: string };
}

interface AppointmentCalendarViewProps {
  appointments: AppointmentDisplay[];
  onDayClick: (date: Date) => void;
  onAddAppointment: (date: Date) => void;
}

export function AppointmentCalendarView({ 
  appointments, 
  onDayClick,
  onAddAppointment,
}: AppointmentCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, AppointmentDisplay[]>();
    appointments.forEach(appt => {
      const dateKey = format(appt.date, 'yyyy-MM-dd');
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(appt);
    });
    return map;
  }, [appointments]);

  const getAppointmentsForDate = (date: Date): AppointmentDisplay[] => {
    return appointmentsByDate.get(format(date, 'yyyy-MM-dd')) || [];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/20 border-success text-success-foreground';
      case 'cancelled':
        return 'bg-destructive/20 border-destructive text-destructive';
      case 'no_show':
        return 'bg-muted border-muted-foreground text-muted-foreground';
      default:
        return 'bg-primary/20 border-primary text-primary';
    }
  };

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold ml-2">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
        </div>
        <Button variant="outline" size="sm" onClick={goToToday}>
          Today
        </Button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/50">
        {dayHeaders.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((date, index) => {
          const dayAppointments = getAppointmentsForDate(date);
          const isCurrentMonth = isSameMonth(date, currentMonth);
          const isToday = isDateToday(date);

          return (
            <div
              key={index}
              className={cn(
                'min-h-[100px] border-b border-r border-border p-1 relative group cursor-pointer transition-colors',
                !isCurrentMonth && 'bg-muted/30',
                isToday && 'bg-primary/5',
                'hover:bg-accent/50'
              )}
              onClick={() => onDayClick(date)}
            >
              {/* Date Number */}
              <div className="flex items-center justify-between mb-1">
                <span className={cn(
                  'text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full',
                  isToday && 'bg-primary text-primary-foreground',
                  !isCurrentMonth && 'text-muted-foreground'
                )}>
                  {format(date, 'd')}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddAppointment(date);
                  }}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              {/* Appointments (max 3 shown) */}
              <div className="space-y-0.5">
                {dayAppointments.slice(0, 3).map(appt => (
                  <div
                    key={appt.id}
                    className={cn(
                      'text-xs px-1 py-0.5 rounded border truncate',
                      getStatusColor(appt.status)
                    )}
                    title={`${appt.startTime} - ${appt.client?.name || 'Client'}`}
                  >
                    <span className="font-medium">{appt.startTime}</span>
                    {' '}
                    <span className="opacity-80">{appt.client?.name || 'Client'}</span>
                  </div>
                ))}
                {dayAppointments.length > 3 && (
                  <div className="text-xs text-muted-foreground text-center">
                    +{dayAppointments.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
