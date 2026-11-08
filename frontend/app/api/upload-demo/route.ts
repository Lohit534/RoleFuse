import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { createClient } from "@/lib/supabase/server";
import { isOwnerEmail } from "@/types";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

// Standard supported video extensions
const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".m4v", ".mkv", ".avi"];
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

function ensureUploadsDirExists() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

export async function GET() {
  try {
    ensureUploadsDirExists();
    const files = fs.readdirSync(UPLOADS_DIR);
    
    // Look for video files in public/uploads
    const videoFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return VIDEO_EXTENSIONS.includes(ext);
    });

    // Default preference to demo.mp4 if present, else first video file
    let defaultVideo = videoFiles.find((f) => f.toLowerCase().startsWith("demo.")) || videoFiles[0] || null;

    if (defaultVideo) {
      return NextResponse.json({
        exists: true,
        videoUrl: `/uploads/${defaultVideo}`,
        videoName: defaultVideo,
        allVideos: videoFiles.map((f) => ({
          name: f,
          url: `/uploads/${f}`,
        })),
      });
    }

    // Default to configured Google Drive demo video if no local file is uploaded
    const driveUrl = process.env.DEMO_VIDEO_URL || "https://drive.google.com/file/d/1IPCP1rurvnhKIjNKErkb3Kn1GWTmZz-q/preview";

    return NextResponse.json({
      exists: true,
      videoUrl: driveUrl,
      videoName: "FastHire AI Demo Video (Google Drive)",
      isEmbed: true,
      allVideos: [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to check uploads" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication & admin authorization
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isOwnerEmail(user.email)) {
      logger.warn(`[upload-demo] Unauthorized upload attempt by non-admin: ${user.email}`);
      return NextResponse.json({ error: "Forbidden: Admin privileges required." }, { status: 403 });
    }

    ensureUploadsDirExists();
    const formData = await request.formData();
    const file = formData.get("video") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 });
    }

    // 2. Enforce file size limit
    if (file.size > MAX_VIDEO_SIZE) {
      return NextResponse.json(
        { error: "Video exceeds maximum size limit of 50MB." },
        { status: 400 }
      );
    }

    const filename = file.name || "demo.mp4";
    const ext = path.extname(filename).toLowerCase() || ".mp4";

    // 3. Strict extension check
    if (!VIDEO_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: "Invalid video format. Please upload a video file (.mp4, .webm, .mov, etc.)" },
        { status: 400 }
      );
    }

    // 4. Sanitize filename to prevent directory traversal or script injection
    const baseClean = path.basename(filename).replace(/[^a-zA-Z0-9_.-]/g, "_");
    const targetFilename = baseClean.toLowerCase().startsWith("demo") ? baseClean : `demo_${baseClean}`;
    const filePath = path.join(UPLOADS_DIR, targetFilename);

    // Verify resolved path stays strictly inside UPLOADS_DIR
    if (!filePath.startsWith(UPLOADS_DIR)) {
      return NextResponse.json({ error: "Invalid file path." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    logger.info(`[upload-demo] Admin ${user.email} uploaded video: ${targetFilename} (${file.size} bytes)`);

    return NextResponse.json({
      success: true,
      videoUrl: `/uploads/${targetFilename}`,
      videoName: targetFilename,
      message: `Video uploaded successfully to public/uploads/${targetFilename}`,
    });
  } catch (error: any) {
    logger.error("[upload-demo] Error uploading video:", error?.message);
    return NextResponse.json({ error: error.message || "Failed to upload video" }, { status: 500 });
  }
}
