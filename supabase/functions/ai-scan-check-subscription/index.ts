import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STRIPE_SCANNER_PRODUCT_ID = "prod_TmNrly6MYBaOus";

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[AI-SCAN-CHECK] ${step}`, details ? JSON.stringify(details) : '');
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

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get customer ID from settings
    const { data: settings } = await supabaseClient
      .from("user_settings")
      .select("ai_scans_subscription_customer_id")
      .eq("user_id", user.id)
      .single();

    let customerId = settings?.ai_scans_subscription_customer_id;

    if (!customerId) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length === 0) {
        logStep("No customer found, not subscribed");
        return new Response(JSON.stringify({ subscribed: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      customerId = customers.data[0].id;
    }

    logStep("Checking subscriptions", { customerId });

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 10,
    });

    // Check if any subscription is for the scanner product
    let hasActiveSub = false;
    for (const sub of subscriptions.data) {
      for (const item of sub.items.data) {
        const priceProduct = item.price.product;
        if (priceProduct === STRIPE_SCANNER_PRODUCT_ID) {
          hasActiveSub = true;
          break;
        }
      }
      if (hasActiveSub) break;
    }

    logStep("Subscription check complete", { hasActiveSub });

    // Update cache in user_settings
    const { error: updateError } = await supabaseClient
      .from("user_settings")
      .upsert({
        user_id: user.id,
        ai_scans_subscription_status: hasActiveSub ? "active" : "inactive",
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    if (updateError) {
      logStep("Warning: failed to update status cache", { error: updateError.message });
    }

    return new Response(JSON.stringify({ subscribed: hasActiveSub }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
