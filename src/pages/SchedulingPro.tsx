import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, CalendarCheck, CalendarClock, CalendarDays, Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { CalendarView } from '@/components/scheduling/CalendarView';
import { AppointmentCalendarView } from '@/components/scheduling/AppointmentCalendarView';
import { DayDetailDialog } from '@/components/scheduling/DayDetailDialog';
import { AppointmentDayDialog } from '@/components/scheduling/AppointmentDayDialog';
import { ScheduleDialog } from '@/components/scheduling/ScheduleDialog';
import { BusinessTypeSetupDialog } from '@/components/scheduling/BusinessTypeSetupDialog';
import { ProjectDetailDialog } from '@/components/projects/ProjectDetailDialog';
import { AppointmentDialog } from '@/components/scheduling/AppointmentDialog';
import { QuickAppointmentDialog } from '@/components/scheduling/QuickAppointmentDialog';
import { FeatureNotice } from '@/components/ui/feature-notice';
import { Button } from '@/components/ui/button';
import { useProjects } from '@/hooks/useProjects';
import { useClients } from '@/hooks/useClients';
import { useInvoices } from '@/hooks/useInvoices';
import { useAppointments } from '@/hooks/useAppointments';
import { useServices } from '@/hooks/useServices';
import { useSchedulingPro } from '@/hooks/useSchedulingPro';
import { Project, LineItem } from '@/types';
import { StatCard } from '@/components/dashboard/StatCard';
import { isToday, startOfToday, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { toast } from 'sonner';

export default function SchedulingPro() {
  const navigate = useNavigate();
  const { projects, loading: projectsLoading, updateProject } = useProjects();
  const { clients } = useClients();
  const { addInvoice } = useInvoices();
  const { 
    appointments, 
    loading: appointmentsLoading, 
    stats: appointmentStats,
    isStationaryBusiness,
    addAppointment,
    updateAppointment,
    getAppointmentsForDate,
    hasConflict,
  } = useAppointments();
  const { services } = useServices();
  const { isEnabled, businessType, loading: featureLoading, enableSchedulingPro, setBusinessType } = useSchedulingPro();

  const [businessTypeDialogOpen, setBusinessTypeDialogOpen] = useState(false);

  // Mobile/Project state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDayProjects, setSelectedDayProjects] = useState<Project[]>([]);
  const [dayDetailOpen, setDayDetailOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [projectToSchedule, setProjectToSchedule] = useState<Project | null>(null);
  const [projectDetailOpen, setProjectDetailOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Stationary/Appointment state
  const [appointmentDayDialogOpen, setAppointmentDayDialogOpen] = useState(false);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [quickAppointmentDialogOpen, setQuickAppointmentDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<typeof appointments[0] | null>(null);

  // Stats calculations for projects (mobile)
  const today = startOfToday();
  const thisWeekStart = startOfWeek(today);
  const thisWeekEnd = endOfWeek(today);

  const projectStats = useMemo(() => {
    const scheduled = projects.filter((p) => p.scheduledDate);
    const todayJobs = scheduled.filter((p) => isToday(new Date(p.scheduledDate!)));
    const thisWeekJobs = scheduled.filter((p) =>
      isWithinInterval(new Date(p.scheduledDate!), { start: thisWeekStart, end: thisWeekEnd })
    );
    const upcomingJobs = scheduled.filter((p) => new Date(p.scheduledDate!) >= today);
    const unscheduled = projects.filter(
      (p) =>
        !p.scheduledDate &&
        (p.status === 'accepted' || p.status === 'in_progress')
    );

    return {
      todayCount: todayJobs.length,
      thisWeekCount: thisWeekJobs.length,
      upcomingCount: upcomingJobs.length,
      unscheduledCount: unscheduled.length,
    };
  }, [projects, today, thisWeekStart, thisWeekEnd]);

  // Use appropriate stats based on business type
  const stats = isStationaryBusiness ? {
    todayCount: appointmentStats.todayCount,
    thisWeekCount: appointmentStats.thisWeekCount,
    upcomingCount: appointmentStats.upcomingCount,
    unscheduledCount: 0, // Appointments are always scheduled
  } : projectStats;

  // Mobile/Project handlers
  const handleDayClick = (date: Date, dayProjects: Project[]) => {
    setSelectedDate(date);
    if (isStationaryBusiness) {
      setAppointmentDayDialogOpen(true);
    } else {
      setSelectedDayProjects(dayProjects);
      setDayDetailOpen(true);
    }
  };

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
    setProjectDetailOpen(true);
  };

  const handleScheduleProject = (project: Project) => {
    setProjectToSchedule(project);
    setScheduleDialogOpen(true);
  };

  const handleSaveSchedule = async (updatedProject: Project) => {
    await updateProject(updatedProject);
  };

  const handleUpdateProject = async (updatedProject: Project) => {
    await updateProject(updatedProject);
    setSelectedProject(updatedProject);
  };

  const handleCreateInvoice = (project: Project) => {
    navigate('/invoices', { state: { openNewInvoice: true, prefillProject: project } });
  };

  // Stationary/Appointment handlers
  const handleAppointmentDayClick = (date: Date) => {
    setSelectedDate(date);
    setAppointmentDayDialogOpen(true);
  };

  const handleAddAppointment = (date?: Date) => {
    if (date) {
      setSelectedDate(date);
    }
    setEditingAppointment(null);
    setQuickAppointmentDialogOpen(true);
  };

  const handleViewAppointment = (appointment: typeof appointments[0]) => {
    setEditingAppointment(appointment);
    setSelectedDate(appointment.date);
    setAppointmentDialogOpen(true);
    setAppointmentDayDialogOpen(false);
  };

  const handleSaveAppointment = async (data: {
    clientId: string;
    serviceId?: string;
    date: Date;
    startTime: string;
    duration: number;
    notes?: string;
  }) => {
    if (hasConflict(data.date, data.startTime, data.duration)) {
      toast.error('Time slot conflict', { 
        description: 'This time overlaps with another appointment.' 
      });
      return;
    }

    const service = data.serviceId ? services.find(s => s.id === data.serviceId) : undefined;

    const result = await addAppointment({
      ...data,
      createProject: true,
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

  const handleUpdateAppointment = async (
    appointmentId: string,
    data: {
      clientId: string;
      serviceId?: string;
      date: Date;
      startTime: string;
      duration: number;
      notes?: string;
    }
  ) => {
    const success = updateAppointment(appointmentId, {
      clientId: data.clientId,
      serviceId: data.serviceId,
      date: data.date,
      startTime: data.startTime,
      duration: data.duration,
      notes: data.notes,
    });

    if (success) {
      toast.success('Appointment updated!');
      setAppointmentDialogOpen(false);
      setEditingAppointment(null);
    } else {
      toast.error('Failed to update appointment');
    }
  };

  // Quick appointment handler with auto-invoice
  const handleQuickAppointmentSave = async (data: {
    clientId: string;
    serviceId?: string;
    date: Date;
    startTime: string;
    duration: number;
    notes?: string;
    items: LineItem[];
  }): Promise<{ appointmentId: string; invoiceId?: string; paymentToken?: string } | null> => {
    if (hasConflict(data.date, data.startTime, data.duration)) {
      toast.error('Time slot conflict');
      return null;
    }

    const service = data.serviceId ? services.find(s => s.id === data.serviceId) : undefined;

    const result = await addAppointment({
      ...data,
      createProject: true,
      serviceName: service?.name,
      servicePrice: service?.price,
    });

    if (result) {
      const appointmentId = typeof result === 'string' ? result : result.id;
      return { appointmentId };
    }
    return null;
  };

  const handleEnableSchedulingPro = async () => {
    const success = await enableSchedulingPro();
    if (success) {
      toast.success('Scheduling Pro enabled!');
    } else {
      toast.error('Failed to enable Scheduling Pro');
    }
    return success;
  };

  // Show loading state
  const loading = featureLoading || projectsLoading || appointmentsLoading;
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const getClient = (clientId: string) => clients.find((c) => c.id === clientId);

  // Dynamic labels based on business type
  const entityLabel = isStationaryBusiness ? 'Appointments' : 'Jobs';
  const singleLabel = isStationaryBusiness ? 'Appointment' : 'Job';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scheduling Pro"
        description={isStationaryBusiness 
          ? "Manage your appointment calendar" 
          : "Manage your project schedule and jobs"
        }
        action={isEnabled && businessType && isStationaryBusiness ? (
          <Button onClick={() => handleAddAppointment()}>
            <Plus className="h-4 w-4 mr-2" />
            Book Appointment
          </Button>
        ) : undefined}
      />

      {/* Show inline notice if feature is not enabled */}
      {!isEnabled && (
        <FeatureNotice
          icon={<CalendarIcon className="h-8 w-8 text-primary" />}
          title="Scheduling Pro"
          description={isStationaryBusiness 
            ? "Professional calendar management for your appointment-based business"
            : "Professional calendar management for your contracting business"
          }
          features={isStationaryBusiness ? [
            'Visual calendar with appointment booking',
            'Time slot conflict detection',
            'Client notifications and reminders',
            'Add to Calendar integration (Google, Apple, Outlook)',
            "Today's schedule dashboard widget",
          ] : [
            'Visual calendar with drag-and-drop scheduling',
            'Arrival time windows for client expectations',
            'Branded email notifications to clients',
            'Add to Calendar integration (Google, Apple, Outlook)',
            'Conflict detection for overlapping jobs',
            "Today's schedule dashboard widget",
          ]}
          onEnable={handleEnableSchedulingPro}
          className="max-w-2xl mx-auto"
        />
      )}

      {/* Business Type Setup - shown once when enabled but no type selected */}
      {isEnabled && !businessType && (
        <BusinessTypeSetupDialog
          open={!businessType}
          onOpenChange={() => {}}
          onSelectType={setBusinessType}
        />
      )}

      {/* Show content when enabled and business type is set */}
      {isEnabled && businessType && (
        <>
          {/* Stats - labels adapt based on business type */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title={`Today's ${entityLabel}`}
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
            {!isStationaryBusiness && (
              <StatCard
                title="Need Scheduling"
                value={stats.unscheduledCount}
                icon={CalendarCheck}
                variant={stats.unscheduledCount > 0 ? 'warning' : 'success'}
              />
            )}
            {isStationaryBusiness && (
              <StatCard
                title="Total Booked"
                value={appointmentStats.totalCount}
                icon={CalendarCheck}
                variant="success"
              />
            )}
          </div>

          {/* Calendar - different views based on business type */}
          {isStationaryBusiness ? (
            <AppointmentCalendarView
              appointments={appointments}
              onDayClick={handleAppointmentDayClick}
              onAddAppointment={handleAddAppointment}
            />
          ) : (
            <CalendarView
              projects={projects}
              clients={clients}
              onDayClick={handleDayClick}
            />
          )}

          {/* Mobile/Project Dialogs */}
          {!isStationaryBusiness && (
            <>
              {/* Day Detail Dialog for Projects */}
              {selectedDate && (
                <DayDetailDialog
                  open={dayDetailOpen}
                  onOpenChange={setDayDetailOpen}
                  date={selectedDate}
                  projects={selectedDayProjects}
                  clients={clients}
                  onViewProject={handleViewProject}
                />
              )}

              {/* Schedule Dialog */}
              {projectToSchedule && (
                <ScheduleDialog
                  open={scheduleDialogOpen}
                  onOpenChange={setScheduleDialogOpen}
                  project={projectToSchedule}
                  client={getClient(projectToSchedule.clientId)}
                  allProjects={projects}
                  onSchedule={handleSaveSchedule}
                />
              )}

              {/* Project Detail Dialog */}
              {selectedProject && (
                <ProjectDetailDialog
                  open={projectDetailOpen}
                  onOpenChange={setProjectDetailOpen}
                  project={selectedProject}
                  client={getClient(selectedProject.clientId)}
                  onUpdate={handleUpdateProject}
                  onDelete={() => {}}
                  onCreateInvoice={handleCreateInvoice}
                />
              )}
            </>
          )}

          {/* Stationary/Appointment Dialogs */}
          {isStationaryBusiness && (
            <>
              {/* Appointment Day Dialog */}
              {selectedDate && (
                <AppointmentDayDialog
                  open={appointmentDayDialogOpen}
                  onOpenChange={setAppointmentDayDialogOpen}
                  date={selectedDate}
                  appointments={getAppointmentsForDate(selectedDate)}
                  onAddAppointment={() => handleAddAppointment(selectedDate)}
                  onViewAppointment={handleViewAppointment}
                />
              )}

              {/* Appointment Edit Dialog */}
              <AppointmentDialog
                open={appointmentDialogOpen}
                onOpenChange={(open) => {
                  setAppointmentDialogOpen(open);
                  if (!open) {
                    setEditingAppointment(null);
                  }
                }}
                clients={clients}
                services={services}
                selectedDate={selectedDate ?? undefined}
                editingAppointment={editingAppointment}
                onSave={handleSaveAppointment}
                onUpdate={handleUpdateAppointment}
              />

              {/* Quick Appointment Dialog with Service Selection */}
              <QuickAppointmentDialog
                open={quickAppointmentDialogOpen}
                onOpenChange={setQuickAppointmentDialogOpen}
                clients={clients}
                services={services}
                selectedDate={selectedDate ?? undefined}
                onSave={handleQuickAppointmentSave}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
