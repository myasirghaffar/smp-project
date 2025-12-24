import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PAYMENT-INTENT] ${step}${detailsStr}`);
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
    const { missionId, amount, currency = "eur", metadata = {} } = await req.json();
    logStep("Request body parsed", { missionId, amount, currency });

    // Input validation
    if (!missionId || !amount) {
      logStep("Validation failed: missing fields", { missionId, amount });
      throw new Error("Missing required fields: missionId and amount");
    }

    if (amount < 50) {
      logStep("Validation failed: amount too low", { amount });
      throw new Error("Amount must be at least 0.50 EUR (50 cents minimum)");
    }

    if (amount > 999999) {
      logStep("Validation failed: amount too high", { amount });
      throw new Error("Amount exceeds maximum allowed");
    }

    logStep("Input validation passed");

    // Validate mission exists and user is the client
    logStep("Validating mission ownership");
    const { data: mission, error: missionError } = await supabaseClient
      .from("missions")
      .select("id, title, client_id")
      .eq("id", missionId)
      .eq("client_id", user.id)
      .single();

    if (missionError || !mission) {
      logStep("Mission validation failed", { missionError: missionError?.message });
      throw new Error("Mission not found or unauthorized");
    }
    logStep("Mission validated", { missionId, title: mission.title });

    // Check if there's an accepted application for this mission
    logStep("Checking for accepted application");
    const { data: application } = await supabaseClient
      .from("applications")
      .select("student_id, status")
      .eq("mission_id", missionId)
      .eq("status", "accepted")
      .maybeSingle();

    if (!application) {
      logStep("No accepted application found");
      throw new Error("No accepted application found for this mission");
    }

    const studentId = application.student_id;
    logStep("Accepted application found", { studentId });

    // Initialize Stripe
    logStep("Initializing Stripe client");
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check for existing Stripe customer
    logStep("Fetching user profile");
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .single();

    if (!profile?.email) {
      logStep("User email not found");
      throw new Error("User email not found");
    }
    logStep("User profile retrieved", { email: profile.email });

    const customers = await stripe.customers.list({ email: profile.email, limit: 1 });
    let customerId: string | undefined;

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      const customer = await stripe.customers.create({ email: profile.email });
      customerId = customer.id;
      logStep("New customer created", { customerId });
    }

    // Generate idempotency key for this payment
    const idempotencyKey = `payment_${missionId}_${Date.now()}`;
    logStep("Generated idempotency key", { idempotencyKey });

    // Get mission details
    const { data: missionData } = await supabaseClient
      .from("missions")
      .select("title")
      .eq("id", missionId)
      .single();

    // Get accepted application
    const { data: acceptedApp } = await supabaseClient
      .from("applications")
      .select("student_id")
      .eq("mission_id", missionId)
      .eq("status", "accepted")
      .single();

    if (!acceptedApp) throw new Error("No accepted application found");

    // Create a Checkout Session instead of PaymentIntent directly
    logStep("Creating Stripe Checkout Session", { amount, currency, missionId });
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      payment_intent_data: {
        capture_method: "manual", // Escrow: don't capture until mission completion
        metadata: {
          missionId,
          clientId: user.id,
          studentId: acceptedApp.student_id,
          ...metadata,
        },
      },
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            unit_amount: Math.round(amount),
            product_data: {
              name: `Mission: ${missionData?.title || 'Untitled'}`,
              description: `Paiement sécurisé pour la mission`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${req.headers.get("origin")}/missions/${missionId}?payment=success`,
      cancel_url: `${req.headers.get("origin")}/missions/${missionId}?payment=canceled`,
      metadata: {
        missionId,
        clientId: user.id,
        studentId: acceptedApp.student_id,
      },
    }, {
      idempotencyKey,
    });
    
    logStep("Checkout Session created", { sessionId: session.id, url: session.url });

    // Record payment in database with pending status
    logStep("Recording payment in database");
    const { error: paymentError } = await supabaseClient
      .from("payments")
      .insert({
        mission_id: missionId,
        client_id: user.id,
        student_id: acceptedApp.student_id,
        amount: amount / 100, // Convert back to decimal
        currency: currency.toLowerCase(),
        status: "pending",
        stripe_payment_intent_id: session.payment_intent as string,
        escrow_status: "held",
        metadata: { ...metadata, idempotencyKey, sessionId: session.id },
      });

    if (paymentError) {
      logStep("Database error", { error: paymentError.message });
      throw new Error(`Failed to create payment record: ${paymentError.message}`);
    }
    logStep("Payment record created in database");

    // Update mission payment status
    logStep("Updating mission payment status");
    const { error: missionUpdateError } = await supabaseClient
      .from("missions")
      .update({ payment_status: "pending" })
      .eq("id", missionId);

    if (missionUpdateError) {
      logStep("Mission update error", { error: missionUpdateError.message });
    }

    logStep("Payment process completed successfully", { 
      sessionId: session.id,
      paymentIntentId: session.payment_intent
    });

    return new Response(
      JSON.stringify({
        url: session.url,
        sessionId: session.id,
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
