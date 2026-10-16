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
export function sanitizeOptimizedResume(optimized: string, original: string): string {
  if (!optimized) return optimized;
  const originalLower = (original || "").toLowerCase();
  const lines = optimized.split(/\r?\n/);
  const out: string[] = [];
  let section = "";

  for (const rawLine of lines) {
    let line = rawLine;

    // Leaked internal blocks from the enrichment step
    if (/USER[\s-]*VERIFIED|^\s*\[Verified [^\]]*\]\s*$|^-{3,}.*-{3,}$/i.test(line.trim())) continue;

    const header = detectSectionHeader(line);
    if (header) section = header.name;

    // Experience / Projects: restore missing "•" on bullet sentences
    if (!header) {
      const sec = detectSectionHeader(section);
      if (sec?.scorable && line.trim() && !BULLET_MARKER_REGEX.test(line) && looksLikeSentenceBullet(line)) {
        line = `• ${line.trim()}`;
      }
    }

    // Experience / Internships: Strip fabricated date ranges the user did not specify in original resume
    const isExp = /EXPERIENCE|INTERNSHIP|WORK HISTORY/.test(section) && !header;
    if (isExp && line.trim()) {
      const isDateLine = /^(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+)?\b(19\d{2}|20\d{2})\b\s*[-–—]\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+)?(?:\b(19\d{2}|20\d{2})\b|Present)(?:\s*\([^)]*\))?$/i.test(line.trim());
      if (isDateLine) {
        const yearsInLine = Array.from(line.matchAll(/\b(19\d{2}|20\d{2})\b/g)).map((m) => m[1]);
        const anyYearInOriginal = yearsInLine.length === 0 || yearsInLine.some((yr) => original.includes(yr));
        const durationInOriginal = /\b(?:months?|weeks?|duration)\b/i.test(line) && /\b(?:months?|weeks?|duration)\b/i.test(original);
        if (!anyYearInOriginal && !durationInOriginal) {
          // AI fabricated this internship date range without user stating it — drop the fake date line
          continue;
        }
      }
    }

    const isEducation = /EDUCATION|ACADEM|QUALIFICATION/.test(section) && !header;
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

    // Certifications: Strip fabricated years that the user did not provide in the original resume
    const isCert = /CERTIFICAT|ACHIEVEMENT|LICENS/.test(section) && !header;
    if (isCert && line.trim()) {
      const yearMatches = Array.from(line.matchAll(/\b(19\d{2}|20\d{2})\b/g)).map((m) => m[1]);
      for (const yr of yearMatches) {
        if (!original.includes(yr)) {
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

  // Preserve and restore SSC (10th) and Intermediate (12th) if present in original or user verified answers but dropped by AI
  const hasOriginalSSC = /\b(ssc|10th|class x|matriculation|secondary school)\b/i.test(originalLower);
  const hasOriginalInter = /\b(intermediate|12th|class xii|hsc|senior secondary|higher secondary)\b/i.test(originalLower);

  const resultLower = out.join("\n").toLowerCase();
  const hasResultSSC = /\b(ssc|10th|class x|matriculation|secondary school)\b/i.test(resultLower);
  const hasResultInter = /\b(intermediate|12th|class xii|hsc|senior secondary|higher secondary)\b/i.test(resultLower);

  if (hasOriginalSSC && !hasResultSSC) {
    const originalLines = original.split(/\r?\n/);
    const sscLines = originalLines
      .filter((l) => /\b(ssc|10th|class x|matriculation|secondary school)\b/i.test(l))
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
        const sscBlock = rawEntry.toLowerCase().includes("ssc") || rawEntry.toLowerCase().includes("10th") || rawEntry.toLowerCase().includes("secondary")
          ? rawEntry
          : `Secondary School Certificate (SSC / 10th)\n${rawEntry}`;
        out.splice(insertIdx, 0, sscBlock);
      }
    }
  }

  if (hasOriginalInter && !hasResultInter) {
    const originalLines = original.split(/\r?\n/);
    const interLines = originalLines
      .filter((l) => /\b(intermediate|12th|class xii|hsc|senior secondary|higher secondary)\b/i.test(l))
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

  let finalResume = out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  finalResume = preserveCandidateContactDetails(finalResume, original);
  return finalResume;
}

/** Guarantee candidate contact info from original resume is never lost */
export function preserveCandidateContactDetails(optimized: string, original: string): string {
  if (!optimized || !original) return optimized;

  const originalLines = original.split(/\r?\n/).slice(0, 15);
  const originalHeader = originalLines.join("\n");

  // Extract phone number from original
  const phoneMatch = originalHeader.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+91[\s-]?\d{10}|\b\d{10}\b/);
  const originalPhone = phoneMatch ? phoneMatch[0].trim() : null;

  // Extract email from original
  const emailMatch = originalHeader.match(/[\w.-]+@[\w.-]+\.\w+/i);
  const originalEmail = emailMatch ? emailMatch[0].trim() : null;

  // Extract LinkedIn from original
  const linkedinMatch = originalHeader.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w.-]+\/?/i);
  const originalLinkedin = linkedinMatch ? linkedinMatch[0].trim() : null;

  // Extract GitHub from original
  const githubMatch = originalHeader.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[\w.-]+\/?/i);
  const originalGithub = githubMatch ? githubMatch[0].trim() : null;

  // Extract location from original (e.g. "Hyderabad, India", "Bangalore, Karnataka", "Visakhapatnam, AP")
  const locationMatch = originalHeader.match(/\b([A-Z][a-zA-Z\s]+,\s*(?:India|USA|UK|Canada|Telangana|Andhra Pradesh|Karnataka|Maharashtra|Tamil Nadu|Delhi))\b/i);
  const originalLocation = locationMatch ? locationMatch[1].trim() : null;

  const lines = optimized.split(/\r?\n/);
  if (lines.length < 2) return optimized;

  // Find contact line (first non-empty line after candidate name that comes before any section header)
  let contactLineIdx = -1;
  for (let i = 1; i < Math.min(lines.length, 6); i++) {
    const l = lines[i].trim();
    if (l && !detectSectionHeader(l)) {
      if (l.includes("@") || l.includes("|") || /\d{7,}/.test(l) || l.includes("http") || l.includes("linkedin")) {
        contactLineIdx = i;
        break;
      }
    }
  }

  if (contactLineIdx !== -1) {
    const contactLine = lines[contactLineIdx];
    const contactParts = contactLine.split(/\s*\|\s*/).map((p) => p.trim()).filter(Boolean);

    // Ensure phone is present
    if (originalPhone && !contactLine.includes(originalPhone) && !contactParts.some((p) => /\d{10}/.test(p.replace(/\D/g, "")))) {
      contactParts.unshift(originalPhone);
    }
    // Ensure email is present
    if (originalEmail && !contactLine.toLowerCase().includes(originalEmail.toLowerCase())) {
      contactParts.splice(1, 0, originalEmail);
    }
    // Ensure LinkedIn is present
    if (originalLinkedin && !contactLine.toLowerCase().includes("linkedin.com")) {
      contactParts.push(originalLinkedin);
    }
    // Ensure GitHub is present
    if (originalGithub && !contactLine.toLowerCase().includes("github.com")) {
      contactParts.push(originalGithub);
    }
    // Ensure location is present
    if (originalLocation && !contactLine.toLowerCase().includes(originalLocation.toLowerCase())) {
      contactParts.push(originalLocation);
    }

    lines[contactLineIdx] = contactParts.join(" | ");
  }

  return lines.join("\n");
}
