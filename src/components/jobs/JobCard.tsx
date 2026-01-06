import { useState } from 'react';
import {
  Briefcase,
  Camera,
  Receipt,
  Navigation,
  MoreVertical,
  Play,
  CheckCircle,
  ImagePlus,
  FileText,
} from 'lucide-react';
import { Job, Client, JobPhoto, Receipt as ReceiptType, MileageEntry } from '@/types';
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
import { PhotoUploadDialog } from './PhotoUploadDialog';
import { ReceiptUploadDialog } from './ReceiptUploadDialog';
import { MileageTracker } from './MileageTracker';
import { JobPhotosGallery } from './JobPhotosGallery';
import { useToast } from '@/hooks/use-toast';

interface JobCardProps {
  job: Job;
  client?: Client;
  onUpdate: (job: Job) => void;
  onDelete: (id: string) => void;
}

const statusConfig = {
  pending: { label: 'Pending', className: 'bg-secondary text-secondary-foreground' },
  in_progress: { label: 'In Progress', className: 'bg-primary/10 text-primary' },
  completed: { label: 'Completed', className: 'bg-success/10 text-success' },
};

export function JobCard({ job, client, onUpdate, onDelete }: JobCardProps) {
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [mileageOpen, setMileageOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const { toast } = useToast();

  const status = statusConfig[job.status];
  const totalMiles = job.mileageEntries.reduce((sum, e) => sum + e.distance, 0);
  const totalReceipts = job.receipts.reduce((sum, r) => sum + r.amount, 0);

  const handleAddPhoto = (photo: JobPhoto) => {
    onUpdate({
      ...job,
      photos: [...job.photos, photo],
    });
    toast({ title: 'Photo added', description: `${photo.type} photo saved to job` });
  };

  const handleAddReceipt = (receipt: ReceiptType) => {
    onUpdate({
      ...job,
      receipts: [...job.receipts, receipt],
    });
    toast({ title: 'Receipt added', description: `$${receipt.amount} receipt saved` });
  };

  const handleMileageUpdate = (entry: MileageEntry) => {
    const existingIndex = job.mileageEntries.findIndex((e) => e.id === entry.id);
    const updatedEntries =
      existingIndex >= 0
        ? job.mileageEntries.map((e) => (e.id === entry.id ? entry : e))
        : [...job.mileageEntries, entry];

    onUpdate({
      ...job,
      mileageEntries: updatedEntries,
    });
  };

  const handleStatusChange = (newStatus: Job['status']) => {
    onUpdate({
      ...job,
      status: newStatus,
      completedAt: newStatus === 'completed' ? new Date() : undefined,
    });
    toast({ title: 'Status updated', description: `Job marked as ${newStatus.replace('_', ' ')}` });
  };

  return (
    <>
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-all duration-200 group">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-card-foreground">{job.title}</h3>
              <p className="text-sm text-muted-foreground">{client?.name || 'No client'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className={cn('font-medium', status.className)}>{status.label}</Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {job.status !== 'in_progress' && (
                  <DropdownMenuItem onClick={() => handleStatusChange('in_progress')}>
                    <Play className="h-4 w-4 mr-2" />
                    Start Job
                  </DropdownMenuItem>
                )}
                {job.status !== 'completed' && (
                  <DropdownMenuItem onClick={() => handleStatusChange('completed')}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Complete
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(job.id)}
                  className="text-destructive focus:text-destructive"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {job.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{job.description}</p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <button
            onClick={() => setGalleryOpen(true)}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <Camera className="h-4 w-4" />
            <span>{job.photos.length}</span>
          </button>
          <div className="flex items-center gap-1">
            <Receipt className="h-4 w-4" />
            <span>${totalReceipts.toFixed(0)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Navigation className="h-4 w-4" />
            <span>{totalMiles.toFixed(1)} mi</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => setPhotoDialogOpen(true)}
          >
            <ImagePlus className="h-4 w-4" />
            Photo
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => setReceiptDialogOpen(true)}
          >
            <FileText className="h-4 w-4" />
            Receipt
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => setMileageOpen(true)}
          >
            <Navigation className="h-4 w-4" />
            Mileage
          </Button>
        </div>
      </div>

      <PhotoUploadDialog
        open={photoDialogOpen}
        onOpenChange={setPhotoDialogOpen}
        jobId={job.id}
        onSave={handleAddPhoto}
      />

      <ReceiptUploadDialog
        open={receiptDialogOpen}
        onOpenChange={setReceiptDialogOpen}
        jobId={job.id}
        onSave={handleAddReceipt}
      />

      <MileageTracker
        open={mileageOpen}
        onOpenChange={setMileageOpen}
        jobId={job.id}
        entries={job.mileageEntries}
        onUpdate={handleMileageUpdate}
      />

      <JobPhotosGallery
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        photos={job.photos}
        jobTitle={job.title}
      />
    </>
  );
}
