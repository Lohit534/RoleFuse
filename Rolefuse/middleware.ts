import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const pathname = request.nextUrl.pathname;
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isAuthRoute = pathname.startsWith("/auth");

  // Always set X-Robots-Tag: noindex, nofollow for all dashboard and auth routes
  if (isDashboardRoute || isAuthRoute) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  // Detect search engine crawlers (Googlebot, Bingbot, etc.)
  const userAgent = request.headers.get("user-agent") || "";
  const isCrawler = /Googlebot|Google-InspectionTool|Storebot-Google|Googlebot-Image|Googlebot-Video|Mediapartners-Google|AdsBot-Google|bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot/i.test(userAgent);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
  const isConfigured = !supabaseUrl.includes("placeholder-project") && supabaseAnonKey !== "placeholder-anon-key";

  if (isDashboardRoute && isConfigured) {
    // If request is from a search engine crawler, allow it through so Google can render the page and see the noindex meta tag
    if (isCrawler) {
      return response;
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Protect dashboard routes with server-side authentication
    if (!user) {
      const redirectUrl = new URL("/auth/login", request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      const redirectResponse = NextResponse.redirect(redirectUrl);
      redirectResponse.headers.set("X-Robots-Tag", "noindex, nofollow");
      return redirectResponse;
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/auth/:path*",
  ],
};
