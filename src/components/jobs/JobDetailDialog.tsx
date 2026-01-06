import { useState } from 'react';
import { Job, Client, JobPhoto, Receipt as ReceiptType, MileageEntry } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Briefcase,
  Camera,
  Receipt,
  Navigation,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  ImagePlus,
  FileText,
  Play,
  CheckCircle,
  Trash2,
  ZoomIn,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { PhotoUploadDialog } from './PhotoUploadDialog';
import { ReceiptUploadDialog } from './ReceiptUploadDialog';
import { MileageTracker } from './MileageTracker';
import { useToast } from '@/hooks/use-toast';

interface JobDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function JobDetailDialog({
  open,
  onOpenChange,
  job,
  client,
  onUpdate,
  onDelete,
}: JobDetailDialogProps) {
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [mileageOpen, setMileageOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<JobPhoto | null>(null);
  const { toast } = useToast();

  const status = statusConfig[job.status];
  const totalMiles = job.mileageEntries.reduce((sum, e) => sum + e.distance, 0);
  const totalReceipts = job.receipts.reduce((sum, r) => sum + r.amount, 0);
  const beforePhotos = job.photos.filter((p) => p.type === 'before');
  const afterPhotos = job.photos.filter((p) => p.type === 'after');

  const handleAddPhotos = (photos: JobPhoto[]) => {
    onUpdate({
      ...job,
      photos: [...job.photos, ...photos],
    });
    toast({
      title: photos.length === 1 ? 'Photo added' : 'Photos added',
      description: `${photos.length} photo${photos.length > 1 ? 's' : ''} saved`,
    });
  };

  const handleDeletePhoto = (photoId: string) => {
    onUpdate({
      ...job,
      photos: job.photos.filter((p) => p.id !== photoId),
    });
    if (selectedPhoto?.id === photoId) {
      setSelectedPhoto(null);
    }
    toast({ title: 'Photo deleted' });
  };

  const handleAddReceipt = (receipt: ReceiptType) => {
    onUpdate({
      ...job,
      receipts: [...job.receipts, receipt],
    });
    toast({ title: 'Receipt added', description: `$${receipt.amount} receipt saved` });
  };

  const handleDeleteReceipt = (receiptId: string) => {
    onUpdate({
      ...job,
      receipts: job.receipts.filter((r) => r.id !== receiptId),
    });
    toast({ title: 'Receipt deleted' });
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

  const handleDeleteJob = () => {
    onDelete(job.id);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-6 pb-4 border-b border-border">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-xl">{job.title}</DialogTitle>
                  <DialogDescription className="flex items-center gap-1 mt-1">
                    <User className="h-3.5 w-3.5" />
                    {client?.name || 'No client assigned'}
                  </DialogDescription>
                </div>
              </div>
              <Badge className={cn('font-medium', status.className)}>{status.label}</Badge>
            </div>
          </DialogHeader>

          <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="photos">
                Photos ({job.photos.length})
              </TabsTrigger>
              <TabsTrigger value="expenses">
                Expenses ({job.receipts.length})
              </TabsTrigger>
              <TabsTrigger value="mileage">
                Mileage ({job.mileageEntries.length})
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1">
              <TabsContent value="overview" className="p-6 m-0">
                <div className="space-y-6">
                  {/* Description */}
                  {job.description && (
                    <div>
                      <h3 className="text-sm font-medium text-foreground mb-2">Description</h3>
                      <p className="text-sm text-muted-foreground">{job.description}</p>
                    </div>
                  )}

                  {/* Client Info */}
                  {client && (
                    <div>
                      <h3 className="text-sm font-medium text-foreground mb-3">Client Details</h3>
                      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{client.name}</span>
                        </div>
                        {client.address && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{client.address}</span>
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <a href={`tel:${client.phone}`} className="text-primary hover:underline">
                              {client.phone}
                            </a>
                          </div>
                        )}
                        {client.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <a href={`mailto:${client.email}`} className="text-primary hover:underline">
                              {client.email}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quick Stats */}
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-3">Summary</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-muted/50 rounded-lg p-4 text-center">
                        <Camera className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                        <p className="text-2xl font-bold text-foreground">{job.photos.length}</p>
                        <p className="text-xs text-muted-foreground">Photos</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4 text-center">
                        <Receipt className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                        <p className="text-2xl font-bold text-foreground">${totalReceipts.toFixed(0)}</p>
                        <p className="text-xs text-muted-foreground">Expenses</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4 text-center">
                        <Navigation className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                        <p className="text-2xl font-bold text-foreground">{totalMiles.toFixed(1)}</p>
                        <p className="text-xs text-muted-foreground">Miles</p>
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-3">Timeline</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Created:</span>
                        <span>{format(new Date(job.createdAt), 'MMM d, yyyy')}</span>
                      </div>
                      {job.completedAt && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-success" />
                          <span className="text-muted-foreground">Completed:</span>
                          <span>{format(new Date(job.completedAt), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                    {job.status !== 'in_progress' && (
                      <Button size="sm" onClick={() => handleStatusChange('in_progress')}>
                        <Play className="h-4 w-4 mr-2" />
                        Start Job
                      </Button>
                    )}
                    {job.status !== 'completed' && (
                      <Button size="sm" variant="outline" onClick={() => handleStatusChange('completed')}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Complete
                      </Button>
                    )}
                    <Button size="sm" variant="destructive" onClick={handleDeleteJob}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Job
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="photos" className="p-6 m-0">
                <div className="space-y-6">
                  <Button onClick={() => setPhotoDialogOpen(true)} className="gap-2">
                    <ImagePlus className="h-4 w-4" />
                    Add Photos
                  </Button>

                  {job.photos.length === 0 ? (
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
                          <div className="grid grid-cols-3 gap-3">
                            {beforePhotos.map((photo) => (
                              <div key={photo.id} className="group relative">
                                <img
                                  src={photo.dataUrl}
                                  alt={photo.caption || 'Before photo'}
                                  className="w-full h-24 object-cover rounded-lg cursor-pointer"
                                  onClick={() => setSelectedPhoto(photo)}
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                                  <Button
                                    variant="secondary"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => setSelectedPhoto(photo)}
                                  >
                                    <ZoomIn className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handleDeletePhoto(photo.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                                {photo.caption && (
                                  <p className="text-xs text-muted-foreground mt-1 truncate">
                                    {photo.caption}
                                  </p>
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
                          <div className="grid grid-cols-3 gap-3">
                            {afterPhotos.map((photo) => (
                              <div key={photo.id} className="group relative">
                                <img
                                  src={photo.dataUrl}
                                  alt={photo.caption || 'After photo'}
                                  className="w-full h-24 object-cover rounded-lg cursor-pointer"
                                  onClick={() => setSelectedPhoto(photo)}
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                                  <Button
                                    variant="secondary"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => setSelectedPhoto(photo)}
                                  >
                                    <ZoomIn className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handleDeletePhoto(photo.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                                {photo.caption && (
                                  <p className="text-xs text-muted-foreground mt-1 truncate">
                                    {photo.caption}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="expenses" className="p-6 m-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Button onClick={() => setReceiptDialogOpen(true)} className="gap-2">
                      <FileText className="h-4 w-4" />
                      Add Receipt
                    </Button>
                    {job.receipts.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Total: <span className="font-semibold text-foreground">${totalReceipts.toFixed(2)}</span>
                      </p>
                    )}
                  </div>

                  {job.receipts.length === 0 ? (
                    <div className="text-center py-8">
                      <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No receipts yet</p>
                      <p className="text-sm text-muted-foreground">
                        Track job expenses by adding receipts
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {job.receipts.map((receipt) => (
                        <div
                          key={receipt.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-background">
                              <Receipt className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{receipt.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(receipt.createdAt), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">${receipt.amount.toFixed(2)}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleDeleteReceipt(receipt.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="mileage" className="p-6 m-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Button onClick={() => setMileageOpen(true)} className="gap-2">
                      <Navigation className="h-4 w-4" />
                      Track Mileage
                    </Button>
                    {job.mileageEntries.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Total: <span className="font-semibold text-foreground">{totalMiles.toFixed(1)} miles</span>
                      </p>
                    )}
                  </div>

                  {job.mileageEntries.length === 0 ? (
                    <div className="text-center py-8">
                      <Navigation className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No mileage tracked</p>
                      <p className="text-sm text-muted-foreground">
                        Track your travel distance for this job
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {job.mileageEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-background">
                              <Navigation className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{entry.distance.toFixed(1)} miles</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(entry.startTime), 'MMM d, yyyy h:mm a')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Photo Upload Dialog */}
      <PhotoUploadDialog
        open={photoDialogOpen}
        onOpenChange={setPhotoDialogOpen}
        jobId={job.id}
        onSave={handleAddPhotos}
      />

      {/* Receipt Upload Dialog */}
      <ReceiptUploadDialog
        open={receiptDialogOpen}
        onOpenChange={setReceiptDialogOpen}
        jobId={job.id}
        onSave={handleAddReceipt}
      />

      {/* Mileage Tracker */}
      <MileageTracker
        open={mileageOpen}
        onOpenChange={setMileageOpen}
        jobId={job.id}
        entries={job.mileageEntries}
        onUpdate={handleMileageUpdate}
      />

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
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDeletePhoto(selectedPhoto.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button variant="secondary" size="icon" onClick={() => setSelectedPhoto(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {selectedPhoto.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-3">
                  <p className="text-sm">{selectedPhoto.caption}</p>
                  <Badge variant="outline" className="mt-1 text-white border-white/30">
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
