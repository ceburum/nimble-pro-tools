import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { MileageTrip, MileageSettings, DEFAULT_SETTINGS } from '@/lib/mileageUtils';

export function useMileageTrips() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<MileageTrip[]>([]);
  const [settings, setSettings] = useState<MileageSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [activeTrip, setActiveTrip] = useState<MileageTrip | null>(null);

  // Fetch trips from database
  const fetchTrips = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('mileage_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false });

      if (error) throw error;

      const mappedTrips: MileageTrip[] = (data || []).map((entry) => ({
        id: entry.id,
        startLocation: entry.start_location || '',
        endLocation: entry.end_location || '',
        distance: entry.distance || 0,
        startTime: entry.start_time ? new Date(entry.start_time) : new Date(),
        endTime: entry.end_time ? new Date(entry.end_time) : undefined,
        isTracking: entry.is_tracking || false,
        purpose: entry.purpose || undefined,
        coordinates: entry.coordinates as { lat: number; lng: number }[] | undefined,
      }));

      setTrips(mappedTrips);
      
      // Find any active tracking trip
      const active = mappedTrips.find(t => t.isTracking);
      setActiveTrip(active || null);
    } catch (error) {
      console.error('Error fetching mileage trips:', error);
      toast.error('Failed to load mileage trips');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch user settings
  const fetchSettings = useCallback(async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('user_settings')
        .select('irs_mileage_rate')
        .eq('user_id', user.id)
        .single();

      if (data?.irs_mileage_rate) {
        setSettings(prev => ({
          ...prev,
          irsRate: data.irs_mileage_rate,
        }));
      }
    } catch (error) {
      // Settings may not exist yet, use defaults
      console.log('Using default mileage settings');
    }
  }, [user]);

  useEffect(() => {
    fetchTrips();
    fetchSettings();
  }, [fetchTrips, fetchSettings]);

  // Start a new trip
  const startTrip = async (startLocation: string = 'Current Location') => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('mileage_entries')
        .insert({
          user_id: user.id,
          start_location: startLocation,
          start_time: new Date().toISOString(),
          is_tracking: true,
          distance: 0,
        })
        .select()
        .single();

      if (error) throw error;

      const newTrip: MileageTrip = {
        id: data.id,
        startLocation: data.start_location || '',
        endLocation: '',
        distance: 0,
        startTime: new Date(data.start_time || new Date()),
        isTracking: true,
      };

      setActiveTrip(newTrip);
      setTrips(prev => [newTrip, ...prev]);
      toast.success('Trip tracking started');
    } catch (error) {
      console.error('Error starting trip:', error);
      toast.error('Failed to start trip');
    }
  };

  // Stop the active trip
  const stopTrip = async (endLocation: string = 'Current Location', distance: number = 0) => {
    if (!user || !activeTrip) return;

    try {
      const { error } = await supabase
        .from('mileage_entries')
        .update({
          end_location: endLocation,
          end_time: new Date().toISOString(),
          is_tracking: false,
          distance: distance,
        })
        .eq('id', activeTrip.id);

      if (error) throw error;

      setTrips(prev =>
        prev.map(t =>
          t.id === activeTrip.id
            ? { ...t, endLocation, endTime: new Date(), isTracking: false, distance }
            : t
        )
      );
      setActiveTrip(null);
      toast.success('Trip saved successfully');
    } catch (error) {
      console.error('Error stopping trip:', error);
      toast.error('Failed to save trip');
    }
  };

  // Delete a trip
  const deleteTrip = async (tripId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('mileage_entries')
        .delete()
        .eq('id', tripId);

      if (error) throw error;

      setTrips(prev => prev.filter(t => t.id !== tripId));
      if (activeTrip?.id === tripId) {
        setActiveTrip(null);
      }
      toast.success('Trip deleted');
    } catch (error) {
      console.error('Error deleting trip:', error);
      toast.error('Failed to delete trip');
    }
  };

  // Update settings
  const updateSettings = async (newSettings: Partial<MileageSettings>) => {
    if (!user) return;

    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          irs_mileage_rate: updated.irsRate,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;
      toast.success('Settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    }
  };

  // Calculate total deduction
  const totalMiles = trips.reduce((sum, t) => sum + t.distance, 0);
  const totalDeduction = totalMiles * settings.irsRate;

  return {
    trips,
    settings,
    loading,
    activeTrip,
    startTrip,
    stopTrip,
    deleteTrip,
    updateSettings,
    totalMiles,
    totalDeduction,
    refresh: fetchTrips,
  };
}
