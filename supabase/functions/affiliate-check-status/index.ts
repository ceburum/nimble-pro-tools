import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[AFFILIATE-STATUS] ${step}${detailsStr}`);
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

    // Get affiliate record
    const { data: affiliate, error: affiliateError } = await supabaseClient
      .from("affiliates")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (affiliateError) throw new Error(`Failed to fetch affiliate: ${affiliateError.message}`);

    if (!affiliate) {
      return new Response(JSON.stringify({ 
        isAffiliate: false,
        affiliate: null,
        settings: null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check Stripe account status if account exists
    let stripeAccountStatus = null;
    if (affiliate.stripe_account_id) {
      const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
      try {
        const account = await stripe.accounts.retrieve(affiliate.stripe_account_id);
        stripeAccountStatus = {
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
        };

        // Update onboarding status if completed
        if (account.details_submitted && !affiliate.stripe_onboarding_complete) {
          await supabaseClient
            .from("affiliates")
            .update({ 
              stripe_onboarding_complete: true,
              status: "active"
            })
            .eq("id", affiliate.id);
          
          affiliate.stripe_onboarding_complete = true;
          affiliate.status = "active";
        }
        logStep("Stripe account status", stripeAccountStatus);
      } catch (stripeError) {
        logStep("Stripe account error", { error: String(stripeError) });
      }
    }

    // Get affiliate settings
    const { data: settings } = await supabaseClient
      .from("affiliate_settings")
      .select("*")
      .single();

    // Get referral stats
    const { data: referrals } = await supabaseClient
      .from("referrals")
      .select("*")
      .eq("affiliate_id", affiliate.id);

    // Get payout history
    const { data: payouts } = await supabaseClient
      .from("affiliate_payouts")
      .select("*")
      .eq("affiliate_id", affiliate.id)
      .order("created_at", { ascending: false })
      .limit(10);

    return new Response(JSON.stringify({
      isAffiliate: true,
      affiliate: {
        ...affiliate,
        stripeAccountStatus,
      },
      referrals: referrals || [],
      payouts: payouts || [],
      settings: {
        signupsEnabled: settings?.signups_enabled,
        maxAffiliates: settings?.max_affiliates,
        currentAffiliates: settings?.current_affiliates,
        minPayoutThreshold: settings?.min_payout_threshold,
      },
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
