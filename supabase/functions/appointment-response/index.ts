import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const action = url.searchParams.get("action");

    // Validate required parameters
    if (!token || !action) {
      console.error("Missing required parameters: token or action");
      return new Response(
        generateHtmlResponse("error", "Invalid request. Missing token or action."),
        { headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    // Validate token is a valid UUID format
    if (!UUID_REGEX.test(token)) {
      console.error("Invalid token format:", token.substring(0, 8) + "...");
      return new Response(
        generateHtmlResponse("error", "Invalid link format. Please use the link from your email."),
        { headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    // Validate action
    if (!["confirm", "reschedule"].includes(action)) {
      console.error("Invalid action:", action);
      return new Response(
        generateHtmlResponse("error", "Invalid action. Please use the links from your email."),
        { headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration");
      return new Response(
        generateHtmlResponse("error", "Server configuration error. Please contact the business directly."),
        { headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up the project by response_token
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        id,
        title,
        response_token,
        response_token_used_at,
        status,
        scheduled_date,
        arrival_window_start,
        arrival_window_end,
        user_id,
        clients (
          name,
          email
        )
      `)
      .eq('response_token', token)
      .single();

    if (projectError || !project) {
      console.error("Project not found for token:", projectError?.message);
      return new Response(
        generateHtmlResponse("error", "This link is invalid or has expired. Please contact the business directly."),
        { headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    // Check if token was already used (replay prevention)
    if (project.response_token_used_at) {
      console.log("Token already used at:", project.response_token_used_at);
      const usedDate = new Date(project.response_token_used_at).toLocaleDateString();
      return new Response(
        generateHtmlResponse(
          "info",
          `This link has already been used on ${usedDate}. If you need to make changes, please contact the business directly.`,
          "Already Responded",
          "ℹ️",
          "#3b82f6"
        ),
        { headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    // Handle client data from Supabase join
    const clientData = project.clients as unknown;
    let clientName = 'Customer';
    let clientEmail = '';
    
    if (Array.isArray(clientData) && clientData.length > 0) {
      clientName = clientData[0]?.name || 'Customer';
      clientEmail = clientData[0]?.email || '';
    } else if (clientData && typeof clientData === 'object') {
      const client = clientData as { name?: string; email?: string };
      clientName = client.name || 'Customer';
      clientEmail = client.email || '';
    }

    const isConfirm = action === "confirm";

    console.log(`Appointment ${isConfirm ? "CONFIRMED" : "RESCHEDULE REQUESTED"} for project ${project.id} by ${clientName}`);

    // Update project: mark token as used and update status if confirming
    const updateData: Record<string, unknown> = {
      response_token_used_at: new Date().toISOString(),
    };

    if (isConfirm) {
      // When confirmed, we could update a confirmation status field if it exists
      // For now, we just mark the token as used
      updateData.status = project.status === 'scheduled' ? 'scheduled' : project.status;
    }

    const { error: updateError } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', project.id);

    if (updateError) {
      console.error("Failed to update project:", updateError);
      return new Response(
        generateHtmlResponse("error", "Failed to process your response. Please try again or contact the business directly."),
        { headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    console.log(`Project ${project.id} updated successfully - token marked as used`);

    // TODO: Optionally notify business owner via email or push notification
    // This could be implemented by inserting into a notifications table or calling another function

    // Generate success response
    const title = isConfirm ? "Appointment Confirmed!" : "Reschedule Requested";
    const message = isConfirm
      ? `Thank you for confirming your appointment${project.scheduled_date ? ` on ${new Date(project.scheduled_date).toLocaleDateString()}` : ''}. We look forward to seeing you!`
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
  type: "success" | "error" | "info",
  message: string,
  title?: string,
  icon?: string,
  color?: string
): string {
  const displayTitle = title || (type === "success" ? "Success" : type === "info" ? "Information" : "Error");
  const displayIcon = icon || (type === "success" ? "✓" : type === "info" ? "ℹ️" : "✗");
  const displayColor = color || (type === "success" ? "#22c55e" : type === "info" ? "#3b82f6" : "#ef4444");

  // Escape HTML to prevent XSS
  const safeMessage = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  const safeTitle = displayTitle
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
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
    <h1>${safeTitle}</h1>
    <p>${safeMessage}</p>
    <p class="close-notice">You can close this window.</p>
  </div>
</body>
</html>
  `;
}
