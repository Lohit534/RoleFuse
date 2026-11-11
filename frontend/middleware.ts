import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";

  // 1. Permanent (301) redirect from any *.vercel.app domain to canonical production https://rolefuse.in
  if (host.endsWith(".vercel.app")) {
    const url = new URL(
      request.nextUrl.pathname + request.nextUrl.search,
      "https://rolefuse.in"
    );
    const response = NextResponse.redirect(url, { status: 301 });
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    return response;
  }

  // 2. Canonicalize www.rolefuse.in to rolefuse.in
  if (host === "www.rolefuse.in") {
    const url = new URL(
      request.nextUrl.pathname + request.nextUrl.search,
      "https://rolefuse.in"
    );
    return NextResponse.redirect(url, { status: 301 });
  }

  const response = NextResponse.next();

  // If somehow served through a vercel preview host, never index
  if (host.includes("vercel.app")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, images, logos
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

