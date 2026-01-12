import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Project, Client } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format, isSameDay } from 'date-fns';
import { CalendarIcon, Clock, AlertTriangle, Send, CheckCircle } from 'lucide-react';
import { generateTimeOptions, formatArrivalWindow, CalendarEvent } from '@/lib/calendarUtils';
import { AddToCalendarButton } from './AddToCalendarButton';

interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  client?: Client;
  allProjects: Project[];
  onSchedule: (project: Project) => void;
}

export function ScheduleDialog({
  open,
  onOpenChange,
  project,
  client,
  allProjects,
  onSchedule,
}: ScheduleDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    project.scheduledDate || undefined
  );
  const [arrivalStart, setArrivalStart] = useState(project.arrivalWindowStart || '09:00');
  const [arrivalEnd, setArrivalEnd] = useState(project.arrivalWindowEnd || '11:00');
  const [notes, setNotes] = useState(project.scheduleNotes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const { toast } = useToast();

  const timeOptions = generateTimeOptions();

  // Find conflicts for selected date
  const conflicts = selectedDate
    ? allProjects.filter(
        (p) =>
          p.id !== project.id &&
          p.scheduledDate &&
          isSameDay(new Date(p.scheduledDate), selectedDate)
      )
    : [];

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedDate(project.scheduledDate || undefined);
      setArrivalStart(project.arrivalWindowStart || '09:00');
      setArrivalEnd(project.arrivalWindowEnd || '11:00');
      setNotes(project.scheduleNotes || '');
      setIsScheduled(false);
    }
  }, [open, project]);

  const handleSchedule = async (sendNotification: boolean) => {
    if (!selectedDate) {
      toast({
        title: 'Select a date',
        description: 'Please select a date for the scheduled work.',
        variant: 'destructive',
      });
      return;
    }

    if (!client?.email && sendNotification) {
      toast({
        title: 'No client email',
        description: 'Add a client email to send notifications.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedProject: Project = {
        ...project,
        scheduledDate: selectedDate,
        arrivalWindowStart: arrivalStart,
        arrivalWindowEnd: arrivalEnd,
        scheduleNotes: notes,
      };

      // Send notification if requested
      if (sendNotification && client?.email) {
        const { error } = await supabase.functions.invoke('send-schedule-notification', {
          body: {
            projectId: project.id,
            projectTitle: project.title,
            projectDescription: project.description,
            clientName: client.name,
            clientEmail: client.email,
            clientAddress: client.address,
            scheduledDate: format(selectedDate, 'yyyy-MM-dd'),
            arrivalWindowStart: arrivalStart,
            arrivalWindowEnd: arrivalEnd,
            scheduleNotes: notes,
          },
        });

        if (error) throw error;

        updatedProject.scheduleNotificationSentAt = new Date();
        toast({
          title: 'Schedule notification sent!',
          description: `Email sent to ${client.email}`,
        });
      }

      onSchedule(updatedProject);
      setIsScheduled(true);
    } catch (error: any) {
      console.error('Error scheduling project:', error);
      toast({
        title: 'Error scheduling',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Build calendar event for Add to Calendar
  const calendarEvent: CalendarEvent | null = selectedDate
    ? {
        title: `${project.title} - CEB Building`,
        description: `Project: ${project.title}\n${project.description || ''}\n\nClient: ${client?.name || 'N/A'}\nContact: 405-500-8224 / chad@cebbuilding.com`,
        location: client?.address || '',
        startDate: selectedDate,
        startTime: arrivalStart,
        endTime: arrivalEnd,
        organizer: {
          name: 'Chad Burum',
          email: 'chad@cebbuilding.com',
        },
      }
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            {isScheduled ? 'Project Scheduled!' : 'Schedule Project'}
          </DialogTitle>
          <DialogDescription>
            {isScheduled
              ? 'The project has been scheduled. Add it to your calendar below.'
              : `Schedule work for "${project.title}"`}
          </DialogDescription>
        </DialogHeader>

        {isScheduled ? (
          <div className="py-6 space-y-4">
            <div className="flex items-center gap-2 text-success">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Successfully scheduled!</span>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm">
                <span className="font-medium">Date:</span>{' '}
                {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </p>
              <p className="text-sm">
                <span className="font-medium">Arrival Window:</span>{' '}
                {formatArrivalWindow(arrivalStart, arrivalEnd)}
              </p>
              {client && (
                <p className="text-sm">
                  <span className="font-medium">Client:</span> {client.name}
                </p>
              )}
            </div>

            {calendarEvent && (
              <div className="flex justify-center pt-2">
                <AddToCalendarButton event={calendarEvent} size="default" />
              </div>
            )}

            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {/* Date Picker */}
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="rounded-md border"
                />
              </div>

              {/* Conflict Warning */}
              {conflicts.length > 0 && (
                <Alert variant="destructive" className="border-amber-500 bg-amber-500/10">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-700">
                    <strong>Heads up:</strong> You have {conflicts.length} other project
                    {conflicts.length > 1 ? 's' : ''} scheduled for this day.
                    <div className="mt-2 space-y-1">
                      {conflicts.map((p) => (
                        <div key={p.id} className="flex items-center gap-2 text-sm">
                          <Badge variant="outline" className="text-xs">
                            {p.arrivalWindowStart && p.arrivalWindowEnd
                              ? formatArrivalWindow(p.arrivalWindowStart, p.arrivalWindowEnd)
                              : 'No time set'}
                          </Badge>
                          <span>{p.title}</span>
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Arrival Window */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Arrival From
                  </Label>
                  <Select value={arrivalStart} onValueChange={setArrivalStart}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Arrival To
                  </Label>
                  <Select value={arrivalEnd} onValueChange={setArrivalEnd}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions..."
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleSchedule(false)}
                disabled={!selectedDate || isSubmitting}
              >
                Save Only
              </Button>
              <Button
                onClick={() => handleSchedule(true)}
                disabled={!selectedDate || isSubmitting || !client?.email}
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Scheduling...' : 'Schedule & Notify Client'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
