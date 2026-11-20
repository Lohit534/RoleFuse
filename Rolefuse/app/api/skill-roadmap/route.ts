import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callAIText } from "@/lib/ai/router";
import { logger } from "@/lib/logger";

function buildSkillRoadmapPrompt(
  skills: string[],
  jobTitle?: string,
  company?: string,
  jobDescription?: string,
  resumeText?: string
): string {
  const skillList = skills.join(", ");
  const isSingle = skills.length === 1;
  const focusLabel = isSingle ? skills[0] : `[${skillList}]`;

  let context = "";
  if (jobTitle || company) {
    context += `\n🎯 TARGET ROLE: ${jobTitle || "Technical Role"}${company ? ` at ${company}` : ""}`;
  }
  if (jobDescription) {
    context += `\n📋 TARGET JOB REQUIREMENTS:\n${jobDescription.slice(0, 1500)}`;
  }
  if (resumeText) {
    context += `\n👤 CANDIDATE EXISTING BACKGROUND & SKILLS:\n${resumeText.slice(0, 1500)}`;
  }

  return `You are a senior technical career coach and curriculum director. Generate a highly detailed, personalized, and authentic 90-day "Watch & Build" learning roadmap for the candidate.
PRIMARY SKILLS TO MASTER: ${skillList}
${context}

CRITICAL RULES:
- The roadmap MUST be deeply tailored to ${focusLabel}${jobTitle ? ` and the hiring expectations for ${jobTitle}` : ""}.
- Strictly avoid generic, canned, or static templates. Each section must provide real, accurate, and actionable guidance.
- Bridge the candidate's existing background directly to the requirements in the target job description.
- Include real, well-known YouTube channels, open-source repositories, and verified learning resources that specifically teach ${skillList}.
- Include specific frameworks, tools, libraries, and real production architecture patterns relevant to ${skillList}.
- If multiple skills are provided, demonstrate how they INTEGRATE into a single production stack and capstone project.
- Format the roadmap clearly with 4 phases, emoji section headers, and bullet points.
- Each phase must specify: Goal, What to Learn (with actual topic names), Recommended YouTube Channels or Resources (with channel descriptions).
- End with a "Daily Routine" section.
- Be specific, practical, and actionable. Avoid vague or filler content.
- Do NOT use markdown code blocks, LaTeX, or HTML. Use plain text with emoji section headers.

OUTPUT FORMAT (follow exactly):
🚀 90-Day "Watch & Build" Roadmap: ${focusLabel}
[One line describing what this roadmap will achieve for ${jobTitle || "the target role"}]

---

📅 Phase 1: [Descriptive Phase Name] (Weeks 1–4)
Goal: [Specific goal]
What to Learn:
• [Specific topic 1 for ${skillList}]
• [Specific topic 2]
• [Specific topic 3]

📺 Best YouTube Channels / Resources:
• [Channel Name]: [Why it's specifically useful for ${skillList}]
• [Channel Name]: [Why it's specifically useful]

---

📅 Phase 2: [Descriptive Phase Name] (Weeks 5–8)
Goal: [Specific goal]
What to Learn:
• [Specific topic 1]
• [Specific topic 2]
• [Specific topic 3]

📺 Best YouTube Channels / Resources:
• [Channel Name]: [Description]
• [Channel Name]: [Description]

---

📅 Phase 3: [Project-Focused Phase] (Weeks 9–10)
Goal: [Specific goal]
What to Build:
• [Specific project idea combining ${skillList} aligned with ${jobTitle || "industry standards"}]
• [Another project idea]

📺 Best YouTube Channels / Resources:
• [Channel Name]: [Description]

---

📅 Phase 4: Production, Deployment & Portfolio (Weeks 11–12)
Goal: Deploy live and showcase on GitHub/portfolio.
What to Learn:
• [Deployment steps specific to ${skillList}]
• [Portfolio/documentation steps]

---

⚡ Daily Routine for Maximum Success:
1. Morning (45 mins): [Specific action for ${skillList}]
2. Afternoon (60–90 mins): [Specific action]
3. Weekend: [Specific project/practice task]

Now generate the complete personalized roadmap for: ${skillList}`;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { skills, jobTitle, company, jobDescription, resumeText } = body;

    if (!Array.isArray(skills) || skills.length === 0) {
      return NextResponse.json(
        { error: "Please provide at least 1 skill." },
        { status: 400 }
      );
    }

    if (skills.length > 3) {
      return NextResponse.json(
        { error: "You can select up to 3 skills at a time." },
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

    let userPlan = "free";
    let roadmapLimit = 0;
    let currentRoadmapCount = 0;

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
      const isProMax =
        userRow?.planTier === "promax" ||
        creditRow?.planId === "promax" ||
        creditRow?.billingCycle === "admin_promax" ||
        (creditRow?.paidCredits >= 90 && creditRow?.paidCredits < 900000);

      const isPremium =
        userRow?.planTier === "premium" ||
        creditRow?.planId === "premium" ||
        creditRow?.billingCycle === "admin_premium" ||
        creditRow?.billingCycle === "monthly" ||
        creditRow?.billingCycle === "yearly" ||
        (creditRow?.paidCredits > 0);

      if (isProMax) {
        userPlan = "promax";
        roadmapLimit = 15;
      } else if (isPremium) {
        userPlan = "premium";
        roadmapLimit = 5;
      } else {
        userPlan = "free";
        roadmapLimit = 0;
      }

      if (userPlan === "free") {
        return NextResponse.json(
          { error: "Skills learning roadmaps are a Premium Pro (5/month) and Pro Max (15/month) feature. Please upgrade your plan to unlock personalized career roadmaps." },
          { status: 403 }
        );
      }

      // Check monthly usage from Resume records
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const userIds = Array.from(new Set([activeUserId, user.id, user.email].filter(Boolean)));
      const { count: monthlyRoadmapCount } = await admin
        .from("Resume")
        .select("id", { count: "exact", head: true })
        .in("userId", userIds)
        .not("roadmap", "is", null)
        .gte("createdAt", startOfMonth.toISOString());

      currentRoadmapCount = monthlyRoadmapCount || 0;
      if (currentRoadmapCount >= roadmapLimit) {
        return NextResponse.json(
          {
            error: `You have reached your monthly quota of ${roadmapLimit} skill roadmaps on ${userPlan === "promax" ? "Pro Max" : "Premium Pro"}. ${userPlan === "promax" ? "Please wait for your next billing cycle reset." : "Please upgrade to Pro Max for 15 roadmaps per month."}`,
          },
          { status: 403 }
        );
      }
    }

    const prompt = buildSkillRoadmapPrompt(skills, jobTitle, company, jobDescription, resumeText);

    logger.info(`[skill-roadmap] Generating AI roadmap for: ${skills.join(", ")} (Role: ${jobTitle || "N/A"})`);
    const roadmap = await callAIText(prompt);

    return NextResponse.json({
      roadmap,
      usage: isOwner ? { used: 0, limit: 999999 } : { used: currentRoadmapCount + 1, limit: roadmapLimit },
    });
  } catch (error: any) {
    logger.error("[skill-roadmap] API Route error:", error?.message);
    return NextResponse.json(
      {
        error:
          error?.message || "Failed to generate skill roadmap. Please try again.",
      },
      { status: 500 }
    );
  }
}
