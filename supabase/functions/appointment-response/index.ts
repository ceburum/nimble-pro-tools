import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const action = url.searchParams.get("action");

    if (!token || !action) {
      return new Response(
        generateHtmlResponse("error", "Invalid request. Missing token or action."),
        { headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    if (!["confirm", "reschedule"].includes(action)) {
      return new Response(
        generateHtmlResponse("error", "Invalid action. Please use the links from your email."),
        { headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    // In a full implementation, we would:
    // 1. Validate the token against the database
    // 2. Update the appointment confirmation_status
    // 3. Notify the business owner
    // For now, we show a confirmation page

    const isConfirm = action === "confirm";
    const title = isConfirm ? "Appointment Confirmed!" : "Reschedule Requested";
    const message = isConfirm
      ? "Thank you for confirming your appointment. We look forward to seeing you!"
      : "Your reschedule request has been sent. The business will contact you shortly with new options.";
    const icon = isConfirm ? "✓" : "↻";
    const color = isConfirm ? "#22c55e" : "#f59e0b";

    return new Response(
      generateHtmlResponse("success", message, title, icon, color),
      { headers: { ...corsHeaders, "Content-Type": "text/html" } }
    );

  } catch (error) {
    console.error("Appointment response error:", error);
    return new Response(
      generateHtmlResponse("error", "Something went wrong. Please try again or contact the business directly."),
      { headers: { ...corsHeaders, "Content-Type": "text/html" } }
    );
  }
});

function generateHtmlResponse(
  type: "success" | "error",
  message: string,
  title?: string,
  icon?: string,
  color?: string
): string {
  const isSuccess = type === "success";
  const displayTitle = title || (isSuccess ? "Success" : "Error");
  const displayIcon = icon || (isSuccess ? "✓" : "✗");
  const displayColor = color || (isSuccess ? "#22c55e" : "#ef4444");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${displayTitle}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      padding: 40px;
      max-width: 400px;
      width: 100%;
      text-align: center;
    }
    .icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: ${displayColor}20;
      color: ${displayColor};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
      margin: 0 auto 24px;
    }
    h1 {
      color: #1a202c;
      font-size: 24px;
      margin-bottom: 12px;
    }
    p {
      color: #64748b;
      font-size: 16px;
      line-height: 1.6;
    }
    .close-notice {
      margin-top: 24px;
      font-size: 14px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${displayIcon}</div>
    <h1>${displayTitle}</h1>
    <p>${message}</p>
    <p class="close-notice">You can close this window.</p>
  </div>
</body>
</html>
  `;
}
