// src/pages/AdminDashboard.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminUserManagementPanel } from "@/components/admin/AdminUserManagementPanel";
import { AdminServices } from "@/components/admin/AdminServices";
import { AdminMenuProfessionConfig } from "@/components/admin/AdminMenuProfessionConfig";

export const AdminDashboard: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Welcome to the admin dashboard. Manage users, services, and configurations below.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminUserManagementPanel />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Services</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminServices />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profession Menu Config</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminMenuProfessionConfig />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
