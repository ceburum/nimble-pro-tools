import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Package, Star, Check, Loader2, ShoppingCart, DollarSign, Sparkles } from 'lucide-react';
import { useProfessions } from '@/hooks/useProfessions';
import { useServiceMenuLibrary, useInstallServicePack } from '@/hooks/useServiceMenuLibrary';
import type { ServiceMenuLibrary } from '@/types/profession';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import { toast } from 'sonner';

interface ServiceLibraryBrowserProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installedPackIds?: string[];
}

export function ServiceLibraryBrowser({ open, onOpenChange, installedPackIds = [] }: ServiceLibraryBrowserProps) {
  const [search, setSearch] = useState('');
  const [selectedProfession, setSelectedProfession] = useState<string>('all');
  const [previewPack, setPreviewPack] = useState<ServiceMenuLibrary | null>(null);
  const [selectedPacks, setSelectedPacks] = useState<Set<string>>(new Set());

  const { data: professions = [] } = useProfessions();
  const { data: packs = [], isLoading } = useServiceMenuLibrary({ activeOnly: true });
  const installMutation = useInstallServicePack();

  const filteredPacks = packs.filter(pack => {
    const matchesSearch = !search || 
      pack.title.toLowerCase().includes(search.toLowerCase()) ||
      pack.description?.toLowerCase().includes(search.toLowerCase()) ||
      pack.profession?.display_name.toLowerCase().includes(search.toLowerCase());
    
    const matchesProfession = selectedProfession === 'all' || pack.profession_id === selectedProfession;

    return matchesSearch && matchesProfession;
  });

  const handleToggleSelect = (packId: string) => {
    if (isInstalled(packId)) return;
    
    setSelectedPacks(prev => {
      const next = new Set(prev);
      if (next.has(packId)) {
        next.delete(packId);
      } else {
        next.add(packId);
      }
      return next;
    });
  };

  const handleInstallSingle = async (packId: string) => {
    await installMutation.mutateAsync(packId);
    setPreviewPack(null);
  };

  const handleInstallSelected = async () => {
    if (selectedPacks.size === 0) return;
    
    const packIds = Array.from(selectedPacks);
    
    for (const packId of packIds) {
      await installMutation.mutateAsync(packId);
    }
    
    toast.success(`${packIds.length} pack(s) installed successfully!`);
    setSelectedPacks(new Set());
  };

  const isInstalled = (packId: string) => installedPackIds.includes(packId);
  const isSelected = (packId: string) => selectedPacks.has(packId);

  const selectedTotal = Array.from(selectedPacks).reduce((sum, packId) => {
    const pack = packs.find(p => p.id === packId);
    return sum + (pack?.price_cents || 0);
  }, 0);

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Service Menu Library
          </DialogTitle>
          <DialogDescription>
            Browse and install pre-built service packs for your profession
          </DialogDescription>
        </DialogHeader>

        {/* Filters */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search service packs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedProfession} onValueChange={setSelectedProfession}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All professions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Professions</SelectItem>
              {professions.map(profession => (
                <SelectItem key={profession.id} value={profession.id}>
                  {profession.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Pack Grid */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPacks.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No service packs found</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 pb-4">
              {filteredPacks.map(pack => {
                const installed = isInstalled(pack.id);
                const selected = isSelected(pack.id);
                
                return (
                  <Card 
                    key={pack.id} 
                    className={`cursor-pointer transition-all ${
                      installed 
                        ? 'opacity-60 border-muted' 
                        : selected 
                          ? 'border-primary ring-2 ring-primary/20' 
                          : 'hover:border-primary/50'
                    }`}
                    onClick={() => !installed && handleToggleSelect(pack.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {pack.profession && (
                            <div className="p-1.5 rounded-md bg-primary/10 shrink-0">
                              <DynamicIcon name={pack.profession.icon} className="h-4 w-4 text-primary" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <CardTitle className="text-sm font-medium truncate">{pack.title}</CardTitle>
                            {pack.profession && (
                              <p className="text-xs text-muted-foreground">{pack.profession.display_name}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {pack.is_featured && (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          )}
                          {installed ? (
                            <Badge variant="secondary" className="shrink-0">
                              <Check className="h-3 w-3 mr-1" />
                              Installed
                            </Badge>
                          ) : selected ? (
                            <Badge variant="default" className="shrink-0">
                              <Check className="h-3 w-3 mr-1" />
                              Selected
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="shrink-0 font-semibold">
                              {formatPrice(pack.price_cents)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-2">{pack.description}</p>
                      
                      {/* Preview Items */}
                      <div className="flex flex-wrap gap-1">
                        {pack.preview_items.slice(0, 3).map((item, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                        {pack.services.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{pack.services.length - 3} more
                          </Badge>
                        )}
                      </div>

                      {/* View Details Button */}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewPack(pack);
                        }}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Preview {pack.services.length} Services
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Floating Cart Bar */}
        {selectedPacks.size > 0 && (
          <div className="border-t pt-4 flex items-center justify-between gap-4 bg-background">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{selectedPacks.size} pack(s) selected</p>
                <p className="text-sm text-muted-foreground">
                  Total: {formatPrice(selectedTotal)}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setSelectedPacks(new Set())}
              >
                Clear
              </Button>
              <Button 
                onClick={handleInstallSelected}
                disabled={installMutation.isPending}
                className="gap-2"
              >
                {installMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Installing...
                  </>
                ) : (
                  <>
                    <DollarSign className="h-4 w-4" />
                    Purchase & Install
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Preview Dialog */}
        <Dialog open={!!previewPack} onOpenChange={() => setPreviewPack(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {previewPack?.profession && (
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <DynamicIcon name={previewPack.profession.icon} className="h-4 w-4 text-primary" />
                  </div>
                )}
                {previewPack?.title}
              </DialogTitle>
              <DialogDescription>
                {previewPack?.profession?.display_name}
              </DialogDescription>
            </DialogHeader>

            <p className="text-sm text-muted-foreground">{previewPack?.description}</p>

            <div className="flex items-center justify-between py-3 border-y">
              <span className="text-sm font-medium">
                {previewPack?.services.length} services included
              </span>
              <span className="text-lg font-bold text-primary">
                {formatPrice(previewPack?.price_cents || 0)}
              </span>
            </div>

            <ScrollArea className="max-h-[300px]">
              <div className="space-y-1">
                {previewPack?.services.map((service, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg text-sm"
                  >
                    <span>{service.name}</span>
                    <span className="font-medium">${service.price}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setPreviewPack(null)}>
                Close
              </Button>
              {previewPack && !isInstalled(previewPack.id) && (
                <Button 
                  className="flex-1 gap-2"
                  onClick={() => handleInstallSingle(previewPack.id)}
                  disabled={installMutation.isPending}
                >
                  {installMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Installing...
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4" />
                      Purchase {formatPrice(previewPack.price_cents)}
                    </>
                  )}
                </Button>
              )}
              {previewPack && isInstalled(previewPack.id) && (
                <Button className="flex-1" disabled>
                  <Check className="h-4 w-4 mr-2" />
                  Already Installed
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
