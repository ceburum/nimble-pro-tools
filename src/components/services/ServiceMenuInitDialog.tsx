import { useState } from 'react';
import { Scissors, FileText, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface ServiceMenuInitDialogProps {
  open: boolean;
  onSelectBlank: () => void;
  onSelectPreset: (presetId: string) => void;
  loading?: boolean;
}

export function ServiceMenuInitDialog({
  open,
  onSelectBlank,
  onSelectPreset,
  loading = false,
}: ServiceMenuInitDialogProps) {
  const [selectedOption, setSelectedOption] = useState<'blank' | 'preset' | null>(null);

  const handleSelect = (option: 'blank' | 'preset') => {
    setSelectedOption(option);
    if (option === 'blank') {
      onSelectBlank();
    } else {
      onSelectPreset('barber_shop');
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px] [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5 text-primary" />
            Set Up Your Service Menu
          </DialogTitle>
          <DialogDescription>
            How would you like to start building your service menu?
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Blank Menu Option */}
          <button
            onClick={() => handleSelect('blank')}
            disabled={loading}
            className="flex items-start gap-4 p-4 rounded-lg border border-border hover:border-primary hover:bg-accent/50 transition-all text-left group disabled:opacity-50"
          >
            <div className="p-3 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
              <FileText className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-foreground">Start Blank</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Create your own service menu from scratch. Add services one by one with custom names, prices, and images.
              </p>
            </div>
            {loading && selectedOption === 'blank' && (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            )}
          </button>

          {/* Prepopulated Barber Shop Option */}
          <button
            onClick={() => handleSelect('preset')}
            disabled={loading}
            className="flex items-start gap-4 p-4 rounded-lg border border-border hover:border-primary hover:bg-accent/50 transition-all text-left group disabled:opacity-50 relative overflow-hidden"
          >
            <div className="p-3 rounded-lg bg-[hsl(215_50%_23%)] text-white group-hover:bg-[hsl(215_50%_28%)] transition-colors">
              <Scissors className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-foreground">Barber Shop List</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  <Sparkles className="h-3 w-3" />
                  50 Services
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Start with 50 common barber services. Preview and customize before unlocking.
              </p>
              <p className="text-xs text-primary mt-2 font-medium">
                Professional navy theme included
              </p>
            </div>
            {loading && selectedOption === 'preset' && (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            )}
          </button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          You can always add more services or change your theme later.
        </p>
      </DialogContent>
    </Dialog>
  );
}
