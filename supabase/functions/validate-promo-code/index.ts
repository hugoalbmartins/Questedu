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
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("Not authenticated");

    const { code } = await req.json();
    if (!code) throw new Error("No code provided");

    const { data: promo, error } = await supabaseClient
      .from("promo_codes")
      .select("*")
      .eq("code", code.trim().toUpperCase())
      .eq("is_active", true)
      .single();

    if (error || !promo) {
      return new Response(JSON.stringify({ valid: false, error: "Código inválido" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return new Response(JSON.stringify({ valid: false, error: "Código expirado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (promo.current_uses >= promo.max_uses) {
      return new Response(JSON.stringify({ valid: false, error: "Código esgotado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (promo.target_user_id && promo.target_user_id !== user.id) {
      return new Response(JSON.stringify({ valid: false, error: "Código não disponível para este utilizador" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Increment usage
    const newUses = (promo.current_uses || 0) + 1;
    const updateData: Record<string, any> = { current_uses: newUses };
    // If single-use code (max_uses = 1), deactivate it
    if (promo.max_uses && newUses >= promo.max_uses) {
      updateData.is_active = false;
    }
    await supabaseClient
      .from("promo_codes")
      .update(updateData)
      .eq("id", promo.id);

    return new Response(JSON.stringify({
      valid: true,
      promo_type: promo.promo_type || "discount",
      discount_percent: promo.discount_percent,
      discount_amount: promo.discount_amount,
      free_months: promo.free_months,
      discount_duration_months: promo.discount_duration_months,
      code_id: promo.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ valid: false, error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
