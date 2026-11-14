/**
 * Universal resume format helpers.
 *
 *  - estimateYearsOfExperience(): dynamic experience detection from real date ranges
 *  - getPageBudget(): fresher / <5 yrs => strictly 1 page, 5+ yrs => up to 2 pages
 *  - sanitizeOptimizedResume(): removes AI hallucinations / unwanted text
 *    (fake "University Name" suffixes, literal placeholders, leaked internal
 *    "USER VERIFIED" blocks, duplicated institution segments) before the text
 *    reaches the live preview, PDF and DOCX exporters.
 */
import { detectSectionHeader, looksLikeSentenceBullet, BULLET_MARKER_REGEX } from "./ats/bullets";

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
};

const EXPERIENCE_HEADERS = new Set([
  "PROFESSIONAL EXPERIENCE", "WORK EXPERIENCE", "EXPERIENCE", "EMPLOYMENT HISTORY",
  "EMPLOYMENT", "WORK HISTORY", "CAREER HISTORY", "RELEVANT EXPERIENCE",
]);

function toMonthIndex(monthStr: string | undefined, year: number, isEnd: boolean): number {
  const m = monthStr ? MONTHS[monthStr.slice(0, 4).toLowerCase().replace(/[^a-z]/g, "")] ?? MONTHS[monthStr.slice(0, 3).toLowerCase()] : undefined;
  return year * 12 + (m !== undefined ? m : isEnd ? 11 : 0);
}

/** Dynamically estimates total professional (non-internship) experience in years. */
export function estimateYearsOfExperience(resumeText: string): number {
  const text = resumeText || "";
  const lines = text.split(/\r?\n/);

  // Collect experience-section lines (fallback: whole resume when no headers)
  let inExp = false;
  let sawHeader = false;
  const expLines: string[] = [];
  for (const line of lines) {
    const header = detectSectionHeader(line);
    if (header) {
      sawHeader = true;
      inExp = EXPERIENCE_HEADERS.has(header.name);
      continue;
    }
    if (inExp) expLines.push(line);
  }
  const scope = sawHeader ? expLines : lines;

  const now = new Date();
  const nowIdx = now.getFullYear() * 12 + now.getMonth();
  const rangeRegex =
    /(?:(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s*)?((?:19|20)\d{2})\s*(?:[-–—]|to)\s*(?:(?:(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s*)?((?:19|20)\d{2})|(present|current|now|till date|ongoing))/gi;

  const intervals: Array<[number, number]> = [];
  scope.forEach((line, i) => {
    // Skip internships / trainee roles when counting professional years
    const context = `${scope[i - 1] || ""} ${line}`.toLowerCase();
    if (/\bintern(ship)?\b|\btrainee\b|\bapprentice\b/.test(context)) return;
    let m: RegExpExecArray | null;
    rangeRegex.lastIndex = 0;
    while ((m = rangeRegex.exec(line)) !== null) {
      const start = toMonthIndex(m[1], parseInt(m[2], 10), false);
      const end = m[5] ? nowIdx : toMonthIndex(m[3], parseInt(m[4], 10), true);
      if (end >= start && end - start < 12 * 45) intervals.push([start, Math.min(end, nowIdx)]);
    }
  });

  // Merge overlapping intervals so concurrent roles are not double counted
  intervals.sort((a, b) => a[0] - b[0]);
  let totalMonths = 0;
  let cur: [number, number] | null = null;
  for (const iv of intervals) {
    if (!cur) cur = [...iv] as [number, number];
    else if (iv[0] <= cur[1]) cur[1] = Math.max(cur[1], iv[1]);
    else {
      totalMonths += cur[1] - cur[0] + 1;
      cur = [...iv] as [number, number];
    }
  }
  if (cur) totalMonths += cur[1] - cur[0] + 1;
  const computed = totalMonths / 12;

  // Explicit statements like "6+ years of experience"
  const explicit = Array.from(text.matchAll(/\b(\d{1,2})\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:professional\s+|industry\s+|hands-on\s+)?experience/gi))
    .map((x) => parseInt(x[1], 10))
    .filter((n) => n > 0 && n < 45);
  const explicitMax = explicit.length ? Math.max(...explicit) : 0;

  return Math.round(Math.max(computed, explicitMax) * 10) / 10;
}

export interface PageBudget {
  years: number;
  maxPages: 1 | 2;
  level: "fresher" | "early" | "experienced";
  instructions: string;
}

/** Fresher / under 5 years => strictly 1 page. 5+ years => up to 2 pages. */
export function getPageBudget(resumeText: string): PageBudget {
  const years = estimateYearsOfExperience(resumeText);
  if (years >= 5) {
    return {
      years,
      maxPages: 2,
      level: "experienced",
      instructions:
        `Candidate has ~${years} years of professional experience => UP TO 2 PAGES (A4).\n` +
        "- 4-6 bullets for the 2 most recent roles, 2-4 bullets for older roles\n" +
        "- Max 3 bullets per project; include only the most JD-relevant projects\n" +
        "- Professional Summary 3 sentences (60-80 words)\n" +
        "- Target total length: 650-1000 words. Never pad with filler to fill space.",
    };
  }
  return {
    years,
    maxPages: 1,
    level: years < 1 ? "fresher" : "early",
    instructions:
      `Candidate is ${years < 1 ? "a fresher" : `early-career (~${years} years)`} => STRICTLY 1 PAGE (A4). This is mandatory.\n` +
      "- Max 3-4 bullets per role and max 3 bullets per project\n" +
      "- Every bullet ONE line where possible (14-22 words)\n" +
      "- Keep the 3-4 most JD-relevant projects only if there are more\n" +
      "- Professional Summary 3 sentences (45-65 words)\n" +
      "- Target total length: 380-560 words. Never pad with filler.",
  };
}

const PLACEHOLDER_SEGMENT = /^(?:university name|institution name|college name|school name|company name|city,?\s*country|city|country|location|n\/a|na|tbd|\[[^\]]*\]|_+)$/i;

