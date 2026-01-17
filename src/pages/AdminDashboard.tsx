import { useAppState } from '@/hooks/useAppState';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldX, Users, Menu, ShoppingCart } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

import { ServicesTab } from '@/components/admin/ServicesTab';
import { AdminMenuProfessionConfig } from '@/components/admin/AdminMenuProfessionConfig';

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
      <PageHeader
        title="Admin Dashboard"
        description="Manage users, services, and pre-built service menus"
      />

      <Tabs defaultValue="services" className="space