import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendMail } from "@/lib/mailer";
import { checkRateLimit } from "@/lib/rateLimit";

// Footer "Join the movement" signups. Saved to public.footer_signups (insert
// only for the anon role, nobody can read it from the site) and announced to
// the owner by email. Either one working is enough for the signup to count.
// Never rendered or sent to the client.
const RECIPIENT = "hunter@hushpolitics.com";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: bots fill the hidden field, people never see it.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(`signup:${ip}`)) {
    return NextResponse.json({ ok: false, error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
  }

  let saved = false;
  let duplicate = false;
  const supabase = await createClient();
  if (supabase) {
    const { error } = await supabase.from("footer_signups").insert({ email });
    if (!error) saved = true;
    else if (error.code === "23505") duplicate = true;
    else console.error("signup save failed:", error.message);
  }

  // Already on the list: nothing to save and nothing new to announce.
  if (duplicate) return NextResponse.json({ ok: true });

  let notified = false;
  try {
    await sendMail({ to: RECIPIENT, subject: "HUSH. · New signup", text: `${email} joined from the footer.` });
    notified = true;
  } catch (e) {
    console.error("signup notify failed:", e instanceof Error ? e.message : String(e));
  }

  if (!saved && !notified) {
    return NextResponse.json({ ok: false, error: "Something went wrong. Please try again." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
