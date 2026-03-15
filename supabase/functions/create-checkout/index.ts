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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const { studentId, associationCode, promoCode, giftCardCode, plan, familyExtraChild } = await req.json();
    if (!studentId) throw new Error("Student ID is required");

    const selectedPlan = plan === "annual" ? "annual" : "monthly";
    const priceId = PRICE_IDS[selectedPlan];

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const metadata: Record<string, string> = {
      student_id: studentId,
      plan: selectedPlan,
      user_email: user.email,
    };
    if (associationCode) {
      metadata.association_code = associationCode;
    }
    if (giftCardCode) {
      metadata.gift_card_code = giftCardCode;
    }

    const discounts: any[] = [];

    if (familyExtraChild) {
      const discountPercent = selectedPlan === "annual" ? 50 : 40;
      const familyCoupon = await stripe.coupons.create({
        percent_off: discountPercent,
        duration: "forever",
        name: `Desconto Familiar ${discountPercent}%`,
      });
      discounts.push({ coupon: familyCoupon.id });
      metadata.family_extra_child = "true";
      metadata.family_discount_percent = String(discountPercent);
    }

    if (promoCode) {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      const { data: promo, error: promoError } = await supabaseAdmin
        .from("promo_codes")
        .select("*")
        .eq("code", promoCode)
        .eq("is_active", true)
        .maybeSingle();

      if (promoError) {
        console.error("Error fetching promo code:", promoError);
      } else if (promo) {
        if (promo.max_uses && promo.current_uses >= promo.max_uses) {
          throw new Error("Código promocional já foi totalmente utilizado");
        }
        if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
          throw new Error("Código promocional expirado");
        }

        const couponParams: any = {
          duration: promo.discount_duration_months > 0 ? "repeating" : "once",
          name: `Promo: ${promoCode}`,
        };

        if (promo.discount_duration_months > 0) {
          couponParams.duration_in_months = promo.discount_duration_months;
        }

        if (promo.discount_percent > 0) {
          couponParams.percent_off = promo.discount_percent;
        } else if (promo.discount_amount > 0) {
          couponParams.amount_off = Math.round(promo.discount_amount * 100);
          couponParams.currency = "eur";
        }

        const coupon = await stripe.coupons.create(couponParams);
        discounts.push({ coupon: coupon.id });
        metadata.promo_code = promoCode;

        await supabaseAdmin
          .from("promo_codes")
          .update({ current_uses: promo.current_uses + 1 })
          .eq("id", promo.id);
      } else {
        throw new Error("Código promocional inválido");
      }
    }

    const sessionParams: any = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      metadata,
      payment_method_types: ["card", "multibanco"],
      locale: "pt",
      success_url: `${req.headers.get("origin")}/game?premium=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/parent?premium=canceled`,
      subscription_data: {
        metadata,
      },
    };

    if (discounts.length > 0) {
      sessionParams.discounts = discounts;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
