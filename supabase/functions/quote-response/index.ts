import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const htmlHeaders = {
  "Content-Type": "text/html; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  // Force inline rendering (avoid download / source view behaviors)
  "Content-Disposition": "inline",
  "Cache-Control": "no-store",
} as const;

interface QuoteData {
  projectId: string;
  projectTitle: string;
  clientName: string;
  clientEmail: string;
  total: number;
  notificationEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const encodedData = url.searchParams.get("data");

    if (!action || !encodedData) {
      return new Response(generateHtmlPage("Invalid Request", "Missing required parameters.", "error"), {
        status: 400,
        headers: htmlHeaders,
      });
    }

    let quoteData: QuoteData;
    try {
      quoteData = JSON.parse(atob(encodedData));
    } catch {
      return new Response(generateHtmlPage("Invalid Request", "Could not decode quote data.", "error"), {
        status: 400,
        headers: htmlHeaders,
      });
    }

    const { projectId, projectTitle, clientName, clientEmail, total, notificationEmail } = quoteData;
    const isAccepted = action === "accept";

    console.log(`Quote ${isAccepted ? "ACCEPTED" : "DECLINED"} for project ${projectId} by ${clientName}`);

    // Send notification email to the business owner
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

    try {
      await resend.emails.send({
        from: "CEB Services <onboarding@resend.dev>",
        to: [notificationEmail],
        subject: `${isAccepted ? '✓ Quote Accepted' : '✗ Quote Declined'}: ${projectTitle} - ${clientName}`,
        html: notificationHtml,
      });
      console.log(`Notification sent to ${notificationEmail}`);
    } catch (emailError) {
      console.error("Failed to send notification email:", emailError);
    }

    // Return a nice confirmation page to the client
    const confirmationTitle = isAccepted ? "Thank You!" : "Quote Declined";
    const confirmationMessage = isAccepted
      ? `Thank you for accepting the quote for "${projectTitle}"! We will be in touch shortly to discuss next steps.`
      : `We're sorry to hear you've decided not to proceed with "${projectTitle}". If you have any questions or would like to discuss alternatives, please don't hesitate to reach out.`;

    return new Response(
      generateHtmlPage(confirmationTitle, confirmationMessage, isAccepted ? "success" : "declined"),
      {
        status: 200,
        headers: htmlHeaders,
      }
    );
  } catch (error: any) {
    console.error("Error handling quote response:", error);
    return new Response(
      generateHtmlPage("Error", "Something went wrong. Please contact us directly.", "error"),
      {
        status: 500,
        headers: htmlHeaders,
      }
    );
  }
};

function generateHtmlPage(title: string, message: string, type: "success" | "declined" | "error"): string {
  const colors = {
    success: { bg: "#f0fdf4", border: "#22c55e", text: "#22c55e" },
    declined: { bg: "#fef2f2", border: "#ef4444", text: "#ef4444" },
    error: { bg: "#fef2f2", border: "#ef4444", text: "#ef4444" },
  };
  const c = colors[type];

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - CEB Services</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px; color: #333; background: #f5f5f5; min-height: 100vh; margin: 0;">
      <div style="max-width: 500px; margin: 0 auto; text-align: center;">
        <div style="background: ${c.bg}; border: 2px solid ${c.border}; border-radius: 16px; padding: 40px; margin-bottom: 20px;">
          <div style="font-size: 60px; margin-bottom: 20px;">
            ${type === "success" ? "✅" : type === "declined" ? "📋" : "⚠️"}
          </div>
          <h1 style="color: ${c.text}; margin: 0 0 20px 0; font-size: 28px;">${title}</h1>
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0;">${message}</p>
        </div>
        <p style="color: #999; font-size: 14px;">© ${new Date().getFullYear()} CEB Services</p>
      </div>
    </body>
    </html>
  `;
}

serve(handler);
