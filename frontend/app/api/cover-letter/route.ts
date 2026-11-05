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

    if (!jobDescription || typeof jobDescription !== "string" || !jobDescription.trim()) {
      return NextResponse.json(
        { error: "Job description is required to generate a personalized cover letter." },
        { status: 400 }
      );
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
        (creditRow?.paidCredits && creditRow.paidCredits >= 900000);

      if (!isProMax) {
        return NextResponse.json(
          { error: "AI Cover Letter Studio is exclusively available for Pro Max members. Please upgrade to Pro Max to access." },
          { status: 403 }
        );
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

    return NextResponse.json({ coverLetter });
  } catch (error: any) {
    logger.error("[cover-letter] API Route error:", error?.message);
    return NextResponse.json(
      { error: error?.message || "Failed to generate personalized cover letter." },
      { status: 500 }
    );
  }
}
