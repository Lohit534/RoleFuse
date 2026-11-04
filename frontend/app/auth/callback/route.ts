import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getSafeRedirectUrl(requestUrl: URL, path: string): string {
  const isLocal =
    requestUrl.hostname === "localhost" ||
    requestUrl.hostname === "127.0.0.1" ||
    requestUrl.hostname === "0.0.0.0";

  if (isLocal) {
    const port = requestUrl.port ? `:${requestUrl.port}` : "";
    return `http://localhost${port}${path}`;
  }

  return `https://${requestUrl.host}${path}`;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  // Handle token_hash from OTP email template
  if (token_hash && type) {
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    });
    if (!error) {
      return NextResponse.redirect(getSafeRedirectUrl(requestUrl, next));
    }
  }

  // Handle code from PKCE flow
  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(getSafeRedirectUrl(requestUrl, next));
    }
  }

  // return the user to dashboard or auth-code-error page
  // Redirect to dashboard anyway if we are using the mock mode
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
  if (supabaseUrl.includes("placeholder-project")) {
    return NextResponse.redirect(getSafeRedirectUrl(requestUrl, next));
  }

  return NextResponse.redirect(getSafeRedirectUrl(requestUrl, "/auth/login?error=auth-code-error"));
}
