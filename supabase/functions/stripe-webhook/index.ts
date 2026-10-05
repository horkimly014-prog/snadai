// Supabase Edge Function: stripe-webhook
//
// Receives Stripe's `payment_intent.succeeded` event and is the ONLY place
// that ever marks an order "paid" for the Stripe/Card flow — never the
// client. Uses the service-role key to bypass RLS (orders has no update
// policy for regular users; see supabase/migrations/0002_...sql), because
// this call is authenticated by the verified Stripe webhook signature, not
// a Supabase JWT.
//
// Required secrets:
//   STRIPE_SECRET_KEY         - same key used by create-payment-intent
//   STRIPE_WEBHOOK_SECRET     - the signing secret for this endpoint (from
//                               the Stripe Dashboard, or `stripe listen`
//                               during local testing)
//   SUPABASE_SERVICE_ROLE_KEY - present automatically in the Edge Function
//                               runtime, no need to set it yourself
//
// Deploy with (must skip JWT verification — Stripe doesn't send a
// Supabase-issued token, it sends its own signed payload instead):
//   supabase functions deploy stripe-webhook --no-verify-jwt
//
// Then register this function's URL as a webhook endpoint in the Stripe
// Dashboard (or via `stripe listen --forward-to`) listening for
// payment_intent.succeeded, and copy the resulting signing secret into
// STRIPE_WEBHOOK_SECRET.

import Stripe from "npm:stripe@^17.0.0";
import { createClient } from "npm:@supabase/supabase-js@^2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

Deno.serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature");
  const body = await req.text();

  if (!signature) {
    return new Response("Missing Stripe-Signature header", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("Webhook signature verification failed:", message);
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const orderId = paymentIntent.metadata?.order_id;

    if (orderId) {
      const { error } = await supabaseAdmin
        .from("orders")
        .update({ status: "paid" })
        .eq("id", orderId)
        .eq("status", "pending");

      if (error) {
        console.error("Failed to mark order paid:", error.message);
        return new Response("Failed to update order", { status: 500 });
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
