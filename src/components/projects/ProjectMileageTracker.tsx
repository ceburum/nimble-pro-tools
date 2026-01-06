import { useState, useEffect, useRef } from 'react';
import { Navigation, Play, Square, MapPin } from 'lucide-react';
import { MileageEntry } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface ProjectMileageTrackerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  entries: MileageEntry[];
  onUpdate: (entry: MileageEntry) => void;
}

export function ProjectMileageTracker({ open, onOpenChange, projectId, entries, onUpdate }: ProjectMileageTrackerProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<MileageEntry | null>(null);
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [manualDistance, setManualDistance] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }[]>([]);
  const watchIdRef = useRef<number | null>(null);
  const { toast } = useToast();

  const totalMiles = entries.reduce((sum, e) => sum + e.distance, 0);

  useEffect(() => {
    const activeEntry = entries.find((e) => e.isTracking);
    if (activeEntry) {
      setCurrentEntry(activeEntry);
      setIsTracking(true);
      setStartLocation(activeEntry.startLocation);
      setCoordinates(activeEntry.coordinates || []);
    }
  }, [entries]);

  const startTracking = () => {
    if (!startLocation) {
      toast({ title: 'Error', description: 'Enter a start location', variant: 'destructive' });
      return;
    }

    const entry: MileageEntry = {
      id: Date.now().toString(),
      projectId,
      startLocation,
      endLocation: '',
      distance: 0,
      startTime: new Date(),
      isTracking: true,
      coordinates: [],
    };

    setCurrentEntry(entry);
    setIsTracking(true);

    if ('geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newCoord = { lat: position.coords.latitude, lng: position.coords.longitude };
          setCoordinates((prev) => {
            const updated = [...prev, newCoord];
            if (updated.length > 1) {
              const distance = calculateTotalDistance(updated);
              setCurrentEntry((e) => (e ? { ...e, distance, coordinates: updated } : null));
            }
            return updated;
          });
        },
        (error) => {
          console.error('GPS error:', error);
          toast({ title: 'GPS unavailable', description: 'Enter distance manually when done' });
        },
        { enableHighAccuracy: true, maximumAge: 10000 }
      );
    }

    onUpdate(entry);
    toast({ title: 'Tracking started', description: 'GPS is recording your route' });
  };

  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (!currentEntry) return;

    const finalDistance = coordinates.length > 1 ? calculateTotalDistance(coordinates) : parseFloat(manualDistance) || 0;

    const completedEntry: MileageEntry = {
      ...currentEntry,
      endLocation: endLocation || 'Destination',
      distance: finalDistance,
      endTime: new Date(),
      isTracking: false,
      coordinates,
    };

    onUpdate(completedEntry);
    setIsTracking(false);
    setCurrentEntry(null);
    setStartLocation('');
    setEndLocation('');
    setManualDistance('');
    setCoordinates([]);

    toast({ title: 'Trip recorded', description: `${finalDistance.toFixed(1)} miles logged` });
  };

  const addManualEntry = () => {
    if (!startLocation || !endLocation || !manualDistance) {
      toast({ title: 'Error', description: 'Fill in all fields', variant: 'destructive' });
      return;
    }

    const entry: MileageEntry = {
      id: Date.now().toString(),
      projectId,
      startLocation,
      endLocation,
      distance: parseFloat(manualDistance),
      startTime: new Date(),
      endTime: new Date(),
      isTracking: false,
    };

    onUpdate(entry);
    setStartLocation('');
    setEndLocation('');
    setManualDistance('');
    toast({ title: 'Mileage added', description: `${manualDistance} miles logged` });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Mileage Tracker
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">Total Miles</p>
            <p className="text-3xl font-bold text-foreground">{totalMiles.toFixed(1)}</p>
          </div>

          {isTracking ? (
            <div className="space-y-4">
              <div className="bg-primary/10 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm font-medium text-primary">Tracking in progress</span>
                </div>
                <p className="text-sm text-muted-foreground">From: {startLocation}</p>
                <p className="text-2xl font-bold text-foreground mt-2">{currentEntry?.distance.toFixed(1) || '0.0'} miles</p>
              </div>

              <div className="space-y-2">
                <Label>End Location</Label>
                <Input value={endLocation} onChange={(e) => setEndLocation(e.target.value)} placeholder="Where did you end up?" />
              </div>

              {coordinates.length < 2 && (
                <div className="space-y-2">
                  <Label>Manual Distance</Label>
                  <div className="relative">
                    <Input type="number" step="0.1" value={manualDistance} onChange={(e) => setManualDistance(e.target.value)} placeholder="0.0" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">mi</span>
                  </div>
                </div>
              )}

              <Button onClick={stopTracking} variant="destructive" className="w-full gap-2">
                <Square className="h-4 w-4" />
                Stop Tracking
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Start Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={startLocation} onChange={(e) => setStartLocation(e.target.value)} placeholder="e.g., Office, Home" className="pl-10" />
                </div>
              </div>

              <Button onClick={startTracking} className="w-full gap-2">
                <Play className="h-4 w-4" />
                Start GPS Tracking
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or add manually</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>End Location</Label>
                <Input value={endLocation} onChange={(e) => setEndLocation(e.target.value)} placeholder="Destination" />
              </div>

              <div className="space-y-2">
                <Label>Distance</Label>
                <div className="relative">
                  <Input type="number" step="0.1" value={manualDistance} onChange={(e) => setManualDistance(e.target.value)} placeholder="0.0" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">mi</span>
                </div>
              </div>

              <Button variant="outline" onClick={addManualEntry} className="w-full">Add Manual Entry</Button>
            </div>
          )}

          {entries.filter((e) => !e.isTracking).length > 0 && (
            <div className="space-y-2">
              <Label>Trip History</Label>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {entries.filter((e) => !e.isTracking).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground truncate flex-1">{entry.startLocation} → {entry.endLocation}</span>
                    <span className="font-medium ml-2">{entry.distance.toFixed(1)} mi</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function calculateTotalDistance(coords: { lat: number; lng: number }[]): number {
  let total = 0;
  for (let i = 1; i < coords.length; i++) total += haversine(coords[i - 1], coords[i]);
  return total;
}

function haversine(coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number {
  const R = 3959;
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
