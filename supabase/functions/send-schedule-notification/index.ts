import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScheduleNotificationRequest {
  projectId: string;
  projectTitle: string;
  projectDescription?: string;
  clientName: string;
  clientEmail: string;
  clientAddress?: string;
  scheduledDate: string; // YYYY-MM-DD
  arrivalWindowStart: string; // "09:00"
  arrivalWindowEnd: string;   // "11:00"
  scheduleNotes?: string;
}

function formatArrivalWindow(start: string, end: string): string {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return minutes === 0 ? `${hour12}:00 ${period}` : `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };
  return `${formatTime(start)} - ${formatTime(end)}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function generateIcsContent(data: ScheduleNotificationRequest): string {
  const [hours, minutes] = data.arrivalWindowStart.split(':').map(Number);
  const [endHours, endMinutes] = data.arrivalWindowEnd.split(':').map(Number);
  
  const startDt = data.scheduledDate.replace(/-/g, '') + 'T' + 
    hours.toString().padStart(2, '0') + minutes.toString().padStart(2, '0') + '00';
  const endDt = data.scheduledDate.replace(/-/g, '') + 'T' + 
    endHours.toString().padStart(2, '0') + endMinutes.toString().padStart(2, '0') + '00';

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//CEB Building//Scheduling Pro//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
DTSTART:${startDt}
DTEND:${endDt}
SUMMARY:${data.projectTitle} - CEB Building
DESCRIPTION:Project: ${data.projectTitle}\\n${data.projectDescription || ''}\\n\\nContractor: Chad Burum, CEB Building\\nContact: 405-500-8224 / chad@cebbuilding.com
LOCATION:${data.clientAddress || ''}
STATUS:CONFIRMED
ORGANIZER;CN=Chad Burum:mailto:chad@cebbuilding.com
BEGIN:VALARM
TRIGGER:-P1D
ACTION:DISPLAY
DESCRIPTION:Reminder: ${data.projectTitle} is tomorrow
END:VALARM
BEGIN:VALARM
TRIGGER:-PT1H
ACTION:DISPLAY
DESCRIPTION:Reminder: ${data.projectTitle} is in 1 hour
END:VALARM
END:VEVENT
END:VCALENDAR`;
}

function generateGoogleCalendarUrl(data: ScheduleNotificationRequest): string {
  const [hours, minutes] = data.arrivalWindowStart.split(':').map(Number);
  const [endHours, endMinutes] = data.arrivalWindowEnd.split(':').map(Number);
  
  const startDt = data.scheduledDate.replace(/-/g, '') + 'T' + 
    hours.toString().padStart(2, '0') + minutes.toString().padStart(2, '0') + '00';
  const endDt = data.scheduledDate.replace(/-/g, '') + 'T' + 
    endHours.toString().padStart(2, '0') + endMinutes.toString().padStart(2, '0') + '00';

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${data.projectTitle} - CEB Building`,
    dates: `${startDt}/${endDt}`,
    details: `Project: ${data.projectTitle}\n${data.projectDescription || ''}\n\nContractor: Chad Burum, CEB Building\nContact: 405-500-8224 / chad@cebbuilding.com`,
    location: data.clientAddress || '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function generateOutlookUrl(data: ScheduleNotificationRequest): string {
  const startDateTime = new Date(`${data.scheduledDate}T${data.arrivalWindowStart}:00`);
  const endDateTime = new Date(`${data.scheduledDate}T${data.arrivalWindowEnd}:00`);

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: `${data.projectTitle} - CEB Building`,
    startdt: startDateTime.toISOString(),
    enddt: endDateTime.toISOString(),
    body: `Project: ${data.projectTitle}\n${data.projectDescription || ''}\n\nContractor: Chad Burum, CEB Building\nContact: 405-500-8224 / chad@cebbuilding.com`,
    location: data.clientAddress || '',
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

async function sendEmailViaSMTP(
  to: string,
  subject: string,
  htmlBody: string,
  icsAttachment?: string
): Promise<void> {
  const smtpUser = Deno.env.get('ZOHO_SMTP_USER');
  const smtpPassword = Deno.env.get('ZOHO_SMTP_PASSWORD');
  
  if (!smtpUser || !smtpPassword) {
    throw new Error('SMTP credentials not configured');
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Use port 465 with direct TLS (same as working send-invoice-email)
  const conn = await Deno.connectTls({
    hostname: 'smtp.zoho.com',
    port: 465,
  });

  // Read SMTP response, handling multi-line responses
  const read = async (): Promise<string> => {
    let fullResponse = '';
    const buf = new Uint8Array(4096);
    
    while (true) {
      const n = await conn.read(buf);
      if (!n) break;
      fullResponse += decoder.decode(buf.subarray(0, n));
      
      const lines = fullResponse.trim().split('\r\n');
      const lastLine = lines[lines.length - 1];
      if (/^\d{3} /.test(lastLine) || /^\d{3}$/.test(lastLine)) {
        break;
      }
    }
    
    return fullResponse.trim();
  };

  const write = async (data: string): Promise<void> => {
    await conn.write(encoder.encode(data + '\r\n'));
  };

  try {
    await read(); // greeting
    await write('EHLO smtp.zoho.com');
    await read();
    
    await write('AUTH LOGIN');
    await read();
    
    await write(btoa(smtpUser));
    await read();
    
    await write(btoa(smtpPassword));
    const authResponse = await read();
    
    if (authResponse.startsWith('4') || authResponse.startsWith('5')) {
      throw new Error('SMTP Auth failed');
    }

    await write(`MAIL FROM:<${smtpUser}>`);
    const mailFromResponse = await read();
    if (!mailFromResponse.startsWith('250')) {
      throw new Error('MAIL FROM rejected');
    }

    await write(`RCPT TO:<${to}>`);
    const rcptResponse = await read();
    if (!rcptResponse.startsWith('250')) {
      throw new Error('RCPT TO rejected');
    }

    await write('DATA');
    const dataResponse = await read();
    if (!dataResponse.startsWith('354')) {
      throw new Error('DATA command rejected');
    }

    const mixedBoundary = `----=_Mixed_${Date.now()}`;
    const altBoundary = `----=_Alt_${Date.now()}`;

    let emailContent: string[];

    if (icsAttachment) {
      // Email with ICS attachment - use multipart/mixed
      emailContent = [
        `From: CEB Building <${smtpUser}>`,
        `To: ${to}`,
        `Subject: ${subject}`,
        `MIME-Version: 1.0`,
        `Date: ${new Date().toUTCString()}`,
        `Message-ID: <${Date.now()}.${Math.random().toString(36).substring(2)}@cebbuilding.com>`,
        `Content-Type: multipart/mixed; boundary="${mixedBoundary}"`,
        ``,
        `--${mixedBoundary}`,
        `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
        ``,
        `--${altBoundary}`,
        `Content-Type: text/plain; charset=utf-8`,
        ``,
        `Your project has been scheduled. Please view this email in an HTML-compatible email client for full details.`,
        ``,
        `--${altBoundary}`,
        `Content-Type: text/html; charset=utf-8`,
        ``,
        htmlBody,
        ``,
        `--${altBoundary}--`,
        ``,
        `--${mixedBoundary}`,
        `Content-Type: text/calendar; charset=utf-8; name="event.ics"`,
        `Content-Disposition: attachment; filename="event.ics"`,
        `Content-Transfer-Encoding: base64`,
        ``,
        btoa(icsAttachment),
        ``,
        `--${mixedBoundary}--`,
        `.`,
      ];
    } else {
      // Simple email without attachments
      emailContent = [
        `From: CEB Building <${smtpUser}>`,
        `To: ${to}`,
        `Subject: ${subject}`,
        `MIME-Version: 1.0`,
        `Date: ${new Date().toUTCString()}`,
        `Message-ID: <${Date.now()}.${Math.random().toString(36).substring(2)}@cebbuilding.com>`,
        `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
        ``,
        `--${altBoundary}`,
        `Content-Type: text/plain; charset=utf-8`,
        ``,
        `Your project has been scheduled. Please view this email in an HTML-compatible email client for full details.`,
        ``,
        `--${altBoundary}`,
        `Content-Type: text/html; charset=utf-8`,
        ``,
        htmlBody,
        ``,
        `--${altBoundary}--`,
        `.`,
      ];
    }
    
    await conn.write(encoder.encode(emailContent.join('\r\n') + '\r\n'));
    const sendResponse = await read();
    
    if (!sendResponse.startsWith('250')) {
      throw new Error('Message rejected after DATA');
    }

    await write('QUIT');
    try { await read(); } catch { /* ignore quit response */ }
  } finally {
    conn.close();
  }
}

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user token
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsError } = await supabase.auth.getUser(token);
    
    if (claimsError || !claims?.user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data: ScheduleNotificationRequest = await req.json();
    
    const { 
      projectTitle, 
      clientName, 
      clientEmail, 
      clientAddress,
      scheduledDate, 
      arrivalWindowStart, 
      arrivalWindowEnd,
      scheduleNotes 
    } = data;

    const formattedDate = formatDate(scheduledDate);
    const arrivalWindow = formatArrivalWindow(arrivalWindowStart, arrivalWindowEnd);
    const googleCalUrl = generateGoogleCalendarUrl(data);
    const outlookUrl = generateOutlookUrl(data);
    const icsContent = generateIcsContent(data);

    const htmlEmail = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Project Has Been Scheduled</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 32px 40px; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Your Project Has Been Scheduled!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px; font-size: 16px; color: #374151; line-height: 1.6;">
                Hi ${clientName},
              </p>
              <p style="margin: 0 0 24px; font-size: 16px; color: #374151; line-height: 1.6;">
                Great news! Your project has been scheduled. Here are the details:
              </p>
              
              <!-- Schedule Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f9ff; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 12px; font-size: 14px; color: #6b7280;">PROJECT</p>
                    <p style="margin: 0 0 20px; font-size: 18px; font-weight: 600; color: #1e40af;">${projectTitle}</p>
                    
                    <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">SCHEDULED DATE</p>
                    <p style="margin: 0 0 20px; font-size: 16px; font-weight: 500; color: #111827;">${formattedDate}</p>
                    
                    <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">ARRIVAL WINDOW</p>
                    <p style="margin: 0 0 20px; font-size: 16px; font-weight: 500; color: #111827;">We will arrive between ${arrivalWindow}</p>
                    
                    ${clientAddress ? `
                    <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">YOUR ADDRESS</p>
                    <p style="margin: 0; font-size: 16px; color: #111827;">${clientAddress}</p>
                    ` : ''}
                  </td>
                </tr>
              </table>
              
              <!-- Add to Calendar Section -->
              <p style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #374151;">Add to Your Calendar:</p>
              <table cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding-right: 12px;">
                    <a href="${googleCalUrl}" style="display: inline-block; padding: 12px 20px; background-color: #1d4ed8; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">Google Calendar</a>
                  </td>
                  <td style="padding-right: 12px;">
                    <a href="${outlookUrl}" style="display: inline-block; padding: 12px 20px; background-color: #0078d4; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">Outlook</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 24px; font-size: 13px; color: #6b7280;">
                📎 An .ics calendar file is attached to this email for Apple Calendar and other apps.
              </p>

              ${scheduleNotes ? `
              <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0 0 4px; font-size: 14px; font-weight: 600; color: #92400e;">Note:</p>
                <p style="margin: 0; font-size: 14px; color: #78350f;">${scheduleNotes}</p>
              </div>
              ` : ''}
              
              <!-- Reschedule Section -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; border: 1px solid #e5e7eb;">
                <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #374151;">Need to Reschedule?</p>
                <p style="margin: 0 0 16px; font-size: 14px; color: #6b7280; line-height: 1.5;">
                  Please contact us as soon as possible so we can find a time that works:
                </p>
                <p style="margin: 0 0 8px; font-size: 14px; color: #111827;">
                  📞 Call or Text: <a href="tel:405-500-8224" style="color: #1d4ed8; text-decoration: none; font-weight: 500;">405-500-8224</a>
                </p>
                <p style="margin: 0; font-size: 14px; color: #111827;">
                  📧 Email: <a href="mailto:chad@cebbuilding.com" style="color: #1d4ed8; text-decoration: none; font-weight: 500;">chad@cebbuilding.com</a>
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 14px; color: #6b7280; text-align: center;">
                Thank you for choosing CEB Building!
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; color: #9ca3af; text-align: center;">
                Chad Burum • CEB Building • 405-500-8224
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    await sendEmailViaSMTP(
      clientEmail,
      `Your Project Has Been Scheduled - ${projectTitle}`,
      htmlEmail,
      icsContent
    );

    return new Response(
      JSON.stringify({ success: true, message: 'Schedule notification sent' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error sending schedule notification:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to send notification' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
