import { ResumeData, ResumeExperience, ResumeProject, ResumeCertification, ResumeEducation } from "@/types/resume";

// ── 1. CANONICAL TECH CASING & LEVENSHTEIN TYPO FIXER ─────────────────────────

export const CANONICAL_TECH_TERMS: Record<string, string> = {
  django: "Django",
  tensorflow: "TensorFlow",
  "scikit-learn": "scikit-learn",
  scikitlearn: "scikit-learn",
  sklearn: "scikit-learn",
  "express.js": "Express.js",
  expressjs: "Express.js",
  express: "Express.js",
  "react.js": "React.js",
  reactjs: "React.js",
  react: "React.js",
  "node.js": "Node.js",
  nodejs: "Node.js",
  node: "Node.js",
  mongodb: "MongoDB",
  mongo: "MongoDB",
  typescript: "TypeScript",
  ts: "TypeScript",
  javascript: "JavaScript",
  js: "JavaScript",
  postgresql: "PostgreSQL",
  postgres: "PostgreSQL",
  psql: "PostgreSQL",
  kubernetes: "Kubernetes",
  k8s: "Kubernetes",
  docker: "Docker",
  "next.js": "Next.js",
  nextjs: "Next.js",
  next: "Next.js",
  "vue.js": "Vue.js",
  vuejs: "Vue.js",
  vue: "Vue.js",
  graphql: "GraphQL",
  fastapi: "FastAPI",
  pytorch: "PyTorch",
  keras: "Keras",
  pandas: "Pandas",
  numpy: "NumPy",
  scipy: "SciPy",
  redis: "Redis",
  mysql: "MySQL",
  sqlite: "SQLite",
  mariadb: "MariaDB",
  oracle: "Oracle",
  cassandra: "Cassandra",
  dynamodb: "DynamoDB",
  elasticsearch: "Elasticsearch",
  rabbitmq: "RabbitMQ",
  kafka: "Apache Kafka",
  "apache kafka": "Apache Kafka",
  "spring boot": "Spring Boot",
  springboot: "Spring Boot",
  spring: "Spring Boot",
  aws: "AWS",
  gcp: "GCP",
  azure: "Azure",
  linux: "Linux",
  git: "Git",
  github: "GitHub",
  gitlab: "GitLab",
  bitbucket: "Bitbucket",
  "ci/cd": "CI/CD",
  cicd: "CI/CD",
  jenkins: "Jenkins",
  jira: "Jira",
  tailwind: "Tailwind CSS",
  "tailwind css": "Tailwind CSS",
  tailwindcss: "Tailwind CSS",
  bootstrap: "Bootstrap",
  html: "HTML",
  html5: "HTML5",
  css: "CSS",
  css3: "CSS3",
  sass: "Sass",
  scss: "SCSS",
  python: "Python",
  java: "Java",
  golang: "Go",
  go: "Go",
  rust: "Rust",
  cpp: "C++",
  "c++": "C++",
  csharp: "C#",
  "c#": "C#",
  php: "PHP",
  ruby: "Ruby",
  rails: "Ruby on Rails",
  "ruby on rails": "Ruby on Rails",
};

/**
 * Standard Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const d: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return d[m][n];
}

/**
 * Normalizes a single tech word:
 * 1. regex /\b(\w+)\s*\.\s*js\b/gi -> "$1.js"
 * 2. Exact match in canonical dictionary
 * 3. Levenshtein <= 2 fuzzy match in canonical dictionary (fixes e.g. "scitktlearn" -> "scikit-learn")
 */
