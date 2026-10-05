// Supabase Edge Function: send-auction-win-email
//
// Called from Auction.jsx the moment a bidder's own countdown reaches
// zero. It never trusts the client's claim of "I won" — it re-reads the
// lot and its bids itself and only sends mail if the auction has really
// closed and the caller truly holds the highest bid, the same pattern
// create-payment-intent uses for order totals. The email goes to the
// address on the caller's Supabase auth account (whatever they signed up
// with, e.g. their Gmail).
//
// Required secrets: MAILGUN_API_KEY / MAILGUN_DOMAIN, see _shared/mailgun.ts.
//
// Deploy with:
//   supabase functions deploy send-auction-win-email

import { createClient } from "npm:@supabase/supabase-js@^2.45.0";
import { escapeHtml, formatMoney, sendMail } from "../_shared/mailgun.ts";

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

    // Scoped to the caller's own JWT, same as create-payment-intent, so the
    // bids lookup below runs under the same RLS the browser would see.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
      return json({ error: "Not authenticated" }, 401);
    }

    const { lotId, lotTitle } = await req.json();
    if (!lotId) {
      return json({ error: "lotId is required" }, 400);
    }

    const { data: lot, error: lotError } = await supabase
      .from("lots")
      .select("round, closes_at")
      .eq("id", lotId)
      .single();

    if (lotError || !lot) {
      return json({ error: lotError?.message ?? "Lot not found" }, 404);
    }

    // Whoever is leading mid-auction hasn't won yet.
    if (new Date(lot.closes_at).getTime() > Date.now()) {
      return json({ error: "The auction has not closed yet" }, 403);
    }

    // Scoped to the lot's current round: if a previous round was forfeited
    // and the lot reopened for bidding (see get_lot_winner in
    // 0004_lot_rounds_and_payment_deadline.sql), the old round's highest
    // bid must never be treated as the winner again.
    const { data: winningBid, error: bidError } = await supabase
      .from("bids")
      .select("user_id, amount")
      .eq("lot_id", lotId)
      .eq("round", lot.round)
      .order("amount", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (bidError) {
      return json({ error: bidError.message }, 500);
    }

    if (!winningBid || winningBid.user_id !== user.id) {
      return json({ error: "You are not the winning bidder for this lot" }, 403);
    }

    const lotNumber = lotId.replace(/^lot-/, "");
    const title = lotTitle || "your lot";
    const name =
      user.user_metadata?.full_name || user.user_metadata?.name || "there";

    try {
      await sendMail(
        user.email,
        "You Won the Auction! 🎉",
        `
          <h2>Congratulations, ${escapeHtml(name)}!</h2>
          <p>You are the winning bidder for Lot ${escapeHtml(lotNumber)} - "<strong>${escapeHtml(title)}</strong>"
          with a bid of <strong>${formatMoney(winningBid.amount)}</strong>.</p>
          <p>Please visit the auction results page to complete your payment.</p>
          <p>Best regards,<br>The Snadai Team</p>
        `
      );
    } catch (mailErr) {
      console.error("Mailgun error:", mailErr);
      return json({ error: "Failed to send email" }, 502);
    }

    return json({ sent: true });
  } catch (err) {
    console.error(err);
    return json({ error: err instanceof Error ? err.message : "Unexpected error" }, 500);
  }
});
