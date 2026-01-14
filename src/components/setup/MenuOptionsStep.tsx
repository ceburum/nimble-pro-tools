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

  return (
    <div className="space-y-4">
      {/* Option 1: Blank Menu ($3) */}
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
                <CardTitle className="text-lg">Blank Menu</CardTitle>
                <CardDescription>
                  Fully editable, add your own services
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="text-sm font-semibold">
              ${blankMenuPrice.toFixed(2)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground mb-4">
            Start with an empty service menu. Perfect if you want complete control 
            over your service list. Add, edit, and organize services your way.
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
                Processing...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Get Blank Menu (${blankMenuPrice.toFixed(2)})
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Option 2: Pre-Populated List ($2) */}
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
                  {sectorName} Menu
                  {!hasPreset && (
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Coming Soon
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {hasPreset 
                    ? `${presetServices.length} pre-configured services (editable)`
                    : 'Industry-specific preset not yet available'
                  }
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="text-sm font-semibold">
              ${prePopulatedPrice.toFixed(2)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {hasPreset ? (
            <>
              <ScrollArea className="h-32 pr-3 mb-4">
                <div className="grid gap-1.5 text-sm">
                  {presetServices.slice(0, 10).map((service, index) => (
                    <div key={index} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
                      <span className="text-foreground">{service.name}</span>
                      <span className="text-muted-foreground font-medium">
                        ${service.price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {presetServices.length > 10 && (
                    <div className="text-center py-2 text-muted-foreground">
                      + {presetServices.length - 10} more services...
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
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Get {sectorName} Menu (${prePopulatedPrice.toFixed(2)})
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
