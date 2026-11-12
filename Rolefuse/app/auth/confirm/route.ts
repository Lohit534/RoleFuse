import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";

/**
 * Strict sanitizer to prevent Open Redirect vulnerabilities (CWE-601).
 * Guarantees the target path is a safe, internal relative path.
 */
function getSafeRedirectPath(target: string | null | undefined): string {
  if (!target || typeof target !== "string") {
    return "/dashboard";
  }

  const trimmed = target.trim();

  // Reject absolute URLs, protocol-relative (//), backslash (/\\), or javascript/data URIs
  if (
    trimmed.includes("://") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\") ||
    trimmed.startsWith("\\") ||
    trimmed.toLowerCase().startsWith("javascript:") ||
    trimmed.toLowerCase().startsWith("data:")
  ) {
    return "/dashboard";
  }

  // Must begin with a single "/"
  if (!trimmed.startsWith("/")) {
    return `/${trimmed}`;
  }

  // Strip control characters, CRLF, and null bytes
  const clean = trimmed.replace(/[\r\n\0\t]/g, "");

  // Re-check after cleaning
  if (clean.startsWith("//") || clean.startsWith("/\\")) {
    return "/dashboard";
  }

  return clean;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const code = requestUrl.searchParams.get("code");
  const rawNext = requestUrl.searchParams.get("next") ?? requestUrl.searchParams.get("redirect");
  const safeNextPath = getSafeRedirectPath(rawNext);

  let protocol = requestUrl.protocol;
  if (!requestUrl.hostname.includes("localhost")) {
    protocol = "https:";
  }
  const baseUrl = `${protocol}//${requestUrl.host}`;
  const targetRedirectUrl = `${baseUrl}${safeNextPath}`;

  // 1. Handle token_hash from OTP email template
  if (token_hash && type) {
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      return NextResponse.redirect(targetRedirectUrl);
    }
  }

  // 2. Handle code from PKCE flow
  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(targetRedirectUrl);
    }
  }

  // Redirect to safe target anyway if mock mode
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  if (supabaseUrl.includes("placeholder-project")) {
    return NextResponse.redirect(targetRedirectUrl);
  }

  return NextResponse.redirect(`${baseUrl}/auth/login?error=invalid-token`);
}
