import { useState, useMemo } from 'react';
import { Project, Client } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatArrivalWindow, downloadIcsFile, CalendarEvent } from '@/lib/calendarUtils';

interface CalendarViewProps {
  projects: Project[];
  clients: Client[];
  onDayClick: (date: Date, projects: Project[]) => void;
}

const statusColors: Record<string, string> = {
  accepted: 'bg-success',
  in_progress: 'bg-primary',
  completed: 'bg-amber-500',
  invoiced: 'bg-muted-foreground',
};

export function CalendarView({ projects, clients, onDayClick }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get scheduled projects
  const scheduledProjects = useMemo(
    () => projects.filter((p) => p.scheduledDate),
    [projects]
  );

  // Calculate calendar days (include padding for week alignment)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // Group projects by date
  const projectsByDate = useMemo(() => {
    const map = new Map<string, Project[]>();
    scheduledProjects.forEach((project) => {
      if (project.scheduledDate) {
        const key = format(new Date(project.scheduledDate), 'yyyy-MM-dd');
        const existing = map.get(key) || [];
        map.set(key, [...existing, project]);
      }
    });
    return map;
  }, [scheduledProjects]);

  const getProjectsForDate = (date: Date) => {
    const key = format(date, 'yyyy-MM-dd');
    return projectsByDate.get(key) || [];
  };

  const getClientName = (clientId: string) => {
    return clients.find((c) => c.id === clientId)?.name || 'Unknown';
  };

  const handleExportDay = (date: Date, dayProjects: Project[]) => {
    dayProjects.forEach((project) => {
      const client = clients.find((c) => c.id === project.clientId);
      const event: CalendarEvent = {
        title: `${project.title} - CEB Building`,
        description: `Project: ${project.title}\n${project.description || ''}\n\nClient: ${client?.name || 'N/A'}\nContact: 405-500-8224`,
        location: client?.address || '',
        startDate: new Date(project.scheduledDate!),
        startTime: project.arrivalWindowStart || '09:00',
        endTime: project.arrivalWindowEnd || '11:00',
      };
      downloadIcsFile(event, `${project.title.replace(/[^a-z0-9]/gi, '_')}.ics`);
    });
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm">
      {/* Month Navigation */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, idx) => {
          const dayProjects = getProjectsForDate(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={idx}
              className={cn(
                'min-h-[100px] p-1 border-b border-r border-border last:border-r-0 [&:nth-child(7n)]:border-r-0 cursor-pointer hover:bg-muted/50 transition-colors',
                !isCurrentMonth && 'bg-muted/30'
              )}
              onClick={() => onDayClick(day, dayProjects)}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full',
                    isCurrentDay && 'bg-primary text-primary-foreground',
                    !isCurrentMonth && 'text-muted-foreground'
                  )}
                >
                  {format(day, 'd')}
                </span>
                {dayProjects.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportDay(day, dayProjects);
                    }}
                    title="Export day to calendar"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Project Indicators */}
              <div className="space-y-1">
                {dayProjects.slice(0, 3).map((project) => (
                  <div
                    key={project.id}
                    className={cn(
                      'text-xs px-1.5 py-0.5 rounded truncate text-white',
                      statusColors[project.status] || 'bg-primary'
                    )}
                    title={`${project.title} - ${getClientName(project.clientId)}`}
                  >
                    {project.arrivalWindowStart && (
                      <span className="font-medium mr-1">
                        {project.arrivalWindowStart.split(':')[0]}
                        {Number(project.arrivalWindowStart.split(':')[0]) >= 12 ? 'p' : 'a'}
                      </span>
                    )}
                    {project.title}
                  </div>
                ))}
                {dayProjects.length > 3 && (
                  <div className="text-xs text-muted-foreground px-1">
                    +{dayProjects.length - 3} more
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
