import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Whenever an authenticated user visits the root landing page ("/"),
  // redirect them directly to the optimize dashboard ("/dashboard") on both mobile and desktop.
  if (
    request.nextUrl.pathname === "/" &&
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
      // Fallback handled client-side in page.tsx
    }
  }

  return response;
}

export const config = {
  matcher: ["/"],
};
