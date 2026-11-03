import { NextResponse, after, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notifyNewAccount } from "@/lib/accountAlert";

/** Exchanges the magic-link code for a session, then lands the user in HUSH. Guide. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/hush-guide";

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        // A magic link on /login can create an account too. notifyNewAccount
        // only acts on an account that is new and not yet announced, so
        // confirmation links and returning sign-ins do nothing.
        const { data } = await supabase.auth.getUser();
        const id = data.user?.id;
        if (id) after(() => notifyNewAccount(id));
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=link_expired`);
}
