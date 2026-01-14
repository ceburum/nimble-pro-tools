import { useState } from 'react';
import { Check, Scissors, ListChecks, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PreviewService } from '@/lib/serviceUtils';

interface MenuUpsellStepProps {
  services: PreviewService[];
  presetName: string;
  price: number;
  onSelectPurchase: () => void;
  onSelectFree: () => void;
  onSkip: () => void;
  loading?: boolean;
}

export function MenuUpsellStep({
  services,
  presetName,
  price,
  onSelectPurchase,
  onSelectFree,
  onSkip,
  loading = false,
}: MenuUpsellStepProps) {
  const [selectedOption, setSelectedOption] = useState<'purchase' | 'blank' | null>(null);

  return (
    <div className="space-y-6">
      {/* Preset Preview */}
      <Card className={cn(
        "border-2 transition-all cursor-pointer",
        selectedOption === 'purchase' ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-full",
                selectedOption === 'purchase' ? "bg-primary text-primary-foreground" : "bg-muted"
              )}>
                <Scissors className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">{presetName} Menu</CardTitle>
                <CardDescription>
                  {services.length} pre-configured services
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="text-sm">
              ${price.toFixed(2)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <button
            onClick={() => setSelectedOption('purchase')}
            className="w-full text-left"
            disabled={loading}
          >
            <ScrollArea className="h-40 pr-3">
              <div className="grid gap-1.5 text-sm">
                {services.slice(0, 15).map((service, index) => (
                  <div key={index} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
                    <span className="text-foreground">{service.name}</span>
                    <span className="text-muted-foreground font-medium">
                      ${service.price.toFixed(2)}
                    </span>
                  </div>
                ))}
                {services.length > 15 && (
                  <div className="text-center py-2 text-muted-foreground">
                    + {services.length - 15} more services...
                  </div>
                )}
              </div>
            </ScrollArea>
          </button>
          
          <Button
            onClick={() => {
              setSelectedOption('purchase');
              onSelectPurchase();
            }}
            disabled={loading}
            className="w-full mt-4 gap-2"
            variant={selectedOption === 'purchase' ? 'default' : 'outline'}
          >
            {loading && selectedOption === 'purchase' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Get {presetName} Menu (${price.toFixed(2)})
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Blank Menu Option */}
      <Card className={cn(
        "border-2 transition-all cursor-pointer",
        selectedOption === 'blank' ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-full",
              selectedOption === 'blank' ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
              <ListChecks className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Start with Blank Menu</CardTitle>
              <CardDescription>
                Add your own services manually
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground mb-4">
            Create your service menu from scratch. You can add, edit, and customize 
            services anytime from your Service Menu page.
          </p>
          <Button
            onClick={() => {
              setSelectedOption('blank');
              onSelectFree();
            }}
            disabled={loading}
            className="w-full gap-2"
            variant={selectedOption === 'blank' ? 'default' : 'outline'}
          >
            {loading && selectedOption === 'blank' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Setting up...
              </>
            ) : (
              'Continue with Blank Menu (Free)'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Skip entirely */}
      <div className="text-center">
        <Button
          variant="ghost"
          onClick={onSkip}
          disabled={loading}
          className="text-muted-foreground hover:text-foreground"
        >
          Skip for now
        </Button>
        <p className="text-xs text-muted-foreground mt-1">
          You can set up your menu later
        </p>
      </div>
    </div>
  );
}