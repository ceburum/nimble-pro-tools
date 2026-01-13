import { useMemo, useRef, useState } from 'react';
import { Camera, Upload, X, Plus, Loader2 } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';

interface ProjectPhotoUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSave: (photos: ProjectPhoto[]) => void | Promise<void>;
}

interface PendingPhoto {
  id: string;
  dataUrl: string;
  type: 'before' | 'progress' | 'after';
  caption: string;
}

async function compressImageToJpegDataUrl(
  file: File,
  opts: { maxDimension: number; quality: number },
): Promise<string> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Failed to load image'));
      i.src = objectUrl;
    });

    const { maxDimension, quality } = opts;
    const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');

    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function ProjectPhotoUploadDialog({ open, onOpenChange, projectId, onSave }: ProjectPhotoUploadDialogProps) {
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [defaultType, setDefaultType] = useState<'before' | 'progress' | 'after'>('before');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const resetState = () => {
    setPendingPhotos([]);
    setDefaultType('before');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const totalApproxChars = useMemo(() => {
    // Rough proxy for storage usage; local storage limits are tight on mobile.
    return pendingPhotos.reduce((sum, p) => sum + p.dataUrl.length, 0);
  }, [pendingPhotos]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const typeAtSelection = defaultType;
    const selected = Array.from(files);

    const newPhotos: PendingPhoto[] = [];

    for (const file of selected) {
      try {
        const dataUrl = await compressImageToJpegDataUrl(file, { maxDimension: 1600, quality: 0.82 });

        // If a single photo is still huge, warn the user (saving may fail on some devices).
        if (dataUrl.length > 2_500_000) {
          toast({
            title: 'Photo is very large',
            description: 'This photo may not save on some devices. Try a smaller photo or fewer photos.',
            variant: 'destructive',
          });
        }

        newPhotos.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          dataUrl,
          type: typeAtSelection,
          caption: '',
        });
      } catch (err) {
        console.error('Failed to process image', err);
        toast({
          title: 'Could not add photo',
          description: 'Please try another image.',
          variant: 'destructive',
        });
      }
    }

    if (newPhotos.length > 0) {
      setPendingPhotos((prev) => [...prev, ...newPhotos]);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemovePhoto = (id: string) => {
    setPendingPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdatePhoto = (id: string, updates: Partial<PendingPhoto>) => {
    setPendingPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const closeDialog = () => {
    resetState();
    onOpenChange(false);
  };

  const handleSave = async () => {
    if (pendingPhotos.length === 0) return;

    // Guardrail: if the pending payload is huge, saving to local storage may silently fail.
    if (totalApproxChars > 6_000_000) {
      toast({
        title: 'Too many / too large photos',
        description: 'Try saving fewer photos at a time so they can be stored reliably.',
        variant: 'destructive',
      });
      return;
    }

    const photos: ProjectPhoto[] = pendingPhotos.map((p) => ({
      id: p.id,
      projectId,
      type: p.type,
      dataUrl: p.dataUrl,
      caption: p.caption || undefined,
      createdAt: new Date(),
    }));

    // Block dialog until save completes
    setIsSaving(true);
    try {
      await onSave(photos);
      closeDialog();
    } catch (error) {
      console.error('Error saving photos:', error);
      toast({
        title: 'Failed to save photos',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        // Prevent closing while saving
        if (isSaving) return;
        if (!nextOpen) resetState();
        onOpenChange(nextOpen);
      }}
    >
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
                        <img src={photo.dataUrl} alt="Project photo preview" className="w-full h-full object-cover rounded-md" loading="lazy" />
                        <Button
                          type="button"
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
            <Button type="button" variant="outline" className="w-full gap-2" onClick={() => fileInputRef.current?.click()}>
              <Plus className="h-4 w-4" />
              Add More Photos
            </Button>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={closeDialog} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={pendingPhotos.length === 0 || isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                `Save${pendingPhotos.length > 0 ? ` (${pendingPhotos.length})` : ''}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
