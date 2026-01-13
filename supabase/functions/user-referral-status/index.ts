import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Get user's referral reward status
    const { data: rewards, error } = await supabaseAdmin
      .from("user_referral_rewards")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      throw error;
    }

    // Check if user has made a purchase
    const { data: settings } = await supabaseAdmin
      .from("user_settings")
      .select("ai_scans_subscription_customer_id")
      .eq("user_id", user.id)
      .single();

    const hasPurchased = !!(settings?.ai_scans_subscription_customer_id);

    if (!rewards || rewards.length === 0) {
      return new Response(
        JSON.stringify({ 
          hasReferral: false,
          hasPurchased,
          referral: null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const referral = rewards[0];
    
    // Check if expired
    if (referral.status === "active" && new Date(referral.expires_at) < new Date()) {
      // Update to expired
      await supabaseAdmin
        .from("user_referral_rewards")
        .update({ status: "expired" })
        .eq("id", referral.id);
      
      referral.status = "expired";
    }

    return new Response(
      JSON.stringify({ 
        hasReferral: true,
        hasPurchased,
        referral,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "An error occurred";
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
