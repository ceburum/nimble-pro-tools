import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, FileText, Package, Clock, Check } from 'lucide-react';
import { useServiceMenuLibrary, useInstallServicePack } from '@/hooks/useServiceMenuLibrary';
import { useProfession } from '@/hooks/useProfessions';
import type { ServiceMenuLibrary } from '@/types/profession';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import { cn } from '@/lib/utils';

interface ServiceMenuSetupStepProps {
  professionId: string | null;
  onSelectBlank: () => void;
  onSelectPack: (packId: string) => Promise<void>;
  onSkip: () => void;
  loading?: boolean;
}

export function ServiceMenuSetupStep({ 
  professionId,
  onSelectBlank,
  onSelectPack,
  onSkip,
  loading = false,
}: ServiceMenuSetupStepProps) {
  const [selectedOption, setSelectedOption] = React.useState<'blank' | 'pack' | null>(null);
  const [selectedPackId, setSelectedPackId] = React.useState<string | null>(null);

  const { data: profession } = useProfession(professionId || undefined);
  const { data: packs = [], isLoading: packsLoading } = useServiceMenuLibrary({
    professionId: professionId && professionId !== 'other' ? professionId : undefined,
    availableInSetup: true,
    activeOnly: true,
  });

  const availablePack = packs[0]; // Use first available pack for the profession

  const handleSelectBlank = () => {
    setSelectedOption('blank');
    setSelectedPackId(null);
    onSelectBlank();
  };

  const handleSelectPack = async (pack: ServiceMenuLibrary) => {
    setSelectedOption('pack');
    setSelectedPackId(pack.id);
    await onSelectPack(pack.id);
  };

  if (packsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasPacks = packs.length > 0 && professionId !== 'other';

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Set Up Your Service Menu</h3>
        <p className="text-sm text-muted-foreground">
          {hasPacks 
            ? `Choose how to set up your ${profession?.display_name || 'service'} menu`
            : 'Start with a blank menu or skip for now'
          }
        </p>
      </div>

      <div className="grid gap-4">
        {/* Blank Menu Option */}
        <Card
          className={cn(
            "cursor-pointer transition-all hover:border-primary",
            selectedOption === 'blank' && "border-primary bg-primary/5"
          )}
          onClick={handleSelectBlank}
        >
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-3 rounded-lg bg-muted">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">Start with a Blank Menu</h4>
                <Badge variant="secondary">Free</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Create your own services from scratch
              </p>
            </div>
            {selectedOption === 'blank' && (
              <Check className="h-5 w-5 text-primary" />
            )}
          </CardContent>
        </Card>

        {/* Pre-made Pack Option */}
        {hasPacks && availablePack && (
          <Card
            className={cn(
              "cursor-pointer transition-all hover:border-primary",
              selectedOption === 'pack' && "border-primary bg-primary/5"
            )}
            onClick={() => handleSelectPack(availablePack)}
          >
            <CardContent className="py-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{availablePack.title}</h4>
                    <Badge>${(availablePack.price_cents / 100).toFixed(2)}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {availablePack.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {availablePack.preview_items.slice(0, 4).map((item, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {item}
                      </Badge>
                    ))}
                    {availablePack.services.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{availablePack.services.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>
                {selectedOption === 'pack' && selectedPackId === availablePack.id && (
                  <Check className="h-5 w-5 text-primary mt-1" />
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Coming Soon for professions without packs */}
        {!hasPacks && professionId !== 'other' && (
          <Card className="opacity-60">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="p-3 rounded-lg bg-muted">
                <Clock className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">Pre-made Menu</h4>
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  A professional service list for your industry is in development
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Skip Option */}
      <div className="pt-4 text-center">
        <Button 
          variant="ghost" 
          onClick={onSkip}
          disabled={loading}
        >
          Skip for now
        </Button>
        <p className="text-xs text-muted-foreground mt-1">
          You can always set up your menu later
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}
