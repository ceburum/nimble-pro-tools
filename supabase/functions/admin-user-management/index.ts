import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Role hierarchy: user → staff (moderator) → admin
const ROLE_HIERARCHY = ["user", "moderator", "admin"] as const;
type AppRole = typeof ROLE_HIERARCHY[number];

function getNextRole(currentRole: AppRole, direction: "promote" | "demote"): AppRole | null {
  const currentIndex = ROLE_HIERARCHY.indexOf(currentRole);
  
  if (direction === "promote") {
    if (currentIndex >= ROLE_HIERARCHY.length - 1) return null; // Already at max
    return ROLE_HIERARCHY[currentIndex + 1];
  } else {
    if (currentIndex <= 0) return null; // Already at min
    return ROLE_HIERARCHY[currentIndex - 1];
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Get the requesting user from Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the requesting user is an admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requestingUser) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if requesting user has admin role
    const { data: adminRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .eq("role", "admin")
      .single();

    if (!adminRole) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, targetUserId, direction } = body;
    
    console.log("Admin action received:", { action, targetUserId, direction });

    switch (action) {
      case "list_users": {
        // List all users with their settings
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({
          perPage: 100
        });

        if (listError) {
          throw listError;
        }

        // Get user settings and roles for each user
        const { data: userSettings } = await supabaseAdmin
          .from("user_settings")
          .select("user_id, company_name, business_type, setup_completed, created_at");

        const { data: userRoles } = await supabaseAdmin
          .from("user_roles")
          .select("user_id, role");

        // Combine data
        const enrichedUsers = users.map(user => {
          const settings = userSettings?.find(s => s.user_id === user.id);
          const roles = userRoles?.filter(r => r.user_id === user.id).map(r => r.role) || [];
          const isBanned = user.banned_until !== null;
          
          return {
            id: user.id,
            email: user.email,
            created_at: user.created_at,
            last_sign_in_at: user.last_sign_in_at,
            company_name: settings?.company_name || null,
            business_type: settings?.business_type || null,
            setup_completed: settings?.setup_completed || false,
            roles: roles.length > 0 ? roles : ["user"],
            is_admin: roles.includes("admin"),
            is_suspended: isBanned
          };
        });

        return new Response(JSON.stringify({ users: enrichedUsers }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "change_user_role": {
        if (!targetUserId) {
          return new Response(JSON.stringify({ error: "Target user ID required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (!direction || !["promote", "demote"].includes(direction)) {
          return new Response(JSON.stringify({ error: "Direction must be 'promote' or 'demote'" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Prevent changing own role
        if (targetUserId === requestingUser.id) {
          return new Response(JSON.stringify({ error: "Cannot change your own role" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get current role for target user
        const { data: existingRoles } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", targetUserId);

        // Determine current highest role
        let currentRole: AppRole = "user";
        if (existingRoles && existingRoles.length > 0) {
          const roles = existingRoles.map(r => r.role as AppRole);
          if (roles.includes("admin")) currentRole = "admin";
          else if (roles.includes("moderator")) currentRole = "moderator";
        }

        // Calculate next role
        const newRole = getNextRole(currentRole, direction);
        
        if (!newRole) {
          const message = direction === "promote" 
            ? "User is already at maximum role (admin)"
            : "User is already at minimum role (user)";
          return new Response(JSON.stringify({ error: message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Delete existing roles
        await supabaseAdmin
          .from("user_roles")
          .delete()
          .eq("user_id", targetUserId);

        // Insert new role (unless demoting to 'user' which means no role entry)
        if (newRole !== "user") {
          const { error: insertError } = await supabaseAdmin
            .from("user_roles")
            .insert({ user_id: targetUserId, role: newRole });

          if (insertError) {
            console.error("Insert role error:", insertError);
            throw insertError;
          }
        }

        const roleLabel = newRole === "moderator" ? "Staff" : newRole.charAt(0).toUpperCase() + newRole.slice(1);
        return new Response(JSON.stringify({ 
          success: true,
          message: `User ${direction}d to ${roleLabel}`,
          newRole
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "suspend_user": {
        if (!targetUserId) {
          return new Response(JSON.stringify({ error: "Target user ID required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Prevent self-suspension
        if (targetUserId === requestingUser.id) {
          return new Response(JSON.stringify({ error: "Cannot suspend your own account" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Check target user's role - only allow suspending 'user' role
        const { data: targetRoles } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", targetUserId);

        const hasElevatedRole = targetRoles?.some(r => 
          r.role === "admin" || r.role === "moderator"
        );

        if (hasElevatedRole) {
          return new Response(JSON.stringify({ 
            error: "Cannot suspend staff or admin users. Demote first." 
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Ban the user (far future date = indefinite)
        const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(
          targetUserId,
          { ban_duration: "876000h" } // 100 years
        );

        if (banError) {
          console.error("Ban user error:", banError);
          throw banError;
        }

        return new Response(JSON.stringify({ 
          success: true,
          message: "User suspended successfully"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "unsuspend_user": {
        if (!targetUserId) {
          return new Response(JSON.stringify({ error: "Target user ID required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Unban the user
        const { error: unbanError } = await supabaseAdmin.auth.admin.updateUserById(
          targetUserId,
          { ban_duration: "none" }
        );

        if (unbanError) {
          console.error("Unban user error:", unbanError);
          throw unbanError;
        }

        return new Response(JSON.stringify({ 
          success: true,
          message: "User unsuspended successfully"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "reset_user": {
        if (!targetUserId) {
          return new Response(JSON.stringify({ error: "Target user ID required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Prevent resetting own admin account
        if (targetUserId === requestingUser.id) {
          return new Response(JSON.stringify({ error: "Cannot reset your own account" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Delete all user data but keep auth record
        const tablesToClear = [
          "projects",
          "invoices", 
          "clients",
          "project_photos",
          "project_receipts",
          "project_mileage",
          "mileage_entries",
          "bank_expenses",
          "capital_assets",
          "transactions",
          "subcontractor_payments",
          "materials",
          "invoice_reminders"
        ];

        for (const table of tablesToClear) {
          await supabaseAdmin
            .from(table)
            .delete()
            .eq("user_id", targetUserId);
        }

        // Reset user_settings to initial state
        await supabaseAdmin
          .from("user_settings")
          .update({
            setup_completed: false,
            business_type: null,
            business_sector: null,
            company_name: null,
            company_email: null,
            company_phone: null,
            company_address: null,
            dashboard_logo_url: null,
            payment_instructions: null,
            tagline: null,
            license_number: null,
            mileage_pro_enabled: false,
            scheduling_pro_enabled: false,
            tax_pro_enabled: false,
            financial_pro_enabled: false,
            financial_tool_enabled: false,
            trial_started_at: null,
            ai_scans_used: 0
          })
          .eq("user_id", targetUserId);

        return new Response(JSON.stringify({ 
          success: true, 
          message: "User data cleared and reset to setup" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete_user": {
        if (!targetUserId) {
          return new Response(JSON.stringify({ error: "Target user ID required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Prevent deleting own admin account
        if (targetUserId === requestingUser.id) {
          return new Response(JSON.stringify({ error: "Cannot delete your own account" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Check if target is also admin
        const { data: targetAdminRole } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", targetUserId)
          .eq("role", "admin")
          .single();

        if (targetAdminRole) {
          return new Response(JSON.stringify({ error: "Cannot delete another admin account" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Delete user from auth (cascades to user_roles, etc.)
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);

        if (deleteError) {
          throw deleteError;
        }

        // Manually delete from tables without cascade
        const tablesToClear = [
          "user_settings",
          "projects",
          "invoices",
          "clients",
          "project_photos",
          "project_receipts",
          "project_mileage",
          "mileage_entries",
          "bank_expenses",
          "capital_assets",
          "transactions",
          "subcontractor_payments",
          "materials",
          "invoice_reminders",
          "email_provider_settings"
        ];

        for (const table of tablesToClear) {
          await supabaseAdmin
            .from(table)
            .delete()
            .eq("user_id", targetUserId);
        }

        return new Response(JSON.stringify({ 
          success: true, 
          message: "User account and all data permanently deleted" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        console.error("Invalid action received:", action);
        return new Response(JSON.stringify({ error: `Invalid action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error: unknown) {
    console.error("Admin user management error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
