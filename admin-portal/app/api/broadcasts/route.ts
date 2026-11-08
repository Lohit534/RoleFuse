import { NextRequest, NextResponse } from "next/server";
import { getAdminClient, getBackendUrl } from "@/lib/supabase";
import { verifyAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export interface BroadcastNotification {
  id: string;
  category: "offer" | "update" | "alert" | "general";
  title: string;
  message: string;
  tag?: string;
  highlightNumber?: string;
  actionText?: string;
  actionHref?: string;
  expiresAt?: string | null;
  createdAt: string;
  active: boolean;
}

// GET /api/broadcasts — fetch broadcasts from frontend API or Supabase fallback
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const backendUrl = getBackendUrl();
    const token = auth.token;

    // 1. Try fetching directly from the main frontend API
    try {
      const res = await fetch(`${backendUrl}/api/notifications/broadcast?admin=true`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (err) {}

    // 2. Fallback: check Supabase Resume table with jobTitle = "ADMIN_BROADCAST"
    const adminClient = getAdminClient(auth.token) as any;
    const { data, error } = await adminClient
      .from("Resume")
      .select("*")
      .eq("jobTitle", "ADMIN_BROADCAST")
      .order("createdAt", { ascending: false });

    if (error) {
      console.warn("[broadcasts/GET] Supabase notice:", error.message);
    }

    const broadcasts: BroadcastNotification[] = (data || []).map((row: any) => {
      try {
        const meta = JSON.parse(row.jobDescription || "{}");
        return {
          id: row.id,
          category: meta.category || "general",
          title: row.originalText || "Broadcast",
          message: row.optimizedText || "",
          tag: meta.tag,
          highlightNumber: meta.highlightNumber,
          actionText: meta.actionText,
          actionHref: meta.actionHref,
          expiresAt: meta.expiresAt || null,
          createdAt: row.createdAt,
          active: meta.active !== false,
        };
      } catch {
        return {
          id: row.id,
          category: "general",
          title: row.originalText || "Broadcast",
          message: row.optimizedText || "",
          createdAt: row.createdAt,
          active: true,
        };
      }
    });

    return NextResponse.json({ broadcasts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch broadcasts" }, { status: 500 });
  }
}

// POST /api/broadcasts — publish a new broadcast to users
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { title, message, category, tag, highlightNumber, actionText, actionHref, expiresAt } = body;

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required." }, { status: 400 });
    }

    const backendUrl = getBackendUrl();
    const token = auth.token;

    // 1. Publish to main frontend API if reachable
    try {
      const res = await fetch(`${backendUrl}/api/notifications/broadcast`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (err) {}

    // 2. Fallback / Direct: Save to Supabase Resume table with jobTitle = "ADMIN_BROADCAST"
    const adminClient = getAdminClient(auth.token) as any;
    const newId = `bc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const meta = {
      category: category || "general",
      tag: tag || undefined,
      highlightNumber: highlightNumber || undefined,
      actionText: actionText || undefined,
      actionHref: actionHref || undefined,
      expiresAt: expiresAt || null,
      active: true,
    };

    // Ensure we have a valid userId matching the User foreign key constraint
    let targetUserId = auth.user?.id;
    if (targetUserId) {
      const { data: userExists } = await adminClient.from("User").select("id").eq("id", targetUserId).maybeSingle();
      if (!userExists) {
        const { data: anyUser } = await adminClient.from("User").select("id").limit(1).maybeSingle();
        if (anyUser?.id) targetUserId = anyUser.id;
      }
    } else {
      const { data: anyUser } = await adminClient.from("User").select("id").limit(1).maybeSingle();
      if (anyUser?.id) targetUserId = anyUser.id;
    }

    const { error: insErr } = await adminClient.from("Resume").insert({
      id: newId,
      userId: targetUserId,
      jobTitle: "ADMIN_BROADCAST",
      originalText: title.trim(),
      optimizedText: message.trim(),
      jobDescription: JSON.stringify(meta),
      scoreBefore: 100,
      scoreAfter: 100,
      keywordsBefore: 0,
      keywordsAfter: 0,
      impactBefore: 100,
      impactAfter: 100,
      keywordsAdded: [],
      createdAt: new Date().toISOString(),
    });

    if (insErr) {
      console.error("[broadcasts/POST] Supabase insert error:", insErr.message);
      return NextResponse.json({ error: `Database insert failed: ${insErr.message}` }, { status: 500 });
    }

    const createdBroadcast: BroadcastNotification = {
      id: newId,
      category: category || "general",
      title: title.trim(),
      message: message.trim(),
      tag,
      highlightNumber,
      actionText,
      actionHref,
      expiresAt,
      createdAt: new Date().toISOString(),
      active: true,
    };

    return NextResponse.json({ success: true, broadcast: createdBroadcast });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create broadcast" }, { status: 500 });
  }
}

// DELETE /api/broadcasts?id=... — remove a broadcast
export async function DELETE(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Broadcast ID required" }, { status: 400 });

    const backendUrl = getBackendUrl();
    const token = auth.token;

    // 1. Delete on frontend API
    try {
      await fetch(`${backendUrl}/api/notifications/broadcast?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {}

    // 2. Delete on Supabase fallback
    const adminClient = getAdminClient(auth.token) as any;
    await adminClient.from("Resume").delete().eq("id", id);

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete broadcast" }, { status: 500 });
  }
}