/** Removes hallucinated / unwanted text the AI may add (all exporters read this text). */
export function sanitizeOptimizedResume(
  optimized: string,
  original: string,
  userAnswers?: Record<string, string>
): string {
  if (!optimized) return optimized;

  // Pre-clean: strip leaked internal verification blocks and repair run-on punctuation
  let preCleaned = optimized
    .replace(/---+\s*USER[\s\S]*?---+/gi, "")
    .replace(/\[Verified[\s\S]*?\]/gi, "")
    .replace(/YEARS\s*&\s*DETAILS/gi, "")
    .replace(/([.,;:!])([A-Za-z])/g, "$1 $2")
    .replace(/\bPromptEngineering\b/g, "Prompt Engineering")
    .replace(/\bandRAG\b/g, "and RAG");

  // If user provided verified answers (dates, company, tech stack, years), include them in allowed source
  // so their legitimate answers are NEVER stripped as AI hallucinations.
  const userAnswersText = userAnswers && typeof userAnswers === "object"
    ? Object.values(userAnswers).filter((v) => typeof v === "string" && v.trim()).join(" ")
    : "";
  const allowedSource = `${original || ""} ${userAnswersText}`.trim();
  const originalLower = allowedSource.toLowerCase();
  const lines = preCleaned.split(/\r?\n/);
  const out: string[] = [];
  // FIX: Track section header object directly — not just name string — so isEducation / isCert
  // checks use the actual canonical header and never bleed across section boundaries.
  let currentHeader: { name: string; scorable: boolean } | null = null;

  for (const rawLine of lines) {
    let line = rawLine;

    // Leaked internal blocks from the enrichment step
    if (/USER[\s-]*VERIFIED|^\s*\[Verified|\[.*Technologies.*\]|YEARS & DETAILS|^-{3,}.*-{3,}$/i.test(line.trim())) continue;

    const header = detectSectionHeader(line);
    if (header) currentHeader = header;

    const sectionName = currentHeader?.name ?? "";

    // Experience / Projects: restore missing "•" on bullet sentences
    if (!header) {
      if (currentHeader?.scorable && line.trim() && !BULLET_MARKER_REGEX.test(line) && looksLikeSentenceBullet(line)) {
        line = `• ${line.trim()}`;
      }
    }

    // Technical Skills: NEVER allow bullets in skills section
    // Use exact header name match so CERTIFICATIONS & ACHIEVEMENTS is never confused with SKILLS
    const isSkills = !header && /^(TECHNICAL SKILLS|SKILLS|CORE COMPETENCIES|KEY SKILLS|CORE SKILLS|AREAS OF EXPERTISE)$/.test(sectionName);
    if (isSkills && line.trim()) {
      line = line
        .replace(/^[•\-\*–—+•\u2022\u25cf\u2043▸►→\s]+/, '')
        .replace(/\s*[•\u2022\u25cf\u2043▸►→]\s*/g, ', ')
        .trim();
    }

    // Experience / Internships: Strip fabricated date ranges the user did not specify in original resume
    // Use exact section name matching — INTERNSHIP EXPERIENCE must NOT match CERTIFICATIONS
    const isExp = !header && /^(PROFESSIONAL EXPERIENCE|INTERNSHIP EXPERIENCE|WORK EXPERIENCE|EXPERIENCE|EMPLOYMENT HISTORY|WORK HISTORY|CAREER HISTORY|INTERNSHIP|INTERNSHIPS)$/.test(sectionName);
    if (isExp && line.trim()) {
      const isDateLine = /^(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+)?\b(19\d{2}|20\d{2})\b\s*[-–—]\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+)?(?:\b(19\d{2}|20\d{2})\b|Present)(?:\s*\([^)]*\))?$/i.test(line.trim());
      if (isDateLine) {
        const yearsInLine = Array.from(line.matchAll(/\b(19\d{2}|20\d{2})\b/g)).map((m) => m[1]);
        const anyYearInOriginal = yearsInLine.length === 0 || yearsInLine.some((yr) => allowedSource.includes(yr));
        const durationInOriginal = /\b(?:months?|weeks?|duration)\b/i.test(line) && /\b(?:months?|weeks?|duration)\b/i.test(allowedSource);
        if (!anyYearInOriginal && !durationInOriginal) {
          // AI fabricated this internship date range without user stating it — drop the fake date line
          continue;
        }
      }
    }

    // Education: Only process lines when STRICTLY in an education section — not certifications or achievements
    const isEducation = !header && /^(EDUCATION|ACADEMIC BACKGROUND|ACADEMICS|QUALIFICATIONS)$/.test(sectionName);
    if (isEducation && line.trim()) {
      // Split by commas but keep pipes (degree | dates) intact
      const [left, ...rest] = line.split(/\s+\|\s+/);
      const segments = left.split(/\s*,\s*/).filter((s) => s.length > 0);
      const seen = new Set<string>();
      const kept: string[] = [];
      for (const seg of segments) {
        const s = seg.trim();
        const key = s.toLowerCase();
        if (!s || PLACEHOLDER_SEGMENT.test(s) || seen.has(key)) continue;
        // Fabricated parent university / extra institution not present in the original resume
        if (kept.length > 0 && /\b(university|vidyapeeth|vishwavidyalaya|deemed|affiliated|autonomous)\b/i.test(s)) {
          const distinctive = key
            .split(/[^a-z0-9]+/)
            .filter((w) => w.length > 2 && !/^(university|universit|the|and|for|affiliated|autonomous|deemed|to)$/.test(w));
          const existsInOriginal = originalLower.includes(key) || (distinctive.length > 0 && distinctive.some((w) => originalLower.includes(w)));
          if (!existsInOriginal) continue;
        }
        seen.add(key);
        kept.push(s);
      }
      line = [kept.join(", "), ...rest].filter((p) => p && p.trim()).join(" | ").replace(/\s{2,}/g, " ");
      if (!line.trim()) continue;
    }

    // Certifications: Strip fabricated years — ONLY when strictly inside a certifications/achievements section
    // FIX: Use exact header name so education lines are NEVER processed as certifications
    const isCert = !header && /^(CERTIFICATIONS|CERTIFICATIONS & ACHIEVEMENTS|CERTIFICATIONS AND ACHIEVEMENTS|ACHIEVEMENTS & CERTIFICATIONS|ACHIEVEMENTS AND CERTIFICATIONS|CERTIFICATES|LICENSES|AWARDS & CERTIFICATIONS|CERTIFICATIONS & AWARDS)$/.test(sectionName);
    if (isCert && line.trim()) {
      const yearMatches = Array.from(line.matchAll(/\b(19\d{2}|20\d{2})\b/g)).map((m) => m[1]);
      for (const yr of yearMatches) {
        if (!allowedSource.includes(yr)) {
          line = line
            .replace(new RegExp(`\\s*\\(?${yr}\\)?`, "g"), "")
            .replace(/\s*-\s*:\s*/g, ": ")
            .replace(/\s*:\s*$/, "")
            .trim();
        }
      }
    }

    // Drop standalone literal placeholders anywhere
    if (PLACEHOLDER_SEGMENT.test(line.trim().replace(/^[•\-*]\s*/, ""))) continue;

    out.push(line.replace(/[ \t]+([,.])(\s|$)/g, "$1$2"));
  }

  // 1a. Normalize PROFESSIONAL EXPERIENCE vs INTERNSHIP EXPERIENCE heading based on original resume
  //     If original has work experience, use PROFESSIONAL EXPERIENCE.
  //     If only internship content found, use INTERNSHIP EXPERIENCE.
  //     Never fabricate experience sections that don't exist in original.
  {
    const hasOrigExp = /\b(professional\s+experience|work\s+experience|employment\s+history|work\s+history)\b/i.test(original);
    const hasOrigIntern = /\b(internship|intern\b|trainee|apprentice|industrial\s+training)\b/i.test(original);
    // Fix heading: if output says PROFESSIONAL EXPERIENCE but original only has internship, rename
    if (!hasOrigExp && hasOrigIntern) {
      for (let i = 0; i < out.length; i++) {
        const h = out[i].trim().toUpperCase();
        if (h === 'PROFESSIONAL EXPERIENCE' || h === 'WORK EXPERIENCE') {
          out[i] = 'INTERNSHIP EXPERIENCE';
          break;
        }
      }
    }
  }

  // 1. Preserve and restore SSC (10th) and Intermediate (12th) if present in original or user verified answers but dropped by AI
  const hasOriginalSSC = /\b(ssc|10th|class\s*x\b|matriculation|secondary\s*school|high\s*school)\b/i.test(originalLower);
  const hasOriginalInter = /\b(intermediate|12th|class\s*xii\b|hsc|senior\s*secondary|higher\s*secondary)\b/i.test(originalLower);

  const resultLower = out.join("\n").toLowerCase();
  const hasResultSSC = /\b(ssc|10th|class\s*x\b|matriculation|secondary\s*school|high\s*school)\b/i.test(resultLower);
  const hasResultInter = /\b(intermediate|12th|class\s*xii\b|hsc|senior\s*secondary|higher\s*secondary)\b/i.test(resultLower);

  if (hasOriginalSSC && !hasResultSSC) {
    const originalLines = original.split(/\r?\n/);
    const sscLines = originalLines
      .filter((l) => /\b(ssc|10th|class\s*x\b|matriculation|secondary\s*school|high\s*school)\b/i.test(l))
      .map((l) => l.replace(/^\s*\[Verified[^\]]*:\s*/i, "").replace(/\]\s*$/, "").replace(/^[•\-\*]\s*/, "").trim())
      .filter(Boolean);

    if (sscLines.length > 0) {
      const eduIdx = out.findIndex((l) => /^EDUCATION\b/i.test(l.trim()));
      if (eduIdx !== -1) {
        let insertIdx = out.length;
        for (let i = eduIdx + 1; i < out.length; i++) {
          if (detectSectionHeader(out[i])) {
            insertIdx = i;
            break;
          }
        }
        const rawEntry = sscLines[0];
        const sscBlock = /\b(ssc|10th|class\s*x|secondary)\b/i.test(rawEntry)
          ? rawEntry
          : `Secondary School Certificate (SSC / 10th)\n${rawEntry}`;
        out.splice(insertIdx, 0, sscBlock);
      } else {
        out.push("\nEDUCATION", `Secondary School Certificate (SSC / 10th)\n${sscLines[0]}`);
      }
    }
  }

  if (hasOriginalInter && !hasResultInter) {
    const originalLines = original.split(/\r?\n/);
    const interLines = originalLines
      .filter((l) => /\b(intermediate|12th|class\s*xii\b|hsc|senior\s*secondary|higher\s*secondary)\b/i.test(l))
      .map((l) => l.replace(/^\s*\[Verified[^\]]*:\s*/i, "").replace(/\]\s*$/, "").replace(/^[•\-\*]\s*/, "").trim())
      .filter(Boolean);

    if (interLines.length > 0) {
      const eduIdx = out.findIndex((l) => /^EDUCATION\b/i.test(l.trim()));
      if (eduIdx !== -1) {
        let insertIdx = out.length;
        for (let i = eduIdx + 1; i < out.length; i++) {
          if (detectSectionHeader(out[i])) {
            insertIdx = i;
            break;
          }
        }
        out.splice(insertIdx, 0, interLines[0]);
      }
    }
  }

  // 1.5 Strip hallucinated LANGUAGES section if original resume did not have spoken languages
  const cleanOrigWithoutTech = original
    .replace(/(?:programming|coding|technical|software|markup)\s+languages?\b/gi, "")
    .replace(/(?:languages?\s*:\s*[A-Za-z0-9#+.,\s]+\n)/gi, "");
  const hasOrigSpokenLangs = /(?:^|\n)\s*(?:spoken\s+languages?|languages?\s+known|languages?\s+spoken|languages)\s*[:\n]/i.test(cleanOrigWithoutTech);

  if (!hasOrigSpokenLangs) {
    const langIdx = out.findIndex((l) => /^LANGUAGES\b/i.test(l.trim()));
    if (langIdx !== -1) {
      let langEnd = out.length;
      for (let i = langIdx + 1; i < out.length; i++) {
        if (detectSectionHeader(out[i])) {
          langEnd = i;
          break;
        }
      }
      out.splice(langIdx, langEnd - langIdx);
    }
  }

  // 2. Preserve and restore Verified Tech Stack into Technical Skills and Experience/Projects
  const techStackMatch = original.match(/\[Verified (?:Project & Internship Technologies|Internship & Project Tech Stack|Tech Stack):\s*([^\]]+)\]/i);
  if (techStackMatch && techStackMatch[1]) {
    const verifiedStack = techStackMatch[1].trim();
    const techWords = verifiedStack.split(/[,|;]/).map((w) => w.trim()).filter((w) => w.length > 1);

    // Ensure skills section contains the verified technologies
    const skillsIdx = out.findIndex((l) => /^(?:TECHNICAL SKILLS|SKILLS|CORE SKILLS|CORE COMPETENCIES|AREAS OF EXPERTISE|TECHNICAL EXPERTISE)\b/i.test(l.trim()));
    if (skillsIdx !== -1) {
      let skillsEndIdx = out.length;
      for (let i = skillsIdx + 1; i < out.length; i++) {
        if (detectSectionHeader(out[i])) {
          skillsEndIdx = i;
          break;
        }
      }
      const skillsSlice = out.slice(skillsIdx, skillsEndIdx).join(" ").toLowerCase();
      const missingTech = techWords.filter((w) => !skillsSlice.includes(w.toLowerCase()));
      if (missingTech.length > 0) {
        out.splice(skillsEndIdx, 0, `Technologies & Tools: ${verifiedStack}`);
      }
    } else {
      // If no skills section exists, create one before experience/projects or education
      const insertBeforeIdx = out.findIndex((l) => /^(?:EXPERIENCE|WORK EXPERIENCE|PROJECTS|EDUCATION)\b/i.test(l.trim()));
      const targetIdx = insertBeforeIdx !== -1 ? insertBeforeIdx : out.length;
      out.splice(targetIdx, 0, "TECHNICAL SKILLS", `Technologies & Tools: ${verifiedStack}`, "");
    }

    // Also ensure verified tech stack is tagged in the internship or projects if missing
    let inExpOrProj = false;
    for (let i = 0; i < out.length; i++) {
      const header = detectSectionHeader(out[i]);
      if (header) {
        inExpOrProj = /EXPERIENCE|INTERNSHIP|PROJECTS/.test(header.name);
        continue;
      }
      if (inExpOrProj && /\b(?:intern|internship|trainee|project)\b/i.test(out[i]) && !out[i].startsWith("•") && !out[i].startsWith("-")) {
        const nextFiveLines = out.slice(i, i + 6).join(" ").toLowerCase();
        const hasAnyTech = techWords.some((w) => nextFiveLines.includes(w.toLowerCase()));
        if (!hasAnyTech && !out[i].includes("|")) {
          out[i] = `${out[i]} | ${verifiedStack}`;
        }
        break;
      }
    }
  }

  // 3. Preserve and restore Verified Internship Duration & Period
  const durationMatch = original.match(/\[Verified (?:Internship Duration & Period|Internship Duration|Work Duration|Experience Dates):\s*([^\]]+)\]/i);
  if (durationMatch && durationMatch[1]) {
    const verifiedDuration = durationMatch[1].trim();
    let inExp = false;
    for (let i = 0; i < out.length; i++) {
      const header = detectSectionHeader(out[i]);
      if (header) {
        inExp = /EXPERIENCE|INTERNSHIP|WORK HISTORY/.test(header.name);
        continue;
      }
      if (inExp && /\b(?:intern|internship|trainee|apprentice)\b/i.test(out[i]) && !out[i].startsWith("•") && !out[i].startsWith("-")) {
        const nextLine = out[i + 1] || "";
        const hasDateInLine = /\b20\d{2}\b|\b(?:months?|weeks?)\b/i.test(out[i]);
        const hasDateInNext = /\b20\d{2}\b|\b(?:months?|weeks?)\b/i.test(nextLine) && !nextLine.startsWith("•") && !nextLine.startsWith("-");
        if (!hasDateInLine && !hasDateInNext) {
          out.splice(i + 1, 0, verifiedDuration);
        } else if (hasDateInNext && !nextLine.includes(verifiedDuration)) {
          out[i + 1] = verifiedDuration;
        }
        break;
      }
    }
  }

  // 4. Strict Skills Cleaning: Remove soft skills categories, deduplicate Core Technologies vs Frameworks, and remove junk phrases
  const skillsHeaderIdx = out.findIndex((l) => /^(?:TECHNICAL SKILLS|SKILLS|CORE SKILLS|CORE COMPETENCIES)\b/i.test(l.trim()));
  if (skillsHeaderIdx !== -1) {
    let skillsEnd = out.length;
    for (let i = skillsHeaderIdx + 1; i < out.length; i++) {
      if (detectSectionHeader(out[i])) {
        skillsEnd = i;
        break;
      }
    }

    const JUNK_OR_SOFT_SKILL_RE = /troubleshoot\s*network|issues\s*across|title\s*network|monitor\s*network|enterprise\s*monitoring|monitoring\s*tools|problem\s*solving|time\s*management|team\s*coordination|stakeholder\s*communication|process\s*adherence|documentation/i;
    let fwLineIdx = -1;
    let coreLineIdx = -1;

    for (let i = skillsHeaderIdx + 1; i < skillsEnd; i++) {
      const line = out[i].trim();
      if (!line) continue;
      // Drop whole soft-skill category lines
      if (/^(?:Communication|Soft Skills|Professional Skills|Interpersonal Skills|Communication & Professional)(?:\s*&[^\n:]*)?:\s*/i.test(line)) {
        out.splice(i, 1);
        skillsEnd--;
        i--;
        continue;
      }
      if (/^(?:Frameworks\s*&\s*Libraries|Frameworks|Libraries)\s*:\s*/i.test(line)) {
        fwLineIdx = i;
      } else if (/^(?:Core Technologies|Core Competencies)\s*:\s*/i.test(line)) {
        coreLineIdx = i;
      }

      // Filter individual soft skills / junk phrases from each line
      if (line.includes(":")) {
        const colon = line.indexOf(":");
        const label = line.slice(0, colon).trim();
        const items = line.slice(colon + 1).split(/,\s*/).map(s => s.trim()).filter(s => s.length > 1 && !JUNK_OR_SOFT_SKILL_RE.test(s));
        if (items.length === 0) {
          out.splice(i, 1);
          skillsEnd--;
          i--;
        } else {
          out[i] = `${label}: ${items.join(", ")}`;
        }
      }
    }

    // If Frameworks & Libraries exists, merge any unique items from Core Technologies into it, then delete Core Technologies
    if (fwLineIdx !== -1 && coreLineIdx !== -1) {
      const fwLine = out[fwLineIdx];
      const coreLine = out[coreLineIdx];
      const fwItems = fwLine.slice(fwLine.indexOf(":") + 1).split(/,\s*/).map(s => s.trim()).filter(Boolean);
      const fwSet = new Set(fwItems.map(s => s.toLowerCase()));
      const coreItems = coreLine.slice(coreLine.indexOf(":") + 1).split(/,\s*/).map(s => s.trim()).filter(Boolean);
      for (const ci of coreItems) {
        if (!fwSet.has(ci.toLowerCase()) && !JUNK_OR_SOFT_SKILL_RE.test(ci)) {
          fwItems.push(ci);
          fwSet.add(ci.toLowerCase());
        }
      }
      out[fwLineIdx] = `${fwLine.slice(0, fwLine.indexOf(":")).trim()}: ${fwItems.join(", ")}`;
      out.splice(coreLineIdx, 1);
    }
  }

  let finalResume = out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  finalResume = preserveCandidateContactDetails(finalResume, original);
  return finalResume;
}

