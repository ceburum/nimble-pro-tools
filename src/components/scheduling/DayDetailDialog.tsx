import { Project, Client } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import {
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  Download,
  FolderKanban,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatArrivalWindow, downloadIcsFile, CalendarEvent } from '@/lib/calendarUtils';
import { AddToCalendarButton } from './AddToCalendarButton';

interface DayDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  projects: Project[];
  clients: Client[];
  onViewProject: (project: Project) => void;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  accepted: { label: 'Accepted', className: 'bg-success/10 text-success' },
  in_progress: { label: 'In Progress', className: 'bg-primary/10 text-primary' },
  completed: { label: 'Completed', className: 'bg-amber-500/10 text-amber-600' },
  invoiced: { label: 'Invoiced', className: 'bg-muted text-muted-foreground' },
};

export function DayDetailDialog({
  open,
  onOpenChange,
  date,
  projects,
  clients,
  onViewProject,
}: DayDetailDialogProps) {
  const getClient = (clientId: string) => clients.find((c) => c.id === clientId);

  const handleExportAll = () => {
    projects.forEach((project) => {
      const client = getClient(project.clientId);
      const event: CalendarEvent = {
        title: `${project.title} - CEB Building`,
        description: `Project: ${project.title}\n${project.description || ''}\n\nClient: ${client?.name || 'N/A'}\nContact: 405-500-8224`,
        location: client?.address || '',
        startDate: new Date(project.scheduledDate!),
        startTime: project.arrivalWindowStart || '09:00',
        endTime: project.arrivalWindowEnd || '11:00',
      };
      downloadIcsFile(event);
    });
  };

  // Sort projects by arrival time
  const sortedProjects = [...projects].sort((a, b) => {
    const timeA = a.arrivalWindowStart || '23:59';
    const timeB = b.arrivalWindowStart || '23:59';
    return timeA.localeCompare(timeB);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {format(date, 'EEEE, MMMM d, yyyy')}
          </DialogTitle>
          <DialogDescription>
            {projects.length === 0
              ? 'No projects scheduled for this day'
              : `${projects.length} project${projects.length > 1 ? 's' : ''} scheduled`}
          </DialogDescription>
        </DialogHeader>

        {projects.length > 0 && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handleExportAll}>
              <Download className="h-4 w-4 mr-2" />
              Export All to Calendar
            </Button>
          </div>
        )}

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4 py-2">
            {sortedProjects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No scheduled projects</p>
                <p className="text-sm">Click a day to view its schedule</p>
              </div>
            ) : (
              sortedProjects.map((project) => {
                const client = getClient(project.clientId);
                const status = statusConfig[project.status] || statusConfig.accepted;
                
                const calendarEvent: CalendarEvent = {
                  title: `${project.title} - CEB Building`,
                  description: `Project: ${project.title}\n${project.description || ''}\n\nClient: ${client?.name || 'N/A'}\nContact: 405-500-8224`,
                  location: client?.address || '',
                  startDate: date,
                  startTime: project.arrivalWindowStart || '09:00',
                  endTime: project.arrivalWindowEnd || '11:00',
                };

                return (
                  <div
                    key={project.id}
                    className="bg-muted/50 rounded-lg p-4 space-y-3"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-foreground">{project.title}</h3>
                        <Badge className={cn('mt-1', status.className)}>
                          {status.label}
                        </Badge>
                      </div>
                      {project.arrivalWindowStart && project.arrivalWindowEnd && (
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <Clock className="h-3.5 w-3.5 text-primary" />
                            {formatArrivalWindow(
                              project.arrivalWindowStart,
                              project.arrivalWindowEnd
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Client Info */}
                    {client && (
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{client.name}</span>
                        </div>
                        {client.address && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">{client.address}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-4">
                          {client.phone && (
                            <a
                              href={`tel:${client.phone}`}
                              className="flex items-center gap-1 text-primary hover:underline"
                            >
                              <Phone className="h-3.5 w-3.5" />
                              {client.phone}
                            </a>
                          )}
                          {client.email && (
                            <a
                              href={`mailto:${client.email}`}
                              className="flex items-center gap-1 text-primary hover:underline"
                            >
                              <Mail className="h-3.5 w-3.5" />
                              Email
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Schedule Notes */}
                    {project.scheduleNotes && (
                      <p className="text-sm text-muted-foreground italic">
                        "{project.scheduleNotes}"
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onViewProject(project);
                          onOpenChange(false);
                        }}
                      >
                        <FolderKanban className="h-4 w-4 mr-1" />
                        View Project
                      </Button>
                      <AddToCalendarButton event={calendarEvent} size="sm" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
