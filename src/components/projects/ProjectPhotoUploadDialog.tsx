import { useState, useRef } from 'react';
import { Camera, Upload, X, Plus } from 'lucide-react';
import { ProjectPhoto } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ProjectPhotoUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSave: (photos: ProjectPhoto[]) => void;
}

interface PendingPhoto {
  id: string;
  dataUrl: string;
  type: 'before' | 'progress' | 'after';
  caption: string;
}

export function ProjectPhotoUploadDialog({ open, onOpenChange, projectId, onSave }: ProjectPhotoUploadDialogProps) {
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [defaultType, setDefaultType] = useState<'before' | 'progress' | 'after'>('before');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newPhoto: PendingPhoto = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          dataUrl: reader.result as string,
          type: defaultType,
          caption: '',
        };
        setPendingPhotos((prev) => [...prev, newPhoto]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemovePhoto = (id: string) => {
    setPendingPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdatePhoto = (id: string, updates: Partial<PendingPhoto>) => {
    setPendingPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const handleSave = () => {
    if (pendingPhotos.length === 0) return;

    const photos: ProjectPhoto[] = pendingPhotos.map((p) => ({
      id: p.id,
      projectId,
      type: p.type,
      dataUrl: p.dataUrl,
      caption: p.caption || undefined,
      createdAt: new Date(),
    }));

    onSave(photos);
    handleClose();
  };

  const handleClose = () => {
    setPendingPhotos([]);
    setDefaultType('before');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Add Project Photos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="space-y-2">
            <Label>Default Photo Type</Label>
            <RadioGroup
              value={defaultType}
              onValueChange={(v) => setDefaultType(v as 'before' | 'progress' | 'after')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="before" id="before" />
                <Label htmlFor="before" className="cursor-pointer">Before</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="progress" id="progress" />
                <Label htmlFor="progress" className="cursor-pointer">Progress</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="after" id="after" />
                <Label htmlFor="after" className="cursor-pointer">After</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.removeAttribute('multiple');
                  fileInputRef.current.setAttribute('capture', 'environment');
                  fileInputRef.current.click();
                }
              }}
              className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
            >
              <Camera className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Take Photo</p>
            </div>
            <div
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.removeAttribute('capture');
                  fileInputRef.current.setAttribute('multiple', 'true');
                  fileInputRef.current.click();
                }
              }}
              className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
            >
              <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Choose Files</p>
            </div>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

          {pendingPhotos.length > 0 && (
            <div className="flex-1 overflow-hidden">
              <Label className="mb-2 block">Photos to add ({pendingPhotos.length})</Label>
              <ScrollArea className="h-[200px] rounded-lg border border-border p-2">
                <div className="space-y-3">
                  {pendingPhotos.map((photo) => (
                    <div key={photo.id} className="flex gap-3 p-2 bg-muted/50 rounded-lg">
                      <div className="relative w-20 h-20 flex-shrink-0">
                        <img src={photo.dataUrl} alt="Preview" className="w-full h-full object-cover rounded-md" />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => handleRemovePhoto(photo.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex-1 space-y-2">
                        <RadioGroup
                          value={photo.type}
                          onValueChange={(v) => handleUpdatePhoto(photo.id, { type: v as 'before' | 'progress' | 'after' })}
                          className="flex gap-2"
                        >
                          <div className="flex items-center space-x-1">
                            <RadioGroupItem value="before" id={`${photo.id}-before`} />
                            <Label htmlFor={`${photo.id}-before`} className="text-xs cursor-pointer">Before</Label>
                          </div>
                          <div className="flex items-center space-x-1">
                            <RadioGroupItem value="progress" id={`${photo.id}-progress`} />
                            <Label htmlFor={`${photo.id}-progress`} className="text-xs cursor-pointer">Progress</Label>
                          </div>
                          <div className="flex items-center space-x-1">
                            <RadioGroupItem value="after" id={`${photo.id}-after`} />
                            <Label htmlFor={`${photo.id}-after`} className="text-xs cursor-pointer">After</Label>
                          </div>
                        </RadioGroup>
                        <Input
                          value={photo.caption}
                          onChange={(e) => handleUpdatePhoto(photo.id, { caption: e.target.value })}
                          placeholder="Caption (optional)"
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {pendingPhotos.length > 0 && (
            <Button variant="outline" className="w-full gap-2" onClick={() => fileInputRef.current?.click()}>
              <Plus className="h-4 w-4" />
              Add More Photos
            </Button>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={pendingPhotos.length === 0}>
              Save {pendingPhotos.length > 0 && `(${pendingPhotos.length})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
