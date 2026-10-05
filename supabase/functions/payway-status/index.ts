// Supabase Edge Function: payway-status
//
// Polled by Payment.jsx while a KHQR code is on screen. A KHQR payment
// happens entirely inside the customer's banking app, so the browser gets
// no redirect back — the only way it learns the payment landed is to ask.
//
// This does not merely read the order row: it runs the same settleOrder
// check as payway-callback, so payment still completes even if PayWay's
// pushback never arrives (or is delayed). Both paths guard their update
// on status='pending', so whichever gets there first wins and the other
// is a no-op.
//
// Secrets: see _shared/payway.ts.
//
// Deploy with:
//   supabase functions deploy payway-status

import { createClient } from "npm:@supabase/supabase-js@^2.45.0";
import { corsHeaders, json, settleOrder } from "../_shared/payway.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";

// ---------------------------------------------------------------------
// DEMO MODE — marks orders PAID WITHOUT ANY PAYMENT.
//
// Exists only because a sandbox KHQR code can't be paid with a real
// banking app, which makes the scan-to-pay flow impossible to demo.
// After DEMO_SETTLE_AFTER_SECONDS a pending order is settled as if PayWay
// had approved it.
//
// MUST NEVER BE ON IN PRODUCTION — with this enabled, anyone who reaches
// the payment page gets a free paid order. It is off unless the secret is
// set to exactly "true":
//
//   enable:   supabase secrets set PAYWAY_DEMO_MODE=true
//   disable:  supabase secrets unset PAYWAY_DEMO_MODE
//
// Every simulated settle is logged, and the response carries demo:true so
// the UI can say out loud that the payment was faked.
// ---------------------------------------------------------------------
const DEMO_MODE = Deno.env.get("PAYWAY_DEMO_MODE") === "true";
const DEMO_SETTLE_AFTER_SECONDS = 8;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing authorization header" }, 401);
    }

    const supabase = createClient(
      SUPABASE_URL,
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

    // RLS-scoped read first: this proves the caller owns the order before
    // its tran_id is used for anything.
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("status, payway_tran_id, created_at")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (orderError || !order) {
      return json({ error: "Order not found" }, 404);
    }

    if (order.status === "paid") return json({ status: "paid" });
    if (!order.payway_tran_id) return json({ status: "pending" });

    const supabaseAdmin = createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const result = await settleOrder(supabaseAdmin, order.payway_tran_id);
    if (result !== "pending") return json({ status: result });

    // See the DEMO MODE banner at the top of this file. Nothing below here
    // involves an actual payment.
    if (DEMO_MODE) {
      const ageSeconds = (Date.now() - new Date(order.created_at).getTime()) / 1000;
      if (ageSeconds >= DEMO_SETTLE_AFTER_SECONDS) {
        const { error: demoError } = await supabaseAdmin
          .from("orders")
          .update({ status: "paid" })
          .eq("id", orderId)
          .eq("status", "pending");

        if (demoError) {
          console.error("DEMO MODE: failed to settle:", demoError.message);
          return json({ status: "pending" });
        }

        console.warn(
          `DEMO MODE: order ${orderId} marked PAID WITHOUT PAYMENT after ${Math.round(ageSeconds)}s.`
        );
        return json({ status: "paid", demo: true });
      }
    }

    return json({ status: "pending" });
  } catch (err) {
    console.error(err);
    return json({ error: err instanceof Error ? err.message : "Unexpected error" }, 500);
  }
});
