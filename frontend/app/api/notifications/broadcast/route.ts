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

export interface BroadcastNotification {
  id: string;
  category: "offer" | "update" | "alert" | "general";
  title: string;
  message: string;
  tag?: string; // e.g. "50% OFF", "v2.4", "NEW"
  highlightNumber?: string; // e.g. "50%", "40%", "2.0"
  actionText?: string;
  actionHref?: string;
  expiresAt?: string | null;
  createdAt: string;
  active: boolean;
}

const DATA_DIR = path.join(process.cwd(), "data");
const BROADCAST_FILE = path.join(DATA_DIR, "broadcasts.json");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch {}
  }
}

function readBroadcasts(): BroadcastNotification[] {
  try {
    ensureDir();
    if (fs.existsSync(BROADCAST_FILE)) {
      const content = fs.readFileSync(BROADCAST_FILE, "utf8");
      const list = JSON.parse(content || "[]");
      if (Array.isArray(list)) return list;
    }
  } catch (e) {
    logger.warn("[broadcasts] File read error:", e);
  }
  return [];
}

function writeBroadcasts(data: BroadcastNotification[]) {
  try {
    ensureDir();
    fs.writeFileSync(BROADCAST_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    logger.error("[broadcasts] File write error:", e);
  }
}

// GET: Returns all active broadcasts for users, or all broadcasts for admin
export async function GET(request: NextRequest) {
  try {
    const broadcasts = readBroadcasts();
    const now = new Date();

    // Check if requester is admin (via query param ?admin=true & session check)
    const isAdminQuery = request.nextUrl.searchParams.get("admin") === "true";

    if (isAdminQuery) {
      let isOwner = false;

      // 1. Bearer token
      const authHeader = request.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.replace("Bearer ", "").trim();
        const admin = getAdminClient() as any;
        if (admin?.auth?.getUser) {
          try {
            const { data } = await admin.auth.getUser(token);
            if (data?.user?.email) isOwner = isOwnerEmail(data.user.email);
          } catch {}
        }
      }

      // 2. Cookie session
      if (!isOwner) {
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.email) isOwner = isOwnerEmail(user.email);
        } catch {}
      }

      if (isOwner) {
        return NextResponse.json({ broadcasts });
      }
    }

    // Public / User view: return only active, non-expired broadcasts
    const activeBroadcasts = broadcasts.filter((b) => {
      if (!b.active) return false;
      if (b.expiresAt) {
        const exp = new Date(b.expiresAt);
        if (exp.getTime() < now.getTime()) return false;
      }
      return true;
    });

    return NextResponse.json({ broadcasts: activeBroadcasts });
  } catch (error: any) {
    logger.error("[broadcasts GET] error:", error);
    return NextResponse.json({ broadcasts: [] });
  }
}

// POST: Admin creates a new broadcast notification
export async function POST(request: NextRequest) {
  try {
    let currentUser: any = null;

    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "").trim();
      const admin = getAdminClient() as any;
      if (admin?.auth?.getUser) {
        try {
          const { data } = await admin.auth.getUser(token);
          if (data?.user) currentUser = data.user;
        } catch {}
      }
    }

    if (!currentUser) {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) currentUser = user;
      } catch {}
    }

    if (!currentUser || !isOwnerEmail(currentUser.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { title, message, category, tag, highlightNumber, actionText, actionHref, expiresAt } = body;

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required." }, { status: 400 });
    }

    const newBroadcast: BroadcastNotification = {
      id: `bc_${generateUUID()}`,
      category: ["offer", "update", "alert", "general"].includes(category) ? category : "general",
      title: String(title).trim(),
      message: String(message).trim(),
      tag: tag ? String(tag).trim() : undefined,
      highlightNumber: highlightNumber ? String(highlightNumber).trim() : undefined,
      actionText: actionText ? String(actionText).trim() : undefined,
      actionHref: actionHref ? String(actionHref).trim() : undefined,
      expiresAt: expiresAt || null,
      createdAt: new Date().toISOString(),
      active: true,
    };

    const currentList = readBroadcasts();
    currentList.unshift(newBroadcast);
    writeBroadcasts(currentList);

    logger.info(`[broadcasts] New broadcast "${newBroadcast.title}" published by ${currentUser.email}`);

    return NextResponse.json({ success: true, broadcast: newBroadcast });
  } catch (error: any) {
    logger.error("[broadcasts POST] error:", error);
    return NextResponse.json({ error: error.message || "Failed to create broadcast" }, { status: 500 });
  }
}

// DELETE: Admin removes or toggles a broadcast
export async function DELETE(request: NextRequest) {
  try {
    let currentUser: any = null;

    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "").trim();
      const admin = getAdminClient() as any;
      if (admin?.auth?.getUser) {
        try {
          const { data } = await admin.auth.getUser(token);
          if (data?.user) currentUser = data.user;
        } catch {}
      }
    }

    if (!currentUser) {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) currentUser = user;
      } catch {}
    }

    if (!currentUser || !isOwnerEmail(currentUser.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Broadcast ID is required." }, { status: 400 });
    }

    const currentList = readBroadcasts();
    const filtered = currentList.filter((b) => b.id !== id);
    writeBroadcasts(filtered);

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    logger.error("[broadcasts DELETE] error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete broadcast" }, { status: 500 });
  }
}

