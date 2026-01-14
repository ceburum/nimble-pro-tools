import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Simple encryption using base64 + XOR with key
// In production, use proper encryption via Supabase Vault
function encryptCredential(value: string, key: string): string {
  const keyBytes = new TextEncoder().encode(key);
  const valueBytes = new TextEncoder().encode(value);
  const encrypted = new Uint8Array(valueBytes.length);
  
  for (let i = 0; i < valueBytes.length; i++) {
    encrypted[i] = valueBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  
  return btoa(String.fromCharCode(...encrypted));
}

function decryptCredential(encrypted: string, key: string): string {
  try {
    const keyBytes = new TextEncoder().encode(key);
    const encryptedBytes = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
    const decrypted = new Uint8Array(encryptedBytes.length);
    
    for (let i = 0; i < encryptedBytes.length; i++) {
      decrypted[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    return new TextDecoder().decode(decrypted);
  } catch {
    return '';
  }
}

async function verifyAuth(req: Request): Promise<{ userId: string } | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;

    return { userId: data.user.id };
  } catch {
    return null;
  }
}

// Test email provider connection
async function testProviderConnection(
  providerType: string,
  credentials: {
    apiKey?: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpUsername?: string;
    smtpPassword?: string;
    smtpUseTls?: boolean;
    fromEmail?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    switch (providerType) {
      case 'postmark': {
        const response = await fetch('https://api.postmarkapp.com/server', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'X-Postmark-Server-Token': credentials.apiKey || '',
          },
        });
        if (!response.ok) {
          return { success: false, error: 'Invalid Postmark API token' };
        }
        return { success: true };
      }

      case 'sendgrid': {
        const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${credentials.apiKey}`,
          },
        });
        if (!response.ok) {
          return { success: false, error: 'Invalid SendGrid API key' };
        }
        return { success: true };
      }

      case 'mailgun': {
        // Mailgun uses different domain-specific endpoints
        // Just verify the key format for now
        if (!credentials.apiKey?.startsWith('key-')) {
          return { success: false, error: 'Invalid Mailgun API key format' };
        }
        return { success: true };
      }

      case 'amazon_ses': {
        // AWS SES requires region-specific validation
        // Basic format check
        if (!credentials.apiKey || credentials.apiKey.length < 16) {
          return { success: false, error: 'Invalid AWS access key format' };
        }
        return { success: true };
      }

      case 'zoho_zeptomail': {
        const response = await fetch('https://api.zeptomail.com/v1.1/email', {
          method: 'POST',
          headers: {
            'Authorization': credentials.apiKey || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            // Dry run - will fail but validates token
            bounce_address: 'bounce@test.com',
            from: { address: 'test@test.com' },
            to: [{ email_address: { address: 'test@test.com' } }],
            subject: 'Test',
            htmlbody: 'Test',
          }),
        });
        // 401 means invalid token, other errors mean token is valid
        if (response.status === 401) {
          return { success: false, error: 'Invalid ZeptoMail token' };
        }
        return { success: true };
      }

      case 'custom_smtp': {
        if (!credentials.smtpHost || !credentials.smtpPort) {
          return { success: false, error: 'SMTP host and port are required' };
        }
        
        // Test SMTP connection
        try {
          const port = credentials.smtpPort;
          const useTls = credentials.smtpUseTls !== false;
          
          let conn: Deno.TlsConn | Deno.TcpConn;
          
          if (useTls && (port === 465 || port === 587)) {
            conn = await Deno.connectTls({
              hostname: credentials.smtpHost,
              port: port,
            });
          } else {
            conn = await Deno.connect({
              hostname: credentials.smtpHost,
              port: port,
            });
          }
          
          const buf = new Uint8Array(1024);
          await conn.read(buf);
          conn.close();
          
          return { success: true };
        } catch (err) {
          return { success: false, error: `SMTP connection failed: ${err instanceof Error ? err.message : 'Unknown error'}` };
        }
      }

      default:
        return { success: false, error: 'Unknown provider type' };
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Connection test failed' };
  }
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const auth = await verifyAuth(req);
  if (!auth) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json();
    const { action } = body;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const encryptionKey = Deno.env.get('TIN_ENCRYPTION_KEY') || 'default-encryption-key';

    if (action === 'save') {
      const { providerType, credentials } = body;

      // Encrypt sensitive fields
      const encryptedApiKey = credentials.apiKey 
        ? encryptCredential(credentials.apiKey, encryptionKey) 
        : null;
      const encryptedPassword = credentials.smtpPassword 
        ? encryptCredential(credentials.smtpPassword, encryptionKey) 
        : null;

      // Deactivate existing providers for this user
      await supabase
        .from('email_provider_settings')
        .update({ is_active: false })
        .eq('user_id', auth.userId);

      // Upsert new provider settings
      const { data, error } = await supabase
        .from('email_provider_settings')
        .upsert({
          user_id: auth.userId,
          provider_type: providerType,
          is_active: true,
          api_key_encrypted: encryptedApiKey,
          smtp_host: credentials.smtpHost || null,
          smtp_port: credentials.smtpPort || null,
          smtp_username: credentials.smtpUsername || null,
          smtp_password_encrypted: encryptedPassword,
          smtp_use_tls: credentials.smtpUseTls ?? true,
          from_email: credentials.fromEmail || null,
          from_name: credentials.fromName || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,is_active',
        })
        .select()
        .single();

      if (error) {
        // If conflict, try insert
        const { error: insertError } = await supabase
          .from('email_provider_settings')
          .insert({
            user_id: auth.userId,
            provider_type: providerType,
            is_active: true,
            api_key_encrypted: encryptedApiKey,
            smtp_host: credentials.smtpHost || null,
            smtp_port: credentials.smtpPort || null,
            smtp_username: credentials.smtpUsername || null,
            smtp_password_encrypted: encryptedPassword,
            smtp_use_tls: credentials.smtpUseTls ?? true,
            from_email: credentials.fromEmail || null,
            from_name: credentials.fromName || null,
          });

        if (insertError) {
          console.error('Insert error:', insertError);
          throw insertError;
        }
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'test') {
      // Get current provider settings
      const { data: settings, error: fetchError } = await supabase
        .from('email_provider_settings')
        .select('*')
        .eq('user_id', auth.userId)
        .eq('is_active', true)
        .single();

      if (fetchError || !settings) {
        return new Response(
          JSON.stringify({ success: false, error: 'No email provider configured' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Decrypt credentials for testing
      const credentials = {
        apiKey: settings.api_key_encrypted 
          ? decryptCredential(settings.api_key_encrypted, encryptionKey) 
          : undefined,
        smtpHost: settings.smtp_host,
        smtpPort: settings.smtp_port,
        smtpUsername: settings.smtp_username,
        smtpPassword: settings.smtp_password_encrypted 
          ? decryptCredential(settings.smtp_password_encrypted, encryptionKey) 
          : undefined,
        smtpUseTls: settings.smtp_use_tls,
        fromEmail: settings.from_email,
      };

      const testResult = await testProviderConnection(settings.provider_type, credentials);

      // Update test results
      await supabase
        .from('email_provider_settings')
        .update({
          last_test_at: new Date().toISOString(),
          last_test_success: testResult.success,
          last_test_error: testResult.error || null,
        })
        .eq('id', settings.id);

      return new Response(
        JSON.stringify(testResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
