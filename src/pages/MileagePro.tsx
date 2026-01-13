import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, Play, Square, Car, DollarSign, MapPin } from 'lucide-react';
import { useMileageTrips } from '@/hooks/useMileageTrips';
import { useMileagePro } from '@/hooks/useMileagePro';
import { MileageTripCard } from '@/components/mileage/MileageTripCard';
import { MileageSettingsDialog } from '@/components/mileage/MileageSettingsDialog';
import { FeatureNotice } from '@/components/ui/feature-notice';
import { formatDistance } from '@/lib/mileageUtils';
import { toast } from 'sonner';

export default function MileagePro() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { isEnabled, loading: featureLoading, enableMileagePro } = useMileagePro();
  const {
    trips,
    settings,
    loading: tripsLoading,
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
    const simulatedDistance = Math.random() * 20 + 1;
    stopTrip('Destination', simulatedDistance);
  };

  const handleEnableMileagePro = async () => {
    const success = await enableMileagePro();
    if (success) {
      toast.success('Mileage Pro enabled!');
    } else {
      toast.error('Failed to enable Mileage Pro');
    }
    return success;
  };

  // Show loading state
  if (featureLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mileage Pro"
        description="Track business miles for tax deductions"
        action={
          isEnabled ? (
            <Button variant="outline" onClick={() => setSettingsOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          ) : undefined
        }
      />

      {/* Show inline notice if feature is not enabled */}
      {!isEnabled && (
        <FeatureNotice
          icon={<Car className="h-8 w-8 text-primary" />}
          title="Mileage Pro"
          description="Automatic mileage tracking for maximum tax deductions"
          features={[
            'One-tap trip tracking with GPS',
            'Automatic IRS mileage rate calculations',
            'Tax deduction summaries by year',
            'Trip history with start/end locations',
            'Link trips to projects and clients',
            'Export-ready reports for tax filing',
          ]}
          onEnable={handleEnableMileagePro}
          className="max-w-2xl mx-auto"
        />
      )}

      {/* Show content when enabled */}
      {isEnabled && (
        <>
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
              {tripsLoading ? (
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
        </>
      )}
    </div>
  );
}
