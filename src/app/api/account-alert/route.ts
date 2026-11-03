import { NextResponse, after, type NextRequest } from "next/server";
import { notifyNewAccount } from "@/lib/accountAlert";
import { checkRateLimit } from "@/lib/rateLimit";

// Called by the signup wizard right after supabase.auth.signUp succeeds.
// The browser only passes the new user's id; the name and email in the alert
// are read from the auth record on the server, and an unknown, old or
// already-announced id sends nothing. Always answers ok so it can't be used
// to probe for accounts.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(`account-alert:${ip}`)) return NextResponse.json({ ok: true });

  let userId = "";
  try {
    const body = await request.json();
    if (typeof body?.userId === "string") userId = body.userId;
  } catch {
    // fall through with an empty id
  }
  if (UUID_RE.test(userId)) after(() => notifyNewAccount(userId));
  return NextResponse.json({ ok: true });
}
