import { useState, useMemo } from 'react';
import { ProjectPhoto } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Camera, Trash2, Download, Check, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { DismissibleBanner } from '@/components/ui/dismissible-banner';

interface PhotoFilterGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photos: ProjectPhoto[];
  projectTitle: string;
  onSaveChanges: (keepPhotoIds: string[], deletePhotoIds: string[]) => void;
}

export function PhotoFilterGallery({
  open,
  onOpenChange,
  photos,
  projectTitle,
  onSaveChanges,
}: PhotoFilterGalleryProps) {
  const { toast } = useToast();
  const [selectedToKeep, setSelectedToKeep] = useState<Set<string>>(new Set());

  // Group photos by type
  const groupedPhotos = useMemo(() => {
    const groups = {
      before: photos.filter((p) => p.type === 'before'),
      progress: photos.filter((p) => p.type === 'progress'),
      after: photos.filter((p) => p.type === 'after'),
    };
    return groups;
  }, [photos]);

  const photosToDelete = useMemo(() => {
    return photos.filter((p) => !selectedToKeep.has(p.id));
  }, [photos, selectedToKeep]);

  const togglePhoto = (photoId: string) => {
    setSelectedToKeep((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedToKeep(new Set(photos.map((p) => p.id)));
  };

  const selectNone = () => {
    setSelectedToKeep(new Set());
  };

  const selectType = (type: 'before' | 'progress' | 'after') => {
    const typePhotos = photos.filter((p) => p.type === type);
    setSelectedToKeep((prev) => {
      const next = new Set(prev);
      typePhotos.forEach((p) => next.add(p.id));
      return next;
    });
  };

  const handleExport = async () => {
    const selectedPhotos = photos.filter((p) => selectedToKeep.has(p.id));
    if (selectedPhotos.length === 0) {
      toast({ title: 'No photos selected', variant: 'destructive' });
      return;
    }

    // Download each selected photo
    for (const photo of selectedPhotos) {
      const link = document.createElement('a');
      link.href = photo.dataUrl;
      link.download = `${projectTitle.replace(/[^a-z0-9]/gi, '_')}_${photo.type}_${photo.id.slice(0, 8)}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Small delay between downloads
      await new Promise((r) => setTimeout(r, 200));
    }

    toast({ title: `Exported ${selectedPhotos.length} photo(s)` });
  };

  const handleConfirm = () => {
    const keepIds = Array.from(selectedToKeep);
    const deleteIds = photos.filter((p) => !selectedToKeep.has(p.id)).map((p) => p.id);

    onSaveChanges(keepIds, deleteIds);
    toast({
      title: `Saved ${keepIds.length} photos, deleted ${deleteIds.length} photos`,
    });
    onOpenChange(false);
  };

  const renderPhotoGroup = (title: string, groupPhotos: ProjectPhoto[], badgeVariant: 'outline' | 'default') => {
    if (groupPhotos.length === 0) return null;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Badge variant={badgeVariant}>{title}</Badge>
            {groupPhotos.length} photo{groupPhotos.length > 1 ? 's' : ''}
          </h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => selectType(title.toLowerCase() as 'before' | 'progress' | 'after')}
          >
            Select All {title}
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {groupPhotos.map((photo) => {
            const isSelected = selectedToKeep.has(photo.id);
            return (
              <div
                key={photo.id}
                className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-transparent opacity-60 hover:opacity-80'
                }`}
                onClick={() => togglePhoto(photo.id)}
              >
                <img
                  src={photo.dataUrl}
                  alt={photo.caption || `${title} photo`}
                  className="w-full h-24 object-cover"
                />
                <div
                  className={`absolute top-1 right-1 h-5 w-5 rounded flex items-center justify-center ${
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted/80'
                  }`}
                >
                  {isSelected ? <Check className="h-3 w-3" /> : null}
                </div>
                {!isSelected && (
                  <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                    <Trash2 className="h-6 w-6 text-red-500" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Filter Photos - {projectTitle}
          </DialogTitle>
        </DialogHeader>

        <DismissibleBanner variant="info" storageKey="photo_filter_help">
          Tap photos to mark them as "keep". Unmarked photos will be deleted when you confirm.
        </DismissibleBanner>

        <div className="flex gap-2 mb-2">
          <Button type="button" variant="outline" size="sm" onClick={selectAll}>
            <Check className="h-3 w-3 mr-1" />
            Keep All
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={selectNone}>
            <X className="h-3 w-3 mr-1" />
            Clear Selection
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={selectedToKeep.size === 0}
          >
            <Download className="h-3 w-3 mr-1" />
            Export Selected
          </Button>
        </div>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {renderPhotoGroup('Before', groupedPhotos.before, 'outline')}
            {renderPhotoGroup('Progress', groupedPhotos.progress, 'outline')}
            {renderPhotoGroup('After', groupedPhotos.after, 'default')}
          </div>
        </ScrollArea>

        <DialogFooter className="mt-4 pt-4 border-t">
          <div className="flex-1 text-sm text-muted-foreground">
            Keeping {selectedToKeep.size} of {photos.length} photos
            {photosToDelete.length > 0 && (
              <span className="text-destructive ml-2">
                ({photosToDelete.length} will be deleted)
              </span>
            )}
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} variant={photosToDelete.length > 0 ? 'destructive' : 'default'}>
            {photosToDelete.length > 0 ? `Delete ${photosToDelete.length} & Save` : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
