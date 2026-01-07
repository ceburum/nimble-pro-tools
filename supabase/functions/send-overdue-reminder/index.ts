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
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .amount { font-size: 32px; font-weight: bold; color: #dc2626; text-align: center; margin: 20px 0; }
            .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Payment Reminder</h1>
            </div>
            <div class="content">
              <p>Dear ${clientName},</p>
              <p>This is a friendly reminder that your invoice is <strong>${calculatedDaysOverdue} days past due</strong>.</p>
              
              <div class="amount">${formattedAmount}</div>
              
              <div class="details">
                <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
                <p><strong>Due Date:</strong> ${formattedDueDate}</p>
                <p><strong>Days Overdue:</strong> ${calculatedDaysOverdue}</p>
              </div>
              
              <p>Please arrange payment at your earliest convenience to avoid any late fees.</p>
              
              <p style="text-align: center; margin-top: 30px;">
                <a href="https://venmo.com/Chad-Burum-1?txn=pay&amount=${amount}" class="btn">Pay with Venmo</a>
              </p>
              
              <p>If you have already made this payment, please disregard this notice.</p>
              
              <p>Thank you for your prompt attention to this matter.</p>
              
              <p>Best regards,<br>Chad Burum<br>CEB Building</p>
            </div>
            <div class="footer">
              <p>CEB Building | chad@cebbuilding.com</p>
            </div>
          </div>
        </body>
        </html>
      `;

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
