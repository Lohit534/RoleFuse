import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth) {
    return NextResponse.json(
      { isAdmin: false, error: "Not authorized as administrator" },
      { status: 403 }
    );
  }
  return NextResponse.json({
    isAdmin: true,
    user: {
      id: auth.user.id,
      email: auth.user.email,
      role: auth.user.app_metadata?.role || auth.user.user_metadata?.role || "admin",
    },
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
