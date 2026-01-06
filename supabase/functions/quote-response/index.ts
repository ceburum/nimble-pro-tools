import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

    // Also send a confirmation email to the CLIENT who clicked
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
            © ${new Date().getFullYear()} CEB Services
          </p>
        </div>
      </body>
      </html>
    `;

    try {
      // Send notification to business owner
      const ownerResult = await resend.emails.send({
        from: "CEB Services <onboarding@resend.dev>",
        to: [notificationEmail],
        subject: `${isAccepted ? '✓ Quote Accepted' : '✗ Quote Declined'}: ${projectTitle} - ${clientName}`,
        html: notificationHtml,
      });
      console.log("Owner notification sent:", ownerResult);

      // Send confirmation to client
      const clientResult = await resend.emails.send({
        from: "CEB Services <onboarding@resend.dev>",
        to: [clientEmail],
        subject: isAccepted 
          ? `Thank you for accepting your quote - ${projectTitle}` 
          : `Quote Response Received - ${projectTitle}`,
        html: clientConfirmationHtml,
      });
      console.log("Client confirmation sent:", clientResult);

    } catch (emailError: any) {
      console.error("Failed to send email:", emailError);
      // Still return success to the user even if email fails
    }

    // Return a simple JSON success response
    // The client will receive a confirmation email instead of seeing an HTML page
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: isAccepted 
          ? "Thank you! Your acceptance has been recorded. Check your email for confirmation."
          : "Your response has been recorded. Check your email for confirmation."
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error handling quote response:", error);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please contact us directly." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
