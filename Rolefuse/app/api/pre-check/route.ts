import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import { detectMissingFields } from "@/lib/resume-inspector";
import { hasQuantifiedMetric, localScore } from "@/lib/ats/scorer";
import { extractScorableBullets } from "@/lib/ats/bullets";
import { sanitizeJobDescription } from "@/lib/ai/router";

export const runtime = "nodejs";
export const maxDuration = 30; // Quick pre-check, should take < 10s

function findWeakBulletsLocally(
  resumeText: string,
): Array<{ id: string; originalBullet: string; question: string; hint: string }> {
  const results: Array<{
    id: string;
    originalBullet: string;
    question: string;
    hint: string;
  }> = [];

  // Shared section-aware extractor: never asks metric questions about
  // Certifications, Languages, Education or Skills entries.
  for (const item of extractScorableBullets(resumeText)) {
    const clean = item.cleanText;
    if (clean.length < 15 || clean.length > 280) continue;

    // Check if bullet lacks measurable metrics
    if (!hasQuantifiedMetric(clean)) {
      let q = "What was the measurable outcome, scale, or percentage improvement achieved from this task?";
      let h = "e.g., Improved efficiency by 35%, handled 10,000+ daily users, reduced latency by 40ms";

      if (/performance|speed|latency|load time|fast|optimi|throughput|benchmark/i.test(clean)) {
        q = "By what exact percentage or time unit did performance, speed, or latency improve?";
        h = "e.g., Reduced p95 response latency by 45%, cut page load time from 3s to 800ms, boosted throughput by 2x";
      } else if (/user|client|customer|traffic|visitor|request|session/i.test(clean)) {
        q = "Approximately how many users, customers, or daily requests were handled?";
        h = "e.g., Scaled to 50k+ active users, handled 1M+ API calls daily, served 5,000 concurrent sessions";
      } else if (/test|bug|fix|issue|defect|error|coverage|regression|qa/i.test(clean)) {
        q = "How many issues or bugs did you fix, or what test coverage percentage was reached?";
        h = "e.g., Resolved 80+ critical bugs, raised unit test coverage from 60% to 92%, fixed 15+ production regressions";
      } else if (/database|data|query|pipeline|etl|storage|cache|table|index|migration/i.test(clean)) {
        q = "What was the data volume processed, or by how much was query execution time reduced?";
        h = "e.g., Processed 2TB+ daily data, reduced query time by 60%, migrated 500K+ records with zero downtime";
      } else if (/api|service|backend|microservice|endpoint|rest|graphql|webhook/i.test(clean)) {
        q = "How many APIs or endpoints did you build, and what throughput or uptime was maintained?";
        h = "e.g., Built 25+ REST endpoints, maintained 99.9% uptime, reduced API response time by 30%";
      } else if (/lead|managed|team|coordinate|collab|mentor|supervise|review/i.test(clean)) {
        q = "What was the team size, and what specific milestone or deadline was achieved?";
        h = "e.g., Led a team of 5 engineers, delivered feature 2 weeks early, mentored 3 junior developers";
      } else if (/deploy|ci\/cd|docker|kubernetes|automat|pipeline|jenkins|github action|release/i.test(clean)) {
        q = "By how much did the deployment or release pipeline speed improve?";
        h = "e.g., Reduced deployment time by 45%, achieved 3x faster release cycles, cut CI build time from 20 to 7 min";
      } else if (/cost|budget|saving|revenue|money|\$|₹|spend|opex|capex/i.test(clean)) {
        q = "What was the exact cost saving, revenue increase, or budget impact achieved?";
        h = "e.g., Reduced cloud infrastructure costs by ₹2L/month, saved $15K in annual compute spend";
      } else if (/model|\bml\b|machine learning|\bai\b|nlp|accuracy|precision|recall|loss/i.test(clean)) {
        q = "What accuracy, precision, or performance metric improvement did the AI/ML model achieve?";
        h = "e.g., Improved model accuracy by 18%, reduced prediction error by 12%, trained on 500K+ labeled samples";
      } else if (/ui|frontend|interface|screen|component|page|dashboard|design/i.test(clean)) {
        q = "How many screens or components were built, or what performance improvement was measured?";
        h = "e.g., Built 15+ reusable React components, reduced LCP from 4s to 1.2s, increased Lighthouse score by 30pts";
      }

      results.push({
        id: `bullet_q${results.length + 1}`,
        originalBullet: clean,
        question: q,
        hint: h,
      });

      if (results.length >= 3) break;
    }
  }

  return results;
}

