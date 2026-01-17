// src/pages/AdminDashboard.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminUserManagementPanel } from "@/components/admin/AdminUserManagementPanel";
import { AdminServices } from "@/components/admin/AdminServices";
import { AdminMenuProfessionConfig } from "@/components/admin/AdminMenuProfessionConfig";
import toast, { Toaster } from "react-hot-toast";

const AdminDashboard: React.FC = () => {
  const handleNotify = () => {
    toast.success("Welcome to the Admin Dashboard!");
  };

  return (
    <div className="p-6 space-y-6">
      <Toaster position="top-right" />
      <Card>
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={handleNotify}>
            Show Toast
          </button>
        </CardContent>
      </Card>

      <AdminServices />
      <AdminUserManagementPanel />
      <AdminMenuProfessionConfig />
    </div>
  );
};

export default AdminDashboard;
