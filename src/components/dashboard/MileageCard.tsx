import { useState, useEffect, useRef } from 'react';
import { Car, Plus, Play, Square, MapPin, Settings, Navigation, Crosshair, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MileageLogDialog, MileageEntry } from './MileageLogDialog';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';

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
  dbEntryId?: string;
}

export function MileageCard() {
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);
  const [isTrackingDialogOpen, setIsTrackingDialogOpen] = useState(false);
  const [mileageEntries, setMileageEntries] = useState<MileageEntry[]>([]);
  const [calibration, setCalibration] = useState<OdometerCalibration | null>(null);
  const [trackingState, setTrackingState] = useState<TrackingState | null>(null);
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [manualDistance, setManualDistance] = useState('');
  const [odometerInput, setOdometerInput] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }[]>([]);
  const [currentDistance, setCurrentDistance] = useState(0);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isStartingQuickTrack, setIsStartingQuickTrack] = useState(false);
  const [loading, setLoading] = useState(true);
  const watchIdRef = useRef<number | null>(null);
  const { toast } = useToast();

  // Fetch mileage entries from database
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch mileage entries
      const { data: entries } = await supabase
        .from('mileage_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (entries) {
        setMileageEntries(entries.map(e => ({
          id: e.id,
          date: e.start_time ? new Date(e.start_time).toISOString().split('T')[0] : new Date(e.created_at).toISOString().split('T')[0],
          startLocation: e.start_location || '',
          endLocation: e.end_location || '',
          miles: Number(e.distance) || 0,
          purpose: e.purpose || '',
          createdAt: e.created_at
        })));

        // Check for active tracking session
        const activeEntry = entries.find(e => e.is_tracking);
        if (activeEntry) {
          setTrackingState({
            isTracking: true,
            startLocation: activeEntry.start_location || '',
            startTime: activeEntry.start_time || activeEntry.created_at,
            coordinates: (activeEntry.coordinates as { lat: number; lng: number }[]) || [],
            currentDistance: Number(activeEntry.distance) || 0,
            dbEntryId: activeEntry.id
          });
          setCoordinates((activeEntry.coordinates as { lat: number; lng: number }[]) || []);
          setCurrentDistance(Number(activeEntry.distance) || 0);
          
          // Resume GPS tracking
          if ('geolocation' in navigator) {
            watchIdRef.current = navigator.geolocation.watchPosition(
              handlePositionUpdate,
              handlePositionError,
              { enableHighAccuracy: true, maximumAge: 10000 }
            );
          }
        }
      }

      // Load calibration from localStorage (user-specific setting)
      const savedCalibration = localStorage.getItem(`ceb-odometer-calibration-${user.id}`);
      if (savedCalibration) {
        setCalibration(JSON.parse(savedCalibration));
      }

      setLoading(false);
    };

    fetchData();

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const saveCalibration = async (cal: OdometerCalibration) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      localStorage.setItem(`ceb-odometer-calibration-${user.id}`, JSON.stringify(cal));
    }
    setCalibration(cal);
  };

  const getCurrentLocationName = async (): Promise<{ name: string; coords: { lat: number; lng: number } }> => {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('GPS_NOT_SUPPORTED'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const coords = { lat: latitude, lng: longitude };
          
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            const address = data.address;
            const locationParts = [
              address.house_number,
              address.road,
              address.city || address.town || address.village
            ].filter(Boolean);
            const locationName = locationParts.length > 0 
              ? locationParts.join(' ')
              : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            resolve({ name: locationName, coords });
          } catch {
            resolve({ name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, coords });
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          if (error.code === 1) {
            reject(new Error('PERMISSION_DENIED'));
          } else if (error.code === 2) {
            reject(new Error('POSITION_UNAVAILABLE'));
          } else if (error.code === 3) {
            reject(new Error('TIMEOUT'));
          } else {
            reject(new Error('UNKNOWN'));
          }
        },
        { enableHighAccuracy: true, timeout: 15000 }
      );
    });
  };

  const useCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const { name } = await getCurrentLocationName();
      setStartLocation(name);
      toast({
        title: 'Location found',
        description: 'Start location set to your current position'
      });
    } catch (error) {
      const err = error as Error;
      let description = 'Please enter location manually';
      
      if (err.message === 'PERMISSION_DENIED') {
        description = 'Location permission denied. Please enable Location in your browser/phone settings.';
      } else if (err.message === 'GPS_NOT_SUPPORTED') {
        description = 'Your device does not support GPS location.';
      } else if (err.message === 'POSITION_UNAVAILABLE') {
        description = 'Location unavailable. Make sure GPS/Location is enabled on your device.';
      } else if (err.message === 'TIMEOUT') {
        description = 'Location request timed out. Try again or enter manually.';
      }

      toast({
        title: 'Could not get location',
        description,
        variant: 'destructive'
      });
    }
    setIsGettingLocation(false);
  };

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
    .filter(entry => new Date(entry.date) >= weekStart)
    .reduce((sum, entry) => sum + entry.miles, 0);

  // Calculate expected odometer
  const milesTrackedSinceCalibration = calibration 
    ? mileageEntries
        .filter(entry => new Date(entry.createdAt) >= new Date(calibration.date))
        .reduce((sum, entry) => sum + entry.miles, 0) 
    : 0;
  const expectedOdometer = calibration ? calibration.reading + milesTrackedSinceCalibration : null;

  const handlePositionUpdate = async (position: GeolocationPosition) => {
    const newCoord = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };
    
    setCoordinates(prev => {
      const updated = [...prev, newCoord];
      if (updated.length > 1) {
        const distance = calculateTotalDistance(updated);
        setCurrentDistance(distance);
        
        // Update tracking state
        setTrackingState(state => {
          if (state) {
            const newState = {
              ...state,
              coordinates: updated,
              currentDistance: distance
            };
            
            // Persist to database
            if (state.dbEntryId) {
              supabase
                .from('mileage_entries')
                .update({
                  coordinates: updated,
                  distance: distance
                })
                .eq('id', state.dbEntryId)
                .then(() => {});
            }
            
            return newState;
          }
          return null;
        });
      }
      return updated;
    });
  };

  const handlePositionError = (error: GeolocationPositionError) => {
    console.error('GPS error:', error);
    let description = 'You can enter distance manually when done';
    
    if (error.code === 1) {
      description = 'Location permission denied. Enable in Settings → Privacy → Location.';
    }
    
    toast({
      title: 'GPS tracking paused',
      description
    });
  };

  // Quick start tracking (one-tap from dashboard)
  const quickStartTracking = async () => {
    setIsStartingQuickTrack(true);
    
    try {
      const { name, coords } = await getCurrentLocationName();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Not logged in',
          description: 'Please log in to track mileage',
          variant: 'destructive'
        });
        setIsStartingQuickTrack(false);
        return;
      }

      // Create database entry
      const { data: entry, error } = await supabase
        .from('mileage_entries')
        .insert({
          user_id: user.id,
          start_location: name,
          start_time: new Date().toISOString(),
          is_tracking: true,
          coordinates: [coords],
          distance: 0
        })
        .select()
        .single();

      if (error) throw error;

      const newTrackingState: TrackingState = {
        isTracking: true,
        startLocation: name,
        startTime: new Date().toISOString(),
        coordinates: [coords],
        currentDistance: 0,
        dbEntryId: entry.id
      };

      setTrackingState(newTrackingState);
      setStartLocation(name);
      setCoordinates([coords]);
      setCurrentDistance(0);

      // Start GPS watching
      if ('geolocation' in navigator) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          handlePositionUpdate,
          handlePositionError,
          { enableHighAccuracy: true, maximumAge: 10000 }
        );
      }

      toast({
        title: '📍 Tracking started',
        description: `From: ${name}`
      });

    } catch (error) {
      const err = error as Error;
      let description = 'Please try again or use manual entry';
      
      if (err.message === 'PERMISSION_DENIED') {
        description = 'Location access needed. Please enable Location in Settings → Privacy → Location Services.';
      }

      toast({
        title: 'Could not start tracking',
        description,
        variant: 'destructive'
      });
      
      // Open dialog for manual entry
      setIsTrackingDialogOpen(true);
    }
    
    setIsStartingQuickTrack(false);
  };

  const startTracking = async () => {
    if (!startLocation.trim()) {
      toast({
        title: 'Error',
        description: 'Enter a start location',
        variant: 'destructive'
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: 'Not logged in',
        description: 'Please log in to track mileage',
        variant: 'destructive'
      });
      return;
    }

    // Create database entry
    const { data: entry, error } = await supabase
      .from('mileage_entries')
      .insert({
        user_id: user.id,
        start_location: startLocation.trim(),
        start_time: new Date().toISOString(),
        is_tracking: true,
        coordinates: [],
        distance: 0
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: 'Could not start tracking',
        variant: 'destructive'
      });
      return;
    }

    const newTrackingState: TrackingState = {
      isTracking: true,
      startLocation: startLocation.trim(),
      startTime: new Date().toISOString(),
      coordinates: [],
      currentDistance: 0,
      dbEntryId: entry.id
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
      toast({
        title: 'Tracking started',
        description: 'GPS is recording your route'
      });
    } else {
      toast({
        title: 'GPS unavailable',
        description: 'Enter distance manually when done'
      });
    }
  };

  const stopTracking = async () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    const finalDistance = coordinates.length > 1 
      ? calculateTotalDistance(coordinates) 
      : parseFloat(manualDistance) || 0;

    // Get end location if possible
    let finalEndLocation = endLocation.trim() || 'Destination';
    try {
      const { name } = await getCurrentLocationName();
      if (!endLocation.trim()) {
        finalEndLocation = name;
      }
    } catch {
      // Use manual entry or default
    }

    // Update database entry
    if (trackingState?.dbEntryId) {
      await supabase
        .from('mileage_entries')
        .update({
          end_location: finalEndLocation,
          end_time: new Date().toISOString(),
          is_tracking: false,
          distance: finalDistance,
          coordinates: coordinates
        })
        .eq('id', trackingState.dbEntryId);

      // Update local state
      const newEntry: MileageEntry = {
        id: trackingState.dbEntryId,
        date: new Date().toISOString().split('T')[0],
        startLocation: trackingState.startLocation,
        endLocation: finalEndLocation,
        miles: finalDistance,
        purpose: '',
        createdAt: new Date().toISOString()
      };
      setMileageEntries(prev => [newEntry, ...prev.filter(e => e.id !== trackingState.dbEntryId)]);
    }

    toast({
      title: '🏁 Trip complete!',
      description: `${finalDistance.toFixed(1)} miles logged`
    });

    // Reset state
    setTrackingState(null);
    setStartLocation('');
    setEndLocation('');
    setManualDistance('');
    setCoordinates([]);
    setCurrentDistance(0);
    setIsTrackingDialogOpen(false);
  };

  const handleManualSave = async (data: Omit<MileageEntry, 'id' | 'createdAt'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: 'Not logged in',
        description: 'Please log in to save mileage',
        variant: 'destructive'
      });
      return;
    }

    const { data: entry, error } = await supabase
      .from('mileage_entries')
      .insert({
        user_id: user.id,
        start_location: data.startLocation,
        end_location: data.endLocation,
        distance: data.miles,
        purpose: data.purpose,
        start_time: new Date(data.date).toISOString(),
        is_tracking: false
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: 'Could not save mileage entry',
        variant: 'destructive'
      });
      return;
    }

    const newEntry: MileageEntry = {
      id: entry.id,
      date: data.date,
      startLocation: data.startLocation,
      endLocation: data.endLocation,
      miles: data.miles,
      purpose: data.purpose,
      createdAt: entry.created_at
    };

    setMileageEntries(prev => [newEntry, ...prev]);
    toast({
      title: 'Mileage logged',
      description: `${data.miles} miles recorded.`
    });
  };

  const handleCalibrateOdometer = () => {
    const reading = parseFloat(odometerInput);
    if (isNaN(reading) || reading <= 0) {
      toast({
        title: 'Error',
        description: 'Enter a valid odometer reading',
        variant: 'destructive'
      });
      return;
    }
    const cal: OdometerCalibration = {
      reading,
      date: new Date().toISOString(),
      trackedAtCalibration: totalTrackedMiles
    };
    saveCalibration(cal);
    setOdometerInput('');
    toast({
      title: 'Odometer calibrated',
      description: `Set to ${reading.toLocaleString()} miles`
    });
  };

  const isTracking = trackingState?.isTracking || false;

  if (loading) {
    return (
      <div className="rounded-xl border p-4 shadow-sm border-muted bg-secondary animate-pulse">
        <div className="h-12 bg-muted rounded" />
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border p-4 shadow-sm border-muted bg-secondary">
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
                      onChange={e => setOdometerInput(e.target.value)}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={handleCalibrateOdometer}>
                      Set
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Main action button - one tap to start */}
            {isTracking ? (
              <Button 
                onClick={() => setIsTrackingDialogOpen(true)} 
                size="sm" 
                variant="destructive" 
                className="gap-1"
              >
                <Square className="h-4 w-4" />
                Stop
              </Button>
            ) : (
              <Button 
                onClick={quickStartTracking} 
                size="sm" 
                className="gap-1"
                disabled={isStartingQuickTrack}
              >
                {isStartingQuickTrack ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Navigation className="h-4 w-4" />
                )}
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
                  <Label>End Location (optional)</Label>
                  <Input
                    value={endLocation}
                    onChange={e => setEndLocation(e.target.value)}
                    placeholder="Auto-detected when you stop"
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
                        onChange={e => setManualDistance(e.target.value)}
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
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={startLocation}
                        onChange={e => setStartLocation(e.target.value)}
                        placeholder="e.g., Office, Home, Job site"
                        className="pl-10"
                      />
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon"
                      onClick={useCurrentLocation}
                      disabled={isGettingLocation}
                      title="Use current location"
                    >
                      {isGettingLocation ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Crosshair className="h-4 w-4" />
                      )}
                    </Button>
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
                  {mileageEntries.slice(0, 5).map(entry => (
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
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
