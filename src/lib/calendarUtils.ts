import { format, addHours } from 'date-fns';

export interface CalendarEvent {
  title: string;
  description: string;
  location: string;
  startDate: Date;
  startTime: string; // "09:00" format
  endTime: string;   // "11:00" format
  organizer?: {
    name: string;
    email: string;
  };
}

/**
 * Format time string "09:00" to Date object for a given date
 */
function timeToDate(date: Date, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

/**
 * Format date for ICS file (YYYYMMDDTHHMMSS format)
 */
function formatIcsDate(date: Date): string {
  return format(date, "yyyyMMdd'T'HHmmss");
}

/**
 * Generate ICS file content for a calendar event
 */
export function generateIcsContent(event: CalendarEvent): string {
  const startDateTime = timeToDate(event.startDate, event.startTime);
  const endDateTime = timeToDate(event.startDate, event.endTime);
  
  // Create reminder 1 day before
  const reminderDayBefore = `BEGIN:VALARM
TRIGGER:-P1D
ACTION:DISPLAY
DESCRIPTION:Reminder: ${event.title} is tomorrow
END:VALARM`;

  // Create reminder 1 hour before
  const reminderHourBefore = `BEGIN:VALARM
TRIGGER:-PT1H
ACTION:DISPLAY
DESCRIPTION:Reminder: ${event.title} is in 1 hour
END:VALARM`;

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//CEB Building//Scheduling Pro//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
DTSTART:${formatIcsDate(startDateTime)}
DTEND:${formatIcsDate(endDateTime)}
SUMMARY:${event.title}
DESCRIPTION:${event.description.replace(/\n/g, '\\n')}
LOCATION:${event.location}
STATUS:CONFIRMED
${event.organizer ? `ORGANIZER;CN=${event.organizer.name}:mailto:${event.organizer.email}` : ''}
${reminderDayBefore}
${reminderHourBefore}
END:VEVENT
END:VCALENDAR`;

  return icsContent;
}

/**
 * Generate Google Calendar URL for adding an event
 */
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const startDateTime = timeToDate(event.startDate, event.startTime);
  const endDateTime = timeToDate(event.startDate, event.endTime);
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${format(startDateTime, "yyyyMMdd'T'HHmmss")}/${format(endDateTime, "yyyyMMdd'T'HHmmss")}`,
    details: event.description,
    location: event.location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate Outlook Calendar URL for adding an event
 */
export function generateOutlookUrl(event: CalendarEvent): string {
  const startDateTime = timeToDate(event.startDate, event.startTime);
  const endDateTime = timeToDate(event.startDate, event.endTime);

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: startDateTime.toISOString(),
    enddt: endDateTime.toISOString(),
    body: event.description,
    location: event.location,
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Download ICS file to user's device
 */
export function downloadIcsFile(event: CalendarEvent, filename?: string): void {
  const icsContent = generateIcsContent(event);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format arrival window for display
 */
export function formatArrivalWindow(start: string, end: string): string {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return minutes === 0 ? `${hour12} ${period}` : `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };
  
  return `${formatTime(start)} - ${formatTime(end)}`;
}

/**
 * Generate time options for arrival windows (15 min increments)
 */
export function generateTimeOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  
  for (let hour = 6; hour <= 20; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const value = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const period = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      const label = minute === 0 
        ? `${hour12}:00 ${period}` 
        : `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
      options.push({ value, label });
    }
  }
  
  return options;
}
