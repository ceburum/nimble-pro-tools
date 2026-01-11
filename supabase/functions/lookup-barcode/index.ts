import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Known store patterns from barcodes (UPC prefixes)
const STORE_PREFIXES: Record<string, string> = {
  '0030000': 'Home Depot',
  '0049000': 'Lowes',
  '0079400': 'Menards',
  '0075457': 'Ace Hardware',
  '0041570': 'True Value',
};

// Category mapping based on common product keywords
function guessCategory(name: string, description: string): string | undefined {
  const text = `${name} ${description}`.toLowerCase();
  
  if (text.match(/\b(lumber|wood|stud|plywood|board|2x4|2x6|4x4)\b/)) return 'Lumber';
  if (text.match(/\b(nail|screw|bolt|nut|washer|anchor|fastener)\b/)) return 'Fasteners';
  if (text.match(/\b(concrete|cement|mortar|brick|block|masonry)\b/)) return 'Concrete & Masonry';
  if (text.match(/\b(shingle|roof|flashing|gutter)\b/)) return 'Roofing';
  if (text.match(/\b(siding|vinyl|fiber|hardie)\b/)) return 'Siding';
  if (text.match(/\b(insulation|foam|fiberglass|r-13|r-19|r-30)\b/)) return 'Insulation';
  if (text.match(/\b(drywall|sheetrock|gypsum|joint|mud|tape)\b/)) return 'Drywall';
  if (text.match(/\b(paint|primer|stain|finish|varnish|lacquer)\b/)) return 'Paint & Finishes';
  if (text.match(/\b(pipe|pvc|cpvc|pex|fitting|valve|faucet|plumb)\b/)) return 'Plumbing';
  if (text.match(/\b(wire|outlet|switch|breaker|conduit|electric|romex)\b/)) return 'Electrical';
  if (text.match(/\b(hinge|handle|lock|knob|latch|hardware)\b/)) return 'Hardware';
  if (text.match(/\b(drill|saw|hammer|tool|wrench|driver)\b/)) return 'Tools';
  if (text.match(/\b(plywood|osb|mdf|panel|sheet)\b/)) return 'Plywood & Panels';
  
  return undefined;
}

function getSupplierFromBarcode(barcode: string): string | undefined {
  for (const [prefix, supplier] of Object.entries(STORE_PREFIXES)) {
    if (barcode.startsWith(prefix)) {
      return supplier;
    }
  }
  return undefined;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { barcode } = await req.json();
    
    if (!barcode) {
      return new Response(
        JSON.stringify({ error: "Barcode is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Looking up barcode: ${barcode}`);

    // Try UPCitemdb API (free tier: 100 requests/day)
    // Note: In production, you might want to use a paid API for better coverage
    let productData = null;
    
    try {
      const response = await fetch(
        `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          const item = data.items[0];
          productData = {
            name: item.title,
            description: item.description || '',
            brand: item.brand || '',
            category: item.category || '',
          };
        }
      }
    } catch (err) {
      console.error('UPCitemdb lookup failed:', err);
    }

    // Try Open Food Facts as fallback (works well for some products)
    if (!productData) {
      try {
        const response = await fetch(
          `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.status === 1 && data.product) {
            const product = data.product;
            productData = {
              name: product.product_name || product.product_name_en,
              description: product.generic_name || '',
              brand: product.brands || '',
              category: product.categories || '',
            };
          }
        }
      } catch (err) {
        console.error('Open Food Facts lookup failed:', err);
      }
    }

    if (productData) {
      // Enhance with our category guessing
      const guessedCategory = guessCategory(productData.name || '', productData.description || '');
      const supplierFromBarcode = getSupplierFromBarcode(barcode);
      
      return new Response(
        JSON.stringify({
          found: true,
          barcode,
          name: productData.name,
          description: productData.description,
          category: guessedCategory || productData.category?.split(',')[0] || undefined,
          brand: productData.brand,
          supplier: supplierFromBarcode || productData.brand,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Product not found - still try to identify supplier from barcode
    const supplierFromBarcode = getSupplierFromBarcode(barcode);
    
    return new Response(
      JSON.stringify({
        found: false,
        barcode,
        supplier: supplierFromBarcode,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error('Lookup error:', err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
