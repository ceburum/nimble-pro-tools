import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Authentication helper
async function verifyAuth(req: Request): Promise<{ userId: string } | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data, error } = await supabase.auth.getClaims(token);
    
    if (error || !data?.claims) {
      return null;
    }

    return { userId: data.claims.sub as string };
  } catch {
    return null;
  }
}

// Zod schema for input validation
const LineItemSchema = z.object({
  id: z.string().max(100),
  description: z.string().max(500),
  quantity: z.number().positive().max(10000),
  unitPrice: z.number().nonnegative().max(1000000),
});

const SendQuoteRequestSchema = z.object({
  projectId: z.string().uuid(),
  projectTitle: z.string().min(1).max(200),
  projectDescription: z.string().max(2000).optional(),
  clientName: z.string().min(1).max(200),
  clientEmail: z.string().email().max(255),
  items: z.array(LineItemSchema).min(1).max(100),
  notes: z.string().max(2000).optional(),
  notificationEmail: z.string().email().max(255),
});

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface SendQuoteRequest {
  projectId: string;
  projectTitle: string;
  projectDescription?: string;
  clientName: string;
  clientEmail: string;
  items: LineItem[];
  notes?: string;
  notificationEmail: string;
}

// HTML escape function to prevent XSS
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getEmailHeader(title: string, subtitle?: string): string {
  return `
    <!-- Header - matching cebbuilding.com style -->
    <tr>
      <td style="background-color: #c8c4bd; padding: 20px 24px; border-bottom: 3px solid #a09d95;">
        <table role="presentation" class="header-table" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td class="header-left" style="vertical-align: middle; width: 40%;">
              <p style="color: #333333; margin: 0; font-size: 13px; font-weight: 600;">Chad Burum</p>
              <p style="color: #555555; margin: 2px 0; font-size: 12px;">405-500-8224</p>
              <p style="color: #555555; margin: 2px 0; font-size: 12px;">chad@cebbuilding.com</p>
              <p style="color: #555555; margin: 2px 0; font-size: 12px;">cebbuilding.com</p>
            </td>
            <td class="header-right" style="vertical-align: middle; text-align: right; width: 60%;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-left: auto;">
                <tr>
                  <td style="vertical-align: middle; padding-right: 14px; text-align: right;">
                    <h1 style="color: #333333; margin: 0; font-size: 22px; font-weight: 400; font-family: Georgia, serif;">CEB Building</h1>
                    <p style="color: #555555; margin: 2px 0 0 0; font-size: 13px; font-style: italic;">Hand-Crafted Wood Works</p>
                  </td>
                  <td style="vertical-align: middle;">
                    <div style="width: 65px; height: 65px; border-radius: 50%; background: #c8a45c; display: flex; align-items: center; justify-content: center;">
                      <span style="color: #fff; font-size: 24px; font-weight: bold; font-family: Georgia, serif;">CEB</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Title Bar -->
    <tr>
      <td style="background-color: #4a4a4a; padding: 12px 24px;">
        <p style="color: #ffffff; margin: 0; font-size: 16px; font-weight: 600; letter-spacing: 1px;">${escapeHtml(title)}</p>
        ${subtitle ? `<p style="color: #b0b0b0; margin: 4px 0 0 0; font-size: 13px;">${escapeHtml(subtitle)}</p>` : ''}
      </td>
    </tr>
  `;
}

function getEmailFooter(): string {
  return `
    <!-- Footer -->
    <tr>
      <td style="background-color: #4a4a4a; padding: 20px 24px; text-align: center;">
        <p style="color: #ffffff; font-size: 14px; margin: 0 0 6px 0;">
          Thank you for choosing CEB Building!
        </p>
        <p style="color: #b0b0b0; font-size: 12px; margin: 0;">
          Hand-Crafted Wood Works · Oklahoma City
        </p>
        <p style="color: #888888; font-size: 11px; margin: 12px 0 0 0;">
          © ${new Date().getFullYear()} CEB Building. All rights reserved.
        </p>
      </td>
    </tr>
  `;
}

