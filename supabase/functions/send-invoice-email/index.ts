import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
const InvoiceItemSchema = z.object({
  id: z.string().max(100),
  description: z.string().max(500),
  quantity: z.number().positive().max(10000),
  unitPrice: z.number().nonnegative().max(1000000),
});

const SendInvoiceRequestSchema = z.object({
  clientName: z.string().min(1).max(200),
  clientEmail: z.string().email().max(255),
  invoiceNumber: z.string().min(1).max(50),
  paymentToken: z.string().uuid().optional(),
  items: z.array(InvoiceItemSchema).min(1).max(100),
  dueDate: z.string().max(50),
  notes: z.string().max(2000).optional(),
  businessName: z.string().max(200).optional(),
  plainTextOnly: z.boolean().optional(),
});

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface SendInvoiceRequest {
  clientName: string;
  clientEmail: string;
  invoiceNumber: string;
  paymentToken?: string;
  items: InvoiceItem[];
  dueDate: string;
  notes?: string;
  businessName?: string;
  plainTextOnly?: boolean;
}

const PAYMENT_METHODS = [
  {
    name: 'Venmo',
    link: 'https://venmo.com/code?user_id=2841609905373184175&created=1767587302',
    color: '#008CFF',
  },
  {
    name: 'CashApp',
    link: 'https://cash.app/$ceburum',
    color: '#00D632',
  },
];

// Get the app base URL for payment links
function getAppBaseUrl(): string {
  // Use the production URL - this is the custom domain
  return Deno.env.get("APP_BASE_URL") || "https://app.cebbuilding.com";
}

