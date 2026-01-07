import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReminderRequest {
  invoiceId: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  amount: number;
  dueDate: string;
  method: 'email' | 'text';
  daysOverdue?: number;
}

// Logo hosted on your website - most reliable method
const LOGO_URL = "https://static.wixstatic.com/media/fc62d0_d3f25abd45e341648b59e65fc94cc7fd~mv2.png";

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

function getEmailHeader(title: string, subtitle?: string): string {
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

    <!-- Title Bar - red for overdue -->
    <tr>
      <td style="background-color: #8b4513; padding: 12px 24px;">
        <p style="color: #ffffff; margin: 0; font-size: 16px; font-weight: 600; letter-spacing: 1px;">${title}</p>
        ${subtitle ? `<p style="color: #f0d0b0; margin: 4px 0 0 0; font-size: 13px;">${subtitle}</p>` : ''}
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: ReminderRequest = await req.json();
    const { invoiceNumber, clientName, clientEmail, amount, dueDate, method, daysOverdue } = data;

    const formattedAmount = amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    const formattedDueDate = new Date(dueDate).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const now = new Date();
    const dueDateObj = new Date(dueDate);
    const calculatedDaysOverdue = daysOverdue ?? Math.floor((now.getTime() - dueDateObj.getTime()) / (1000 * 60 * 60 * 24));

    if (method === 'email') {
      const emailContent = `
        ${getEmailHeader('⚠️ PAYMENT REMINDER', `Invoice ${invoiceNumber} is ${calculatedDaysOverdue} days overdue`)}
        
        <!-- Content -->
        <tr>
          <td class="content" style="padding: 32px 24px;">
            <p style="font-size: 16px; margin: 0 0 20px 0; color: #333;">Dear <strong>${clientName}</strong>,</p>
            <p style="font-size: 15px; color: #666666; margin: 0 0 24px 0;">This is a friendly reminder that your invoice is <strong style="color: #8b4513;">${calculatedDaysOverdue} days past due</strong>.</p>
            
            <!-- Amount Due -->
            <div style="text-align: center; padding: 24px; background: #faf9f7; border-radius: 8px; margin-bottom: 24px;">
              <p style="font-size: 14px; color: #666; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Amount Due</p>
              <p style="font-size: 36px; font-weight: 700; color: #8b4513; margin: 0;">${formattedAmount}</p>
            </div>
            
            <!-- Invoice Details -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f8f7f5; border-radius: 8px; margin-bottom: 24px;">
              <tr>
                <td style="padding: 16px 20px; border-bottom: 1px solid #e8e6e1;">
                  <p style="margin: 0; font-size: 14px; color: #666;"><strong>Invoice Number:</strong></p>
                  <p style="margin: 4px 0 0 0; font-size: 16px; color: #333;">${invoiceNumber}</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 16px 20px; border-bottom: 1px solid #e8e6e1;">
                  <p style="margin: 0; font-size: 14px; color: #666;"><strong>Due Date:</strong></p>
                  <p style="margin: 4px 0 0 0; font-size: 16px; color: #333;">${formattedDueDate}</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 16px 20px;">
                  <p style="margin: 0; font-size: 14px; color: #666;"><strong>Days Overdue:</strong></p>
                  <p style="margin: 4px 0 0 0; font-size: 16px; color: #8b4513; font-weight: 600;">${calculatedDaysOverdue} days</p>
                </td>
              </tr>
            </table>
            
            <p style="font-size: 15px; color: #666666; margin: 0 0 24px 0;">Please arrange payment at your earliest convenience.</p>
            
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
            </div>
            
            <p style="color: #666; font-size: 14px; text-align: center; margin: 20px 0 0 0;">
              If you have already made this payment, please disregard this notice.
            </p>
          </td>
        </tr>
        
        ${getEmailFooter()}
      `;

      const emailHtml = getEmailWrapper(emailContent);

      await sendEmailViaZoho(
        clientEmail,
        `⚠️ Payment Reminder: Invoice ${invoiceNumber} is ${calculatedDaysOverdue} days overdue`,
        emailHtml
      );

      return new Response(
        JSON.stringify({ success: true, method: 'email' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      console.log(`SMS reminder would be sent to ${data.clientPhone} for invoice ${invoiceNumber}`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          method: 'text',
          message: `Text reminder for ${invoiceNumber} - SMS integration pending. Client phone: ${data.clientPhone}`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: unknown) {
    console.error("Error in send-overdue-reminder:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
