import { createServiceClient } from "@/lib/supabase/server";
import { sendMail } from "@/lib/mailer";

// "Someone created an account" alert to the owner. Plain text, no passwords,
// hashes, tokens or confirmation links, ever. Once per account: the first
// successful send stamps app_metadata.signup_alert_sent_at on the auth user,
// and every later call (login, magic link, email-confirmation link, password
// reset) sees the stamp and does nothing.
const RECIPIENT = "hunter@hushpolitics.com";
// Only accounts created recently can trigger an alert, so an old account
// signing in can never look like a new one.
const MAX_ACCOUNT_AGE_MS = 48 * 60 * 60 * 1000;

const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]+/g, " ").trim().slice(0, max) : "";

/** Never throws. Generic log line on failure, nothing identifying. */
export async function notifyNewAccount(userId: string): Promise<void> {
  try {
    // Previews and local dev without a Resend key stay silent.
    if (!process.env.RESEND_API_KEY) return;
    const supabase = createServiceClient();
    if (!supabase) return;

    const { data, error } = await supabase.auth.admin.getUserById(userId);
    const user = data?.user;
    if (error || !user || !user.email) return;
    if (user.app_metadata?.signup_alert_sent_at) return;

    const created = new Date(user.created_at).getTime();
    if (!Number.isFinite(created) || Date.now() - created > MAX_ACCOUNT_AGE_MS) return;

    const meta = user.user_metadata ?? {};
    const first = clean(meta.first_name, 80);
    const last = clean(meta.last_name, 80);
    const name = [first, last].filter(Boolean).join(" ") || clean(meta.full_name, 160);
    const email = clean(user.email, 254);

    const when = new Date(created).toLocaleString("en-US", {
      timeZone: "America/New_York",
      dateStyle: "medium",
      timeStyle: "short",
    });

    await sendMail({
      to: RECIPIENT,
      subject: name ? `New HUSH. account: ${name} (${email})` : `New HUSH. account: ${email}`,
      text: [...(name ? [`Name: ${name}`] : []), `Email: ${email}`, `Signed up: ${when} ET`].join("\n"),
    });

    const { error: stampError } = await supabase.auth.admin.updateUserById(userId, {
      app_metadata: { ...user.app_metadata, signup_alert_sent_at: new Date().toISOString() },
    });
    if (stampError) console.error("account alert: could not mark alert as sent");
  } catch {
    console.error("account alert failed");
  }
}
