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

  // Load service menu packs
  const fetchPacks =
