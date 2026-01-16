import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Package, Star, Check, Loader2 } from 'lucide-react';
import { useProfessions } from '@/hooks/useProfessions';
import { useServiceMenuLibrary, useInstallServicePack } from '@/hooks/useServiceMenuLibrary';
import type { ServiceMenuLibrary, Profession } from '@/types/profession';
import { DynamicIcon } from '@/components/ui/dynamic-icon';

interface ServiceLibraryBrowserProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installedPackIds?: string[];
}

export function ServiceLibraryBrowser({ open, onOpenChange, installedPackIds = [] }: ServiceLibraryBrowserProps) {
  const [search, setSearch] = useState('');
  const [selectedProfession, setSelectedProfession] = useState<string>('all');
  const [previewPack, setPreviewPack] = useState<ServiceMenuLibrary | null>(null);

  const { data: professions = [] } = useProfessions();
  const { data: packs = [], isLoading } = useServiceMenuLibrary();
  const installMutation = useInstallServicePack();

  const filteredPacks = packs.filter(pack => {
    const matchesSearch = !search || 
      pack.title.toLowerCase().includes(search.toLowerCase()) ||
      pack.description?.toLowerCase().includes(search.toLowerCase());
    
    const matchesProfession = selectedProfession === 'all' || pack.profession_id === selectedProfession;

    return matchesSearch && matchesProfession;
  });

  const handleInstall = async (packId: string) => {
    await installMutation.mutateAsync(packId);
    setPreviewPack(null);
  };

  const isInstalled = (packId: string) => installedPackIds.includes(packId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Service Menu Library
          </DialogTitle>
        </DialogHeader>

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

        <ScrollArea className="flex-1 -mx-6 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPacks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No service packs found
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredPacks.map(pack => (
                <Card 
                  key={pack.id} 
                  className={`cursor-pointer transition-all hover:border-primary ${
                    isInstalled(pack.id) ? 'opacity-60' : ''
                  }`}
                  onClick={() => setPreviewPack(pack)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {pack.profession && (
                          <DynamicIcon name={pack.profession.icon} className="h-5 w-5 text-primary" />
                        )}
                        <CardTitle className="text-base">{pack.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        {pack.is_featured && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                        {isInstalled(pack.id) ? (
                          <Badge variant="secondary">
                            <Check className="h-3 w-3 mr-1" />
                            Installed
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            ${(pack.price_cents / 100).toFixed(2)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">{pack.description}</p>
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Preview Dialog */}
        <Dialog open={!!previewPack} onOpenChange={() => setPreviewPack(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {previewPack?.profession && (
                  <DynamicIcon name={previewPack.profession.icon} className="h-5 w-5" />
                )}
                {previewPack?.title}
              </DialogTitle>
            </DialogHeader>

            <p className="text-sm text-muted-foreground">{previewPack?.description}</p>

            <div className="flex items-center justify-between py-2 border-y">
              <span className="text-sm font-medium">
                {previewPack?.services.length} services included
              </span>
              <span className="text-lg font-bold">
                ${previewPack ? (previewPack.price_cents / 100).toFixed(2) : '0.00'}
              </span>
            </div>

            <ScrollArea className="max-h-[300px]">
              <div className="space-y-2">
                {previewPack?.services.map((service, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg"
                  >
                    <span className="text-sm">{service.name}</span>
                    <span className="text-sm font-medium">${service.price}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setPreviewPack(null)}>
                Cancel
              </Button>
              <Button 
                className="flex-1"
                onClick={() => previewPack && handleInstall(previewPack.id)}
                disabled={!previewPack || isInstalled(previewPack.id) || installMutation.isPending}
              >
                {installMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Installing...
                  </>
                ) : isInstalled(previewPack?.id || '') ? (
                  'Already Installed'
                ) : (
                  'Install Pack'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
