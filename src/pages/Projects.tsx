import { useState, useEffect } from 'react';
import { Plus, Search, FolderKanban, Send, CheckCircle, Play, DollarSign } from 'lucide-react';
import { Project, Client, Invoice, LineItem } from '@/types';
import { mockClients } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { ProjectDialog } from '@/components/projects/ProjectDialog';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const mockProjects: Project[] = [
  {
    id: '1',
    clientId: '1',
    title: 'Kitchen Renovation',
    description: 'Complete kitchen remodel including cabinets and countertops',
    items: [
      { id: '1', description: 'Labor - Kitchen demolition', quantity: 8, unitPrice: 75 },
      { id: '2', description: 'Cabinet installation', quantity: 1, unitPrice: 2500 },
    ],
    status: 'in_progress',
    photos: [],
    receipts: [],
    mileageEntries: [],
    createdAt: new Date('2024-12-01'),
    acceptedAt: new Date('2024-12-05'),
    startedAt: new Date('2024-12-10'),
  },
  {
    id: '2',
    clientId: '2',
    title: 'Bathroom Remodel',
    description: 'Master bathroom tile and fixtures',
    items: [
      { id: '1', description: 'Tile work', quantity: 1, unitPrice: 1800 },
      { id: '2', description: 'Fixture installation', quantity: 1, unitPrice: 500 },
    ],
    status: 'completed',
    photos: [],
    receipts: [],
    mileageEntries: [],
    createdAt: new Date('2024-11-20'),
    completedAt: new Date('2024-12-15'),
  },
];

export default function Projects() {
  const [projects, setProjects] = useLocalStorage<Project[]>('ceb-projects', mockProjects);
  const [clients] = useLocalStorage<Client[]>('ceb-clients', mockClients);
  const [invoices, setInvoices] = useLocalStorage<Invoice[]>('ceb-invoices', []);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [preSelectedClientId, setPreSelectedClientId] = useState<string | null>(null);
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

  const handleCreateProject = (data: Partial<Project>) => {
    const newProject: Project = {
      id: Date.now().toString(),
      clientId: data.clientId || '',
      title: data.title || '',
      description: data.description,
      items: [],
      status: 'draft',
      photos: [],
      receipts: [],
      mileageEntries: [],
      createdAt: new Date(),
    };
    setProjects((prev) => [...prev, newProject]);
    setIsDialogOpen(false);
    toast({ title: 'Project created' });
  };

  const handleUpdateProject = (updatedProject: Project) => {
    console.log('handleUpdateProject called for project:', updatedProject.id, 'photos:', updatedProject.photos.length);
    setProjects((prev) => {
      const existingProject = prev.find(p => p.id === updatedProject.id);
      console.log('Found existing project:', !!existingProject, 'with', existingProject?.photos.length || 0, 'photos');
      const newProjects = prev.map((p) => (p.id === updatedProject.id ? updatedProject : p));
      console.log('Updated projects array, new length:', newProjects.length);
      return newProjects;
    });
  };

  const handleDeleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    toast({ title: 'Project deleted' });
  };

  const handleCreateInvoice = (project: Project) => {
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    const newInvoice: Invoice = {
      id: Date.now().toString(),
      quoteId: project.id,
      clientId: project.clientId,
      invoiceNumber,
      items: project.items,
      status: 'draft',
      createdAt: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      notes: project.quoteNotes,
    };
    
    setInvoices((prev) => [...prev, newInvoice]);
    handleUpdateProject({ ...project, status: 'invoiced', invoiceId: newInvoice.id });
    toast({ title: 'Invoice created', description: `Invoice ${invoiceNumber} ready` });
    navigate('/invoices');
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-1">Quote, track, and invoice your work</p>
        </div>
        <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

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
    </div>
  );
}
