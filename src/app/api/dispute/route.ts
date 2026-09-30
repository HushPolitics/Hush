import { NextResponse, type NextRequest } from "next/server";
import { sendMail } from "@/lib/mailer";
import { checkRateLimit } from "@/lib/rateLimit";

// Never rendered or sent to the client -- this route is the only place
// this address appears. See 08-dispute-and-contact.md: "Never show this
// address on the page."
const RECIPIENT = "hunter@hushpolitics.com";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: a real visitor never sees or fills this field (see
  // Dispute.tsx). A bot that fills every field gets a fake "ok" so it
  // doesn't learn to look for a different tell, but nothing is sent.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(`dispute:${ip}`)) {
    return NextResponse.json({ ok: false, error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const claim = typeof body.claim === "string" ? body.claim.trim() : "";
  const source = typeof body.source === "string" ? body.source.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  const errors: Record<string, string> = {};
  if (!email || !EMAIL_RE.test(email)) errors.email = "Enter a valid email address.";
  if (!claim) errors.claim = "Tell us which claim or page.";
  if (!source) errors.source = "A source is required.";
  if (!message) errors.message = "Tell us what's wrong.";
  if (Object.keys(errors).length) {
    return NextResponse.json({ ok: false, fieldErrors: errors }, { status: 400 });
  }

  const subject = `HUSH. dispute · ${claim}`;
  const text = [
    `Name: ${name || "(not provided)"}`,
    `Email: ${email}`,
    `Claim or page: ${claim}`,
    `Source: ${source}`,
    "",
    "What's wrong:",
    message,
  ].join("\n");

  try {
    // No Reply-To here -- the spec only asks for it on Contact. Dispute
    // submissions already carry the submitter's email in the body.
    await sendMail({ to: RECIPIENT, subject, text });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error("dispute send failed:", detail);
    return NextResponse.json({ ok: false, error: "Something went wrong. Please try again." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
