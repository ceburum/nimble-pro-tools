import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

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

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface Client {
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

interface SendReceiptRequest {
  client: Client;
  invoiceNumber: string;
  items: InvoiceItem[];
  paidAt: string;
  notes?: string;
}

const LOGO_URL = "https://pvgxkznweoedkvebjjpc.supabase.co/storage/v1/object/public/assets/ceb-logo.png";

// Fetch logo and convert to base64 for PDF embedding
async function fetchLogoBase64(): Promise<string | null> {
  try {
    const response = await fetch(LOGO_URL);
    if (!response.ok) {
      console.log("Failed to fetch logo, proceeding without it");
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.log("Error fetching logo:", error);
    return null;
  }
}

// Generate receipt HTML (styled for PDF)
function generateReceiptHtml(
  client: Client,
  invoiceNumber: string,
  items: InvoiceItem[],
  paidAt: string,
  notes: string | undefined,
  logoDataUrl: string | null,
): string {
  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const formattedTotal = total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const paidDate = new Date(paidAt).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px;">${item.description}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 13px;">${item.quantity}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 13px;">$${item.unitPrice.toFixed(2)}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 13px;">$${(item.quantity * item.unitPrice).toFixed(2)}</td>
    </tr>
  `).join('');

  const logoHtml = logoDataUrl 
    ? `<img src="${logoDataUrl}" alt="CEB Building" style="height: 60px; width: 60px; border-radius: 8px; object-fit: cover;" />`
    : `<div style="height: 60px; width: 60px; background: #c8c4bd; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #4a4a4a;">CEB</div>`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Receipt - ${invoiceNumber}</title>
      <style>
        @page { size: letter; margin: 0.5in; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: Georgia, 'Times New Roman', serif;
          color: #333333;
          line-height: 1.5;
          background: #ffffff;
        }
      </style>
    </head>
    <body>
      <div style="max-width: 700px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #c8c4bd; padding: 20px; border-bottom: 3px solid #a09d95; margin-bottom: 0;">
          <tr>
            <td style="vertical-align: middle; width: 50%;">
              <p style="font-weight: 600; font-size: 14px; margin: 0;">Chad Burum</p>
              <p style="font-size: 12px; color: #555; margin: 2px 0;">405-500-8224</p>
              <p style="font-size: 12px; color: #555; margin: 2px 0;">chad@cebbuilding.com</p>
              <p style="font-size: 12px; color: #555; margin: 2px 0;">cebbuilding.com</p>
            </td>
            <td style="vertical-align: middle; text-align: right; width: 50%;">
              ${logoHtml}
              <p style="font-size: 18px; font-weight: normal; margin: 8px 0 0 0; font-family: Georgia, serif;">CEB Building</p>
              <p style="font-size: 12px; color: #555; font-style: italic; margin: 2px 0;">Hand-Crafted Wood Works</p>
            </td>
          </tr>
        </table>

        <!-- PAID Banner -->
        <div style="background: #166534; color: white; padding: 16px 20px; text-align: center;">
          <p style="font-size: 22px; font-weight: bold; margin: 0; letter-spacing: 2px;">✓ PAYMENT RECEIVED</p>
          <p style="font-size: 13px; margin: 6px 0 0 0; opacity: 0.9;">Receipt for Invoice ${invoiceNumber}</p>
        </div>

        <!-- Content -->
        <div style="padding: 24px 20px; background: #fafaf8;">
          <!-- Client & Payment Info -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
            <tr>
              <td style="vertical-align: top; width: 50%;">
                <p style="font-size: 11px; text-transform: uppercase; color: #666; margin-bottom: 6px; font-weight: 600;">Received From</p>
                <p style="font-size: 14px; font-weight: 600; margin: 0;">${client.name}</p>
                ${client.email ? `<p style="font-size: 12px; color: #555; margin: 2px 0;">${client.email}</p>` : ''}
                ${client.phone ? `<p style="font-size: 12px; color: #555; margin: 2px 0;">${client.phone}</p>` : ''}
                ${client.address ? `<p style="font-size: 12px; color: #555; margin: 2px 0;">${client.address}</p>` : ''}
              </td>
              <td style="vertical-align: top; text-align: right; width: 50%;">
                <p style="font-size: 11px; text-transform: uppercase; color: #666; margin-bottom: 6px; font-weight: 600;">Payment Details</p>
                <p style="font-size: 12px; margin: 2px 0;"><strong>Date Paid:</strong> ${paidDate}</p>
                <p style="font-size: 12px; margin: 2px 0;"><strong>Invoice #:</strong> ${invoiceNumber}</p>
              </td>
            </tr>
          </table>

          <!-- Items Table -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background: white; border: 1px solid #e5e7eb; margin-bottom: 20px;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #666; border-bottom: 2px solid #e5e7eb;">Description</th>
                <th style="padding: 10px 12px; text-align: center; font-size: 11px; text-transform: uppercase; color: #666; border-bottom: 2px solid #e5e7eb;">Qty</th>
                <th style="padding: 10px 12px; text-align: right; font-size: 11px; text-transform: uppercase; color: #666; border-bottom: 2px solid #e5e7eb;">Rate</th>
                <th style="padding: 10px 12px; text-align: right; font-size: 11px; text-transform: uppercase; color: #666; border-bottom: 2px solid #e5e7eb;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Total -->
          <div style="text-align: right; padding: 16px 0; border-top: 2px solid #166534;">
            <p style="font-size: 12px; color: #666; margin: 0;">Total Paid</p>
            <p style="font-size: 24px; font-weight: bold; color: #166534; margin: 4px 0 0 0;">$${formattedTotal}</p>
          </div>

          ${notes ? `
            <div style="margin-top: 16px; padding: 12px; background: #f0f0eb; border-radius: 4px;">
              <p style="font-size: 11px; text-transform: uppercase; color: #666; margin-bottom: 4px; font-weight: 600;">Notes</p>
              <p style="font-size: 13px; color: #333; margin: 0;">${notes}</p>
            </div>
          ` : ''}
        </div>

        <!-- Footer -->
        <div style="background: #4a4a4a; color: white; padding: 20px; text-align: center;">
          <p style="font-size: 14px; margin: 0 0 6px 0;">Thank you for your business!</p>
          <p style="font-size: 12px; color: #b0b0b0; margin: 0;">Hand-Crafted Wood Works · Oklahoma City</p>
          <p style="font-size: 11px; color: #888; margin: 12px 0 0 0;">© ${new Date().getFullYear()} CEB Building. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Email body (separate from PDF)
function generateEmailHtml(clientName: string, invoiceNumber: string, total: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Georgia, 'Times New Roman', serif; line-height: 1.6; color: #333; background: #f5f5f0; margin: 0; padding: 20px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background: #f5f5f0;">
        <tr>
          <td align="center" style="padding: 20px;">
            <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
              <!-- Header -->
              <tr>
                <td style="background: #c8c4bd; padding: 20px 24px; border-bottom: 3px solid #a09d95;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="width: 50%;">
                        <p style="font-weight: 600; font-size: 13px; margin: 0;">Chad Burum</p>
                        <p style="font-size: 12px; color: #555; margin: 2px 0;">405-500-8224</p>
                        <p style="font-size: 12px; color: #555; margin: 2px 0;">chad@cebbuilding.com</p>
                      </td>
                      <td style="width: 50%; text-align: right;">
                        <p style="font-size: 20px; margin: 0; font-family: Georgia, serif;">CEB Building</p>
                        <p style="font-size: 12px; color: #555; font-style: italic; margin: 2px 0;">Hand-Crafted Wood Works</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Green Banner -->
              <tr>
                <td style="background: #166534; color: white; padding: 16px 24px; text-align: center;">
                  <p style="font-size: 18px; font-weight: bold; margin: 0; letter-spacing: 1px;">✓ PAYMENT RECEIVED</p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 32px 24px;">
                  <p style="font-size: 16px; margin: 0 0 20px 0;">Hello <strong>${clientName}</strong>,</p>
                  <p style="font-size: 15px; color: #666; margin: 0 0 24px 0;">
                    Thank you for your payment of <strong style="color: #166534;">$${total}</strong> for Invoice <strong>${invoiceNumber}</strong>.
                  </p>
                  <p style="font-size: 15px; color: #666; margin: 0 0 24px 0;">
                    Your official receipt is attached to this email as a PDF for your records.
                  </p>
                  <p style="font-size: 15px; color: #666; margin: 0;">
                    We truly appreciate your business and look forward to working with you again!
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background: #4a4a4a; padding: 20px 24px; text-align: center;">
                  <p style="color: #fff; font-size: 14px; margin: 0 0 6px 0;">Thank you for choosing CEB Building!</p>
                  <p style="color: #b0b0b0; font-size: 12px; margin: 0;">Hand-Crafted Wood Works · Oklahoma City</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Send email with PDF attachment via Zoho SMTP
async function sendReceiptEmail(
  to: string,
  subject: string,
  emailHtml: string,
  pdfHtml: string,
  invoiceNumber: string,
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
      throw new Error(`SMTP Auth failed: ${authResponse}`);
    }

    await write(`MAIL FROM:<${smtpUser}>`);
    const mailFromResponse = await read();
    if (!mailFromResponse.startsWith("250")) {
      throw new Error(`MAIL FROM rejected: ${mailFromResponse}`);
    }

    await write(`RCPT TO:<${to}>`);
    const rcptResponse = await read();
    if (!rcptResponse.startsWith("250")) {
      throw new Error(`RCPT TO rejected: ${rcptResponse}`);
    }

    await write(`DATA`);
    const dataResponse = await read();
    if (!dataResponse.startsWith("354")) {
      throw new Error(`DATA command rejected: ${dataResponse}`);
    }

    // MIME boundaries
    const mixedBoundary = `----=_Mixed_${Date.now()}`;
    const altBoundary = `----=_Alt_${Date.now()}`;

    // Encode PDF HTML as base64 attachment
    const pdfBase64 = btoa(unescape(encodeURIComponent(pdfHtml)));

    const emailContent = [
      `From: CEB Building <${smtpUser}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: <${Date.now()}.${Math.random().toString(36).substring(2)}@cebbuilding.com>`,
      `Content-Type: multipart/mixed; boundary="${mixedBoundary}"`,
      ``,
      `--${mixedBoundary}`,
      `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
      ``,
      `--${altBoundary}`,
      `Content-Type: text/plain; charset=utf-8`,
      ``,
      `Payment received! Your receipt for Invoice ${invoiceNumber} is attached as a PDF.`,
      ``,
      `--${altBoundary}`,
      `Content-Type: text/html; charset=utf-8`,
      ``,
      emailHtml,
      ``,
      `--${altBoundary}--`,
      ``,
      `--${mixedBoundary}`,
      `Content-Type: text/html; charset=utf-8; name="Receipt-${invoiceNumber}.html"`,
      `Content-Disposition: attachment; filename="Receipt-${invoiceNumber}.html"`,
      `Content-Transfer-Encoding: base64`,
      ``,
      pdfBase64.match(/.{1,76}/g)?.join("\r\n") || pdfBase64,
      ``,
      `--${mixedBoundary}--`,
      `.`,
    ].join("\r\n");
    
    await conn.write(encoder.encode(emailContent + "\r\n"));
    const sendResponse = await read();
    
    if (!sendResponse.startsWith("250")) {
      throw new Error(`Message rejected after DATA: ${sendResponse}`);
    }

    await write(`QUIT`);
    try { await read(); } catch { /* ignore */ }

    console.log(`Receipt email sent successfully to ${to}`);
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
    const { client, invoiceNumber, items, paidAt, notes }: SendReceiptRequest = await req.json();

    const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const formattedTotal = total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Fetch logo for PDF
    const logoDataUrl = await fetchLogoBase64();

    // Generate receipt HTML (for PDF attachment)
    const receiptHtml = generateReceiptHtml(client, invoiceNumber, items, paidAt, notes, logoDataUrl);

    // Generate email body
    const emailHtml = generateEmailHtml(client.name, invoiceNumber, formattedTotal);

    // Send email with PDF attachment
    await sendReceiptEmail(
      client.email,
      `Payment Receipt - Invoice ${invoiceNumber} - CEB Building`,
      emailHtml,
      receiptHtml,
      invoiceNumber,
    );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending receipt:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
};

serve(handler);
