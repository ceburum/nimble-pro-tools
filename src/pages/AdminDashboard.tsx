import { AdminUserManagement } from "@/components/admin/AdminUserManagement";
import { AdminServices } from "@/components/admin/AdminServices";
import { AdminMenuProfessionConfig } from "@/components/admin/AdminMenuProfessionConfig";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AdminDashboard() {
  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminUserManagement />
          <AdminServices />
          <AdminMenuProfessionConfig />
        </CardContent>
      </Card>
    </div>
  );
}
