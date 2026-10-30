import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendMail } from "@/lib/mailer";
import { checkRateLimit } from "@/lib/rateLimit";

// Beta feedback from the in-app "Send feedback" panel and the per-position
// "Report a problem" links. Saved to public.feedback_reports (insert only,
// nobody can read it from the site) and announced to the owner by email.
// Either one working is enough for the report to count.
const RECIPIENT = "hunter@hushpolitics.com";

const KINDS = {
  bug: "Bug",
  wrong_info: "Wrong or missing info",
  suggestion: "Suggestion",
} as const;
type Kind = keyof typeof KINDS;

function clip(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

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
  if (!checkRateLimit(`feedback:${ip}`)) {
    return NextResponse.json({ ok: false, error: "Too many reports. Please try again in a few minutes." }, { status: 429 });
  }

  const kind = (typeof body.kind === "string" && body.kind in KINDS ? body.kind : "") as Kind | "";
  const message = clip(body.message, 4000);
  if (!kind) return NextResponse.json({ ok: false, error: "Pick what kind of feedback this is." }, { status: 400 });
  if (message.length < 3) return NextResponse.json({ ok: false, error: "Tell us a little more." }, { status: 400 });

  const page = clip(body.page, 500);
  const context = clip(body.context, 300);
  const userAgent = (request.headers.get("user-agent") ?? "").slice(0, 400);

  let saved = false;
  let userId: string | null = null;
  let userEmail: string | null = null;
  const supabase = await createClient();
  if (supabase) {
    try {
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id ?? null;
      userEmail = data.user?.email ?? null;
    } catch {
      // Anonymous report; still worth saving.
    }
    const { error } = await supabase.from("feedback_reports").insert({
      kind,
      message,
      page: page || null,
      context: context || null,
      user_id: userId,
      user_email: userEmail,
      user_agent: userAgent || null,
    });
    if (!error) saved = true;
    else console.error("feedback save failed:", error.message);
  }

  let notified = false;
  try {
    const ctxSuffix = context ? ` · ${context}` : "";
    const lines = [
      `${KINDS[kind]}${ctxSuffix}`,
      "",
      message,
      "",
      `Page: ${page || "unknown"}`,
      `From: ${userEmail ?? "not signed in"}`,
    ];
    await sendMail({
      to: RECIPIENT,
      subject: `HUSH. feedback · ${KINDS[kind]}${ctxSuffix}`.slice(0, 200),
      text: lines.join("\n"),
      ...(userEmail ? { replyTo: userEmail } : {}),
    });
    notified = true;
  } catch (e) {
    console.error("feedback notify failed:", e instanceof Error ? e.message : String(e));
  }

  if (!saved && !notified) {
    return NextResponse.json({ ok: false, error: "Something went wrong. Please try again." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
