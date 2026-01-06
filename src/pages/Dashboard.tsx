import { Link } from 'react-router-dom';
import { Users, FileText, Receipt, DollarSign, FolderKanban } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { OverdueAlerts } from '@/components/dashboard/OverdueAlerts';
import { mockClients, mockInvoices } from '@/lib/mockData';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Client, Invoice, Project } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export default function Dashboard() {
  const [clients] = useLocalStorage<Client[]>('ceb-clients', mockClients);
  const [projects] = useLocalStorage<Project[]>('ceb-projects', []);
  const [invoices] = useLocalStorage<Invoice[]>('ceb-invoices', mockInvoices);

  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0), 0);

  const pendingAmount = invoices
    .filter(inv => inv.status === 'sent' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0), 0);

  const overdueCount = invoices.filter(inv => {
    if (inv.status === 'paid') return false;
    return new Date(inv.dueDate) < new Date();
  }).length;

  const handleSendReminder = async (invoice: Invoice, method: 'email' | 'text') => {
    const client = clients.find(c => c.id === invoice.clientId);
    if (!client) {
      toast({ title: "Error", description: "Client not found", variant: "destructive" });
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
        description: `${method === 'email' ? 'Email' : 'Text'} reminder sent to ${client.name}`,
      });
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast({
        title: "Error",
        description: `Failed to send ${method} reminder`,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's your business overview.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Clients"
          value={clients.length}
          icon={Users}
          variant="default"
          href="/clients"
        />
        <StatCard
          title="Active Projects"
          value={projects.filter(p => p.status === 'draft' || p.status === 'sent' || p.status === 'accepted' || p.status === 'in_progress').length}
          icon={FolderKanban}
          variant="primary"
          href="/projects"
        />
        <StatCard
          title="Pending Invoices"
          value={`$${pendingAmount.toLocaleString()}`}
          icon={Receipt}
          variant={overdueCount > 0 ? "danger" : "warning"}
          href="/invoices"
        />
        <StatCard
          title="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          variant="success"
          trend={{ value: 12, isPositive: true }}
          href="/invoices"
        />
      </div>

      {overdueCount > 0 && (
        <OverdueAlerts 
          invoices={invoices} 
          clients={clients} 
          onSendReminder={handleSendReminder}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentActivity />
        
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">Quick Actions</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link 
              to="/clients" 
              className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
            >
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-card-foreground">Add Client</p>
                <p className="text-sm text-muted-foreground">Create new contact</p>
              </div>
            </Link>
            <Link 
              to="/projects" 
              className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
            >
              <FolderKanban className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-card-foreground">New Project</p>
                <p className="text-sm text-muted-foreground">Create quote/job</p>
              </div>
            </Link>
            <Link 
              to="/invoices" 
              className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
            >
              <Receipt className="h-5 w-5 text-accent" />
              <div>
                <p className="font-medium text-card-foreground">New Invoice</p>
                <p className="text-sm text-muted-foreground">Bill a client</p>
              </div>
            </Link>
            <Link 
              to="/invoices" 
              className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-success/50 hover:bg-success/5 transition-all duration-200"
            >
              <DollarSign className="h-5 w-5 text-success" />
              <div>
                <p className="font-medium text-card-foreground">Record Payment</p>
                <p className="text-sm text-muted-foreground">Mark invoice paid</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}