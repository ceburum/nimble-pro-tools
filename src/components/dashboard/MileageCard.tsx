import { useState } from 'react';
import { Car, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MileageLogDialog, MileageEntry } from './MileageLogDialog';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';

export function MileageCard() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [mileageEntries, setMileageEntries] = useLocalStorage<MileageEntry[]>('ceb-mileage', []);
  const { toast } = useToast();

  // Calculate this week's miles
  const getWeekStart = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Sunday
    const weekStart = new Date(now.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  };

  const weekStart = getWeekStart();
  const weeklyMiles = mileageEntries
    .filter((entry) => new Date(entry.date) >= weekStart)
    .reduce((sum, entry) => sum + entry.miles, 0);

  const totalMiles = mileageEntries.reduce((sum, entry) => sum + entry.miles, 0);

  const handleSave = (data: Omit<MileageEntry, 'id' | 'createdAt'>) => {
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

  return (
    <>
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Car className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">This Week</p>
              <p className="text-xl font-bold text-card-foreground">
                {weeklyMiles.toLocaleString('en-US', { maximumFractionDigits: 1 })} miles
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-muted-foreground">Total Logged</p>
              <p className="text-sm font-medium text-card-foreground">
                {totalMiles.toLocaleString('en-US', { maximumFractionDigits: 1 })} mi
              </p>
            </div>
            <Button onClick={() => setIsDialogOpen(true)} size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Log Mileage
            </Button>
          </div>
        </div>
      </div>

      <MileageLogDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSave}
      />
    </>
  );
}