// Simple HTML email header without logo for reliability
function getEmailHeader(title: string, subtitle?: string): string {
  return `
    <!-- Header - matching cebbuilding.com style -->
    <tr>
      <td style="background-color: #c8c4bd; padding: 20px 24px; border-bottom: 3px solid #a09d95;">
        <table role="presentation" class="header-table" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td class="header-left" style="vertical-align: middle; width: 50%;">
              <p style="color: #333333; margin: 0; font-size: 13px; font-weight: 600;">Chad Burum</p>
              <p style="color: #555555; margin: 2px 0; font-size: 12px;">405-500-8224</p>
              <p style="color: #555555; margin: 2px 0; font-size: 12px;">chad@cebbuilding.com</p>
              <p style="color: #555555; margin: 2px 0; font-size: 12px;">cebbuilding.com</p>
            </td>
            <td class="header-right" style="vertical-align: middle; text-align: right; width: 50%;">
              <h1 style="color: #333333; margin: 0; font-size: 22px; font-weight: 400; font-family: Georgia, serif;">CEB Building</h1>
              <p style="color: #555555; margin: 2px 0 0 0; font-size: 13px; font-style: italic;">Hand-Crafted Wood Works</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Title Bar -->
    <tr>
      <td style="background-color: #4a4a4a; padding: 12px 24px;">
        <p style="color: #ffffff; margin: 0; font-size: 16px; font-weight: 600; letter-spacing: 1px;">${title}</p>
        ${subtitle ? `<p style="color: #b0b0b0; margin: 4px 0 0 0; font-size: 13px;">${subtitle}</p>` : ''}
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

// Simplified email sender - no logo attachment, minimal logging
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

  // Read SMTP response, handling multi-line responses
  const read = async (): Promise<string> => {
    let fullResponse = "";
    const buf = new Uint8Array(4096);
    
    while (true) {
      const n = await conn.read(buf);
      if (!n) break;
      fullResponse += decoder.decode(buf.subarray(0, n));
      
      const lines = fullResponse.trim().split("\r\n");
      const lastLine = lines[lines.length - 1];
      if (/^\d{3} /.test(lastLine) || /^\d{3}$/.test(lastLine)) {
        break;
      }
    }
    
    return fullResponse.trim();
  };

  const write = async (data: string): Promise<void> => {
    await conn.write(encoder.encode(data + "\r\n"));
  };

  try {
    await read(); // greeting
    await write(`EHLO smtp.zoho.com`);
    await read();
    
    await write(`AUTH LOGIN`);
    await read();
    
    await write(btoa(smtpUser));
    await read();
    
    await write(btoa(smtpPassword));
    const authResponse = await read();
    
    if (authResponse.startsWith("4") || authResponse.startsWith("5")) {
      throw new Error(`SMTP Auth failed`);
    }

    await write(`MAIL FROM:<${smtpUser}>`);
    const mailFromResponse = await read();
    if (!mailFromResponse.startsWith("250")) {
      throw new Error(`MAIL FROM rejected`);
    }

    await write(`RCPT TO:<${to}>`);
    const rcptResponse = await read();
    if (!rcptResponse.startsWith("250")) {
      throw new Error(`RCPT TO rejected`);
    }

    await write(`DATA`);
    const dataResponse = await read();
    if (!dataResponse.startsWith("354")) {
      throw new Error(`DATA command rejected`);
    }

    const altBoundary = `----=_Alt_${Date.now()}`;

    const headers = [
      `From: CEB Building <${smtpUser}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: <${Date.now()}.${Math.random().toString(36).substring(2)}@cebbuilding.com>`,
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
    const sendResponse = await read();
    
    if (!sendResponse.startsWith("250")) {
      throw new Error(`Message rejected after DATA`);
    }

    await write(`QUIT`);
    try { await read(); } catch { /* ignore quit response */ }
  } finally {
    conn.close();
  }
}

// Plain text email for deliverability testing
async function sendPlainTextEmail(
  to: string,
  subject: string,
  body: string,
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
    let fullResponse = "";
    const buf = new Uint8Array(4096);
    
    while (true) {
      const n = await conn.read(buf);
      if (!n) break;
      fullResponse += decoder.decode(buf.subarray(0, n));
      
      const lines = fullResponse.trim().split("\r\n");
      const lastLine = lines[lines.length - 1];
      if (/^\d{3} /.test(lastLine) || /^\d{3}$/.test(lastLine)) {
        break;
      }
    }
    
    return fullResponse.trim();
  };

  const write = async (data: string): Promise<void> => {
    await conn.write(encoder.encode(data + "\r\n"));
  };

  try {
    await read(); // greeting
    await write(`EHLO smtp.zoho.com`);
    await read();
    
    await write(`AUTH LOGIN`);
    await read();
    
    await write(btoa(smtpUser));
    await read();
    
    await write(btoa(smtpPassword));
    const authResponse = await read();
    
    if (authResponse.startsWith("4") || authResponse.startsWith("5")) {
      throw new Error(`SMTP Auth failed`);
    }

    await write(`MAIL FROM:<${smtpUser}>`);
    const mailFromResponse = await read();
    if (!mailFromResponse.startsWith("250")) {
      throw new Error(`MAIL FROM rejected`);
    }

    await write(`RCPT TO:<${to}>`);
    const rcptResponse = await read();
    if (!rcptResponse.startsWith("250")) {
      throw new Error(`RCPT TO rejected`);
    }

    await write(`DATA`);
    const dataResponse = await read();
    if (!dataResponse.startsWith("354")) {
      throw new Error(`DATA command rejected`);
    }

    const emailContent = [
      `From: CEB Building <${smtpUser}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: <${Date.now()}.${Math.random().toString(36).substring(2)}@cebbuilding.com>`,
      `Content-Type: text/plain; charset=utf-8`,
      ``,
      body,
      `.`,
    ].join("\r\n");
    
    await conn.write(encoder.encode(emailContent + "\r\n"));
    const sendResponse = await read();
    
    if (!sendResponse.startsWith("250")) {
      throw new Error(`Message rejected after DATA`);
    }

    await write(`QUIT`);
    try { await read(); } catch { /* ignore */ }
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
    const validationResult = SendInvoiceRequestSchema.safeParse(rawData);
    
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error.issues);
      return new Response(
        JSON.stringify({ error: "Invalid request data", details: validationResult.error.issues }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const {
      clientName,
      clientEmail,
      invoiceNumber,
      paymentToken,
      items,
      dueDate,
      notes,
      businessName = "CEB Building",
      plainTextOnly = false,
    } = validationResult.data;

    const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const formattedTotal = total.toLocaleString('en-US', { minimumFractionDigits: 2 });
    const convenienceFee = total * 0.03;
    const totalWithFee = (total + convenienceFee).toLocaleString('en-US', { minimumFractionDigits: 2 });
    
    // Build card payment URL using payment token for security
    const baseUrl = getAppBaseUrl();
    const cardPaymentUrl = paymentToken ? `${baseUrl}/pay/${paymentToken}` : null;

    // If plain text mode, send a simple text email for deliverability testing
    if (plainTextOnly) {
      const plainBody = `
Invoice ${invoiceNumber} from ${businessName}

Hello ${clientName},

Thank you for your business. Here are your invoice details:

${items.map(item => `- ${item.description || 'Service'}: ${item.quantity} x $${item.unitPrice.toFixed(2)} = $${(item.quantity * item.unitPrice).toFixed(2)}`).join('\n')}

Total Due: $${formattedTotal}
Due Date: ${dueDate}
${notes ? `\nNotes: ${notes}` : ''}

Payment Options:
- Venmo: https://venmo.com/code?user_id=2841609905373184175
- CashApp: https://cash.app/$ceburum

Thank you for choosing CEB Building!
Chad Burum
405-500-8224
chad@cebbuilding.com
cebbuilding.com
      `.trim();

      await sendPlainTextEmail(
        clientEmail,
        `Invoice ${invoiceNumber} from ${businessName}`,
        plainBody,
      );

      return new Response(JSON.stringify({ 
        success: true, 
        mode: "plainText",
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    // Simple HTML email without logo
    const emailContent = `
      ${getEmailHeader(`INVOICE ${invoiceNumber}`)}
      
      <!-- Content -->
      <tr>
        <td class="content" style="padding: 32px 24px;">
          <p style="font-size: 16px; margin: 0 0 20px 0; color: #333;">Hello <strong>${clientName}</strong>,</p>
          <p style="font-size: 15px; color: #666666; margin: 0 0 24px 0;">Thank you for your business. Please find your invoice details below:</p>
          
          <!-- Invoice Items Table -->
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
                  <td style="padding: 14px 16px; color: #333;">${item.description}</td>
                  <td style="padding: 14px 10px; text-align: center; color: #333;">${item.quantity}</td>
                  <td style="padding: 14px 10px; text-align: right; color: #333;">$${item.unitPrice.toFixed(2)}</td>
                  <td style="padding: 14px 16px; text-align: right; color: #333;">$${(item.quantity * item.unitPrice).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="background: #f8f7f5;">
                <td colspan="3" style="padding: 16px; text-align: right; font-weight: 700; font-size: 16px; color: #333; border-top: 2px solid #d4d0c8;">Total Due:</td>
                <td style="padding: 16px; text-align: right; font-weight: 700; font-size: 20px; color: #2d5016; border-top: 2px solid #d4d0c8;">$${formattedTotal}</td>
              </tr>
            </tfoot>
          </table>
          
          <!-- Due Date -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #faf9f7; border-left: 4px solid #c8a45c; margin-bottom: 28px;">
            <tr>
              <td style="padding: 16px 20px;">
                <p style="margin: 0; font-size: 15px; color: #333;"><strong>Due Date:</strong> ${dueDate}</p>
                ${notes ? `<p style="margin: 10px 0 0 0; font-size: 14px; color: #666;"><strong>Notes:</strong> ${notes}</p>` : ''}
              </td>
            </tr>
          </table>
          
          <!-- Payment Options -->
          <div style="text-align: center; padding: 24px 0; border-top: 1px solid #e8e6e1;">
            <p style="font-size: 16px; font-weight: 600; margin: 0 0 16px 0; color: #333;">Payment Options</p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
              <tr>
                ${PAYMENT_METHODS.map(method => `
                  <td style="padding: 6px;">
                    <a href="${method.link}" target="_blank" style="display: inline-block; padding: 14px 28px; background-color: ${method.color}; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; font-family: -apple-system, sans-serif;">
                      Pay with ${method.name}
                    </a>
                  </td>
                `).join('')}
              </tr>
            </table>
            ${cardPaymentUrl ? `
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px dashed #d4d0c8;">
                <p style="font-size: 13px; color: #666; margin: 0 0 12px 0;">Or pay by credit card (3% convenience fee applies):</p>
                <a href="${cardPaymentUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; background-color: #4a4a4a; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; font-family: -apple-system, sans-serif;">
                  Pay $${totalWithFee} with Card
                </a>
              </div>
            ` : ''}
          </div>
        </td>
      </tr>
      
      ${getEmailFooter()}
    `;

    const emailHtml = getEmailWrapper(emailContent);

    await sendEmailViaZoho(
      clientEmail,
      `Invoice ${invoiceNumber} from ${businessName}`,
      emailHtml,
    );

    return new Response(JSON.stringify({ 
      success: true,
      mode: "html",
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending invoice email:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
