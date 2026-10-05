// Supabase Edge Function: send-submission-decision-email
//
// Called from AdminSubmissions.jsx right after an admin approves or
// rejects a submission. The caller must be an authenticated admin (checked
// against public.admin_users) — unlike send-submission-confirmation-email,
// the submission being emailed about belongs to a different user, so this
// relies on the "Admins can view all submissions" RLS policy instead of a
// user_id match.
//
// Required secrets (already set for send-submission-confirmation-email):
//   BREVO_API_KEY    - API key from https://app.brevo.com/settings/keys/api
//   BREVO_FROM_EMAIL - a sender address verified in Brevo
//   BREVO_FROM_NAME  - optional; defaults to "Snadai Submissions".
//
// Deploy with:
//   supabase functions deploy send-submission-decision-email

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

const DECISION_COPY: Record<string, { subject: string; heading: string; body: string }> = {
  approved: {
    subject: "Your art submission has been approved",
    heading: "Great news",
    body: "Your submission has been <strong>approved</strong>. Our team will be in touch with next steps.",
  },
  rejected: {
    subject: "An update on your art submission",
    heading: "Submission update",
    body: "After review, your submission was <strong>not selected</strong> this time. Thank you for sharing your work with us.",
  },
};

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

    const { data: adminRow } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!adminRow) {
      return json({ error: "Not authorized" }, 403);
    }

    const { submissionId, status } = await req.json();
    const copy = DECISION_COPY[status];
    if (!submissionId || !copy) {
      return json({ error: "submissionId and a valid status are required" }, 400);
    }

    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .select("full_name, email, artwork_title")
      .eq("id", submissionId)
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
        subject: copy.subject,
        htmlContent: `
          <h2>${copy.heading}, ${submission.full_name}!</h2>
          <p>Your artwork "<strong>${submission.artwork_title}</strong>" — ${copy.body}</p>
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
