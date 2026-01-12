import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, FolderKanban, Receipt, BarChart3, Package, Menu, LogOut, Car } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUserLogo } from '@/hooks/useUserLogo';
import cebLogo from '@/assets/ceb-logo.png';

interface AppLayoutProps {
  children: React.ReactNode;
}
const navigation = [{
  name: 'Dashboard',
  href: '/',
  icon: LayoutDashboard
}, {
  name: 'Clients',
  href: '/clients',
  icon: Users
}, {
  name: 'Projects',
  href: '/projects',
  icon: FolderKanban
}, {
  name: 'Invoices',
  href: '/invoices',
  icon: Receipt
}, {
  name: 'Reports',
  href: '/reports',
  icon: BarChart3
}, {
  name: 'Materials',
  href: '/materials',
  icon: Package
}, {
  name: 'Mileage Pro',
  href: '/mileage',
  icon: Car
}];
export function AppLayout({
  children
}: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const {
    user,
    signOut
  } = useAuth();
  const { logoUrl } = useUserLogo();
  
  // Use custom logo if set, otherwise fall back to default
  const displayLogo = logoUrl || cebLogo;
  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', {
      replace: true
    });
  };
  return <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={cn("fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col", sidebarOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
          <img src={displayLogo} alt="CEB Building Logo" className="h-10 w-10 rounded-lg object-cover border-0" />
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">CEB Building</h1>
            <p className="text-xs text-sidebar-foreground/60">{user?.email || 'chad@cebbuilding.com'}</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigation.map(item => {
          const isActive = location.pathname === item.href;
          return <NavLink key={item.name} to={item.href} onClick={() => setSidebarOpen(false)} className={cn("flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200", isActive ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground")}>
                <item.icon className="h-5 w-5" />
                {item.name}
              </NavLink>;
        })}
        </nav>

        {/* Sign Out Button */}
        <div className="px-4 py-4 border-t border-sidebar-border">
          <Button variant="ghost" className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 bg-background/80 backdrop-blur-md border-b border-border px-4 lg:px-8">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex-1" />
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8 animate-fade-in">
          {children}
        </main>
      </div>
    </div>;
}