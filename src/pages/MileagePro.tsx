import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, Play, Square, Car, DollarSign, MapPin } from 'lucide-react';
import { useMileageTrips } from '@/hooks/useMileageTrips';
import { MileageTripCard } from '@/components/mileage/MileageTripCard';
import { MileageSettingsDialog } from '@/components/mileage/MileageSettingsDialog';
import { formatDistance } from '@/lib/mileageUtils';

export default function MileagePro() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const {
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
  } = useMileageTrips();

  const handleStartTrip = () => {
    startTrip('Current Location');
  };

  const handleStopTrip = () => {
    // In native app, this would use actual GPS distance
    // For now, simulate a random distance
    const simulatedDistance = Math.random() * 20 + 1;
    stopTrip('Destination', simulatedDistance);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mileage Pro"
        description="Track business miles for tax deductions"
        action={
          <Button variant="outline" onClick={() => setSettingsOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Car className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatDistance(totalMiles)}</p>
                <p className="text-xs text-muted-foreground">Total Miles</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totalDeduction.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Tax Deduction</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <MapPin className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{trips.length}</p>
                <p className="text-xs text-muted-foreground">Total Trips</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <DollarSign className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">${settings.irsRate.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Rate/Mile</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tracking Control */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center gap-4">
            {activeTrip ? (
              <>
                <div className="text-center">
                  <p className="text-lg font-medium">Trip in Progress</p>
                  <p className="text-sm text-muted-foreground">
                    Started from: {activeTrip.startLocation}
                  </p>
                </div>
                <Button
                  size="lg"
                  variant="destructive"
                  className="w-full max-w-xs gap-2"
                  onClick={handleStopTrip}
                >
                  <Square className="h-5 w-5" />
                  Stop Tracking
                </Button>
              </>
            ) : (
              <>
                <div className="text-center">
                  <p className="text-lg font-medium">Ready to Track</p>
                  <p className="text-sm text-muted-foreground">
                    Start a new business trip
                  </p>
                </div>
                <Button
                  size="lg"
                  className="w-full max-w-xs gap-2"
                  onClick={handleStartTrip}
                >
                  <Play className="h-5 w-5" />
                  Start Trip
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trip History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Trips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <>
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </>
          ) : trips.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Car className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No trips recorded yet</p>
              <p className="text-sm">Start your first trip to begin tracking mileage</p>
            </div>
          ) : (
            trips.slice(0, 10).map((trip) => (
              <MileageTripCard
                key={trip.id}
                trip={trip}
                irsRate={settings.irsRate}
                onDelete={deleteTrip}
              />
            ))
          )}
        </CardContent>
      </Card>

      <MileageSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSave={updateSettings}
      />
    </div>
  );
}
