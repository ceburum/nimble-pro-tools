import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[AFFILIATE-ADMIN] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Check if user is admin
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      throw new Error("Unauthorized: Admin access required");
    }
    logStep("Admin verified");

    const { action, ...params } = await req.json();

    switch (action) {
      case "get_all_affiliates": {
        const { data: affiliates, error } = await supabaseClient
          .from("affiliates")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw new Error(`Failed to fetch affiliates: ${error.message}`);

        return new Response(JSON.stringify({ affiliates }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case "get_settings": {
        const { data: settings, error } = await supabaseClient
          .from("affiliate_settings")
          .select("*")
          .single();

        if (error) throw new Error(`Failed to fetch settings: ${error.message}`);

        return new Response(JSON.stringify({ settings }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case "update_settings": {
        const { settings } = params;
        const { error } = await supabaseClient
          .from("affiliate_settings")
          .update({
            ...settings,
            updated_by: user.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", settings.id);

        if (error) throw new Error(`Failed to update settings: ${error.message}`);
        logStep("Settings updated", settings);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case "increase_limit": {
        const { amount = 25 } = params;
        const { data: settings, error: fetchError } = await supabaseClient
          .from("affiliate_settings")
          .select("*")
          .single();

        if (fetchError) throw new Error(`Failed to fetch settings: ${fetchError.message}`);

        const { error } = await supabaseClient
          .from("affiliate_settings")
          .update({
            max_affiliates: settings.max_affiliates + amount,
            signups_enabled: true,
            updated_by: user.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", settings.id);

        if (error) throw new Error(`Failed to increase limit: ${error.message}`);
        logStep("Limit increased", { newLimit: settings.max_affiliates + amount });

        return new Response(JSON.stringify({ 
          success: true,
          newLimit: settings.max_affiliates + amount 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case "update_affiliate": {
        const { affiliateId, updates } = params;
        const { error } = await supabaseClient
          .from("affiliates")
          .update(updates)
          .eq("id", affiliateId);

        if (error) throw new Error(`Failed to update affiliate: ${error.message}`);
        logStep("Affiliate updated", { affiliateId, updates });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case "process_payout": {
        const { affiliateId, amount } = params;
        
        const { data: affiliate, error: affiliateError } = await supabaseClient
          .from("affiliates")
          .select("*")
          .eq("id", affiliateId)
          .single();

        if (affiliateError) throw new Error(`Failed to fetch affiliate: ${affiliateError.message}`);
        if (!affiliate.stripe_account_id) throw new Error("Affiliate has no Stripe account");

        const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

        // Create transfer to connected account
        const transfer = await stripe.transfers.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: "usd",
          destination: affiliate.stripe_account_id,
        });

        logStep("Transfer created", { transferId: transfer.id });

        // Record payout
        const { error: payoutError } = await supabaseClient
          .from("affiliate_payouts")
          .insert({
            affiliate_id: affiliateId,
            amount: amount,
            stripe_transfer_id: transfer.id,
            status: "completed",
            processed_at: new Date().toISOString(),
          });

        if (payoutError) throw new Error(`Failed to record payout: ${payoutError.message}`);

        // Update affiliate earnings
        const { error: updateError } = await supabaseClient
          .from("affiliates")
          .update({
            pending_earnings: Math.max(0, affiliate.pending_earnings - amount),
            total_earnings: affiliate.total_earnings + amount,
          })
          .eq("id", affiliateId);

        if (updateError) throw new Error(`Failed to update affiliate: ${updateError.message}`);

        // Mark referrals as paid
        await supabaseClient
          .from("referrals")
          .update({ status: "paid", paid_at: new Date().toISOString() })
          .eq("affiliate_id", affiliateId)
          .eq("status", "pending");

        return new Response(JSON.stringify({ 
          success: true,
          transferId: transfer.id 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
