import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Users, Receipt, DollarSign, FolderKanban, Settings, Loader2, Calendar, CalendarPlus } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { OverdueAlerts } from '@/components/dashboard/OverdueAlerts';
import { DashboardAvatar } from '@/components/dashboard/DashboardAvatar';
import { ReferralRewardCard } from '@/components/dashboard/ReferralRewardCard';
import { TodaySchedule } from '@/components/dashboard/TodaySchedule';
import { UpcomingAppointments } from '@/components/dashboard/UpcomingAppointments';
import { BusinessProfileDialog } from '@/components/settings/BusinessProfileDialog';
import { PartnerSuggestions } from '@/components/reports/PartnerSuggestions';
import { ClientDialog } from '@/components/clients/ClientDialog';
import { ProjectDialog } from '@/components/projects/ProjectDialog';
import { InvoiceDialog } from '@/components/invoices/InvoiceDialog';
import { AppointmentDialog } from '@/components/scheduling/AppointmentDialog';
import { SetupWizard } from '@/components/setup/SetupWizard';
import { Button } from '@/components/ui/button';
import { mockClients, mockInvoices } from '@/lib/mockData';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useProjects } from '@/hooks/useProjects';
import { useClients } from '@/hooks/useClients';
import { useInvoices } from '@/hooks/useInvoices';
import { useAppointments } from '@/hooks/useAppointments';
import { useServices } from '@/hooks/useServices';
import { useSetup } from '@/hooks/useSetup';
import { useAppState } from '@/hooks/useAppState';
import { AppState } from '@/lib/appState';
import { Client, Invoice, Project } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export default function Dashboard() {
  const navigate = useNavigate();
  const [localClients] = useLocalStorage<Client[]>('ceb-clients', mockClients);
  const [localInvoices] = useLocalStorage<Invoice[]>('ceb-invoices', mockInvoices);
  const { projects, addProject } = useProjects();
  const { clients: dbClients, addClient } = useClients();
  const { addInvoice } = useInvoices();
  const { appointments, addAppointment, isStationaryBusiness } = useAppointments();
  const { services } = useServices();
  const { completeSetup, loading: setupLoading } = useSetup();
  const { state, loading: appStateLoading, isSetupComplete, refreshState, setupProgress } = useAppState();
  
  // Use DB clients if available, otherwise fall back to local
  const clients = dbClients.length > 0 ? dbClients : localClients;
  const invoices = localInvoices;
  
  // Dashboard avatar state
  const [dashboardLogoUrl, setDashboardLogoUrl] = useState<string | null>(null);
  const [isLoadingAvatar, setIsLoadingAvatar] = useState(true);
  const [showBusinessProfile, setShowBusinessProfile] = useState(false);
  
  // Dialog states for quick actions
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);

  // Business type detection
  const isMobileOrContractor = !isStationaryBusiness;

  // Fetch dashboard logo on mount
  useEffect(() => {
    const fetchDashboardLogo = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoadingAvatar(false);
          return;
        }

        const { data } = await supabase
          .from('user_settings')
          .select('dashboard_logo_url')
          .eq('user_id', user.id)
          .single();

        if (data?.dashboard_logo_url) {
          setDashboardLogoUrl(data.dashboard_logo_url);
        }
      } catch (error) {
        console.error('Error fetching dashboard logo:', error);
      } finally {
        setIsLoadingAvatar(false);
      }
    };

    fetchDashboardLogo();
  }, []);

  const totalRevenue = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0), 0);
  const pendingAmount = invoices.filter(inv => inv.status === 'sent' || inv.status === 'overdue').reduce((sum, inv) => sum + inv.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0), 0);
  const overdueCount = invoices.filter(inv => {
    if (inv.status === 'paid') return false;
    return new Date(inv.dueDate) < new Date();
  }).length;

  const handleSendReminder = async (invoice: Invoice, method: 'email' | 'text') => {
    const client = clients.find(c => c.id === invoice.clientId);
    if (!client) {
      toast({
        title: "Error",
        description: "Client not found",
        variant: "destructive"
      });
      return;
    }

    // Copy link instead of SMS
    if (method === 'text') {
      const paymentUrl = invoice.paymentToken 
        ? `${window.location.origin}/pay/${invoice.paymentToken}`
        : `${window.location.origin}/invoices/${invoice.id}`;
      
      try {
        await navigator.clipboard.writeText(paymentUrl);
        toast({
          title: "Link copied!",
          description: "Payment link copied to clipboard. Paste it in a text message to your client."
        });
      } catch (error) {
        // Fallback
        const textArea = document.createElement('textarea');
        textArea.value = paymentUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast({
          title: "Link copied!",
          description: "Payment link copied. Paste it in a text message."
        });
      }
      return;
    }

    const total = invoice.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    try {
      const { error } = await supabase.functions.invoke('send-overdue-reminder', {
        body: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          clientName: client.name,
          clientEmail: client.email,
          clientPhone: client.phone,
          amount: total,
          dueDate: invoice.dueDate,
          method
        }
      });
      if (error) throw error;
      toast({
        title: "Reminder Sent",
        description: `Email reminder sent to ${client.name}`
      });
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast({
        title: "Error",
        description: "Failed to send email reminder",
        variant: "destructive"
      });
    }
  };

  const handleSaveClient = async (data: { name: string; email: string; phone: string; address: string }) => {
    const result = await addClient(data);
    if (result) {
      toast({
        title: "Client added",
        description: `${data.name} has been added to your clients.`
      });
      setClientDialogOpen(false);
    }
  };

  const handleSaveProject = async (data: Partial<Project>) => {
    if (!data.title || !data.clientId) {
      toast({
        title: "Missing fields",
        description: "Please provide a title and select a client.",
        variant: "destructive"
      });
      return;
    }
    
    const result = await addProject({
      title: data.title,
      description: data.description || '',
      clientId: data.clientId,
      status: 'draft',
      items: [],
    });
    
    if (result) {
      toast({
        title: "Project created",
        description: `${data.title} has been created.`
      });
      setProjectDialogOpen(false);
    }
  };

  const handleSaveInvoice = async (data: Omit<Invoice, 'id' | 'createdAt'>) => {
    const result = await addInvoice(data);
    if (result) {
      toast({
        title: "Invoice created",
        description: `Invoice ${data.invoiceNumber} has been created.`
      });
      setInvoiceDialogOpen(false);
    }
  };

  // Handle appointment creation for stationary businesses
  const handleSaveAppointment = async (data: {
    clientId: string;
    serviceId?: string;
    date: Date;
    startTime: string;
    duration: number;
    notes?: string;
  }) => {
    const service = data.serviceId ? services.find(s => s.id === data.serviceId) : undefined;
    
    const result = await addAppointment({
      ...data,
      createProject: true,
      serviceName: service?.name,
      servicePrice: service?.price,
    });
    
    if (result) {
      toast({
        title: "Appointment booked!",
        description: `Appointment scheduled for ${data.date.toLocaleDateString()}.`
      });
      setAppointmentDialogOpen(false);
    }
  };

  // Handle setup completion - refresh app state after
  const handleSetupComplete = async (data: Parameters<typeof completeSetup>[0]) => {
    const success = await completeSetup(data);
    if (success) {
      // Refresh app state to transition from SETUP_INCOMPLETE to READY_BASE
      await refreshState();
    }
    return success;
  };

  // Show loading while checking setup state
  const loading = setupLoading || appStateLoading;
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show setup wizard based on AppState (SETUP_INCOMPLETE or ADMIN_PREVIEW with incomplete setup)
  const shouldShowSetup = !isSetupComplete && 
    (state === AppState.SETUP_INCOMPLETE || state === AppState.ADMIN_PREVIEW);
  
  if (shouldShowSetup) {
    return <SetupWizard onComplete={handleSetupComplete} />;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <DashboardAvatar 
            imageUrl={dashboardLogoUrl} 
            onImageChange={setDashboardLogoUrl}
            isLoading={isLoadingAvatar}
          />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back! Here's your business overview.</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowBusinessProfile(true)}
          className="gap-2"
        >
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Business Settings</span>
        </Button>
      </div>

      {/* Referral Reward Card */}
      <ReferralRewardCard />

      {/* Quick Actions - business-type-aware */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <button 
          onClick={() => setClientDialogOpen(true)}
          className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 w-full text-left"
        >
          <Users className="text-primary w-8 h-8" />
          <div>
            <p className="text-card-foreground font-bold text-sm">Add Client</p>
            <p className="text-sm text-muted-foreground">Create new contact</p>
          </div>
        </button>
        
        {/* Conditional: Project for mobile/contractor, Appointment for stationary */}
        {isMobileOrContractor ? (
          <button 
            onClick={() => setProjectDialogOpen(true)}
            className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 w-full text-left"
          >
            <FolderKanban className="text-primary w-8 h-8" />
            <div>
              <p className="text-card-foreground text-sm font-bold">New Project</p>
              <p className="text-sm text-muted-foreground">Create quote/job</p>
            </div>
          </button>
        ) : (
          <button 
            onClick={() => setAppointmentDialogOpen(true)}
            className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 w-full text-left"
          >
            <CalendarPlus className="text-primary w-8 h-8" />
            <div>
              <p className="text-card-foreground text-sm font-bold">New Appointment</p>
              <p className="text-sm text-muted-foreground">Book a client</p>
            </div>
          </button>
        )}
        
        <button 
          onClick={() => setInvoiceDialogOpen(true)} 
          className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 w-full text-left"
        >
          <Receipt className="text-accent w-8 h-8" />
          <div>
            <p className="text-card-foreground text-sm font-bold">New Invoice</p>
            <p className="text-sm text-muted-foreground">Bill a client</p>
          </div>
        </button>
        <button 
          onClick={() => navigate('/invoices')}
          className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:border-success/50 hover:bg-success/5 transition-all duration-200 w-full text-left"
        >
          <DollarSign className="text-success w-8 h-8" />
          <div>
            <p className="text-card-foreground text-sm font-bold">Record Payment</p>
            <p className="text-sm text-muted-foreground">Mark invoice paid</p>
          </div>
        </button>
      </div>

      {/* Business-type-aware stat cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Clients" value={clients.length} icon={Users} variant="default" href="/clients" />
        {isMobileOrContractor ? (
          <StatCard title="Active Projects" value={projects.filter(p => p.status === 'draft' || p.status === 'sent' || p.status === 'accepted' || p.status === 'in_progress').length} icon={FolderKanban} variant="primary" href="/projects" />
        ) : (
          <StatCard title="Upcoming Appointments" value={appointments.filter(a => a.status === 'scheduled').length} icon={Calendar} variant="primary" href="/appointments" />
        )}
        <StatCard title="Pending Invoices" value={`$${pendingAmount.toLocaleString()}`} icon={Receipt} variant={overdueCount > 0 ? "danger" : "warning"} href="/invoices" />
        <StatCard title="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} variant="success" trend={{
          value: 12,
          isPositive: true
        }} href="/financials" />
      </div>

      {overdueCount > 0 && <OverdueAlerts invoices={invoices} clients={clients} onSendReminder={handleSendReminder} />}

      <RecentActivity />

      {/* Partner Suggestions - at bottom, out of the way */}
      <PartnerSuggestions />

      <BusinessProfileDialog 
        open={showBusinessProfile} 
        onOpenChange={setShowBusinessProfile} 
      />

      {/* Quick Action Dialogs */}
      <ClientDialog
        open={clientDialogOpen}
        onOpenChange={setClientDialogOpen}
        onSave={handleSaveClient}
      />

      <ProjectDialog
        open={projectDialogOpen}
        onOpenChange={setProjectDialogOpen}
        project={null}
        clients={clients}
        onSave={handleSaveProject}
      />

      <InvoiceDialog
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
        clients={clients}
        onSave={handleSaveInvoice}
      />

      {/* Appointment Dialog for stationary businesses */}
      <AppointmentDialog
        open={appointmentDialogOpen}
        onOpenChange={setAppointmentDialogOpen}
        clients={clients}
        services={services}
        onSave={handleSaveAppointment}
      />
    </div>
  );
}
