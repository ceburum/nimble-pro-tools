import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

// Logo hosted on your website - used as a source to embed inline (CID)
const LOGO_URL = "https://static.wixstatic.com/media/fc62d0_d3f25abd45e341648b59e65fc94cc7fd~mv2.png";
const STORAGE_LOGO_PUBLIC_URL = (() => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  return supabaseUrl ? `${supabaseUrl}/storage/v1/object/public/assets/ceb-logo.png` : null;
})();
const DEFAULT_LOGO_URL = STORAGE_LOGO_PUBLIC_URL ?? LOGO_URL;

function wrapBase64(b64: string): string {
  return b64.match(/.{1,76}/g)?.join("\r\n") ?? b64;
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function getLogoCandidateUrls(req?: Request): string[] {
  const urls: string[] = [];
  if (STORAGE_LOGO_PUBLIC_URL) urls.push(STORAGE_LOGO_PUBLIC_URL);

  const origin = req?.headers.get("origin");
  if (origin) urls.push(`${origin}/ceb-logo.png`);

  urls.push(LOGO_URL);
  return urls.filter((u, idx) => urls.indexOf(u) === idx);
}

async function fetchLogoBase64(req?: Request): Promise<string | null> {
  for (const url of getLogoCandidateUrls(req)) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (!res.ok) {
        console.error("Logo fetch failed:", res.status, res.statusText, "url:", url);
        continue;
      }

      const bytes = new Uint8Array(await res.arrayBuffer());
      console.log("Logo fetched OK from:", url, "bytes:", bytes.byteLength);
      return uint8ToBase64(bytes);
    } catch (err) {
      console.error("Logo fetch threw:", err, "url:", url);
    }
  }

  return null;
}

function getEmailHeader(title: string, subtitle?: string, logoSrc: string = DEFAULT_LOGO_URL): string {
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
                    <a href="https://cebbuilding.com" target="_blank" style="text-decoration: none;">
                      <img src="${logoSrc}" alt="CEB Building" style="width: 65px; height: 65px; border-radius: 50%; object-fit: contain; display: block; background: #fff; border: 0;">
                    </a>
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

async function sendEmailViaZoho(
  to: string,
  subject: string,
  html: string,
  inlineLogoBase64?: string | null,
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

    const rootBoundary = `----=_Root_${Date.now()}`;
    const altBoundary = `----=_Alt_${Date.now()}`;

    const headers = [
      `From: CEB Building <${smtpUser}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
    ];

    const emailContent = inlineLogoBase64
      ? [
          ...headers,
          `Content-Type: multipart/related; boundary="${rootBoundary}"`,
          ``,
          `--${rootBoundary}`,
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
          ``,
          `--${rootBoundary}`,
          `Content-Type: image/png; name="ceb-logo.png"`,
          `Content-Transfer-Encoding: base64`,
          `Content-ID: <ceb-logo>`,
          `Content-Disposition: inline; filename="ceb-logo.png"`,
          ``,
          wrapBase64(inlineLogoBase64),
          ``,
          `--${rootBoundary}--`,
          `.`,
        ].join("\r\n")
      : [
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

  try {
    const {
      projectId,
      projectTitle,
      projectDescription,
      clientName,
      clientEmail,
      items,
      notes,
      notificationEmail,
    }: SendQuoteRequest = await req.json();

    console.log(`Sending quote for project ${projectId} to ${clientEmail}`);

    const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const formattedTotal = total.toLocaleString('en-US', { minimumFractionDigits: 2 });

    // Embed logo inline (CID) so it displays even when external images are blocked
    const logoBase64 = await fetchLogoBase64(req);
    const logoSrc = logoBase64 ? "cid:ceb-logo" : DEFAULT_LOGO_URL;

    // Generate response URLs
    const baseUrl = Deno.env.get("SUPABASE_URL") || "";
    const encodedData = btoa(JSON.stringify({
      projectId,
      projectTitle,
      clientName,
      clientEmail,
      total,
      notificationEmail,
    }));
    
    const acceptUrl = `${baseUrl}/functions/v1/quote-response?action=accept&data=${encodedData}`;
    const declineUrl = `${baseUrl}/functions/v1/quote-response?action=decline&data=${encodedData}`;

    const emailContent = `
      ${getEmailHeader('PROJECT QUOTE', projectTitle, logoSrc)}
      
      <!-- Content -->
      <tr>
        <td class="content" style="padding: 32px 24px;">
          <p style="font-size: 16px; margin: 0 0 20px 0; color: #333;">Hello <strong>${clientName}</strong>,</p>
          <p style="font-size: 15px; color: #666666; margin: 0 0 24px 0;">Thank you for your interest! Please review the quote below for your project:</p>
          
          ${projectDescription ? `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #faf9f7; border-left: 4px solid #c8a45c; margin-bottom: 24px;">
              <tr>
                <td style="padding: 16px 20px;">
                  <p style="margin: 0; font-size: 14px; font-style: italic; color: #666;">${projectDescription}</p>
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
                  <td style="padding: 14px 16px; color: #333;">${item.description}</td>
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
                  <p style="margin: 0; font-size: 14px; color: #666;"><strong>Notes:</strong> ${notes}</p>
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
      logoBase64,
    );

    console.log("Quote email sent successfully via Zoho SMTP");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending quote email:", error);
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
