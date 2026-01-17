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
            <ShieldX className