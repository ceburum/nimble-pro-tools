import { useAppState } from "@/hooks/useAppState";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminUserManagementPanel } from "@/components/admin/AdminUserManagementPanel";
import { AdminRolesPermissions } from "@/components/admin/AdminRolesPermissions";
import { AdminSubscriptionOverrides } from "@/components/admin/AdminSubscriptionOverrides";
import { AdminFeatureFlags } from "@/components/admin/AdminFeatureFlags";
import { AdminGlobalSettings } from "@/components/admin/AdminGlobalSettings";
import { AdminOnboardingFlows } from "@/components/admin/AdminOnboardingFlows";
import { AdminMenuProfessionConfig } from "@/components/admin/AdminMenuProfessionConfig";
import { AdminServices } from "@/components/admin/AdminServices"; // Your services component
import { Shield, Users, CreditCard, Flag, Settings, Loader2, ShieldX, Workflow, Menu } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

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
            <CardDescription>You do not have permission to access the Admin Dashboard.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        description="Administrative tools for managing users, permissions, and app settings"
      />

      <Tabs defaultValue="users" className="space-y-6">
        <ScrollArea className="w-full">
          <TabsList className="inline-flex w-max min-w-full lg:w-auto">
            <TabsTrigger value="users">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="roles">
              <Shield className="h-4 w-4" />
              Roles
            </TabsTrigger>
            <TabsTrigger value="onboarding">
              <Workflow className="h-4 w-4" />
              Onboarding
            </TabsTrigger>
            <TabsTrigger value="services">
              <Menu className="h-4 w-4" />
              Services
            </TabsTrigger>
            <TabsTrigger value="menus">
              <Menu className="h-4 w-4" />
              Service Menu Library
            </TabsTrigger>
            <TabsTrigger value="subscriptions">
              <CreditCard className="h-4 w-4" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="flags">
              <Flag className="h-4 w-4" />
              Flags
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="users">
          <AdminUserManagementPanel />
        </TabsContent>
        <TabsContent value="roles">
          <AdminRolesPermissions />
        </TabsContent>
        <TabsContent value="onboarding">
          <AdminOnboardingFlows />
        </TabsContent>

        <TabsContent value="services">
          <div className="services-tab-content">
            <AdminServices />
          </div>
        </TabsContent>

        <TabsContent value="menus">
          <div className="menus-tab-content">
            <AdminMenuProfessionConfig />
          </div>
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
