import { supabase } from "@/lib/supabase";
import { isAdminEmail } from "@/lib/auth";

/**
 * Robust admin verification for client components:
 * 1. Checks Supabase user metadata / app_metadata for 'admin' or 'owner' role.
 * 2. Checks NEXT_PUBLIC_ADMIN_EMAIL environment variable.
 * 3. Queries the public.User table in Supabase directly using current session.
 * 4. Calls /api/auth/verify which validates against the database using server service role key.
 */
export async function checkIsAdmin(user: any, token?: string): Promise<boolean> {
  if (!user) return false;

  // 1. Fast metadata check
  if (
    user.app_metadata?.role === "admin" ||
    user.app_metadata?.role === "owner" ||
    user.user_metadata?.role === "admin" ||
    user.user_metadata?.role === "owner" ||
    user.user_metadata?.isAdmin === true ||
    user.app_metadata?.isAdmin === true
  ) {
    return true;
  }

  // 2. Environment email check
  if (user.email && isAdminEmail(user.email)) {
    return true;
  }

  // 3. Direct DB check via Supabase client
  try {
    const query = (supabase as any).from("User").select("role, isAdmin");
    let res: any;
    if (user.email && user.id) {
      res = await query.or(`email.eq.${user.email.toLowerCase().trim()},id.eq.${user.id}`).maybeSingle();
    } else if (user.email) {
      res = await query.eq("email", user.email.toLowerCase().trim()).maybeSingle();
    } else if (user.id) {
      res = await query.eq("id", user.id).maybeSingle();
    }
    const dbUser = res?.data;
    if (dbUser && (dbUser.role === "admin" || dbUser.role === "owner" || dbUser.isAdmin === true)) {
      return true;
    }
  } catch (_e) {}

  // 4. Server-side verification API (bypasses RLS with server service role key)
  try {
    let effectiveToken = token;
    if (!effectiveToken) {
      const { data } = await supabase.auth.getSession();
      effectiveToken = data.session?.access_token;
    }

    if (effectiveToken) {
      const res = await fetch("/api/auth/verify", {
        headers: {
          Authorization: `Bearer ${effectiveToken}`,
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        const body = await res.json();
        if (body.isAdmin) return true;
      }
    }
  } catch (_e) {}

  return false;
}
