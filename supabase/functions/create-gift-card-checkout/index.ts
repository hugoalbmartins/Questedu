import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PLAN_OPTIONS: Record<string, { label: string; price: number; premium_days: number; plan_type: string; card_type: string }> = {
  individual_monthly: { label: "Gift Card Premium Individual — 1 Mês", price: 1.99, premium_days: 30, plan_type: "individual_monthly", card_type: "premium_month" },
  family_monthly: { label: "Gift Card Plano Familiar — 1 Mês", price: 4.99, premium_days: 30, plan_type: "family_monthly", card_type: "premium_month" },
  individual_annual: { label: "Gift Card Premium Individual — 1 Ano", price: 21.49, premium_days: 365, plan_type: "individual_annual", card_type: "premium_year" },
  family_annual: { label: "Gift Card Plano Familiar — 1 Ano", price: 53.88, premium_days: 365, plan_type: "family_annual", card_type: "premium_year" },
};

function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) code += "-";
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    const { planType, buyerEmail, buyerName, quantity = 1 } = body;

    if (!planType || !PLAN_OPTIONS[planType]) {
      return new Response(JSON.stringify({ error: "Tipo de gift card inválido" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (!buyerEmail) {
      return new Response(JSON.stringify({ error: "Email do comprador é obrigatório" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const qty = Math.min(Math.max(1, parseInt(quantity) || 1), 5);
    const plan = PLAN_OPTIONS[planType];
    const totalAmount = Math.round(plan.price * qty * 100);

    const origin = req.headers.get("origin") || "https://questeduca.pt";

    const session = await stripe.checkout.sessions.create({
      customer_email: buyerEmail,
      payment_method_types: ["card", "multibanco"],
      locale: "pt",
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: plan.label,
              description: `Válido 1 ano após compra. Pode ser oferecido a qualquer aluno do Questeduca.`,
            },
            unit_amount: Math.round(plan.price * 100),
          },
          quantity: qty,
        },
      ],
      metadata: {
        gift_card_purchase: "true",
        plan_type: planType,
        premium_days: String(plan.premium_days),
        price_paid: String(plan.price),
        card_type: plan.card_type,
        quantity: String(qty),
        buyer_email: buyerEmail,
        buyer_name: buyerName || "",
        total_amount: String(totalAmount / 100),
      },
      success_url: `${origin}/?gift_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?gift_canceled=true`,
    });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Gift card checkout error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