export function normalizeTechTerm(term: string): string {
  if (!term || typeof term !== "string") return "";
  let clean = term.trim();

  // regex /\b(\w+)\s*\.\s*js\b/gi -> "$1.js"
  clean = clean.replace(/\b([a-zA-Z0-9]+)\s*\.\s*js\b/gi, "$1.js");

  const lower = clean.toLowerCase();
  if (CANONICAL_TECH_TERMS[lower]) {
    return CANONICAL_TECH_TERMS[lower];
  }

  // Levenshtein distance <= 2 search across canonical keys
  if (lower.length >= 4) {
    for (const [key, canonical] of Object.entries(CANONICAL_TECH_TERMS)) {
      if (Math.abs(key.length - lower.length) <= 2) {
        if (levenshteinDistance(lower, key) <= 2) {
          return canonical;
        }
      }
    }
  }

  return clean;
}

// ── 1.1 PROFILE URL EXTRACTION & NORMALIZATION ─────────────────────────────────

export interface ProfileUrls {
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

/**
 * Normalizes any profile link, username handle, or markdown link into a valid https:// URL.
 */
export function normalizeProfileUrl(raw: string, type: "linkedin" | "github" | "portfolio"): string {
  if (!raw) return "";
  let clean = raw.trim();

  // 1. Markdown link: [Title](https://...)
  const mdMatch = clean.match(/\[[^\]]*\]\((https?:\/\/[^\)]+)\)/i);
  if (mdMatch && mdMatch[1]) {
    clean = mdMatch[1].trim();
  }

  // 2. Remove leading label prefixes e.g. "LinkedIn:", "GitHub:", "Portfolio - "
  clean = clean.replace(/^(?:linkedin|github|portfolio|website|profile|site)\s*[:|–—\-]?\s*/i, "").trim();

  // 3. Remove trailing punctuation
  clean = clean.replace(/[,;.\)>\]]+$/, "").trim();

  if (!clean) return "";

  // 4. Fix accidental spaces inserted into domain extensions e.g. "linkedin. com" -> "linkedin.com"
  clean = clean.replace(/\b(linkedin|github)\.\s+com\b/gi, "$1.com");

  if (type === "linkedin") {
    if (/^https?:\/\//i.test(clean)) return clean;
    if (/(?:[a-z]{2,3}\.)?linkedin\.com/i.test(clean)) {
      return `https://${clean.replace(/^www\./i, "www.")}`;
    }
    if (/^in\/[\w\-–_.]+/i.test(clean)) {
      return `https://www.linkedin.com/${clean}`;
    }
    if (!/^(?:linkedin|profile|http|www)$/i.test(clean)) {
      return `https://www.linkedin.com/in/${clean}`;
    }
  } else if (type === "github") {
    if (/^https?:\/\//i.test(clean)) return clean;
    if (/github\.com/i.test(clean)) {
      return `https://${clean.replace(/^www\./i, "")}`;
    }
    const handle = clean.replace(/^@/, "");
    if (!/^(?:github|http|www)$/i.test(handle)) {
      return `https://github.com/${handle}`;
    }
  } else if (type === "portfolio") {
    if (/^https?:\/\//i.test(clean)) return clean;
    if (/\.[a-z]{2,}/i.test(clean)) return `https://${clean}`;
  }

  return clean;
}

/**
 * Robust regex-based extractor for LinkedIn, GitHub, and portfolio URLs from any resume text.
 */
export function extractProfileUrls(text: string): ProfileUrls {
  const result: ProfileUrls = {};
  if (!text) return result;

  // 1. Markdown links e.g. [LinkedIn](https://www.linkedin.com/in/username)
  const mdLi = text.match(/\[(?:linkedin|profile)\]\((https?:\/\/[^\)]+)\)/i);
  if (mdLi && mdLi[1]) {
    result.linkedin = normalizeProfileUrl(mdLi[1], "linkedin");
  }

  const mdGh = text.match(/\[(?:github|gh)\]\((https?:\/\/[^\)]+)\)/i);
  if (mdGh && mdGh[1]) {
    result.github = normalizeProfileUrl(mdGh[1], "github");
  }

  // 2. Full or partial LinkedIn URL
  if (!result.linkedin) {
    const liMatch =
      text.match(/(?:https?:\/\/)?(?:www\.)?(?:[a-z]{2,3}\.)?linkedin\.com\/(?:in|pub|profile)?\/?[\w\-–_.%]+\/?/i) ||
      text.match(/(?:https?:\/\/)?(?:www\.)?(?:[a-z]{2,3}\.)?linkedin\.com\/[\w\-–_.%]+\/?/i);
    if (liMatch) {
      result.linkedin = normalizeProfileUrl(liMatch[0], "linkedin");
    }
  }

  // 3. Fallback handle format e.g. "LinkedIn: payyavula-lohit" or "LinkedIn: in/payyavula-lohit"
  if (!result.linkedin) {
    const liHandleMatch = text.match(/(?:linkedin|li)\s*[:|–—\-]\s*(?:in\/)?([a-zA-Z0-9\-_]{3,40})/i);
    if (liHandleMatch && liHandleMatch[1] && !/^(?:com|org|net|github|portfolio|email|phone)$/i.test(liHandleMatch[1])) {
      result.linkedin = normalizeProfileUrl(liHandleMatch[1], "linkedin");
    }
  }

  // 4. Full or partial GitHub URL (prefer profile URL github.com/user over repo URL github.com/user/repo)
  if (!result.github) {
    const ghMatches = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[\w\-–_.%]+(?:\/[\w\-–_.%]+)?\/?/gi) || [];
    const profileOnly = ghMatches.find((m) => {
      const pathPart = m.replace(/^(?:https?:\/\/)?(?:www\.)?github\.com\//i, "").replace(/\/+$/, "");
      return pathPart.length > 0 && !pathPart.includes("/");
    });
    const chosenGh = profileOnly || ghMatches[0];
    if (chosenGh) {
      result.github = normalizeProfileUrl(chosenGh, "github");
    }
  }

  // 5. Fallback handle format e.g. "GitHub: lohit04" or "GitHub: @lohit04"
  if (!result.github) {
    const ghHandleMatch = text.match(/(?:github|gh)\s*[:|–—\-]\s*@?([a-zA-Z0-9\-_]{2,40})/i);
    if (ghHandleMatch && ghHandleMatch[1] && !/^(?:com|org|net|linkedin|portfolio|email|phone)$/i.test(ghHandleMatch[1])) {
      result.github = normalizeProfileUrl(ghHandleMatch[1], "github");
    }
  }

  // 6. Portfolio / personal site
  const allHttps = text.match(/https?:\/\/[^\s\|\)\]\,>\"\'\'<]{8,}/g) || [];
  for (const raw of allHttps) {
    const url = raw.replace(/[,;.\)>\]]+$/, "");
    if (
      !url.includes("linkedin.com") &&
      !url.includes("github.com") &&
      !url.includes("raw.githubusercontent") &&
      !url.includes("/blob/") &&
      !url.endsWith(".pdf") &&
      !url.includes("mailto:") &&
      !result.portfolio
    ) {
      result.portfolio = url;
      break;
    }
  }

  return result;
}

