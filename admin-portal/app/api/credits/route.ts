import { NextRequest, NextResponse } from "next/server";
import { getAdminClient, getBackendUrl } from "@/lib/supabase";
import { verifyAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Admin / owner account always has unlimited
  return NextResponse.json({
    freeUsed: 0,
    paidCredits: 999999,
    freeRemaining: 999999,
    resetAt: new Date().toISOString(),
    isOwner: true,
    planId: "promax",
  }, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
