import { Sparkles, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PRICING } from '@/config/pricing';

interface ServiceMenuPreviewBannerProps {
  onUnlock: () => void;
  onDiscard: () => void;
  presetName?: string;
}

export function ServiceMenuPreviewBanner({
  onUnlock,
  onDiscard,
  presetName = 'Barber Shop',
}: ServiceMenuPreviewBannerProps) {
  return (
    <div className="sticky top-0 z-10 bg-gradient-to-r from-[hsl(215_50%_23%)] to-[hsl(215_19%_35%)] text-white rounded-lg p-4 mb-6 shadow-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-white/10">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium">
              Previewing {presetName} Menu
            </p>
            <p className="text-sm text-white/80 mt-0.5">
              Edit and customize freely. Changes are saved when you unlock.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="ghost"
            size="sm"
            className="text-white/80 hover:text-white hover:bg-white/10"
            onClick={onDiscard}
          >
            <X className="h-4 w-4 mr-1" />
            Start Fresh
          </Button>
          <Button
            size="sm"
            className="bg-white text-[hsl(215_50%_23%)] hover:bg-white/90 flex-1 sm:flex-none"
            onClick={onUnlock}
          >
            Unlock for ${PRICING.SERVICE_MENU_PRICE}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
