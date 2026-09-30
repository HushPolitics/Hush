/**
 * Thin wrapper around Resend's HTTP API -- no SDK dependency, just a
 * fetch call, per the spec's own suggestion ("a service like
 * Formspree/Resend/Postmark"). Needs RESEND_API_KEY set in the
 * environment; until then every send fails closed with a clear error
 * rather than silently dropping the message, so the caller can show the
 * retryable error state instead of a false "sent."
 *
 * FROM_EMAIL defaults to Resend's own sandbox sender, which works without
 * verifying a domain but can only deliver to the Resend account's own
 * verified address -- swap CONTACT_FROM_EMAIL for a verified
 * hushpolitics.com sender before launch.
 */
const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || "HUSH. <onboarding@resend.dev>";

export async function sendMail(opts: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [opts.to],
      subject: opts.subject,
      text: opts.text,
      ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend API error ${res.status}: ${detail.slice(0, 300)}`);
  }
}
