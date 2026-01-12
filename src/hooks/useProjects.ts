import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Project, ProjectPhoto, ProjectReceipt, LineItem } from '@/types';

interface DbProject {
  id: string;
  user_id: string;
  client_id: string;
  title: string;
  description: string | null;
  items: unknown; // JSONB from database
  status: string;
  valid_until: string | null;
  quote_notes: string | null;
  invoice_id: string | null;
  created_at: string;
  sent_at: string | null;
  accepted_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  // Scheduling fields
  scheduled_date: string | null;
  arrival_window_start: string | null;
  arrival_window_end: string | null;
  schedule_notes: string | null;
  schedule_notification_sent_at: string | null;
}

interface DbProjectPhoto {
  id: string;
  user_id: string;
  project_id: string;
  type: string;
  storage_path: string;
  caption: string | null;
  created_at: string;
}

interface DbProjectReceipt {
  id: string;
  user_id: string;
  project_id: string;
  storage_path: string;
  description: string;
  amount: number;
  created_at: string;
  vendor: string | null;
  category_id: string | null;
  is_capital_asset: boolean | null;
  tax_notes: string | null;
}

const mapDbProjectToProject = (
  dbProject: DbProject,
  photos: DbProjectPhoto[],
  receipts: DbProjectReceipt[]
): Project => {
  return {
    id: dbProject.id,
    clientId: dbProject.client_id,
    title: dbProject.title,
    description: dbProject.description || undefined,
    items: (Array.isArray(dbProject.items) ? dbProject.items : []) as LineItem[],
    status: dbProject.status as Project['status'],
    validUntil: dbProject.valid_until ? new Date(dbProject.valid_until) : undefined,
    quoteNotes: dbProject.quote_notes || undefined,
    invoiceId: dbProject.invoice_id || undefined,
    // Scheduling fields
    scheduledDate: dbProject.scheduled_date ? new Date(dbProject.scheduled_date) : undefined,
    arrivalWindowStart: dbProject.arrival_window_start || undefined,
    arrivalWindowEnd: dbProject.arrival_window_end || undefined,
    scheduleNotes: dbProject.schedule_notes || undefined,
    scheduleNotificationSentAt: dbProject.schedule_notification_sent_at 
      ? new Date(dbProject.schedule_notification_sent_at) 
      : undefined,
    // Timestamps
    createdAt: new Date(dbProject.created_at),
    sentAt: dbProject.sent_at ? new Date(dbProject.sent_at) : undefined,
    acceptedAt: dbProject.accepted_at ? new Date(dbProject.accepted_at) : undefined,
    startedAt: dbProject.started_at ? new Date(dbProject.started_at) : undefined,
    completedAt: dbProject.completed_at ? new Date(dbProject.completed_at) : undefined,
    photos: photos.map(p => ({
      id: p.id,
      projectId: p.project_id,
      type: p.type as ProjectPhoto['type'],
      dataUrl: p.storage_path,
      caption: p.caption || undefined,
      createdAt: new Date(p.created_at),
    })),
    receipts: receipts.map(r => ({
      id: r.id,
      projectId: r.project_id,
      dataUrl: r.storage_path,
      description: r.description,
      amount: Number(r.amount),
      createdAt: new Date(r.created_at),
      vendor: r.vendor || undefined,
      categoryId: r.category_id || undefined,
      isCapitalAsset: r.is_capital_asset || undefined,
      taxNotes: r.tax_notes || undefined,
    })),
    mileageEntries: [],
  };
};

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      if (!projectsData || projectsData.length === 0) {
        setProjects([]);
        return;
      }

      const projectIds = projectsData.map(p => p.id);

      // Fetch related data in parallel
      const [photosResult, receiptsResult] = await Promise.all([
        supabase.from('project_photos').select('*').in('project_id', projectIds),
        supabase.from('project_receipts').select('*').in('project_id', projectIds),
      ]);

      const photos = (photosResult.data || []) as DbProjectPhoto[];
      const receipts = (receiptsResult.data || []) as DbProjectReceipt[];

      // Map to Project type
      const mappedProjects = projectsData.map(dbProject => {
        const projectPhotos = photos.filter(p => p.project_id === dbProject.id);
        const projectReceipts = receipts.filter(r => r.project_id === dbProject.id);
        return mapDbProjectToProject(
          dbProject as DbProject,
          projectPhotos,
          projectReceipts
        );
      });

      setProjects(mappedProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: 'Error loading projects',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const addProject = async (data: Partial<Project>): Promise<Project | null> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data: newProject, error } = await supabase
        .from('projects')
        .insert({
          user_id: userData.user.id,
          client_id: data.clientId,
          title: data.title || '',
          description: data.description || null,
          items: JSON.parse(JSON.stringify(data.items || [])),
          status: data.status || 'draft',
          valid_until: data.validUntil?.toISOString() || null,
          quote_notes: data.quoteNotes || null,
        } as any)
        .select()
        .single();

      if (error) throw error;

      const project = mapDbProjectToProject(newProject as DbProject, [], []);
      setProjects(prev => [project, ...prev]);
      return project;
    } catch (error) {
      console.error('Error adding project:', error);
      toast({
        title: 'Error creating project',
        description: 'Please try again',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateProject = async (updatedProject: Project): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          client_id: updatedProject.clientId,
          title: updatedProject.title,
          description: updatedProject.description || null,
          items: JSON.parse(JSON.stringify(updatedProject.items)),
          status: updatedProject.status,
          valid_until: updatedProject.validUntil?.toISOString() || null,
          quote_notes: updatedProject.quoteNotes || null,
          invoice_id: updatedProject.invoiceId || null,
          sent_at: updatedProject.sentAt?.toISOString() || null,
          accepted_at: updatedProject.acceptedAt?.toISOString() || null,
          started_at: updatedProject.startedAt?.toISOString() || null,
          completed_at: updatedProject.completedAt?.toISOString() || null,
          // Scheduling fields
          scheduled_date: updatedProject.scheduledDate 
            ? updatedProject.scheduledDate.toISOString().split('T')[0] 
            : null,
          arrival_window_start: updatedProject.arrivalWindowStart || null,
          arrival_window_end: updatedProject.arrivalWindowEnd || null,
          schedule_notes: updatedProject.scheduleNotes || null,
          schedule_notification_sent_at: updatedProject.scheduleNotificationSentAt?.toISOString() || null,
        } as any)
        .eq('id', updatedProject.id);

      if (error) throw error;

      setProjects(prev =>
        prev.map(p => (p.id === updatedProject.id ? updatedProject : p))
      );
      return true;
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: 'Error updating project',
        description: 'Please try again',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteProject = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: 'Error deleting project',
        description: 'Please try again',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Photo management
  const addPhoto = async (
    projectId: string,
    file: File,
    type: 'before' | 'progress' | 'after',
    caption?: string
  ): Promise<boolean> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      // Upload to private storage bucket
      const fileExt = file.name.split('.').pop();
      const filePath = `${userData.user.id}/projects/${projectId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Store the path (not the full URL) for private bucket
      // We'll generate signed URLs when displaying

      // Save to database with storage path (not full URL)
      const { data: newPhoto, error: dbError } = await supabase
        .from('project_photos')
        .insert({
          user_id: userData.user.id,
          project_id: projectId,
          type,
          storage_path: filePath,
          caption: caption || null,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Generate signed URL for immediate display
      const { data: signedUrlData } = await supabase.storage
        .from('project-files')
        .createSignedUrl(filePath, 3600);

      // Update local state with signed URL
      setProjects(prev =>
        prev.map(p => {
          if (p.id === projectId) {
            return {
              ...p,
              photos: [
                ...p.photos,
                {
                  id: newPhoto.id,
                  projectId,
                  type,
                  dataUrl: signedUrlData?.signedUrl || filePath,
                  caption,
                  createdAt: new Date(),
                },
              ],
            };
          }
          return p;
        })
      );

      return true;
    } catch (error) {
      console.error('Error adding photo:', error);
      toast({
        title: 'Error uploading photo',
        description: 'Please try again',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Receipt management - also adds receipt as a line item to the quote
  const addReceipt = async (
    projectId: string,
    file: File,
    description: string,
    amount: number
  ): Promise<boolean> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      // Upload to private storage bucket
      const fileExt = file.name.split('.').pop();
      const filePath = `${userData.user.id}/projects/${projectId}/receipts/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save to database with storage path (not full URL)
      const { data: newReceipt, error: dbError } = await supabase
        .from('project_receipts')
        .insert({
          user_id: userData.user.id,
          project_id: projectId,
          storage_path: filePath,
          description,
          amount,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Generate signed URL for immediate display
      const { data: signedUrlData } = await supabase.storage
        .from('project-files')
        .createSignedUrl(filePath, 3600);

      // Find the project to add the line item
      const project = projects.find(p => p.id === projectId);
      if (project) {
        // Create a new line item from the receipt
        const newLineItem: LineItem = {
          id: `receipt-${newReceipt.id}`,
          description: `Materials: ${description}`,
          quantity: 1,
          unitPrice: amount,
        };

        // Update project items in the database
        const updatedItems = [...project.items, newLineItem];
        await supabase
          .from('projects')
          .update({ items: JSON.parse(JSON.stringify(updatedItems)) })
          .eq('id', projectId);
      }

      // Update local state with receipt and new line item
      setProjects(prev =>
        prev.map(p => {
          if (p.id === projectId) {
            const newLineItem: LineItem = {
              id: `receipt-${newReceipt.id}`,
              description: `Materials: ${description}`,
              quantity: 1,
              unitPrice: amount,
            };
            return {
              ...p,
              items: [...p.items, newLineItem],
              receipts: [
                ...p.receipts,
                {
                  id: newReceipt.id,
                  projectId,
                  dataUrl: signedUrlData?.signedUrl || filePath,
                  description,
                  amount,
                  createdAt: new Date(),
                },
              ],
            };
          }
          return p;
        })
      );

      toast({
        title: 'Receipt added',
        description: 'Receipt saved and added to quote as a line item',
      });

      return true;
    } catch (error) {
      console.error('Error adding receipt:', error);
      toast({
        title: 'Error uploading receipt',
        description: 'Please try again',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    projects,
    loading,
    addProject,
    updateProject,
    deleteProject,
    addPhoto,
    addReceipt,
    refetch: fetchProjects,
  };
}
