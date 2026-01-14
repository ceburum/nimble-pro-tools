import { useState } from 'react';
import { Check, ListChecks, Loader2, FileText, Clock, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PreviewService } from '@/lib/serviceUtils';

interface MenuOptionsStepProps {
  sectorName: string;
  hasPreset: boolean;
  presetServices: PreviewService[];
  blankMenuPrice: number;
  prePopulatedPrice: number;
  onSelectBlankMenu: () => void;
  onSelectPrePopulated: () => void;
  onSelectNoMenu: () => void;
  onRequestMissingList: () => void;
  loading?: boolean;
  requestSent?: boolean;
}

export function MenuOptionsStep({
  sectorName,
  hasPreset,
  presetServices,
  blankMenuPrice,
  prePopulatedPrice,
  onSelectBlankMenu,
  onSelectPrePopulated,
  onSelectNoMenu,
  onRequestMissingList,
  loading = false,
  requestSent = false,
}: MenuOptionsStepProps) {
  const [selectedOption, setSelectedOption] = useState<'blank' | 'prepopulated' | 'skip' | null>(null);
  
  const isBlankFree = blankMenuPrice === 0;

  return (
    <div className="space-y-4">
      {/* Option 1: Blank Menu (Free) */}
      <Card className={cn(
        "border-2 transition-all cursor-pointer",
        selectedOption === 'blank' ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-full",
                selectedOption === 'blank' ? "bg-primary text-primary-foreground" : "bg-muted"
              )}>
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Continue with Blank Menu</CardTitle>
                <CardDescription>
                  Fully editable, add your own services
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-sm font-semibold text-green-600 border-green-600">
              Free
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground mb-4">
            Start with an empty service menu. Add, edit, and organize services your way.
            Perfect for building your own custom menu from scratch.
          </p>
          <Button
            onClick={() => {
              setSelectedOption('blank');
              onSelectBlankMenu();
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
              <>
                <Check className="h-4 w-4" />
                Continue with Blank Menu
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Option 2: Pre-Populated Menu Upgrade ($3) */}
      <Card className={cn(
        "border-2 transition-all",
        !hasPreset && "opacity-80",
        selectedOption === 'prepopulated' ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-full",
                selectedOption === 'prepopulated' ? "bg-primary text-primary-foreground" : "bg-muted"
              )}>
                <ListChecks className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Skip the typing — {sectorName} Menu
                  {!hasPreset && (
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Coming Soon
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {hasPreset 
                    ? `${presetServices.length} pre-configured services ready to customize`
                    : 'Industry-specific preset not yet available'
                  }
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="text-sm font-semibold bg-primary/10 text-primary">
              ${prePopulatedPrice.toFixed(2)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {hasPreset ? (
            <>
              <p className="text-sm text-muted-foreground mb-3">
                Get a head start with a full menu template. All services are fully editable — rename, reprice, or remove anything.
              </p>
              <ScrollArea className="h-28 pr-3 mb-4 bg-muted/30 rounded-lg p-2">
                <div className="grid gap-1.5 text-sm">
                  {presetServices.slice(0, 8).map((service, index) => (
                    <div key={index} className="flex justify-between items-center py-1 border-b border-border/30 last:border-0">
                      <span className="text-foreground">{service.name}</span>
                      <span className="text-muted-foreground font-medium">
                        ${service.price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {presetServices.length > 8 && (
                    <div className="text-center py-1.5 text-muted-foreground text-xs">
                      + {presetServices.length - 8} more services...
                    </div>
                  )}
                </div>
              </ScrollArea>
              <Button
                onClick={() => {
                  setSelectedOption('prepopulated');
                  onSelectPrePopulated();
                }}
                disabled={loading}
                className="w-full gap-2"
                variant={selectedOption === 'prepopulated' ? 'default' : 'outline'}
              >
                {loading && selectedOption === 'prepopulated' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Setting up your menu...
                  </>
                ) : (
                  <>
                    <ListChecks className="h-4 w-4" />
                    Get Full {sectorName} Menu (${prePopulatedPrice.toFixed(2)})
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                We're working on a pre-populated list for {sectorName} businesses. 
                Request this list and we'll notify you when it's available!
              </p>
              <Button
                onClick={onRequestMissingList}
                disabled={loading || requestSent}
                variant="outline"
                className="w-full gap-2"
              >
                {requestSent ? (
                  <>
                    <Check className="h-4 w-4" />
                    Request Sent!
                  </>
                ) : loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Request This List'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Option 3: No Menu / Skip (Free) */}
      <Card className={cn(
        "border-2 transition-all cursor-pointer",
        selectedOption === 'skip' ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-full",
                selectedOption === 'skip' ? "bg-primary text-primary-foreground" : "bg-muted"
              )}>
                <Ban className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">No Menu / Skip</CardTitle>
                <CardDescription>
                  Continue without setting up a menu
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-sm font-semibold text-muted-foreground">
              Free
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground mb-4">
            Skip menu setup for now. You can always add a service menu later 
            from the Service Menu page.
          </p>
          <Button
            onClick={() => {
              setSelectedOption('skip');
              onSelectNoMenu();
            }}
            disabled={loading}
            className="w-full gap-2"
            variant="ghost"
          >
            {loading && selectedOption === 'skip' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Setting up...
              </>
            ) : (
              'Skip for Now'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
