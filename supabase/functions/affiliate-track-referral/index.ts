import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[AFFILIATE-TRACK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { referralCode, productType, productName, saleAmount, paymentIntentId, userEmail, userId } = await req.json();

    if (!referralCode) {
      throw new Error("Referral code is required");
    }

    logStep("Processing referral", { referralCode, productType, saleAmount });

    // Find affiliate by referral code
    const { data: affiliate, error: affiliateError } = await supabaseClient
      .from("affiliates")
      .select("*")
      .eq("referral_code", referralCode)
      .eq("status", "active")
      .maybeSingle();

    if (affiliateError) throw new Error(`Failed to fetch affiliate: ${affiliateError.message}`);
    if (!affiliate) {
      logStep("No active affiliate found", { referralCode });
      return new Response(JSON.stringify({ tracked: false, reason: "Invalid or inactive referral code" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Calculate commission
    let commissionAmount = 0;
    if (affiliate.commission_type === "percentage") {
      commissionAmount = saleAmount * affiliate.commission_rate;
    } else {
      commissionAmount = affiliate.commission_rate;
    }

    logStep("Calculated commission", { 
      commissionType: affiliate.commission_type,
      commissionRate: affiliate.commission_rate,
      saleAmount,
      commissionAmount 
    });

    // Create referral record
    const { data: referral, error: referralError } = await supabaseClient
      .from("referrals")
      .insert({
        affiliate_id: affiliate.id,
        referred_user_id: userId,
        referred_email: userEmail,
        stripe_payment_intent_id: paymentIntentId,
        product_type: productType,
        product_name: productName,
        sale_amount: saleAmount,
        commission_amount: commissionAmount,
        status: "pending",
      })
      .select()
      .single();

    if (referralError) throw new Error(`Failed to create referral: ${referralError.message}`);
    logStep("Created referral record", { referralId: referral.id });

    // Update affiliate stats
    const { error: updateError } = await supabaseClient
      .from("affiliates")
      .update({
        total_referrals: affiliate.total_referrals + 1,
        pending_earnings: affiliate.pending_earnings + commissionAmount,
      })
      .eq("id", affiliate.id);

    if (updateError) throw new Error(`Failed to update affiliate stats: ${updateError.message}`);
    logStep("Updated affiliate stats");

    return new Response(JSON.stringify({ 
      tracked: true, 
      referralId: referral.id,
      commissionAmount 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
