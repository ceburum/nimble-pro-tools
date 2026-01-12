import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { CalendarView } from '@/components/scheduling/CalendarView';
import { DayDetailDialog } from '@/components/scheduling/DayDetailDialog';
import { ScheduleDialog } from '@/components/scheduling/ScheduleDialog';
import { ProjectDetailDialog } from '@/components/projects/ProjectDetailDialog';
import { useProjects } from '@/hooks/useProjects';
import { useClients } from '@/hooks/useClients';
import { useInvoices } from '@/hooks/useInvoices';
import { Project } from '@/types';
import { StatCard } from '@/components/dashboard/StatCard';
import { Calendar, CalendarCheck, CalendarClock, CalendarDays } from 'lucide-react';
import { isToday, startOfToday, addDays, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

export default function SchedulingPro() {
  const navigate = useNavigate();
  const { projects, loading, updateProject } = useProjects();
  const { clients } = useClients();
  const { addInvoice } = useInvoices();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDayProjects, setSelectedDayProjects] = useState<Project[]>([]);
  const [dayDetailOpen, setDayDetailOpen] = useState(false);

  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [projectToSchedule, setProjectToSchedule] = useState<Project | null>(null);

  const [projectDetailOpen, setProjectDetailOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Stats calculations
  const today = startOfToday();
  const thisWeekStart = startOfWeek(today);
  const thisWeekEnd = endOfWeek(today);

  const stats = useMemo(() => {
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

  const handleDayClick = (date: Date, dayProjects: Project[]) => {
    setSelectedDate(date);
    setSelectedDayProjects(dayProjects);
    setDayDetailOpen(true);
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
    // Navigate to invoices with pre-filled data
    navigate('/invoices', { state: { openNewInvoice: true, prefillProject: project } });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const getClient = (clientId: string) => clients.find((c) => c.id === clientId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scheduling Pro"
        description="Manage your project schedule and appointments"
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Jobs"
          value={stats.todayCount}
          icon={Calendar}
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
          title="Need Scheduling"
          value={stats.unscheduledCount}
          icon={CalendarCheck}
          variant={stats.unscheduledCount > 0 ? 'warning' : 'success'}
        />
      </div>

      {/* Calendar */}
      <CalendarView
        projects={projects}
        clients={clients}
        onDayClick={handleDayClick}
      />

      {/* Day Detail Dialog */}
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
    </div>
  );
}
