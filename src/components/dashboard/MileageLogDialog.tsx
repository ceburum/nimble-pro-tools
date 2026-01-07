import { useState } from 'react';
import { Car } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export interface MileageEntry {
  id: string;
  date: string;
  startLocation: string;
  endLocation: string;
  miles: number;
  purpose: string;
  createdAt: string;
}

interface MileageLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (entry: Omit<MileageEntry, 'id' | 'createdAt'>) => void;
}

export function MileageLogDialog({ open, onOpenChange, onSave }: MileageLogDialogProps) {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [miles, setMiles] = useState<number | ''>('');
  const [purpose, setPurpose] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!miles || miles <= 0) return;

    onSave({
      date,
      startLocation,
      endLocation,
      miles: Number(miles),
      purpose,
    });

    // Reset form
    setDate(new Date().toISOString().split('T')[0]);
    setStartLocation('');
    setEndLocation('');
    setMiles('');
    setPurpose('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Log Mileage
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startLocation">From</Label>
              <Input
                id="startLocation"
                placeholder="Start location"
                value={startLocation}
                onChange={(e) => setStartLocation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endLocation">To</Label>
              <Input
                id="endLocation"
                placeholder="End location"
                value={endLocation}
                onChange={(e) => setEndLocation(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="miles">Miles</Label>
            <Input
              id="miles"
              type="number"
              step="0.1"
              min="0"
              placeholder="0.0"
              value={miles}
              onChange={(e) => setMiles(e.target.value ? parseFloat(e.target.value) : '')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose (Optional)</Label>
            <Textarea
              id="purpose"
              placeholder="e.g., Client site visit, material pickup..."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!miles || miles <= 0}>
              Log Trip
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
