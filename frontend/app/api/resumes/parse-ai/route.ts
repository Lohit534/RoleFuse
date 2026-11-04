import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { callAIText } from "@/lib/ai/router";
import { logger } from "@/lib/logger";
import { isOwnerEmail } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 45;

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    // Check Plan: Pro and Pro Max (or Owner) only
    const isOwner = isOwnerEmail(user.email);
    if (!isOwner) {
      const admin = getAdminClient() as any;
      const { data: creditRow } = await admin
        .from("Credit")
        .select("paidCredits")
        .eq("userId", user.id)
        .maybeSingle();

      const paidCredits = creditRow?.paidCredits ?? 0;
      let tier = "free";
      if (paidCredits >= 900000) tier = "promax";
      else if (paidCredits > 0) tier = "premium";

      if (tier === "free") {
        return NextResponse.json(
          {
            error: "AI Resume Import is an exclusive Pro & Pro Max feature. Please upgrade your plan to import resumes via AI.",
            isUpgradeRequired: true,
          },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== "string" || text.trim().length < 40) {
      return NextResponse.json(
        { error: "Please provide resume text with sufficient details to import." },
        { status: 400 }
      );
    }

    logger.info(`[api/resumes/parse-ai] Parsing resume via AI for user ${user.email}...`);

    const prompt = `You are an elite ATS resume parser. Extract structured resume information from the following text into a clean, accurate JSON object.
Do NOT invent or fabricate facts, companies, or degrees. Extract only what is present in the text.

RESUME TEXT TO PARSE:
"""
${text.slice(0, 10000)}
"""

OUTPUT FORMAT:
Return ONLY a valid JSON object with EXACTLY this structure (no markdown fences, no extra text):
{
  "name": "Candidate Full Name",
  "email": "email@example.com",
  "phone": "Phone Number",
  "location": "City, State or Country",
  "linkedin": "linkedin.com/in/username",
  "github": "github.com/username",
  "website": "portfolio or website URL",
  "summary": "2-4 sentence professional summary",
  "experience": [
    {
      "company": "Company Name",
      "title": "Job Title / Role",
      "date": "Month Year – Month Year (or Present)",
      "bullets": [
        "Action verb accomplishment bullet 1",
        "Action verb accomplishment bullet 2"
      ]
    }
  ],
  "education": [
    {
      "school": "University or Institution Name",
      "degree": "Degree (e.g. B.Tech, B.S., M.S., High School)",
      "field": "Field of Study (e.g. Computer Science)",
      "date": "Year or Date Range (e.g. 2022 – 2026)",
      "gpa": "CGPA or GPA (e.g. 8.5/10 or 3.8/4.0)",
      "description": ""
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "techStack": "Technologies used (comma separated)",
      "link": "Project URL or GitHub link",
      "date": "Year or duration",
      "bullets": [
        "Description or impact bullet 1"
      ]
    }
  ],
  "skills": [
    {
      "category": "Programming Languages",
      "list": ["Python", "JavaScript", "Java"]
    },
    {
      "category": "Frameworks & Libraries",
      "list": ["React", "Node.js"]
    },
    {
      "category": "Databases & Tools",
      "list": ["PostgreSQL", "Git", "Docker"]
    }
  ],
  "certifications": [
    "Certification Name – Provider"
  ],
  "languages": [
    "English", "Spanish"
  ],
  "achievements": [
    "Notable achievement sentence"
  ]
}`;

    const rawResponse = await callAIText(prompt);
    let cleaned = rawResponse.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\r?\n?/i, "").replace(/\r?\n?```$/i, "").trim();
    }

    let parsedData: any;
    try {
      parsedData = JSON.parse(cleaned);
    } catch (parseErr) {
      // Fallback regex cleanup if JSON contained trailing commas
      const fixedJson = cleaned.replace(/,\s*([}\]])/g, "$1");
      parsedData = JSON.parse(fixedJson);
    }

    // Attach generated IDs for experience, education, projects, skills to match StructuredResume schema
    const structuredResult = {
      name: parsedData.name || "",
      email: parsedData.email || "",
      phone: parsedData.phone || "",
      location: parsedData.location || "",
      linkedin: parsedData.linkedin || "",
      github: parsedData.github || "",
      website: parsedData.website || "",
      summary: parsedData.summary || "",
      experience: Array.isArray(parsedData.experience)
        ? parsedData.experience.map((e: any) => ({
            id: Math.random().toString(36).substring(2, 9),
            company: e.company || "",
            title: e.title || "",
            date: e.date || "",
            bullets: Array.isArray(e.bullets) ? e.bullets.filter(Boolean) : [],
          }))
        : [],
      education: Array.isArray(parsedData.education)
        ? parsedData.education.map((e: any) => ({
            id: Math.random().toString(36).substring(2, 9),
            school: e.school || "",
            degree: e.degree || "",
            field: e.field || "",
            date: e.date || "",
            gpa: e.gpa || "",
            description: e.description || "",
          }))
        : [],
      projects: Array.isArray(parsedData.projects)
        ? parsedData.projects.map((p: any) => ({
            id: Math.random().toString(36).substring(2, 9),
            name: p.name || "",
            techStack: p.techStack || "",
            link: p.link || "",
            date: p.date || "",
            bullets: Array.isArray(p.bullets) ? p.bullets.filter(Boolean) : [],
          }))
        : [],
      skills: Array.isArray(parsedData.skills)
        ? parsedData.skills.map((s: any) => ({
            id: Math.random().toString(36).substring(2, 9),
            category: s.category || "General",
            list: Array.isArray(s.list) ? s.list.filter(Boolean) : [],
          }))
        : [],
      certifications: Array.isArray(parsedData.certifications) ? parsedData.certifications.filter(Boolean) : [],
      languages: Array.isArray(parsedData.languages) ? parsedData.languages.filter(Boolean) : [],
      achievements: Array.isArray(parsedData.achievements) ? parsedData.achievements.filter(Boolean) : [],
    };

    return NextResponse.json({
      success: true,
      data: structuredResult,
    });
  } catch (error: any) {
    logger.error("[api/resumes/parse-ai] Parsing failed:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to parse resume with AI. Please try again or paste details directly." },
      { status: 500 }
    );
  }
}
