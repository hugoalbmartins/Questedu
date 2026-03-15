import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: expiredCount, error: expireError } = await supabase.rpc("expire_trials");

    if (expireError) {
      console.error("Error expiring trials:", expireError);
      throw expireError;
    }

    const { data: expiringStudents, error: notifyError } = await supabase
      .from("students")
      .select(`
        id,
        display_name,
        trial_ends_at,
        user_id,
        profiles:user_id (email)
      `)
      .not("trial_ends_at", "is", null)
      .gte("trial_ends_at", new Date().toISOString())
      .lte("trial_ends_at", new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString())
      .eq("is_premium", true);

    if (notifyError) {
      console.error("Error fetching expiring students:", notifyError);
    }

    let notificationsSent = 0;

    if (expiringStudents && expiringStudents.length > 0) {
      for (const student of expiringStudents) {
        const daysRemaining = Math.ceil(
          (new Date(student.trial_ends_at).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
        );

        try {
          await supabase.from("notifications").insert({
            student_id: student.id,
            type: "trial_expiring",
            title: "Trial Premium a Expirar",
            message: `O teu trial premium expira em ${daysRemaining} dia${daysRemaining > 1 ? "s" : ""}! Continua a jogar com todas as funcionalidades.`,
            link: "/game?modal=premium",
          });

          notificationsSent++;
        } catch (error) {
          console.error(`Error sending notification to student ${student.id}:`, error);
        }
      }
    }

    console.log(`Trial check complete: ${expiredCount} expired, ${notificationsSent} notifications sent`);

    return new Response(
      JSON.stringify({
        success: true,
        expired_count: expiredCount,
        notifications_sent: notificationsSent,
        expiring_students: expiringStudents?.length || 0,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in check-trial-expiration:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
