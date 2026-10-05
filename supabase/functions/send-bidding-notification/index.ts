// Supabase Edge Function: send-bidding-notification
//
// Emails the previous highest bidder when someone outbids them. It is
// called only by a Supabase Database Webhook on INSERT into public.bids,
// never by the browser: the bidder placing a bid can't (and shouldn't) see
// anyone else's email address, so this function looks up the outbid user
// itself with the service-role key.
//
// The webhook authenticates with a shared secret header instead of a
// Supabase JWT, so any request without it is rejected.
//
// Required secrets (set with `supabase secrets set`):
//   BIDS_WEBHOOK_SECRET - any long random string; the Database Webhook
//                         must send it in an `x-webhook-secret` header
//   MAILGUN_API_KEY / MAILGUN_DOMAIN - see _shared/mailgun.ts
//
// Deploy with (the Database Webhook sends no Supabase user token):
//   supabase functions deploy send-bidding-notification --no-verify-jwt
//
// Then in the Dashboard: Database -> Webhooks -> Create a new hook
//   Table: bids, Events: Insert, Type: Supabase Edge Functions,
//   Function: send-bidding-notification,
//   HTTP header: x-webhook-secret = <the BIDS_WEBHOOK_SECRET value>

import { createClient } from "npm:@supabase/supabase-js@^2.45.0";
import { escapeHtml, formatMoney, sendMail } from "../_shared/mailgun.ts";

const WEBHOOK_SECRET = Deno.env.get("BIDS_WEBHOOK_SECRET") ?? "";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

type BidRow = {
  id: string;
  lot_id: string;
  round: number;
  user_id: string;
  bidder_name: string;
  amount: number | string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (!WEBHOOK_SECRET || req.headers.get("x-webhook-secret") !== WEBHOOK_SECRET) {
    return json({ error: "Unauthorized" }, 401);
  }

  try {
    const payload = await req.json();
    const bid: BidRow | undefined = payload?.record;
    if (payload?.type !== "INSERT" || payload?.table !== "bids" || !bid) {
      return json({ skipped: "not a bids insert" });
    }

    // The bid that was on top right before this one. check_bid_amount
    // guarantees every new bid beats all earlier ones, so it's simply the
    // highest remaining bid in the same lot and round.
    const { data: previous, error: prevError } = await supabaseAdmin
      .from("bids")
      .select("user_id, amount")
      .eq("lot_id", bid.lot_id)
      .eq("round", bid.round)
      .neq("id", bid.id)
      .order("amount", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (prevError) throw new Error(prevError.message);
    if (!previous) return json({ skipped: "first bid on this lot" });
    if (previous.user_id === bid.user_id) {
      return json({ skipped: "bidder raised their own bid" });
    }

    const { data: userData, error: userError } =
      await supabaseAdmin.auth.admin.getUserById(previous.user_id);
    const user = userData?.user;
    if (userError || !user?.email) {
      throw new Error(userError?.message ?? "Outbid user has no email");
    }

    const name =
      user.user_metadata?.full_name || user.user_metadata?.name || "there";
    const lotNumber = bid.lot_id.replace(/^lot-/, "");

    const html = `
      <h2>You've Been Outbid!</h2>
      <p>Hi ${escapeHtml(name)},</p>
      <p>Someone has placed a higher bid on Lot ${escapeHtml(lotNumber)}.</p>
      <div style="background-color: #fff3cd; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #ffc107;">
        <p><strong>New Highest Bid:</strong> ${formatMoney(bid.amount)}</p>
        <p><strong>Your Bid:</strong> ${formatMoney(previous.amount)}</p>
      </div>
      <p>If you'd like to stay in the running, visit the auction page and bid again before it closes.</p>
      <p style="margin-top: 30px; font-size: 12px; color: #666;">
        This is an automated notification. Please do not reply to this email.
      </p>
      <p>Best regards,<br>The Snadai Team</p>
    `;

    await sendMail(user.email, `You've been outbid on Lot ${lotNumber}`, html);
    return json({ sent: true });
  } catch (error) {
    console.error("send-bidding-notification failed:", error);
    return json(
      { error: error instanceof Error ? error.message : String(error) },
      500
    );
  }
});
