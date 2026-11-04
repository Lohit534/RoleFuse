import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getSafeRedirectUrl(request: Request, targetPathOrUrl: string): string {
  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host") || requestUrl.host;
  const hostname = host.split(":")[0];

  let path = targetPathOrUrl || "/dashboard";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    try {
      const parsed = new URL(path);
      path = parsed.pathname + parsed.search + parsed.hash;
    } catch {
      path = "/dashboard";
    }
  }

  const isLocal =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    requestUrl.hostname === "localhost" ||
    requestUrl.hostname === "127.0.0.1" ||
    requestUrl.hostname === "0.0.0.0";

  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  if (isLocal) {
    const port = requestUrl.port ? `:${requestUrl.port}` : (host.includes(":") ? `:${host.split(":")[1]}` : ":3000");
    return `http://localhost${port}${cleanPath}`;
  }

  // Production (Vercel deployment or custom production domain)
  if (forwardedHost) {
    return `https://${forwardedHost}${cleanPath}`;
  }

  if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")) {
    const base = process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
    return `${base}${cleanPath}`;
  }

  return `https://${requestUrl.host}${cleanPath}`;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? requestUrl.searchParams.get("redirect") ?? "/dashboard";

  // 1. Handle token_hash from OTP email template
  if (token_hash && type) {
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    });
    if (!error) {
      return NextResponse.redirect(getSafeRedirectUrl(request, next));
    }
  }

  // 2. Handle code from OAuth / PKCE flow
  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(getSafeRedirectUrl(request, next));
    } else {
      console.error("Auth callback exchange error:", error);
    }
  }

  // 3. If session already exists, proceed to dashboard
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      return NextResponse.redirect(getSafeRedirectUrl(request, next));
    }
  } catch (err) {
    console.error("Error reading session in callback:", err);
  }

  // 4. Fallback for mock mode
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
  if (supabaseUrl.includes("placeholder-project")) {
    return NextResponse.redirect(getSafeRedirectUrl(request, next));
  }

  // 5. On actual error, redirect to login with error parameter
  return NextResponse.redirect(getSafeRedirectUrl(request, "/auth/login?error=auth-code-error"));
}
