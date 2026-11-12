import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data?.session) {
      const redirectUrl = new URL(next, requestUrl.origin);
      redirectUrl.hash = `access_token=${data.session.access_token}&refresh_token=${data.session.refresh_token}&expires_in=${data.session.expires_in}&token_type=bearer`;
      return NextResponse.redirect(redirectUrl);
    }
  }

  // If redirected without code (e.g. implicit hash token flow), forward to dashboard so client parses hash
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
