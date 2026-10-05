// Supabase Edge Function: payway-callback
//
// Registered as return_url/callback_url in create-payway-transaction, and
// together with payway-status one of only two places that ever mark an
// order "paid" — never the client.
//
// PayWay's docs specify no signature for this pushback (unlike Stripe's
// Stripe-Signature header), so anyone could POST here. Its claimed status
// is therefore ignored entirely: the tran_id is treated as nothing more
// than a hint to go ask PayWay's own check-transaction-2 API — which IS
// signed with our api key — what actually happened. See settleOrder in
// _shared/payway.ts.
//
// Secrets: see _shared/payway.ts. SUPABASE_SERVICE_ROLE_KEY is present
// automatically in the Edge Function runtime.
//
// Deploy with (must skip JWT verification — PayWay sends no Supabase token):
//   supabase functions deploy payway-callback --no-verify-jwt

import { createClient } from "npm:@supabase/supabase-js@^2.45.0";
import { settleOrder } from "../_shared/payway.ts";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// PayWay retries on a non-2xx, so every path here answers 200 — a failure
// on our side shouldn't make it hammer the endpoint.
function ack() {
  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const tranId = body?.tran_id;
    if (!tranId) return ack();

    const result = await settleOrder(supabaseAdmin, String(tranId));
    console.log(`payway-callback: ${tranId} -> ${result}`);

    return ack();
  } catch (err) {
    console.error(err);
    return ack();
  }
});
