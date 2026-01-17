import { useAppState } from '@/hooks/useAppState';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminUserManagementPanel } from '@/components/admin/AdminUserManagementPanel';
import { AdminRolesPermissions } from '@/components/admin/AdminRolesPermissions';
import { AdminSubscriptionOverrides } from '@/components/admin/AdminSubscriptionOverrides';
import { AdminFeatureFlags } from '@/components/admin/AdminFeatureFlags';
import { AdminGlobalSettings } from '@/components/admin/AdminGlobalSettings';
import { AdminOnboardingFlows } from '@/components/admin/AdminOnboardingFlows';
import { AdminMenuProfessionConfig } from '@/components/admin/AdminMenuProfessionConfig';
import { Shield, Users, CreditCard, Flag, Settings, Loader2, ShieldX, Workflow, Menu } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export default function AdminDashboard() {
  const { isAdmin, loading } = useAppState();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <ShieldX className="h-12 w-12 mx-auto text-destructive mb-2" />
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to access the Admin Dashboard.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-amber-500 text-amber-950 px-4 py-2 rounded-lg text-center font-bold text-sm">
        🧪 B2S Admin Test Build - {new Date().toISOString().split('T')[0]}
      </div>
      
      <PageHeader 
        title="Admin Dashboard" 
        description="Administrative tools for managing users, permissions, and app settings"
      />

      <Tabs defaultValue="users" className="space-y-6">
        <ScrollArea className="w-full">
          <TabsList className="inline-flex w-max min-w-full lg:w-auto">
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="roles" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Roles</span>
            </TabsTrigger>
            <TabsTrigger value="onboarding" className="gap-2">
              <Workflow className="h-4 w-4" />
              <span className="hidden sm:inline">Onboarding</span>
            </TabsTrigger>
            <TabsTrigger value="menus" className="gap-2">
              <Menu className="h-4 w-4" />
              <span className="hidden sm:inline">Menus</span>
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Billing</span>
            </TabsTrigger>
            <TabsTrigger value="flags" className="gap-2">
              <Flag className="h-4 w-4" />
              <span className="hidden sm:inline">Flags</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="users">
          <AdminUserManagementPanel />
        </TabsContent>

        <TabsContent value="roles