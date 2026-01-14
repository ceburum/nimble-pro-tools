import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, FolderKanban, Receipt, Menu, LogOut, 
  Car, CalendarDays, Lock, Scissors, StickyNote,
  BarChart3, CreditCard, Shield, BookOpen, ExternalLink,
  UserPlus, Settings, RotateCcw, ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useUserLogo } from '@/hooks/useUserLogo';
import { useAppState } from '@/hooks/useAppState';
import { AppState } from '@/lib/appState';
import { useToast } from '@/hooks/use-toast';
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

// Add-ons (paid features) - access determined by AppState
const addOnsNavigation = [
  { name: 'Scheduling Pro', href: '/scheduling', icon: CalendarDays, featureKey: 'scheduling' as const },
  { name: 'Financial Tool', href: '/reports', icon: BarChart3, featureKey: 'financial' as const },
  { name: 'Mileage Pro', href: '/mileage', icon: Car, featureKey: 'mileage' as const },
  { name: 'Service Menu', href: '/services', icon: Scissors, featureKey: 'serviceMenu' as const },
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

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { logoUrl } = useUserLogo();
  const { state, hasAccess, capabilities, resetToInstall, isAdmin } = useAppState();
  const { toast } = useToast();
  
  // Use custom logo if set, otherwise fall back to default
  const displayLogo = logoUrl || cebLogo;

  // Handle setup reset (ADMIN_PREVIEW only)
  const handleResetSetup = async () => {
    if (state !== AppState.ADMIN_PREVIEW) {
      toast({ 
        title: 'Access denied', 
        description: 'Only admins in preview mode can reset setup.',
        variant: 'destructive'
      });
      return;
    }
    
    if (confirm('Reset to initial setup? This will return to the onboarding wizard.')) {
      const success = await resetToInstall();
      if (success) {
        toast({ 
          title: 'Setup reset', 
          description: 'Returning to onboarding wizard...' 
        });
        // Use hard reload to force all hooks to re-fetch fresh state from database
        window.location.href = '/';
      } else {
        toast({ 
          title: 'Reset failed', 
          description: 'Could not reset setup. Please try again.',
          variant: 'destructive'
        });
      }
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  // Get state label for admin badge
  const getStateBadge = () => {
    switch (state) {
      case AppState.ADMIN_PREVIEW:
        return { label: 'Admin Preview', variant: 'default' as const };
      case AppState.TRIAL_PRO:
        return { label: 'Trial', variant: 'secondary' as const };
      case AppState.PAID_PRO:
        return { label: 'Pro', variant: 'default' as const };
      default:
        return null;
    }
  };

  const stateBadge = getStateBadge();

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col", 
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
          <img 
            src={displayLogo} 
            alt="CEB Building Logo" 
            className="h-10 w-10 rounded-lg object-cover border-0" 
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-sidebar-foreground truncate">CEB Building</h1>
              {stateBadge && (
                <Badge variant={stateBadge.variant} className="text-[10px] px-1.5 py-0">
                  {stateBadge.label}
                </Badge>
              )}
            </div>
            <p className="text-xs text-sidebar-foreground/60 truncate">
              {user?.email || 'chad@cebbuilding.com'}
            </p>
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
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-primary" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
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

          {/* Add-on Features - Lock icon shown based on AppState */}
          {addOnsNavigation.map(item => {
            const isActive = location.pathname === item.href;
            const isUnlocked = hasAccess(item.featureKey);
            
            return (
              <NavLink 
                key={item.name} 
                to={item.href} 
                onClick={() => setSidebarOpen(false)} 
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200", 
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-primary" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
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
          
          {/* Partners Label */}
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

          {/* Recommendations (smaller) */}
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
          
          {/* Earn Money Label */}
          <p className="px-4 py-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
            Earn Money
          </p>

          {/* Affiliate Link */}
          <NavLink 
            to="/affiliates"
            onClick={() => setSidebarOpen(false)} 
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200", 
              location.pathname === '/affiliates' 
                ? "bg-sidebar-accent text-sidebar-primary" 
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
          >
            <UserPlus className="h-5 w-5" />
            Become a Salesperson
          </NavLink>

          {/* Admin Link - only visible in ADMIN_PREVIEW state */}
          {state === AppState.ADMIN_PREVIEW && (
            <NavLink 
              to="/affiliate-admin"
              onClick={() => setSidebarOpen(false)} 
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200", 
                location.pathname === '/affiliate-admin' 
                  ? "bg-sidebar-accent text-sidebar-primary" 
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <Settings className="h-5 w-5" />
              Manage Affiliates
            </NavLink>
          )}
        </nav>

        {/* Footer with Admin Tools + Sign Out */}
        <div className="px-4 py-4 border-t border-sidebar-border space-y-2">
          {/* Admin Maintenance Section - ONLY in ADMIN_PREVIEW state */}
          {state === AppState.ADMIN_PREVIEW && capabilities.canResetSetup && (
            <div className="px-3 py-2 rounded-lg bg-sidebar-accent/50 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3 w-3 text-sidebar-foreground/50" />
                <span className="text-xs font-semibold text-sidebar-foreground/50 uppercase">
                  Admin Preview
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetSetup}
                className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground h-8"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Setup
              </Button>
            </div>
          )}
          
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground" 
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 bg-background/80 backdrop-blur-md border-b border-border px-4 lg:px-8">
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden" 
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex-1" />
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
