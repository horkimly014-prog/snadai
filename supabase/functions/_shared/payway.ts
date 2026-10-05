// Shared ABA PayWay helpers used by create-payway-transaction,
// payway-callback and payway-status.
//
// Required secrets (set with `supabase secrets set`):
//   PAYWAY_MERCHANT_ID - your ABA PayWay merchant id
//   PAYWAY_API_KEY     - your ABA PayWay API key (signs every request)
//   PAYWAY_BASE_URL    - optional; defaults to the sandbox. Set to
//                        https://checkout.payway.com.kh for production.

import type { SupabaseClient } from "npm:@supabase/supabase-js@^2.45.0";

export const PAYWAY_MERCHANT_ID = Deno.env.get("PAYWAY_MERCHANT_ID") ?? "";
export const PAYWAY_API_KEY = Deno.env.get("PAYWAY_API_KEY") ?? "";
export const PAYWAY_BASE_URL =
  Deno.env.get("PAYWAY_BASE_URL") ?? "https://checkout-sandbox.payway.com.kh";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** YYYYMMDDHHmmss in UTC, per PayWay's spec. */
export function reqTime(): string {
  return new Date().toISOString().replace(/\D/g, "").slice(0, 14);
}

export function b64(value: string): string {
  return btoa(value);
}

/** base64(HMAC-SHA512(api_key, values concatenated in PayWay's documented order)) */
export async function sign(...values: string[]): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(PAYWAY_API_KEY),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(values.join(""))
  );
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

/** Short id for PayWay's tran_id (max 20 chars); orders.id is a uuid and won't fit. */
export function newTranId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 20);
}

export type PaywayTransaction = {
  payment_status_code: number;
  payment_status: string;
  total_amount: number;
};

/**
 * Asks PayWay itself what really happened to a transaction. This is the
 * only trustworthy source of truth — the pushback PayWay posts to our
 * callback carries no signature, so anyone could forge it.
 *
 * Returns null when PayWay has no record yet (code 6 = tran_id not found,
 * which is normal until the customer actually pays).
 */
export async function checkTransaction(
  tranId: string
): Promise<PaywayTransaction | null> {
  const rt = reqTime();
  const hash = await sign(rt, PAYWAY_MERCHANT_ID, tranId);

  const res = await fetch(
    `${PAYWAY_BASE_URL}/api/payment-gateway/v1/payments/check-transaction-2`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        req_time: rt,
        merchant_id: PAYWAY_MERCHANT_ID,
        tran_id: tranId,
        hash,
      }),
    }
  );

  if (!res.ok) {
    console.error("check-transaction-2 HTTP error:", await res.text());
    return null;
  }

  const body = await res.json();
  if (String(body?.status?.code) !== "00") return null;
  return body.data ?? null;
}

export type SettleResult = "paid" | "pending" | "failed";

/**
 * Settles an order against PayWay's own record of the transaction.
 * Shared by payway-callback (PayWay pushes) and payway-status (browser
 * polls) so both paths apply exactly the same checks.
 */
export async function settleOrder(
  supabaseAdmin: SupabaseClient,
  tranId: string
): Promise<SettleResult> {
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("grand_total, status")
    .eq("payway_tran_id", tranId)
    .maybeSingle();

  if (!order) return "pending";
  if (order.status === "paid") return "paid";

  const tx = await checkTransaction(tranId);
  if (!tx) return "pending";

  // 0 = APPROVED, 2 = PENDING, 3 = DECLINED, 4 = REFUNDED, 7 = CANCELLED
  if (tx.payment_status_code === 3 || tx.payment_status_code === 7) {
    return "failed";
  }
  if (tx.payment_status_code !== 0) return "pending";

  // An APPROVED status alone doesn't prove the right amount was collected.
  // Compared in cents to avoid float drift.
  const expected = Math.round(Number(order.grand_total) * 100);
  const paid = Math.round(Number(tx.total_amount) * 100);
  if (paid !== expected) {
    console.error(
      `Amount mismatch for ${tranId}: order expects ${expected}, PayWay reports ${paid}.`
    );
    return "pending";
  }

  // Guarded on status='pending' so a callback and a poll landing at the
  // same time can't settle the same order twice.
  const { error } = await supabaseAdmin
    .from("orders")
    .update({ status: "paid" })
    .eq("payway_tran_id", tranId)
    .eq("status", "pending");

  if (error) {
    console.error("Failed to mark order paid:", error.message);
    return "pending";
  }

  return "paid";
}
