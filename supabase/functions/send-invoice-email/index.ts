import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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
  items: InvoiceItem[];
  dueDate: string;
  notes?: string;
  businessName?: string;
  businessEmail?: string;
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      clientName,
      clientEmail,
      invoiceNumber,
      items,
      dueDate,
      notes,
      businessName = "CEB Building",
    }: SendInvoiceRequest = await req.json();

    console.log(`Sending invoice ${invoiceNumber} to ${clientEmail}`);

    const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const formattedTotal = total.toLocaleString('en-US', { minimumFractionDigits: 2 });

    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.description}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$${item.unitPrice.toFixed(2)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$${(item.quantity * item.unitPrice).toFixed(2)}</td>
      </tr>
    `).join('');

    const paymentButtonsHtml = PAYMENT_METHODS.map(method => `
      <a href="${method.link}" target="_blank" style="display: inline-block; padding: 12px 24px; margin: 5px; background-color: ${method.color}; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
        Pay with ${method.name}
      </a>
    `).join('');

    // Logo hosted in public folder of the deployed app
    const logoUrl = 'https://ceb-contractor.lovable.app/ceb-logo.png';

    const emailHtml = `
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
            .container { width: 100% !important; padding: 16px !important; }
            .header { padding: 24px 16px !important; }
            .content { padding: 24px 16px !important; }
            .logo { width: 80px !important; height: 80px !important; }
          }
        </style>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; margin: 0; padding: 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6;">
          <tr>
            <td align="center" style="padding: 20px;">
              <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header with Logo and Contact Info -->
                <tr>
                  <td class="header" style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 24px 32px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align: middle; width: 80px;">
                          <img src="${logoUrl}" alt="CEB Building" style="width: 70px; height: 70px; border-radius: 8px; background: white; object-fit: contain;">
                        </td>
                        <td style="vertical-align: middle; padding-left: 16px;">
                          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">${businessName}</h1>
                          <p style="color: rgba(255,255,255,0.9); margin: 4px 0 0 0; font-size: 14px;">Invoice ${invoiceNumber}</p>
                        </td>
                        <td style="vertical-align: middle; text-align: right;">
                          <p style="color: white; margin: 0; font-size: 13px; font-weight: 600;">Chad Burum</p>
                          <p style="color: rgba(255,255,255,0.85); margin: 2px 0; font-size: 12px;">📞 405-500-8224</p>
                          <p style="color: rgba(255,255,255,0.85); margin: 2px 0; font-size: 12px;">✉️ chad@cebbuilding.com</p>
                          <p style="color: rgba(255,255,255,0.85); margin: 2px 0; font-size: 12px;">🌐 cebbuilding.com</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td class="content" style="padding: 32px;">
                    <p style="font-size: 16px; margin: 0 0 24px 0;">Hello <strong>${clientName}</strong>,</p>
                    <p style="font-size: 15px; color: #4b5563; margin: 0 0 24px 0;">Please find your invoice details below:</p>
                    
                    <!-- Invoice Items Table -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                      <thead>
                        <tr style="background: #f9fafb;">
                          <th style="padding: 14px 16px; text-align: left; font-size: 13px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e5e7eb;">Description</th>
                          <th style="padding: 14px 12px; text-align: center; font-size: 13px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e5e7eb;">Qty</th>
                          <th style="padding: 14px 12px; text-align: right; font-size: 13px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e5e7eb;">Price</th>
                          <th style="padding: 14px 16px; text-align: right; font-size: 13px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e5e7eb;">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsHtml}
                      </tbody>
                      <tfoot>
                        <tr style="background: #f0fdf4;">
                          <td colspan="3" style="padding: 16px; text-align: right; font-weight: 700; font-size: 16px; color: #1f2937;">Total:</td>
                          <td style="padding: 16px; text-align: right; font-weight: 700; font-size: 20px; color: #059669;">$${formattedTotal}</td>
                        </tr>
                      </tfoot>
                    </table>
                    
                    <!-- Due Date -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #fef3c7; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 12px 16px;">
                          <p style="margin: 0; font-size: 14px; color: #92400e;"><strong>📅 Due Date:</strong> ${dueDate}</p>
                          ${notes ? `<p style="margin: 8px 0 0 0; font-size: 14px; color: #92400e;"><strong>📝 Notes:</strong> ${notes}</p>` : ''}
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Payment Options -->
                    <div style="text-align: center; margin-bottom: 24px;">
                      <p style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #1f2937;">💳 Payment Options</p>
                      <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                        <tr>
                          ${PAYMENT_METHODS.map(method => `
                            <td style="padding: 6px;">
                              <a href="${method.link}" target="_blank" style="display: inline-block; padding: 14px 28px; background-color: ${method.color}; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
                                Pay with ${method.name}
                              </a>
                            </td>
                          `).join('')}
                        </tr>
                      </table>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0;">
                      Thank you for your business!
                    </p>
                    <p style="color: #9ca3af; font-size: 13px; margin: 0;">
                      If you have any questions, please don't hesitate to reach out.
                    </p>
                    <p style="color: #9ca3af; font-size: 12px; margin: 16px 0 0 0;">
                      © ${new Date().getFullYear()} ${businessName}. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await sendEmailViaZoho(
      clientEmail,
      `Invoice ${invoiceNumber} from ${businessName}`,
      emailHtml
    );

    console.log("Invoice email sent successfully via Zoho SMTP");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending invoice email:", error);
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
