import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[AFFILIATE-ONBOARD] ${step}${detailsStr}`);
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
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if signups are enabled and under limit
    const { data: settings, error: settingsError } = await supabaseClient
      .from("affiliate_settings")
      .select("*")
      .single();

    if (settingsError) throw new Error("Could not fetch affiliate settings");
    
    if (!settings.signups_enabled) {
      throw new Error("Affiliate signups are currently disabled");
    }

    if (settings.current_affiliates >= settings.max_affiliates) {
      throw new Error("Affiliate program has reached capacity. Please check back later.");
    }

    // Check if user already has an affiliate account
    const { data: existingAffiliate } = await supabaseClient
      .from("affiliates")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const origin = req.headers.get("origin") || "https://nimble-pro-tools.lovable.app";

    let stripeAccountId: string;

    if (existingAffiliate?.stripe_account_id) {
      // User already has a Stripe account, create new onboarding link
      stripeAccountId = existingAffiliate.stripe_account_id;
      logStep("Existing Stripe account found", { accountId: stripeAccountId });
    } else {
      // Create new Stripe Connect Express account
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email,
        metadata: {
          user_id: user.id,
        },
        capabilities: {
          transfers: { requested: true },
        },
      });
      stripeAccountId = account.id;
      logStep("Created Stripe Connect account", { accountId: stripeAccountId });

      // Generate unique referral code
      const { data: codeData } = await supabaseClient.rpc("generate_referral_code");
      const referralCode = codeData || `REF${Date.now().toString(36).toUpperCase()}`;

      if (!existingAffiliate) {
        // Create affiliate record
        const { error: insertError } = await supabaseClient
          .from("affiliates")
          .insert({
            user_id: user.id,
            stripe_account_id: stripeAccountId,
            stripe_account_type: "express",
            referral_code: referralCode,
            commission_rate: settings.default_commission_rate,
            commission_type: settings.default_commission_type,
            status: "pending",
          });

        if (insertError) throw new Error(`Failed to create affiliate record: ${insertError.message}`);
        logStep("Created affiliate record", { referralCode });
      } else {
        // Update existing affiliate with Stripe account
        const { error: updateError } = await supabaseClient
          .from("affiliates")
          .update({
            stripe_account_id: stripeAccountId,
            stripe_account_type: "express",
          })
          .eq("id", existingAffiliate.id);

        if (updateError) throw new Error(`Failed to update affiliate: ${updateError.message}`);
      }
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${origin}/affiliates?refresh=true`,
      return_url: `${origin}/affiliates?onboarding=complete`,
      type: "account_onboarding",
    });

    logStep("Created account link", { url: accountLink.url });

    return new Response(JSON.stringify({ url: accountLink.url }), {
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
