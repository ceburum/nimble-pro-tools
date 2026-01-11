import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    console.log("[SCAN-RECEIPT] Processing receipt image...");

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
      console.error("[SCAN-RECEIPT] AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    console.log("[SCAN-RECEIPT] AI response:", content);

    // Parse the JSON from the response
    let parsed;
    try {
      // Try to extract JSON from the response (it might have markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("[SCAN-RECEIPT] Failed to parse AI response:", parseError);
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
      ? parsed.line_items.map((item: any) => ({
          description: item.description || "Unknown item",
          quantity: parseFloat(item.quantity) || 1,
          unit_price: parseFloat(item.unit_price) || 0,
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
    console.error("[SCAN-RECEIPT] Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});