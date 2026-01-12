import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Trash2, Car } from 'lucide-react';
import { MileageTrip } from '@/lib/mileageUtils';
import { formatDistance, formatDuration, formatTripDate, formatTripTime } from '@/lib/mileageUtils';

interface MileageTripCardProps {
  trip: MileageTrip;
  irsRate: number;
  onDelete: (tripId: string) => void;
}

export function MileageTripCard({ trip, irsRate, onDelete }: MileageTripCardProps) {
  const deduction = trip.distance * irsRate;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={trip.isTracking ? 'default' : 'secondary'} className="text-xs">
                {trip.isTracking ? 'Tracking' : formatTripDate(trip.startTime)}
              </Badge>
              {trip.purpose && (
                <Badge variant="outline" className="text-xs">
                  {trip.purpose}
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="truncate">{trip.startLocation || 'Unknown'}</span>
              </div>
              {trip.endLocation && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{trip.endLocation}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Car className="h-4 w-4" />
                <span>{formatDistance(trip.distance)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{formatDuration(trip.startTime, trip.endTime)}</span>
              </div>
              <span className="text-xs">{formatTripTime(trip.startTime)}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <p className="text-lg font-semibold text-primary">
                ${deduction.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">deduction</p>
            </div>
            {!trip.isTracking && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(trip.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
