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

  // Fetch service menu packs from Supabase
  const fetchPacks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("service_menu_packs")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) {
      toast.error("Failed to load service packs");
    } else {
      setPacks(data || []);
    }
    setLoading(false);
  };

  // Corrected useEffect
  useEffect(() => {
    fetchPacks();
  }, []);

  // Toggle individual selection
  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Add selected packs to user menu via RPC
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
          <CardDescription>
            Purchase and add pre-built service menus to your business
          </CardDescription>
        </Card