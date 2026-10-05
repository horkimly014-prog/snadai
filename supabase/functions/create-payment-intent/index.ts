// Supabase Edge Function: create-payment-intent
//
// Called from Payment.jsx as soon as the shopper picks "Card". It never
// trusts an amount from the client — it re-reads the caller's own "pending"
// order row (RLS-scoped to their user id) and creates the Stripe
// PaymentIntent from that order's grand_total, so a tampered client request
// can't change what gets charged. Returns a client secret that the browser
// uses to mount Stripe's embedded card fields (Stripe Elements /
// PaymentElement) directly on the Payment page.
//
// Required secret (set with `supabase secrets set`):
//   STRIPE_SECRET_KEY  - your Stripe secret key (sk_test_... / sk_live_...)
//
// Deploy with:
//   supabase functions deploy create-payment-intent

import Stripe from "npm:stripe@^17.0.0";
import { createClient } from "npm:@supabase/supabase-js@^2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing authorization header" }, 401);
    }

    // A client scoped to the caller's own JWT, so `.from("orders")` below
    // is subject to the same RLS policy as the browser (owner-only select).
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return json({ error: "Not authenticated" }, 401);
    }

    const { orderId } = await req.json();
    if (!orderId) {
      return json({ error: "orderId is required" }, 400);
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, grand_total, status")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (orderError || !order) {
      return json({ error: "Order not found" }, 404);
    }

    if (order.status !== "pending") {
      return json({ error: "Order is not payable" }, 400);
    }

    const amount = Math.round(Number(order.grand_total) * 100);
    if (!Number.isFinite(amount) || amount <= 0) {
      return json({ error: "Order has no payable amount" }, 400);
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      receipt_email: user.email,
      metadata: { order_id: String(order.id), user_id: user.id },
    });

    return json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error(err);
    return json({ error: err instanceof Error ? err.message : "Unexpected error" }, 500);
  }
});
