import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { referralCode, buyerEmail, purchaseAmount, stripePaymentIntentId } = await req.json();

    if (!referralCode || !buyerEmail || !purchaseAmount) {
      throw new Error("Missing required fields: referralCode, buyerEmail, purchaseAmount");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Find the referral reward by code
    const { data: referralReward, error: findError } = await supabaseAdmin
      .from("user_referral_rewards")
      .select("*")
      .eq("referral_code", referralCode)
      .eq("status", "active")
      .single();

    if (findError || !referralReward) {
      throw new Error("Invalid or expired referral code");
    }

    // Check if link has expired
    if (new Date(referralReward.expires_at) < new Date()) {
      await supabaseAdmin
        .from("user_referral_rewards")
        .update({ status: "expired" })
        .eq("id", referralReward.id);
      throw new Error("Referral link has expired");
    }

    // Calculate reward: 50% of new purchase, capped at 50% of original purchase
    const maxReward = referralReward.original_purchase_amount * 0.5;
    const purchaseReward = purchaseAmount * 0.5;
    const rewardAmount = Math.min(purchaseReward, maxReward);

    // Update referral reward to "used"
    const { error: updateError } = await supabaseAdmin
      .from("user_referral_rewards")
      .update({
        status: "used",
        referred_buyer_email: buyerEmail,
        referred_purchase_amount: purchaseAmount,
        referred_at: new Date().toISOString(),
        reward_amount: rewardAmount,
      })
      .eq("id", referralReward.id);

    if (updateError) {
      throw new Error("Failed to update referral status");
    }

    // Process refund if we have the original payment intent
    if (referralReward.original_stripe_payment_intent_id) {
      try {
        // Note: In production, you'd need to find the actual payment intent from the customer ID
        // For now, we'll mark as pending and process manually or via webhook
        await supabaseAdmin
          .from("user_referral_rewards")
          .update({ status: "reward_pending" })
          .eq("id", referralReward.id);

        // In a full implementation, you would:
        // 1. Find the original charge from the payment intent
        // 2. Create a refund: await stripe.refunds.create({ payment_intent: ..., amount: rewardAmount * 100 })
        // 3. Update status to reward_completed

        console.log(`Reward of $${rewardAmount.toFixed(2)} pending for user ${referralReward.user_id}`);
      } catch (stripeError) {
        console.error("Stripe refund error:", stripeError);
        // Continue - admin can process manually
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Referral processed successfully",
        rewardAmount,
        referralRewardId: referralReward.id,
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
