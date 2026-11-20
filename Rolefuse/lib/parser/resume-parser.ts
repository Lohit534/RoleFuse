import { canonicalizeSkill, normSkillKey } from "../ats/keywords";
import {
  ResumeData,
  ResumeContact,
  ResumeSkillCategory,
  ResumeExperience,
  ResumeProject,
  ResumeEducation,
  ResumeCertification,
  isResumeData,
} from "@/types/resume";
import { normalizeResume, extractProfileUrls, normalizeProfileUrl } from "@/lib/resume/normalize";

// Rolefuse Resume Parser (Shared across PDF, DOCX, and live web preview)
// Strictly follows the ATS resume template specification

export interface ContactInfo {
  type: 'phone' | 'email' | 'linkedin' | 'github' | 'portfolio' | 'other';
  text: string;
  url?: string;
}

export interface SkillCategory {
  label: string;
  skills: string;
}

export interface ExperienceItem {
  title: string;
  company: string;
  dateRange: string;
  techTags: string;
  bullets: string[];
}

export interface ProjectItem {
  name: string;
  techStack: string;
  year: string;
  bullets: string[];
}

export interface CertificationItem {
  title: string;
  issuer?: string;
  year?: string;
  description?: string;
  raw: string;
  boldPrefix: string;
  rest: string;
}

export interface EducationItem {
  degree: string;
  institution: string;
  yearOrDates: string;
  grade: string;
}

export interface ParsedResume extends ResumeData {
  contacts: ContactInfo[];
  skills: (SkillCategory & ResumeSkillCategory)[];
  experience: (ExperienceItem & ResumeExperience)[];
  projects: (ProjectItem & ResumeProject)[];
  certifications: (CertificationItem & ResumeCertification)[];
  education: (EducationItem & ResumeEducation)[];
}

// Backward-compatible Block types for ResumeViewer & exports
export interface ContactSegment {
  text: string;
  url?: string;
  isLink: boolean;
}

export interface SkillLine {
  label: string;
  value: string;
}

export interface ProjectBlock {
  name: string;
  tech?: string;
  dates?: string;
  projectUrl?: string;
  bullets: string[];
}

export interface JobBlock {
  title: string;
  company: string;
  dates: string;
  tech?: string;
  bullets: string[];
}

export interface EducationBlock {
  degree: string;
  dates: string;
  school: string;
  gpa: string;
}

export interface StandaloneLink {
  label: string;
  url: string;
}

export type ParsedResumeBlock =
  | { type: 'name'; text: string }
  | { type: 'subtitle'; text: string }
  | { type: 'contact'; segments: ContactSegment[] }
  | { type: 'section'; text: string }
  | { type: 'summary'; text: string }
  | { type: 'skillLine'; label: string; value: string }
  | { type: 'project'; name: string; tech?: string; dates?: string; projectUrl?: string; bullets: string[] }
  | { type: 'job'; title: string; company: string; dates: string; tech?: string; bullets: string[] }
  | { type: 'education'; degree: string; dates: string; school: string; gpa: string }
  | { type: 'bullet'; text: string }
  | { type: 'link'; label: string; url: string }
  | { type: 'cert'; text: string }
  | { type: 'normal'; text: string }
  | { type: 'spacer' };

export type ResumeBlock = ParsedResumeBlock;

// ── Utility Functions ────────────────────────────────────────────────────────

