import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AppointmentNotificationRequest {
  appointmentId: string;
  clientEmail: string;
  clientName: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  businessName: string;
  businessEmail?: string;
  confirmationToken?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      appointmentId,
      clientEmail,
      clientName,
      serviceName,
      appointmentDate,
      appointmentTime,
      businessName,
      businessEmail,
      confirmationToken,
    } = await req.json() as AppointmentNotificationRequest;

    // Get Resend API key
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const baseUrl = supabaseUrl.replace('.supabase.co', '-functions.supabase.co');
    
    // Create confirmation and reschedule URLs
    const confirmUrl = `${baseUrl}/appointment-response?token=${confirmationToken}&action=confirm`;
    const rescheduleUrl = `${baseUrl}/appointment-response?token=${confirmationToken}&action=reschedule`;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Appointment Confirmation Request</h1>
  </div>
  
  <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
    <p style="margin-top: 0;">Hi ${clientName},</p>
    
    <p>You have an appointment scheduled with <strong>${businessName}</strong>:</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
      <p style="margin: 0 0 10px 0;"><strong>Service:</strong> ${serviceName}</p>
      <p style="margin: 0 0 10px 0;"><strong>Date:</strong> ${appointmentDate}</p>
      <p style="margin: 0;"><strong>Time:</strong> ${appointmentTime}</p>
    </div>
    
    <p>Please confirm your appointment or request to reschedule:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${confirmUrl}" style="display: inline-block; background: #22c55e; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-right: 10px;">
        ✓ Confirm Appointment
      </a>
      <a href="${rescheduleUrl}" style="display: inline-block; background: #f59e0b; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
        ↻ Request Reschedule
      </a>
    </div>
    
    <p style="font-size: 13px; color: #64748b; margin-top: 30px;">
      If we don't hear from you within 24 hours, your appointment will be automatically confirmed.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
    
    <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0;">
      Sent by ${businessName}${businessEmail ? ` • ${businessEmail}` : ''}
    </p>
  </div>
</body>
</html>
    `;

    // Send email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: businessEmail || "appointments@nimble-pro.com",
        to: [clientEmail],
        subject: `Appointment Confirmation - ${serviceName} on ${appointmentDate}`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Resend error:", errorText);
      throw new Error(`Failed to send email: ${emailResponse.status}`);
    }

    const result = await emailResponse.json();

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: result.id,
        appointmentId 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Notification error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
