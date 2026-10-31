import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session cookie on every request so Server Components
 * see a live session. No-ops entirely when Supabase is not configured -- the
 * app then renders with no records at all rather than falling back to a
 * dataset, so an unconfigured build is still deployable, just empty.
 */
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getUser();

  // Signed-in visitors who land on the bare home page (typed URL, bookmark,
  // search result) go straight to HUSH. Guide. The marketing logo links to
  // /?home=1, which skips this so they can still reach the landing page.
  const { pathname, searchParams } = request.nextUrl;
  if (data.user && pathname === "/" && !searchParams.has("home")) {
    const redirect = NextResponse.redirect(new URL("/hush-guide", request.url));
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
