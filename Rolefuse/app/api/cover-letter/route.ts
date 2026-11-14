import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildCoverLetterPrompt } from "@/lib/ai/prompts";
import { callAIText } from "@/lib/ai/router";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isEmailUser = user.app_metadata?.provider === "email" || user.identities?.[0]?.provider === "email";
    if (isEmailUser && !user.email_confirmed_at) {
      return NextResponse.json({ error: "Please verify your email address to generate cover letters." }, { status: 403 });
    }

    const body = await request.json();
    const { resumeText, jobDescription, jobTitle, company, tone } = body;

    if (!resumeText || typeof resumeText !== "string" || !resumeText.trim()) {
      return NextResponse.json(
        { error: "Resume text is required to generate a personalized cover letter." },
        { status: 400 }
      );
    }

    if (!jobDescription || typeof jobDescription !== "string" || jobDescription.trim().length < 50) {
      return NextResponse.json(
        { error: "Job description is required and must contain at least 50 characters." },
        { status: 400 }
      );
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

      const hasPaidCredits = (creditRow?.paidCredits ?? 0) > 0;
      const isPaidUser =
        userRow?.planTier === "promax" ||
        userRow?.planTier === "premium" ||
        creditRow?.planId === "promax" ||
        creditRow?.planId === "premium" ||
        creditRow?.billingCycle === "admin_promax" ||
        creditRow?.billingCycle === "admin_premium";

      if (isPaidUser && !hasPaidCredits) {
        return NextResponse.json(
          { error: "You have 0 credits remaining in your plan. Please wait for your next billing cycle reset or renew your plan to continue using Cover Letter Studio." },
          { status: 403 }
        );
      }

      if (!isPaidUser && !hasPaidCredits) {
        // Free tier allowance: 1 sample cover letter
        const freeUsed = creditRow?.freeUsed ?? 0;
        if (freeUsed >= 1) {
          return NextResponse.json(
            { error: "You have used your 1 free cover letter sample. Please upgrade to Premium Pro (5 letters/month) or Pro Max (15 letters/month) to generate more cover letters." },
            { status: 403 }
          );
        }
      }
    }

    const prompt = buildCoverLetterPrompt(
      resumeText,
      jobDescription,
      jobTitle || "target position",
      company || "company",
      tone
    );

    const coverLetter = await callAIText(prompt);

    // Deduct 1 credit for non-owners (cuts from paidCredits or increments freeUsed)
    let remainingCredits: number | null = null;
    if (!isOwner && userCreditRow) {
      try {
        const currentPaid = userCreditRow.paidCredits ?? 0;
        if (currentPaid > 0) {
          const newPaidCredits = Math.max(0, currentPaid - 1);
          await admin
            .from("Credit")
            .update({ paidCredits: newPaidCredits })
            .eq("userId", activeUserId);
          remainingCredits = newPaidCredits;
          logger.info(`[cover-letter] Deducted 1 paid credit for ${user.email}. Remaining: ${newPaidCredits}`);
        } else {
          const currentFreeUsed = userCreditRow.freeUsed ?? 0;
          const newFreeUsed = currentFreeUsed + 1;
          await admin
            .from("Credit")
            .update({ freeUsed: newFreeUsed })
            .eq("userId", activeUserId);
          remainingCredits = 0;
          logger.info(`[cover-letter] Incremented freeUsed for ${user.email}: ${newFreeUsed}`);
        }
      } catch (deductErr: any) {
        logger.error("[cover-letter] Failed to deduct credit:", deductErr.message);
      }
    }

    return NextResponse.json({ coverLetter, remainingCredits });
  } catch (error: any) {
    logger.error("[cover-letter] API Route error:", error?.message);
    return NextResponse.json(
      { error: error?.message || "Failed to generate personalized cover letter." },
      { status: 500 }
    );
  }
}
