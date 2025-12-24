import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Webhook received");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No stripe-signature header");
    }

    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!webhookSecret) {
      logStep("WARNING: No webhook secret configured, skipping signature verification");
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      if (webhookSecret) {
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
        logStep("Signature verified", { eventType: event.type });
      } else {
        event = JSON.parse(body);
        logStep("Processing without signature verification", { eventType: event.type });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logStep("Signature verification failed", { error: errorMessage });
      return new Response(
        JSON.stringify({ error: "Webhook signature verification failed" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Handle different event types
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logStep("Payment succeeded", { 
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          metadata: paymentIntent.metadata
        });

        // Update payment record
        logStep("Updating payment record in database");
        const { error: updateError } = await supabaseClient
          .from("payments")
          .update({
            status: "succeeded",
            completed_at: new Date().toISOString(),
            stripe_payment_method_id: paymentIntent.payment_method as string,
          })
          .eq("stripe_payment_intent_id", paymentIntent.id);

        if (updateError) {
          logStep("Failed to update payment", { error: updateError.message });
        } else {
          logStep("Payment record updated successfully");
        }

        // Update mission payment status
        logStep("Fetching payment to update mission");
        const { data: payment, error: paymentFetchError } = await supabaseClient
          .from("payments")
          .select("mission_id")
          .eq("stripe_payment_intent_id", paymentIntent.id)
          .single();

        if (paymentFetchError) {
          logStep("Failed to fetch payment", { error: paymentFetchError.message });
        } else if (payment) {
          logStep("Updating mission payment status", { missionId: payment.mission_id });
          const { error: missionUpdateError } = await supabaseClient
            .from("missions")
            .update({
              payment_status: "paid",
              paid_at: new Date().toISOString(),
            })
            .eq("id", payment.mission_id);

          if (missionUpdateError) {
            logStep("Failed to update mission", { error: missionUpdateError.message });
          } else {
            logStep("Mission payment status updated successfully");
          }
        }

        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logStep("Payment failed", { 
          paymentIntentId: paymentIntent.id,
          lastPaymentError: paymentIntent.last_payment_error
        });

        const { error } = await supabaseClient
          .from("payments")
          .update({ status: "failed" })
          .eq("stripe_payment_intent_id", paymentIntent.id);

        if (error) {
          logStep("Failed to update payment status", { error: error.message });
        } else {
          logStep("Payment status updated to failed");
        }

        break;
      }

      case "payment_intent.canceled": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logStep("Payment canceled", { paymentIntentId: paymentIntent.id });

        await supabaseClient
          .from("payments")
          .update({ status: "canceled" })
          .eq("stripe_payment_intent_id", paymentIntent.id);

        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        logStep("Charge refunded", { 
          chargeId: charge.id,
          amount: charge.amount_refunded,
          refundReason: charge.refund_reason
        });

        if (charge.payment_intent) {
          logStep("Updating payment to refunded status");
          const { error: refundError } = await supabaseClient
            .from("payments")
            .update({
              status: "refunded",
              escrow_status: "refunded",
            })
            .eq("stripe_payment_intent_id", charge.payment_intent as string);

          if (refundError) {
            logStep("Failed to update payment to refunded", { error: refundError.message });
          }

          // Update mission payment status
          logStep("Fetching payment for mission update");
          const { data: payment, error: paymentError } = await supabaseClient
            .from("payments")
            .select("mission_id")
            .eq("stripe_payment_intent_id", charge.payment_intent as string)
            .single();

          if (paymentError) {
            logStep("Failed to fetch payment", { error: paymentError.message });
          } else if (payment) {
            logStep("Updating mission to refunded", { missionId: payment.mission_id });
            const { error: missionError } = await supabaseClient
              .from("missions")
              .update({ payment_status: "refunded" })
              .eq("id", payment.mission_id);

            if (missionError) {
              logStep("Failed to update mission", { error: missionError.message });
            } else {
              logStep("Mission refund status updated successfully");
            }
          }
        }

        break;
      }

      default:
        logStep("Unhandled event type", { eventType: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
