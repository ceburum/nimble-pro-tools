import { useState, useEffect, useRef } from 'react';
import { Car, Plus, Play, Square, MapPin, Settings, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MileageLogDialog, MileageEntry } from './MileageLogDialog';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface OdometerCalibration {
  reading: number;
  date: string;
  trackedAtCalibration: number;
}

interface TrackingState {
  isTracking: boolean;
  startLocation: string;
  startTime: string;
  coordinates: { lat: number; lng: number }[];
  currentDistance: number;
}

export function MileageCard() {
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);
  const [isTrackingDialogOpen, setIsTrackingDialogOpen] = useState(false);
  const [mileageEntries, setMileageEntries] = useLocalStorage<MileageEntry[]>('ceb-mileage', []);
  const [calibration, setCalibration] = useLocalStorage<OdometerCalibration | null>('ceb-odometer-calibration', null);
  const [trackingState, setTrackingState] = useLocalStorage<TrackingState | null>('ceb-mileage-tracking', null);
  
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [manualDistance, setManualDistance] = useState('');
  const [odometerInput, setOdometerInput] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }[]>([]);
  const [currentDistance, setCurrentDistance] = useState(0);
  
  const watchIdRef = useRef<number | null>(null);
  const { toast } = useToast();

  // Calculate totals
  const totalTrackedMiles = mileageEntries.reduce((sum, entry) => sum + entry.miles, 0);
  
  const getWeekStart = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const weekStart = new Date(now.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  };

  const weekStart = getWeekStart();
  const weeklyMiles = mileageEntries
    .filter((entry) => new Date(entry.date) >= weekStart)
    .reduce((sum, entry) => sum + entry.miles, 0);

  // Calculate expected odometer
  const milesTrackedSinceCalibration = calibration
    ? mileageEntries
        .filter((entry) => new Date(entry.createdAt) >= new Date(calibration.date))
        .reduce((sum, entry) => sum + entry.miles, 0)
    : 0;
  const expectedOdometer = calibration ? calibration.reading + milesTrackedSinceCalibration : null;

  // Restore tracking state on mount
  useEffect(() => {
    if (trackingState?.isTracking) {
      setStartLocation(trackingState.startLocation);
      setCoordinates(trackingState.coordinates);
      setCurrentDistance(trackingState.currentDistance);
      
      // Resume GPS tracking
      if ('geolocation' in navigator) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          handlePositionUpdate,
          handlePositionError,
          { enableHighAccuracy: true, maximumAge: 10000 }
        );
      }
    }
    
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const handlePositionUpdate = (position: GeolocationPosition) => {
    const newCoord = { lat: position.coords.latitude, lng: position.coords.longitude };
    setCoordinates((prev) => {
      const updated = [...prev, newCoord];
      if (updated.length > 1) {
        const distance = calculateTotalDistance(updated);
        setCurrentDistance(distance);
        // Persist tracking state
        setTrackingState((state) => state ? { ...state, coordinates: updated, currentDistance: distance } : null);
      }
      return updated;
    });
  };

  const handlePositionError = (error: GeolocationPositionError) => {
    console.error('GPS error:', error);
    toast({ title: 'GPS unavailable', description: 'You can enter distance manually when done' });
  };

  const startTracking = () => {
    if (!startLocation.trim()) {
      toast({ title: 'Error', description: 'Enter a start location', variant: 'destructive' });
      return;
    }

    const newTrackingState: TrackingState = {
      isTracking: true,
      startLocation: startLocation.trim(),
      startTime: new Date().toISOString(),
      coordinates: [],
      currentDistance: 0,
    };

    setTrackingState(newTrackingState);
    setCoordinates([]);
    setCurrentDistance(0);

    if ('geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        handlePositionUpdate,
        handlePositionError,
        { enableHighAccuracy: true, maximumAge: 10000 }
      );
      toast({ title: 'Tracking started', description: 'GPS is recording your route' });
    } else {
      toast({ title: 'GPS unavailable', description: 'Enter distance manually when done' });
    }
  };

  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    const finalDistance = coordinates.length > 1 
      ? calculateTotalDistance(coordinates) 
      : parseFloat(manualDistance) || 0;

    if (finalDistance > 0) {
      const newEntry: MileageEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        startLocation: trackingState?.startLocation || startLocation,
        endLocation: endLocation.trim() || 'Destination',
        miles: finalDistance,
        purpose: '',
        createdAt: new Date().toISOString(),
      };
      setMileageEntries((prev) => [newEntry, ...prev]);
      toast({ title: 'Trip recorded', description: `${finalDistance.toFixed(1)} miles logged` });
    }

    // Reset state
    setTrackingState(null);
    setStartLocation('');
    setEndLocation('');
    setManualDistance('');
    setCoordinates([]);
    setCurrentDistance(0);
  };

  const handleManualSave = (data: Omit<MileageEntry, 'id' | 'createdAt'>) => {
    const newEntry: MileageEntry = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setMileageEntries((prev) => [newEntry, ...prev]);
    toast({
      title: 'Mileage logged',
      description: `${data.miles} miles recorded.`,
    });
  };

  const handleCalibrateOdometer = () => {
    const reading = parseFloat(odometerInput);
    if (isNaN(reading) || reading <= 0) {
      toast({ title: 'Error', description: 'Enter a valid odometer reading', variant: 'destructive' });
      return;
    }

    setCalibration({
      reading,
      date: new Date().toISOString(),
      trackedAtCalibration: totalTrackedMiles,
    });
    setOdometerInput('');
    toast({ title: 'Odometer calibrated', description: `Set to ${reading.toLocaleString()} miles` });
  };

  const isTracking = trackingState?.isTracking || false;

  return (
    <>
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2 rounded-lg ${isTracking ? 'bg-primary animate-pulse' : 'bg-primary/10'}`}>
              <Car className={`h-5 w-5 ${isTracking ? 'text-primary-foreground' : 'text-primary'}`} />
            </div>
            <div className="min-w-0">
              {isTracking ? (
                <>
                  <p className="text-sm text-primary font-medium">Tracking...</p>
                  <p className="text-xl font-bold text-card-foreground">
                    {currentDistance.toFixed(1)} miles
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">This Week</p>
                  <p className="text-xl font-bold text-card-foreground">
                    {weeklyMiles.toLocaleString('en-US', { maximumFractionDigits: 1 })} miles
                  </p>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Odometer info */}
            {expectedOdometer && !isTracking && (
              <div className="text-right hidden sm:block">
                <p className="text-xs text-muted-foreground">Est. Odometer</p>
                <p className="text-sm font-medium text-card-foreground">
                  {expectedOdometer.toLocaleString('en-US', { maximumFractionDigits: 0 })} mi
                </p>
              </div>
            )}
            
            {/* Settings popover for odometer calibration */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72" align="end">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm">Odometer Calibration</h4>
                    <p className="text-xs text-muted-foreground">
                      Enter your current odometer reading to track accuracy
                    </p>
                  </div>
                  {calibration && (
                    <div className="p-2 bg-muted/50 rounded text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last calibrated:</span>
                        <span>{new Date(calibration.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Set at:</span>
                        <span>{calibration.reading.toLocaleString()} mi</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tracked since:</span>
                        <span>{milesTrackedSinceCalibration.toFixed(1)} mi</span>
                      </div>
                      <div className="flex justify-between font-medium border-t pt-1 mt-1">
                        <span>Expected now:</span>
                        <span>{expectedOdometer?.toLocaleString('en-US', { maximumFractionDigits: 0 })} mi</span>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Current odometer"
                      value={odometerInput}
                      onChange={(e) => setOdometerInput(e.target.value)}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={handleCalibrateOdometer}>
                      Set
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Main action button */}
            {isTracking ? (
              <Button onClick={() => setIsTrackingDialogOpen(true)} size="sm" variant="destructive" className="gap-1">
                <Square className="h-4 w-4" />
                Stop
              </Button>
            ) : (
              <Button onClick={() => setIsTrackingDialogOpen(true)} size="sm" className="gap-1">
                <Navigation className="h-4 w-4" />
                Track
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* GPS Tracking Dialog */}
      <Dialog open={isTrackingDialogOpen} onOpenChange={setIsTrackingDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Mileage Tracker
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Stats summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">This Week</p>
                <p className="text-lg font-bold">{weeklyMiles.toFixed(1)} mi</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Total Logged</p>
                <p className="text-lg font-bold">{totalTrackedMiles.toFixed(1)} mi</p>
              </div>
            </div>

            {isTracking ? (
              <div className="space-y-4">
                <div className="bg-primary/10 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
                    <span className="text-sm font-medium text-primary">Tracking in progress</span>
                  </div>
                  <p className="text-sm text-muted-foreground">From: {trackingState?.startLocation}</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{currentDistance.toFixed(1)} miles</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {coordinates.length} GPS points recorded
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>End Location</Label>
                  <Input 
                    value={endLocation} 
                    onChange={(e) => setEndLocation(e.target.value)} 
                    placeholder="Where did you end up?" 
                  />
                </div>

                {coordinates.length < 2 && (
                  <div className="space-y-2">
                    <Label>Manual Distance (if GPS failed)</Label>
                    <div className="relative">
                      <Input 
                        type="number" 
                        step="0.1" 
                        value={manualDistance} 
                        onChange={(e) => setManualDistance(e.target.value)} 
                        placeholder="0.0" 
                      />
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
                    <Input 
                      value={startLocation} 
                      onChange={(e) => setStartLocation(e.target.value)} 
                      placeholder="e.g., Office, Home, Job site" 
                      className="pl-10" 
                    />
                  </div>
                </div>

                <Button onClick={startTracking} className="w-full gap-2">
                  <Play className="h-4 w-4" />
                  Start GPS Tracking
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">or add manually</span>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsTrackingDialogOpen(false);
                    setIsManualDialogOpen(true);
                  }} 
                  className="w-full gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Manual Entry
                </Button>
              </div>
            )}

            {/* Recent trips */}
            {mileageEntries.length > 0 && !isTracking && (
              <div className="space-y-2">
                <Label>Recent Trips</Label>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {mileageEntries.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                      <div className="truncate flex-1 min-w-0">
                        <span className="text-muted-foreground">
                          {entry.startLocation}{entry.endLocation ? ` → ${entry.endLocation}` : ''}
                        </span>
                      </div>
                      <span className="font-medium ml-2 flex-shrink-0">{entry.miles.toFixed(1)} mi</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <MileageLogDialog
        open={isManualDialogOpen}
        onOpenChange={setIsManualDialogOpen}
        onSave={handleManualSave}
      />
    </>
  );
}

function calculateTotalDistance(coords: { lat: number; lng: number }[]): number {
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    total += haversine(coords[i - 1], coords[i]);
  }
  return total;
}

function haversine(coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);
  const a = Math.sin(dLat / 2) ** 2 + 
            Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
