import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ArrowRight, CalendarDays, User } from 'lucide-react';
import { format, isToday, isTomorrow, startOfToday, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface Appointment {
  id: string;
  clientId: string;
  date: Date;
  startTime: string;
  duration: number;
  notes?: string;
  status: string;
  client?: {
    name: string;
  };
}

interface UpcomingAppointmentsProps {
  appointments: Appointment[];
}

export function UpcomingAppointments({ appointments }: UpcomingAppointmentsProps) {
  const today = startOfToday();

  // Get scheduled appointments only
  const scheduledAppointments = appointments.filter(a => a.status === 'scheduled');

  // Get today's and tomorrow's appointments
  const todayAppointments = scheduledAppointments
    .filter((a) => isToday(new Date(a.date)))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const tomorrowAppointments = scheduledAppointments
    .filter((a) => isTomorrow(new Date(a.date)))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Count upcoming (next 7 days)
  const upcomingCount = scheduledAppointments.filter((a) => {
    const date = new Date(a.date);
    return date >= today && date <= addDays(today, 7);
  }).length;

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return { hours: displayHours.toString(), period };
  };

  const renderAppointmentCard = (appointment: Appointment) => {
    const { hours, period } = formatTime(appointment.startTime);
    
    return (
      <div
        key={appointment.id}
        className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
      >
        <div className="flex-shrink-0 w-12 text-center">
          <div className="text-sm font-bold text-primary">
            {hours}
            <span className="text-xs text-muted-foreground">{period}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground truncate flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            {appointment.client?.name || 'Unknown Client'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {appointment.duration} min
          </p>
        </div>
      </div>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Upcoming Appointments
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {upcomingCount} this week
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {todayAppointments.length === 0 && tomorrowAppointments.length === 0 ? (
          <div className="text-center py-6">
            <CalendarDays className="h-10 w-10 mx-auto text-muted-foreground mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">No appointments scheduled</p>
            <p className="text-xs text-muted-foreground">for today or tomorrow</p>
          </div>
        ) : (
          <>
            {/* Today's Appointments */}
            {todayAppointments.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Today
                </h4>
                <div className="space-y-2">
                  {todayAppointments.slice(0, 3).map(renderAppointmentCard)}
                  {todayAppointments.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{todayAppointments.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Tomorrow's Appointments */}
            {tomorrowAppointments.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Tomorrow
                </h4>
                <div className="space-y-2">
                  {tomorrowAppointments.slice(0, 2).map(renderAppointmentCard)}
                  {tomorrowAppointments.length > 2 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{tomorrowAppointments.length - 2} more
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        <Link to="/appointments">
          <Button variant="outline" className="w-full mt-2" size="sm">
            View All Appointments
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
