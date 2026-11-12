import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildLinkedInOptimizerPrompt } from "@/lib/ai/prompts";
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
    throw new Error("Invalid AI LinkedIn JSON format");
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
    let userCreditRow: any = null;

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

      userCreditRow = creditRow;

      const isProMax =
        userRow?.planTier === "promax" ||
        creditRow?.planId === "promax" ||
        creditRow?.billingCycle === "admin_promax" ||
        (creditRow?.paidCredits && creditRow.paidCredits >= 900000) ||
        (creditRow?.paidCredits && creditRow.paidCredits >= 90);

      if (!isProMax) {
        return NextResponse.json(
          { error: "LinkedIn Profile Optimizer is exclusively available for Pro Max members (90 credits pool). Please upgrade to Pro Max to access." },
          { status: 403 }
        );
      }

      // Credit-wise check on 90 credits pool
      const currentCredits = creditRow?.paidCredits ?? 0;
      if (currentCredits <= 0) {
        return NextResponse.json(
          { error: "You have 0 credits remaining in your 90 credits pool. Please renew or upgrade your credits to continue using LinkedIn Profile Optimizer." },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { resumeText, targetRole, industry, jobDescription, linkedinUrl } = body;

    // Use provided resume text or a default placeholder from LinkedIn URL
    let content = resumeText;
    if (!content || !content.trim()) {
      if (linkedinUrl) {
        content = `LinkedIn Profile URL: ${linkedinUrl}\nCandidate is targeting ${targetRole || "Technical Roles"}.`;
      } else {
        return NextResponse.json(
          { error: "LinkedIn Profile URL or Resume text is required." },
          { status: 400 }
        );
      }
    }

    const prompt = buildLinkedInOptimizerPrompt(
      content,
      targetRole || "Target Industry Professional",
      industry || "Technology / Corporate",
      jobDescription,
      linkedinUrl
    );

    const rawResponse = await callAIText(prompt);
    const parsedData = extractJSON(rawResponse);

    // Deduct 1 credit for non-owner Pro Max users
    let remainingCredits: number | null = null;
    if (!isOwner && userCreditRow) {
      try {
        const currentPaid = userCreditRow.paidCredits ?? 0;
        const newPaidCredits = Math.max(0, currentPaid - 1);
        await admin
          .from("Credit")
          .update({ paidCredits: newPaidCredits })
          .eq("userId", activeUserId);
        remainingCredits = newPaidCredits;
        logger.info(`[linkedin-optimize] Deducted 1 credit for ${user.email}. Remaining credits: ${newPaidCredits}`);
      } catch (deductErr: any) {
        logger.error("[linkedin-optimize] Failed to deduct credit:", deductErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      data: parsedData,
      remainingCredits
    });
  } catch (error: any) {
    logger.error("[linkedin-optimize] API error:", error?.message);
    return NextResponse.json(
      { error: error?.message || "Failed to generate LinkedIn optimization pack." },
      { status: 500 }
    );
  }
}