function getEmailWrapper(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; }
        table { border-collapse: collapse; }
        @media only screen and (max-width: 600px) {
          .container { width: 100% !important; }
          .header-table { display: block !important; }
          .header-left { display: block !important; width: 100% !important; text-align: center !important; padding-bottom: 16px !important; }
          .header-right { display: block !important; width: 100% !important; text-align: center !important; }
          .content { padding: 24px 16px !important; }
        }
      </style>
    </head>
    <body style="font-family: Georgia, 'Times New Roman', serif; line-height: 1.6; color: #333333; background-color: #f5f5f0; margin: 0; padding: 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f0;">
        <tr>
          <td align="center" style="padding: 20px;">
            <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);">
              ${content}
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

async function sendEmailViaZoho(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  const smtpUser = Deno.env.get("ZOHO_SMTP_USER");
  const smtpPassword = Deno.env.get("ZOHO_SMTP_PASSWORD");

  if (!smtpUser || !smtpPassword) {
    throw new Error("Zoho SMTP credentials not configured");
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const conn = await Deno.connectTls({
    hostname: "smtp.zoho.com",
    port: 465,
  });

  const read = async (): Promise<string> => {
    const buf = new Uint8Array(1024);
    const n = await conn.read(buf);
    return decoder.decode(buf.subarray(0, n!));
  };

  const write = async (data: string): Promise<void> => {
    await conn.write(encoder.encode(data + "\r\n"));
  };

  try {
    await read();
    await write(`EHLO smtp.zoho.com`);
    await read();
    await write(`AUTH LOGIN`);
    await read();
    await write(btoa(smtpUser));
    await read();
    await write(btoa(smtpPassword));
    await read();
    await write(`MAIL FROM:<${smtpUser}>`);
    await read();
    await write(`RCPT TO:<${to}>`);
    await read();
    await write(`DATA`);
    await read();

    const altBoundary = `----=_Alt_${Date.now()}`;

    const headers = [
      `From: CEB Building <${smtpUser}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
    ];

    const emailContent = [
      ...headers,
      `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
      ``,
      `--${altBoundary}`,
      `Content-Type: text/plain; charset=utf-8`,
      ``,
      `Please view this email in an HTML-compatible email client.`,
      ``,
      `--${altBoundary}`,
      `Content-Type: text/html; charset=utf-8`,
      ``,
      html,
      ``,
      `--${altBoundary}--`,
      `.`,
    ].join("\r\n");

    await conn.write(encoder.encode(emailContent + "\r\n"));
    await read();
    await write(`QUIT`);

    console.log(`Email sent successfully to ${to}`);
  } finally {
    conn.close();
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify authentication
  const auth = await verifyAuth(req);
  if (!auth) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log(`Authenticated request from user: ${auth.userId}`);

  try {
    // Validate input with Zod schema
    const rawData = await req.json();
    const validationResult = SendQuoteRequestSchema.safeParse(rawData);
    
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error.issues);
      return new Response(
        JSON.stringify({ error: "Invalid request data", details: validationResult.error.issues }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const {
      projectId,
      projectTitle,
      projectDescription,
      clientName,
      clientEmail,
      items,
      notes,
    } = validationResult.data;

    console.log(`Sending quote for project ${projectId} to ${clientEmail}`);

    const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const formattedTotal = total.toLocaleString('en-US', { minimumFractionDigits: 2 });

    // Generate a new response token for this quote
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseServiceKey) {
      throw new Error("Missing Supabase service role key");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate a new response token and update the project
    const responseToken = crypto.randomUUID();
    const { error: updateError } = await supabase
      .from('projects')
      .update({ 
        response_token: responseToken,
        response_token_used_at: null // Reset in case quote is being resent
      })
      .eq('id', projectId);

    if (updateError) {
      console.error("Failed to update project with response token:", updateError);
      throw new Error("Failed to prepare quote for sending");
    }

    // Generate secure response URLs using the token
    const acceptUrl = `${supabaseUrl}/functions/v1/quote-response?token=${responseToken}&action=accept`;
    const declineUrl = `${supabaseUrl}/functions/v1/quote-response?token=${responseToken}&action=decline`;

    const emailContent = `
      ${getEmailHeader('PROJECT QUOTE', projectTitle)}
      
      <!-- Content -->
      <tr>
        <td class="content" style="padding: 32px 24px;">
          <p style="font-size: 16px; margin: 0 0 20px 0; color: #333;">Hello <strong>${escapeHtml(clientName)}</strong>,</p>
          <p style="font-size: 15px; color: #666666; margin: 0 0 24px 0;">Thank you for your interest! Please review the quote below for your project:</p>
          
          ${projectDescription ? `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #faf9f7; border-left: 4px solid #c8a45c; margin-bottom: 24px;">
              <tr>
                <td style="padding: 16px 20px;">
                  <p style="margin: 0; font-size: 14px; font-style: italic; color: #666;">${escapeHtml(projectDescription)}</p>
                </td>
              </tr>
            </table>
          ` : ''}
          
          <!-- Quote Items Table -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
            <thead>
              <tr style="background: #f8f7f5; border-bottom: 2px solid #d4d0c8;">
                <th style="padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #4a4a4a; text-transform: uppercase; letter-spacing: 0.5px;">Description</th>
                <th style="padding: 12px 10px; text-align: center; font-size: 12px; font-weight: 600; color: #4a4a4a; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
                <th style="padding: 12px 10px; text-align: right; font-size: 12px; font-weight: 600; color: #4a4a4a; text-transform: uppercase; letter-spacing: 0.5px;">Price</th>
                <th style="padding: 12px 16px; text-align: right; font-size: 12px; font-weight: 600; color: #4a4a4a; text-transform: uppercase; letter-spacing: 0.5px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr style="border-bottom: 1px solid #e8e6e1;">
                  <td style="padding: 14px 16px; color: #333;">${escapeHtml(item.description)}</td>
                  <td style="padding: 14px 10px; text-align: center; color: #333;">${item.quantity}</td>
                  <td style="padding: 14px 10px; text-align: right; color: #333;">$${item.unitPrice.toFixed(2)}</td>
                  <td style="padding: 14px 16px; text-align: right; color: #333;">$${(item.quantity * item.unitPrice).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="background: #f8f7f5;">
                <td colspan="3" style="padding: 16px; text-align: right; font-weight: 700; font-size: 16px; color: #333; border-top: 2px solid #d4d0c8;">Quote Total:</td>
                <td style="padding: 16px; text-align: right; font-weight: 700; font-size: 20px; color: #2d5016; border-top: 2px solid #d4d0c8;">$${formattedTotal}</td>
              </tr>
            </tfoot>
          </table>
          
          ${notes ? `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #faf9f7; border-left: 4px solid #c8a45c; margin-bottom: 28px;">
              <tr>
                <td style="padding: 16px 20px;">
                  <p style="margin: 0; font-size: 14px; color: #666;"><strong>Notes:</strong> ${escapeHtml(notes)}</p>
                </td>
              </tr>
            </table>
          ` : ''}
          
          <!-- Response Buttons -->
          <div style="text-align: center; padding: 24px 0; border-top: 1px solid #e8e6e1;">
            <p style="font-size: 16px; font-weight: 600; margin: 0 0 20px 0; color: #333;">Would you like to proceed?</p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
              <tr>
                <td style="padding: 6px;">
                  <a href="${acceptUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; background-color: #2d5016; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; font-family: -apple-system, sans-serif;">
                    ✓ Accept Quote
                  </a>
                </td>
                <td style="padding: 6px;">
                  <a href="${declineUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; background-color: #8b4513; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; font-family: -apple-system, sans-serif;">
                    ✗ Decline
                  </a>
                </td>
              </tr>
            </table>
          </div>
          
          <p style="color: #666; font-size: 14px; text-align: center; margin: 20px 0 0 0;">
            If you have any questions about this quote, please don't hesitate to reach out.
          </p>
        </td>
      </tr>
      
      ${getEmailFooter()}
    `;

    const emailHtml = getEmailWrapper(emailContent);

    await sendEmailViaZoho(
      clientEmail,
      `Quote for ${projectTitle} - CEB Building`,
      emailHtml,
    );

    console.log("Quote email sent successfully via Zoho SMTP");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: unknown) {
    console.error("Error sending quote email:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
