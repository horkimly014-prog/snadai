// Supabase Edge Function: create-payway-transaction
//
// Called from Payment.jsx when the shopper picks a payment method. It
// never trusts an amount from the client — it re-reads the caller's own
// "pending" order row (RLS-scoped to their user id) and builds the PayWay
// request from that order's grand_total, so a tampered client request
// can't change what gets charged.
//
//   method: "card" -> returns signed form fields for PayWay's checkout
//                     widget (see checkout2-0.js in Payment.jsx)
//   method: "khqr" -> calls PayWay's generate-qr API and returns the
//                     ready-made KHQR image + ABA app deeplink
//
// Secrets: see _shared/payway.ts. SITE_URL is also required (your site's
// public origin, used for continue_success_url/cancel_url).
//
// Deploy with:
//   supabase functions deploy create-payway-transaction

import { createClient } from "npm:@supabase/supabase-js@^2.45.0";
import {
  PAYWAY_API_KEY,
  PAYWAY_BASE_URL,
  PAYWAY_MERCHANT_ID,
  b64,
  corsHeaders,
  json,
  newTranId,
  reqTime,
  sign,
} from "../_shared/payway.ts";

const SITE_URL = Deno.env.get("SITE_URL") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";

/** Minutes a KHQR code stays scannable; mirrors the countdown in Payment.jsx. */
const KHQR_LIFETIME_MINUTES = 5;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!PAYWAY_MERCHANT_ID || !PAYWAY_API_KEY) {
      console.error("PAYWAY_MERCHANT_ID or PAYWAY_API_KEY is not set.");
      return json({ error: "Payment is not configured" }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing authorization header" }, 401);
    }

    // Scoped to the caller's own JWT, so `.from("orders")` below is subject
    // to the same RLS policy as the browser (owner-only select).
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

    const { orderId, method = "card" } = await req.json();
    if (!orderId) {
      return json({ error: "orderId is required" }, 400);
    }
    if (method !== "card" && method !== "khqr") {
      return json({ error: "method must be 'card' or 'khqr'" }, 400);
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, grand_total, status, items")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (orderError || !order) {
      return json({ error: "Order not found" }, 404);
    }

    if (order.status !== "pending") {
      return json({ error: "Order is not payable" }, 400);
    }

    const amount = Number(order.grand_total);
    if (!Number.isFinite(amount) || amount <= 0) {
      return json({ error: "Order has no payable amount" }, 400);
    }

    const tranId = newTranId();

    // Orders has no update policy for regular users (append-only once
    // placed, see 0002_secure_orders_favorites_submissions.sql), so this
    // one narrowly-scoped write uses the service-role key. The row was
    // already confirmed to belong to this user and be pending above.
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({ payway_tran_id: tranId })
      .eq("id", orderId)
      .eq("user_id", user.id)
      .eq("status", "pending");

    if (updateError) {
      console.error("Failed to store payway_tran_id:", updateError.message);
      return json({ error: "Could not start payment" }, 500);
    }

    // Shown on PayWay's screens only; PayWay explicitly does not use these
    // for any calculation, so `amount` above stays authoritative.
    const itemList = Array.isArray(order.items)
      ? order.items.slice(0, 20).map((item: Record<string, unknown>) => ({
          name: String(item?.title ?? item?.name ?? "Artwork").slice(0, 60),
          quantity: Number(item?.quantity ?? 1),
          price: Number(item?.price ?? 0),
        }))
      : [{ name: "Order", quantity: 1, price: amount }];

    const items = b64(JSON.stringify(itemList));
    const amountStr = amount.toFixed(2);
    const callbackUrl = b64(`${SUPABASE_URL}/functions/v1/payway-callback`);
    const rt = reqTime();
    const email = user.email ?? "";

    if (method === "khqr") {
      // QR API hash order (19 fields): req_time, merchant_id, tran_id,
      // amount, items, first_name, last_name, email, phone, purchase_type,
      // payment_option, callback_url, return_deeplink, currency,
      // custom_fields, return_params, payout, lifetime, qr_image_template.
      const lifetime = String(KHQR_LIFETIME_MINUTES);
      const template = "template3_color";
      const hash = await sign(
        rt, PAYWAY_MERCHANT_ID, tranId, amountStr, items, "", "", email, "", "",
        "abapay_khqr", callbackUrl, "", "USD", "", "", "", lifetime, template
      );

      const qrRes = await fetch(
        `${PAYWAY_BASE_URL}/api/payment-gateway/v1/payments/generate-qr`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            req_time: rt,
            merchant_id: PAYWAY_MERCHANT_ID,
            tran_id: tranId,
            amount: amountStr,
            items,
            email,
            payment_option: "abapay_khqr",
            callback_url: callbackUrl,
            currency: "USD",
            lifetime: KHQR_LIFETIME_MINUTES,
            qr_image_template: template,
            hash,
          }),
        }
      );

      const qrBody = await qrRes.json();
      // The QR API signals success with "0"; check-transaction uses "00".
      if (String(qrBody?.status?.code) !== "0" || !qrBody?.qrImage) {
        console.error("generate-qr failed:", JSON.stringify(qrBody?.status));
        return json({ error: "Could not generate the QR code" }, 502);
      }

      return json({
        method: "khqr",
        tranId,
        qrImage: qrBody.qrImage,
        deeplink: qrBody.abapay_deeplink ?? null,
        expiresInSeconds: KHQR_LIFETIME_MINUTES * 60,
        // Surfaced so the page can say out loud that payment will be
        // simulated. See the DEMO MODE banner in payway-status.
        demoMode: Deno.env.get("PAYWAY_DEMO_MODE") === "true",
      });
    }

    // --- card ---
    const returnUrl = b64(`${SUPABASE_URL}/functions/v1/payway-callback`);
    const cancelUrl = `${SITE_URL}/payment?order_id=${orderId}&canceled=1`;
    const continueSuccessUrl = `${SITE_URL}/payment/success?order_id=${orderId}`;

    // Purchase hash order: req_time, merchant_id, tran_id, amount, items,
    // ..., email, ..., payment_option, return_url, cancel_url,
    // continue_success_url, ..., currency, ..., skip_success_page.
    const fields: [string, string][] = [
      ["req_time", rt],
      ["merchant_id", PAYWAY_MERCHANT_ID],
      ["tran_id", tranId],
      ["amount", amountStr],
      ["items", items],
      ["email", email],
      ["payment_option", "cards"],
      ["return_url", returnUrl],
      ["cancel_url", cancelUrl],
      ["continue_success_url", continueSuccessUrl],
      ["currency", "USD"],
      ["skip_success_page", "1"],
    ];

    const hash = await sign(...fields.map(([, value]) => value));

    const params: Record<string, string> = Object.fromEntries(fields);
    params.hash = hash;

    // Undocumented but REQUIRED for the card form: without payment_gate=0
    // PayWay ignores payment_option=cards and returns an ABA PAY KHQR
    // payload instead of the card checkout page. It is deliberately NOT
    // part of the hash — including it there fails with "Wrong Hash".
    params.payment_gate = "0";

    return json({
      method: "card",
      tranId,
      checkoutUrl: `${PAYWAY_BASE_URL}/api/payment-gateway/v1/payments/purchase`,
      params,
    });
  } catch (err) {
    console.error(err);
    return json({ error: err instanceof Error ? err.message : "Unexpected error" }, 500);
  }
});
