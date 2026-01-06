import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvoiceWithClient {
  id: string;
  invoice_number: string;
  items: { quantity: number; unitPrice: number }[];
  due_date: string;
  clients: {
    name: string;
    email: string;
    phone: string;
  };
}

const sendEmailReminder = async (
  invoice: InvoiceWithClient,
  daysOverdue: number,
  reminderType: string
) => {
  const total = invoice.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const formattedAmount = total.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const formattedDueDate = new Date(invoice.due_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

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
          <h1>⚠️ Payment Reminder (${reminderType})</h1>
        </div>
        <div class="content">
          <p>Dear ${invoice.clients.name},</p>
          <p>This is a friendly reminder that your invoice is <strong>${daysOverdue} days past due</strong>.</p>
          
          <div class="amount">${formattedAmount}</div>
          
          <div class="details">
            <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
            <p><strong>Due Date:</strong> ${formattedDueDate}</p>
            <p><strong>Days Overdue:</strong> ${daysOverdue}</p>
          </div>
          
          <p>Please arrange payment at your earliest convenience.</p>
          
          <p style="text-align: center; margin-top: 30px;">
            <a href="https://venmo.com/Chad-Burum-1?txn=pay&amount=${total}" class="btn">Pay with Venmo</a>
          </p>
          
          <p>If you have already made this payment, please disregard this notice.</p>
          
          <p>Best regards,<br>Chad Burum<br>CEB Electric</p>
        </div>
        <div class="footer">
          <p>CEB Electric | chad.burum@ceb-electric.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "CEB Electric <onboarding@resend.dev>",
      to: [invoice.clients.email],
      subject: `⚠️ Payment Reminder: Invoice ${invoice.invoice_number} is ${daysOverdue} days overdue`,
      html: emailHtml,
    }),
  });

  return res.ok;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const now = new Date();
    const results: { invoice: string; reminder: string; success: boolean }[] = [];

    // Get all unpaid invoices that are overdue
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        items,
        due_date,
        clients (
          name,
          email,
          phone
        )
      `)
      .in('status', ['sent', 'overdue'])
      .lt('due_date', now.toISOString());

    if (invoicesError) {
      console.error("Error fetching invoices:", invoicesError);
      throw invoicesError;
    }

    console.log(`Found ${invoices?.length || 0} overdue invoices`);

    for (const invoiceData of (invoices || [])) {
      const invoice = invoiceData as unknown as InvoiceWithClient;
      const dueDate = new Date(invoice.due_date);
      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      // Determine which reminders should be sent
      const reminderSchedule = [
        { days: 3, type: '3_day' },
        { days: 7, type: '7_day' },
        { days: 14, type: '14_day' },
      ];

      for (const schedule of reminderSchedule) {
        if (daysOverdue >= schedule.days) {
          // Check if this reminder was already sent
          const { data: existingReminder } = await supabase
            .from('invoice_reminders')
            .select('id')
            .eq('invoice_id', invoice.id)
            .eq('reminder_type', schedule.type)
            .maybeSingle();

          if (!existingReminder) {
            console.log(`Sending ${schedule.type} reminder for invoice ${invoice.invoice_number}`);
            
            const emailSuccess = await sendEmailReminder(invoice, daysOverdue, schedule.type);
            
            // Log SMS would be sent (implement Twilio later)
            console.log(`SMS would be sent to ${invoice.clients.phone} for ${invoice.invoice_number}`);

            // Record the reminder
            await supabase
              .from('invoice_reminders')
              .insert({
                invoice_id: invoice.id,
                reminder_type: schedule.type,
                method: 'both'
              });

            results.push({
              invoice: invoice.invoice_number,
              reminder: schedule.type,
              success: emailSuccess
            });
          }
        }
      }

      // Update invoice status to overdue if not already
      await supabase
        .from('invoices')
        .update({ status: 'overdue' })
        .eq('id', invoice.id)
        .eq('status', 'sent');
    }

    console.log(`Processed ${results.length} reminders`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        results 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in check-overdue-invoices:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);