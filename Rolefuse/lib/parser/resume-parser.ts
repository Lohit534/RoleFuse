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

export interface ParsedResume {
  name: string;
  role: string;
  contacts: ContactInfo[];
  summary: string;
  skills: SkillCategory[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  education: EducationItem[];
  languages: string[];
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
    const title = sepMatch[1].trim();
    const rest = ' – ' + sepMatch[2].replace(/^[–—\-|]\s*/, '').trim();
    return { title, rest };
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

// ── Main Shared Parser ───────────────────────────────────────────────────────

export function parseResume(rawText: string): ParsedResume {
  const rawLines = (rawText || "").split(/\r?\n/).map(l => l.trim());
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
          contacts.push({ type: 'linkedin', text: display, url: cleanTok.startsWith('http') ? cleanTok : `https://${cleanTok}` });
        }
      } else if (/github\.com/i.test(cleanTok) || /^github\b/i.test(cleanTok)) {
        if (!contacts.some(c => c.type === 'github')) {
          const display = cleanTok.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
          contacts.push({ type: 'github', text: display, url: cleanTok.startsWith('http') ? cleanTok : `https://${cleanTok}` });
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
        const set = new Set(existing.skills.split(',').map(s => s.trim().toLowerCase()));
        const newTerms = val.split(',').map(s => s.trim()).filter(s => !set.has(s.toLowerCase()));
        if (newTerms.length > 0) {
          existing.skills += ', ' + newTerms.join(', ');
        }
      }
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

  for (const line of rawCertLines) {
    const clean = stripMarkdownAsterisks(line).replace(/^[•\-*\u2022]\s*/, '').trim();
    if (!clean) continue;
    // Filter out section header leakage like "& ACHIEVEMENTS" or "CERTIFICATIONS & ACHIEVEMENTS"
    if (/^&?\s*(?:ACHIEVEMENTS?|CERTIFICATIONS?|AWARDS?)\s*$/i.test(clean)) continue;
    if (/^(?:AWARDS|CERTIFICATIONS)\s*(&|AND)\s*(?:CERTIFICATIONS|ACHIEVEMENTS|AWARDS)\s*$/i.test(clean)) continue;
    if (PURE_DATE_REGEX.test(clean)) {
      orphanedDates.push(clean);
    } else if (PURE_GRADE_REGEX.test(clean)) {
      orphanedGrades.push(clean);
    } else {
      cleanCertLines.push(line);
    }
  }

  // Parse Education items with multi-line robustness
  const education: EducationItem[] = [];
  let currentEdu: EducationItem | null = null;

  const isDegreeLine = (str: string): boolean => {
    return /\b(bachelor|master|b\.?\s*tech|m\.?\s*tech|b\.?\s*e|bsc|msc|bca|mca|intermediate|12th|hsc|ssc|10th|high\s*school|matriculation|secondary|diploma|phd|doctorate|degree)\b/i.test(str);
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
        continue;
      }
    }

    // Check if line is pure grade
    if (PURE_GRADE_REGEX.test(clean) || /^(?:CGPA|GPA)\s*:\s*[\dX\.]+/i.test(clean)) {
      if (currentEdu && !currentEdu.grade) {
        currentEdu.grade = clean;
        continue;
      }
    }

    const { left: degLeft, date } = extractRightDate(rawLine);
    const { left: instLeft, grade } = extractRightGrade(degLeft);
    const cleanLeft = stripMarkdownAsterisks(instLeft).replace(/[\s|–—\-,:]+$/, "").replace(/^[\s|–—\-,:]+/, "").trim();

    if (isDegreeLine(rawLine) || !currentEdu || (currentEdu.institution && !currentEdu.degree)) {
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

  // Parse Certifications items
  const certifications: CertificationItem[] = [];
  let currentCert: CertificationItem | null = null;

  for (let i = 0; i < cleanCertLines.length; i++) {
    const rawLine = cleanCertLines[i];
    const isBullet = /^[•\-*\u2022]/.test(rawLine);
    const clean = stripMarkdownAsterisks(rawLine.replace(/^[•\-*\u2022]\s*/, '')).trim();
    if (!clean) continue;
    if (/^&?\s*(?:ACHIEVEMENTS?|CERTIFICATIONS?|AWARDS?)\s*$/i.test(clean)) continue;
    if (/^(?:AWARDS|CERTIFICATIONS)\s*(&|AND)\s*(?:CERTIFICATIONS|ACHIEVEMENTS|AWARDS)\s*$/i.test(clean)) continue;

    if (isBullet || !currentCert) {
      const { title, rest } = splitCertText(clean);
      currentCert = {
        title,
        boldPrefix: title,
        rest,
        raw: clean
      };
      certifications.push(currentCert);
    } else if (currentCert) {
      currentCert.rest += ' ' + clean;
      currentCert.raw += ' ' + clean;
    }
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

  return {
    name,
    role,
    contacts,
    summary,
    skills,
    experience,
    projects,
    certifications,
    education,
    languages
  };
}

// ── Bridge to Legacy ParsedResumeBlock[] for ResumeViewer.tsx ────────────────

export function parseResumeIntoBlocks(text: string): ParsedResumeBlock[] {
  const parsed = parseResume(text);
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

