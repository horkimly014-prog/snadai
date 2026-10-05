// Supabase Edge Function: send-submission-confirmation-email
//
// Called from Submissions.jsx right after an artist submission row is
// inserted. It never trusts the client's claim of what the submission
// says — it re-reads the row itself (scoped to the caller's own JWT, so
// RLS from 0002_secure_orders_favorites_submissions.sql already limits
// this to the caller's own submissions) and sends confirmation mail to
// the email address stored on that row.
//
// Required secrets (set with `supabase secrets set`):
//   BREVO_API_KEY    - API key from https://app.brevo.com/settings/keys/api
//   BREVO_FROM_EMAIL - a sender address verified in Brevo
//                      (Senders, Domains & Dedicated IPs -> Senders).
//                      Sending will fail with an unverified address.
//   BREVO_FROM_NAME  - optional; defaults to "Snadai Submissions".
//
// Deploy with:
//   supabase functions deploy send-submission-confirmation-email

import { createClient } from "npm:@supabase/supabase-js@^2.45.0";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY") ?? "";
const FROM_EMAIL = Deno.env.get("BREVO_FROM_EMAIL") ?? "";
const FROM_NAME = Deno.env.get("BREVO_FROM_NAME") ?? "Snadai Submissions";

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

    const { submissionId } = await req.json();
    if (!submissionId) {
      return json({ error: "submissionId is required" }, 400);
    }

    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .select("full_name, email, artwork_title")
      .eq("id", submissionId)
      .eq("user_id", user.id)
      .single();

    if (submissionError || !submission) {
      return json({ error: submissionError?.message ?? "Submission not found" }, 404);
    }

    if (!BREVO_API_KEY || !FROM_EMAIL) {
      console.error("BREVO_API_KEY or BREVO_FROM_EMAIL is not set; skipping email send.");
      return json({ error: "Email is not configured" }, 500);
    }

    const emailRes = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: FROM_NAME, email: FROM_EMAIL },
        to: [{ email: submission.email, name: submission.full_name || undefined }],
        subject: "We received your art submission",
        htmlContent: `
          <h2>Thank you for your submission, ${submission.full_name}!</h2>
          <p>We've received your artwork "<strong>${submission.artwork_title}</strong>".</p>
          <p>Our team will review it and get back to you soon.</p>
          <p>Best regards,<br>The Snadai Team</p>
        `,
      }),
    });

    if (!emailRes.ok) {
      const detail = await emailRes.text();
      console.error("Brevo API error:", detail);
      return json({ error: "Failed to send email" }, 502);
    }

    return json({ sent: true });
  } catch (err) {
    console.error(err);
    return json({ error: err instanceof Error ? err.message : "Unexpected error" }, 500);
  }
});
