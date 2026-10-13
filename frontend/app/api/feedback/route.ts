import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { isOwnerEmail } from "@/types";
import { logger } from "@/lib/logger";
import { generateUUID } from "@/lib/utils";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DATA_DIR = path.join(process.cwd(), "data");
const FEEDBACK_FILE = path.join(DATA_DIR, "feedback.json");
const DELETED_FEEDBACK_FILE = path.join(DATA_DIR, "deleted_feedback.json");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readDeletedFeedbackIds(): Set<string> {
  try {
    ensureDir();
    if (fs.existsSync(DELETED_FEEDBACK_FILE)) {
      const content = fs.readFileSync(DELETED_FEEDBACK_FILE, "utf8");
      return new Set(JSON.parse(content || "[]"));
    }
  } catch (e) {}
  return new Set();
}

function recordDeletedFeedbackId(id: string) {
  try {
    ensureDir();
    const ids = readDeletedFeedbackIds();
    ids.add(id);
    fs.writeFileSync(DELETED_FEEDBACK_FILE, JSON.stringify(Array.from(ids)), "utf8");
  } catch (e) {}
}

function readFeedback(): any[] {
  try {
    ensureDir();
    if (fs.existsSync(FEEDBACK_FILE)) {
      const content = fs.readFileSync(FEEDBACK_FILE, "utf8");
      return JSON.parse(content || "[]");
    }
  } catch (e) {
    logger.warn("[feedback] File read error:", e);
  }
  return [];
}

function writeFeedback(data: any[]) {
  try {
    ensureDir();
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    logger.error("[feedback] File write error:", e);
  }
}

async function verifyAdminUser(request: NextRequest): Promise<boolean> {
  // 1. Check cookie session
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email && isOwnerEmail(user.email)) return true;
  } catch {}

  // 2. Check Bearer token (from admin portal or external API client)
  const authHeader = request.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.replace(/^Bearer\s+/i, "");
      const adminSupabase = getAdminClient();
      const { data: { user } } = await adminSupabase.auth.getUser(token);
      if (user?.email && isOwnerEmail(user.email)) return true;
    } catch {}
  }
  return false;
}

// POST /api/feedback — save feedback message from users
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const { name, email, type, message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const recordId = generateUUID();
    const nowISO = new Date().toISOString();
    const senderEmail = email?.trim() || user?.email || "";
    const senderName = name?.trim() || user?.email?.split("@")[0] || "Anonymous";

    const feedbackRecord = {
      id: recordId,
      name: senderName,
      email: senderEmail,
      type: type || "general",
      message: message.trim(),
      userId: user?.id || null,
      createdAt: nowISO,
    };

    const adminSupabase = getAdminClient();

    // 1. Save to dedicated "Feedback" table in Supabase
    try {
      const { error: fbErr } = await adminSupabase.from("Feedback").insert(feedbackRecord);
      if (fbErr) logger.warn("[feedback] Dedicated Feedback table insert error:", fbErr.message);
      else logger.info(`[feedback] Saved to Supabase 'Feedback' table for ${senderEmail}`);
    } catch (e: any) {
      logger.warn("[feedback] Dedicated Feedback table insert exception:", e?.message);
    }

    // 2. Save to "Resume" table as fallback (jobTitle: "USER_FEEDBACK")
    const meta = {
      name: senderName,
      email: senderEmail,
      type: type || "general",
      userEmail: senderEmail,
      status: "pending",
    };
    try {
      const { error: resErr } = await adminSupabase.from("Resume").insert({
        id: recordId,
        userId: user?.id || null,
        jobTitle: "USER_FEEDBACK",
        company: type || "general",
        originalText: message.trim(),
        jobDescription: JSON.stringify(meta),
        scoreBefore: 0,
        scoreAfter: 0,
        keywordsBefore: 0,
        keywordsAfter: 0,
        impactBefore: 0,
        impactAfter: 0,
        keywordsAdded: [],
        createdAt: nowISO,
      });
      if (resErr) logger.warn("[feedback] Resume table feedback insert error:", resErr.message);
    } catch (e: any) {
      logger.warn("[feedback] Resume table feedback insert exception:", e?.message);
    }

    // 3. Save to local JSON fallback
    const existing = readFeedback();
    existing.unshift(feedbackRecord);
    writeFeedback(existing);

    logger.info(`[feedback] New feedback saved from ${senderEmail}: type=${type || "general"}`);
    return NextResponse.json({ success: true, id: recordId });
  } catch (error: any) {
    logger.error("[feedback] Error saving feedback:", error?.message);
    return NextResponse.json({ error: "Failed to save feedback." }, { status: 500 });
  }
}

