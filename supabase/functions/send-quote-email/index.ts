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

async function sendEmailViaZoho(to: string, subject: string, html: string): Promise<void> {
  const smtpUser = Deno.env.get("ZOHO_SMTP_USER");
  const smtpPassword = Deno.env.get("ZOHO_SMTP_PASSWORD");

  if (!smtpUser || !smtpPassword) {
    throw new Error("Zoho SMTP credentials not configured");
  }

  // Use raw SMTP via TCP socket - much lighter than denomailer
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
    // Read greeting
    await read();
    
    // EHLO
    await write(`EHLO smtp.zoho.com`);
    await read();
    
    // AUTH LOGIN
    await write(`AUTH LOGIN`);
    await read();
    
    // Username (base64)
    await write(btoa(smtpUser));
    await read();
    
    // Password (base64)
    await write(btoa(smtpPassword));
    await read();
    
    // MAIL FROM
    await write(`MAIL FROM:<${smtpUser}>`);
    await read();
    
    // RCPT TO
    await write(`RCPT TO:<${to}>`);
    await read();
    
    // DATA
    await write(`DATA`);
    await read();
    
    // Email content
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
    
    // QUIT
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

    // Build items table
    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.description}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$${item.unitPrice.toFixed(2)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$${(item.quantity * item.unitPrice).toFixed(2)}</td>
      </tr>
    `).join('');

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

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">CEB Building</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Quote for ${projectTitle}</p>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #eee; border-top: none;">
          <p style="font-size: 16px;">Hello ${clientName},</p>
          <p>Thank you for your interest! Please review the quote below for your project:</p>
          
          ${projectDescription ? `
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; font-style: italic; color: #666;">${projectDescription}</p>
            </div>
          ` : ''}
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Description</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Qty</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Price</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 15px 12px; text-align: right; font-weight: bold; font-size: 18px;">Total:</td>
                <td style="padding: 15px 12px; text-align: right; font-weight: bold; font-size: 18px; color: #f59e0b;">$${formattedTotal}</td>
              </tr>
            </tfoot>
          </table>
          
          ${notes ? `
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Notes:</strong> ${notes}</p>
            </div>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="font-size: 18px; font-weight: 600; margin-bottom: 20px;">Would you like to proceed?</p>
            <a href="${acceptUrl}" target="_blank" style="display: inline-block; padding: 15px 40px; margin: 5px; background-color: #22c55e; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              ✓ Accept Quote
            </a>
            <a href="${declineUrl}" target="_blank" style="display: inline-block; padding: 15px 40px; margin: 5px; background-color: #ef4444; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              ✗ Decline
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #666; font-size: 14px; text-align: center;">
            If you have any questions about this quote, please don't hesitate to reach out.<br>
            We look forward to working with you!
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
          <p>© ${new Date().getFullYear()} CEB Building. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    await sendEmailViaZoho(
      clientEmail,
      `Quote for ${projectTitle} - CEB Building`,
      emailHtml
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
