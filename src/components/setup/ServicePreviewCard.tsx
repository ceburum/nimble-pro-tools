import { Trash2, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PreviewService } from '@/lib/serviceUtils';
import { cn } from '@/lib/utils';

interface ServicePreviewCardProps {
  service: PreviewService;
  onDelete: (id: string) => void;
}

export function ServicePreviewCard({ service, onDelete }: ServicePreviewCardProps) {
  return (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-lg border",
      "bg-card hover:bg-accent/50 transition-colors"
    )}>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{service.name}</p>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            {service.price.toFixed(2)}
          </span>
          {service.duration && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {service.duration} min
            </span>
          )}
        </div>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={() => onDelete(service.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
