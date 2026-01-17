import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ServiceMenuPack {
  id: string;
  name: string;
  profession_tag: string;
  description: string;
  price: number;
  is_active: boolean;
}

export function AdminMenuProfessionConfig() {
  const [packs, setPacks] = useState<ServiceMenuPack[]>([]);
  const [installedPackIds, setInstalledPackIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchPacks();
    fetchInstalledPacks();
  }, []);

  const fetchPacks = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("service_menu_packs").select("*").eq("is_active", true).order("name");

    if (error) {
      toast.error("Failed to load service packs");
    } else {
      setPacks(data || []);
    }
    setLoading(false);
  };

  const fetchInstalledPacks = async () => {
    const user = supabase.auth.getUser(); // Adjust if you have currentUser elsewhere
    const { data, error } = await supabase
      .from("user_service_menu_packs")
      .select("pack_id")
      .eq("user_id", (await user).data.user?.id);

    if (!error && data) {
      setInstalledPackIds(data.map((row: any) => row.pack_id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const addSelectedToMenu = async () => {
    if (selected.length === 0) return;

    setAdding(true);

    const { error } = await supabase.rpc("add_service_menu_packs_to_user", {
      pack_ids: selected,
    });

    if (error) {
      toast.error("Failed to add service menus");
    } else {
      toast.success("Service menus added to your account");
      // Mark newly added packs as installed
      setInstalledPackIds((prev) => [...prev, ...selected]);
      setSelected([]);
    }

    setAdding(false);
  };

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
          <CardTitle>Service Menu Library</CardTitle>
          <CardDescription>Purchase and add pre-built service menus to your business</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {packs.map((pack) => {
            const isInstalled = installedPackIds.includes(pack.id);
            return (
              <div
                key={pack.id}
                className={`flex items-start justify-between gap-4 p-4 border rounded-lg ${
                  isInstalled ? "bg-green-50 border-green-300" : ""
                }`}
              >
                <div className="flex gap-3">
                  <Checkbox
                    checked={selected.includes(pack.id)}
                    disabled={isInstalled}
                    onCheckedChange={() => toggleSelect(pack.id)}
                  />
                  <div>
                    <div className="font-medium">{pack.name}</div>
                    <p className="text-sm text-muted-foreground">{pack.description}</p>
                    <Badge variant="secondary" className="mt-1">
                      {pack.profession_tag}
                    </Badge>
                    {isInstalled && (
                      <Badge variant="success" className="ml-2">
                        Installed
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="font-semibold">${pack.price}</div>
              </div>
            );
          })}

          <Button disabled={selected.length === 0 || adding} onClick={addSelectedToMenu} className="w-full">
            {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShoppingCart className="h-4 w-4 mr-2" />}
            Add Selected Menus
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
