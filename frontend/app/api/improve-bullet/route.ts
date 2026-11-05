import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callAIText } from "@/lib/ai/router";
import { extractTechTerms } from "@/lib/ats/keywords";
import { logger } from "@/lib/logger";
import { stripMarkdownAsterisks } from "@/lib/export/pdf-document";
import { hasQuantifiedMetric } from "@/lib/ats/scorer";
import { enforceVerbAndMetric, cleanBulletText, RECOMMENDED_VERBS } from "@/lib/ats/bullets";

function cleanBulletOutput(value: unknown, originalBullet: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("The AI did not return a rewritten bullet.");
  }

  // Take first non-empty line
  let cleaned =
    stripMarkdownAsterisks(value)
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find((l) => l.length > 0) || "";

  // Strip leading bullet characters or numbers
  cleaned = cleaned.replace(/^\s*([-*•+]|\d+\.)\s+/, "").trim();

  // Strip generic label prefixes like "Optimized:", "Improved:", "Rewritten:", "Bullet:"
  // (requires a colon/dash so real action verbs such as "Optimized MySQL…" are kept)
  cleaned = cleaned
    .replace(
      /^(?:Optimized|Improved|Rewritten|Enhanced|Revised|Updated|Bullet)\s*(?:bullet)?\s*[:–\-]\s+/i,
      "",
    )
    .trim();

  // If the model literally just prepended "Optimized " to the original bullet, strip it
  const lowerOriginal = originalBullet
    .trim()
    .toLowerCase()
    .replace(/^[•\-\*+\s]+/, "");
  if (
    cleaned.toLowerCase().startsWith("optimized ") &&
    cleaned.slice(10).trim().toLowerCase() === lowerOriginal
  ) {
    cleaned = cleaned.slice(10).trim();
  }

  return cleaned;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verify Authentication (optional check)
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 2. Parse Request Body
    const body = await request.json();
    const { bullet, jobDescription, isSummary, type, jobTitle } = body;

    if (!bullet || typeof bullet !== "string" || !bullet.trim()) {
      return NextResponse.json(
        { error: "Input text is required." },
        { status: 400 },
      );
    }

    const jd = jobDescription || "";
    const isSummaryRequest = Boolean(isSummary || type === "summary");

    logger.info(
      `Improving ${isSummaryRequest ? "summary" : "bullet"} for user ${user?.email || "guest"}...`,
    );

    if (isSummaryRequest) {
      const summaryPrompt = `
You are an expert technical resume writer. Your task is to rewrite and optimize a candidate's Professional Summary to make it highly engaging, impact-focused, concise (3-4 sentences), and ATS-aligned.

Candidate Title / Domain: "${jobTitle || "Professional"}"
Current Summary Input: "${bullet}"
Target Job Description: "${jd.slice(0, 3000)}"

Instructions:
1. Write a professional, high-impact 3-4 sentence summary paragraph.
2. Highlight core technical competencies, key domain experience, and major strengths matching the job.
3. Do NOT use first-person pronouns ("I", "my", "me").
4. Keep all factual candidate details accurate and truthful.
5. Do NOT format as a bullet point. Output a clean paragraph.

Output MUST be a valid JSON object only (do NOT include markdown fences, leading/trailing text):
{
  "improvedBullet": "The complete rewritten 3-4 sentence professional summary paragraph.",
  "actionVerbUsed": "Summary Optimization",
  "keywordsInjected": ["key", "skills", "included"],
  "explanation": "Enhanced professional summary impact, keywords, and flow."
}
`;
      try {
        const responseText = await callAIText(summaryPrompt);
        let cleanedText = responseText.trim();
        if (cleanedText.startsWith("```")) {
          cleanedText = cleanedText
            .replace(/^```(?:json)?\r?\n?/i, "")
            .replace(/\r?\n?```$/i, "")
            .trim();
        }
        const parsed = JSON.parse(cleanedText);
        const rawSummary = parsed.improvedBullet || bullet;
        return NextResponse.json({
          improvedBullet: stripMarkdownAsterisks(rawSummary),
          actionVerbUsed: "Summary Optimization",
          keywordsInjected: parsed.keywordsInjected || [],
          explanation: parsed.explanation || "Optimized professional summary.",
        });
      } catch (err: any) {
        logger.warn("Summary AI improver fallback:", err.message);
        return NextResponse.json({
          improvedBullet: `Results-driven ${jobTitle || "Professional"} with proven expertise in developing scalable solutions and data-driven systems. Skilled in optimizing performance, technical problem-solving, and delivering high-impact projects. Dedicated to leveraging strong technical abilities to drive organizational growth. (${bullet.trim()})`,
          actionVerbUsed: "Summary Optimization",
          keywordsInjected: [],
          explanation: "Enhanced professional summary structure and tone.",
        });
      }
    }

    // Single bullet point optimization prompt
    const bulletPrompt = `
You are an elite technical resume editor specializing in ATS optimization and recruiter-targeted writing. Your task is to rewrite ONE resume bullet point into a high-impact, concise, ATS-optimized statement.

Input Bullet Point: "${bullet}"
Target Job Description: "${jd.slice(0, 2500)}"

CRITICAL RULES — FOLLOW ALL OF THESE:
1. Output EXACTLY ONE sentence (15 to 22 words). Never write multiple sentences, paragraphs, or explanations.
2. Structure: [Strong Past-Tense Action Verb] + [Specific Task/Technology] + [Realistic Quantified Impact].
   - First word MUST be a strong past-tense action verb from this list: ${RECOMMENDED_VERBS.join(", ")}.
   - NEVER start with: adverbs ("Successfully"), nouns, adjectives, gerunds ("Developing"), or "I".
   - NEVER wrap the sentence in quotation marks or bullet characters.
3. Quantified metric is MANDATORY. Use realistic, topic-appropriate numbers:
   - Performance: 30-50% improvement, 2x faster, reduced from Xs to Ys
   - Scale: 5,000+ users, 1M+ records, 20k+ daily requests
   - Code/Testing: 80+ issues fixed, 90% coverage, 15+ endpoints
   - Team/Delivery: team of 4-8, 2 weeks early, 3 sprints
   - Cost: ₹2L/month savings, 30% compute cost reduction
4. Keep the candidate's CORE task. Do NOT invent unmentioned technologies or fabricate unrealistic metrics.
5. Weave in JD-matching keywords naturally where contextually appropriate.

Examples:
Bad: "Worked on backend APIs."  
Good: "Engineered 18+ RESTful APIs using Spring Boot, reducing average response latency by 35% under peak load."

Bad: "Optimized queries."  
Good: "Optimized MySQL query execution plans, cutting average response time by 42% for a 500K+ record database."

Bad: "Developed UI components."  
Good: "Developed 20+ reusable React components, improving Lighthouse performance score from 62 to 94 across 8 pages."

Output ONLY this JSON (no markdown fences, no extra text):
{
  "improvedBullet": "Engineered 18+ RESTful APIs using Spring Boot, reducing average response latency by 35% under peak load.",
  "actionVerbUsed": "Engineered",
  "metricsAdded": "35% latency reduction, 18+ APIs",
  "keywordsInjected": ["Spring Boot", "RESTful APIs"],
  "explanation": "Replaced vague phrase with specific API count, technology, and measurable latency improvement."
}
`;

    try {
      const responseText = await callAIText(bulletPrompt);
      let cleanedText = responseText.trim();
      if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText
          .replace(/^```(?:json)?\r?\n?/i, "")
          .replace(/\r?\n?```$/i, "")
          .trim();
      }

      const parsed = JSON.parse(cleanedText);
      const cleaned = enforceVerbAndMetric(cleanBulletOutput(parsed.improvedBullet, bullet), bullet);
      return NextResponse.json({
        improvedBullet: cleaned,
        actionVerbUsed: cleaned.split(" ")[0] || parsed.actionVerbUsed || "Engineered",
        metricsAdded: parsed.metricsAdded || "Quantified metrics added",
        keywordsInjected: parsed.keywordsInjected || [],
        explanation:
          parsed.explanation ||
          "Rewritten concisely with strong action verb and quantified outcome.",
      });
    } catch (aiErr: any) {
      logger.warn(
        "Bullet AI improver call failed, using rule-based ATS fallback:",
        aiErr.message,
      );

      const cleanInput = bullet.trim()
        .replace(/^[-*•+\s]+/, "")
        .replace(/^(?:worked on|helped with|assisted with|assisted in|responsible for|handled|involved in)\s+/i, "");

      const actionVerbs = [
        "Spearheaded",
        "Engineered",
        "Optimized",
        "Architected",
        "Automated",
        "Delivered",
      ];
      const actionVerb =
        actionVerbs[Math.floor(Math.random() * actionVerbs.length)];

      let fallbackBullet = "";

      if (/certification|certified|course|diploma|license/i.test(cleanInput)) {
        fallbackBullet = `Achieved ${cleanInput.replace(/[.,;]+$/, "")}, completing 40+ hours of hands-on labs and assessments.`;
      } else {
        // If cleanInput already starts with an action verb, keep it; otherwise prepend actionVerb
        const startsWithVerb = /^(built|engineered|developed|implemented|designed|created|led|managed|architected|optimized|spearheaded|automated|deployed)\b/i.test(cleanInput);
        const baseTask = startsWithVerb ? cleanInput : `${actionVerb} ${cleanInput.charAt(0).toLowerCase() + cleanInput.slice(1)}`;
        const trimmedTask = baseTask.replace(/[.,;]+$/, "").trim();

        if (/speed|latency|performance|load|fast/i.test(cleanInput)) {
          fallbackBullet = `${trimmedTask}, reducing response latency by 35% and improving throughput.`;
        } else if (/user|traffic|client|customer/i.test(cleanInput)) {
          fallbackBullet = `${trimmedTask}, scaling to support 15,000+ active users with 99.9% uptime.`;
        } else if (/test|bug|fix|issue|defect|error|quality/i.test(cleanInput)) {
          fallbackBullet = `${trimmedTask}, resolving 50+ critical issues and raising test coverage to 90%.`;
        } else if (/database|query|data|pipeline|storage/i.test(cleanInput)) {
          fallbackBullet = `${trimmedTask}, reducing query execution time by 40% across high-volume datasets.`;
        } else {
          fallbackBullet = `${trimmedTask}, increasing operational efficiency by 30% and accelerating delivery.`;
        }
      }

      const guaranteedFallback = enforceVerbAndMetric(fallbackBullet, bullet);
      return NextResponse.json({
        improvedBullet: guaranteedFallback,
        actionVerbUsed: guaranteedFallback.split(" ")[0] || actionVerb,
        metricsAdded: "Quantified metric added",
        keywordsInjected: [],
        explanation:
          "Enhanced with concise action verb and quantified outcome.",
      });
    }
  } catch (error: any) {
    logger.error("Failed to process improvement request:", error);
    return NextResponse.json(
      { error: "Internal server error during optimization." },
      { status: 500 },
    );
  }
}
