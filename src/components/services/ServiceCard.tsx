import { Pencil, Trash2, Clock, DollarSign, ChevronUp, ChevronDown, Check } from 'lucide-react';
import { Service } from '@/types/services';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ServiceCardProps {
  service: Service;
  globalBgColor?: string;
  isSelected?: boolean;
  onToggleSelect?: (service: Service) => void;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  isPreviewMode?: boolean;
}

export function ServiceCard({
  service,
  globalBgColor,
  isSelected = false,
  onToggleSelect,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  isPreviewMode,
}: ServiceCardProps) {
  // Use service-specific color or fall back to global color
  const bgColor = service.bgColor || globalBgColor;
  const hasImage = !!service.thumbnailUrl;
  
  // Determine if we need light text (only based on background color)
  const useLightText = !!bgColor;

  // Handle card click for selection
  const handleCardClick = () => {
    if (onToggleSelect) {
      onToggleSelect(service);
    }
  };

  return (
    <div
      className={cn(
        'relative rounded-lg overflow-hidden group transition-all hover:shadow-lg',
        'border border-border',
        !bgColor && 'bg-card',
        isPreviewMode && 'ring-2 ring-primary/20',
        onToggleSelect && 'cursor-pointer',
        isSelected && 'ring-2 ring-primary shadow-md'
      )}
      style={{
        backgroundColor: bgColor ? `hsl(${bgColor})` : undefined,
      }}
      onClick={handleCardClick}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-2 left-2 z-10 bg-primary text-primary-foreground rounded-full p-1">
          <Check className="h-3.5 w-3.5" />
        </div>
      )}

      {/* Content */}
      <div className={cn(
        'relative p-4 min-h-[120px] flex flex-col justify-end',
        useLightText && 'text-white'
      )}>
        {/* Reorder buttons - only show when NOT in selection mode */}
        {!onToggleSelect && (
          <div className="absolute top-2 left-2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {onMoveUp && !isFirst && (
              <Button
                variant="secondary"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
            )}
            {onMoveDown && !isLast && (
              <Button
                variant="secondary"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}

        {/* Thumbnail in upper right corner - fills empty space */}
        {hasImage && (
          <div className="absolute top-3 right-3 h-14 w-14 rounded-md overflow-hidden shadow-md border border-white/20">
            <img
              src={service.thumbnailUrl}
              alt={service.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Action buttons - edit/delete only */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="secondary"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => { e.stopPropagation(); onEdit(service); }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-7 w-7 hover:bg-destructive hover:text-destructive-foreground"
            onClick={(e) => { e.stopPropagation(); onDelete(service); }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Service Info */}
        <div className="mt-auto">
          <h3 className={cn(
            'font-medium truncate',
            useLightText ? 'text-white' : 'text-foreground'
          )}>
            {service.name}
          </h3>
          <div className={cn(
            'flex items-center gap-3 mt-1 text-sm',
            useLightText ? 'text-white/80' : 'text-muted-foreground'
          )}>
            <span className="flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" />
              {service.price.toFixed(2)}
            </span>
            {service.duration && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {service.duration} min
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}