// GET /api/feedback — admin only, returns all feedback
export async function GET(request: NextRequest) {
  try {
    const isAuthorized = await verifyAdminUser(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminSupabase = getAdminClient();
    const dbItemsMap = new Map();
    const deletedIds = readDeletedFeedbackIds();

    // 1. Query dedicated "Feedback" table
    try {
      const { data: fbRows } = await adminSupabase
        .from("Feedback")
        .select("*")
        .order("createdAt", { ascending: false });

      if (fbRows && Array.isArray(fbRows)) {
        fbRows.forEach((row: any) => {
          if (!deletedIds.has(row.id)) {
            dbItemsMap.set(row.id, {
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
    } catch (e: any) {}

    // 2. Query fallback "Resume" table (jobTitle: "USER_FEEDBACK")
    try {
      const { data: dbRows } = await adminSupabase
        .from("Resume")
        .select("*")
        .eq("jobTitle", "USER_FEEDBACK")
        .order("createdAt", { ascending: false });

      if (dbRows && Array.isArray(dbRows)) {
        dbRows.forEach((row: any) => {
          if (!deletedIds.has(row.id) && !dbItemsMap.has(row.id)) {
            try {
              const meta = JSON.parse(row.jobDescription || "{}");
              dbItemsMap.set(row.id, {
                id: row.id,
                name: meta.name || row.userId || "Anonymous",
                email: meta.email || meta.userEmail || "",
                type: meta.type || row.company || "general",
                message: row.originalText,
                userId: row.userId,
                createdAt: row.createdAt,
              });
            } catch (e) {
              dbItemsMap.set(row.id, {
                id: row.id,
                name: "Anonymous",
                email: "",
                type: row.company || "general",
                message: row.originalText,
                userId: row.userId,
                createdAt: row.createdAt,
              });
            }
          }
        });
      }
    } catch (e: any) {}

    // 3. Query local JSON fallback
    const localRecords = readFeedback();
    localRecords.forEach((r) => {
      if (r && r.id && !deletedIds.has(r.id) && !dbItemsMap.has(r.id)) {
        dbItemsMap.set(r.id, r);
      }
    });

    const combined = Array.from(dbItemsMap.values());
    combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(combined, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: any) {
    logger.error("[feedback] Error fetching feedback:", error?.message);
    return NextResponse.json({ error: "Failed to fetch feedback." }, { status: 500 });
  }
}

// DELETE /api/feedback — admin only, permanently delete feedback by id
export async function DELETE(request: NextRequest) {
  try {
    const isAuthorized = await verifyAdminUser(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const id = body.id || body.messageId;
    if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

    const adminSupabase = getAdminClient();

    // 1. Delete from Supabase Feedback table & Resume table
    try {
      await adminSupabase.from("Feedback").delete().eq("id", id);
      await adminSupabase.from("Resume").delete().eq("id", id);
    } catch (e) {}

    // 2. Delete from local JSON fallback
    const existing = readFeedback();
    const updated = existing.filter((r) => r.id !== id);
    writeFeedback(updated);

    // 3. Mark in permanent tombstone list so it can never be restored
    recordDeletedFeedbackId(id);

    logger.info(`[feedback] Permanently deleted feedback id=${id}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error("[feedback] Error deleting feedback:", error?.message);
    return NextResponse.json({ error: "Failed to delete feedback." }, { status: 500 });
  }
}
