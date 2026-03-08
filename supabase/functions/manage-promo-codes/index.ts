import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    const user = userData.user;
    if (!user) throw new Error("Not authenticated");

    const { data: isAdmin } = await supabaseClient.rpc("is_admin", { _user_id: user.id });
    if (!isAdmin) throw new Error("Unauthorized");

    const { action, ...params } = await req.json();

    if (action === "list") {
      const { data } = await supabaseClient.from("promo_codes").select("*").order("created_at", { ascending: false });
      return new Response(JSON.stringify({ codes: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create") {
      const {
        code, discount_percent, discount_amount, max_uses, expires_at,
        target_email, promo_type, free_months, discount_duration_months
      } = params;

      // Resolve target_email to user_id if provided
      let target_user_id = null;
      if (target_email) {
        const { data: targetUser } = await supabaseClient.auth.admin.listUsers();
        const found = targetUser?.users?.find((u: any) => u.email === target_email.toLowerCase());
        if (found) target_user_id = found.id;
      }

      const { data, error } = await supabaseClient.from("promo_codes").insert({
        code: code.trim().toUpperCase(),
        promo_type: promo_type || "discount",
        discount_percent: discount_percent || 0,
        discount_amount: discount_amount || 0,
        free_months: free_months || 0,
        discount_duration_months: discount_duration_months || 0,
        max_uses: max_uses || 1,
        target_user_id,
        expires_at: expires_at || null,
        created_by: user.id,
      }).select().single();

      if (error) throw new Error(error.message);
      return new Response(JSON.stringify({ promo: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "toggle") {
      const { code_id, is_active } = params;
      await supabaseClient.from("promo_codes").update({ is_active }).eq("id", code_id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const { code_id } = params;
      await supabaseClient.from("promo_codes").delete().eq("id", code_id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === Subscription Discounts ===
    if (action === "list_discounts") {
      const { data } = await supabaseClient
        .from("subscription_discounts")
        .select("*, students(display_name, nickname)")
        .order("created_at", { ascending: false });
      return new Response(JSON.stringify({ discounts: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create_discount") {
      const { student_id, apply_to_all, discount_percent, target_months, notes } = params;

      const { data, error } = await supabaseClient.from("subscription_discounts").insert({
        student_id: apply_to_all ? null : student_id,
        apply_to_all: apply_to_all || false,
        discount_percent: discount_percent || 0,
        target_months: target_months || [],
        notes: notes || null,
        created_by: user.id,
      }).select().single();

      if (error) throw new Error(error.message);
      return new Response(JSON.stringify({ discount: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete_discount") {
      const { discount_id } = params;
      await supabaseClient.from("subscription_discounts").delete().eq("id", discount_id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Legacy support
    if (action === "deactivate") {
      await supabaseClient.from("promo_codes").update({ is_active: false }).eq("id", params.id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Unknown action");
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
