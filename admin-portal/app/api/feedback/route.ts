import { NextRequest, NextResponse } from "next/server";
import { getAdminClient, getBackendUrl } from "@/lib/supabase";
import { verifyAdmin } from "@/lib/auth";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const DATA_DIR = path.join(process.cwd(), "data");
const DELETED_FILE = path.join(DATA_DIR, "deleted_feedback.json");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getDeletedFeedbackIds(): Set<string> {
  try {
    ensureDir();
    if (fs.existsSync(DELETED_FILE)) {
      const content = fs.readFileSync(DELETED_FILE, "utf8");
      return new Set(JSON.parse(content || "[]"));
    }
  } catch {}
  return new Set();
}

function recordDeletedId(id: string) {
  try {
    ensureDir();
    const set = getDeletedFeedbackIds();
    set.add(id);
    fs.writeFileSync(DELETED_FILE, JSON.stringify(Array.from(set)), "utf8");
  } catch {}
}

// GET /api/feedback — fetch feedback from Feedback table + fallback Resume table
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const adminClient = getAdminClient(auth.token) as any;
    const feedbackMap = new Map();
    const deletedIds = getDeletedFeedbackIds();

    // 1. Check "Feedback" table
    try {
      const { data: fbRows } = await adminClient
        .from("Feedback")
        .select("*")
        .order("createdAt", { ascending: false });

      if (fbRows && Array.isArray(fbRows)) {
        fbRows.forEach((row: any) => {
          if (!deletedIds.has(row.id)) {
            feedbackMap.set(row.id, {
              id: row.id,
              name: row.name || "Anonymous",
              email: row.email || "",
              type: row.type || "general",
              message: row.message,
              userId: row.userId,
              createdAt: row.createdAt,
            });
          }
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
          if (!deletedIds.has(row.id) && !feedbackMap.has(row.id)) {
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

    let result = Array.from(feedbackMap.values()).sort(
      (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // If local query yielded no items, check backend API as fallback
    if (result.length === 0) {
      const backendUrl = getBackendUrl();
      if (backendUrl) {
        try {
          const remoteRes = await fetch(`${backendUrl}/api/feedback`, {
            headers: {
              Authorization: `Bearer ${auth.token}`,
              "Content-Type": "application/json",
            },
            cache: "no-store",
          });
          if (remoteRes.ok) {
            const remoteData = await remoteRes.json();
            if (Array.isArray(remoteData) && remoteData.length > 0) {
              result = remoteData.filter((item: any) => !deletedIds.has(item.id));
            }
          }
        } catch (err: any) {
          console.warn("[feedback/GET] Backend live fallback notice:", err.message);
        }
      }
    }

    // Always enforce deletedIds filtering
    const cleanResult = result.filter((item: any) => !deletedIds.has(item.id));

    return NextResponse.json(cleanResult, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST or DELETE /api/feedback — permanently delete feedback record
export async function DELETE(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json().catch(() => ({}));
    const id = body.id || body.messageId;
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    // 1. Immediately record in permanent tombstone so it can NEVER be restored
    recordDeletedId(id);

    const adminClient = getAdminClient(auth.token) as any;

    // 2. Delete from Supabase Feedback & Resume tables
    await adminClient.from("Feedback").delete().eq("id", id).catch(() => {});
    await adminClient.from("Resume").delete().eq("id", id).catch(() => {});

    // 3. Notify backend app to delete its records as well
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

export const POST = DELETE;
