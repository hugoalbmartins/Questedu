import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const PLAN_AMOUNTS: Record<string, number> = {
  monthly: 1.99,
  annual: 21.49,
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil",
  });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    let event: Stripe.Event;

    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      event = JSON.parse(body);
    }

    console.log(`Processing event: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata;

        if (metadata?.gift_card_purchase === "true") {
          const planType = metadata.plan_type;
          const premiumDays = parseInt(metadata.premium_days || "30");
          const pricePaid = parseFloat(metadata.price_paid || "1.99");
          const cardType = metadata.card_type || "premium_month";
          const qty = parseInt(metadata.quantity || "1");
          const buyerEmail = metadata.buyer_email;
          const buyerName = metadata.buyer_name || "Comprador";

          const expiresAt = new Date();
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);

          const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
          const genCode = () => {
            let code = "";
            for (let i = 0; i < 16; i++) {
              if (i > 0 && i % 4 === 0) code += "-";
              code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return code;
          };

          const records = Array.from({ length: qty }, () => ({
            code: genCode(),
            card_type: cardType,
            plan_type: planType,
            price_paid: pricePaid,
            premium_days: premiumDays,
            coins_value: 0,
            diamonds_value: 0,
            max_redemptions: 1,
            expires_at: expiresAt.toISOString(),
            notes: `Comprado por ${buyerName} (${buyerEmail}) via loja — sessão ${session.id}`,
          }));

          const { data: createdCards, error: insertError } = await supabaseAdmin
            .from("gift_cards")
            .insert(records)
            .select("code");

          if (insertError) {
            console.error("Error creating gift cards after purchase:", insertError);
          } else {
            const codes = (createdCards || []).map((c: any) => c.code);
            console.log(`Created ${codes.length} gift card(s) for ${buyerEmail}: ${codes.join(", ")}`);

            const codesHtml = codes.map((c: string) =>
              `<div style="font-family:monospace;font-size:18px;font-weight:bold;letter-spacing:2px;background:#f5f5f5;padding:12px 20px;border-radius:8px;border:1px solid #ddd;display:inline-block;margin:8px 0;">${c}</div>`
            ).join("<br>");

            const planLabels: Record<string, string> = {
              individual_monthly: "Premium Individual — 1 Mês",
              family_monthly: "Plano Familiar — 1 Mês",
              individual_annual: "Premium Individual — 1 Ano",
              family_annual: "Plano Familiar — 1 Ano",
            };
            const planLabel = planLabels[planType] || planType;

            await supabaseAdmin.functions.invoke("send-email", {
              body: {
                to: buyerEmail,
                subject: `Os teus Gift Cards Questeduca — ${planLabel}`,
                html: `
                  <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
                    <h2 style="color:#1a1a1a;">Obrigado pela tua compra!</h2>
                    <p>Olá ${buyerName},</p>
                    <p>Aqui estão os teus <strong>${codes.length} Gift Card(s) Questeduca</strong> do plano <strong>${planLabel}</strong>:</p>
                    <div style="margin:24px 0;">${codesHtml}</div>
                    <p style="color:#555;">Cada código dá acesso Premium durante ${premiumDays >= 365 ? "1 ano" : "1 mês"} e é válido até ${expiresAt.toLocaleDateString("pt-PT")}.</p>
                    <p style="color:#555;">Para resgatar: entra no Questeduca, vai ao menu Premium e introduz o código no campo "Gift Card".</p>
                    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
                    <p style="font-size:12px;color:#999;">Questeduca · suporte@questeduca.pt</p>
                  </div>
                `,
              },
            });
          }
          break;
        }

        if (!metadata?.student_id) {
          console.error("No student_id in metadata");
          break;
        }

        const studentId = metadata.student_id;
        const plan = metadata.plan || "monthly";
        const associationCode = metadata.association_code;
        const giftCardCode = metadata.gift_card_code;
        const isFamilyExtraChild = metadata.family_extra_child === "true";

        const expiresAt = new Date();
        if (plan === "annual") {
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        } else {
          expiresAt.setMonth(expiresAt.getMonth() + 1);
        }

        const { error: updateError } = await supabaseAdmin
          .from("students")
          .update({
            is_premium: true,
            premium_expires_at: expiresAt.toISOString(),
            subscription_type: plan,
            updated_at: new Date().toISOString(),
          })
          .eq("id", studentId);

        if (updateError) {
          console.error("Error updating student:", updateError);
          throw updateError;
        }

        if (associationCode && !isFamilyExtraChild) {
          // When a promo/discount code was used, commission is 20% of amount actually paid.
          // When no discount, use full plan amount.
          const amountPaidEur = session.amount_total != null
            ? session.amount_total / 100
            : (PLAN_AMOUNTS[plan] ?? PLAN_AMOUNTS.monthly);
          const donationAmount = amountPaidEur * 0.20;

          const { data: association } = await supabaseAdmin
            .from("parent_associations")
            .select("id, total_raised")
            .eq("association_code", associationCode)
            .eq("status", "approved")
            .maybeSingle();

          if (association) {
            await supabaseAdmin
              .from("association_donations")
              .insert({
                association_id: association.id,
                student_id: studentId,
                amount: donationAmount,
                payment_id: session.payment_intent as string || session.id,
              });

            await supabaseAdmin
              .from("parent_associations")
              .update({ total_raised: (association.total_raised || 0) + donationAmount })
              .eq("id", association.id);

            console.log(`Association commission recorded: €${donationAmount} for ${associationCode} (plan: ${plan})`);
          }
        }

        if (giftCardCode) {
          const { data: card } = await supabaseAdmin
            .from("gift_cards")
            .select("id, premium_days, coins_value, diamonds_value, is_active, expires_at, current_redemptions, max_redemptions")
            .eq("code", giftCardCode)
            .maybeSingle();

          if (card && card.is_active && card.current_redemptions < card.max_redemptions && (!card.expires_at || new Date(card.expires_at) >= new Date())) {
            const { data: student } = await supabaseAdmin
              .from("students")
              .select("coins, diamonds, premium_expires_at")
              .eq("id", studentId)
              .maybeSingle();

            if (student) {
              const newExpiry = student.premium_expires_at
                ? new Date(new Date(student.premium_expires_at).getTime() + card.premium_days * 86400000).toISOString()
                : new Date(Date.now() + card.premium_days * 86400000).toISOString();

              await supabaseAdmin
                .from("students")
                .update({
                  coins: (student.coins || 0) + (card.coins_value || 0),
                  diamonds: (student.diamonds || 0) + (card.diamonds_value || 0),
                  ...(card.premium_days > 0 ? { premium_expires_at: newExpiry } : {}),
                })
                .eq("id", studentId);

              await supabaseAdmin
                .from("gift_cards")
                .update({ current_redemptions: card.current_redemptions + 1 })
                .eq("id", card.id);

              console.log(`Gift card ${giftCardCode} redeemed for student ${studentId}`);
            }
          }
        }

        await supabaseAdmin
          .from("notifications")
          .insert({
            student_id: studentId,
            title: "Premium Ativado!",
            message: `A tua subscrição ${plan === "annual" ? "anual" : "mensal"} foi ativada com sucesso!`,
            icon: "💎",
            type: "premium",
          });

        console.log(`Premium activated for student ${studentId}`);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const metadata = subscription.metadata;

        if (!metadata?.student_id) {
          console.error("No student_id in subscription metadata");
          break;
        }

        const studentId = metadata.student_id;
        const isActive = subscription.status === "active";

        if (!isActive) {
          await supabaseAdmin
            .from("students")
            .update({
              is_premium: false,
              premium_expires_at: null,
              subscription_type: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", studentId);

          await supabaseAdmin
            .from("notifications")
            .insert({
              student_id: studentId,
              title: "Subscrição Cancelada",
              message: "A tua subscrição premium foi cancelada.",
              icon: "ℹ️",
              type: "premium",
            });
        }

        console.log(`Subscription updated for student ${studentId}: ${subscription.status}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const metadata = subscription.metadata;

        if (!metadata?.student_id) {
          console.error("No student_id in subscription metadata");
          break;
        }

        const studentId = metadata.student_id;

        await supabaseAdmin
          .from("students")
          .update({
            is_premium: false,
            premium_expires_at: null,
            subscription_type: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", studentId);

        await supabaseAdmin
          .from("notifications")
          .insert({
            student_id: studentId,
            title: "Subscrição Terminada",
            message: "A tua subscrição premium terminou.",
            icon: "ℹ️",
            type: "premium",
          });

        console.log(`Subscription deleted for student ${studentId}`);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription;

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
          const metadata = subscription.metadata;

          if (metadata?.student_id) {
            const studentId = metadata.student_id;
            const plan = metadata.plan || "monthly";
            const associationCode = metadata.association_code;
            const isFamilyExtraChild = metadata.family_extra_child === "true";

            const expiresAt = new Date();
            if (plan === "annual") {
              expiresAt.setFullYear(expiresAt.getFullYear() + 1);
            } else {
              expiresAt.setMonth(expiresAt.getMonth() + 1);
            }

            await supabaseAdmin
              .from("students")
              .update({
                is_premium: true,
                premium_expires_at: expiresAt.toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("id", studentId);

            if (associationCode && !isFamilyExtraChild && invoice.billing_reason === "subscription_cycle") {
              const amountPaidEur = invoice.amount_paid != null
                ? invoice.amount_paid / 100
                : (PLAN_AMOUNTS[plan] ?? PLAN_AMOUNTS.monthly);
              const donationAmount = amountPaidEur * 0.20;

              const { data: association } = await supabaseAdmin
                .from("parent_associations")
                .select("id, total_raised")
                .eq("association_code", associationCode)
                .eq("status", "approved")
                .maybeSingle();

              if (association) {
                await supabaseAdmin
                  .from("association_donations")
                  .insert({
                    association_id: association.id,
                    student_id: studentId,
                    amount: donationAmount,
                    payment_id: invoice.payment_intent as string || invoice.id,
                  });

                await supabaseAdmin
                  .from("parent_associations")
                  .update({ total_raised: (association.total_raised || 0) + donationAmount })
                  .eq("id", association.id);

                console.log(`Renewal commission recorded: €${donationAmount} for ${associationCode}`);
              }
            }

            console.log(`Payment succeeded for student ${studentId}`);
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription;

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
          const metadata = subscription.metadata;

          if (metadata?.student_id) {
            const studentId = metadata.student_id;

            await supabaseAdmin
              .from("notifications")
              .insert({
                student_id: studentId,
                title: "Problema no Pagamento",
                message: "Houve um problema com o pagamento da tua subscrição. Verifica os teus dados de pagamento.",
                icon: "⚠️",
                type: "premium",
              });

            console.log(`Payment failed for student ${studentId}`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
