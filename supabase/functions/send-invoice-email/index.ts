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
  diagnosticMode?: boolean; // NEW: capture full SMTP trace
  plainTextOnly?: boolean;  // NEW: skip HTML/logo for deliverability test
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

interface SmtpDiagnostics {
  smtpResponses: string[];
  messageSize: number;
  timestamp: string;
  recipient: string;
  subject: string;
}

// Simplified email sender - no logo attachment
async function sendEmailViaZoho(
  to: string,
  subject: string,
  html: string,
  diagnosticMode: boolean = false,
): Promise<SmtpDiagnostics> {
  const smtpUser = Deno.env.get("ZOHO_SMTP_USER");
  const smtpPassword = Deno.env.get("ZOHO_SMTP_PASSWORD");

  if (!smtpUser || !smtpPassword) {
    throw new Error("Zoho SMTP credentials not configured");
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const smtpResponses: string[] = [];

  const conn = await Deno.connectTls({
    hostname: "smtp.zoho.com",
    port: 465,
  });

  // Read SMTP response, handling multi-line responses (lines ending with 250- continue, 250 space ends)
  const read = async (): Promise<string> => {
    let fullResponse = "";
    const buf = new Uint8Array(4096);
    
    while (true) {
      const n = await conn.read(buf);
      if (!n) break;
      fullResponse += decoder.decode(buf.subarray(0, n));
      
      // Check if we've received the final line (code followed by space, not hyphen)
      const lines = fullResponse.trim().split("\r\n");
      const lastLine = lines[lines.length - 1];
      // Final line pattern: 3 digits followed by space (e.g., "250 OK" not "250-...")
      if (/^\d{3} /.test(lastLine) || /^\d{3}$/.test(lastLine)) {
        break;
      }
    }
    
    const response = fullResponse.trim();
    if (diagnosticMode) {
      smtpResponses.push(`S: ${response}`);
    }
    console.log(`SMTP RESPONSE: ${response}`);
    return response;
  };

  const write = async (data: string, logAs?: string): Promise<void> => {
    await conn.write(encoder.encode(data + "\r\n"));
    if (diagnosticMode) {
      smtpResponses.push(`C: ${logAs || data}`);
    }
    console.log(`SMTP SENT: ${logAs || data}`);
  };

  let messageSize = 0;

  try {
    await read(); // greeting
    await write(`EHLO smtp.zoho.com`);
    await read(); // EHLO response (may be multi-line, but we just need to consume it)
    
    await write(`AUTH LOGIN`);
    await read(); // 334 VXNlcm5hbWU6 (Username:)
    
    await write(btoa(smtpUser), "[BASE64_USER]");
    await read(); // 334 UGFzc3dvcmQ6 (Password:)
    
    await write(btoa(smtpPassword), "[BASE64_PASS]");
    const authResponse = await read(); // Should be 235 on success
    
    // Only fail on explicit error codes (4xx, 5xx)
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

    const altBoundary = `----=_Alt_${Date.now()}`;

    const headers = [
      `From: CEB Building <${smtpUser}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: <${Date.now()}.${Math.random().toString(36).substring(2)}@cebbuilding.com>`,
    ];

    // Simple HTML email without logo attachment
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

    messageSize = encoder.encode(emailContent).length;
    
    await conn.write(encoder.encode(emailContent + "\r\n"));
    const sendResponse = await read();
    
    // Check if message was accepted (should start with 250)
    if (!sendResponse.startsWith("250")) {
      throw new Error(`Message rejected after DATA: ${sendResponse}`);
    }

    await write(`QUIT`);
    try { await read(); } catch { /* ignore quit response */ }

    console.log(`Email sent successfully to ${to}`);
    
    return {
      smtpResponses,
      messageSize,
      timestamp: new Date().toISOString(),
      recipient: to,
      subject,
    };
  } finally {
    conn.close();
  }
}

// Plain text email for deliverability testing
async function sendPlainTextEmail(
  to: string,
  subject: string,
  body: string,
): Promise<SmtpDiagnostics> {
  const smtpUser = Deno.env.get("ZOHO_SMTP_USER");
  const smtpPassword = Deno.env.get("ZOHO_SMTP_PASSWORD");

  if (!smtpUser || !smtpPassword) {
    throw new Error("Zoho SMTP credentials not configured");
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const smtpResponses: string[] = [];

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
    
    const response = fullResponse.trim();
    smtpResponses.push(`S: ${response}`);
    console.log(`SMTP RESPONSE: ${response}`);
    return response;
  };

  const write = async (data: string, logAs?: string): Promise<void> => {
    await conn.write(encoder.encode(data + "\r\n"));
    smtpResponses.push(`C: ${logAs || data}`);
    console.log(`SMTP SENT: ${logAs || data}`);
  };

  try {
    await read(); // greeting
    await write(`EHLO smtp.zoho.com`);
    await read(); // EHLO response
    
    await write(`AUTH LOGIN`);
    await read(); // 334 Username:
    
    await write(btoa(smtpUser), "[BASE64_USER]");
    await read(); // 334 Password:
    
    await write(btoa(smtpPassword), "[BASE64_PASS]");
    const authResponse = await read();
    
    // Only fail on explicit error codes
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

    const messageSize = encoder.encode(emailContent).length;
    
    await conn.write(encoder.encode(emailContent + "\r\n"));
    const sendResponse = await read();
    
    if (!sendResponse.startsWith("250")) {
      throw new Error(`Message rejected after DATA: ${sendResponse}`);
    }

    await write(`QUIT`);
    try { await read(); } catch { /* ignore */ }

    console.log(`Plain text email sent successfully to ${to}`);
    
    return {
      smtpResponses,
      messageSize,
      timestamp: new Date().toISOString(),
      recipient: to,
      subject,
    };
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
      diagnosticMode = false,
      plainTextOnly = false,
    }: SendInvoiceRequest = await req.json();

    console.log(`Sending invoice ${invoiceNumber} to ${clientEmail} (diagnostic: ${diagnosticMode}, plainText: ${plainTextOnly})`);

    const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const formattedTotal = total.toLocaleString('en-US', { minimumFractionDigits: 2 });

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

      const diagnostics = await sendPlainTextEmail(
        clientEmail,
        `Invoice ${invoiceNumber} from ${businessName}`,
        plainBody,
      );

      console.log("Plain text invoice email sent successfully");

      return new Response(JSON.stringify({ 
        success: true, 
        mode: "plainText",
        diagnostics: diagnosticMode ? diagnostics : undefined,
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
          </div>
        </td>
      </tr>
      
      ${getEmailFooter()}
    `;

    const emailHtml = getEmailWrapper(emailContent);

    const diagnostics = await sendEmailViaZoho(
      clientEmail,
      `Invoice ${invoiceNumber} from ${businessName}`,
      emailHtml,
      diagnosticMode,
    );

    console.log("Invoice email sent successfully via Zoho SMTP");

    return new Response(JSON.stringify({ 
      success: true,
      mode: "html",
      diagnostics: diagnosticMode ? diagnostics : undefined,
    }), {
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
