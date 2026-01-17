import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminUserManagement } from "@/components/admin/AdminUserManagement";
import { AdminServices } from "@/components/admin/AdminServices";
import { AdminMenuProfessionConfig } from "@/components/admin/AdminMenuProfessionConfig";
import { toast } from "sonner";

export function AdminDashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // placeholder for any data loading if needed
      } catch (err) {
        console.error(err);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <AdminUserManagement />
          <AdminServices />
          <AdminMenuProfessionConfig />
        </CardContent>
      </Card>
    </div>
  );
}
