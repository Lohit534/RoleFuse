import { NextRequest, NextResponse } from "next/server";
import { getAdminClient, getBackendUrl } from "@/lib/supabase";
import { verifyAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/feedback — fetch feedback from Feedback table + fallback Resume table
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const adminClient = getAdminClient(auth.token) as any;
    const feedbackMap = new Map();

    // 1. Check "Feedback" table (primary source)
    try {
      const { data: fbRows } = await adminClient
        .from("Feedback")
        .select("*")
        .order("createdAt", { ascending: false });

      if (fbRows && Array.isArray(fbRows)) {
        fbRows.forEach((row: any) => {
          feedbackMap.set(row.id, {
            id: row.id,
            name: row.name || "Anonymous",
            email: row.email || "",
            type: row.type || "general",
            message: row.message,
            userId: row.userId,
            createdAt: row.createdAt,
          });
        });
      }
    } catch (e) {}

    // 2. Check fallback "Resume" table (jobTitle: "USER_FEEDBACK")
    try {
      const { data: dbRows } = await adminClient
        .from("Resume")
        .select("*")
        .eq("jobTitle", "USER_FEEDBACK")
        .order("createdAt", { ascending: false });

      if (dbRows && Array.isArray(dbRows)) {
        dbRows.forEach((row: any) => {
          if (!feedbackMap.has(row.id)) {
            try {
              const meta = JSON.parse(row.jobDescription || "{}");
              feedbackMap.set(row.id, {
                id: row.id,
                name: meta.name || row.company || "Anonymous",
                email: meta.email || "",
                type: meta.type || "general",
                message: row.originalText || "",
                userId: row.userId,
                createdAt: row.createdAt,
              });
            } catch {
              feedbackMap.set(row.id, {
                id: row.id,
                name: row.company || "Anonymous",
                email: "",
                type: "general",
                message: row.originalText || "",
                userId: row.userId,
                createdAt: row.createdAt,
              });
            }
          }
        });
      }
    } catch (e) {}

    const result = Array.from(feedbackMap.values()).sort(
      (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE /api/feedback — permanently delete feedback record from Supabase
export async function DELETE(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json().catch(() => ({}));
    const id = body.id || body.messageId;
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const adminClient = getAdminClient(auth.token) as any;

    // Delete from both Supabase tables simultaneously
    const [fbResult, resumeResult] = await Promise.allSettled([
      adminClient.from("Feedback").delete().eq("id", id),
      adminClient.from("Resume").delete().eq("id", id),
    ]);

    // Also notify backend app to delete its records if configured
    const backendUrl = getBackendUrl();
    if (backendUrl) {
      try {
        await fetch(`${backendUrl}/api/feedback`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${auth.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id }),
        });
      } catch (e: any) {
        console.warn("[feedback/DELETE] Backend sync notice:", e.message);
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/feedback — handles both delete action and legacy calls
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json().catch(() => ({}));
    
    // Support {action: "delete", id: "..."} format from admin dashboard
    const id = body.id || body.messageId;
    
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const adminClient = getAdminClient(auth.token) as any;

    // Delete from both Supabase tables simultaneously
    await Promise.allSettled([
      adminClient.from("Feedback").delete().eq("id", id),
      adminClient.from("Resume").delete().eq("id", id),
    ]);

    // Also notify backend app to delete its records if configured
    const backendUrl = getBackendUrl();
    if (backendUrl) {
      try {
        await fetch(`${backendUrl}/api/feedback`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${auth.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id }),
        });
      } catch (e: any) {
        console.warn("[feedback/POST-delete] Backend sync notice:", e.message);
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
