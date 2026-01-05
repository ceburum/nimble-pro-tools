import { Users, FileText, Receipt, DollarSign } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { mockClients, mockQuotes, mockInvoices } from '@/lib/mockData';

export default function Dashboard() {
  const totalRevenue = mockInvoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0), 0);

  const pendingAmount = mockInvoices
    .filter(inv => inv.status === 'sent' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's your business overview.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Clients"
          value={mockClients.length}
          icon={Users}
          variant="default"
        />
        <StatCard
          title="Active Quotes"
          value={mockQuotes.filter(q => q.status === 'sent' || q.status === 'draft').length}
          icon={FileText}
          variant="primary"
        />
        <StatCard
          title="Pending Invoices"
          value={`$${pendingAmount.toLocaleString()}`}
          icon={Receipt}
          variant="warning"
        />
        <StatCard
          title="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          variant="success"
          trend={{ value: 12, isPositive: true }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentActivity />
        
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">Quick Actions</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <a 
              href="/clients" 
              className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
            >
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-card-foreground">Add Client</p>
                <p className="text-sm text-muted-foreground">Create new contact</p>
              </div>
            </a>
            <a 
              href="/quotes" 
              className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
            >
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-card-foreground">New Quote</p>
                <p className="text-sm text-muted-foreground">Create estimate</p>
              </div>
            </a>
            <a 
              href="/invoices" 
              className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
            >
              <Receipt className="h-5 w-5 text-accent" />
              <div>
                <p className="font-medium text-card-foreground">New Invoice</p>
                <p className="text-sm text-muted-foreground">Bill a client</p>
              </div>
            </a>
            <a 
              href="/invoices" 
              className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-success/50 hover:bg-success/5 transition-all duration-200"
            >
              <DollarSign className="h-5 w-5 text-success" />
              <div>
                <p className="font-medium text-card-foreground">Record Payment</p>
                <p className="text-sm text-muted-foreground">Mark invoice paid</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
