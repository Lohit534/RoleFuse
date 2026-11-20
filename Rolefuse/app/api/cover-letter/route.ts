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
    const { resumeText, jobDescription, jobTitle, company, tone, resumeId } = body;

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
    let activeUserId = user.id;
    try {
      if (user.email) {
        const { data: existingUser } = await admin
          .from("User")
          .select("id")
          .eq("email", user.email.toLowerCase().trim())
          .maybeSingle();
        if (existingUser?.id) activeUserId = existingUser.id;
      }
    } catch (_e) {}
    let userCreditRow: any = null;
    let currentLetterCount = 0;
    let letterLimit = 0;

    if (!isOwner) {
      const { data: userRow } = await admin
        .from("User")
        .select("planTier")
        .eq("id", activeUserId)
        .maybeSingle();

      const { data: creditRows } = await admin
        .from("Credit")
        .select("*")
        .or(`userId.eq.${activeUserId},userId.eq.${user.id}`)
        .limit(1);

      const creditRow = creditRows?.[0] || null;
      userCreditRow = creditRow;

      const hasPaidCredits = (creditRow?.paidCredits ?? 0) > 0;
      const isProMax =
        userRow?.planTier === "promax" ||
        creditRow?.planId === "promax" ||
        creditRow?.billingCycle === "admin_promax" ||
        (creditRow?.paidCredits >= 90 && creditRow?.paidCredits < 900000);

      const isPaidUser =
        isProMax ||
        userRow?.planTier === "premium" ||
        creditRow?.planId === "premium" ||
        creditRow?.billingCycle === "admin_premium" ||
        creditRow?.billingCycle === "monthly" ||
        creditRow?.billingCycle === "yearly" ||
        hasPaidCredits;

      letterLimit = isProMax ? 15 : isPaidUser ? 5 : 1;

      // Count cover letters created this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const userIds = Array.from(new Set([activeUserId, user.id, user.email].filter(Boolean)));
      const { count: monthlyLettersCount } = await admin
        .from("Resume")
        .select("id", { count: "exact", head: true })
        .in("userId", userIds)
        .not("coverLetter", "is", null)
        .gte("createdAt", startOfMonth.toISOString());

      currentLetterCount = monthlyLettersCount || 0;

      if (!isPaidUser) {
        if (currentLetterCount >= 1 || (creditRow?.freeUsed ?? 0) >= 1) {
          return NextResponse.json(
            { error: "You have used your 1 free cover letter sample. Please upgrade to Premium Pro (5 letters/month) or Pro Max (15 letters/month) to continue generating tailored cover letters." },
            { status: 403 }
          );
        }
      } else {
        if (currentLetterCount >= letterLimit) {
          return NextResponse.json(
            { error: `You have reached your monthly quota of ${letterLimit} cover letters on ${isProMax ? "Pro Max" : "Premium Pro"}. ${isProMax ? "Please wait for your next billing cycle reset." : "Please upgrade to Pro Max for 15 cover letters per month."}` },
            { status: 403 }
          );
        }
        if (!hasPaidCredits) {
          return NextResponse.json(
            { error: "You have 0 credits remaining in your plan. Please wait for your next billing cycle reset or renew your plan to continue using Cover Letter Studio." },
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

    // Persist cover letter to database for history retention based on plan
    let persistedResumeId = resumeId || null;
    try {
      if (persistedResumeId) {
        await admin
          .from("Resume")
          .update({ coverLetter })
          .eq("id", persistedResumeId);
      } else {
        const { data: newResume } = await admin
          .from("Resume")
          .insert({
            userId: activeUserId,
            jobTitle: (jobTitle || "Target Role").trim(),
            company: (company || "Target Company").trim(),
            originalText: resumeText,
            optimizedText: resumeText,
            jobDescription: jobDescription,
            coverLetter: coverLetter,
            scoreBefore: 70,
            scoreAfter: 75,
            createdAt: new Date().toISOString(),
          })
          .select("id")
          .maybeSingle();

        if (newResume?.id) {
          persistedResumeId = newResume.id;
        }
      }
    } catch (saveErr: any) {
      logger.warn("[cover-letter] Failed to persist cover letter to DB:", saveErr?.message);
    }

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
            .eq("id", userCreditRow.id);
          remainingCredits = newPaidCredits;
          logger.info(`[cover-letter] Deducted 1 paid credit for ${user.email}. Remaining: ${newPaidCredits}`);
        } else {
          const currentFreeUsed = userCreditRow.freeUsed ?? 0;
          const newFreeUsed = currentFreeUsed + 1;
          await admin
            .from("Credit")
            .update({ freeUsed: newFreeUsed })
            .eq("id", userCreditRow.id);
          remainingCredits = 0;
          logger.info(`[cover-letter] Incremented freeUsed for ${user.email}: ${newFreeUsed}`);
        }
      } catch (deductErr: any) {
        logger.error("[cover-letter] Failed to deduct credit:", deductErr.message);
      }
    }

    return NextResponse.json({
      coverLetter,
      remainingCredits,
      resumeId: persistedResumeId,
      usage: isOwner ? { used: 0, limit: 999999 } : { used: currentLetterCount + 1, limit: letterLimit },
    });
  } catch (error: any) {
    logger.error("[cover-letter] API Route error:", error?.message);
    return NextResponse.json(
      { error: error?.message || "Failed to generate personalized cover letter." },
      { status: 500 }
    );
  }
}
