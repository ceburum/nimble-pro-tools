import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar, ChevronDown, ExternalLink, Download } from 'lucide-react';
import {
  CalendarEvent,
  generateGoogleCalendarUrl,
  generateOutlookUrl,
  downloadIcsFile,
} from '@/lib/calendarUtils';

interface AddToCalendarButtonProps {
  event: CalendarEvent;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function AddToCalendarButton({
  event,
  variant = 'outline',
  size = 'sm',
  className,
}: AddToCalendarButtonProps) {
  const handleGoogleCalendar = () => {
    window.open(generateGoogleCalendarUrl(event), '_blank');
  };

  const handleOutlook = () => {
    window.open(generateOutlookUrl(event), '_blank');
  };

  const handleAppleCalendar = () => {
    downloadIcsFile(event);
  };

  const handleDownloadIcs = () => {
    downloadIcsFile(event);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Calendar className="h-4 w-4 mr-2" />
          Add to Calendar
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleGoogleCalendar}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Google Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleAppleCalendar}>
          <Download className="h-4 w-4 mr-2" />
          Apple Calendar / iCal
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleOutlook}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Outlook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadIcs}>
          <Download className="h-4 w-4 mr-2" />
          Download .ics File
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
