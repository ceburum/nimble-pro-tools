import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface QuoteData {
  projectId: string;
  projectTitle: string;
  clientName: string;
  clientEmail: string;
  total: number;
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

function getEmailHeader(title: string, isAccepted: boolean, logoSrc: string = DEFAULT_LOGO_URL): string {
  const barColor = isAccepted ? '#2d5016' : '#8b4513';
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
      <td style="background-color: ${barColor}; padding: 12px 24px;">
        <p style="color: #ffffff; margin: 0; font-size: 16px; font-weight: 600; letter-spacing: 1px;">${title}</p>
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
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const encodedData = url.searchParams.get("data");

    console.log("Quote response received:", { action, hasData: !!encodedData });

    if (!action || !encodedData) {
      console.error("Missing required parameters");
      return new Response(JSON.stringify({ error: "Missing required parameters" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let quoteData: QuoteData;
    try {
      quoteData = JSON.parse(atob(encodedData));
      console.log("Decoded quote data:", quoteData);
    } catch (decodeError) {
      console.error("Failed to decode quote data:", decodeError);
      return new Response(JSON.stringify({ error: "Could not decode quote data" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { projectId, projectTitle, clientName, clientEmail, total, notificationEmail } = quoteData;
    const isAccepted = action === "accept";

    // Embed logo inline (CID) so it displays even when external images are blocked
    const logoBase64 = await fetchLogoBase64(req);
    const logoSrc = logoBase64 ? "cid:ceb-logo" : DEFAULT_LOGO_URL;

    console.log(`Quote ${isAccepted ? "ACCEPTED" : "DECLINED"} for project ${projectId} by ${clientName}`);

    // Owner notification email
    const ownerEmailContent = `
      ${getEmailHeader(isAccepted ? '✓ QUOTE ACCEPTED' : '✗ QUOTE DECLINED', isAccepted, logoSrc)}
      
      <!-- Content -->
      <tr>
        <td class="content" style="padding: 32px 24px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="font-size: 48px; margin-bottom: 12px;">${isAccepted ? '🎉' : '📋'}</div>
            <h2 style="font-size: 20px; color: ${isAccepted ? '#2d5016' : '#8b4513'}; margin: 0;">
              ${isAccepted ? 'Great news! A quote has been accepted.' : 'A quote has been declined.'}
            </h2>
          </div>
          
          <!-- Project Details -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f8f7f5; border-radius: 8px; margin-bottom: 24px;">
            <tr>
              <td style="padding: 16px 20px; border-bottom: 1px solid #e8e6e1;">
                <p style="margin: 0; font-size: 14px; color: #666;"><strong>Project:</strong></p>
                <p style="margin: 4px 0 0 0; font-size: 16px; color: #333;">${projectTitle}</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 16px 20px; border-bottom: 1px solid #e8e6e1;">
                <p style="margin: 0; font-size: 14px; color: #666;"><strong>Client:</strong></p>
                <p style="margin: 4px 0 0 0; font-size: 16px; color: #333;">${clientName}</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 16px 20px; border-bottom: 1px solid #e8e6e1;">
                <p style="margin: 0; font-size: 14px; color: #666;"><strong>Email:</strong></p>
                <p style="margin: 4px 0 0 0; font-size: 16px; color: #333;">${clientEmail}</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 16px 20px;">
                <p style="margin: 0; font-size: 14px; color: #666;"><strong>Quote Total:</strong></p>
                <p style="margin: 4px 0 0 0; font-size: 20px; color: #2d5016; font-weight: 700;">$${total.toFixed(2)}</p>
              </td>
            </tr>
          </table>
          
          <p style="color: #666; font-size: 14px; text-align: center; margin: 0;">
            ${isAccepted 
              ? 'You can now proceed with the project!' 
              : 'You may want to follow up with the client.'}
          </p>
        </td>
      </tr>
      
      ${getEmailFooter()}
    `;

    // Client confirmation email
    const clientEmailContent = `
      ${getEmailHeader(isAccepted ? 'THANK YOU!' : 'RESPONSE RECEIVED', isAccepted, logoSrc)}
      
      <!-- Content -->
      <tr>
        <td class="content" style="padding: 32px 24px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 16px;">${isAccepted ? '✅' : '📋'}</div>
          <h2 style="font-size: 22px; color: ${isAccepted ? '#2d5016' : '#333'}; margin: 0 0 16px 0;">
            ${isAccepted ? 'Your Quote Has Been Accepted!' : 'Quote Response Received'}
          </h2>
          
          <p style="font-size: 15px; color: #666666; margin: 0 0 24px 0; line-height: 1.6;">
            ${isAccepted 
              ? `Thank you for accepting the quote for "${projectTitle}"! We will be in touch shortly to discuss next steps.`
              : `We've received your response regarding "${projectTitle}". If you have any questions or would like to discuss alternatives, please don't hesitate to reach out.`}
          </p>
          
          <div style="background: #f8f7f5; padding: 20px; border-radius: 8px; margin-bottom: 24px; display: inline-block;">
            <p style="margin: 0; font-size: 14px; color: #666;">Quote Total</p>
            <p style="margin: 8px 0 0 0; font-size: 28px; font-weight: 700; color: ${isAccepted ? '#2d5016' : '#333'};">$${total.toFixed(2)}</p>
          </div>
          
          <p style="color: #666; font-size: 14px; margin: 0;">
            We look forward to working with you!
          </p>
        </td>
      </tr>
      
      ${getEmailFooter()}
    `;

    try {
      // Send notification only to chad@cebbuilding.com
      await sendEmailViaZoho(
        'chad@cebbuilding.com',
        `${isAccepted ? '✓ Quote Accepted' : '✗ Quote Declined'}: ${projectTitle} - ${clientName}`,
        getEmailWrapper(ownerEmailContent),
        logoBase64,
      );
      console.log("Owner notification sent to chad@cebbuilding.com");

      await sendEmailViaZoho(
        clientEmail,
        isAccepted 
          ? `Thank you for accepting your quote - ${projectTitle}` 
          : `Quote Response Received - ${projectTitle}`,
        getEmailWrapper(clientEmailContent),
        logoBase64,
      );
      console.log("Client confirmation sent");

    } catch (emailError: any) {
      console.error("Failed to send email:", emailError);
    }

    // Return simple plain text response - no HTML page
    const message = isAccepted 
      ? `Thank you, ${clientName}! Your quote for "${projectTitle}" has been accepted. We will be in touch shortly to discuss scheduling.`
      : `Thank you for your response regarding "${projectTitle}". We appreciate you letting us know.`;

    return new Response(message, {
      status: 200,
      headers: { 
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error: any) {
    console.error("Error handling quote response:", error);
    return new Response("Something went wrong processing your response. Please contact us directly at chad@cebbuilding.com", {
      status: 500,
      headers: { 
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }
};

serve(handler);
