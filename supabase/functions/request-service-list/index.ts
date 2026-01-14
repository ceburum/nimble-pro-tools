import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token from header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the user from the auth token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await req.json();
    const { sectorId, sectorName } = body;

    if (!sectorId || !sectorName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: sectorId, sectorName' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has already requested this list
    const { data: existingRequest } = await supabase
      .from('service_list_requests')
      .select('id')
      .eq('user_id', user.id)
      .eq('sector_id', sectorId)
      .maybeSingle();

    if (existingRequest) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'You have already requested this list. We will notify you when it becomes available.',
          alreadyRequested: true 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert the request
    const { error: insertError } = await supabase
      .from('service_list_requests')
      .insert({
        user_id: user.id,
        sector_id: sectorId,
        sector_name: sectorName,
        user_email: user.email,
      });

    if (insertError) {
      console.error('Error inserting request:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to submit request' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send notification to admin (using Resend if configured)
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (resendApiKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Nimble App <noreply@nimble.app>',
            to: ['admin@nimble.app'], // Replace with actual admin email
            subject: `New Service List Request: ${sectorName}`,
            html: `
              <h2>New Service List Request</h2>
              <p><strong>Sector:</strong> ${sectorName} (${sectorId})</p>
              <p><strong>Requested by:</strong> ${user.email}</p>
              <p><strong>User ID:</strong> ${user.id}</p>
              <p><strong>Requested at:</strong> ${new Date().toISOString()}</p>
            `,
          }),
        });
      } catch (emailError) {
        // Log but don't fail the request
        console.error('Failed to send admin notification:', emailError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Your request has been submitted. We will notify you when the list becomes available!' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
