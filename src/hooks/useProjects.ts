import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Project, ProjectPhoto, ProjectReceipt, MileageEntry, LineItem } from '@/types';

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
}

interface DbProjectMileage {
  id: string;
  user_id: string;
  project_id: string | null;
  start_location: string;
  end_location: string;
  distance: number;
  start_time: string;
  end_time: string | null;
  is_tracking: boolean;
  coordinates: { lat: number; lng: number }[] | null;
  notes: string | null;
  created_at: string;
}

const mapDbProjectToProject = (
  dbProject: DbProject,
  photos: DbProjectPhoto[],
  receipts: DbProjectReceipt[],
  mileage: DbProjectMileage[]
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
    createdAt: new Date(dbProject.created_at),
    sentAt: dbProject.sent_at ? new Date(dbProject.sent_at) : undefined,
    acceptedAt: dbProject.accepted_at ? new Date(dbProject.accepted_at) : undefined,
    startedAt: dbProject.started_at ? new Date(dbProject.started_at) : undefined,
    completedAt: dbProject.completed_at ? new Date(dbProject.completed_at) : undefined,
    photos: photos.map(p => ({
      id: p.id,
      projectId: p.project_id,
      type: p.type as ProjectPhoto['type'],
      dataUrl: p.storage_path, // Will be converted to public URL
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
    })),
    mileageEntries: mileage.map(m => ({
      id: m.id,
      projectId: m.project_id || undefined,
      startLocation: m.start_location,
      endLocation: m.end_location,
      distance: Number(m.distance),
      startTime: new Date(m.start_time),
      endTime: m.end_time ? new Date(m.end_time) : undefined,
      isTracking: m.is_tracking,
      coordinates: m.coordinates || undefined,
      notes: m.notes || undefined,
    })),
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
      const [photosResult, receiptsResult, mileageResult] = await Promise.all([
        supabase.from('project_photos').select('*').in('project_id', projectIds),
        supabase.from('project_receipts').select('*').in('project_id', projectIds),
        supabase.from('project_mileage').select('*').in('project_id', projectIds),
      ]);

      const photos = (photosResult.data || []) as DbProjectPhoto[];
      const receipts = (receiptsResult.data || []) as DbProjectReceipt[];
      const mileage = (mileageResult.data || []) as DbProjectMileage[];

      // Map to Project type
      const mappedProjects = projectsData.map(dbProject => {
        const projectPhotos = photos.filter(p => p.project_id === dbProject.id);
        const projectReceipts = receipts.filter(r => r.project_id === dbProject.id);
        const projectMileage = mileage.filter(m => m.project_id === dbProject.id);
        return mapDbProjectToProject(
          dbProject as DbProject,
          projectPhotos,
          projectReceipts,
          projectMileage
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

      const project = mapDbProjectToProject(newProject as DbProject, [], [], []);
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

      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${userData.user.id}/projects/${projectId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);

      // Save to database
      const { data: newPhoto, error: dbError } = await supabase
        .from('project_photos')
        .insert({
          user_id: userData.user.id,
          project_id: projectId,
          type,
          storage_path: urlData.publicUrl,
          caption: caption || null,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Update local state
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
                  dataUrl: urlData.publicUrl,
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

  // Receipt management
  const addReceipt = async (
    projectId: string,
    file: File,
    description: string,
    amount: number
  ): Promise<boolean> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${userData.user.id}/projects/${projectId}/receipts/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);

      // Save to database
      const { data: newReceipt, error: dbError } = await supabase
        .from('project_receipts')
        .insert({
          user_id: userData.user.id,
          project_id: projectId,
          storage_path: urlData.publicUrl,
          description,
          amount,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Update local state
      setProjects(prev =>
        prev.map(p => {
          if (p.id === projectId) {
            return {
              ...p,
              receipts: [
                ...p.receipts,
                {
                  id: newReceipt.id,
                  projectId,
                  dataUrl: urlData.publicUrl,
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

  // Mileage management
  const addMileage = async (
    projectId: string,
    entry: Omit<MileageEntry, 'id'>
  ): Promise<boolean> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data: newMileage, error } = await supabase
        .from('project_mileage')
        .insert({
          user_id: userData.user.id,
          project_id: projectId,
          start_location: entry.startLocation,
          end_location: entry.endLocation,
          distance: entry.distance,
          start_time: entry.startTime.toISOString(),
          end_time: entry.endTime?.toISOString() || null,
          is_tracking: entry.isTracking,
          coordinates: entry.coordinates || null,
          notes: entry.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setProjects(prev =>
        prev.map(p => {
          if (p.id === projectId) {
            return {
              ...p,
              mileageEntries: [
                ...p.mileageEntries,
                {
                  id: newMileage.id,
                  projectId,
                  ...entry,
                },
              ],
            };
          }
          return p;
        })
      );

      return true;
    } catch (error) {
      console.error('Error adding mileage:', error);
      toast({
        title: 'Error saving mileage',
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
    addMileage,
    refetch: fetchProjects,
  };
}
