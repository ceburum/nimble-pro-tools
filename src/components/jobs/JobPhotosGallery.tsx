import { useState } from 'react';
import { JobPhoto } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Camera, Trash2, X, ZoomIn } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface JobPhotosGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photos: JobPhoto[];
  jobTitle: string;
  onDeletePhoto?: (photoId: string) => void;
}

export function JobPhotosGallery({ 
  open, 
  onOpenChange, 
  photos, 
  jobTitle,
  onDeletePhoto 
}: JobPhotosGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<JobPhoto | null>(null);
  
  const beforePhotos = photos.filter((p) => p.type === 'before');
  const afterPhotos = photos.filter((p) => p.type === 'after');

  const handleDelete = (photoId: string) => {
    if (onDeletePhoto) {
      onDeletePhoto(photoId);
      if (selectedPhoto?.id === photoId) {
        setSelectedPhoto(null);
      }
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              {jobTitle} Photos ({photos.length})
            </DialogTitle>
          </DialogHeader>

          {photos.length === 0 ? (
            <div className="text-center py-8">
              <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No photos yet</p>
              <p className="text-sm text-muted-foreground">
                Add before and after photos to document your work
              </p>
            </div>
          ) : (
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6">
                {beforePhotos.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                      <Badge variant="outline">Before</Badge>
                      {beforePhotos.length} photo{beforePhotos.length > 1 ? 's' : ''}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {beforePhotos.map((photo) => (
                        <div key={photo.id} className="space-y-1 group relative">
                          <div className="relative overflow-hidden rounded-lg">
                            <img
                              src={photo.dataUrl}
                              alt={photo.caption || 'Before photo'}
                              className="w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => setSelectedPhoto(photo)}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                              <Button
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setSelectedPhoto(photo)}
                              >
                                <ZoomIn className="h-4 w-4" />
                              </Button>
                              {onDeletePhoto && (
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleDelete(photo.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                          {photo.caption && (
                            <p className="text-xs text-muted-foreground">{photo.caption}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {afterPhotos.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                      <Badge className="bg-success/10 text-success border-success/20">After</Badge>
                      {afterPhotos.length} photo{afterPhotos.length > 1 ? 's' : ''}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {afterPhotos.map((photo) => (
                        <div key={photo.id} className="space-y-1 group relative">
                          <div className="relative overflow-hidden rounded-lg">
                            <img
                              src={photo.dataUrl}
                              alt={photo.caption || 'After photo'}
                              className="w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => setSelectedPhoto(photo)}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                              <Button
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setSelectedPhoto(photo)}
                              >
                                <ZoomIn className="h-4 w-4" />
                              </Button>
                              {onDeletePhoto && (
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleDelete(photo.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                          {photo.caption && (
                            <p className="text-xs text-muted-foreground">{photo.caption}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Full-size photo viewer */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="sm:max-w-[90vw] max-h-[90vh] p-0 overflow-hidden">
          {selectedPhoto && (
            <div className="relative">
              <img
                src={selectedPhoto.dataUrl}
                alt={selectedPhoto.caption || 'Photo'}
                className="w-full h-auto max-h-[85vh] object-contain"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                {onDeletePhoto && (
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(selectedPhoto.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => setSelectedPhoto(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {selectedPhoto.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-3">
                  <p className="text-sm">{selectedPhoto.caption}</p>
                  <Badge 
                    variant="outline" 
                    className="mt-1 text-white border-white/30"
                  >
                    {selectedPhoto.type}
                  </Badge>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
