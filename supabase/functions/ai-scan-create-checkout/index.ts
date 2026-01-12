import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STRIPE_SCANNER_PRICE_ID = "price_1Sop61IWHDbSFtBTOgrqkTnW";

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[AI-SCAN-CHECKOUT] ${step}`, details ? JSON.stringify(details) : '');
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

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string;

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      const customer = await stripe.customers.create({ email: user.email });
      customerId = customer.id;
      logStep("Created new customer", { customerId });
    }

    // Save customer ID to user_settings
    const { error: updateError } = await supabaseClient
      .from("user_settings")
      .upsert({
        user_id: user.id,
        ai_scans_subscription_customer_id: customerId,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    if (updateError) {
      logStep("Warning: failed to save customer ID", { error: updateError.message });
    }

    // Create checkout session
    const origin = req.headers.get("origin") || "https://lovable.dev";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: STRIPE_SCANNER_PRICE_ID, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}?scanner_upgrade=success`,
      cancel_url: `${origin}?scanner_upgrade=cancelled`,
    });

    logStep("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
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
