import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Simple encryption key from environment - in production, use Supabase Vault
const ENCRYPTION_KEY = Deno.env.get("TIN_ENCRYPTION_KEY") || "ceb-tin-encryption-key-32bytes!!";

// Simple AES-like encryption using Web Crypto API
async function getEncryptionKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(ENCRYPTION_KEY.slice(0, 32).padEnd(32, "0")),
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
  return keyMaterial;
}

async function encryptTin(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext)
  );
  
  // Combine IV and encrypted data, then base64 encode
  const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

async function decryptTin(ciphertext: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    const decoder = new TextDecoder();
    
    // Decode base64
    const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encrypted
    );
    
    return decoder.decode(decrypted);
  } catch {
    // If decryption fails (e.g., for old plaintext data), return masked value
    return "***-**-****";
  }
}

function maskTin(tin: string, tinType: string | null): string {
  // Only show last 4 digits
  const digits = tin.replace(/\D/g, "");
  if (digits.length < 4) return "****";
  return `***-**-${digits.slice(-4)}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user token
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await supabase.auth.getUser(token);
    
    if (claimsError || !claims?.user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claims.user.id;

    const { action, clientId, tin, tinType } = await req.json();

    // Create service role client for secure operations
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (action === "encrypt") {
      if (!clientId || !tin) {
        return new Response(
          JSON.stringify({ error: "Missing clientId or tin" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify user owns this client
      const { data: client, error: clientError } = await adminClient
        .from("clients")
        .select("id, user_id")
        .eq("id", clientId)
        .single();

      if (clientError || !client || client.user_id !== userId) {
        return new Response(
          JSON.stringify({ error: "Client not found or unauthorized" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Encrypt and store TIN
      const encryptedTin = await encryptTin(tin);
      
      const { error: updateError } = await adminClient
        .from("clients")
        .update({ 
          tin_encrypted: encryptedTin,
          tin_type: tinType || null
        })
        .eq("id", clientId);

      if (updateError) {
        console.error("Error updating TIN:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to save TIN" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, masked: maskTin(tin, tinType) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (action === "decrypt") {
      if (!clientId) {
        return new Response(
          JSON.stringify({ error: "Missing clientId" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify user owns this client
      const { data: client, error: clientError } = await adminClient
        .from("clients")
        .select("id, user_id, tin_encrypted, tin_type")
        .eq("id", clientId)
        .single();

      if (clientError || !client || client.user_id !== userId) {
        return new Response(
          JSON.stringify({ error: "Client not found or unauthorized" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!client.tin_encrypted) {
        return new Response(
          JSON.stringify({ tin: null, tinType: null }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Decrypt TIN
      const decryptedTin = await decryptTin(client.tin_encrypted);

      return new Response(
        JSON.stringify({ tin: decryptedTin, tinType: client.tin_type }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (action === "check") {
      // Just check if TIN exists (masked)
      if (!clientId) {
        return new Response(
          JSON.stringify({ error: "Missing clientId" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: client, error: clientError } = await adminClient
        .from("clients")
        .select("id, user_id, tin_encrypted, tin_type")
        .eq("id", clientId)
        .single();

      if (clientError || !client || client.user_id !== userId) {
        return new Response(
          JSON.stringify({ error: "Client not found or unauthorized" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!client.tin_encrypted) {
        return new Response(
          JSON.stringify({ hasTin: false, masked: null }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Decrypt to get last 4 digits for masking
      const decryptedTin = await decryptTin(client.tin_encrypted);
      
      return new Response(
        JSON.stringify({ 
          hasTin: true, 
          masked: maskTin(decryptedTin, client.tin_type),
          tinType: client.tin_type
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in manage-tin:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
