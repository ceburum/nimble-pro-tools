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

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">${businessName}</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Invoice ${invoiceNumber}</p>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #eee; border-top: none;">
          <p style="font-size: 16px;">Hello ${clientName},</p>
          <p>Please find your invoice details below:</p>
          
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
                <td style="padding: 15px 12px; text-align: right; font-weight: bold; font-size: 18px; color: #667eea;">$${formattedTotal}</td>
              </tr>
            </tfoot>
          </table>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Due Date:</strong> ${dueDate}</p>
            ${notes ? `<p style="margin: 10px 0 0 0;"><strong>Notes:</strong> ${notes}</p>` : ''}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="font-size: 18px; font-weight: 600; margin-bottom: 15px;">Payment Options</p>
            ${paymentButtonsHtml}
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #666; font-size: 14px; text-align: center;">
            Thank you for your business!<br>
            If you have any questions, please don't hesitate to reach out.
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
          <p>© ${new Date().getFullYear()} ${businessName}. All rights reserved.</p>
        </div>
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
