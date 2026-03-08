import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Call the database function that creates in-app reminders
    const { error } = await supabase.rpc("create_daily_quiz_reminders");

    if (error) {
      console.error("Error creating reminders:", error);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Daily reminders created (in-app only)." }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500 });
  }
});
