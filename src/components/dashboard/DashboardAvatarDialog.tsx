import { useState, useRef } from 'react';
import { Upload, Trash2, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface DashboardAvatarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentImageUrl: string | null;
  onImageChange: (url: string | null) => void;
}

export function DashboardAvatarDialog({
  open,
  onOpenChange,
  currentImageUrl,
  onImageChange,
}: DashboardAvatarDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file (JPG, PNG, etc.)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Error',
          description: 'You must be logged in to upload an image',
          variant: 'destructive',
        });
        return;
      }

      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/dashboard-logo.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('dashboard-avatars')
        .upload(fileName, selectedFile, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('dashboard-avatars')
        .getPublicUrl(fileName);

      // Add cache buster
      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;

      // Update user settings
      const { error: upsertError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          dashboard_logo_url: urlWithCacheBuster,
        }, { onConflict: 'user_id' });

      if (upsertError) throw upsertError;

      onImageChange(urlWithCacheBuster);
      toast({
        title: 'Image uploaded',
        description: 'Your dashboard logo has been updated',
      });
      handleClose();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update user settings to remove URL
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          dashboard_logo_url: null,
        }, { onConflict: 'user_id' });

      if (error) throw error;

      // Delete from storage (best effort)
      await supabase.storage
        .from('dashboard-avatars')
        .remove([`${user.id}/dashboard-logo.jpg`, `${user.id}/dashboard-logo.png`, `${user.id}/dashboard-logo.webp`]);

      onImageChange(null);
      toast({
        title: 'Image removed',
        description: 'Your dashboard logo has been removed',
      });
      handleClose();
    } catch (error) {
      console.error('Remove error:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    onOpenChange(false);
  };

  const displayImage = previewUrl || currentImageUrl;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dashboard Logo</DialogTitle>
          <DialogDescription>
            Upload your business logo or a profile picture to personalize your dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {/* Preview area */}
          <div className="w-32 h-32 rounded-lg border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden">
            {displayImage ? (
              <img 
                src={displayImage} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center text-muted-foreground text-sm p-4">
                No image selected
              </div>
            )}
          </div>

          {/* File input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isRemoving}
          >
            <Upload className="w-4 h-4 mr-2" />
            Choose Image
          </Button>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {currentImageUrl && !previewUrl && (
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={isRemoving || isUploading}
              className="w-full sm:w-auto"
            >
              {isRemoving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Remove
            </Button>
          )}
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={handleClose} className="flex-1 sm:flex-initial">
              Cancel
            </Button>
            {selectedFile && (
              <Button onClick={handleUpload} disabled={isUploading} className="flex-1 sm:flex-initial">
                {isUploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Save
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
