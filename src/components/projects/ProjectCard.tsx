import { useState } from 'react';
import {
  FolderKanban,
  Camera,
  Receipt,
  MoreVertical,
  ImagePlus,
  FileText,
  DollarSign,
  StickyNote,
} from 'lucide-react';
import { Project, Client, ProjectPhoto } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ProjectPhotoUploadDialog } from './ProjectPhotoUploadDialog';
import { ProjectReceiptUploadDialog } from './ProjectReceiptUploadDialog';
import { ProjectDetailDialog } from './ProjectDetailDialog';
import { useToast } from '@/hooks/use-toast';
import { useProjects } from '@/hooks/useProjects';
import { useProjectNotes } from '@/hooks/useProjectNotes';

interface ProjectCardProps {
  project: Project;
  client?: Client;
  onUpdate: (project: Project) => void;
  onDelete: (id: string) => void;
  onCreateInvoice: (project: Project) => void;
}

const statusConfig = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  sent: { label: 'Sent', className: 'bg-blue-500/10 text-blue-600' },
  accepted: { label: 'Accepted', className: 'bg-success/10 text-success' },
  in_progress: { label: 'In Progress', className: 'bg-primary/10 text-primary' },
  completed: { label: 'Completed', className: 'bg-success/10 text-success' },
  invoiced: { label: 'Invoiced', className: 'bg-amber-500/10 text-amber-600' },
};

export function ProjectCard({
  project,
  client,
  onUpdate,
  onDelete,
  onCreateInvoice,
}: ProjectCardProps) {
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const { toast } = useToast();
  const { addPhoto, addReceipt } = useProjects();
  const { notes } = useProjectNotes(project.id);

  const status = statusConfig[project.status];
  const totalExpenses = project.receipts.reduce((sum, r) => sum + r.amount, 0);
  const quoteTotal = project.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  // Handle photos using the centralized useProjects hook
  const handleSavePhotos = async (photos: ProjectPhoto[]) => {
    setIsSavingPhoto(true);
    try {
      for (const photo of photos) {
        // Convert dataUrl to File for storage upload
        const response = await fetch(photo.dataUrl);
        const blob = await response.blob();
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        const success = await addPhoto(project.id, file, photo.type, photo.caption);
        if (!success) {
          toast({ title: 'Error saving photo', variant: 'destructive' });
          return;
        }
      }
      toast({ title: 'Photos saved', description: `Added ${photos.length} photo(s)` });
    } catch (error) {
      console.error('Error saving photos:', error);
      toast({ title: 'Error saving photos', variant: 'destructive' });
    } finally {
      setIsSavingPhoto(false);
    }
  };

  // Handle receipts using the centralized useProjects hook
  const handleSaveReceipt = async (file: File, storeName: string, totalAmount: number): Promise<boolean> => {
    const success = await addReceipt(project.id, file, storeName, totalAmount);
    return success;
  };

  return (
    <>
      <div
        className="bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer"
        onClick={() => setDetailOpen(true)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FolderKanban className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-card-foreground">{project.title}</h3>
              <p className="text-sm text-muted-foreground">{client?.name || 'No client'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Badge className={cn('font-medium', status.className)}>{status.label}</Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setDetailOpen(true)}>View Details</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(project.id)} className="text-destructive focus:text-destructive">
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {project.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{project.description}</p>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            <span>${quoteTotal.toFixed(0)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Camera className="h-4 w-4" />
            <span>{project.photos.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <Receipt className="h-4 w-4" />
            <span>${totalExpenses.toFixed(0)}</span>
          </div>
          {notes.length > 0 && (
            <div className="flex items-center gap-1">
              <StickyNote className="h-4 w-4" />
              <span>{notes.length}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => setPhotoDialogOpen(true)}>
            <ImagePlus className="h-4 w-4" />
            Photo
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => setReceiptDialogOpen(true)}>
            <FileText className="h-4 w-4" />
            Receipt
          </Button>
        </div>
      </div>

      <ProjectDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        project={project}
        client={client}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onCreateInvoice={onCreateInvoice}
      />

      <ProjectPhotoUploadDialog
        open={photoDialogOpen}
        onOpenChange={setPhotoDialogOpen}
        projectId={project.id}
        onSave={handleSavePhotos}
      />

      <ProjectReceiptUploadDialog
        open={receiptDialogOpen}
        onOpenChange={setReceiptDialogOpen}
        projectId={project.id}
        onSave={handleSaveReceipt}
      />
    </>
  );
}
