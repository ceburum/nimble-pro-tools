import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, CalendarCheck, CalendarClock, CalendarDays, Plus, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/dashboard/StatCard';
import { FeatureNotice } from '@/components/ui/feature-notice';
import { Button } from '@/components/ui/button';
import { AppointmentDialog } from '@/components/scheduling/AppointmentDialog';
import { AppointmentCalendarView } from '@/components/scheduling/AppointmentCalendarView';
import { AppointmentDayDialog } from '@/components/scheduling/AppointmentDayDialog';
import { useAppointments } from '@/hooks/useAppointments';
import { useClients } from '@/hooks/useClients';
import { useServices } from '@/hooks/useServices';
import { useAppState } from '@/hooks/useAppState';
import { AppState } from '@/lib/appState';
import { toast } from 'sonner';

export default function Appointments() {
  const navigate = useNavigate();
  const { 
    appointments, 
    loading, 
    stats, 
    canAccessAppointments,
    isStationaryBusiness,
    addAppointment,
    getAppointmentsForDate,
    hasConflict,
  } = useAppointments();
  const { clients } = useClients();
  const { services } = useServices();
  const { state, setupProgress } = useAppState();

  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayDialogOpen, setDayDialogOpen] = useState(false);

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setDayDialogOpen(true);
  };

  const handleAddAppointment = (date?: Date) => {
    if (date) {
      setSelectedDate(date);
    }
    setAppointmentDialogOpen(true);
  };

  const handleSaveAppointment = async (data: {
    clientId: string;
    serviceId?: string;
    date: Date;
    startTime: string;
    duration: number;
    notes?: string;
  }) => {
    // Check for conflicts
    if (hasConflict(data.date, data.startTime, data.duration)) {
      toast.error('Time slot conflict', { 
        description: 'This time overlaps with another appointment.' 
      });
      return;
    }

    // Find service details if selected
    const service = data.serviceId ? services.find(s => s.id === data.serviceId) : undefined;

    const result = await addAppointment({
      ...data,
      createProject: true, // Auto-create project for invoicing
      serviceName: service?.name,
      servicePrice: service?.price,
    });

    if (result) {
      toast.success('Appointment booked!');
      setAppointmentDialogOpen(false);
    } else {
      toast.error('Failed to book appointment');
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If not a stationary business, show a notice
  if (!isStationaryBusiness) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Appointments"
          description="Manage your appointment schedule"
        />
        <FeatureNotice
          icon={<CalendarIcon className="h-8 w-8 text-primary" />}
          title="Appointments"
          description="Appointment scheduling is designed for stationary businesses where clients come to you."
          features={[
            'For mobile/job-based businesses, use the Scheduling Pro feature',
            'Go to your Business Settings to change your business type',
          ]}
          className="max-w-2xl mx-auto"
        />
      </div>
    );
  }

  // If can't access appointments, show upgrade notice
  if (!canAccessAppointments) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Appointments"
          description="Manage your appointment schedule"
        />
        <FeatureNotice
          icon={<CalendarIcon className="h-8 w-8 text-primary" />}
          title="Complete Setup"
          description="Complete your business setup to start booking appointments."
          className="max-w-2xl mx-auto"
        />
      </div>
    );
  }

  // Check if there are any clients
  const hasClients = clients.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointments"
        description="Manage your appointment schedule"
        action={
          <Button onClick={() => handleAddAppointment()} disabled={!hasClients}>
            <Plus className="h-4 w-4 mr-2" />
            Book Appointment
          </Button>
        }
      />

      {/* No clients notice */}
      {!hasClients && (
        <div className="rounded-lg border border-border bg-muted/50 p-4 text-center">
          <p className="text-muted-foreground mb-2">
            Add a client to start booking appointments
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate('/clients')}>
            Add Client
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Appointments"
          value={stats.todayCount}
          icon={CalendarIcon}
          variant={stats.todayCount > 0 ? 'primary' : 'default'}
        />
        <StatCard
          title="This Week"
          value={stats.thisWeekCount}
          icon={CalendarDays}
          variant="default"
        />
        <StatCard
          title="Upcoming"
          value={stats.upcomingCount}
          icon={CalendarClock}
          variant="default"
        />
        <StatCard
          title="Total Booked"
          value={stats.totalCount}
          icon={CalendarCheck}
          variant="success"
        />
      </div>

      {/* Calendar View */}
      <AppointmentCalendarView
        appointments={appointments}
        onDayClick={handleDayClick}
        onAddAppointment={handleAddAppointment}
      />

      {/* Appointment Dialog */}
      <AppointmentDialog
        open={appointmentDialogOpen}
        onOpenChange={setAppointmentDialogOpen}
        clients={clients}
        services={services}
        selectedDate={selectedDate ?? undefined}
        onSave={handleSaveAppointment}
      />

      {/* Day Detail Dialog */}
      {selectedDate && (
        <AppointmentDayDialog
          open={dayDialogOpen}
          onOpenChange={setDayDialogOpen}
          date={selectedDate}
          appointments={getAppointmentsForDate(selectedDate)}
          onAddAppointment={() => handleAddAppointment(selectedDate)}
        />
      )}
    </div>
  );
}
