// src/pages/AdminDashboard.tsx
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AdminUserManagementPanel } from "@/components/admin/AdminUserManagementPanel";
import { AdminServices } from "@/components/admin/AdminServices";
import { AdminMenuProfessionConfig } from "@/components/admin/AdminMenuProfessionConfig";

export function AdminDashboard() {
  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AdminUserManagementPanel />
          <AdminServices />
          <AdminMenuProfessionConfig />
        </CardContent>
      </Card>
    </div>
  );
}