/** Guarantee candidate contact info from original resume is never lost, corrupted, or formatted with bullet marks */
export function preserveCandidateContactDetails(optimized: string, original: string): string {
  if (!optimized || !original) return optimized;

  // Search strictly the candidate's top contact block (lines before the first section header, max 6 lines)
  const allOrigLines = original.split(/\r?\n/);
  const contactHeaderLines: string[] = [];
  for (let i = 0; i < Math.min(allOrigLines.length, 8); i++) {
    const l = allOrigLines[i].trim();
    if (l && detectSectionHeader(l)) break;
    contactHeaderLines.push(l);
  }
  const originalContactBlock = contactHeaderLines.join("\n");
  const originalHeader = allOrigLines.slice(0, 45).join("\n");

  // Extract phone number from original (Indian +91, 10-digit mobile, international)
  const phoneMatch = originalHeader.match(/(?:\+?91[\s-]?)?[6-9]\d{9}|(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b\d{10}\b/);
  const originalPhone = phoneMatch ? phoneMatch[0].trim() : null;

  // Extract email from original
  const emailMatch = originalHeader.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/i);
  const originalEmail = emailMatch ? emailMatch[0].trim() : null;

  // Extract LinkedIn from original (handles custom URLs, in/ links, with or without https, and country subdomains like in.linkedin.com)
  const linkedinMatch = originalHeader.match(/(?:https?:\/\/)?(?:www\.)?(?:[a-z]{2,3}\.)?linkedin\.com\/(?:in|pub|profile)?\/?[\w\-–_.]+/i) ||
                        originalHeader.match(/(?:linkedin|li)\s*[:=]\s*(?:https?:\/\/)?(?:www\.)?(?:[a-z]{2,3}\.)?(?:linkedin\.com\/(?:in\/)?)?([a-zA-Z0-9\-_.]+)/i);
  let originalLinkedin: string | null = null;
  if (linkedinMatch) {
    const rawVal = (linkedinMatch[1] && !linkedinMatch[0].includes("linkedin.com") ? linkedinMatch[1] : linkedinMatch[0]).replace(/[.,;|]+$/, "").trim();
    if (!/^(?:github|portfolio|email|phone|website|mobile)$/i.test(rawVal)) {
      originalLinkedin = rawVal.includes("linkedin.com") ? rawVal : `linkedin.com/in/${rawVal}`;
      if (!originalLinkedin.startsWith("http") && !originalLinkedin.toLowerCase().includes("linkedin.com")) {
        originalLinkedin = `linkedin.com/in/${originalLinkedin.replace(/^https?:\/\/(?:www\.)?(?:[a-z]{2,3}\.)?linkedin\.com\/(?:in\/)?/i, "")}`;
      }
    }
  }

  // Extract GitHub from original
  const githubMatch = originalHeader.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[\w\-–_.]+/i) ||
                      originalHeader.match(/(?:github|gh)\s*[:=]\s*(?:https?:\/\/)?(?:www\.)?(?:github\.com\/)?([a-zA-Z0-9\-_.]+)/i);
  let originalGithub: string | null = null;
  if (githubMatch) {
    const rawVal = (githubMatch[1] && !githubMatch[0].includes("github.com") ? githubMatch[1] : githubMatch[0]).replace(/[.,;|]+$/, "").trim();
    if (!/^(?:linkedin|portfolio|email|phone|website|mobile)$/i.test(rawVal)) {
      originalGithub = rawVal.includes("github.com") ? rawVal : `github.com/${rawVal}`;
      if (!originalGithub.startsWith("http") && !originalGithub.toLowerCase().includes("github.com")) {
        originalGithub = `github.com/${originalGithub.replace(/^https?:\/\/(?:www\.)?github\.com\//i, "")}`;
      }
    }
  }

  // Extract location ONLY from the actual contact block (top 6 lines before any section), NEVER from education/body!
  const locationMatch = originalContactBlock.match(/\b([A-Z][a-zA-Z\s.-]+,\s*(?:India|USA|UK|Canada|Telangana|Andhra Pradesh|Karnataka|Maharashtra|Tamil Nadu|Delhi|California|New York|Texas|WA|NY|CA|TX|IL|FL))\b/i);
  const originalLocation = locationMatch ? locationMatch[1].trim() : null;

  const lines = optimized.split(/\r?\n/);
  if (lines.length < 2) return optimized;

  // Clean any leading bullet markers and drop hallucinated standalone location/subtitle lines before first section header
  let firstHeaderIdx = lines.findIndex((l) => detectSectionHeader(l) !== null);
  if (firstHeaderIdx === -1) firstHeaderIdx = Math.min(lines.length, 10);

  for (let i = firstHeaderIdx - 1; i >= 1; i--) {
    const l = lines[i].trim();
    lines[i] = lines[i].replace(/^[•\-\*–—\u2022+]\s*/, "");
    // If a standalone line is not phone, email, or profile URL, and was not in original contact block, drop it
    if (l && !l.includes("@") && !/\d{7,}/.test(l) && !l.includes("linkedin") && !l.includes("github") && !l.includes("http") && !l.includes("|")) {
      if (!originalContactBlock.toLowerCase().includes(l.toLowerCase())) {
        lines.splice(i, 1);
      }
    }
  }

  // Find contact line (first non-empty line after candidate name that comes before any section header)
  let contactLineIdx = -1;
  for (let i = 1; i < Math.min(lines.length, 8); i++) {
    const l = lines[i].trim();
    if (l && detectSectionHeader(l)) break;
    if (l && (l.includes("@") || l.includes("|") || /\d{7,}/.test(l) || l.includes("linkedin") || l.includes("github") || l.includes("http"))) {
      contactLineIdx = i;
      break;
    }
  }

  const topHeaderSlice = lines.slice(0, 8).join("\n").toLowerCase();

  if (contactLineIdx !== -1) {
    const contactLine = lines[contactLineIdx];
    const cleanContact = contactLine.replace(/^[•\-\*–—\u2022+]\s*/, "");
    const rawParts = cleanContact.split(/\s*\|\s*/).map((p) => p.replace(/[\s|–—\-,:]+$/, "").replace(/^[\s|–—\-,:]+/, "").trim()).filter(Boolean);

    // Deduplicate contact items: at most 1 phone, 1 email, 1 linkedin, 1 github
    let phoneFound = false;
    let emailFound = false;
    let liFound = false;
    let ghFound = false;
    const contactParts: string[] = [];

    for (const p of rawParts) {
      if (/@/.test(p)) {
        if (!emailFound) {
          contactParts.push(p);
          emailFound = true;
        }
      } else if (/(?:\+?\d{1,3}[-.\s]?)?\(?[\dX]{3}\)?[-.\s]?[\dX]{3}[-.\s]?[\dX]{4}|\b\d{10}\b/.test(p)) {
        if (!phoneFound) {
          contactParts.push(p);
          phoneFound = true;
        }
      } else if (/linkedin/i.test(p)) {
        if (!liFound) {
          const actualLi = (p.includes(".com") || p.includes("/")) ? p : (originalLinkedin || p);
          contactParts.push(actualLi);
          liFound = true;
        }
      } else if (/github/i.test(p)) {
        if (!ghFound) {
          const actualGh = (p.includes(".com") || p.includes("/")) ? p : (originalGithub || p);
          contactParts.push(actualGh);
          ghFound = true;
        }
      } else if (!contactParts.some(existing => existing.toLowerCase() === p.toLowerCase())) {
        contactParts.push(p);
      }
    }

    // Ensure phone is present (only 1)
    if (originalPhone && !phoneFound) {
      contactParts.unshift(originalPhone);
      phoneFound = true;
    }
    // Ensure email is present (only 1)
    if (originalEmail && !emailFound) {
      contactParts.splice(contactParts.length > 0 ? 1 : 0, 0, originalEmail);
      emailFound = true;
    }
    // Ensure location is present only if explicitly in candidate's original contact block, otherwise strip all hallucinated locations
    if (originalLocation && !contactParts.some(p => p.toLowerCase().includes(originalLocation.toLowerCase()))) {
      contactParts.push(originalLocation);
    }
    // Clean up any non-phone, non-email, non-URL segments (locations, titles, subtitles) that are not in originalContactBlock
    for (let i = contactParts.length - 1; i >= 0; i--) {
      const p = contactParts[i];
      const isPhone = /\d{7,}/.test(p);
      const isEmail = /@/.test(p);
      const isUrl = /(?:http|www|\.com|\.in|\.org|\.io|linkedin|github)/i.test(p);
      if (!isPhone && !isEmail && !isUrl) {
        if (!originalContactBlock.toLowerCase().includes(p.toLowerCase())) {
          contactParts.splice(i, 1);
        }
      }
    }
    // Ensure LinkedIn is present (only 1)
    if (originalLinkedin && !liFound) {
      contactParts.push(originalLinkedin);
    }
    // Ensure GitHub is present (only 1)
    if (originalGithub && !ghFound) {
      contactParts.push(originalGithub);
    }

    lines[contactLineIdx] = contactParts.join(" | ");
  } else {
    // If AI omitted the contact line, re-insert directly under candidate's name
    const contactParts: string[] = [];
    if (originalPhone) contactParts.push(originalPhone);
    if (originalEmail) contactParts.push(originalEmail);
    if (originalLocation && originalContactBlock.toLowerCase().includes(originalLocation.toLowerCase())) {
      contactParts.push(originalLocation);
    }
    if (originalLinkedin) contactParts.push(originalLinkedin);
    if (originalGithub) contactParts.push(originalGithub);

    if (contactParts.length > 0) {
      let nameIdx = lines.findIndex((l) => l.trim().length > 0 && !detectSectionHeader(l));
      if (nameIdx === -1) nameIdx = 0;
      lines.splice(nameIdx + 1, 0, contactParts.join(" | "));
    }
  }

  return lines.join("\n");
}

