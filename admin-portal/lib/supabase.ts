import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazy browser client — only created when first called (not at module load)
let _client: SupabaseClient | null = null;

export function getBackendUrl(): string {
  return (
    process.env.USER_APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://fasthireai.com"
  ).replace(/\/$/, "");
}

export function getSupabase(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qasfeyddyolpdvmiogkl.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
  _client = createClient(url, key);
  return _client;
}

// Admin/server client using service role key — created fresh per request
// IMPORTANT: Do NOT override Authorization with user JWT when service role is available.
// Supabase Admin API (auth.admin.listUsers, etc.) requires the service-role key in
// the Authorization header. Overriding it with a user JWT causes 403 errors on admin endpoints.
export function getAdminClient(token?: string): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qasfeyddyolpdvmiogkl.supabase.co";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const options: any = {
    auth: { autoRefreshToken: false, persistSession: false },
  };

  if (serviceRoleKey) {
    // Service role key available — use it directly, do NOT override Authorization
    // This ensures auth.admin.listUsers() and other admin endpoints work correctly
    return createClient(url, serviceRoleKey, options);
  }

  // Fallback: no service role key available (e.g. local dev without env vars)
  // Use anon key with user JWT in Authorization header for RLS-aware queries
  const fallbackKey = anonKey || token || "placeholder-service-key";
  if (token) {
    options.global = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }

  return createClient(url, fallbackKey, options);
}

// Thin proxy so client components can write `supabase.auth.xxx()`
// without creating the client at module scope
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as any)[prop];
  },
});
