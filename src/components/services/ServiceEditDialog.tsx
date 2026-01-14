import { useState, useRef } from 'react';
import { Camera, X, Palette, Mic } from 'lucide-react';
import { Service } from '@/types/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { COLOR_THEMES } from '@/config/servicePresets';
import { cn } from '@/lib/utils';

interface ServiceEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    price: number;
    duration?: number;
    thumbnailUrl?: string;
    bgColor?: string;
  }) => void;
  service?: Service | null;
  globalBgColor?: string;
}

// Simple image compression - resize to max 400px for thumbnails
async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 400;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ServiceEditDialog({
  open,
  onClose,
  onSave,
  service,
  globalBgColor,
}: ServiceEditDialogProps) {
  const [name, setName] = useState(service?.name || '');
  const [price, setPrice] = useState(service?.price?.toString() || '');
  const [duration, setDuration] = useState(service?.duration?.toString() || '');
  const [thumbnailUrl, setThumbnailUrl] = useState(service?.thumbnailUrl || '');
  const [bgColor, setBgColor] = useState(service?.bgColor || '');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setName(service?.name || '');
      setPrice(service?.price?.toString() || '');
      setDuration(service?.duration?.toString() || '');
      setThumbnailUrl(service?.thumbnailUrl || '');
      setBgColor(service?.bgColor || '');
      setShowColorPicker(false);
    } else {
      onClose();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsCompressing(true);
    try {
      const compressed = await compressImage(file);
      setThumbnailUrl(compressed);
    } catch (error) {
      console.error('Error compressing image:', error);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemoveImage = () => {
    setThumbnailUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    const priceNum = parseFloat(price);
    const durationNum = duration ? parseInt(duration) : undefined;

    if (!name.trim() || isNaN(priceNum) || priceNum < 0) {
      return;
    }

    onSave({
      name: name.trim(),
      price: priceNum,
      duration: durationNum,
      thumbnailUrl: thumbnailUrl || undefined,
      bgColor: bgColor || undefined,
    });
  };

  const effectiveBgColor = bgColor || globalBgColor;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{service ? 'Edit Service' : 'Add Service'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image Preview / Upload */}
          <div className="space-y-2">
            <Label>Service Image (optional)</Label>
            <div
              className={cn(
                'relative w-full h-32 rounded-lg border-2 border-dashed border-border overflow-hidden',
                'flex items-center justify-center cursor-pointer hover:border-primary transition-colors'
              )}
              style={{
                backgroundColor: effectiveBgColor ? `hsl(${effectiveBgColor})` : undefined,
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              {thumbnailUrl ? (
                <>
                  <img
                    src={thumbnailUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <div className="text-center">
                  <Camera className={cn(
                    'h-8 w-8 mx-auto mb-2',
                    effectiveBgColor ? 'text-white/60' : 'text-muted-foreground'
                  )} />
                  <p className={cn(
                    'text-sm',
                    effectiveBgColor ? 'text-white/60' : 'text-muted-foreground'
                  )}>
                    {isCompressing ? 'Compressing...' : 'Click to add image'}
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
          </div>

          {/* Color Picker Toggle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Background Color</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5"
                onClick={() => setShowColorPicker(!showColorPicker)}
              >
                <Palette className="h-3.5 w-3.5" />
                {showColorPicker ? 'Hide' : 'Choose Color'}
              </Button>
            </div>
            
            {showColorPicker && (
              <div className="grid grid-cols-4 gap-2">
                {/* Clear option */}
                <button
                  onClick={() => setBgColor('')}
                  className={cn(
                    'h-8 rounded border-2 flex items-center justify-center text-xs',
                    !bgColor ? 'border-primary' : 'border-border'
                  )}
                >
                  Default
                </button>
                {COLOR_THEMES.map((theme) => (
                  <button
                    key={theme.name}
                    onClick={() => setBgColor(theme.color)}
                    className={cn(
                      'h-8 rounded border-2 transition-all',
                      bgColor === theme.color ? 'border-primary scale-105' : 'border-transparent'
                    )}
                    style={{ backgroundColor: `hsl(${theme.color})` }}
                    title={theme.name}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Name */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="service-name">Service Name</Label>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                disabled
                title="Voice input coming soon"
              >
                <Mic className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>
            <Input
              id="service-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Haircut, Beard Trim"
            />
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="service-price">Price ($)</Label>
            <Input
              id="service-price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="service-duration">Duration (minutes, optional)</Label>
            <Input
              id="service-duration"
              type="number"
              min="0"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="30"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!name.trim() || !price}>
              {service ? 'Save Changes' : 'Add Service'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
