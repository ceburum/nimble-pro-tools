import { useState } from 'react';
import { ImagePlus, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardAvatarDialog } from './DashboardAvatarDialog';

interface DashboardAvatarProps {
  imageUrl: string | null;
  onImageChange: (url: string | null) => void;
  isLoading?: boolean;
}

export function DashboardAvatar({ imageUrl, onImageChange, isLoading }: DashboardAvatarProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setDialogOpen(true)}
        disabled={isLoading}
        className={cn(
          "relative w-16 h-16 rounded-lg border-2 border-border bg-muted/50 overflow-hidden",
          "hover:border-primary/50 hover:shadow-md transition-all duration-200",
          "flex items-center justify-center group",
          isLoading && "opacity-50 cursor-not-allowed"
        )}
        aria-label="Update dashboard logo or profile picture"
      >
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt="Dashboard logo" 
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="w-8 h-8 text-muted-foreground" />
        )}
        
        {/* Hover overlay */}
        <div className={cn(
          "absolute inset-0 bg-black/50 flex items-center justify-center",
          "opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        )}>
          <ImagePlus className="w-5 h-5 text-white" />
        </div>
      </button>

      <DashboardAvatarDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        currentImageUrl={imageUrl}
        onImageChange={onImageChange}
      />
    </>
  );
}
