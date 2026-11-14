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
    let activeUserId = user.id;
    try {
      if (user.email) {
        const { data: existingUser } = await admin
          .from("User")
          .select("id")
          .eq("email", user.email.toLowerCase().trim())
          .maybeSingle();
        if (existingUser?.id) {
          activeUserId = existingUser.id;
        }
      }
    } catch (_e) {}

    let userCreditRow: any = null;

    if (!isOwner) {
      const { data: userRow } = await admin
        .from("User")
        .select("planTier")
        .eq("id", activeUserId)
        .maybeSingle();

      let { data: creditRow } = await admin
        .from("Credit")
        .select("*")
        .eq("userId", activeUserId)
        .maybeSingle();

      if (!creditRow && activeUserId !== user.id) {
        const { data: fallbackCredit } = await admin
          .from("Credit")
          .select("*")
          .eq("userId", user.id)
          .maybeSingle();
        if (fallbackCredit) creditRow = fallbackCredit;
      }

      userCreditRow = creditRow;

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

      // Check for at least 2 credits
      const currentCredits = creditRow?.paidCredits ?? 0;
      if (currentCredits < 2) {
        return NextResponse.json(
          { error: `Generating tailored interview questions requires 2 Pro Max credits. You have ${currentCredits} credit${currentCredits === 1 ? "" : "s"} remaining in your pool. Please top up or renew your credits to continue.` },
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

    if (!jobDescription || typeof jobDescription !== "string" || jobDescription.trim().length < 50) {
      return NextResponse.json(
        { error: "Target job description is required and must contain at least 50 characters." },
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

    // Deduct 2 credits for non-owner Pro Max users
    let remainingCredits: number | null = null;
    if (!isOwner && userCreditRow) {
      try {
        const currentPaid = userCreditRow.paidCredits ?? 0;
        const newPaidCredits = Math.max(0, currentPaid - 2);
        const creditTargetId = userCreditRow.userId || activeUserId;
        await admin
          .from("Credit")
          .update({ paidCredits: newPaidCredits })
          .eq("userId", creditTargetId);
        remainingCredits = newPaidCredits;
        logger.info(`[interview-generate] Deducted 2 credits for ${user.email}. Remaining credits: ${newPaidCredits}`);
      } catch (deductErr: any) {
        logger.error("[interview-generate] Failed to deduct credit:", deductErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      data: parsedData,
      remainingCredits
    });
  } catch (error: any) {
    logger.error("[interview-generate] API error:", error?.message);
    return NextResponse.json(
      { error: error?.message || "Failed to generate interview questions." },
      { status: 500 }
    );
  }
}

