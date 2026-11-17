import { NextRequest } from "next/server";
import { getAdminClient } from "@/lib/supabase";

export function isAdminEmail(email?: string): boolean {
  if (!email) return false;
  const rawAdmin =
    process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
    process.env.NEXT_PUBLIC_OWNER_EMAIL ||
    process.env.ADMIN_EMAIL ||
    process.env.OWNER_EMAIL ||
    "";
  const allowed = rawAdmin.split(",").map(e => e.toLowerCase().trim()).filter(Boolean);
  return allowed.includes(email.toLowerCase().trim());
}

export async function verifyAdmin(request: NextRequest): Promise<{ user: any; token: string } | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return null;

  try {
    const adminClient = getAdminClient(token);
    const { data, error } = await adminClient.auth.getUser(token);
    if (!error && data?.user) {
      const email = data.user.email;
      // 1. Check Supabase app_metadata or user_metadata for admin role
      const isRoleAdmin =
        data.user.app_metadata?.role === "admin" ||
        data.user.app_metadata?.role === "owner" ||
        data.user.user_metadata?.role === "admin" ||
        data.user.user_metadata?.role === "owner" ||
        data.user.user_metadata?.isAdmin === true ||
        data.user.app_metadata?.isAdmin === true;

      // 2. Check Database record in public.User
      let isDbAdmin = false;
      if (email || data.user.id) {
        try {
          let query = (adminClient as any).from("User").select("role, isAdmin");
          if (email && data.user.id) {
            query = query.or(`email.eq.${email.toLowerCase().trim()},id.eq.${data.user.id}`);
          } else if (email) {
            query = query.eq("email", email.toLowerCase().trim());
          } else {
            query = query.eq("id", data.user.id);
          }
          const { data: dbUser } = await query.maybeSingle();
          if (dbUser && (dbUser.role === "admin" || dbUser.role === "owner" || dbUser.isAdmin === true)) {
            isDbAdmin = true;
          }
        } catch (_dbErr) {}
      }

      // 3. Check environment-configured admin email
      if (isRoleAdmin || isDbAdmin || isAdminEmail(email)) {
        return { user: data.user, token };
      }
    }
  } catch {
    return null;
  }

  return null;
}

