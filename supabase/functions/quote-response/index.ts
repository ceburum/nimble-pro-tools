import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface QuoteData {
  projectId: string;
  projectTitle: string;
  clientName: string;
  clientEmail: string;
  total: number;
  notificationEmail: string;
}

// Logo hosted on your website - most reliable method
const LOGO_URL = "https://static.wixstatic.com/media/fc62d0_d3f25abd45e341648b59e65fc94cc7fd~mv2.png";

function getEmailHeader(title: string, isAccepted: boolean): string {
  const barColor = isAccepted ? '#2d5016' : '#8b4513';
  return `
    <!-- Header - matching cebbuilding.com style -->
    <tr>
      <td style="background-color: #c8c4bd; padding: 20px 24px; border-bottom: 3px solid #a09d95;">
        <table role="presentation" class="header-table" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td class="header-left" style="vertical-align: middle; width: 60%;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align: middle;">
                    <img src="${LOGO_URL}" alt="CEB Building" style="width: 65px; height: 65px; border-radius: 50%; object-fit: contain; display: block; background: #fff;">
                  </td>
                  <td style="vertical-align: middle; padding-left: 14px;">
                    <h1 style="color: #333333; margin: 0; font-size: 22px; font-weight: 400; font-family: Georgia, serif;">CEB Building</h1>
                    <p style="color: #555555; margin: 2px 0 0 0; font-size: 13px; font-style: italic;">Hand-Crafted Wood Works</p>
                  </td>
                </tr>
              </table>
            </td>
            <td class="header-right" style="vertical-align: middle; text-align: right; width: 40%;">
              <p style="color: #333333; margin: 0; font-size: 13px; font-weight: 600;">Chad Burum</p>
              <p style="color: #555555; margin: 2px 0; font-size: 12px;">405-500-8224</p>
              <p style="color: #555555; margin: 2px 0; font-size: 12px;">chad@cebbuilding.com</p>
              <p style="color: #555555; margin: 2px 0; font-size: 12px;">cebbuilding.com</p>
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

async function sendEmailViaZoho(to: string, subject: string, html: string): Promise<void> {
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
    
    const boundary = `----=_Part_${Date.now()}`;
    const emailContent = [
      `From: CEB Building <${smtpUser}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/plain; charset=utf-8`,
      ``,
      `Please view this email in an HTML-compatible email client.`,
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=utf-8`,
      ``,
      html,
      ``,
      `--${boundary}--`,
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

    console.log(`Quote ${isAccepted ? "ACCEPTED" : "DECLINED"} for project ${projectId} by ${clientName}`);

    // Owner notification email
    const ownerEmailContent = `
      ${getEmailHeader(isAccepted ? '✓ QUOTE ACCEPTED' : '✗ QUOTE DECLINED', isAccepted)}
      
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
      ${getEmailHeader(isAccepted ? 'THANK YOU!' : 'RESPONSE RECEIVED', isAccepted)}
      
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
      await sendEmailViaZoho(
        notificationEmail,
        `${isAccepted ? '✓ Quote Accepted' : '✗ Quote Declined'}: ${projectTitle} - ${clientName}`,
        getEmailWrapper(ownerEmailContent)
      );
      console.log("Owner notification sent");

      await sendEmailViaZoho(
        clientEmail,
        isAccepted 
          ? `Thank you for accepting your quote - ${projectTitle}` 
          : `Quote Response Received - ${projectTitle}`,
        getEmailWrapper(clientEmailContent)
      );
      console.log("Client confirmation sent");

    } catch (emailError: any) {
      console.error("Failed to send email:", emailError);
    }

    // Return HTML confirmation page
    const confirmationHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${isAccepted ? 'Quote Accepted' : 'Quote Declined'} - CEB Building</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: #f5f5f0;
          }
          .card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            max-width: 450px;
            width: 100%;
            overflow: hidden;
          }
          .header {
            background: #c8c4bd;
            padding: 24px;
            text-align: center;
            border-bottom: 3px solid #a09d95;
          }
          .logo {
            width: 70px;
            height: 70px;
            border-radius: 50%;
            margin: 0 auto 12px;
            background: white;
          }
          .brand {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: 24px;
            color: #333;
            margin-bottom: 4px;
          }
          .tagline {
            font-size: 13px;
            color: #555;
            font-style: italic;
          }
          .status-bar {
            background: ${isAccepted ? '#2d5016' : '#8b4513'};
            color: white;
            padding: 12px 24px;
            font-size: 14px;
            font-weight: 600;
            letter-spacing: 1px;
          }
          .content {
            padding: 40px 32px;
            text-align: center;
          }
          .icon {
            font-size: 56px;
            margin-bottom: 20px;
          }
          h1 {
            font-family: 'Playfair Display', Georgia, serif;
            color: ${isAccepted ? '#2d5016' : '#8b4513'};
            font-size: 26px;
            font-weight: 600;
            margin-bottom: 16px;
          }
          .message {
            color: #666;
            font-size: 15px;
            line-height: 1.7;
            margin-bottom: 28px;
          }
          .project-info {
            background: #f8f7f5;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 28px;
          }
          .project-title {
            font-weight: 600;
            color: #333;
            font-size: 16px;
            margin-bottom: 8px;
          }
          .project-total {
            font-size: 28px;
            font-weight: 700;
            color: ${isAccepted ? '#2d5016' : '#333'};
          }
          .footer {
            background: #4a4a4a;
            padding: 20px;
            text-align: center;
          }
          .footer p {
            color: #b0b0b0;
            font-size: 12px;
            margin-bottom: 4px;
          }
          .footer .thanks {
            color: white;
            font-size: 14px;
            margin-bottom: 8px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <img src="${LOGO_URL}" alt="CEB Building" class="logo">
            <div class="brand">CEB Building</div>
            <div class="tagline">Hand-Crafted Wood Works</div>
          </div>
          <div class="status-bar">${isAccepted ? '✓ QUOTE ACCEPTED' : '✗ QUOTE DECLINED'}</div>
          <div class="content">
            <div class="icon">${isAccepted ? '🎉' : '📋'}</div>
            <h1>${isAccepted ? 'Thank You!' : 'Response Received'}</h1>
            <p class="message">
              ${isAccepted 
                ? 'We\'ve received your acceptance and will be in touch shortly to discuss next steps for your project.'
                : 'We\'ve received your response. If you have any questions or would like to discuss alternatives, please don\'t hesitate to reach out.'}
            </p>
            <div class="project-info">
              <div class="project-title">${projectTitle}</div>
              <div class="project-total">$${total.toFixed(2)}</div>
            </div>
            <p style="color: #999; font-size: 13px;">Thank you, ${clientName}!</p>
          </div>
          <div class="footer">
            <p class="thanks">Thank you for choosing CEB Building!</p>
            <p>Hand-Crafted Wood Works · Oklahoma City</p>
            <p style="margin-top: 8px;">© ${new Date().getFullYear()} CEB Building</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return new Response(confirmationHtml, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error: any) {
    console.error("Error handling quote response:", error);
    const errorHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Error - CEB Building</title>
        <style>
          body { font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f5f5f0; }
          .card { background: white; padding: 40px; border-radius: 12px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.1); max-width: 400px; }
          h1 { color: #8b4513; margin-bottom: 12px; font-size: 24px; }
          p { color: #666; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Something went wrong</h1>
          <p>We couldn't process your response. Please contact us directly at chad@cebbuilding.com or call 405-500-8224.</p>
        </div>
      </body>
      </html>
    `;
    return new Response(errorHtml, {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
};

serve(handler);
