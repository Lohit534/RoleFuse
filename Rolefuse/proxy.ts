import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  // 1. Force 301 Permanent Redirect from any *.vercel.app domain to canonical production https://rolefuse.in
  // Allow Google Search Console HTML verification file (e.g. /google*.html) through without redirecting
  if (host.endsWith(".vercel.app")) {
    if (
      pathname.startsWith("/google") &&
      pathname.endsWith(".html")
    ) {
      return NextResponse.next();
    }
    const url = new URL(
      pathname + request.nextUrl.search,
      "https://rolefuse.in"
    );
    const redirectResponse = NextResponse.redirect(url, { status: 301 });
    redirectResponse.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    return redirectResponse;
  }

  // 2. Canonicalize www.rolefuse.in to rolefuse.in
  if (host === "www.rolefuse.in") {
    const url = new URL(
      pathname + request.nextUrl.search,
      "https://rolefuse.in"
    );
    return NextResponse.redirect(url, { status: 301 });
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isAuthRoute = pathname.startsWith("/auth");

  // Always set X-Robots-Tag: noindex, nofollow header on dashboard and auth responses
  if (isDashboardRoute || isAuthRoute) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isSupabaseConfigured = Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes("placeholder-project") &&
    supabaseAnonKey !== "placeholder-anon-key"
  );

  // 3. Protect dashboard routes with server-side authentication
  if (isDashboardRoute) {
    const userAgent = request.headers.get("user-agent") || "";
    const isCrawler = /Googlebot|Google-InspectionTool|Storebot-Google|Googlebot-Image|Googlebot-Video|Mediapartners-Google|AdsBot-Google|bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot/i.test(userAgent);

    // If request is from a search crawler, allow it through so Google can render the page and confirm the noindex meta tag
    if (isCrawler) {
      return response;
    }

    if (isSupabaseConfigured) {
      const allCookies = request.cookies.getAll();
      const hasAuthCookie = allCookies.some(
        (c) =>
          c.name.startsWith("sb-") &&
          (c.name.includes("-auth-token") || c.name.includes("access-token")) &&
          c.value &&
          c.value.trim() !== ""
      );

      let isAuthenticated = hasAuthCookie;

      if (!isAuthenticated) {
        try {
          const supabase = createServerClient(supabaseUrl!, supabaseAnonKey!, {
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
          isAuthenticated = Boolean(user);
        } catch {
          isAuthenticated = false;
        }
      }

      if (!isAuthenticated) {
        const loginUrl = new URL("/auth/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        const redirectResponse = NextResponse.redirect(loginUrl);
        redirectResponse.headers.set("X-Robots-Tag", "noindex, nofollow");
        return redirectResponse;
      }
    }
  }

  // 4. Whenever an authenticated user visits the root landing page ("/"),
  // redirect them directly to the optimize dashboard ("/dashboard")
  if (pathname === "/") {
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

    if (isSupabaseConfigured) {
      try {
        const supabase = createServerClient(supabaseUrl!, supabaseAnonKey!, {
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
