import { useAppState } from '@/hooks/useAppState';
import { Navigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminUserManagementPanel } from '@/components/admin/AdminUserManagementPanel';
import { AdminRolesPermissions } from '@/components/admin/AdminRolesPermissions';
import { AdminSubscriptionOverrides } from '@/components/admin/AdminSubscriptionOverrides';
import { AdminFeatureFlags } from '@/components/admin/AdminFeatureFlags';
import { AdminGlobalSettings } from '@/components/admin/AdminGlobalSettings';
import { Shield, Users, CreditCard, Flag, Settings } from 'lucide-react';

export default function AdminDashboard() {
  const { isAdmin, loading } = useAppState();

  // Redirect non-admins
  if (!loading && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* B2S Test Banner - Remove after testing */}
      <div className="bg-amber-500 text-amber-950 px-4 py-2 rounded-lg text-center font-bold text-sm">
        🧪 B2S Admin Test Build - {new Date().toISOString().split('T')[0]}
      </div>
      
      <PageHeader 
        title="Admin Dashboard" 
        description="Administrative tools for managing users, permissions, and app settings"
      />

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Roles</span>
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

        <TabsContent value="users">
          <AdminUserManagementPanel />
        </TabsContent>

        <TabsContent value="roles">
          <AdminRolesPermissions />
        </TabsContent>

        <TabsContent value="subscriptions">
          <AdminSubscriptionOverrides />
        </TabsContent>

        <TabsContent value="flags">
          <AdminFeatureFlags />
        </TabsContent>

        <TabsContent value="settings">
          <AdminGlobalSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
