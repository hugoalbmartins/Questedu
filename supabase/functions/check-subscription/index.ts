import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PRICE_IDS = {
  monthly: "price_1T8ov5RwhbKQXE0J8GCqt40W",
  annual: "price_1T8ovyRwhbKQXE0JlTXYTU7D",
};

const PLAN_AMOUNTS = {
  monthly: 1.99,
  annual: 21.49,
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionEnd = null;
    let subscriptionType = null;

    // Parse body for studentId
    let studentId: string | null = null;
    try {
      const body = await req.json();
      studentId = body?.studentId || null;
    } catch { /* no body */ }

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      
      // Determine plan type from price ID
      const priceId = subscription.items.data[0]?.price?.id;
      if (priceId === PRICE_IDS.annual) {
        subscriptionType = "annual";
      } else if (priceId === PRICE_IDS.monthly) {
        subscriptionType = "monthly";
      } else {
        subscriptionType = "monthly"; // fallback for legacy price
      }
      
      logStep("Active subscription found", { endDate: subscriptionEnd, type: subscriptionType });

      if (studentId) {
        // Get current student data
        const { data: student } = await supabaseClient
          .from("students")
          .select("is_premium, premium_bonus_applied, association_code, coins, diamonds, xp, citizens")
          .eq("id", studentId)
          .single();

        const updateData: Record<string, any> = {
          is_premium: true,
          premium_expires_at: subscriptionEnd,
          subscription_type: subscriptionType,
        };

        // Apply 15% bonus on first activation
        if (student && !student.premium_bonus_applied) {
          updateData.premium_bonus_applied = true;
          updateData.coins = Math.floor((student.coins || 0) * 1.15);
          updateData.diamonds = Math.floor((student.diamonds || 0) * 1.15);
          updateData.xp = Math.floor((student.xp || 0) * 1.15);
          updateData.citizens = Math.floor((student.citizens || 0) * 1.15);
          logStep("Applied 15% initial bonus");

          // Also boost natural resources by 15%
          const { data: resources } = await supabaseClient
            .from("player_resources")
            .select("id, amount")
            .eq("student_id", studentId);

          if (resources) {
            for (const r of resources) {
              await supabaseClient
                .from("player_resources")
                .update({ amount: Math.floor(r.amount * 1.15) })
                .eq("id", r.id);
            }
            logStep("Boosted natural resources by 15%");
          }
        }

        await supabaseClient
          .from("students")
          .update(updateData)
          .eq("id", studentId);

        // Handle association donation — skip for extra children (4th+ on family plan)
        const isFamilyExtraChild = subscription.metadata?.family_extra_child === "true";
        if (student?.association_code && !isFamilyExtraChild) {
          const { data: association } = await supabaseClient
            .from("parent_associations")
            .select("id, total_raised")
            .eq("association_code", student.association_code)
            .eq("status", "approved")
            .single();

          if (association) {
            let donationAmount = 0;
            
            // Check if association code was set after subscription started
            const associationSetAt = (student as any).association_code_set_at ? new Date((student as any).association_code_set_at) : null;
            const subscriptionStarted = new Date(subscription.current_period_start * 1000);
            
            if (subscriptionType === "annual" && associationSetAt && associationSetAt > subscriptionStarted) {
              // Calculate proportional amount for remaining months
              const subscriptionEnd = new Date(subscription.current_period_end * 1000);
              const totalDays = Math.ceil((subscriptionEnd.getTime() - subscriptionStarted.getTime()) / (1000 * 60 * 60 * 24));
              const remainingDays = Math.ceil((subscriptionEnd.getTime() - associationSetAt.getTime()) / (1000 * 60 * 60 * 24));
              
              // Calculate proportion based on remaining days
              const proportion = remainingDays / totalDays;
              donationAmount = PLAN_AMOUNTS.annual * 0.20 * proportion;
              
              logStep("Calculated proportional donation for association code set after subscription", {
                associationSetAt: associationSetAt.toISOString(),
                subscriptionStarted: subscriptionStarted.toISOString(),
                totalDays,
                remainingDays,
                proportion,
                donationAmount
              });
            } else {
              // Standard calculation for new subscriptions or monthly
              donationAmount = subscriptionType === "annual"
                ? PLAN_AMOUNTS.annual * 0.20
                : PLAN_AMOUNTS.monthly * 0.20;
            }

            // Check if donation for this period already exists
            const periodStart = new Date(subscription.current_period_start * 1000).toISOString();
            const { data: existingDonation } = await supabaseClient
              .from("association_donations")
              .select("id")
              .eq("student_id", studentId)
              .eq("association_id", association.id)
              .gte("created_at", periodStart)
              .limit(1);

            if (!existingDonation || existingDonation.length === 0) {
              await supabaseClient
                .from("association_donations")
                .insert({
                  student_id: studentId,
                  association_id: association.id,
                  amount: donationAmount,
                  payment_id: subscription.id,
                });

              await supabaseClient
                .from("parent_associations")
                .update({ total_raised: (association.total_raised || 0) + donationAmount })
                .eq("id", association.id);

              logStep("Recorded association donation", { amount: donationAmount });
            }
          }
        }

        logStep("Updated student premium status");
      }
    } else {
      // No active Stripe subscription - check for admin-granted premium
      if (studentId) {
        const { data: student } = await supabaseClient
          .from("students")
          .select("is_premium, premium_expires_at, subscription_type")
          .eq("id", studentId)
          .single();

        // If admin-granted and still valid, keep premium
        if (student?.subscription_type === "admin_grant" && student?.premium_expires_at) {
          const expiresAt = new Date(student.premium_expires_at);
          if (expiresAt > new Date()) {
            logStep("Admin-granted premium still valid", { expires: student.premium_expires_at });
            return new Response(JSON.stringify({
              subscribed: true,
              subscription_end: student.premium_expires_at,
              subscription_type: "admin_grant",
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            });
          }
        }

        // Otherwise reset premium
        await supabaseClient
          .from("students")
          .update({
            is_premium: false,
            subscription_type: null,
          })
          .eq("id", studentId);
      }
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_end: subscriptionEnd,
      subscription_type: subscriptionType,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
