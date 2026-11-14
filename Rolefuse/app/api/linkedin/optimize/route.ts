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
          { error: "LinkedIn Profile Optimizer is exclusively available for Pro Max members (90 credits pool). Please upgrade to Pro Max to access." },
          { status: 403 }
        );
      }

      // Credit-wise check on 90 credits pool: LinkedIn Profile Optimization requires 2 credits
      const currentCredits = creditRow?.paidCredits ?? 0;
      if (currentCredits < 2) {
        return NextResponse.json(
          { error: `LinkedIn Profile Optimization requires 2 Pro Max credits. You have ${currentCredits} credit${currentCredits === 1 ? "" : "s"} remaining in your pool. Please top up or renew your credits to continue.` },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { resumeText, targetRole, industry, jobDescription, linkedinUrl } = body;

    // Strict validation: Job description must be provided and contain at least 50 characters
    if (!jobDescription || typeof jobDescription !== "string" || jobDescription.trim().length < 50) {
      return NextResponse.json(
        { error: "Target job description is required and must contain at least 50 characters." },
        { status: 400 }
      );
    }

    const userIds = Array.from(
      new Set(
        [
          activeUserId,
          user.id,
          user.email,
          user.user_metadata?.email,
          user.email?.toLowerCase(),
        ].filter(Boolean)
      )
    );

    // Use provided resume/profile text or look up candidate's latest saved resume across user aliases
    let content = resumeText;
    if (!content || !content.trim()) {
      for (const uid of userIds) {
        try {
          const { data: dbResumes } = await admin
            .from("Resume")
            .select("originalText, optimizedText")
            .eq("userId", uid)
            .order("createdAt", { ascending: false })
            .limit(5);
          if (dbResumes && dbResumes.length > 0) {
            for (const r of dbResumes) {
              const txt = r.optimizedText || r.originalText;
              if (txt && txt.trim().length > 80) {
                content = txt;
                break;
              }
            }
          }
        } catch (_e) {}
        if (content) break;
      }
    }

    // Also check optimization history for candidate profile data if not yet found
    if (!content || !content.trim()) {
      for (const uid of userIds) {
        try {
          const { data: hist } = await admin
            .from("History")
            .select("optimizedResumeText, resumeText, inputResume")
            .eq("userId", uid)
            .order("createdAt", { ascending: false })
            .limit(3);
          if (hist && hist.length > 0) {
            for (const h of hist) {
              const txt = h.optimizedResumeText || h.resumeText || h.inputResume;
              if (txt && txt.trim().length > 80) {
                content = txt;
                break;
              }
            }
          }
        } catch (_e) {}
        if (content) break;
      }
    }

    // Exact LinkedIn profile parser & ATS metrics calculation
    const { parseLinkedInProfile, calculateLinkedInProfileMetrics } = await import("@/lib/parser/linkedin-parser");
    const parsedProfile = parseLinkedInProfile(content || "", linkedinUrl);
    const metrics = calculateLinkedInProfileMetrics(parsedProfile, jobDescription, targetRole);

    if (!content || !content.trim()) {
      if (linkedinUrl) {
        content = `LinkedIn Profile: ${parsedProfile.fullName}\nHeadline: ${parsedProfile.headline}\nTarget Role: ${targetRole || "Technical Role"}\nURL: ${linkedinUrl}`;
      } else {
        return NextResponse.json(
          { error: "LinkedIn Profile URL or profile content is required." },
          { status: 400 }
        );
      }
    }

    const prompt = buildLinkedInOptimizerPrompt(
      content,
      targetRole || parsedProfile.headline || "Target Industry Professional",
      industry || "Technology / Corporate",
      jobDescription,
      linkedinUrl || parsedProfile.linkedinUrl,
      parsedProfile,
      metrics
    );

    const rawResponse = await callAIText(prompt);
    const parsedData = extractJSON(rawResponse);

    // Merge exact parsed profile and ATS metrics into response pack
    parsedData.extractedProfile = parsedProfile;
    if (metrics.profileScore) {
      parsedData.profileScore = metrics.profileScore;
    }

    if (!parsedData.skillGaps) {
      parsedData.skillGaps = {
        missingSkills: metrics.missingSkills.slice(0, 20),
        matchedSkills: metrics.matchedSkills,
      };
    } else {
      parsedData.skillGaps.missingSkills = Array.from(new Set([
        ...metrics.missingSkills.slice(0, 15),
        ...(parsedData.skillGaps.missingSkills || []),
      ])).slice(0, 20);

      parsedData.skillGaps.matchedSkills = Array.from(new Set([
        ...metrics.matchedSkills,
        ...(parsedData.skillGaps.matchedSkills || []),
      ]));
    }

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
        logger.info(`[linkedin-optimize] Deducted 2 credits for ${user.email}. Remaining credits: ${newPaidCredits}`);
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

