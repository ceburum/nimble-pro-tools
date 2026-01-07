import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface QuoteData {
  projectId: string;
  projectTitle: string;
  clientName: string;
  clientEmail: string;
  total: number;
  notificationEmail: string;
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

    const notificationHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; color: #333;">
        <div style="max-width: 500px; margin: 0 auto; background: ${isAccepted ? '#f0fdf4' : '#fef2f2'}; border: 2px solid ${isAccepted ? '#22c55e' : '#ef4444'}; border-radius: 10px; padding: 30px;">
          <h1 style="color: ${isAccepted ? '#22c55e' : '#ef4444'}; margin: 0 0 20px 0; font-size: 24px;">
            ${isAccepted ? '✓ Quote Accepted!' : '✗ Quote Declined'}
          </h1>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0 0 10px 0;"><strong>Project:</strong> ${projectTitle}</p>
            <p style="margin: 0 0 10px 0;"><strong>Client:</strong> ${clientName}</p>
            <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${clientEmail}</p>
            <p style="margin: 0;"><strong>Quote Total:</strong> $${total.toFixed(2)}</p>
          </div>
          
          <p style="color: #666; font-size: 14px; margin: 0;">
            ${isAccepted 
              ? 'The client has accepted your quote. You can now proceed with the project!' 
              : 'The client has declined your quote. You may want to follow up with them.'}
          </p>
        </div>
      </body>
      </html>
    `;

    const clientConfirmationHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; color: #333;">
        <div style="max-width: 500px; margin: 0 auto; background: ${isAccepted ? '#f0fdf4' : '#fef2f2'}; border: 2px solid ${isAccepted ? '#22c55e' : '#ef4444'}; border-radius: 10px; padding: 30px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 20px;">
            ${isAccepted ? '✅' : '📋'}
          </div>
          <h1 style="color: ${isAccepted ? '#22c55e' : '#ef4444'}; margin: 0 0 20px 0; font-size: 24px;">
            ${isAccepted ? 'Thank You!' : 'Quote Declined'}
          </h1>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            ${isAccepted 
              ? `Thank you for accepting the quote for "${projectTitle}"! We will be in touch shortly to discuss next steps.`
              : `We're sorry to hear you've decided not to proceed with "${projectTitle}". If you have any questions or would like to discuss alternatives, please don't hesitate to reach out.`}
          </p>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0;"><strong>Quote Total:</strong> $${total.toFixed(2)}</p>
          </div>
          
          <p style="color: #999; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} CEB Building
          </p>
        </div>
      </body>
      </html>
    `;

    try {
      await sendEmailViaZoho(
        notificationEmail,
        `${isAccepted ? '✓ Quote Accepted' : '✗ Quote Declined'}: ${projectTitle} - ${clientName}`,
        notificationHtml
      );
      console.log("Owner notification sent");

      await sendEmailViaZoho(
        clientEmail,
        isAccepted 
          ? `Thank you for accepting your quote - ${projectTitle}` 
          : `Quote Response Received - ${projectTitle}`,
        clientConfirmationHtml
      );
      console.log("Client confirmation sent");

    } catch (emailError: any) {
      console.error("Failed to send email:", emailError);
    }

    const confirmationHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${isAccepted ? 'Quote Accepted' : 'Quote Declined'} - CEB Building</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: linear-gradient(135deg, ${isAccepted ? '#f0fdf4 0%, #dcfce7 100%' : '#fef2f2 0%, #fee2e2 100%'});
          }
          .card {
            background: white;
            border-radius: 20px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
            max-width: 450px;
            width: 100%;
            padding: 48px 40px;
            text-align: center;
            animation: slideUp 0.5s ease-out;
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .icon {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            font-size: 40px;
            background: ${isAccepted ? '#dcfce7' : '#fee2e2'};
          }
          h1 {
            color: ${isAccepted ? '#16a34a' : '#dc2626'};
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 12px;
          }
          .subtitle {
            color: #6b7280;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 32px;
          }
          .project-info {
            background: #f9fafb;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 32px;
          }
          .project-title {
            font-weight: 600;
            color: #374151;
            font-size: 18px;
            margin-bottom: 8px;
          }
          .project-total {
            font-size: 24px;
            font-weight: 700;
            color: ${isAccepted ? '#16a34a' : '#374151'};
          }
          .footer {
            color: #9ca3af;
            font-size: 13px;
          }
          .footer strong {
            color: #374151;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">${isAccepted ? '✓' : '✗'}</div>
          <h1>${isAccepted ? 'Quote Accepted!' : 'Quote Declined'}</h1>
          <p class="subtitle">
            ${isAccepted 
              ? 'Thank you for accepting our quote! We\'ve received your response and will be in touch shortly to discuss next steps.'
              : 'We\'ve received your response. If you have any questions or would like to discuss alternatives, please don\'t hesitate to reach out.'}
          </p>
          <div class="project-info">
            <div class="project-title">${projectTitle}</div>
            <div class="project-total">$${total.toFixed(2)}</div>
          </div>
          <p class="footer">
            Thank you, <strong>${clientName}</strong>!<br>
            © ${new Date().getFullYear()} CEB Building
          </p>
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
          body { font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #fef2f2; }
          .card { background: white; padding: 40px; border-radius: 16px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
          h1 { color: #dc2626; margin-bottom: 12px; }
          p { color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Something went wrong</h1>
          <p>Please contact us directly.</p>
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
