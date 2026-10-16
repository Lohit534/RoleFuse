import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import { detectMissingFields } from "@/lib/resume-inspector";
import { hasQuantifiedMetric, localScore } from "@/lib/ats/scorer";
import { extractScorableBullets } from "@/lib/ats/bullets";

export const runtime = "nodejs";
export const maxDuration = 30; // Quick pre-check, should take < 10s

function findWeakBulletsLocally(
  resumeText: string,
): Array<{ id: string; originalBullet: string; question: string; hint: string }> {
  const lines = (resumeText || "").split(/\r?\n/);
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
    if (clean.length < 15 || clean.length > 250) continue;

    // Check if bullet lacks measurable metrics
    if (!hasQuantifiedMetric(clean)) {
      let q = "What was the measurable outcome, scale, or percentage improvement achieved?";
      let h = "e.g., Improved efficiency by 35%, handled 10,000+ daily users, reduced latency by 40ms";

      if (/performance|speed|latency|load|fast|optimi/i.test(clean)) {
        q = "By what percentage or time did performance, speed, or latency improve?";
        h = "e.g., Reduced response latency by 45%, cut page load time from 3s to 800ms";
      } else if (/user|client|customer|traffic|visitor/i.test(clean)) {
        q = "Approximately how many users, customers, or daily requests were handled?";
        h = "e.g., Scaled to 50k+ active users, handled 1M+ API calls daily";
      } else if (/test|bug|fix|issue|defect|error|coverage/i.test(clean)) {
        q = "How many issues/bugs did you resolve, or what test coverage % was reached?";
        h = "e.g., Resolved 80+ critical bugs, raised unit test coverage from 60% to 92%";
      } else if (/database|data|query|pipeline|etl|storage|cache/i.test(clean)) {
        q = "What was the data volume processed, or by how much was query execution time reduced?";
        h = "e.g., Processed 2TB+ daily data, reduced query execution time by 60%";
      } else if (/api|service|backend|microservice|endpoint/i.test(clean)) {
        q = "How many endpoints did you develop, and what throughput or uptime was achieved?";
        h = "e.g., Built 25+ microservice endpoints, maintained 99.9% service uptime";
      } else if (/lead|managed|team|coordinate|collaborate/i.test(clean)) {
        q = "What was the size of the team, or what deadline/milestone did you achieve?";
        h = "e.g., Mentored a team of 4 engineers, delivered project 2 weeks ahead of schedule";
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

export function gatherAllMissingQuestions(resumeText: string, jobDescription?: string) {
  const questions: Array<{
    id: string;
    category: "year_date" | "tech_stack" | "metrics" | "education" | "general";
    title: string;
    originalBullet?: string;
    question: string;
    hint: string;
  }> = [];

  const text = resumeText || "";
  const upperText = text.toUpperCase();

  // 1. Internship / Work Experience Duration & Dates Detection
  const hasInternship = /\b(intern|internship|trainee|apprentice)\b/i.test(text);
  const hasExpSection = /(?:EXPERIENCE|WORK EXPERIENCE|INTERNSHIPS?|EMPLOYMENT HISTORY)\b/i.test(text);

  // Extract experience/internship section text to check if dates/durations exist specifically in that section
  const expMatch = text.match(/(?:EXPERIENCE|WORK EXPERIENCE|INTERNSHIPS?|EMPLOYMENT HISTORY)[\s\S]*?(?=(?:EDUCATION|PROJECTS?|TECHNICAL SKILLS|SKILLS|CERTIFICATIONS?|LANGUAGES?|$))/i);
  const expSectionText = expMatch ? expMatch[0] : (hasInternship ? text : "");

  const expDatePattern = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+20\d{2}\b|\b20\d{2}\s*[–\-]\s*(20\d{2}|Present|Current)\b|\b\d+\s*(?:months?|weeks?|yrs?|years?)\b/i;
  const hasExpSpecificDates = expSectionText ? expDatePattern.test(expSectionText) : false;

  if ((hasInternship || hasExpSection) && !hasExpSpecificDates) {
    questions.push({
      id: "internship_duration",
      category: "year_date",
      title: "Internship / Work Duration & Period",
      question: "What was the duration or time period (start & end months/year) for your internship or work experience?",
      hint: "e.g., June 2023 – August 2023 (3 Months) or May 2024 – July 2024",
    });
  }

  // 2. Internship & Project Tech Stack Detection
  const hasProjects = /(?:PROJECTS?|ACADEMIC PROJECTS?|KEY PROJECTS?)\b/i.test(upperText);
  // Check if projects or internship have explicit tech stack notation or if candidate needs to specify stack
  const projMatch = text.match(/(?:PROJECTS?|ACADEMIC PROJECTS?|KEY PROJECTS?)[\s\S]*?(?=(?:EDUCATION|EXPERIENCE|WORK EXPERIENCE|INTERNSHIPS?|SKILLS|CERTIFICATIONS?|$))/i);
  const projSectionText = projMatch ? projMatch[0] : "";
  const hasExplicitTechInProjs = /(?:tech\s*stack|technologies|tools\s*used|stack|\bused\s*:)\b/i.test(projSectionText) ||
    /\|\s*(?:React|Node|Python|Java|SQL|Spring|Django|Express|AWS|MongoDB)/i.test(projSectionText);

  if ((hasProjects && !hasExplicitTechInProjs) || (hasInternship && !/(?:React|Node|Python|Java|SQL|Spring|Django|Express|AWS|MongoDB|TypeScript|C\+\+)\b/i.test(expSectionText))) {
    questions.push({
      id: "tech_stack",
      category: "tech_stack",
      title: "Internship & Project Tech Stack",
      question: "Which technologies, frameworks, and programming languages did you use during your internship and key projects?",
      hint: "e.g., React.js, Node.js, Express, PostgreSQL, Tailwind CSS, Git",
    });
  }

  // 3. SSC (10th) School Education Detection
  const hasEducation =
    upperText.includes("EDUCATION") ||
    upperText.includes("B.TECH") ||
    upperText.includes("BACHELOR") ||
    upperText.includes("COLLEGE") ||
    upperText.includes("UNIVERSITY") ||
    upperText.includes("ACADEMIC");

  const hasSSC = /\b(ssc|10th|class\s*x\b|secondary\s*school|matriculation|high\s*school)\b/i.test(text);

  if (hasEducation && !hasSSC) {
    questions.push({
      id: "ssc_education",
      category: "education",
      title: "SSC (10th) School & Education Details",
      question: "What is your SSC / 10th school name, education board, passing year, and CGPA or percentage?",
      hint: "e.g., Z.P. High School | State Board | 2018 | CGPA: 9.2 or 88%",
    });
  }

  // 4. College Graduation Year & CGPA/GPA
  const hasGPA = /(GPA|CGPA|%)\s*:?\s*[\d.]+/i.test(text);
  const hasGradYear = /\b20\d{2}\b/.test(text);

  if (hasEducation && (!hasGPA || !hasGradYear)) {
    questions.push({
      id: "education_details",
      category: "education",
      title: "College Graduation Year & GPA / CGPA",
      question: "What is your college graduation year and GPA/CGPA or percentage?",
      hint: "e.g., 2021 – 2025 | CGPA: 8.5 / 10",
    });
  }

  // 5. Missing target Job Description skills
  if (jobDescription && jobDescription.length > 50) {
    const score = localScore(resumeText, jobDescription);
    const topMissing = score.missingKeywords.slice(0, 3);
    if (topMissing.length > 0) {
      questions.push({
        id: "target_skills",
        category: "tech_stack",
        title: "Target Job Skills Alignment",
        question: `Do you have experience with ${topMissing.join(", ")}? Enter any you have worked with:`,
        hint: `e.g., ${topMissing.join(", ")}`,
      });
    }
  }

  // 6. Weak experience / project bullets missing quantifiable metrics
  const weakBullets = findWeakBulletsLocally(resumeText);
  for (const b of weakBullets) {
    questions.push({
      id: b.id,
      category: "metrics",
      title: "Quantified Metric",
      originalBullet: b.originalBullet,
      question: b.question,
      hint: b.hint,
    });
  }

  return questions.slice(0, 5);
}

export async function POST(request: NextRequest) {
  try {
    const { resumeText, jobDescription } = await request.json();

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
