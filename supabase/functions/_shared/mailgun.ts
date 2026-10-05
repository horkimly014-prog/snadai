// Shared Mailgun sender used by send-auction-win-email and
// send-submission-confirmation-email.
//
// Required secrets (set with `supabase secrets set`):
//   MAILGUN_API_KEY - private API key from the Mailgun dashboard
//   MAILGUN_DOMAIN  - sending domain, e.g. sandboxXXXX.mailgun.org
//                     (a sandbox domain only delivers to authorized
//                     recipients you add in the Mailgun dashboard)

const MAILGUN_DOMAIN = Deno.env.get("MAILGUN_DOMAIN") ?? "";
const MAILGUN_API_KEY = Deno.env.get("MAILGUN_API_KEY") ?? "";
const FROM_EMAIL = `Snadai <postmaster@${MAILGUN_DOMAIN}>`;

/** Escapes user-supplied text (names, titles, addresses) before it goes into email HTML. */
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatMoney(value: unknown): string {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

export async function sendMail(to: string, subject: string, html: string) {
  if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
    throw new Error("MAILGUN_API_KEY / MAILGUN_DOMAIN secrets are not set");
  }

  const formData = new FormData();
  formData.append("from", FROM_EMAIL);
  formData.append("to", to);
  formData.append("subject", subject);
  formData.append("html", html);

  const res = await fetch(
    `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`,
    {
      method: "POST",
      headers: { Authorization: `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}` },
      body: formData,
    }
  );

  if (!res.ok) {
    throw new Error(`Mailgun error ${res.status}: ${await res.text()}`);
  }
}
