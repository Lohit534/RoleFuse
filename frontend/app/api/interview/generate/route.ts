import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildInterviewQuestionsPrompt } from "@/lib/ai/prompts";
import { callAIText } from "@/lib/ai/router";
import { logger } from "@/lib/logger";

function extractJSON(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error("Invalid AI JSON response format");
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { getAdminClient } = await import("@/lib/supabase/admin");
    const { isOwnerEmail } = await import("@/types");
    const admin = getAdminClient();
    const isOwner = isOwnerEmail(user.email);
    const activeUserId = user.id;

    if (!isOwner) {
      const { data: userRow } = await admin
        .from("User")
        .select("planTier")
        .eq("id", activeUserId)
        .maybeSingle();

      const { data: creditRow } = await admin
        .from("Credit")
        .select("*")
        .eq("userId", activeUserId)
        .maybeSingle();

      const isProMax =
        userRow?.planTier === "promax" ||
        creditRow?.planId === "promax" ||
        creditRow?.billingCycle === "admin_promax" ||
        (creditRow?.paidCredits && creditRow.paidCredits >= 900000) ||
        (creditRow?.paidCredits && creditRow.paidCredits >= 90);

      if (!isProMax) {
        return NextResponse.json(
          { error: "AI Mock Interview Coach is exclusively available for Pro Max members. Please upgrade to Pro Max to access." },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { resumeText, jobDescription, jobTitle, company } = body;

    if (!resumeText || typeof resumeText !== "string" || !resumeText.trim()) {
      return NextResponse.json(
        { error: "Resume text is required to generate tailored interview questions." },
        { status: 400 }
      );
    }

    if (!jobDescription || typeof jobDescription !== "string" || !jobDescription.trim()) {
      return NextResponse.json(
        { error: "Target job description is required to generate realistic questions." },
        { status: 400 }
      );
    }

    const prompt = buildInterviewQuestionsPrompt(
      resumeText,
      jobDescription,
      jobTitle || "Target Role",
      company || "Target Company"
    );

    const rawResponse = await callAIText(prompt);
    const parsedData = extractJSON(rawResponse);

    return NextResponse.json({
      success: true,
      data: parsedData
    });
  } catch (error: any) {
    logger.error("[interview-generate] API error:", error?.message);
    return NextResponse.json(
      { error: error?.message || "Failed to generate interview questions." },
      { status: 500 }
    );
  }
}

