import { Link } from 'react-router-dom';
import { Project, Client } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Clock, MapPin, ArrowRight, CalendarDays } from 'lucide-react';
import { format, isToday, isTomorrow, startOfToday, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatArrivalWindow } from '@/lib/calendarUtils';

interface TodayScheduleProps {
  projects: Project[];
  clients: Client[];
}

export function TodaySchedule({ projects, clients }: TodayScheduleProps) {
  const today = startOfToday();

  // Get today's and tomorrow's scheduled projects
  const todayProjects = projects
    .filter((p) => p.scheduledDate && isToday(new Date(p.scheduledDate)))
    .sort((a, b) => {
      const timeA = a.arrivalWindowStart || '23:59';
      const timeB = b.arrivalWindowStart || '23:59';
      return timeA.localeCompare(timeB);
    });

  const tomorrowProjects = projects
    .filter((p) => p.scheduledDate && isTomorrow(new Date(p.scheduledDate)))
    .sort((a, b) => {
      const timeA = a.arrivalWindowStart || '23:59';
      const timeB = b.arrivalWindowStart || '23:59';
      return timeA.localeCompare(timeB);
    });

  // Count upcoming (next 7 days)
  const upcomingCount = projects.filter((p) => {
    if (!p.scheduledDate) return false;
    const date = new Date(p.scheduledDate);
    return date >= today && date <= addDays(today, 7);
  }).length;

  const getClientName = (clientId: string) => {
    return clients.find((c) => c.id === clientId)?.name || 'Unknown Client';
  };

  const getClientAddress = (clientId: string) => {
    return clients.find((c) => c.id === clientId)?.address || '';
  };

  const renderProjectCard = (project: Project, showDate = false) => (
    <div
      key={project.id}
      className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
    >
      <div className="flex-shrink-0 w-12 text-center">
        {project.arrivalWindowStart ? (
          <div className="text-sm font-bold text-primary">
            {project.arrivalWindowStart.split(':')[0]}
            <span className="text-xs text-muted-foreground">
              {Number(project.arrivalWindowStart.split(':')[0]) >= 12 ? 'PM' : 'AM'}
            </span>
          </div>
        ) : (
          <Clock className="h-4 w-4 mx-auto text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-foreground truncate">{project.title}</p>
        <p className="text-xs text-muted-foreground truncate">
          {getClientName(project.clientId)}
        </p>
        {project.arrivalWindowStart && project.arrivalWindowEnd && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatArrivalWindow(project.arrivalWindowStart, project.arrivalWindowEnd)}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Today's Schedule
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {upcomingCount} this week
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {todayProjects.length === 0 && tomorrowProjects.length === 0 ? (
          <div className="text-center py-6">
            <CalendarDays className="h-10 w-10 mx-auto text-muted-foreground mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">No jobs scheduled</p>
            <p className="text-xs text-muted-foreground">for today or tomorrow</p>
          </div>
        ) : (
          <>
            {/* Today's Projects */}
            {todayProjects.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Today
                </h4>
                <div className="space-y-2">
                  {todayProjects.slice(0, 3).map((p) => renderProjectCard(p))}
                  {todayProjects.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{todayProjects.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Tomorrow's Projects */}
            {tomorrowProjects.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Tomorrow
                </h4>
                <div className="space-y-2">
                  {tomorrowProjects.slice(0, 2).map((p) => renderProjectCard(p))}
                  {tomorrowProjects.length > 2 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{tomorrowProjects.length - 2} more
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        <Link to="/scheduling">
          <Button variant="outline" className="w-full mt-2" size="sm">
            View Full Calendar
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
