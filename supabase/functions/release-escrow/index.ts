import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[RELEASE-ESCROW] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Authenticate user - create client with anon key for auth verification
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("No authorization header");
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Create auth client to verify user
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userError } = await authClient.auth.getUser();
    if (userError) {
      logStep("Auth verification failed", { error: userError.message });
      throw new Error(`Authentication failed: ${userError.message}`);
    }
    
    if (!userData.user) {
      logStep("No user data returned");
      throw new Error("Authentication failed: No user data");
    }

    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    // Create admin client for database operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Parse request body
    const { paymentIntentId } = await req.json();
    logStep("Request received", { paymentIntentId });

    if (!paymentIntentId) {
      logStep("Missing paymentIntentId");
      throw new Error("Missing paymentIntentId");
    }

    // Get payment record
    logStep("Fetching payment record from database");
    const { data: payment, error: paymentError } = await supabaseClient
      .from("payments")
      .select("*, missions!inner(client_id, status)")
      .eq("stripe_payment_intent_id", paymentIntentId)
      .single();

    if (paymentError || !payment) {
      logStep("Payment not found", { error: paymentError?.message });
      throw new Error("Payment not found");
    }

    logStep("Payment record retrieved", { 
      paymentId: payment.id,
      amount: payment.amount,
      status: payment.status,
      escrowStatus: payment.escrow_status,
      missionStatus: payment.missions.status
    });

    // Verify user is the client who made the payment
    logStep("Verifying client authorization");
    if (payment.missions.client_id !== user.id) {
      logStep("Authorization failed", { 
        clientId: payment.missions.client_id,
        requestingUserId: user.id 
      });
      throw new Error("Unauthorized: You are not the client for this payment");
    }
    logStep("Client authorized");

    // Verify mission is completed
    logStep("Verifying mission completion status");
    if (payment.missions.status !== "completed") {
      logStep("Mission not completed", { status: payment.missions.status });
      throw new Error("Cannot release escrow: Mission is not marked as completed");
    }
    logStep("Mission completion verified");

    // Verify payment status
    logStep("Verifying payment status");
    if (payment.status !== "succeeded") {
      logStep("Payment not succeeded", { status: payment.status });
      throw new Error("Cannot release escrow: Payment has not succeeded");
    }

    if (payment.escrow_status === "released") {
      logStep("Escrow already released");
      throw new Error("Escrow has already been released");
    }
    logStep("Payment status verified, ready to release escrow");

    // Initialize Stripe
    logStep("Initializing Stripe client");
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Capture the payment (release from escrow)
    logStep("Capturing payment in Stripe", { paymentIntentId });
    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
    logStep("Payment captured successfully in Stripe", { 
      paymentIntentId,
      status: paymentIntent.status,
      amountCaptured: paymentIntent.amount_capturable
    });

    // Update payment record
    logStep("Updating payment record in database");
    const { error: updateError } = await supabaseClient
      .from("payments")
      .update({
        escrow_status: "released",
        completed_at: new Date().toISOString(),
      })
      .eq("stripe_payment_intent_id", paymentIntentId);

    if (updateError) {
      logStep("Failed to update payment record", { error: updateError.message });
      throw new Error(`Failed to update payment record: ${updateError.message}`);
    }

    logStep("Escrow released successfully - payment complete");

    return new Response(
      JSON.stringify({
        success: true,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        escrowStatus: "released",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
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
