import { useState } from 'react';
import { Scissors, FileText, Sparkles, Loader2, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useSetup } from '@/hooks/useSetup';
import { SERVICE_LIBRARY } from '@/config/serviceLibrary';
import { PRICING, MENU_PRESETS_CONFIG } from '@/config/pricing';
import { cn } from '@/lib/utils';

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
  const { businessSector } = useSetup();
  const [selectedOption, setSelectedOption] = useState<'blank' | 'preset' | null>(null);

  // Get the preset configuration for the user's business sector
  const presetId = businessSector as keyof typeof MENU_PRESETS_CONFIG | null;
  const presetConfig = presetId ? MENU_PRESETS_CONFIG[presetId] : null;
  const hasPreset = presetConfig?.hasPreset ?? false;
  
  // Get preset services for preview
  const presetServices = businessSector 
    ? SERVICE_LIBRARY.find(cat => cat.id === businessSector)?.services || []
    : [];
  
  const sectorName = presetConfig?.name || 'Professional';

  const handleSelectBlank = () => {
    setSelectedOption('blank');
    onSelectBlank();
  };

  const handleSelectPreset = () => {
    if (!hasPreset || !businessSector) return;
    setSelectedOption('preset');
    onSelectPreset(businessSector);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[550px] [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5 text-primary" />
            Set Up Your Service Menu
          </DialogTitle>
          <DialogDescription>
            Choose how you'd like to start. All options give you a fully editable menu.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Blank Menu Option - FREE */}
          <button
            onClick={handleSelectBlank}
            disabled={loading}
            className={cn(
              "flex items-start gap-4 p-4 rounded-lg border-2 transition-all text-left group disabled:opacity-50",
              selectedOption === 'blank' 
                ? "border-primary bg-primary/5" 
                : "border-border hover:border-primary/50 hover:bg-accent/50"
            )}
          >
            <div className="p-3 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
              <FileText className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground">Continue with a blank service list</h3>
                <Badge variant="outline" className="text-green-600 border-green-600">Free</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Typing everything out works — this just saves time.
              </p>
            </div>
            {loading && selectedOption === 'blank' && (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            )}
          </button>

          {/* Import Ready-Made List ($3 upsell) */}
          {hasPreset && (
            <button
              onClick={handleSelectPreset}
              disabled={loading}
              className={cn(
                "flex flex-col gap-3 p-4 rounded-lg border-2 transition-all text-left group disabled:opacity-50",
                selectedOption === 'preset' 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50 hover:bg-accent/50"
              )}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10 text-primary transition-colors">
                  <ListChecks className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground">
                        Import a ready-made service list
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        <Sparkles className="h-3 w-3" />
                        {presetServices.length} Services
                      </span>
                    </div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      ${PRICING.PREPOPULATED_MENU_PRICE.toFixed(2)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    $3 = less typing. Same control, just faster.
                  </p>
                </div>
                {loading && selectedOption === 'preset' && (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                )}
              </div>
              
              {/* Preview of services */}
              <ScrollArea className="h-24 w-full bg-muted/30 rounded-lg p-2">
                <div className="grid gap-1 text-sm">
                  {presetServices.slice(0, 6).map((service, index) => (
                    <div key={index} className="flex justify-between items-center py-1 border-b border-border/30 last:border-0">
                      <span className="text-foreground text-xs">{service.name}</span>
                      <span className="text-muted-foreground text-xs font-medium">
                        ${service.price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {presetServices.length > 6 && (
                    <div className="text-center py-1 text-muted-foreground text-xs">
                      + {presetServices.length - 6} more...
                    </div>
                  )}
                </div>
              </ScrollArea>
            </button>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          You can always add, edit, or remove services later. Your menu is fully yours.
        </p>
      </DialogContent>
    </Dialog>
  );
}