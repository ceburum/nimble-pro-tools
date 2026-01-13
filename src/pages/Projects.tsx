import { useState, useEffect } from 'react';
import { Plus, Search, FolderKanban, Send, CheckCircle, Play, DollarSign, Loader2 } from 'lucide-react';
import { Project } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { ProjectDialog } from '@/components/projects/ProjectDialog';
import { InvoiceReceiptSelectionDialog } from '@/components/invoices/InvoiceReceiptSelectionDialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useClients } from '@/hooks/useClients';
import { useInvoices } from '@/hooks/useInvoices';
import { useProjects } from '@/hooks/useProjects';

export default function Projects() {
  const {
    projects,
    loading: projectsLoading,
    addProject,
    updateProject,
    deleteProject,
    addReceipt,
  } = useProjects();
  const { clients, loading: clientsLoading } = useClients();
  const { addInvoice, loading: invoicesLoading } = useInvoices();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [preSelectedClientId, setPreSelectedClientId] = useState<string | null>(null);
  const [receiptSelectionOpen, setReceiptSelectionOpen] = useState(false);
  const [projectForInvoice, setProjectForInvoice] = useState<Project | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Handle navigation state for creating project from client
  useEffect(() => {
    const state = location.state as { openNewProject?: boolean; selectedClientId?: string } | null;
    if (state?.openNewProject) {
      setPreSelectedClientId(state.selectedClientId || null);
      setIsDialogOpen(true);
      // Clear the state so it doesn't re-trigger
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

  const filteredProjects = projects.filter((project) => {
    const client = clients.find((c) => c.id === project.clientId);
    return (
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleCreateProject = async (data: Partial<Project>) => {
    const newProject = await addProject({
      clientId: data.clientId || '',
      title: data.title || '',
      description: data.description,
      items: [],
      status: 'draft',
    });
    
    if (newProject) {
      setIsDialogOpen(false);
      toast({ title: 'Project created' });
    }
  };

  const handleUpdateProject = async (updatedProject: Project) => {
    console.log('handleUpdateProject called for project:', updatedProject.id, 'photos:', updatedProject.photos.length);
    await updateProject(updatedProject);
  };

  const handleDeleteProject = async (id: string) => {
    const success = await deleteProject(id);
    if (success) {
      toast({ title: 'Project deleted' });
    }
  };

  const handleCreateInvoice = (project: Project) => {
    // If project has receipts, show selection dialog
    if (project.receipts.length > 0) {
      setProjectForInvoice(project);
      setReceiptSelectionOpen(true);
    } else {
      // No receipts, create invoice directly
      createInvoiceWithReceipts(project, []);
    }
  };

  const createInvoiceWithReceipts = async (project: Project, receiptPaths: string[]) => {
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    
    // Convert receipt paths to InvoiceReceiptAttachment format
    const receiptAttachments = receiptPaths.map(path => {
      const projectReceipt = project.receipts.find(r => r.dataUrl === path || (r as any).storagePath === path);
      return {
        storagePath: path,
        storeName: projectReceipt?.description || path.split('/').pop()?.replace(/\.\w+$/, '') || 'Receipt',
        amount: projectReceipt?.amount || 0,
      };
    });
    
    const newInvoice = await addInvoice({
      clientId: project.clientId,
      invoiceNumber,
      items: project.items,
      status: 'draft',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      notes: project.quoteNotes,
      receiptAttachments: receiptAttachments.length > 0 ? receiptAttachments : undefined,
    });
    
    if (newInvoice) {
      handleUpdateProject({ ...project, status: 'invoiced', invoiceId: newInvoice.id });
      toast({ 
        title: 'Invoice created', 
        description: receiptPaths.length > 0 
          ? `Invoice ${invoiceNumber} ready with ${receiptPaths.length} receipt${receiptPaths.length > 1 ? 's' : ''} attached`
          : `Invoice ${invoiceNumber} ready`
      });
      navigate('/invoices');
    }
    setProjectForInvoice(null);
  };

  // Group projects by status
  const draftProjects = filteredProjects.filter((p) => p.status === 'draft');
  const sentProjects = filteredProjects.filter((p) => p.status === 'sent');
  const acceptedProjects = filteredProjects.filter((p) => p.status === 'accepted');
  const inProgressProjects = filteredProjects.filter((p) => p.status === 'in_progress');
  const completedProjects = filteredProjects.filter((p) => p.status === 'completed');
  const invoicedProjects = filteredProjects.filter((p) => p.status === 'invoiced');

  const statusGroups = [
    { key: 'in_progress', label: 'In Progress', icon: Play, projects: inProgressProjects },
    { key: 'accepted', label: 'Accepted', icon: CheckCircle, projects: acceptedProjects },
    { key: 'sent', label: 'Sent', icon: Send, projects: sentProjects },
    { key: 'draft', label: 'Drafts', icon: FolderKanban, projects: draftProjects },
    { key: 'completed', label: 'Completed', icon: CheckCircle, projects: completedProjects },
    { key: 'invoiced', label: 'Invoiced', icon: DollarSign, projects: invoicedProjects },
  ].filter((g) => g.projects.length > 0);

  const loading = projectsLoading || clientsLoading || invoicesLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Quote, track, and invoice your work"
        action={
          <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        }
      />

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Play className="h-4 w-4" />
            <span className="text-sm">Active</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{inProgressProjects.length}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Send className="h-4 w-4" />
            <span className="text-sm">Quotes Sent</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{sentProjects.length}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Completed</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{completedProjects.length}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm">Total Value</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            ${filteredProjects.reduce((sum, p) => sum + p.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0), 0).toFixed(0)}
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No projects found.</p>
          <Button variant="link" className="mt-2" onClick={() => setIsDialogOpen(true)}>
            Create your first project
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {statusGroups.map((group) => (
            <div key={group.key}>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <group.icon className="h-5 w-5" />
                {group.label} ({group.projects.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {group.projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    client={clients.find((c) => c.id === project.clientId)}
                    onUpdate={handleUpdateProject}
                    onDelete={handleDeleteProject}
                    onCreateInvoice={handleCreateInvoice}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <ProjectDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setPreSelectedClientId(null);
        }}
        project={editingProject}
        clients={clients}
        onSave={handleCreateProject}
        defaultClientId={preSelectedClientId}
      />

      <InvoiceReceiptSelectionDialog
        open={receiptSelectionOpen}
        onOpenChange={setReceiptSelectionOpen}
        receipts={projectForInvoice?.receipts || []}
        projectTitle={projectForInvoice?.title || ''}
        onConfirm={(selectedPaths) => {
          if (projectForInvoice) {
            createInvoiceWithReceipts(projectForInvoice, selectedPaths);
          }
        }}
      />
    </div>
  );
}
