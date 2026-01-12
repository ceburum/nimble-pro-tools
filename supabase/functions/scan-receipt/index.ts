import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FREE_SCANS_PER_MONTH = 3;
const STRIPE_SCANNER_PRODUCT_ID = "prod_TmNrly6MYBaOus";

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[SCAN-RECEIPT] ${step}`, details ? JSON.stringify(details) : '');
};

async function checkScanQuota(supabaseClient: any, userId: string, userEmail: string, stripeKey: string) {
  const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM

  // Get user settings
  const { data: settings } = await supabaseClient
    .from("user_settings")
    .select("ai_scans_used, ai_scans_period, ai_scans_subscription_status, ai_scans_subscription_customer_id")
    .eq("user_id", userId)
    .single();

  const s = settings as any;
  let scansUsed = s?.ai_scans_used ?? 0;
  let savedPeriod = s?.ai_scans_period ?? "";
  let subscriptionStatus = s?.ai_scans_subscription_status ?? "inactive";
  const customerId = s?.ai_scans_subscription_customer_id;

  // Reset counter if new month
  if (savedPeriod !== currentPeriod) {
    scansUsed = 0;
    savedPeriod = currentPeriod;
  }

  // Check subscription status from Stripe (if we have a customer)
  if (customerId && stripeKey) {
    try {
      const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 10,
      });

      let hasActive = false;
      for (const sub of subscriptions.data) {
        for (const item of sub.items.data) {
          if (item.price.product === STRIPE_SCANNER_PRODUCT_ID) {
            hasActive = true;
            break;
          }
        }
        if (hasActive) break;
      }

      subscriptionStatus = hasActive ? "active" : "inactive";
    } catch (err) {
      logStep("Stripe check failed, using cached status", { error: String(err) });
    }
  }

  // If subscribed, allow unlimited
  if (subscriptionStatus === "active") {
    return { allowed: true, scansUsed, subscribed: true };
  }

  // Check free tier limit
  if (scansUsed >= FREE_SCANS_PER_MONTH) {
    return { allowed: false, scansUsed, subscribed: false };
  }

  // Increment counter
  const newCount = scansUsed + 1;
  await supabaseClient
    .from("user_settings")
    .upsert({
      user_id: userId,
      ai_scans_used: newCount,
      ai_scans_period: currentPeriod,
      ai_scans_subscription_status: subscriptionStatus,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

  return { allowed: true, scansUsed: newCount, subscribed: false };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      throw new Error("No image provided");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || "";

    // Check quota
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );

      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseClient.auth.getUser(token);
      
      if (userData?.user) {
        const quota = await checkScanQuota(supabaseClient, userData.user.id, userData.user.email || "", stripeKey);
        
        if (!quota.allowed) {
          logStep("Scan limit exceeded", { userId: userData.user.id, scansUsed: quota.scansUsed });
          return new Response(JSON.stringify({ 
            code: "SCAN_LIMIT_EXCEEDED",
            scansUsed: quota.scansUsed,
            error: "You've used all your free scans this month. Upgrade for unlimited scans."
          }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        logStep("Quota check passed", { scansUsed: quota.scansUsed, subscribed: quota.subscribed });
      }
    }

    logStep("Processing receipt image...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this receipt image and extract the following information. Return ONLY a JSON object with these fields, no other text:
- store_name: The name of the store/business
- total_amount: The total amount (just the number, no currency symbol)
- date: The date on the receipt if visible (in YYYY-MM-DD format, or null if not found)
- line_items: An array of items purchased. For each item include:
  - description: The item name/description
  - quantity: The quantity (default to 1 if not shown)
  - unit_price: The price per unit (just the number)

Example response:
{
  "store_name": "Home Depot",
  "total_amount": 156.78,
  "date": "2024-01-15",
  "line_items": [
    { "description": "2x4x8 Lumber", "quantity": 10, "unit_price": 5.99 },
    { "description": "Deck Screws 1lb", "quantity": 2, "unit_price": 8.49 }
  ]
}

If you cannot determine a value, use null for that field. For line_items, return an empty array [] if items cannot be read clearly.`
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      logStep("AI gateway error", { status: response.status, error: errorText });
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    logStep("AI response received");

    // Parse the JSON from the response
    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      logStep("Failed to parse AI response", { error: String(parseError) });
      return new Response(JSON.stringify({ 
        error: "Could not extract receipt information. Please enter manually.",
        raw: content 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize line items
    const lineItems = Array.isArray(parsed.line_items) 
      ? parsed.line_items.map((item: Record<string, unknown>) => ({
          description: item.description || "Unknown item",
          quantity: parseFloat(String(item.quantity)) || 1,
          unit_price: parseFloat(String(item.unit_price)) || 0,
        }))
      : [];

    return new Response(JSON.stringify({
      store_name: parsed.store_name || null,
      total_amount: parsed.total_amount ? parseFloat(parsed.total_amount) : null,
      date: parsed.date || null,
      line_items: lineItems,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    logStep("Error", { error: error instanceof Error ? error.message : "Unknown error" });
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
