import { NextResponse } from "next/server";
import { getAdminClient, getBackendUrl } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const admin = getAdminClient() as any;

    let userCount = 0;
    let optimizationCount = 0;

    try {
      const { count: uc } = await admin
        .from("User")
        .select("id", { count: "exact", head: true });
      userCount = uc || 0;
    } catch {}

    try {
      const { count: oc } = await admin
        .from("Resume")
        .select("id", { count: "exact", head: true })
        .neq("jobTitle", "SUPPORT_TICKET");
      optimizationCount = oc || 0;
    } catch {}

    // Fallback to live backend if local counts are zero
    if (userCount === 0 && optimizationCount === 0) {
      const backendUrl = getBackendUrl();
      if (backendUrl) {
        try {
          const res = await fetch(`${backendUrl}/api/stats`, { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            return NextResponse.json(data, {
              headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate",
              },
            });
          }
        } catch {}
      }
    }

    return NextResponse.json(
      {
        users: userCount,
        optimizations: optimizationCount,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ users: 0, optimizations: 0 }, { status: 200 });
  }
}