// ── 2. EDUCATION & CERTIFICATION FORMATTING ───────────────────────────────────

/**
 * Formats degrees cleanly: ensures "B.Tech", "M.Tech", "B.S.", "M.S.", etc.
 */
export function normalizeDegree(degree: string): string {
  if (!degree) return "";
  let clean = degree.trim();
  clean = clean
    .replace(/\bb\.?\s*tech\b/gi, "B.Tech")
    .replace(/\bm\.?\s*tech\b/gi, "M.Tech")
    .replace(/\bb\.?\s*e\b/gi, "B.E.")
    .replace(/\bb\.?\s*s\.?\b/gi, "B.S.")
    .replace(/\bm\.?\s*s\.?\b/gi, "M.S.")
    .replace(/\bb\.?\s*sc\b/gi, "B.Sc")
    .replace(/\bm\.?\s*sc\b/gi, "M.Sc")
    .replace(/\bb\.?\s*com\b/gi, "B.Com")
    .replace(/\bm\.?\s*ba\b/gi, "MBA")
    .replace(/\bb\.?\s*ba\b/gi, "BBA")
    .replace(/\bph\.?\s*d\b/gi, "Ph.D.");
  return clean;
}

/**
 * Normalizes an education entry and strips embedded dates or CGPA so they are never printed twice.
 */