export function stripMarkdownAsterisks(str: string): string {
  if (!str) return "";
  return str
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
    .replace(/\*/g, "")
    .replace(/\s*\|\|\s*/g, " | ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

export function cleanUrl(url: string): string {
  let clean = url.trim();
  if (clean.endsWith(')') || clean.endsWith(']') || clean.endsWith(',')) {
    clean = clean.substring(0, clean.length - 1);
  }
  if (!/^https?:\/\//i.test(clean)) {
    clean = 'https://' + clean;
  }
  return clean;
}

export function isRoleOrTitle(txt: string): boolean {
  if (!txt) return false;
  const clean = txt.trim().toLowerCase();
  if (
    /^(?:senior|junior|lead|principal|staff|associate|intern|trainee|full\s*stack|front\s*end|back\s*end|software|web|cloud|devops|data|ai|ml|mobile|android|ios|qa|test|ui\/?ux|product|project|java|python|react|node|javascript|c\+\+|golang)\b/i.test(clean) &&
    /\b(engineer|developer|architect|designer|analyst|scientist|consultant|manager|specialist|programmer|lead|intern|trainee)\b/i.test(clean)
  ) {
    return true;
  }
  if (/^(?:engineer|developer|architect|designer|analyst|scientist|consultant|manager|specialist|programmer)$/i.test(clean)) {
    return true;
  }
  return false;
}

const SMALL_TITLE_WORDS = new Set(['and', 'or', 'of', 'the', 'in', 'on', 'for', 'to', 'a', 'an', 'with']);

export function toSectionTitle(text: string): string {
  const clean = stripMarkdownAsterisks(text || '').replace(/^#+\s*/, '').replace(/:\s*$/, '').trim();
  return clean
    .toLowerCase()
    .split(/\s+/)
    .map((w, i) => (i > 0 && SMALL_TITLE_WORDS.has(w) ? w : w.replace(/(^|[-/(])([a-z])/g, (_m, p, c) => p + c.toUpperCase())))
    .join(' ');
}

export function splitCertText(text: string): { title: string; rest: string } {
  const clean = stripMarkdownAsterisks(text || '').replace(/^[•\-\*–\s\u2022]+/, '').trim();
  if (!clean) return { title: '', rest: '' };

  const isAchievement =
    /^(?:solved|won|ranked|secured|awarded|built|developed|engineered|spearheaded|achieved|completed|published|selected|scored|earned|received|participated|finalist|winner|top|1st|2nd|3rd)\b/i.test(clean) ||
    /^\d+\+?\s+(?:problems?|challenges?|questions?|algorithms?|projects?)\b/i.test(clean);

  if (isAchievement) {
    return { title: '', rest: clean };
  }

  // Format: "Title – Issuer (Year): Description"
  const colonDescMatch = clean.match(/^(.+?)\s*[–—\-]\s*([^:]+:\s*.+)$/);
  if (colonDescMatch && colonDescMatch[1].length <= 80) {
    return { title: colonDescMatch[1].trim(), rest: ' – ' + colonDescMatch[2].trim() };
  }

  // Match "Title – Issuer"
  const sepMatch = clean.match(/^(.+?)\s*(?:[–—]|\||\s-\s|\bby\b|\bfrom\b)\s*([^–—\-|]+(?:\s*\(\d{4}\))?.*)$/i);
  if (sepMatch && sepMatch[1].trim().length >= 2 && sepMatch[1].trim().length <= 80) {
    let title = sepMatch[1].trim();
    let issuer = sepMatch[2].replace(/^[–—\-|]\s*/, '').trim();

    // Deduplicate repeated issuer names like "Infosys Springboard – Infosys Springboard", "CodeTantra – CodeTantra"
    const issuerParts = issuer.split(/\s*[-–—|]\s*/);
    if (issuerParts.length >= 2 && issuerParts[0].toLowerCase() === issuerParts[1].toLowerCase()) {
      issuer = issuerParts[0].trim();
    }

    // If title already ends with issuer, strip it
    const esc = issuer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    title = title.replace(new RegExp(`(?:\\s*[-–—|:]+\\s*|\\s+by\\s+|\\s+from\\s+)${esc}$`, "i"), "").trim();

    return { title, rest: issuer ? ' – ' + issuer : '' };
  }

  const m = clean.match(/^(.{2,80}?)(\s[–—-]\s.*|\s\(\d{4}\).*)$/);
  if (m) return { title: m[1].trim(), rest: ' ' + m[2].trim() };

  return { title: '', rest: clean };
}

export function isCertOrAchievementLine(text: string): boolean {
  if (!text) return false;
  const clean = stripMarkdownAsterisks(text).replace(/^[•\-*\u2022\s]+/, '').trim();
  if (!clean || clean.length < 5) return false;
  // Specific certification platforms, credentials, or courses
  if (/(?:certification|certificate|certified|hackerrank|springboard|codetantra|leetcode|codechef|coursera|udemy|nptel|licen[sc]e)\b/i.test(clean)) {
    return true;
  }
  // Algorithmic and academic achievements
  if (/^(?:solved|ranked|won|secured|completed)\s+\d+\+?\s+(?:problems?|challenges?|questions?|dsa|algorithms?)/i.test(clean)) {
    return true;
  }
  if (/^(?:participated|represented|awarded|recognized|published)\b/i.test(clean) && /(?:hackathon|competition|academic\s*projects?|symposium|seminar|teamwork)/i.test(clean)) {
    return true;
  }
  return false;
}

export function extractRoleFromResume(textOrResume: string | any, jobTitle?: string | null): string {
  let text = "";
  let explicitTitle = jobTitle;

  if (typeof textOrResume === "object" && textOrResume !== null) {
    explicitTitle = explicitTitle || textOrResume.jobTitle;
    text = textOrResume.optimizedText || textOrResume.originalText || "";
  } else if (typeof textOrResume === "string") {
    text = textOrResume;
  }

  // 1. Check explicit job title if provided and not generic
  if (explicitTitle) {
    const raw = explicitTitle.trim();
    const isGeneric = !raw || /^(?:untitled\s*resume|resume\s*optimization|target\s*role(?:\s*application)?|optimized\s*resume|general\s*application|resume)$/i.test(raw);
    if (!isGeneric && raw.length > 2) {
      return raw;
    }
  }

  // 2. Extract from resume text
  if (text) {
    const parsed = parseResume(text);

    // Subtitle / role on line 2 (e.g. "Java Backend Developer")
    if (parsed.role && isRoleOrTitle(parsed.role)) {
      return parsed.role;
    }

    // Previous role / most recent job title from experience (e.g. "Software Engineer – Backend" -> "Software Engineer")
    if (parsed.experience && parsed.experience.length > 0) {
      const expTitle = parsed.experience[0].title;
      if (expTitle) {
        const cleanTitle = expTitle.split(/[–—\-]/)[0].trim();
        if (cleanTitle && isRoleOrTitle(cleanTitle)) {
          return cleanTitle;
        }
        if (isRoleOrTitle(expTitle)) {
          return expTitle;
        }
      }
    }

    // Check early non-contact lines (lines 1 to 4)
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    for (let i = 1; i < Math.min(5, lines.length); i++) {
      const line = stripMarkdownAsterisks(lines[i]).replace(/^[#*•\s]+/, "").trim();
      if (line && isRoleOrTitle(line) && !line.includes("@") && !line.includes("|") && line.length < 50) {
        return line;
      }
    }
  }

  return "";
}

export function getCleanExportFilename(text: string, ext = ".pdf", jobTitle?: string | null): string {
  // 1. Try extracting role name
  const role = extractRoleFromResume(text, jobTitle);
  if (role && role.length > 2) {
    const cleanRole = role.replace(/[^a-zA-Z0-9\s]/g, "").trim().replace(/\s+/g, "_");
    if (cleanRole && cleanRole.length > 2) {
      return `${cleanRole}_Resume${ext}`;
    }
  }

  // 2. Rolename not mentioned: set resume name as it is (candidate's name or "Resume")
  let candidateName = "";
  if (text) {
    const firstLine = text.trim().split("\n")[0] || "";
    candidateName = firstLine
      .replace(/^[#*•\s]+/, "")
      .replace(/[^a-zA-Z0-9\s_]/g, "")
      .trim()
      .replace(/\s+/g, "_");
  }

  if (!candidateName || candidateName.length < 2) {
    candidateName = "Resume";
  }

  candidateName = candidateName.replace(/_?optimized/gi, "").replace(/_?fasthire/gi, "").replace(/_?rolefuse/gi, "").trim();
  if (!candidateName) candidateName = "Resume";

  if (!candidateName.toUpperCase().includes("RESUME")) {
    return `${candidateName}_Resume${ext}`;
  }
  return `${candidateName}${ext}`;
}

export function isFresherResume(text: string): boolean {
  if (!text) return true;
  const lower = text.toLowerCase();
  if (lower.includes("bachelor of technology") || lower.includes("b.tech") || lower.includes("undergraduate") || lower.includes("fresher")) {
    return true;
  }
  return false;
}

export function getMaxPages(_text: string): 1 | 2 {
  return 1;
}

export function computeDensityScale(_text: string, _blocks?: any[]): number {
  return 1.0;
}

// ── Regex Helpers for Date and Grade Extraction ──────────────────────────────

const DATE_REGEX_END = /(?:(?:Graduated:\s*)?(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?\d{4}(?:\s*[\–\—\-]\s*(?:(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?\d{4}|Present|Current|Ongoing))?|\b\d{4}\s*[\–\—\-]\s*(?:\d{4}|Present|Current|Ongoing)|\b(?:19|20)\d{2}\b)$/i;

const PURE_DATE_REGEX = /^(?:(?:Graduated:\s*)?(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?\d{4}(?:\s*[\–\—\-]\s*(?:(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?\d{4}|Present|Current|Ongoing))?|\b\d{4}\s*[\–\—\-]\s*(?:\d{4}|Present|Current|Ongoing)|\b(?:19|20)\d{2}\b)$/i;

const GRADE_REGEX_END = /(?:(?:CGPA|GPA)\s*:\s*[\dX\.]+(?:\s*\/\s*\d+)?|[\dX\.]+\s*\/\s*10|[\dX\.]+\s*(?:CGPA|GPA))$/i;

const PURE_GRADE_REGEX = /^(?:(?:CGPA|GPA)\s*:\s*[\dX\.]+(?:\s*\/\s*\d+)?|[\dX\.]+\s*\/\s*10|[\dX\.]+\s*(?:CGPA|GPA))$/i;

function extractRightDate(line: string): { left: string; date: string } {
  const match = line.match(DATE_REGEX_END);
  if (match) {
    const date = match[0].trim();
    let remaining = line.slice(0, match.index).trim();
    remaining = remaining.replace(/[\s|–—\-,:]+$/, "").trim();
    return { left: remaining, date };
  }
  return { left: line.replace(/[\s|–—\-,:]+$/, "").trim(), date: "" };
}

function extractRightGrade(line: string): { left: string; grade: string } {
  const match = line.match(GRADE_REGEX_END);
  if (match) {
    const grade = match[0].trim();
    let remaining = line.slice(0, match.index).trim();
    remaining = remaining.replace(/[\s|–—\-,:]+$/, "").trim();
    return { left: remaining, grade };
  }
  return { left: line.replace(/[\s|–—\-,:]+$/, "").trim(), grade: "" };
}

function extractRightDateAndGrade(line: string): { left: string; date: string; grade: string } {
  let remaining = line.replace(/[\s|–—\-,:]+$/, "").trim();
  let date = "";
  let grade = "";

  const gradeMatch = remaining.match(GRADE_REGEX_END);
  if (gradeMatch) {
    grade = gradeMatch[0].trim();
    remaining = remaining.slice(0, gradeMatch.index).trim().replace(/[\s|–—\-,:]+$/, "").trim();
  }

  const dateMatch = remaining.match(DATE_REGEX_END);
  if (dateMatch) {
    date = dateMatch[0].trim();
    remaining = remaining.slice(0, dateMatch.index).trim().replace(/[\s|–—\-,:]+$/, "").trim();
  }

  if (!grade) {
    const secondGradeMatch = remaining.match(GRADE_REGEX_END);
    if (secondGradeMatch) {
      grade = secondGradeMatch[0].trim();
      remaining = remaining.slice(0, secondGradeMatch.index).trim().replace(/[\s|–—\-,:]+$/, "").trim();
    }
  }

  return { left: remaining, date, grade };
}

// ── Canonical Section Map ───────────────────────────────────────────────────

const SECTION_HEADERS_MAP: Record<string, string> = {
  'SUMMARY': 'SUMMARY',
  'PROFESSIONAL SUMMARY': 'SUMMARY',
  'OBJECTIVE': 'SUMMARY',
  'PROFILE': 'SUMMARY',
  'SKILLS': 'SKILLS',
  'TECHNICAL SKILLS': 'SKILLS',
  'CORE SKILLS': 'SKILLS',
  'CORE COMPETENCIES': 'SKILLS',
  'KEY SKILLS': 'SKILLS',
  'EXPERIENCE': 'EXPERIENCE',
  'WORK EXPERIENCE': 'EXPERIENCE',
  'PROFESSIONAL EXPERIENCE': 'EXPERIENCE',
  'INTERNSHIP': 'EXPERIENCE',
  'INTERNSHIPS': 'EXPERIENCE',
  'WORK HISTORY': 'EXPERIENCE',
  'EMPLOYMENT HISTORY': 'EXPERIENCE',
  'PROJECTS': 'PROJECTS',
  'PERSONAL PROJECTS': 'PROJECTS',
  'KEY PROJECTS': 'PROJECTS',
  'ACADEMIC PROJECTS': 'PROJECTS',
  'AWARDS & CERTIFICATIONS': 'AWARDS & CERTIFICATIONS',
  'AWARDS AND CERTIFICATIONS': 'AWARDS & CERTIFICATIONS',
  'CERTIFICATIONS & AWARDS': 'AWARDS & CERTIFICATIONS',
  'CERTIFICATIONS': 'AWARDS & CERTIFICATIONS',
  'CERTIFICATES': 'AWARDS & CERTIFICATIONS',
  'ACHIEVEMENTS': 'AWARDS & CERTIFICATIONS',
  'CERTIFICATIONS & ACHIEVEMENTS': 'AWARDS & CERTIFICATIONS',
  'CERTIFICATIONS AND ACHIEVEMENTS': 'AWARDS & CERTIFICATIONS',
  'EDUCATION': 'EDUCATION',
  'ACADEMIC BACKGROUND': 'EDUCATION',
  'ACADEMICS': 'EDUCATION',
  'QUALIFICATIONS': 'EDUCATION',
  'LANGUAGES': 'LANGUAGES',
  'LANGUAGES SPOKEN': 'LANGUAGES',
  'LANGUAGES KNOWN': 'LANGUAGES',
};

function matchSectionHeader(line: string): string | null {
  const clean = line.replace(/^[#*•\s\-_]+/, '').replace(/[:\-_]+$/, '').trim();
  const upper = clean.toUpperCase();
  if (SECTION_HEADERS_MAP[upper]) {
    return SECTION_HEADERS_MAP[upper];
  }
  return null;
}

// ── Adapt ResumeData to ParsedResume (Guarantees 100% Dual-Format Compatibility) ──

export function adaptResumeDataToParsedResume(data: ResumeData, originalText?: string): ParsedResume {
  const contacts: ContactInfo[] = [];
  const c = data.contact || {};
  let liUrl = c.linkedin;
  let ghUrl = c.github;
  let portUrl = c.portfolio;

  if ((!liUrl || !ghUrl || !portUrl) && originalText) {
    const fallbackExtracted = extractProfileUrls(originalText);
    if (!liUrl && fallbackExtracted.linkedin) liUrl = fallbackExtracted.linkedin;
    if (!ghUrl && fallbackExtracted.github) ghUrl = fallbackExtracted.github;
    if (!portUrl && fallbackExtracted.portfolio) portUrl = fallbackExtracted.portfolio;
  }

  if (c.phone) contacts.push({ type: "phone", text: c.phone, url: `tel:${c.phone.replace(/[^+\d]/g, "")}` });
  if (c.email) contacts.push({ type: "email", text: c.email, url: `mailto:${c.email}` });
  if (liUrl) {
    const fullLi = normalizeProfileUrl(liUrl, "linkedin");
    contacts.push({ type: "linkedin", text: "LinkedIn", url: fullLi });
  }
  if (ghUrl) {
    const fullGh = normalizeProfileUrl(ghUrl, "github");
    contacts.push({ type: "github", text: "GitHub", url: fullGh });
  }
  if (portUrl) {
    const fullPort = normalizeProfileUrl(portUrl, "portfolio");
    contacts.push({ type: "portfolio", text: "Portfolio", url: fullPort });
  }
  if (c.location) contacts.push({ type: "other", text: c.location });

  const skills: (SkillCategory & ResumeSkillCategory)[] = (data.skills || []).map((s) => ({
    label: s.label,
    items: s.items || [],
    skills: (s.items || []).join(", "),
  }));

  const experience: (ExperienceItem & ResumeExperience)[] = (data.experience || []).map((e) => {
    const dates = [e.start, e.end].filter(Boolean).join(" – ");
    const tags = Array.isArray(e.tags) ? e.tags : [];
    return {
      title: e.title,
      company: e.company,
      start: e.start,
      end: e.end,
      dateRange: dates,
      tags,
      techTags: tags.join(", "),
      bullets: e.bullets || [],
    };
  });

  const projects: (ProjectItem & ResumeProject)[] = (data.projects || []).map((p) => {
    const tags = Array.isArray(p.tags) ? p.tags : [];
    return {
      name: p.name,
      tags,
      techStack: tags.join(", "),
      year: p.year || "",
      link: p.link,
      bullets: p.bullets || [],
    };
  });

  const certifications: (CertificationItem & ResumeCertification)[] = (data.certifications || []).map((cert) => {
    let cleanTitle = (cert.title || "").trim();
    let cleanIssuer = (cert.issuer || "").trim();

    // 1. Clean bullet prefixes if any
    cleanTitle = cleanTitle.replace(/^[•\-\*–—\s]+/, "").trim();
    cleanIssuer = cleanIssuer.replace(/^[•\-\*–—\s]+/, "").trim();

    // 2. If cleanTitle ends with cleanIssuer or contains "– Issuer"
    if (cleanIssuer) {
      const esc = cleanIssuer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      cleanTitle = cleanTitle.replace(new RegExp(`(?:\\s*[-–—|:]+\\s*|\\s+by\\s+|\\s+from\\s+)${esc}$`, "i"), "").trim();
    } else if (/[-–—|]/.test(cleanTitle)) {
      const parts = cleanTitle.split(/\s*[-–—|]\s*/);
      if (parts.length >= 2) {
        cleanTitle = parts[0].trim();
        cleanIssuer = parts.slice(1).join(" – ").trim();
      }
    }

    // 3. Deduplicate repeated segments in cleanIssuer (e.g. "Infosys Springboard – Infosys Springboard", "CodeTantra – CodeTantra")
    if (cleanIssuer) {
      const issuerParts = cleanIssuer.split(/\s*[-–—|]\s*/);
      if (issuerParts.length >= 2 && issuerParts[0].toLowerCase() === issuerParts[1].toLowerCase()) {
        cleanIssuer = issuerParts[0].trim();
      }
    }

    if (cleanIssuer) {
      const esc = cleanIssuer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      cleanTitle = cleanTitle.replace(new RegExp(`(?:\\s*[-–—|:]+\\s*|\\s+by\\s+|\\s+from\\s+)${esc}$`, "i"), "").trim();
    }

    cleanTitle = cleanTitle.replace(/[\s|–—\-,:]+$/, "").trim();
    cleanIssuer = cleanIssuer.replace(/[\s|–—\-,:]+$/, "").trim();

    const raw = [cleanTitle, cleanIssuer].filter(Boolean).join(" – ") + (cert.year ? ` (${cert.year})` : "");
    return {
      title: cleanTitle,
      issuer: cleanIssuer || undefined,
      year: cert.year,
      raw,
      boldPrefix: cleanTitle,
      rest: cleanIssuer ? ` – ${cleanIssuer}` : "",
    };
  });

  const education: (EducationItem & ResumeEducation)[] = (data.education || []).map((ed) => {
    let degree = (ed.degree || "").trim();
    let inst = (ed.institution || "").trim();
    let start = ed.start ? ed.start.trim() : undefined;
    let end = ed.end ? ed.end.trim() : undefined;
    let score = ed.score ? ed.score.trim() : undefined;

    // 1. Strip date from degree if already present (e.g. "B.Tech in CSE | 2022 - 2026")
    const dateInDegree = degree.match(/\s*\|\s*(\b(?:19|20)\d{2}\b(?:\s*[-–—\s]+\s*(?:(?:19|20)\d{2}|Present|Current))?)\s*$/i);
    if (dateInDegree) {
      if (!start && !end) {
        const parts = dateInDegree[1].split(/\s*[-–—\s]+\s*/);
        start = parts[0];
        if (parts[1]) end = parts[1];
      }
      degree = degree.replace(dateInDegree[0], "").trim();
    }

    // 2. Strip score from inst if already present (e.g. "... | CGPA: 7.62")
    const scoreInInst = inst.match(/\s*\|\s*((?:CGPA|GPA|Percentage|Score)?\s*:?\s*[\d.]+(?:\s*\/\s*[\d.]+)?%?)\s*$/i);
    if (scoreInInst) {
      if (!score) score = scoreInInst[1];
      inst = inst.replace(scoreInInst[0], "").trim();
    }

    // 3. Strip dates from inst if attached
    const dateInInst = inst.match(/\s*\|\s*(\b(?:19|20)\d{2}\b(?:\s*[-–—\s]+\s*(?:(?:19|20)\d{2}|Present|Current))?)\s*$/i);
    if (dateInInst) {
      if (!start && !end) {
        const parts = dateInInst[1].split(/\s*[-–—\s]+\s*/);
        start = parts[0];
        if (parts[1]) end = parts[1];
      }
      inst = inst.replace(dateInInst[0], "").trim();
    }

    degree = degree.replace(/[\s|–—\-,:]+$/, "").trim();
    inst = inst.replace(/[\s|–—\-,:]+$/, "").trim();

    const dates = [start, end].filter(Boolean).join(" – ");
    return {
      degree,
      institution: inst,
      start,
      end,
      score,
      yearOrDates: dates,
      grade: score || "",
    };
  });

  return {
    name: data.name,
    role: data.role || "",
    contact: data.contact || {},
    contacts,
    summary: data.summary || "",
    skills,
    experience,
    projects,
    certifications,
    education,
    achievements: data.achievements || [],
    languages: data.languages || [],
  };
}

// ── Main Shared Parser ───────────────────────────────────────────────────────

export function parseResume(rawText: string | ResumeData, originalText?: string): ParsedResume {
  if (isResumeData(rawText)) {
    return adaptResumeDataToParsedResume(rawText, originalText);
  }

  if (typeof rawText === "string" && rawText.trim().startsWith("{")) {
    try {
      const parsedJSON = JSON.parse(rawText);
      if (isResumeData(parsedJSON) || (parsedJSON.name && (parsedJSON.experience || parsedJSON.skills))) {
        return adaptResumeDataToParsedResume(parsedJSON, originalText);
      }
    } catch {}
  }

  const rawLines = (typeof rawText === "string" ? rawText : "").split(/\r?\n/).map(l => l.trim());
  let name = "";
  let role = "";
  const contacts: ContactInfo[] = [];

  const rawSections: Record<string, string[]> = {
    'SUMMARY': [],
    'SKILLS': [],
    'EXPERIENCE': [],
    'PROJECTS': [],
    'AWARDS & CERTIFICATIONS': [],
    'EDUCATION': [],
    'LANGUAGES': [],
  };

  let currentSection: string | null = null;
  let lineIdx = 0;

  // 1. Header parsing (Name, Role, Contacts)
  while (lineIdx < rawLines.length) {
    const line = rawLines[lineIdx];
    if (!line) {
      lineIdx++;
      continue;
    }

    const sec = matchSectionHeader(line);
    if (sec) {
      currentSection = sec;
      lineIdx++;
      break;
    }

    if (!name) {
      name = stripMarkdownAsterisks(line).replace(/^[#*\s]+/, '').trim();
      lineIdx++;
      continue;
    }

    // Role / subtitle line: second non-empty line if it looks like a job title
    if (!role && isRoleOrTitle(line) && !line.includes('@') && !line.includes('|')) {
      role = stripMarkdownAsterisks(line);
      lineIdx++;
      continue;
    }

    // Contact line extraction
    // Split on common delimiters: tabs, 2+ spaces, vertical bars, bullet points, font icon markers
    const tokens = line.split(/(?:\s{2,}|\s*[|•\u2022]\s*|[ƒ#ï§€])/).map(t => t.trim()).filter(Boolean);
    for (const token of tokens) {
      // Remove any leading icon glyphs or symbols and trailing delimiters
      const cleanTok = token.replace(/^[ƒ#ï§€|•\s\-\*]+/, '').replace(/[\s|–—\-,:]+$/, '').trim();
      if (!cleanTok) continue;

      if (/@/.test(cleanTok)) {
        if (!contacts.some(c => c.type === 'email')) {
          contacts.push({ type: 'email', text: cleanTok, url: `mailto:${cleanTok}` });
        }
      } else if (/(?:\+?\d{1,3}[-.\s]?)?\(?[\dX]{3}\)?[-.\s]?[\dX]{3}[-.\s]?[\dX]{4}|\+?[\dX]{10,13}|^\+91-[\dX]+/i.test(cleanTok)) {
        if (!contacts.some(c => c.type === 'phone')) {
          contacts.push({ type: 'phone', text: cleanTok, url: `tel:${cleanTok.replace(/[^+\d]/g, '')}` });
        }
      } else if (/linkedin\.com/i.test(cleanTok) || /^linkedin\b/i.test(cleanTok)) {
        if (!contacts.some(c => c.type === 'linkedin')) {
          const display = cleanTok.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
          const hasUrl = cleanTok.includes('.com') || cleanTok.includes('/');
          // Always store a normalised https:// URL; fallback scan will upgrade it if needed
          contacts.push({
            type: 'linkedin',
            text: display || 'LinkedIn',
            url: hasUrl ? (cleanTok.startsWith('http') ? cleanTok : `https://${cleanTok}`) : undefined
          });
        }
      } else if (/github\.com/i.test(cleanTok) || /^github\b/i.test(cleanTok)) {
        if (!contacts.some(c => c.type === 'github')) {
          const display = cleanTok.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
          const hasUrl = cleanTok.includes('.com') || cleanTok.includes('/');
          // Always store a normalised https:// URL; fallback scan will upgrade it if needed
          contacts.push({
            type: 'github',
            text: display || 'GitHub',
            url: hasUrl ? (cleanTok.startsWith('http') ? cleanTok : `https://${cleanTok}`) : undefined
          });
        }
      } else if (/portfolio|\.me|\.dev|\.io|\.app|\.com|\.in/i.test(cleanTok)) {
        if (!contacts.some(c => c.type === 'portfolio')) {
          const display = cleanTok.replace(/^[^a-zA-Z0-9]+/, '').replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
          contacts.push({ type: 'portfolio', text: display, url: cleanTok.startsWith('http') ? cleanTok : `https://${cleanTok}` });
        }
      } else if (!role && isRoleOrTitle(cleanTok)) {
        role = cleanTok.replace(/[\s|–—\-,:]+$/, "").trim();
      }
    }

    lineIdx++;
  }

  // Ensure profile links (LinkedIn, GitHub, Portfolio) have exact clickable URLs extracted from rawText or originalText
  const fullScanText = `${rawText}\n${originalText || ''}`;
  const profileLinks = extractProfileUrls(fullScanText);

  if (profileLinks.linkedin) {
    const existingLi = contacts.find(c => c.type === 'linkedin');
    if (existingLi) {
      existingLi.url = profileLinks.linkedin;
      existingLi.text = 'LinkedIn';
    } else {
      contacts.push({ type: 'linkedin', text: 'LinkedIn', url: profileLinks.linkedin });
    }
  }

  if (profileLinks.github) {
    const existingGh = contacts.find(c => c.type === 'github');
    if (existingGh) {
      existingGh.url = profileLinks.github;
      existingGh.text = 'GitHub';
    } else {
      contacts.push({ type: 'github', text: 'GitHub', url: profileLinks.github });
    }
  }

  if (profileLinks.portfolio && !contacts.some(c => c.type === 'portfolio')) {
    contacts.push({ type: 'portfolio', text: 'Portfolio', url: profileLinks.portfolio });
  }

  // 2. Sections grouping
  while (lineIdx < rawLines.length) {
    const line = rawLines[lineIdx];
    lineIdx++;
    if (!line) continue;

    // Filter out AI / prompt artifacts and leakage
    if (/^\[(?:Verified|ADD:|NOTE:|Generated|Instructions|Technologies).*\]/i.test(line)) continue;
    if (/YEARS & DETAILS/i.test(line)) continue;
    if (/^\[Verified Internship/i.test(line)) continue;
    if (/^\[.*Technologies.*\]/i.test(line)) continue;
    if (/^[a-z0-9_\-\s]+\]$/i.test(line) && line.endsWith(']')) continue;

    const sec = matchSectionHeader(line);
    if (sec) {
      currentSection = sec;
      continue;
    }

    if (currentSection && rawSections[currentSection]) {
      rawSections[currentSection].push(line);
    }
  }

  // 3. Section Parsers

  // Summary
  const summary = rawSections['SUMMARY'].map(l => stripMarkdownAsterisks(l)).join(' ').trim();

  // Skills: Deduplicate by label so duplicate categories never appear
  const skillsMap = new Map<string, SkillCategory>();
  for (const line of rawSections['SKILLS']) {
    const clean = stripMarkdownAsterisks(line).replace(/^[•\-*\u2022]\s*/, '').trim();
    const colonIdx = clean.indexOf(':');
    if (colonIdx > 0 && colonIdx < 50) {
      const label = clean.slice(0, colonIdx).trim();
      const val = clean.slice(colonIdx + 1).trim();
      const normKey = label.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!skillsMap.has(normKey)) {
        skillsMap.set(normKey, { label, skills: val });
      } else {
        // Merge unique comma-separated skills
        const existing = skillsMap.get(normKey)!;
        const set = new Set(existing.skills.split(',').map(normSkillKey));
        const newTerms = val.split(',').map(s => s.trim()).filter(s => !set.has(normSkillKey(s)));
        if (newTerms.length > 0) {
          existing.skills += ', ' + newTerms.join(', ');
        }
      }
    }
  }

  // User Rule: If Frameworks & Libraries already exists, remove redundant Core Technologies
  const hasFrameworksCategory = Array.from(skillsMap.keys()).some(k => k.includes('framework') || k.includes('libraries'));
  if (hasFrameworksCategory) {
    for (const k of Array.from(skillsMap.keys())) {
      if (k === 'coretechnologies' || k === 'corecompetencies' || k === 'corecompetenciestools') {
        const coreCat = skillsMap.get(k);
        const fwKey = Array.from(skillsMap.keys()).find(key => key.includes('framework') || key.includes('libraries'));
        if (coreCat && fwKey) {
          const fw = skillsMap.get(fwKey)!;
          const fwSet = new Set(fw.skills.split(',').map(normSkillKey));
          const newTerms = coreCat.skills.split(',').map(s => s.trim()).filter(s => s.length > 1 && !fwSet.has(normSkillKey(s)));
          if (newTerms.length > 0) {
            fw.skills += ', ' + newTerms.join(', ');
          }
        }
        skillsMap.delete(k);
      }
    }
  }

  // Filter out any leaked sentence fragments or soft skills from skill lines and deduplicate items internally with canonical names
  const JUNK_SKILL_RE = /troubleshoot\s*network|issues\s*across|title\s*network|monitor\s*network|enterprise\s*monitoring|monitoring\s*tools|problem\s*solving/i;
  for (const [key, cat] of Array.from(skillsMap.entries())) {
    const seenNorm = new Set<string>();
    const uniqueTerms: string[] = [];
    for (const s of cat.skills.split(',')) {
      const cleanItem = s.trim();
      if (!cleanItem || cleanItem.length <= 1) continue;
      if (JUNK_SKILL_RE.test(cleanItem)) continue;
      const canon = canonicalizeSkill(cleanItem);
      const norm = normSkillKey(canon);
      if (!seenNorm.has(norm)) {
        seenNorm.add(norm);
        uniqueTerms.push(canon);
      }
    }
    if (uniqueTerms.length === 0) {
      skillsMap.delete(key);
    } else {
      cat.skills = uniqueTerms.join(', ');
    }
  }

  const skills = Array.from(skillsMap.values());

  // Experience
  const experience: ExperienceItem[] = [];
  let currentExp: ExperienceItem | null = null;
  const expLines = rawSections['EXPERIENCE'];

  for (let i = 0; i < expLines.length; i++) {
    const rawLine = expLines[i];
    const isBullet = /^[•\-*\u2022]/.test(rawLine);

    if (isCertOrAchievementLine(rawLine)) {
      rawSections['AWARDS & CERTIFICATIONS'].push(rawLine);
      continue;
    }

    if (isBullet) {
      if (currentExp) {
        currentExp.bullets.push(stripMarkdownAsterisks(rawLine.replace(/^[•\-*\u2022]\s*/, '')));
      }
      continue;
    }

    // Check right-side date
    const { left, date } = extractRightDate(rawLine);

    if (date || (currentExp === null && left.length > 0)) {
      let title = left;
      let company = "";

      // Check for "Title – Company" pattern
      const dashMatch = left.match(/^(.+?)\s*[–—\-]\s*(.+)$/);
      if (dashMatch) {
        title = dashMatch[1].trim();
        company = dashMatch[2].trim();
      }

      title = title.replace(/[\s|–—\-,:]+$/, "").replace(/^[\s|–—\-,:]+/, "").trim();
      company = company.replace(/[\s|–—\-,:]+$/, "").replace(/^[\s|–—\-,:]+/, "").trim();

      currentExp = {
        title,
        company,
        dateRange: date,
        techTags: "",
        bullets: []
      };
      experience.push(currentExp);

      // Inspect next line for tech tags or company info
      if (i + 1 < expLines.length && !/^[•\-*\u2022]/.test(expLines[i + 1])) {
        const nextLine = expLines[i + 1];

        // Format: "Company | Tech Stack" (e.g. "TalentShine | django, tensorflow, scikitlearn")
        const pipeMatch = nextLine.match(/^(.+?)\s*\|\s*(.+)$/);
        if (pipeMatch) {
          if (!currentExp.company) {
            currentExp.company = pipeMatch[1].replace(/[\s|–—\-,:]+$/, "").replace(/^[\s|–—\-,:]+/, "").trim();
          }
          currentExp.techTags = pipeMatch[2].replace(/[\s|–—\-,:]+$/, "").replace(/^[\s|–—\-,:]+/, "").trim();
          i++;
        } else {
          // Check for comma-separated tech stack or sub-row
          const techMatch = nextLine.match(/([a-zA-Z0-9\s\.\+#]+(?:,\s*[a-zA-Z0-9\s\.\+#]+)+)/);
          if (techMatch && (techMatch.index || 0) > 0) {
            const techStart = techMatch.index || 0;
            const compPart = nextLine.slice(0, techStart).trim();
            const techPart = nextLine.slice(techStart).trim();
            if (compPart && !currentExp.company) {
              currentExp.company = compPart.replace(/[\s|–—\-,:]+$/, "").trim();
            }
            currentExp.techTags = techPart.replace(/[\s|–—\-,:]+$/, "").replace(/^[\s|–—\-,:]+/, "").trim();
            i++;
          } else if (nextLine.includes(',') || /^[A-Za-z0-9\s\+#\.\-]+$/.test(nextLine)) {
            if (!currentExp.company) {
              currentExp.company = nextLine.replace(/[\s|–—\-,:]+$/, "").trim();
            } else {
              currentExp.techTags = nextLine.replace(/[\s|–—\-,:]+$/, "").replace(/^[\s|–—\-,:]+/, "").trim();
            }
            i++;
          }
        }
      }
    } else if (currentExp && !currentExp.techTags && rawLine.includes(',')) {
      currentExp.techTags = rawLine.replace(/[\s|–—\-,:]+$/, "").replace(/^[\s|–—\-,:]+/, "").trim();
    } else if (currentExp && currentExp.bullets.length > 0) {
      currentExp.bullets[currentExp.bullets.length - 1] += ' ' + stripMarkdownAsterisks(rawLine);
    }
  }

  // Projects
  const projects: ProjectItem[] = [];
  let currentProj: ProjectItem | null = null;
  const projLines = rawSections['PROJECTS'];

  for (let i = 0; i < projLines.length; i++) {
    const rawLine = projLines[i];
    const isBullet = /^[•\-*\u2022]/.test(rawLine);

    if (isCertOrAchievementLine(rawLine)) {
      rawSections['AWARDS & CERTIFICATIONS'].push(rawLine);
      continue;
    }

    if (isBullet) {
      if (currentProj) {
        currentProj.bullets.push(stripMarkdownAsterisks(rawLine.replace(/^[•\-*\u2022]\s*/, '')));
      }
      continue;
    }

    const { left, date } = extractRightDate(rawLine);
    const hasDelimiter = rawLine.includes('—') || rawLine.includes('–') || rawLine.includes(' - ') || rawLine.includes('||');

    if ((date && (hasDelimiter || /^[A-Z]/.test(rawLine))) || hasDelimiter || /^\*\*[^*]+\*\*/.test(rawLine) || (currentProj === null && left.length > 0)) {
      let name = left;
      let techStack = "";
      const splitMatch = left.match(/^(.+?)\s*[—–\-]\s*(.+)$/);
      if (splitMatch) {
        name = splitMatch[1].trim();
        techStack = splitMatch[2].trim();
      }

      const cleanName = stripMarkdownAsterisks(name).replace(/[\s|–—\-,:]+$/, "").replace(/^[\s|–—\-,:]+/, "").trim();
      const cleanTech = stripMarkdownAsterisks(techStack).replace(/[\s|–—\-,:]+$/, "").replace(/^[\s|–—\-,:]+/, "").trim();

      currentProj = {
        name: cleanName,
        techStack: cleanTech,
        year: date,
        bullets: []
      };
      projects.push(currentProj);
    } else if (currentProj && currentProj.bullets.length > 0) {
      currentProj.bullets[currentProj.bullets.length - 1] += ' ' + stripMarkdownAsterisks(rawLine);
    }
  }

  // Education & Certifications:
  // Detect any orphaned date/grade lines that mistakenly fell into Certifications
  const rawCertLines = rawSections['AWARDS & CERTIFICATIONS'];
  const rawEduLines = rawSections['EDUCATION'];

  const orphanedDates: string[] = [];
  const orphanedGrades: string[] = [];
  const cleanCertLines: string[] = [];
  const seenCertRawKeys = new Set<string>();

  const isCertHeaderOrSubheader = (str: string): boolean => {
    const c = str.replace(/^[#*•\-\u2022\s]+/, '').replace(/[:\-_|]+$/, '').trim();
    return /^(?:&?\s*(?:ACHIEVEMENTS?|CERTIFICATIONS?|AWARDS?)|(?:AWARDS|CERTIFICATIONS)\s*(&|AND)\s*(?:CERTIFICATIONS|ACHIEVEMENTS|AWARDS)|awards?\s*(?:&|and)\s*certifications?|certifications?\s*(?:&|and)\s*awards?|certifications?\s*(?:&|and)\s*achievements?|achievements?\s*(?:&|and)\s*certifications?|certifications?|achievements?|awards?|certificates?|licenses?)$/i.test(c);
  };

  for (const line of rawCertLines) {
    const clean = stripMarkdownAsterisks(line).replace(/^[•\-*\u2022]\s*/, '').trim();
    if (!clean) continue;
    // Filter out section header leakage like "Awards & Certifications" or "& ACHIEVEMENTS"
    if (isCertHeaderOrSubheader(clean)) continue;
    if (PURE_DATE_REGEX.test(clean)) {
      orphanedDates.push(clean);
    } else if (PURE_GRADE_REGEX.test(clean)) {
      orphanedGrades.push(clean);
    } else {
      const norm = clean.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (seenCertRawKeys.has(norm)) continue;
      seenCertRawKeys.add(norm);
      cleanCertLines.push(line);
    }
  }

  // Parse Education items with multi-line robustness
  const education: EducationItem[] = [];
  let currentEdu: EducationItem | null = null;

  const isInstitutionName = (str: string): boolean => {
    const s = str.trim();
    return /\b(university|college|school|institute|academy|campus|vidya|vidyalaya|polytechnic)\b/i.test(s) &&
      !/\b(bachelor|master|b\.?\s*tech|m\.?\s*tech|b\.?\s*e|bsc|msc|bca|mca|b\.?\s*s\.?|b\.?\s*a\.?|b\.?\s*com\.?|bba|mba|intermediate|12th|hsc|ssc|10th|secondary\s*school(?:\s*certificate)?|matriculation|diploma|phd|doctorate)\b/i.test(s);
  };

  const isDegreeLine = (str: string): boolean => {
    if (isInstitutionName(str)) return false;
    return /\b(bachelor|master|b\.?\s*tech|m\.?\s*tech|b\.?\s*e|bsc|msc|bca|mca|b\.?\s*s\.?|b\.?\s*a\.?|b\.?\s*com\.?|bba|mba|intermediate|12th|class\s*(?:x|xii|10th?|12th?)|hsc|ssc|10th|high\s*school\s*(?:certificate|diploma)|secondary\s*school(?:\s*certificate)?|matriculation|secondary|diploma|phd|doctorate|degree)\b/i.test(str);
  };

  for (let i = 0; i < rawEduLines.length; i++) {
    const rawLine = rawEduLines[i].trim();
    if (!rawLine) continue;

    const clean = stripMarkdownAsterisks(rawLine).replace(/^[•\-*\u2022]\s*/, '').trim();
    if (!clean) continue;

    // Check if line is pure date
    if (PURE_DATE_REGEX.test(clean) || /^\b(19|20)\d{2}\s*[\–\—\-]\s*(?:(19|20)\d{2}|Present)\b/i.test(clean)) {
      if (currentEdu && !currentEdu.yearOrDates) {
        currentEdu.yearOrDates = clean;
      }
      continue;
    }

    // Check if line is pure grade
    if (PURE_GRADE_REGEX.test(clean) || /^(?:CGPA|GPA)\s*:\s*[\dX\.]+/i.test(clean)) {
      if (currentEdu && !currentEdu.grade) {
        currentEdu.grade = clean;
      }
      continue;
    }

    const { left: parsedLeft, date, grade } = extractRightDateAndGrade(rawLine);
    const cleanLeft = stripMarkdownAsterisks(parsedLeft).replace(/[\s|–—\-,:]+$/, "").replace(/^[\s|–—\-,:]+/, "").trim();

    // If cleanLeft is just a duplicate date or grade, skip it
    if (!cleanLeft || PURE_DATE_REGEX.test(cleanLeft) || PURE_GRADE_REGEX.test(cleanLeft)) {
      if (currentEdu) {
        if (!currentEdu.yearOrDates && date) currentEdu.yearOrDates = date;
        if (!currentEdu.grade && grade) currentEdu.grade = grade;
      }
      continue;
    }

    if (currentEdu && (cleanLeft === currentEdu.yearOrDates || cleanLeft === currentEdu.grade)) {
      continue;
    }

    // Use cleanLeft (degree/institution name without date/grade) for classification
    if (isDegreeLine(cleanLeft) || !currentEdu || (currentEdu.institution && !currentEdu.degree)) {
      currentEdu = {
        degree: cleanLeft,
        institution: '',
        yearOrDates: date,
        grade: grade
      };
      education.push(currentEdu);
    } else if (!currentEdu.institution) {
      currentEdu.institution = cleanLeft;
      if (date && !currentEdu.yearOrDates) currentEdu.yearOrDates = date;
      if (grade && !currentEdu.grade) currentEdu.grade = grade;
    } else {
      // Third line of an entry (could be remaining date or grade)
      if (date && !currentEdu.yearOrDates) currentEdu.yearOrDates = date;
      if (grade && !currentEdu.grade) currentEdu.grade = grade;
      else if (!currentEdu.institution.includes(clean)) {
        currentEdu.institution += ', ' + cleanLeft;
      }
    }
  }

  // Pair orphaned dates and grades with education items that lack them
  for (let i = 0; i < education.length; i++) {
    if (!education[i].yearOrDates && orphanedDates[i]) {
      education[i].yearOrDates = orphanedDates[i];
    }
    if (!education[i].grade && orphanedGrades[i]) {
      education[i].grade = orphanedGrades[i];
    }
  }

  // Merge any inadvertently split institution entries (e.g. Degree on line 1, School on line 2 parsed as 2 entries)
  for (let i = 0; i < education.length - 1; i++) {
    const cur = education[i];
    const next = education[i + 1];
    const nextInst = next.institution || next.degree;
    if (cur.degree && !cur.institution && nextInst && (isInstitutionName(nextInst) || !isDegreeLine(nextInst))) {
      cur.institution = nextInst;
      if (!cur.yearOrDates && next.yearOrDates) cur.yearOrDates = next.yearOrDates;
      if (!cur.grade && next.grade) cur.grade = next.grade;
      education.splice(i + 1, 1);
      i--;
    }
  }

  // Global pass: if any entry has a degree (e.g. SSC, Intermediate) with NO institution,
  // and there is another orphan entry whose degree is an institution name, merge them!
  for (let i = 0; i < education.length; i++) {
    const cur = education[i];
    if (cur.degree && !cur.institution && isDegreeLine(cur.degree)) {
      for (let j = 0; j < education.length; j++) {
        if (i === j) continue;
        const other = education[j];
        const otherText = other.institution || other.degree;
        if (otherText && (isInstitutionName(otherText) || !isDegreeLine(otherText))) {
          cur.institution = otherText;
          if (!cur.yearOrDates && other.yearOrDates) cur.yearOrDates = other.yearOrDates;
          if (!cur.grade && other.grade) cur.grade = other.grade;
          education.splice(j, 1);
          if (j < i) i--;
          break;
        }
      }
    }
  }

  // Post-process education items to fix swapped Degree vs Institution and ensure correct sequence format
  for (const edu of education) {
    edu.degree = stripMarkdownAsterisks(edu.degree).replace(/^[•\-\*\u2022+]\s*/, '').trim();
    edu.institution = stripMarkdownAsterisks(edu.institution).replace(/^[•\-\*\u2022+]\s*/, '').trim();
    edu.grade = stripMarkdownAsterisks(edu.grade).trim();
    edu.yearOrDates = stripMarkdownAsterisks(edu.yearOrDates).trim();

    const isInst = (s: string) =>
      /\b(university|college|school|institute|academy|campus|vidya|vidyalaya|polytechnic)\b/i.test(s) &&
      !/\b(bachelor|master|b\.?\s*tech|m\.?\s*tech|b\.?\s*e|bsc|msc|bca|mca|intermediate|12th|hsc|ssc|10th|secondary\s*school(?:\s*certificate)?|matriculation|diploma|phd|doctorate)\b/i.test(s);

    const isDeg = (s: string) =>
      /\b(bachelor|master|b\.?\s*tech|m\.?\s*tech|b\.?\s*e|bsc|msc|bca|mca|intermediate|12th|hsc|ssc|10th|secondary\s*school(?:\s*certificate)?|secondary|matriculation|diploma|phd|doctorate|degree)\b/i.test(s) &&
      !/\b(university|college|school|institute|academy|campus|vidya|vidyalaya|polytechnic)\b/i.test(s.replace(/secondary\s*school(?:\s*certificate)?|high\s*school\s*(?:certificate|diploma)/gi, ''));

    if (isInst(edu.degree) && isDeg(edu.institution)) {
      const temp = edu.degree;
      edu.degree = edu.institution;
      edu.institution = temp;
    } else if (isInst(edu.degree) && !edu.institution) {
      if (/\b(school|vidyalaya|patasala)\b/i.test(edu.degree)) {
        edu.institution = edu.degree;
        edu.degree = "Secondary School Certificate (SSC)";
      } else if (/\b(junior\s*college|intermediate)\b/i.test(edu.degree)) {
        edu.institution = edu.degree;
        edu.degree = "Intermediate (MPC)";
      }
    }

    // Specific normalization for SSC / 10th / High School
    const isSsc = /\b(ssc|10th|secondary\s*school|class\s*x|matriculation)\b/i.test(edu.degree);
    if (isSsc) {
      const sscCleanName = "Secondary School Certificate (SSC)";
      // Check if the degree string has the school name attached (e.g. "Secondary School Certificate (SSC) - Z.P. High School" or "SSC: St. John's School")
      const dashSep = edu.degree.match(/^(?:secondary\s*school\s*certificate(?:\s*\(ssc\))?|ssc|class\s*x|10th(?:\s*standard)?)\s*[:–—\-|,]\s*(.+)$/i);
      if (dashSep && dashSep[1]) {
        edu.degree = sscCleanName;
        if (!edu.institution) {
          edu.institution = dashSep[1].trim();
        }
      } else if (!edu.institution && (edu.degree.includes(" - ") || edu.degree.includes(" – ") || edu.degree.includes(" — ") || edu.degree.includes(" | "))) {
        const parts = edu.degree.split(/\s*[-–—|]\s*/);
        if (parts.length >= 2) {
          edu.degree = sscCleanName;
          edu.institution = parts.slice(1).join(", ").trim();
        }
      }
    } else if (!edu.institution && (edu.degree.includes(" | ") || edu.degree.includes(" - "))) {
      const parts = edu.degree.split(/\s+[|\-]\s+/);
      if (parts.length >= 2) {
        if (isDeg(parts[0])) {
          edu.degree = parts[0].trim();
          edu.institution = parts.slice(1).join(", ").trim();
        } else if (isDeg(parts[1])) {
          edu.institution = parts[0].trim();
          edu.degree = parts[1].trim();
        }
      }
    }
  }

  // Level-based education consolidation (guarantees split degrees / schools at the same tier are unified into 1 entry)
  const getLevel = (edu: EducationItem): string => {
    const text = (edu.degree + " " + edu.institution).toLowerCase();
    if (/\b(master|m\.?\s*tech|ms|msc|mca|phd|doctorate)\b/i.test(text)) return 'master';
    if (/\b(bachelor|b\.?\s*tech|b\.?\s*e|bca|bsc|b\.?\s*s\.?|b\.?\s*a\.?|b\.?\s*com\.?|undergraduate|degree)\b/i.test(text)) return 'bachelor';
    if (/\b(diploma|polytechnic)\b/i.test(text)) return 'diploma';
    if (/\b(intermediate|12th|class\s*xii|hsc|junior\s*college|senior\s*secondary|higher\s*secondary|mpc|bipc)\b/i.test(text)) return 'intermediate';
    if (/\b(10th|class\s*x|ssc|matriculation|secondary|high\s*school)\b/i.test(text)) return 'secondary';
    return 'other';
  };

  const isDegCheck = (s: string) =>
    /\b(bachelor|master|b\.?\s*tech|m\.?\s*tech|b\.?\s*e|bsc|msc|bca|mca|b\.?\s*s\.?|b\.?\s*a\.?|b\.?\s*com\.?|bba|mba|intermediate|12th|hsc|ssc|10th|secondary\s*school(?:\s*certificate)?|secondary|matriculation|diploma|phd|doctorate|degree)\b/i.test(s) &&
    !/\b(university|college|school|institute|academy|campus|vidya|vidyalaya|polytechnic)\b/i.test(s.replace(/secondary\s*school(?:\s*certificate)?|high\s*school\s*(?:certificate|diploma)/gi, ''));

  const isInstCheck = (s: string) =>
    /\b(university|college|school|institute|academy|campus|vidya|vidyalaya|polytechnic)\b/i.test(s) &&
    !/\b(bachelor|master|b\.?\s*tech|m\.?\s*tech|b\.?\s*e|bsc|msc|bca|mca|b\.?\s*s\.?|b\.?\s*a\.?|b\.?\s*com\.?|bba|mba|intermediate|12th|hsc|ssc|10th|secondary\s*school(?:\s*certificate)?|matriculation|diploma|phd|doctorate)\b/i.test(s);

  for (let i = 0; i < education.length; i++) {
    const curLevel = getLevel(education[i]);
    if (curLevel === 'other') continue;

    for (let j = i + 1; j < education.length; j++) {
      const otherLevel = getLevel(education[j]);
      if (curLevel === otherLevel) {
        const a = education[i];
        const b = education[j];

        if (!a.degree && b.degree) a.degree = b.degree;
        else if (b.degree && isDegCheck(b.degree) && !isDegCheck(a.degree)) a.degree = b.degree;

        if (!a.institution && b.institution) a.institution = b.institution;
        else if (!a.institution && b.degree && isInstCheck(b.degree)) a.institution = b.degree;
        else if (b.institution && isInstCheck(b.institution) && !isInstCheck(a.institution)) a.institution = b.institution;

        if (!a.yearOrDates && b.yearOrDates) a.yearOrDates = b.yearOrDates;
        if (!a.grade && b.grade) a.grade = b.grade;

        education.splice(j, 1);
        j--;
      }
    }
  }

  // Strict Reverse-Chronological Education Sequence:
  // 1. Master / PhD / Doctorate
  // 2. Bachelor / B.Tech / B.E / B.Sc / BCA / Degree
  // 3. Diploma / Polytechnic
  // 4. Intermediate / Class 12 / 12th / HSC
  // 5. Secondary / SSC / Class 10 / 10th / Matriculation
  const getEduRank = (edu: EducationItem): number => {
    const text = (edu.degree + " " + edu.institution).toLowerCase();
    if (/\b(master|m\.?\s*tech|ms|msc|mca|phd|doctorate)\b/i.test(text)) return 1;
    if (/\b(bachelor|b\.?\s*tech|b\.?\s*e|bca|bsc|b\.?\s*s\.?|b\.?\s*a\.?|b\.?\s*com\.?|undergraduate|degree)\b/i.test(text)) return 2;
    if (/\b(diploma|polytechnic)\b/i.test(text)) return 3;
    if (/\b(intermediate|12th|class\s*xii|hsc|junior\s*college|senior\s*secondary)\b/i.test(text)) return 4;
    if (/\b(10th|class\s*x|ssc|matriculation|secondary|high\s*school)\b/i.test(text)) return 5;
    return 3;
  };

  education.sort((a, b) => {
    const rankDiff = getEduRank(a) - getEduRank(b);
    if (rankDiff !== 0) return rankDiff;
    const yearA = parseInt(a.yearOrDates.match(/\b(19|20)\d{2}\b/)?.[0] || "0", 10);
    const yearB = parseInt(b.yearOrDates.match(/\b(19|20)\d{2}\b/)?.[0] || "0", 10);
    return yearB - yearA;
  });

  // Parse Certifications items with deduplication and subheader suppression
  const certifications: CertificationItem[] = [];
  const seenCerts = new Set<string>();

  for (let i = 0; i < cleanCertLines.length; i++) {
    const rawLine = cleanCertLines[i];
    const clean = stripMarkdownAsterisks(rawLine.replace(/^[•\-*\u2022]\s*/, '')).trim();
    if (!clean) continue;
    if (isCertHeaderOrSubheader(clean)) continue;

    const normKey = clean.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seenCerts.has(normKey)) continue;
    seenCerts.add(normKey);

    const { title, rest } = splitCertText(clean);
    certifications.push({
      title,
      boldPrefix: title,
      rest,
      raw: clean
    });
  }

  // Languages: filter out AI / prompt leakage
  const languages: string[] = [];
  for (const line of rawSections['LANGUAGES']) {
    const clean = stripMarkdownAsterisks(line).replace(/^[•\-*\u2022]\s*/, '').trim();
    if (!clean) continue;
    if (/^\[Verified/i.test(clean)) continue;
    if (/^\[.*Technologies/i.test(clean)) continue;
    if (/YEARS & DETAILS/i.test(clean)) continue;
    if (/^django$|^tensorflow$|^scikit-learn\]?$/i.test(clean)) continue;
    if (/\[.*?\]/.test(clean)) continue;
    if (clean.endsWith(']')) continue;
    languages.push(clean);
  }

  const contact: ResumeContact = {};
  for (const c of contacts) {
    if (c.type === "phone" && !contact.phone) contact.phone = c.text;
    else if (c.type === "email" && !contact.email) contact.email = c.text;
    else if (c.type === "linkedin" && !contact.linkedin) contact.linkedin = c.url || c.text;
    else if (c.type === "github" && !contact.github) contact.github = c.url || c.text;
    else if (c.type === "portfolio" && !contact.portfolio) contact.portfolio = c.url || c.text;
    else if (c.type === "other" && !contact.location) contact.location = c.text;
  }

  const normalizedSkills: (SkillCategory & ResumeSkillCategory)[] = skills.map((s) => ({
    label: s.label,
    skills: s.skills,
    items: s.skills.split(/,\s*/).map((t) => t.trim()).filter(Boolean),
  }));

  const normalizedExperience: (ExperienceItem & ResumeExperience)[] = experience.map((e) => {
    const dates = e.dateRange || "";
    const tags = e.techTags ? e.techTags.split(/,\s*/).map((t) => t.trim()).filter(Boolean) : [];
    return {
      title: e.title,
      company: e.company,
      start: dates.split(/\s*[-–—]\s*/)[0] || dates,
      end: dates.split(/\s*[-–—]\s*/)[1] || undefined,
      dateRange: e.dateRange,
      tags,
      techTags: e.techTags,
      bullets: e.bullets || [],
    };
  });

  const normalizedProjects: (ProjectItem & ResumeProject)[] = projects.map((p) => {
    const tags = p.techStack ? p.techStack.split(/,\s*/).map((t) => t.trim()).filter(Boolean) : [];
    return {
      name: p.name,
      tags,
      techStack: p.techStack,
      year: p.year,
      bullets: p.bullets || [],
    };
  });

  const normalizedEducation: (EducationItem & ResumeEducation)[] = education.map((ed) => {
    const dates = ed.yearOrDates || "";
    return {
      degree: ed.degree,
      institution: ed.institution,
      start: dates.split(/\s*[-–—]\s*/)[0] || dates,
      end: dates.split(/\s*[-–—]\s*/)[1] || undefined,
      score: ed.grade || undefined,
      yearOrDates: ed.yearOrDates,
      grade: ed.grade,
    };
  });

  const normalizedCerts: (CertificationItem & ResumeCertification)[] = certifications.map((c) => ({
    ...c,
    title: c.title || c.boldPrefix || c.raw,
  }));

  return {
    name,
    role,
    contact,
    contacts,
    summary,
    skills: normalizedSkills,
    experience: normalizedExperience,
    projects: normalizedProjects,
    certifications: normalizedCerts,
    education: normalizedEducation,
    achievements: [],
    languages,
  };
}

/**
 * parseResumeAI: One AI call, temperature 0, JSON mode.
 * Parses raw text into structured ResumeData without regex heuristics.
 */
export async function parseResumeAI(text: string): Promise<ResumeData> {
  const prompt = `You are an elite, exact resume parser.
Extract the candidate's authentic resume data into this structured JSON object.
Do NOT fabricate, hallucinate, or invent details. Extract only what is present in the text.
Bullets must be plain strings without bullet characters.

RESUME TEXT:
"""
${text.slice(0, 10000)}
"""

JSON SCHEMA (return ONLY valid JSON):
{
  "name": "Candidate Full Name",
  "role": "Role / Subtitle or empty string",
  "contact": {
    "phone": "Phone number or empty string",
    "email": "Email address or empty string",
    "linkedin": "LinkedIn URL or empty string",
    "github": "GitHub URL or empty string",
    "portfolio": "Portfolio URL or empty string",
    "location": "City, State/Country or empty string"
  },
  "summary": "Professional summary or empty string",
  "skills": [
    { "label": "Category Name", "items": ["Skill 1", "Skill 2"] }
  ],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "start": "Start Date",
      "end": "End Date",
      "tags": ["Technology 1", "Technology 2"],
      "bullets": ["Accomplishment bullet"]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "tags": ["Tech 1", "Tech 2"],
      "year": "Year",
      "link": "URL",
      "bullets": ["Project bullet"]
    }
  ],
  "education": [
    {
      "degree": "Degree (e.g. B.Tech in CSE)",
      "institution": "University / College",
      "start": "Start Year",
      "end": "End Year",
      "score": "CGPA / Percentage"
    }
  ],
  "certifications": [
    { "title": "Cert Name", "issuer": "Issuer Org", "year": "Year" }
  ],
  "achievements": ["Achievement bullet"],
  "languages": ["Language 1"]
}`;

  try {
    const apiKey = process.env.GROQ_API_KEY || "";
    if (apiKey) {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0,
          response_format: { type: "json_object" },
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const content = json.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          const { normalized } = normalizeResume(parsed, { originalText: text });
          return normalized;
        }
      }
    }
  } catch (err) {
    console.error("parseResumeAI Groq call failed, falling back to deterministic parser:", err);
  }

  // Fallback: synchronous deterministic parser
  return parseResume(text);
}

// ── Bridge to Legacy ParsedResumeBlock[] for ResumeViewer.tsx ────────────────

export function parseResumeIntoBlocks(text: string, originalText?: string): ParsedResumeBlock[] {
  const parsed = parseResume(text, originalText);
  const blocks: ParsedResumeBlock[] = [];

  if (parsed.name) {
    blocks.push({ type: 'name', text: parsed.name });
  }

  if (parsed.role) {
    blocks.push({ type: 'subtitle', text: parsed.role });
  }

  if (parsed.contacts.length > 0) {
    blocks.push({
      type: 'contact',
      segments: parsed.contacts.map(c => ({
        text: c.text,
        url: c.url,
        isLink: Boolean(c.url)
      }))
    });
  }

  // 1. SUMMARY
  if (parsed.summary) {
    blocks.push({ type: 'section', text: 'SUMMARY' });
    blocks.push({ type: 'summary', text: parsed.summary });
  }

  // 2. SKILLS
  if (parsed.skills.length > 0) {
    blocks.push({ type: 'section', text: 'SKILLS' });
    for (const s of parsed.skills) {
      blocks.push({ type: 'skillLine', label: s.label, value: s.skills });
    }
  }

  // 3. EXPERIENCE
  if (parsed.experience.length > 0) {
    blocks.push({ type: 'section', text: 'EXPERIENCE' });
    for (const exp of parsed.experience) {
      blocks.push({
        type: 'job',
        title: exp.title,
        company: exp.company,
        dates: exp.dateRange,
        tech: exp.techTags,
        bullets: exp.bullets
      });
    }
  }

  // 4. PROJECTS
  if (parsed.projects.length > 0) {
    blocks.push({ type: 'section', text: 'PROJECTS' });
    for (const proj of parsed.projects) {
      blocks.push({
        type: 'project',
        name: proj.name,
        tech: proj.techStack,
        dates: proj.year,
        bullets: proj.bullets
      });
    }
  }

  // 5. AWARDS & CERTIFICATIONS
  if (parsed.certifications.length > 0) {
    blocks.push({ type: 'section', text: 'AWARDS & CERTIFICATIONS' });
    for (const cert of parsed.certifications) {
      blocks.push({ type: 'cert', text: cert.raw });
    }
  }

  // 6. EDUCATION
  if (parsed.education.length > 0) {
    blocks.push({ type: 'section', text: 'EDUCATION' });
    for (const edu of parsed.education) {
      blocks.push({
        type: 'education',
        degree: edu.degree,
        school: edu.institution,
        dates: edu.yearOrDates,
        gpa: edu.grade
      });
    }
  }

  // 7. LANGUAGES
  if (parsed.languages.length > 0) {
    blocks.push({ type: 'section', text: 'LANGUAGES' });
    for (const lang of parsed.languages) {
      blocks.push({ type: 'bullet', text: lang });
    }
  }

  return blocks;
}

