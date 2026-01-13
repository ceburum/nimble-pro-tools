import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, FolderKanban, Receipt, Menu, LogOut, 
  Car, CalendarDays, Calculator, Lock, Scissors, StickyNote,
  Cloud, Sparkles, BarChart3, CreditCard, Shield, BookOpen, ExternalLink,
  UserPlus, Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { useUserLogo } from '@/hooks/useUserLogo';
import { useSchedulingPro } from '@/hooks/useSchedulingPro';
import { useFinancialPro } from '@/hooks/useFinancialPro';
import { useMileagePro } from '@/hooks/useMileagePro';
import { useTaxPro } from '@/hooks/useTaxPro';
import { useServices } from '@/hooks/useServices';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { supabase } from '@/integrations/supabase/client';
import cebLogo from '@/assets/ceb-logo.png';

interface AppLayoutProps {
  children: React.ReactNode;
}

// Base app navigation
const baseNavigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Invoices', href: '/invoices', icon: Receipt },
  { name: 'Notepad', href: '/notepad', icon: StickyNote },
];

// Add-ons (paid features)
const addOnsNavigation = [
  { name: 'Cloud Backup', href: '/pro/cloud', icon: Cloud, flagKey: 'cloud_backup_enabled' as const },
  { name: 'AI Scanning', href: '/pro/ai-scanner', icon: Sparkles, flagKey: 'cloud_backup_enabled' as const },
  { name: 'Scheduling Pro', href: '/scheduling', icon: CalendarDays, flagKey: 'scheduling_pro_enabled' as const },
  { name: 'Financial Pro', href: '/reports', icon: BarChart3, flagKey: 'financial_pro_enabled' as const },
  { name: 'Mileage Pro', href: '/mileage', icon: Car, flagKey: 'mileage_pro_enabled' as const },
  { name: 'Tax Pro', href: '/tax-pro', icon: Calculator, flagKey: 'tax_pro_enabled' as const },
  { name: 'Service Menu', href: '/services', icon: Scissors, flagKey: 'service_menu_enabled' as const },
];

// Affiliate links
const affiliateLinks = [
  { 
    name: 'Stripe Payments', 
    href: 'https://stripe.com/partners/directory/lovable', 
    icon: CreditCard, 
    external: true,
    description: 'Accept card payments',
  },
  { 
    name: 'Zoho Mail', 
    href: 'https://www.zoho.com/mail/', 
    icon: BookOpen, 
    external: true,
    description: 'Professional email',
  },
];

// Recommendations (optional resources)
const recommendationLinks = [
  { 
    name: 'Simply Business', 
    href: 'https://www.simplybusiness.com/', 
    icon: Shield, 
    external: true,
    description: 'Business insurance',
  },
];
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
  const { isEnabled: schedulingEnabled } = useSchedulingPro();
  const { isEnabled: financialEnabled } = useFinancialPro();
  const { isEnabled: mileageEnabled } = useMileagePro();
  const { isEnabled: taxEnabled } = useTaxPro();
  const { isEnabled: servicesEnabled } = useServices();
  const { isDevModeEnabled, toggleDevMode } = useFeatureFlags();
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Check if user is admin
  useEffect(() => {
    async function checkAdminRole() {
      if (!user?.id) return;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      setIsAdmin(!!data);
    }
    checkAdminRole();
  }, [user?.id]);
  
  // Use custom logo if set, otherwise fall back to default
  const displayLogo = logoUrl || cebLogo;
  
  // Map of add-on enabled states - dev mode unlocks all
  const addOnEnabledMap: Record<string, boolean> = isDevModeEnabled ? {
    'cloud_backup_enabled': true,
    'scheduling_pro_enabled': true,
    'financial_pro_enabled': true,
    'mileage_pro_enabled': true,
    'tax_pro_enabled': true,
    'service_menu_enabled': true,
  } : {
    'cloud_backup_enabled': false,
    'scheduling_pro_enabled': schedulingEnabled,
    'financial_pro_enabled': financialEnabled,
    'mileage_pro_enabled': mileageEnabled,
    'tax_pro_enabled': taxEnabled,
    'service_menu_enabled': servicesEnabled,
  };

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

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {/* Base App Features */}
          {baseNavigation.map(item => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink 
                key={item.name} 
                to={item.href} 
                onClick={() => setSidebarOpen(false)} 
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200", 
                  isActive ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </NavLink>
            );
          })}

          {/* Separator */}
          <div className="my-4 border-t border-sidebar-border" />
          
          {/* Add-ons Label */}
          <p className="px-4 py-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
            Add-ons
          </p>

          {/* Add-on Features */}
          {addOnsNavigation.map(item => {
            const isActive = location.pathname === item.href;
            const isUnlocked = addOnEnabledMap[item.flagKey];
            return (
              <NavLink 
                key={item.name} 
                to={item.href} 
                onClick={() => setSidebarOpen(false)} 
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200", 
                  isActive ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="flex-1">{item.name}</span>
                {!isUnlocked && (
                  <Lock className="h-3.5 w-3.5 text-sidebar-foreground/40" />
                )}
              </NavLink>
            );
          })}

          {/* Separator */}
          <div className="my-4 border-t border-sidebar-border" />
          
          {/* Affiliates Label */}
          <p className="px-4 py-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
            Partners
          </p>

          {/* Affiliate Links */}
          {affiliateLinks.map(item => (
            <a
              key={item.name}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <item.icon className="h-5 w-5" />
              <span className="flex-1">{item.name}</span>
              <ExternalLink className="h-3.5 w-3.5 text-sidebar-foreground/40" />
            </a>
          ))}

          {/* Recommendations (collapsible or smaller) */}
          {recommendationLinks.map(item => (
            <a
              key={item.name}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <item.icon className="h-4 w-4" />
              <span className="flex-1">{item.name}</span>
              <ExternalLink className="h-3 w-3 text-sidebar-foreground/30" />
            </a>
          ))}

          {/* Separator */}
          <div className="my-4 border-t border-sidebar-border" />
          
          {/* Affiliates Label */}
          <p className="px-4 py-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
            Earn Money
          </p>

          {/* Affiliate Link */}
          <NavLink 
            to="/affiliates"
            onClick={() => setSidebarOpen(false)} 
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200", 
              location.pathname === '/affiliates' ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
          >
            <UserPlus className="h-5 w-5" />
            Become a Salesperson
          </NavLink>

          {/* Admin Link - only visible to admins */}
          {isAdmin && (
            <NavLink 
              to="/affiliate-admin"
              onClick={() => setSidebarOpen(false)} 
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200", 
                location.pathname === '/affiliate-admin' ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <Settings className="h-5 w-5" />
              Manage Affiliates
            </NavLink>
          )}
        </nav>

        {/* Footer with Dev Mode Toggle + Sign Out */}
        <div className="px-4 py-4 border-t border-sidebar-border space-y-2">
          {/* Dev Mode Toggle - Admin Only */}
          {isAdmin && (
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-sidebar-accent/50">
              <span className="text-xs font-medium text-sidebar-foreground/70">Dev Mode</span>
              <Switch 
                checked={isDevModeEnabled} 
                onCheckedChange={toggleDevMode}
                className="scale-90"
              />
            </div>
          )}
          
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