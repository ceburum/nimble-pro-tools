import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Zod schema for input validation
const PaymentRequestSchema = z.object({
  paymentToken: z.string().uuid(), // Required: payment token from invoice
  includeConvenienceFee: z.boolean(),
});

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
    
    const { paymentToken, includeConvenienceFee } = validationResult.data;

    // Use service role to look up invoice by payment token
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Securely fetch invoice using the payment token
    const { data: invoiceData, error: invoiceError } = await supabase
      .rpc('get_invoice_by_payment_token', { p_token: paymentToken });

    if (invoiceError || !invoiceData || invoiceData.length === 0) {
      console.error("Invoice lookup failed:", invoiceError);
      return new Response(
        JSON.stringify({ error: "Invalid payment link or invoice not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404 }
      );
    }

    const invoice = invoiceData[0];

    // Verify invoice is not already paid
    if (invoice.status === 'paid') {
      return new Response(
        JSON.stringify({ error: "Invoice has already been paid" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400 }
      );
    }

    // Calculate total from invoice items
    const items = Array.isArray(invoice.items) ? invoice.items : [];
    const amount = items.reduce((sum: number, item: any) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      return sum + (qty * price);
    }, 0);

    if (amount <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid invoice amount" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400 }
      );
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Calculate amounts
    const baseAmountCents = Math.round(amount * 100);
    const convenienceFeePercent = 0.03; // 3%
    const convenienceFeeCents = includeConvenienceFee 
      ? Math.round(baseAmountCents * convenienceFeePercent) 
      : 0;

    // Check if customer exists
    let customerId: string | undefined;
    if (invoice.client_email) {
      const customers = await stripe.customers.list({ email: invoice.client_email, limit: 1 });
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
            name: `Invoice ${invoice.invoice_number}`,
            description: `Payment for ${invoice.client_name}`,
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
      customer_email: customerId ? undefined : invoice.client_email,
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get("origin")}/invoices?payment=success&invoice=${invoice.invoice_number}`,
      cancel_url: `${req.headers.get("origin")}/invoices?payment=canceled`,
      metadata: {
        invoiceNumber: invoice.invoice_number,
        invoiceId: invoice.id,
        clientName: invoice.client_name,
        includeConvenienceFee: String(includeConvenienceFee),
      },
    });

    console.log(`Created checkout session for invoice ${invoice.invoice_number}: ${session.id}`);

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