/**
 * Ensures that every user-verified detail answered during the interactive Q&A
 * (Company name, internship duration/dates, tech stack, project year, quantified metrics)
 * is deterministically integrated into the optimized resume, so the candidate's answers
 * are never dropped or omitted.
 */
export function ensureUserAnswersInResume(
  resume: string,
  userAnswers?: Record<string, string>
): string {
  if (!resume || !userAnswers || typeof userAnswers !== "object" || Object.keys(userAnswers).length === 0) {
    return resume;
  }

  let out = resume;

  const findUserAnswer = (keywords: string[]): string | undefined => {
    for (const [k, v] of Object.entries(userAnswers)) {
      if (typeof v === "string" && v.trim()) {
        const kLow = k.toLowerCase();
        if (keywords.some((kw) => kLow.includes(kw.toLowerCase()))) {
          return v.trim();
        }
      }
    }
    return undefined;
  };

  // 1. Company Name: replace placeholders and ensure presence in Experience section
  const compVal = findUserAnswer(["company", "employer"]);
  if (compVal) {
    out = out.replace(/\b(?:Company\s*Name|Employer\s*Name|XYZ\s*Corp|ABC\s*Corp|\[Company(?:\s*Name)?\]|\[Employer\])\b/gi, compVal);
    if (!out.toLowerCase().includes(compVal.toLowerCase())) {
      const expRegex = /\n(PROFESSIONAL EXPERIENCE|INTERNSHIP EXPERIENCE|WORK EXPERIENCE|EXPERIENCE)\n([\s\S]*?)(?=\n[A-Z\s&]{4,}|\n*$)/i;
      const expMatch = out.match(expRegex);
      if (expMatch) {
        const expBlock = expMatch[2];
        const lines = expBlock.split("\n");
        let injected = false;
        for (let i = 0; i < lines.length; i++) {
          const l = lines[i].trim();
          if (l && !l.startsWith("•") && !l.startsWith("-") && !l.startsWith("*")) {
            if (i + 1 < lines.length && !lines[i + 1].trim().startsWith("•")) {
              if (!lines[i + 1].toLowerCase().includes(compVal.toLowerCase())) {
                lines[i + 1] = `${compVal} | ${lines[i + 1].trim()}`;
                injected = true;
              }
            } else {
              lines.splice(i + 1, 0, compVal);
              injected = true;
            }
            break;
          }
        }
        if (injected) {
          out = out.replace(expBlock, lines.join("\n"));
        }
      }
    }
  }

  // 2. Internship / Work Duration & Dates
  const datesVal = findUserAnswer(["internship_duration", "duration", "period", "dates", "work / internship"]);
  if (datesVal) {
    const expRegex = /\n(PROFESSIONAL EXPERIENCE|INTERNSHIP EXPERIENCE|WORK EXPERIENCE|EXPERIENCE)\n([\s\S]*?)(?=\n[A-Z\s&]{4,}|\n*$)/i;
    const expMatch = out.match(expRegex);
    if (expMatch) {
      const expBlock = expMatch[2];
      const hasDateInExp = /\b(19\d{2}|20\d{2})\b/.test(expBlock) || expBlock.toLowerCase().includes(datesVal.toLowerCase());
      if (!hasDateInExp) {
        const expLines = expBlock.split("\n");
        for (let i = 0; i < expLines.length; i++) {
          const l = expLines[i].trim();
          if (l && !l.startsWith("•") && !l.startsWith("-") && !l.startsWith("*")) {
            const cleanL = l.replace(/[\s|–—\-,:]+$/, "").trim();
            if (!cleanL.includes("|")) {
              expLines[i] = `${cleanL} | ${datesVal}`;
            } else if (!/\b(19\d{2}|20\d{2})\b/.test(cleanL)) {
              expLines[i] = `${cleanL} | ${datesVal}`;
            }
            break;
          }
        }
        out = out.replace(expBlock, expLines.join("\n"));
      }
    }
  }

  // 3. Tech Stack
  const techVal = findUserAnswer(["tech_stack", "technologies", "tools", "stack"]);
  if (techVal) {
    const cleanTech = techVal
      .replace(/^[•\-\*–—+•\u2022\u25cf\u2043▸►→\s]+/, "")
      .replace(/\s*[•\u2022\u25cf\u2043▸►→]\s*/g, ", ")
      .trim();
    const skillsRegex = /\n(TECHNICAL SKILLS|SKILLS|CORE COMPETENCIES|KEY SKILLS)\n([\s\S]*?)(?=\n[A-Z\s&]{4,}|\n*$)/i;
    const skillsMatch = out.match(skillsRegex);
    const terms = cleanTech
      .split(/[,;\n\r|]+/)
      .map((t) => t.replace(/^[•\-\*–—\s]+/, "").trim())
      .filter((t) => t.length > 1 && !/^(and|with|the)$/i.test(t));

    if (skillsMatch) {
      const skillsBlock = skillsMatch[2];
      const fwMatch = skillsBlock.match(/^(?:Frameworks\s*&\s*Libraries|Frameworks|Libraries):\s*([^\r\n]+)/im);
      const coreTechMatch = skillsBlock.match(/^(?:Core Technologies|Core Competencies):\s*([^\r\n]+)/im);

      if (fwMatch) {
        // Frameworks & Libraries exists: ALWAYS merge terms into it, and remove any redundant Core Technologies
        const existingFw = fwMatch[1];
        const existingList = existingFw.split(/,\s*/).map((t) => t.trim().toLowerCase());
        const toAdd = terms.filter((t) => !existingList.includes(t.toLowerCase()));
        
        // Also absorb any Core Technologies items into Frameworks
        if (coreTechMatch) {
          const coreItems = coreTechMatch[1].split(/,\s*/).map((t) => t.trim());
          for (const ci of coreItems) {
            if (ci && !existingList.includes(ci.toLowerCase()) && !toAdd.some((a) => a.toLowerCase() === ci.toLowerCase())) {
              toAdd.push(ci);
            }
          }
          out = out.replace(coreTechMatch[0] + "\n", "").replace(coreTechMatch[0], "");
        }

        if (toAdd.length > 0) {
          const updatedLine = `${fwMatch[0].split(":")[0]}: ${existingFw.trim()}, ${toAdd.join(", ")}`;
          out = out.replace(fwMatch[0], updatedLine);
        }
      } else if (coreTechMatch) {
        // If no Frameworks & Libraries exists, rename Core Technologies to Frameworks & Libraries
        const existingCore = coreTechMatch[1];
        const existingList = existingCore.split(/,\s*/).map((t) => t.trim().toLowerCase());
        const toAdd = terms.filter((t) => !existingList.includes(t.toLowerCase()));
        const allItems = [...existingCore.split(/,\s*/).map((t) => t.trim()), ...toAdd].filter(Boolean);
        const updatedLine = `Frameworks & Libraries: ${allItems.join(", ")}`;
        out = out.replace(coreTechMatch[0], updatedLine);
      } else if (terms.length > 0) {
        const newSkillsLine = `Frameworks & Libraries: ${terms.join(", ")}`;
        const updatedSkillsBlock = `${skillsBlock.trimEnd()}\n${newSkillsLine}\n`;
        out = out.replace(skillsBlock, updatedSkillsBlock);
      }
    } else if (terms.length > 0) {
      out = `${out.trimEnd()}\n\nTECHNICAL SKILLS\nFrameworks & Libraries: ${terms.join(", ")}\n`;
    }
  }

  // 4. Project Year(s)
  const projYearVal = findUserAnswer(["project_year", "projects year", "project dates"]);
  if (projYearVal) {
    const projRegex = /\n(PROJECTS|KEY PROJECTS|ACADEMIC PROJECTS)\n([\s\S]*?)(?=\n[A-Z\s&]{4,}|\n*$)/i;
    const projMatch = out.match(projRegex);
    if (projMatch) {
      const projBlock = projMatch[2];
      const hasYearInProj = /\b(19\d{2}|20\d{2})\b/.test(projBlock);
      if (!hasYearInProj) {
        const pLines = projBlock.split("\n");
        for (let i = 0; i < pLines.length; i++) {
          const l = pLines[i].trim();
          if (l && !l.startsWith("•") && !l.startsWith("-") && !l.startsWith("*")) {
            if (!l.includes(projYearVal)) {
              const cleanL = l.replace(/[\s|–—\-,:]+$/, "").trim();
              pLines[i] = `${cleanL} | ${projYearVal}`;
            }
          }
        }
        out = out.replace(projBlock, pLines.join("\n"));
      }
    }
  }

  // 5. Quantified Metrics
  for (const [k, v] of Object.entries(userAnswers)) {
    if (typeof v === "string" && v.trim()) {
      const kLow = k.toLowerCase();
      if (kLow.includes("metric") || kLow.includes("value") || kLow.includes("quantified")) {
        const cleanMetric = v.trim();
        const hasMetric =
          out.includes(cleanMetric) ||
          (/\b\d+%\b|\b\d+\+\b/.test(cleanMetric) &&
            (cleanMetric.match(/\b\d+%\b|\b\d+\+\b/g) || []).every((m) => out.includes(m)));
        if (!hasMetric) {
          const lines = out.split("\n");
          let attached = false;
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (/^[•\-\*]\s+[A-Za-z]/.test(line.trim()) && !/\d+%|\d+\+|\b\d+\s*users\b|\$\d+/i.test(line)) {
              lines[i] = `${line.trim().replace(/\.$/, "")}, ${cleanMetric}.`;
              attached = true;
              break;
            }
          }
          if (attached) {
            out = lines.join("\n");
          }
        }
      }
    }
  }

  return out;
}
