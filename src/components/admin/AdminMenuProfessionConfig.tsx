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
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const fetchPacks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from<ServiceMenuPack>("service_menu_packs")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) {
      toast.error("Failed to load service menu packs");
    } else {
      setPacks(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPacks();
  }, []);

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const addSelectedToMenu = async () => {
    if (!selected.length) return;
    setAdding(true);

    const { error } = await supabase.rpc("add_service_menu_packs_to_user", { pack_ids: selected });

    if (error) {
      toast.error("Failed to add service menus");
    } else {
      toast.success("Service menus added");
      setSelected([]);
      fetchPacks(); // refetch so UI updates if needed
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
          <CardDescription>Select and add pre-built service menus to a business</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {packs.map((pack) => (
            <div key={pack.id} className="flex items-start justify-between gap-4 p-4 border rounded-lg">
              <div className="flex gap-3">
                <Checkbox checked={selected.includes(pack.id)} onCheckedChange={() => toggleSelect(pack.id)} />
                <div>
                  <div className="font-medium">{pack.name}</div>
                  <p className="text-sm text-muted-foreground">{pack.description}</p>
                  <Badge variant="secondary" className="mt-1">
                    {pack.profession_tag}
                  </Badge>
                </div>
              </div>
              <div className="font-semibold">${pack.price.toFixed(2)}</div>
            </div>
          ))}

          <Button className="w-full" disabled={adding || !selected.length} onClick={addSelectedToMenu}>
            {adding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShoppingCart className="h-4 w-4 mr-2" />}
            Add Selected Menus
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
