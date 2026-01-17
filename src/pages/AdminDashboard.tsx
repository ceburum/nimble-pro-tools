// src/pages/AdminDashboard.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminUserManagementPanel } from "@/components/admin/AdminUserManagementPanel";
import { AdminServices } from "@/components/admin/AdminServices";
import { AdminMenuProfessionConfig } from "@/components/admin/AdminMenuProfessionConfig";

export const AdminDashboard = () => {
  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminUserManagementPanel />
          <AdminServices />
          <AdminMenuProfessionConfig />
        </CardContent>
      </Card>
    </div>
  );
};src/App.tsx(33,8): error TS2613: Module '"/dev-server/src/pages/AdminDashboard"' has no default export. Did you mean to use 'import { AdminDashboard } from "/dev-server/src/pages/AdminDashboard"' instead?
src/components/admin/AdminMenuProfessionConfig.tsx(4,31): error TS2307: Cannot find module '@/components/admin/AdminServices' or its corresponding type declarations.
src/components/admin/AdminMenuProfessionConfig.tsx(5,10): error TS2303: Circular definition of import alias 'AdminMenuProfessionConfig'.
src/components/admin/AdminMenuProfessionConfig.tsx(5,10): error TS2459: Module '"@/components/admin/AdminMenuProfessionConfig"' declares 'AdminMenuProfessionConfig' locally, but it is not exported.
src/pages/AdminDashboard.tsx(4,31): error TS2307: Cannot find module '@/components/admin/AdminServices' or its corresponding type declarations.
src/pages/AdminDashboard.tsx(5,10): error TS2459: Module '"@/components/admin/AdminMenuProfessionConfig"' declares 'AdminMenuProfessionConfig' locally, but it is not exported.