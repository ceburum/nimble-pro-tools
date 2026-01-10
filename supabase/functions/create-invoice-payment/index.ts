import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Zod schema for input validation
const PaymentRequestSchema = z.object({
  invoiceNumber: z.string().min(1).max(50),
  clientName: z.string().min(1).max(200),
  clientEmail: z.string().email().max(255).optional(),
  amount: z.number().positive().max(1000000), // max $1M
  includeConvenienceFee: z.boolean(),
});

interface PaymentRequest {
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  amount: number; // in dollars
  includeConvenienceFee: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate input with Zod schema
    const rawData = await req.json();
    const validationResult = PaymentRequestSchema.safeParse(rawData);
    
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error.issues);
      return new Response(
        JSON.stringify({ error: "Invalid request data", details: validationResult.error.issues }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400 }
      );
    }
    
    const { invoiceNumber, clientName, clientEmail, amount, includeConvenienceFee } = validationResult.data;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Calculate amounts
    const baseAmountCents = Math.round(amount * 100);
    const convenienceFeePercent = 0.03; // 3%
    const convenienceFeeCents = includeConvenienceFee 
      ? Math.round(baseAmountCents * convenienceFeePercent) 
      : 0;
    const totalAmountCents = baseAmountCents + convenienceFeeCents;

    // Check if customer exists
    let customerId: string | undefined;
    if (clientEmail) {
      const customers = await stripe.customers.list({ email: clientEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }
    }

    // Build line items with price_data for dynamic pricing
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Invoice ${invoiceNumber}`,
            description: `Payment for ${clientName}`,
          },
          unit_amount: baseAmountCents,
        },
        quantity: 1,
      },
    ];

    // Add convenience fee as separate line item if applicable
    if (includeConvenienceFee && convenienceFeeCents > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Card Processing Fee",
            description: "3% convenience fee for credit card payment",
          },
          unit_amount: convenienceFeeCents,
        },
        quantity: 1,
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : clientEmail,
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get("origin")}/invoices?payment=success&invoice=${invoiceNumber}`,
      cancel_url: `${req.headers.get("origin")}/invoices?payment=canceled`,
      metadata: {
        invoiceNumber,
        clientName,
        includeConvenienceFee: String(includeConvenienceFee),
      },
    });

    console.log(`Created checkout session for invoice ${invoiceNumber}: ${session.id}`);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Payment error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
