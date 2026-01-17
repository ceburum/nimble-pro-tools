// src/components/admin/AdminMenuProfessionConfig.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import toast from "react-hot-toast";

export interface ServiceMenuPack {
  id: string;
  name: string;
  profession_tag: string;
  description: string;
  price: number;
  is_active: boolean;
}

export const AdminMenuProfessionConfig: React.FC = () => {
  const [packs, setPacks] = useState<ServiceMenuPack[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  // Load service menu packs
  const fetchPacks = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from<ServiceMenuPack>("service_menu_packs")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error(error);
      toast.error("Failed to load service menu packs");
    } else {
      setPacks(data ?? []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchPacks();
  }, []);

  // Assign selected packs to a user
  const addPacksToUser = async () => {
    try {
      const { error } = await supabase.rpc("add_service_menu_packs_to_user", { pack_ids: selected } as any); // temporary typing fix

      if (error) {
        console.error(error);
        toast.error("Failed to add packs to user");
      } else {
        toast.success("Service menu packs added to user successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error("Unexpected error occurred");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Service Menu Packs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <ul className="space-y-2">
              {packs.map((pack) => (
                <li key={pack.id}>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      value={pack.id}
                      checked={selected.includes(pack.id)}
                      onChange={(e) => {
                        const id = e.target.value;
                        setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
                      }}
                    />
                    <span>{pack.name}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          <button
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
            onClick={addPacksToUser}
            disabled={selected.length === 0 || loading}
          >
            Assign Packs to User
          </button>
        </CardContent>
      </Card>
    </div>
  );
};
