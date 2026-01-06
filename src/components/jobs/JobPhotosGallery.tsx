import { JobPhoto } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Camera } from 'lucide-react';

interface JobPhotosGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photos: JobPhoto[];
  jobTitle: string;
}

export function JobPhotosGallery({ open, onOpenChange, photos, jobTitle }: JobPhotosGalleryProps) {
  const beforePhotos = photos.filter((p) => p.type === 'before');
  const afterPhotos = photos.filter((p) => p.type === 'after');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {jobTitle} Photos
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
          <div className="space-y-6">
            {beforePhotos.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <Badge variant="outline">Before</Badge>
                  {beforePhotos.length} photo{beforePhotos.length > 1 ? 's' : ''}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {beforePhotos.map((photo) => (
                    <div key={photo.id} className="space-y-1">
                      <img
                        src={photo.dataUrl}
                        alt={photo.caption || 'Before photo'}
                        className="w-full h-32 object-cover rounded-lg"
                      />
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
                  <Badge className="bg-success/10 text-success">After</Badge>
                  {afterPhotos.length} photo{afterPhotos.length > 1 ? 's' : ''}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {afterPhotos.map((photo) => (
                    <div key={photo.id} className="space-y-1">
                      <img
                        src={photo.dataUrl}
                        alt={photo.caption || 'After photo'}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      {photo.caption && (
                        <p className="text-xs text-muted-foreground">{photo.caption}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