export function normalizeEducationItem(edu: ResumeEducation): ResumeEducation {
  let degree = normalizeDegree(edu.degree || "");
  let institution = (edu.institution || "").trim();
  let start = edu.start ? edu.start.trim() : undefined;
  let end = edu.end ? edu.end.trim() : undefined;
  let score = edu.score ? edu.score.trim() : undefined;

  // 1. If degree has dates attached e.g. "B.Tech in CSE | 2022 - 2026" or "Intermediate | 2020 - 2022"
  const dateInDegree = degree.match(/\s*\|\s*(\b(?:19|20)\d{2}\b(?:\s*[-–—\s]+\s*(?:(?:19|20)\d{2}|Present|Current))?)\s*$/i);
  if (dateInDegree) {
    if (!start && !end) {
      const parts = dateInDegree[1].split(/\s*[-–—\s]+\s*/);
      start = parts[0];
      if (parts[1]) end = parts[1];
    }
    degree = degree.replace(dateInDegree[0], "").trim();
  }

  // 2. If degree has score attached e.g. "... | CGPA: 7.62"
  const scoreInDegree = degree.match(/\s*\|\s*((?:CGPA|GPA|Percentage|Score)?\s*:?\s*[\d.]+(?:\s*\/\s*[\d.]+)?%?)\s*$/i);
  if (scoreInDegree) {
    if (!score) score = scoreInDegree[1];
    degree = degree.replace(scoreInDegree[0], "").trim();
  }

  // 3. If institution has score attached e.g. "College Name | CGPA: 7.62" or "High School | GPA: 9.5"
  const scoreInInst = institution.match(/\s*\|\s*((?:CGPA|GPA|Percentage|Score)?\s*:?\s*[\d.]+(?:\s*\/\s*[\d.]+)?%?)\s*$/i);
  if (scoreInInst) {
    if (!score) score = scoreInInst[1];
    institution = institution.replace(scoreInInst[0], "").trim();
  }

  // 4. If institution has dates attached e.g. "College Name | 2022 - 2026"
  const dateInInst = institution.match(/\s*\|\s*(\b(?:19|20)\d{2}\b(?:\s*[-–—\s]+\s*(?:(?:19|20)\d{2}|Present|Current))?)\s*$/i);
  if (dateInInst) {
    if (!start && !end) {
      const parts = dateInInst[1].split(/\s*[-–—\s]+\s*/);
      start = parts[0];
      if (parts[1]) end = parts[1];
    }
    institution = institution.replace(dateInInst[0], "").trim();
  }

  // 5. Clean any trailing pipes or punctuation
  degree = degree.replace(/[\s|–—\-,:]+$/, "").trim();
  institution = institution.replace(/[\s|–—\-,:]+$/, "").trim();

  return {
    degree,
    institution,
    start,
    end,
    score,
  };
}

/**
 * Normalizes title casing for certifications and cleans "Title – Issuer" spacing.
 * Strictly prevents duplicate issuer output (e.g. "Infosys Springboard – Infosys Springboard").
 */