function extractInternshipContext(text: string): { title: string; subtitle: string } {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  let foundSection = false;
  let roleTitle = "";
  let companyOrDetails = "";

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/(?:EXPERIENCE|WORK EXPERIENCE|INTERNSHIPS?|EMPLOYMENT HISTORY)\b/i.test(l)) {
      foundSection = true;
      continue;
    }
    if (foundSection && /(?:EDUCATION|PROJECTS?|TECHNICAL SKILLS|SKILLS|CERTIFICATIONS?|LANGUAGES?)\b/i.test(l)) {
      break;
    }

    if (foundSection || /\b(intern|internship|trainee|apprentice)\b/i.test(l)) {
      if (!roleTitle && !l.startsWith("•") && !l.startsWith("-") && !l.startsWith("*")) {
        roleTitle = l.replace(/^[#*•\s\-_]+/, "").replace(/[:\-_]+$/, "").trim();
        if (i + 1 < lines.length && !lines[i + 1].startsWith("•") && !lines[i + 1].startsWith("-") && !lines[i + 1].startsWith("*")) {
          companyOrDetails = lines[i + 1].replace(/^[#*•\s\-_]+/, "").replace(/[:\-_]+$/, "").trim();
        }
        break;
      }
    }
  }

  return {
    title: roleTitle || "Internship / Work Experience",
    subtitle: companyOrDetails || "Role & Organization details from your resume",
  };
}

function extractProjectContext(text: string): { title: string; subtitle: string } {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  let foundProj = false;
  let projTitle = "";
  let projDetails = "";

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/(?:PROJECTS?|ACADEMIC PROJECTS?|KEY PROJECTS?)\b/i.test(l)) {
      foundProj = true;
      continue;
    }
    if (foundProj && /(?:EDUCATION|EXPERIENCE|WORK EXPERIENCE|INTERNSHIPS?|SKILLS|CERTIFICATIONS?)\b/i.test(l)) {
      break;
    }

    if (foundProj && !l.startsWith("•") && !l.startsWith("-") && !l.startsWith("*") && l.length > 3) {
      if (!projTitle) {
        if (l.includes("—") || l.includes(" - ") || l.includes("|")) {
          const parts = l.split(/\s*[—|\-]\s*/);
          projTitle = parts[0].trim();
          projDetails = parts.slice(1).join(" | ").trim();
        } else {
          projTitle = l.trim();
          if (i + 1 < lines.length && !lines[i + 1].startsWith("•") && !lines[i + 1].startsWith("-")) {
            projDetails = lines[i + 1].trim();
          }
        }
        break;
      }
    }
  }

  return {
    title: projTitle || "Key Resume Project",
    subtitle: projDetails || "Project details from your resume",
  };
}

