import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Project, Client, ProjectPhoto, ProjectReceipt, MileageEntry } from '@/types';
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
  FolderKanban,
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
  Send,
  DollarSign,
  FileCheck,
  Plus,
  Store,
  CalendarDays,
} from 'lucide-react';
import { SupplierQuoteScanDialog } from './SupplierQuoteScanDialog';
import { ScheduleDialog } from '@/components/scheduling/ScheduleDialog';
import { AddToCalendarButton } from '@/components/scheduling/AddToCalendarButton';
import { formatArrivalWindow } from '@/lib/calendarUtils';
import { useProjects } from '@/hooks/useProjects';
import { useExpenseCategories } from '@/hooks/useExpenseCategories';
import { LineItem } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineItemInput } from '@/components/ui/line-item-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface ProjectDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function ProjectDetailDialog({
  open,
  onOpenChange,
  project,
  client,
  onUpdate,
  onDelete,
  onCreateInvoice,
}: ProjectDetailDialogProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<ProjectPhoto | null>(null);
  const [editingQuote, setEditingQuote] = useState(false);
  const [isSendingQuote, setIsSendingQuote] = useState(false);
  const [supplierScanOpen, setSupplierScanOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const { toast } = useToast();
  const { projects: allProjects, updateReceipt } = useProjects();
  const { categories } = useExpenseCategories();

  const status = statusConfig[project.status];
  const totalMiles = project.mileageEntries.reduce((sum, e) => sum + e.distance, 0);
  const totalExpenses = project.receipts.reduce((sum, r) => sum + r.amount, 0);
  const quoteTotal = project.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  
  const beforePhotos = project.photos.filter((p) => p.type === 'before');
  const progressPhotos = project.photos.filter((p) => p.type === 'progress');
  const afterPhotos = project.photos.filter((p) => p.type === 'after');

  const handleStatusChange = (newStatus: Project['status']) => {
    console.log('handleStatusChange called:', project.id, 'from', project.status, 'to', newStatus);
    const updates: Partial<Project> = { status: newStatus };
    if (newStatus === 'sent') updates.sentAt = new Date();
    if (newStatus === 'accepted') updates.acceptedAt = new Date();
    if (newStatus === 'in_progress') updates.startedAt = new Date();
    if (newStatus === 'completed') updates.completedAt = new Date();
    
    const updatedProject = { ...project, ...updates };
    console.log('Calling onUpdate with updated project, new status:', updatedProject.status);
    onUpdate(updatedProject);
    toast({ title: 'Status updated', description: `Project marked as ${newStatus.replace('_', ' ')}` });
  };

  const handleSendQuoteEmail = async () => {
    if (!client?.email) {
      toast({ 
        title: 'No client email', 
        description: 'Please add an email address for this client first.',
        variant: 'destructive' 
      });
      return;
    }

    if (project.items.length === 0) {
      toast({ 
        title: 'No line items', 
        description: 'Please add at least one line item to the quote.',
        variant: 'destructive' 
      });
      return;
    }

    setIsSendingQuote(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-quote-email', {
        body: {
          projectId: project.id,
          projectTitle: project.title,
          projectDescription: project.description,
          clientName: client.name,
          clientEmail: client.email,
          items: project.items,
          notes: project.quoteNotes,
          notificationEmail: 'chad@cebbuilding.com',
        },
      });

      if (error) throw error;

      // Update status to sent
      handleStatusChange('sent');
      toast({ 
        title: 'Quote sent!', 
        description: `Quote emailed to ${client.email}` 
      });
    } catch (error: any) {
      console.error('Failed to send quote:', error);
      toast({ 
        title: 'Failed to send quote', 
        description: error.message || 'Please try again.',
        variant: 'destructive' 
      });
    } finally {
      setIsSendingQuote(false);
    }
  };

  const handleDeletePhoto = (photoId: string) => {
    onUpdate({
      ...project,
      photos: project.photos.filter((p) => p.id !== photoId),
    });
    if (selectedPhoto?.id === photoId) setSelectedPhoto(null);
    toast({ title: 'Photo deleted' });
  };

  const handleDeleteReceipt = (receiptId: string) => {
    onUpdate({
      ...project,
      receipts: project.receipts.filter((r) => r.id !== receiptId),
    });
    toast({ title: 'Receipt deleted' });
  };

  const handleReceiptCategoryChange = async (receiptId: string, categoryId: string) => {
    const success = await updateReceipt(receiptId, { categoryId: categoryId || null });
    if (success) {
      // Update local project state as well
      onUpdate({
        ...project,
        receipts: project.receipts.map(r =>
          r.id === receiptId ? { ...r, categoryId: categoryId || undefined } : r
        ),
      });
      toast({ title: 'Category updated' });
    }
  };

  // Get IRS categories for the picker
  const irsCategories = categories.filter(c => c.irsCode);

  const handleAddLineItem = () => {
    onUpdate({
      ...project,
      items: [...project.items, { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0 }],
    });
  };

  const handleUpdateLineItem = (itemId: string, updates: Partial<{ description: string; quantity: number; unitPrice: number }>) => {
    onUpdate({
      ...project,
      items: project.items.map((item) => (item.id === itemId ? { ...item, ...updates } : item)),
    });
  };

  const handleDeleteLineItem = (itemId: string) => {
    onUpdate({
      ...project,
      items: project.items.filter((item) => item.id !== itemId),
    });
  };

  const handleImportItems = (importedItems: LineItem[]) => {
    const nonEmptyItems = project.items.filter(
      item => item.description.trim() !== '' || item.unitPrice > 0
    );
    onUpdate({
      ...project,
      items: [...nonEmptyItems, ...importedItems],
    });
  };

  const handleDeleteProject = () => {
    onDelete(project.id);
    onOpenChange(false);
  };

  const getNextActions = () => {
    const actions: { label: string; icon: React.ReactNode; onClick: () => void; variant?: 'default' | 'outline' | 'destructive'; disabled?: boolean }[] = [];
    
    switch (project.status) {
      case 'draft':
        actions.push({ 
          label: isSendingQuote ? 'Sending...' : 'Send Quote', 
          icon: <Send className="h-4 w-4 mr-2" />, 
          onClick: handleSendQuoteEmail,
          disabled: isSendingQuote,
        });
        break;
      case 'sent':
        actions.push({ label: 'Mark Accepted', icon: <CheckCircle className="h-4 w-4 mr-2" />, onClick: () => handleStatusChange('accepted') });
        break;
      case 'accepted':
        // Schedule button - primary if not yet scheduled
        if (!project.scheduledDate) {
          actions.push({ 
            label: 'Schedule', 
            icon: <CalendarDays className="h-4 w-4 mr-2" />, 
            onClick: () => setScheduleDialogOpen(true) 
          });
        }
        actions.push({ 
          label: 'Start Work', 
          icon: <Play className="h-4 w-4 mr-2" />, 
          onClick: () => handleStatusChange('in_progress'),
          variant: project.scheduledDate ? 'default' : 'outline' as const
        });
        break;
      case 'in_progress':
        if (!project.scheduledDate) {
          actions.push({ 
            label: 'Schedule', 
            icon: <CalendarDays className="h-4 w-4 mr-2" />, 
            onClick: () => setScheduleDialogOpen(true),
            variant: 'outline' as const
          });
        }
        actions.push({ label: 'Mark Complete', icon: <CheckCircle className="h-4 w-4 mr-2" />, onClick: () => handleStatusChange('completed') });
        break;
      case 'completed':
        actions.push({ label: 'Create Invoice', icon: <DollarSign className="h-4 w-4 mr-2" />, onClick: () => onCreateInvoice(project) });
        break;
    }
    
    return actions;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[750px] h-[90vh] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b border-border">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FolderKanban className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-xl">{project.title}</DialogTitle>
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
            <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-6 flex-wrap h-auto py-1">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
              <TabsTrigger value="quote" className="text-xs sm:text-sm">
                Quote (${quoteTotal.toFixed(0)})
              </TabsTrigger>
              <TabsTrigger value="photos" className="text-xs sm:text-sm">
                Photos ({project.photos.length})
              </TabsTrigger>
              <TabsTrigger value="expenses" className="text-xs sm:text-sm">
                Expenses ({project.receipts.length})
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 min-h-0">
              {/* Overview Tab */}
              <TabsContent value="overview" className="p-6 m-0 pb-[calc(7rem+env(safe-area-inset-bottom))]">
                <div className="space-y-6">
                  {project.description && (
                    <div>
                      <h3 className="text-sm font-medium text-foreground mb-2">Description</h3>
                      <p className="text-sm text-muted-foreground">{project.description}</p>
                    </div>
                  )}

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
                            <a href={`tel:${client.phone}`} className="text-primary hover:underline">{client.phone}</a>
                          </div>
                        )}
                        {client.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <a href={`mailto:${client.email}`} className="text-primary hover:underline">{client.email}</a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Scheduling Info */}
                  {project.scheduledDate && (
                    <div>
                      <h3 className="text-sm font-medium text-foreground mb-3">Scheduling</h3>
                      <div className="bg-primary/5 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {format(new Date(project.scheduledDate), 'EEEE, MMMM d, yyyy')}
                            </p>
                            {project.arrivalWindowStart && project.arrivalWindowEnd && (
                              <p className="text-sm text-muted-foreground">
                                Arrival: {formatArrivalWindow(project.arrivalWindowStart, project.arrivalWindowEnd)}
                              </p>
                            )}
                          </div>
                          <AddToCalendarButton 
                            event={{
                              title: `${project.title} - CEB Building`,
                              description: `Project: ${project.title}\n${project.description || ''}\n\nClient: ${client?.name || 'N/A'}`,
                              location: client?.address || '',
                              startDate: new Date(project.scheduledDate),
                              startTime: project.arrivalWindowStart || '09:00',
                              endTime: project.arrivalWindowEnd || '17:00',
                            }}
                          />
                        </div>
                        {project.scheduleNotes && (
                          <p className="text-sm text-muted-foreground">{project.scheduleNotes}</p>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setScheduleDialogOpen(true)}
                        >
                          <CalendarDays className="h-4 w-4 mr-2" />
                          Reschedule
                        </Button>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-3">Summary</h3>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <DollarSign className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                        <p className="text-lg font-bold text-foreground">${quoteTotal.toFixed(0)}</p>
                        <p className="text-xs text-muted-foreground">Quote</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <Camera className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                        <p className="text-lg font-bold text-foreground">{project.photos.length}</p>
                        <p className="text-xs text-muted-foreground">Photos</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <Receipt className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                        <p className="text-lg font-bold text-foreground">${totalExpenses.toFixed(0)}</p>
                        <p className="text-xs text-muted-foreground">Expenses</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <Navigation className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                        <p className="text-lg font-bold text-foreground">{totalMiles.toFixed(1)}</p>
                        <p className="text-xs text-muted-foreground">Miles</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-3">Timeline</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Created:</span>
                        <span>{format(new Date(project.createdAt), 'MMM d, yyyy')}</span>
                      </div>
                      {project.sentAt && (
                        <div className="flex items-center gap-2">
                          <Send className="h-4 w-4 text-blue-500" />
                          <span className="text-muted-foreground">Sent:</span>
                          <span>{format(new Date(project.sentAt), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                      {project.acceptedAt && (
                        <div className="flex items-center gap-2">
                          <FileCheck className="h-4 w-4 text-success" />
                          <span className="text-muted-foreground">Accepted:</span>
                          <span>{format(new Date(project.acceptedAt), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                      {project.scheduledDate && (
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground">Scheduled:</span>
                          <span>
                            {format(new Date(project.scheduledDate), 'MMM d, yyyy')}
                            {project.arrivalWindowStart && project.arrivalWindowEnd && (
                              <span className="text-muted-foreground ml-1">
                                ({formatArrivalWindow(project.arrivalWindowStart, project.arrivalWindowEnd)})
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                      {project.startedAt && (
                        <div className="flex items-center gap-2">
                          <Play className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground">Started:</span>
                          <span>{format(new Date(project.startedAt), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                      {project.completedAt && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-success" />
                          <span className="text-muted-foreground">Completed:</span>
                          <span>{format(new Date(project.completedAt), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="sticky bottom-0 -mx-6 px-6 py-4 mt-6 border-t border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex flex-wrap gap-2">
                      {getNextActions().map((action, i) => (
                        <Button key={i} size="sm" variant={action.variant || 'default'} onClick={action.onClick} disabled={action.disabled}>
                          {action.icon}
                          {action.label}
                        </Button>
                      ))}
                      <Button size="sm" variant="destructive" onClick={handleDeleteProject}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Quote Tab */}
              <TabsContent value="quote" className="p-6 m-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="text-sm font-medium">Line Items</h3>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setSupplierScanOpen(true)}>
                        <Store className="h-4 w-4 mr-1" />
                        Import from Supplier
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleAddLineItem}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Item
                      </Button>
                    </div>
                  </div>

                  {project.items.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>No line items yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {project.items.map((item) => (
                        <div key={item.id} className="flex gap-2 items-start p-3 bg-muted/50 rounded-lg">
                          <div className="flex-1">
                            <LineItemInput
                              value={item.description}
                              onChange={(val) => handleUpdateLineItem(item.id, { description: val })}
                              placeholder="Description"
                              className="mb-2"
                            />
                            <div className="flex gap-2">
                              <div className="w-20">
                                <Label className="text-xs">Qty</Label>
                                <LineItemInput
                                  type="number"
                                  value={item.quantity}
                                  onChange={(val) => handleUpdateLineItem(item.id, { quantity: parseFloat(val) || 0 })}
                                />
                              </div>
                              <div className="w-28">
                                <Label className="text-xs">Price</Label>
                                <LineItemInput
                                  type="number"
                                  value={item.unitPrice}
                                  onChange={(val) => handleUpdateLineItem(item.id, { unitPrice: parseFloat(val) || 0 })}
                                />
                              </div>
                              <div className="w-24 text-right pt-6">
                                <span className="font-medium">${(item.quantity * item.unitPrice).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                          <Button size="icon" variant="ghost" onClick={() => handleDeleteLineItem(item.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end pt-4 border-t border-border">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold">${quoteTotal.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={project.quoteNotes || ''}
                      onChange={(e) => onUpdate({ ...project, quoteNotes: e.target.value })}
                      placeholder="Additional notes for the quote..."
                      rows={3}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Photos Tab */}
              <TabsContent value="photos" className="p-6 m-0">
                <div className="space-y-6">
                  {project.photos.length === 0 ? (
                    <div className="text-center py-8">
                      <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No photos yet</p>
                      <p className="text-sm text-muted-foreground">Use the Photo button to add pictures</p>
                    </div>
                  ) : (
                    <>
                      {beforePhotos.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                            <Badge variant="outline">Before</Badge>
                            {beforePhotos.length} photo{beforePhotos.length > 1 ? 's' : ''}
                          </h3>
                          <div className="grid grid-cols-3 gap-3">
                            {beforePhotos.map((photo) => (
                              <PhotoThumbnail key={photo.id} photo={photo} onView={setSelectedPhoto} onDelete={handleDeletePhoto} />
                            ))}
                          </div>
                        </div>
                      )}
                      {progressPhotos.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                            <Badge className="bg-primary/10 text-primary border-primary/20">Progress</Badge>
                            {progressPhotos.length} photo{progressPhotos.length > 1 ? 's' : ''}
                          </h3>
                          <div className="grid grid-cols-3 gap-3">
                            {progressPhotos.map((photo) => (
                              <PhotoThumbnail key={photo.id} photo={photo} onView={setSelectedPhoto} onDelete={handleDeletePhoto} />
                            ))}
                          </div>
                        </div>
                      )}
                      {afterPhotos.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                            <Badge className="bg-success/10 text-success border-success/20">After</Badge>
                            {afterPhotos.length} photo{afterPhotos.length > 1 ? 's' : ''}
                          </h3>
                          <div className="grid grid-cols-3 gap-3">
                            {afterPhotos.map((photo) => (
                              <PhotoThumbnail key={photo.id} photo={photo} onView={setSelectedPhoto} onDelete={handleDeletePhoto} />
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </TabsContent>

              {/* Expenses Tab */}
              <TabsContent value="expenses" className="p-6 m-0">
                <div className="space-y-4">
                  {project.receipts.length > 0 && (
                    <div className="flex justify-end">
                      <p className="text-sm text-muted-foreground">
                        Total: <span className="font-semibold text-foreground">${totalExpenses.toFixed(2)}</span>
                      </p>
                    </div>
                  )}

                  {project.receipts.length === 0 ? (
                    <div className="text-center py-8">
                      <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No receipts yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {project.receipts.map((receipt) => {
                        const category = categories.find(c => c.id === receipt.categoryId);
                        return (
                          <div key={receipt.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg group">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="p-2 rounded-lg bg-background">
                                <Receipt className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{receipt.description}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(receipt.createdAt), 'MMM d, yyyy')}
                                  {receipt.vendor && ` • ${receipt.vendor}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Select
                                value={receipt.categoryId || 'uncategorized'}
                                onValueChange={(value) => handleReceiptCategoryChange(receipt.id, value === 'uncategorized' ? '' : value)}
                              >
                                <SelectTrigger className="w-36 h-8 text-xs">
                                  <SelectValue>
                                    {category ? (
                                      <span className="flex items-center gap-1">
                                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                                          {category.irsCode}
                                        </Badge>
                                        <span className="truncate">{category.name}</span>
                                      </span>
                                    ) : (
                                      <span className="text-amber-600">Uncategorized</span>
                                    )}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="uncategorized">
                                    <span className="text-amber-600">Uncategorized</span>
                                  </SelectItem>
                                  {irsCategories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                      <span className="flex items-center gap-1">
                                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                                          {cat.irsCode}
                                        </Badge>
                                        {cat.name}
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <span className="font-semibold text-sm w-20 text-right">${receipt.amount.toFixed(2)}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100"
                                onClick={() => handleDeleteReceipt(receipt.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Photo viewer */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="sm:max-w-[90vw] max-h-[90vh] p-0 overflow-hidden">
          {selectedPhoto && (
            <div className="relative">
              <img src={selectedPhoto.dataUrl} alt={selectedPhoto.caption || 'Photo'} className="w-full h-auto max-h-[85vh] object-contain" />
              <div className="absolute top-2 right-2 flex gap-2">
                <Button variant="destructive" size="icon" onClick={() => handleDeletePhoto(selectedPhoto.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button variant="secondary" size="icon" onClick={() => setSelectedPhoto(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {selectedPhoto.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-3">
                  <p className="text-sm">{selectedPhoto.caption}</p>
                  <Badge variant="outline" className="mt-1 text-white border-white/30">{selectedPhoto.type}</Badge>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <SupplierQuoteScanDialog
        open={supplierScanOpen}
        onOpenChange={setSupplierScanOpen}
        onImport={handleImportItems}
      />

      <ScheduleDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        project={project}
        client={client}
        allProjects={allProjects}
        onSchedule={(updatedProject) => {
          onUpdate(updatedProject);
          setScheduleDialogOpen(false);
        }}
      />
    </>
  );
}

function PhotoThumbnail({ 
  photo, 
  onView, 
  onDelete 
}: { 
  photo: ProjectPhoto; 
  onView: (p: ProjectPhoto) => void; 
  onDelete: (id: string) => void;
}) {
  return (
    <div className="group relative">
      <img
        src={photo.dataUrl}
        alt={photo.caption || 'Photo'}
        className="w-full h-24 object-cover rounded-lg cursor-pointer"
        onClick={() => onView(photo)}
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
        <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => onView(photo)}>
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => onDelete(photo.id)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      {photo.caption && <p className="text-xs text-muted-foreground mt-1 truncate">{photo.caption}</p>}
    </div>
  );
}
