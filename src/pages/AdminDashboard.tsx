// src/pages/AdminDashboard.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminUserManagementPanel } from "@/components/admin/AdminUserManagementPanel";
import { AdminServices } from "@/components/admin/AdminServices";
import { AdminMenuProfessionConfig } from "@/components/admin/AdminMenuProfessionConfig";

export const AdminDashboard = () => {
  return (
    <div className="space-y-6 p-6">
      {/* Admin User Management */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminUserManagementPanel />
        </CardContent>
      </Card>

      {/* Services */}
      <Card>
        <CardHeader>
          <CardTitle>Services</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminServices />
        </CardContent>
      </Card>

      {/* Menu Profession Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Menu Profession Config</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminMenuProfessionConfig />
        </CardContent>
      </Card>
    </div>
  );
};
