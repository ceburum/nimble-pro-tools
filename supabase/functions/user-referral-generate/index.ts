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

    // Check if user already has an active referral link
    const { data: existingReward } = await supabaseAdmin
      .from("user_referral_rewards")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["active", "reward_pending"])
      .single();

    if (existingReward) {
      // Return existing link
      const link = `${req.headers.get("origin") || "https://nimble-pro-tools.lovable.app"}?ref=${existingReward.referral_code}`;
      return new Response(
        JSON.stringify({ 
          referralCode: existingReward.referral_code, 
          link,
          message: "Existing referral link returned"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user has made a purchase (check user_settings for subscription)
    const { data: settings } = await supabaseAdmin
      .from("user_settings")
      .select("ai_scans_subscription_customer_id, ai_scans_subscription_status")
      .eq("user_id", user.id)
      .single();

    // For now, we'll allow generation even without purchase for testing
    // In production, you might want to verify actual Stripe purchases
    const originalPurchaseAmount = 100; // Default, should be fetched from Stripe in production

    // Generate unique referral code
    const { data: codeData, error: codeError } = await supabaseAdmin.rpc("generate_user_referral_code");
    if (codeError) {
      throw new Error("Failed to generate referral code");
    }

    // Create referral reward record
    const { data: reward, error: insertError } = await supabaseAdmin
      .from("user_referral_rewards")
      .insert({
        user_id: user.id,
        referral_code: codeData,
        original_purchase_amount: originalPurchaseAmount,
        original_stripe_payment_intent_id: settings?.ai_scans_subscription_customer_id || null,
        status: "active",
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Failed to create referral link");
    }

    const link = `${req.headers.get("origin") || "https://nimble-pro-tools.lovable.app"}?ref=${codeData}`;

    return new Response(
      JSON.stringify({ 
        referralCode: codeData, 
        link,
        message: "Referral link created successfully"
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
