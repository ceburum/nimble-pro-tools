import { Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { COLOR_THEMES } from '@/config/servicePresets';
import { cn } from '@/lib/utils';

interface ServiceColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
}

export function ServiceColorPicker({ value, onChange }: ServiceColorPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <div
            className="h-4 w-4 rounded border border-border"
            style={{
              backgroundColor: value ? `hsl(${value})` : 'transparent',
            }}
          />
          <Palette className="h-4 w-4" />
          Theme Color
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-3">
          <p className="text-sm font-medium">Choose a theme color</p>
          <p className="text-xs text-muted-foreground">
            This applies to all service tiles without a custom color.
          </p>
          <div className="grid grid-cols-4 gap-2">
            {/* Clear option */}
            <button
              onClick={() => onChange('')}
              className={cn(
                'h-10 rounded border-2 flex items-center justify-center text-xs bg-card',
                !value ? 'border-primary' : 'border-border'
              )}
            >
              None
            </button>
            {COLOR_THEMES.map((theme) => (
              <button
                key={theme.name}
                onClick={() => onChange(theme.color)}
                className={cn(
                  'h-10 rounded border-2 transition-all',
                  value === theme.color ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-muted-foreground/30'
                )}
                style={{ backgroundColor: `hsl(${theme.color})` }}
                title={theme.name}
              />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