export function normalizeCertification(cert: ResumeCertification): ResumeCertification {
  let title = (cert.title || "").trim();
  let issuer = (cert.issuer || "").trim();
  let year = cert.year ? String(cert.year).trim() : undefined;

  // 1. Clean bullet prefixes if any
  title = title.replace(/^[•\-\*–—\s]+/, "").trim();
  issuer = issuer.replace(/^[•\-\*–—\s]+/, "").trim();

  // 2. If title ends with issuer or contains "– Issuer" or "- Issuer" or "by Issuer"
  if (issuer) {
    const esc = issuer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    title = title.replace(new RegExp(`(?:\\s*[-–—|:]+\\s*|\\s+by\\s+|\\s+from\\s+)${esc}$`, "i"), "").trim();
  }

  // 3. If title contains "–" or "-" or "|" and issuer is empty, split into Title and Issuer
  if (!issuer && /[-–—|]/.test(title)) {
    const parts = title.split(/\s*[-–—|]\s*/);
    if (parts.length >= 2) {
      title = parts[0].trim();
      issuer = parts.slice(1).join(" – ").trim();
    }
  }

  // 4. Deduplicate repeated segments in issuer (e.g. "Infosys Springboard – Infosys Springboard", "CodeTantra – CodeTantra", "HackerRank – HackerRank")
  if (issuer) {
    const issuerParts = issuer.split(/\s*[-–—|]\s*/);
    if (issuerParts.length >= 2 && issuerParts[0].toLowerCase() === issuerParts[1].toLowerCase()) {
      issuer = issuerParts[0].trim();
    }
  }

  // 5. If title still ends with issuer after splitting, strip it from title
  if (issuer) {
    const esc = issuer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    title = title.replace(new RegExp(`(?:\\s*[-–—|:]+\\s*|\\s+by\\s+|\\s+from\\s+)${esc}$`, "i"), "").trim();
  }

  // 6. Clean trailing separators
  title = title.replace(/[\s|–—\-,:]+$/, "").trim();
  issuer = issuer.replace(/[\s|–—\-,:]+$/, "").trim();

  // 7. Title Case for certification title (skip small connector words)
  const SMALL_WORDS = new Set(["and", "or", "of", "the", "in", "on", "for", "to", "with", "by", "a", "an"]);
  title = title
    .split(/\s+/)
    .map((w, i) => {
      const low = w.toLowerCase();
      if (i > 0 && SMALL_WORDS.has(low)) return low;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");

  return {
    title,
    issuer: issuer || undefined,
    year: year || undefined,
  };
}

// ── 3. TAGS GUARD (Tags must be a subset of terms in original resume) ─────────

/**
 * Extracts a normalized bag of terms from the candidate's original resume text
 */
export function extractOriginalTermsSet(originalText: string): Set<string> {
  const set = new Set<string>();
  if (!originalText) return set;
  const words = originalText
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);

  for (const w of words) set.add(w);

  // Also include canonical versions of any tech term detected in original
  for (const [key, canonical] of Object.entries(CANONICAL_TECH_TERMS)) {
    if (originalText.toLowerCase().includes(key)) {
      set.add(canonical.toLowerCase());
      set.add(key);
    }
  }
  return set;
}

/**
 * Filters tags on experience/projects to ONLY terms supported by original resume
 */
export function filterTagsToOriginal(tags: string[], originalTerms: Set<string>): string[] {
  if (!tags || !Array.isArray(tags)) return [];
  if (originalTerms.size === 0) return tags.map(normalizeTechTerm);

  const cleanTags: string[] = [];
  const seen = new Set<string>();

  for (const rawTag of tags) {
    const normalized = normalizeTechTerm(rawTag);
    const low = normalized.toLowerCase();
    // Check if the term or any of its word tokens was in the original resume
    const tokens = low.split(/[\s,./+]+/).filter((t) => t.length > 1);
    const supported = tokens.some((t) => originalTerms.has(t)) || originalTerms.has(low);

    if (supported && !seen.has(low)) {
      seen.add(low);
      cleanTags.push(normalized);
    }
  }

  return cleanTags;
}

// ── 4. NUMBER GUARD ───────────────────────────────────────────────────────────

export interface PlaceholderItem {
  line: string;
  placeholder: string;
  hint: string;
  section: string;
}

/**
 * Extracts all numeric values from text (integers, percentages, decimals, counts)
 */
export function extractNumericTokens(text: string): Set<string> {
  const set = new Set<string>();
  if (!text) return set;

  // Match numbers, decimals, percentages, metric multipliers like 10k, 5M, 2024, etc.
  const matches = text.match(/\b\d+(?:[.,]\d+)?%?|\d+[kKmMbBxX+]|\d+\+?/g);
  if (matches) {
    for (const m of matches) {
      set.add(m.trim().toLowerCase());
      // Also add bare digits (e.g. 35 from 35%)
      const bare = m.replace(/[^0-9]/g, "");
      if (bare) set.add(bare);
    }
  }
  return set;
}

/**
 * Number guard: replaces any number in the optimized text/bullets not present in the
 * original resume or user answers with [ADD: metric] and records it in placeholders.
 */
export function applyNumberGuard(
  bullet: string,
  allowedNumbers: Set<string>,
  section: string,
  placeholders: PlaceholderItem[]
): string {
  if (!bullet || typeof bullet !== "string") return bullet;

  // Find all number patterns in bullet (e.g., 35%, 10,000, 2x, 50+)
  // We ignore standard 4-digit years (1900-2099) so dates are not replaced
  const numberRegex = /\b(?!(?:19|20)\d{2}\b)(\d+(?:[.,]\d+)?\s*%?|\d+[kKmMbBxX+]|\d+\+?)\b/g;

  let hasReplacements = false;
  const replacedBullet = bullet.replace(numberRegex, (match) => {
    const cleanMatch = match.trim().toLowerCase();
    const bare = cleanMatch.replace(/[^0-9]/g, "");

    if (allowedNumbers.has(cleanMatch) || (bare && allowedNumbers.has(bare))) {
      return match; // Allowed: came from original resume or user answers
    }

    // Unauthorized number: replace with [ADD: metric]
    hasReplacements = true;
    return "[ADD: metric]";
  });

  if (hasReplacements) {
    placeholders.push({
      line: replacedBullet,
      placeholder: "[ADD: metric]",
      hint: "Add your verified metric or outcome percentage (e.g. 35% or 500+)",
      section,
    });
  }

  return replacedBullet;
}

// ── 5. FULL RESUME NORMALIZATION PIPELINE ──────────────────────────────────────

export interface NormalizeOptions {
  originalText?: string;
  originalData?: ResumeData;
  userAnswers?: Record<string, string>;
}

export function normalizeResume(
  resume: ResumeData,
  opts: NormalizeOptions = {}
): { normalized: ResumeData; placeholders: PlaceholderItem[] } {
  const placeholders: PlaceholderItem[] = [];

  // Build allowed terms and allowed numbers from original text + user answers
  const originalTextCombined = [
    opts.originalText || "",
    opts.originalData?.summary || "",
    ...(opts.originalData?.experience?.flatMap((e) => [e.company, e.title, ...(e.tags || []), ...(e.bullets || [])]) || []),
    ...(opts.originalData?.projects?.flatMap((p) => [p.name, ...(p.tags || []), ...(p.bullets || [])]) || []),
    ...(opts.originalData?.skills?.flatMap((s) => s.items) || []),
    Object.values(opts.userAnswers || {}).join(" "),
  ].join(" ");

  const originalTerms = extractOriginalTermsSet(originalTextCombined);
  const allowedNumbers = extractNumericTokens(originalTextCombined);

  // 1. Name & Role
  const name = (resume.name || opts.originalData?.name || "Candidate Name").trim();
  const role = resume.role ? resume.role.trim() : opts.originalData?.role;

  // 2. Contact
  let phone = resume.contact?.phone || opts.originalData?.contact?.phone;
  let email = resume.contact?.email || opts.originalData?.contact?.email;
  let linkedin = resume.contact?.linkedin || opts.originalData?.contact?.linkedin;
  let github = resume.contact?.github || opts.originalData?.contact?.github;
  let portfolio = resume.contact?.portfolio || opts.originalData?.contact?.portfolio;
  let location = resume.contact?.location || opts.originalData?.contact?.location;

  // Fallback: If linkedin, github, or portfolio is missing, extract from original combined text
  if (!linkedin || !github || !portfolio) {
    const extracted = extractProfileUrls(originalTextCombined);
    if (!linkedin && extracted.linkedin) linkedin = extracted.linkedin;
    if (!github && extracted.github) github = extracted.github;
    if (!portfolio && extracted.portfolio) portfolio = extracted.portfolio;
  }

  // Normalize URLs to full, clean https:// format
  if (linkedin) linkedin = normalizeProfileUrl(linkedin, "linkedin");
  if (github) github = normalizeProfileUrl(github, "github");
  if (portfolio) portfolio = normalizeProfileUrl(portfolio, "portfolio");

  const contact = {
    phone,
    email,
    linkedin,
    github,
    portfolio,
    location,
  };

  // 3. Summary
  let summary = (resume.summary || opts.originalData?.summary || "").trim();
  if (summary) {
    summary = summary
      .replace(/^[•\-\*–—\s]+/gm, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  // 4. Skills (Preserve candidate's original skills + merge optimized skills + canonical casing)
  const skillsMap = new Map<string, { label: string; items: string[]; itemSet: Set<string> }>();

  // First, add all candidate's original skills so they are NEVER deleted or lost
  if (opts.originalData?.skills) {
    for (const cat of opts.originalData.skills) {
      const label = cat.label.trim();
      const normLabelKey = label.toLowerCase();
      if (!skillsMap.has(normLabelKey)) {
        skillsMap.set(normLabelKey, { label, items: [], itemSet: new Set() });
      }
      const target = skillsMap.get(normLabelKey)!;
      for (const item of cat.items || []) {
        const canonical = normalizeTechTerm(item);
        const low = canonical.toLowerCase();
        if (!target.itemSet.has(low) && canonical.length > 0) {
          target.itemSet.add(low);
          target.items.push(canonical);
        }
      }
    }
  }

  // Then add optimized skills without removing existing skills
  for (const cat of resume.skills || []) {
    const label = cat.label.trim();
    const normLabelKey = label.toLowerCase();
    if (!skillsMap.has(normLabelKey)) {
      skillsMap.set(normLabelKey, { label, items: [], itemSet: new Set() });
    }
    const target = skillsMap.get(normLabelKey)!;
    for (const item of cat.items || []) {
      const canonical = normalizeTechTerm(item);
      const low = canonical.toLowerCase();
      if (!target.itemSet.has(low) && canonical.length > 0) {
        target.itemSet.add(low);
        target.items.push(canonical);
      }
    }
  }

  const skills = Array.from(skillsMap.values()).map(c => ({
    label: c.label,
    items: c.items,
  })).filter(c => c.items.length > 0);

  // 5. Experience
  const experience: ResumeExperience[] = (resume.experience || []).map((exp) => {
    const cleanTags = filterTagsToOriginal(exp.tags || [], originalTerms);
    const cleanBullets = (exp.bullets || []).map((b) => {
      // Bullets must be plain strings WITHOUT bullet characters
      let plain = b.replace(/^[•\-\*–—\s]+/, "").trim();
      plain = applyNumberGuard(plain, allowedNumbers, "PROFESSIONAL EXPERIENCE", placeholders);
      return plain;
    }).filter(Boolean);

    return {
      title: exp.title.trim(),
      company: exp.company.trim(),
      start: exp.start ? exp.start.trim() : undefined,
      end: exp.end ? exp.end.trim() : undefined,
      tags: cleanTags,
      bullets: cleanBullets,
    };
  });

  // 6. Projects
  const projects: ResumeProject[] = (resume.projects || []).map((proj) => {
    const cleanTags = filterTagsToOriginal(proj.tags || [], originalTerms);
    const cleanBullets = (proj.bullets || []).map((b) => {
      let plain = b.replace(/^[•\-\*–—\s]+/, "").trim();
      plain = applyNumberGuard(plain, allowedNumbers, "PROJECTS", placeholders);
      return plain;
    }).filter(Boolean);

    return {
      name: proj.name.trim(),
      tags: cleanTags,
      year: proj.year ? proj.year.trim() : undefined,
      link: proj.link ? proj.link.trim() : undefined,
      bullets: cleanBullets,
    };
  });

  // 7. Awards & Certifications (Merge achievements here if separate)
  const certsMap = new Map<string, ResumeCertification>();
  for (const c of resume.certifications || []) {
    const normalized = normalizeCertification(c);
    if (normalized.title) {
      certsMap.set(normalized.title.toLowerCase(), normalized);
    }
  }

  const achievements = Array.from(
    new Set((resume.achievements || []).map((a) => a.replace(/^[•\-\*–—\s]+/, "").trim()).filter(Boolean))
  );

  // 8. Education (Strip embedded dates and CGPA so they are never printed twice)
  const education = (resume.education || []).map((edu) => normalizeEducationItem(edu));

  // 9. Languages
  const languages = Array.from(
    new Set((resume.languages || []).map((l) => l.replace(/^[•\-\*–—\s]+/, "").trim()).filter(Boolean))
  );

  const normalized: ResumeData = {
    name,
    role,
    contact,
    summary,
    skills,
    experience,
    projects,
    education,
    certifications: Array.from(certsMap.values()),
    achievements,
    languages,
  };

  return { normalized, placeholders };
}

// ── 6. VALIDATION & RETRY CONTRACT ────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  repaired: ResumeData;
}

/**
 * Validates the ResumeData structure:
 * Checks name, contact (at least email or phone), and summary.
 * If missing, copies from the original and flags errors for optional LLM retry.
 */
export function validateResume(resume: ResumeData, original?: ResumeData): ValidationResult {
  const errors: string[] = [];
  const repaired: ResumeData = { ...resume };

  if (!repaired.name || repaired.name === "Candidate Name" || repaired.name.trim().length < 2) {
    if (original?.name) {
      repaired.name = original.name;
      errors.push("Missing or invalid name: copied from original resume.");
    } else {
      errors.push("Missing name in resume data.");
    }
  }

  const hasPhone = Boolean(repaired.contact?.phone);
  const hasEmail = Boolean(repaired.contact?.email);
  if (!hasPhone && !hasEmail) {
    if (original?.contact) {
      repaired.contact = { ...original.contact, ...repaired.contact };
      errors.push("Missing contact info (email/phone): copied from original resume.");
    } else {
      errors.push("Missing contact details: neither phone nor email provided.");
    }
  }

  // Preserve candidate's authentic profile URLs if missing in repaired contact
  if (original?.contact) {
    if (!repaired.contact) repaired.contact = {};
    if (!repaired.contact.linkedin && original.contact.linkedin) {
      repaired.contact.linkedin = original.contact.linkedin;
    }
    if (!repaired.contact.github && original.contact.github) {
      repaired.contact.github = original.contact.github;
    }
    if (!repaired.contact.portfolio && original.contact.portfolio) {
      repaired.contact.portfolio = original.contact.portfolio;
    }
  }

  if (!repaired.summary || repaired.summary.trim().length < 15) {
    if (original?.summary) {
      repaired.summary = original.summary;
      errors.push("Missing professional summary: copied from original resume.");
    } else {
      errors.push("Professional summary is empty or too short.");
    }
  }

  if (!Array.isArray(repaired.skills) || repaired.skills.length === 0) {
    if (original?.skills && original.skills.length > 0) {
      repaired.skills = original.skills;
      errors.push("Skills array is empty: copied from original resume.");
    }
  }

  const valid = errors.length === 0;
  return { valid, errors, repaired };
}
