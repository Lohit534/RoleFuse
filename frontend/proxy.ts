import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") || "";

  // 1. Force 301 Permanent Redirect from any *.vercel.app domain to canonical production https://rolefuse.in
  if (host.endsWith(".vercel.app")) {
    const url = new URL(
      request.nextUrl.pathname + request.nextUrl.search,
      "https://rolefuse.in"
    );
    const redirectResponse = NextResponse.redirect(url, { status: 301 });
    redirectResponse.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    return redirectResponse;
  }

  // 2. Canonicalize www.rolefuse.in to rolefuse.in
  if (host === "www.rolefuse.in") {
    const url = new URL(
      request.nextUrl.pathname + request.nextUrl.search,
      "https://rolefuse.in"
    );
    return NextResponse.redirect(url, { status: 301 });
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Whenever an authenticated user visits the root landing page ("/"),
  // redirect them directly to the optimize dashboard ("/dashboard") on both mobile and desktop.
  if (request.nextUrl.pathname === "/") {
    const allCookies = request.cookies.getAll();
    const hasAuthCookie = allCookies.some(
      (c) =>
        c.name.startsWith("sb-") &&
        (c.name.includes("-auth-token") || c.name.includes("access-token")) &&
        c.value &&
        c.value.trim() !== ""
    );

    if (hasAuthCookie) {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = "/dashboard";
      return NextResponse.redirect(dashboardUrl);
    }

    if (
      supabaseUrl &&
      supabaseAnonKey &&
      !supabaseUrl.includes("placeholder-project")
    ) {
      try {
        const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
              response = NextResponse.next({ request });
              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options)
              );
            },
          },
        });

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const dashboardUrl = request.nextUrl.clone();
          dashboardUrl.pathname = "/dashboard";
          return NextResponse.redirect(dashboardUrl);
        }
      } catch {
        // Fallback handled in page.tsx
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
