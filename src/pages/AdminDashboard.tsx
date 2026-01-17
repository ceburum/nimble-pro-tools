// src/components/admin/AdminMenuProfessionConfig.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Remove any self-import of AdminMenuProfessionConfig
// import { AdminMenuProfessionConfig } from "@/components/admin/AdminMenuProfessionConfig"; <-- DO NOT DO THIS

export const AdminMenuProfessionConfig = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profession Menu Config</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Placeholder content for Admin Menu Profession Config</p>
        </CardContent>
      </Card>
    </div>
  );
};
