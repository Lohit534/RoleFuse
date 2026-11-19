import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scoreResume } from "@/lib/ats/scorer";
import { MIN_RESUME_CHARS, MIN_JD_CHARS } from "@/types";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    // 1. Verify Authentication (optional in preview/demo mode)
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 2. Parse Request Body
    const body = await request.json();
    const { resumeText, jobDescription, scoreBefore, bulletImprovementsCount } = body;

    // 3. Input Validation
    if (!resumeText || typeof resumeText !== "string" || resumeText.trim().length < MIN_RESUME_CHARS) {
      return NextResponse.json(
        { error: `Resume text must be at least ${MIN_RESUME_CHARS} characters.` },
        { status: 400 }
      );
    }

    // jobDescription is optional — scoring still works for formatting/impact metrics without it.
    // When JD is missing/empty, keyword match will be 0 but other sub-scores are still computed.
    const effectiveJD = typeof jobDescription === "string" && jobDescription.trim().length >= MIN_JD_CHARS
      ? jobDescription
      : "";

    logger.info(`Scoring resume for user ${user?.email || "guest"}...`);

    // 4. Scoring (Always free, no Prisma write or credit deductions)
    const scoreResult = await scoreResume(resumeText, effectiveJD, scoreBefore, bulletImprovementsCount);

    return NextResponse.json(scoreResult);
  } catch (error: any) {
    logger.error("Failed to process resume score request:", error);
    return NextResponse.json(
      { error: "Internal server error during scoring computation." },
      { status: 500 }
    );
  }
}
