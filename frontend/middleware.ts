import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // If visiting the root landing page "/", check if user is already logged in
  if (pathname === "/") {
    const allCookies = request.cookies.getAll();
    const hasAuthCookie = allCookies.some(
      (c) =>
        (c.name.startsWith("sb-") && c.name.endsWith("-auth-token")) ||
        c.name.includes("supabase-auth-token") ||
        c.name.includes("sb-access-token")
    );

    if (hasAuthCookie) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