export function gatherAllMissingQuestions(resumeText: string, jobDescription?: string) {
  const sanitizedJd = jobDescription ? sanitizeJobDescription(jobDescription) : "";
  const questions: Array<{
    id: string;
    category: "year_date" | "tech_stack" | "metrics" | "education" | "general";
    title: string;
    originalBullet?: string;
    question: string;
    hint: string;
    contextTitle?: string;
    contextSubtitle?: string;
  }> = [];

  const text = resumeText || "";
  const upperText = text.toUpperCase();
  const internCtx = extractInternshipContext(text);
  const projCtx = extractProjectContext(text);

  // 1. Role-Specific Missing JD Skills (prioritized first so questions are dynamic and role-specific)
  if (sanitizedJd && sanitizedJd.length > 50) {
    const score = localScore(resumeText, sanitizedJd);
    const topMissing = score.missingKeywords.slice(0, 3);
    if (topMissing.length > 0) {
      questions.push({
        id: "target_skills",
        category: "tech_stack",
        title: "Target Job Skills Alignment",
        question: `Do you have hands-on experience with ${topMissing.join(", ")}? Enter any you have worked with:`,
        hint: `e.g., ${topMissing.join(", ")}`,
        contextTitle: "Target Job Alignment",
        contextSubtitle: `Key technical skills from job requirements: ${topMissing.join(", ")}`,
      });
    }
  }

  // 2. Weak experience / project bullets missing quantifiable metrics (specific to candidate's bullets)
  const weakBullets = findWeakBulletsLocally(resumeText);
  for (const b of weakBullets.slice(0, 2)) {
    questions.push({
      id: b.id,
      category: "metrics",
      title: "Quantified Metric",
      originalBullet: b.originalBullet,
      question: b.question,
      hint: b.hint,
      contextTitle: "Target Resume Bullet",
      contextSubtitle: b.originalBullet,
    });
  }

  // 3. Internship / Work Experience Duration & Dates Detection (only if dates are truly missing)
  const hasInternship = /\b(intern|internship|trainee|apprentice)\b/i.test(text);
  const hasExpSection = /(?:EXPERIENCE|WORK EXPERIENCE|INTERNSHIPS?|EMPLOYMENT HISTORY)\b/i.test(text);

  const expMatch = text.match(/(?:EXPERIENCE|WORK EXPERIENCE|INTERNSHIPS?|EMPLOYMENT HISTORY)[\s\S]*?(?=(?:EDUCATION|PROJECTS?|TECHNICAL SKILLS|SKILLS|CERTIFICATIONS?|LANGUAGES?|$))/i);
  const expSectionText = expMatch ? expMatch[0] : (hasInternship ? text : "");

  const expDatePattern = /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,–\-\/]+20\d{2}\b|\b\d{1,2}\/\d{2,4}\b|\b20\d{2}\s*[–\-\/]\s*(?:20\d{2}|Present|Current)\b|\b(?:19|20)\d{2}\b|\b\d+\s*(?:months?|weeks?|yrs?|years?)\b/i;
  const hasExpSpecificDates = expSectionText ? expDatePattern.test(expSectionText) : false;

  if ((hasInternship || hasExpSection) && !hasExpSpecificDates) {
    questions.push({
      id: "internship_duration",
      category: "year_date",
      title: "Internship / Work Duration & Period",
      question: `What was the duration or time period (start & end months/year) for: ${internCtx.title}?`,
      hint: "e.g., June 2023 – August 2023 (3 Months) or May 2024 – July 2024",
      contextTitle: internCtx.title,
      contextSubtitle: internCtx.subtitle,
    });
  }

  // 4. Internship & Project Tech Stack Detection (only if not already listed in experience or project lines)
  const hasProjects = /(?:PROJECTS?|ACADEMIC PROJECTS?|KEY PROJECTS?)\b/i.test(upperText);
  const projMatch = text.match(/(?:PROJECTS?|ACADEMIC PROJECTS?|KEY PROJECTS?)[\s\S]*?(?=(?:EDUCATION|EXPERIENCE|WORK EXPERIENCE|INTERNSHIPS?|SKILLS|CERTIFICATIONS?|$))/i);
  const projSectionText = projMatch ? projMatch[0] : "";
  const hasExplicitTechInProjs = /(?:tech\s*stack|technologies|tools\s*used|stack|\bused\s*:)\b/i.test(projSectionText) ||
    /\|\s*(?:React|Node|Python|Java|SQL|Spring|Django|Express|AWS|MongoDB|PostgreSQL|Docker)/i.test(projSectionText);

  if ((hasProjects && !hasExplicitTechInProjs) && (hasInternship && !/(?:React|Node|Python|Java|SQL|Spring|Django|Express|AWS|MongoDB|TypeScript|C\+\+)\b/i.test(expSectionText))) {
    questions.push({
      id: "tech_stack",
      category: "tech_stack",
      title: "Project & Work Tech Stack",
      question: `Which core technologies and tools did you use for: ${projCtx.title}?`,
      hint: "e.g., React.js, Node.js, Express, PostgreSQL, Tailwind CSS, Git",
      contextTitle: projCtx.title,
      contextSubtitle: projCtx.subtitle,
    });
  }

  // 5. Project Completion Year Detection (only if missing)
  const hasProjectYear = projSectionText ? /\b(?:19|20)\d{2}\b/.test(projSectionText) : false;
  if (hasProjects && !hasProjectYear) {
    questions.push({
      id: "project_year",
      category: "year_date",
      title: "Project Completion Year(s)",
      question: `Which year(s) did you build or complete "${projCtx.title}"?`,
      hint: "e.g., 2025, 2024 (or May 2024 – Aug 2024)",
      contextTitle: projCtx.title,
      contextSubtitle: projCtx.subtitle,
    });
  }

  return questions.slice(0, 4);
}

export async function POST(request: NextRequest) {
  try {
    const { resumeText, jobDescription: rawJd } = await request.json();
    const jobDescription = rawJd ? sanitizeJobDescription(rawJd) : "";

    if (!resumeText || resumeText.length < 50) {
      return NextResponse.json({ questions: [] });
    }

    // 1. Verify auth (optional fallback for guest/sample mode)
    const supabase = createClient();
    let {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const authHeader = request.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.replace("Bearer ", "").trim();
        const { data: tokenData } = await supabase.auth.getUser(token);
        if (tokenData?.user) user = tokenData.user;
      }
    }

    // Gather all structural missing fields (years, dates, GPA, stack) and weak metrics
    const questions = gatherAllMissingQuestions(resumeText, jobDescription);
    return NextResponse.json({ questions });
  } catch (error: any) {
    logger.error(`[pre-check] Error: ${error.message}`);
    return NextResponse.json({ questions: [] });
  }
}
