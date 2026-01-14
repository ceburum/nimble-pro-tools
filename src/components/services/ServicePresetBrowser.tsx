import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Scissors, ShoppingBag, Sparkles, Check, Lock, DollarSign } from 'lucide-react';
import { useAppState } from '@/hooks/useAppState';
import { toast } from 'sonner';

interface ServicePreset {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  price: number;
  icon: 'scissors' | 'sparkles' | 'shopping';
  category: string;
  isPurchased?: boolean;
}

const AVAILABLE_PRESETS: ServicePreset[] = [
  {
    id: 'barber_shop',
    name: 'Barber Shop',
    description: 'Classic barber services including cuts, fades, shaves, and beard trims',
    itemCount: 50,
    price: 2.00,
    icon: 'scissors',
    category: 'Hair & Beauty',
  },
  {
    id: 'hair_salon',
    name: 'Hair Salon',
    description: 'Full salon services: cuts, color, highlights, treatments, and styling',
    itemCount: 65,
    price: 2.00,
    icon: 'scissors',
    category: 'Hair & Beauty',
  },
  {
    id: 'nail_salon',
    name: 'Nail Salon',
    description: 'Manicures, pedicures, gel, acrylics, nail art, and spa treatments',
    itemCount: 45,
    price: 2.00,
    icon: 'sparkles',
    category: 'Hair & Beauty',
  },
  {
    id: 'spa_wellness',
    name: 'Spa & Wellness',
    description: 'Massages, facials, body treatments, and relaxation services',
    itemCount: 40,
    price: 2.00,
    icon: 'sparkles',
    category: 'Hair & Beauty',
  },
  {
    id: 'auto_detailing',
    name: 'Auto Detailing',
    description: 'Interior/exterior detailing, paint correction, ceramic coating',
    itemCount: 35,
    price: 2.00,
    icon: 'sparkles',
    category: 'Automotive',
  },
  {
    id: 'cleaning_services',
    name: 'Cleaning Services',
    description: 'Residential and commercial cleaning, deep cleaning, move-out services',
    itemCount: 30,
    price: 2.00,
    icon: 'sparkles',
    category: 'Home Services',
  },
  {
    id: 'handyman',
    name: 'Handyman Services',
    description: 'General repairs, installations, maintenance, and odd jobs',
    itemCount: 55,
    price: 2.00,
    icon: 'shopping',
    category: 'Home Services',
  },
  {
    id: 'pet_grooming',
    name: 'Pet Grooming',
    description: 'Dog and cat grooming, bathing, nail trimming, and styling',
    itemCount: 25,
    price: 2.00,
    icon: 'sparkles',
    category: 'Pet Services',
  },
];

interface ServicePresetBrowserProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPurchasePreset: (presetId: string) => Promise<boolean>;
  purchasedPresets?: string[];
}

export function ServicePresetBrowser({
  open,
  onOpenChange,
  onPurchasePreset,
  purchasedPresets = [],
}: ServicePresetBrowserProps) {
  const { hasAccess } = useAppState();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<ServicePreset | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const filteredPresets = AVAILABLE_PRESETS.filter(preset =>
    preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    preset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    preset.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = [...new Set(filteredPresets.map(p => p.category))];

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'scissors':
        return <Scissors className="h-5 w-5" />;
      case 'sparkles':
        return <Sparkles className="h-5 w-5" />;
      default:
        return <ShoppingBag className="h-5 w-5" />;
    }
  };

  const handlePurchase = async () => {
    if (!selectedPreset) return;
    
    setIsPurchasing(true);
    try {
      const success = await onPurchasePreset(selectedPreset.id);
      if (success) {
        toast.success(`${selectedPreset.name} added to your menu!`);
        setSelectedPreset(null);
      }
    } catch (error) {
      toast.error('Purchase failed. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Service Menu Presets
            </DialogTitle>
            <DialogDescription>
              Browse pre-populated service lists for your business type. Just $2 each!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search presets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Presets by Category */}
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {categories.map(category => (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                      {category}
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {filteredPresets
                        .filter(p => p.category === category)
                        .map(preset => {
                          const isPurchased = purchasedPresets.includes(preset.id);
                          return (
                            <button
                              key={preset.id}
                              onClick={() => !isPurchased && setSelectedPreset(preset)}
                              disabled={isPurchased}
                              className={`flex items-start gap-3 p-4 rounded-lg border text-left transition-all ${
                                isPurchased
                                  ? 'border-success/30 bg-success/5 cursor-default'
                                  : 'border-border hover:border-primary hover:bg-accent/50'
                              }`}
                            >
                              <div className={`p-2 rounded-lg ${
                                isPurchased ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'
                              }`}>
                                {isPurchased ? <Check className="h-5 w-5" /> : getIcon(preset.icon)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-sm truncate">{preset.name}</h4>
                                  {isPurchased ? (
                                    <Badge variant="outline" className="text-success border-success/30">
                                      Owned
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-xs">
                                      ${preset.price.toFixed(2)}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                  {preset.description}
                                </p>
                                <p className="text-xs text-primary mt-1">
                                  {preset.itemCount} services included
                                </p>
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Purchase Confirmation Dialog */}
      <Dialog open={!!selectedPreset} onOpenChange={() => setSelectedPreset(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add {selectedPreset?.name} to Menu</DialogTitle>
            <DialogDescription>
              {selectedPreset?.itemCount} services will be added to your service menu.
            </DialogDescription>
          </DialogHeader>

          {selectedPreset && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {getIcon(selectedPreset.icon)}
                      </div>
                      <div>
                        <p className="font-medium">{selectedPreset.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedPreset.itemCount} services
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">${selectedPreset.price.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">one-time</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <p className="text-sm text-muted-foreground">
                You can customize, rename, or remove any services after adding them to your menu.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPreset(null)}>
              Cancel
            </Button>
            <Button onClick={handlePurchase} disabled={isPurchasing}>
              <DollarSign className="h-4 w-4 mr-1" />
              {isPurchasing ? 'Processing...' : `Purchase for $${selectedPreset?.price.toFixed(2)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
