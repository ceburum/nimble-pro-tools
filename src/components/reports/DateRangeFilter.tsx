import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths, subQuarters, subYears } from 'date-fns';
import { cn } from '@/lib/utils';

export interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangeFilterProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

type PresetKey = 'this-month' | 'last-month' | 'this-quarter' | 'last-quarter' | 'this-year' | 'last-year' | 'all-time' | 'custom';

const presets: { key: PresetKey; label: string }[] = [
  { key: 'this-month', label: 'This Month' },
  { key: 'last-month', label: 'Last Month' },
  { key: 'this-quarter', label: 'This Quarter' },
  { key: 'last-quarter', label: 'Last Quarter' },
  { key: 'this-year', label: 'This Year' },
  { key: 'last-year', label: 'Last Year' },
  { key: 'all-time', label: 'All Time' },
  { key: 'custom', label: 'Custom Range' },
];

function getPresetRange(preset: PresetKey): DateRange {
  const now = new Date();
  
  switch (preset) {
    case 'this-month':
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case 'last-month':
      const lastMonth = subMonths(now, 1);
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    case 'this-quarter':
      return { from: startOfQuarter(now), to: endOfQuarter(now) };
    case 'last-quarter':
      const lastQuarter = subQuarters(now, 1);
      return { from: startOfQuarter(lastQuarter), to: endOfQuarter(lastQuarter) };
    case 'this-year':
      return { from: startOfYear(now), to: endOfYear(now) };
    case 'last-year':
      const lastYear = subYears(now, 1);
      return { from: startOfYear(lastYear), to: endOfYear(lastYear) };
    case 'all-time':
      return { from: new Date(2020, 0, 1), to: endOfYear(now) };
    default:
      return { from: startOfMonth(now), to: endOfMonth(now) };
  }
}

export function DateRangeFilter({ dateRange, onDateRangeChange }: DateRangeFilterProps) {
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>('this-year');
  const [isCustom, setIsCustom] = useState(false);

  const handlePresetChange = (value: PresetKey) => {
    setSelectedPreset(value);
    if (value === 'custom') {
      setIsCustom(true);
    } else {
      setIsCustom(false);
      onDateRangeChange(getPresetRange(value));
    }
  };

  const handleFromChange = (date: Date | undefined) => {
    if (date) {
      onDateRangeChange({ ...dateRange, from: date });
    }
  };

  const handleToChange = (date: Date | undefined) => {
    if (date) {
      onDateRangeChange({ ...dateRange, to: date });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={selectedPreset} onValueChange={(v) => handlePresetChange(v as PresetKey)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Select period" />
        </SelectTrigger>
        <SelectContent>
          {presets.map((preset) => (
            <SelectItem key={preset.key} value={preset.key}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isCustom && (
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[130px] justify-start text-left font-normal",
                  !dateRange.from && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? format(dateRange.from, "MMM d, yyyy") : "From"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateRange.from}
                onSelect={handleFromChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <span className="text-muted-foreground">to</span>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[130px] justify-start text-left font-normal",
                  !dateRange.to && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.to ? format(dateRange.to, "MMM d, yyyy") : "To"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateRange.to}
                onSelect={handleToChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      <span className="text-sm text-muted-foreground">
        {format(dateRange.from, "MMM d, yyyy")} – {format(dateRange.to, "MMM d, yyyy")}
      </span>
    </div>
  );
}
