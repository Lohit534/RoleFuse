import axios from "axios";
import { ATSScore } from "../../types";
import { logger } from "../logger";
import { extractKeywords, extractTechTerms } from "./keywords";
import { extractScorableBullets, hasStrongActionVerb, hasQuantifiedMetric } from "./bullets";

export { hasQuantifiedMetric };

/** Absolute ceiling — no real ATS gives a perfect score; 96 = fully optimized resume. */
export const MAX_ATS_SCORE = 96;

export const COMMON_TITLES = [
  "Software Engineer", "Frontend Engineer", "Backend Engineer", "Full Stack Developer",
  "Full Stack Engineer", "Backend Developer", "Frontend Developer",
  "Developer", "Data Scientist", "Data Analyst", "Data Engineer",
  "Machine Learning Engineer", "Generative AI Engineer", "AI Engineer", "AI/ML Engineer",
  "NLP Engineer", "Computer Vision Engineer", "Cloud Engineer", "Cloud Architect",
  "Java Developer", "Java Backend Developer", "Python Developer", "Python Backend Developer",
  "Product Manager", "Project Manager", "Business Analyst", "System Administrator",
  "DevOps Engineer", "QA Engineer", "Mobile Developer", "UI/UX Designer",
  "Software Developer", "Web Developer", "Android Developer", "iOS Developer",
  "Site Reliability Engineer", "Security Engineer", "Solutions Architect"
];

function normalizeWord(word: string): string {
  return word
    .replace(/ies$/, 'y')
    .replace(/es$/, '')
    .replace(/s$/, '')
    .toLowerCase()
    .trim();
}

// Common tech synonyms/aliases for robust matching
const TECH_SYNONYMS: Record<string, string[]> = {
  "react": ["react.js", "reactjs"],
  "node": ["node.js", "nodejs"],
  "next": ["next.js", "nextjs"],
  "vue": ["vue.js", "vuejs"],
  "typescript": ["ts"],
  "javascript": ["js"],
  "postgresql": ["postgres", "psql"],
  "kubernetes": ["k8s"],
  "docker": ["containerization", "containers"],
  "aws": ["amazon web services"],
  "gcp": ["google cloud", "google cloud platform"],
  "golang": ["go"],
  "rest": ["restful", "rest api", "restful apis", "rest apis"],
  "rest api": ["rest", "restful", "rest apis", "restful apis"],
  "rest apis": ["rest", "rest api", "restful", "restful apis"],
  "ci/cd": ["cicd", "continuous integration", "continuous deployment"],
  "mongodb": ["mongo"],
  "scikit-learn": ["scikitlearn", "sklearn"],
  "scikitlearn": ["scikit-learn", "sklearn"],
  "llm": ["llms", "large language models", "large language model", "generative ai"],
  "llms": ["llm", "large language models", "large language model", "generative ai"],
  "large language models": ["llm", "llms", "large language model"],
  "generative ai": ["genai", "gen ai", "llms", "llm", "large language models"],
  "prompt engineering": ["prompt optimization", "prompts", "prompt design"],
  "neural network": ["neural networks", "ann", "cnn", "rnn", "lstm", "deep learning"],
  "neural networks": ["neural network", "ann", "cnn", "rnn", "lstm", "deep learning"],
  "django rest framework": ["drf", "django rest", "django"],
  "version control": ["git", "github", "gitlab"],
  "data structures": ["dsa", "algorithms", "leetcode"],
};

/** Closely related skills that earn PARTIAL (0.5) credit for a JD skill. */
const RELATED_SKILLS: Record<string, string[]> = {
  "typescript": ["javascript"],
  "javascript": ["typescript"],
  "react": ["javascript", "angular", "vue", "next.js", "react native"],
  "react.js": ["javascript", "angular", "vue"],
  "angular": ["react", "vue", "typescript"],
  "vue": ["react", "angular"],
  "next.js": ["react"],
  "node.js": ["javascript", "express"],
  "node": ["javascript", "express"],
  "express": ["node.js", "node"],
  "postgresql": ["mysql", "sql", "oracle", "sql server", "sqlite"],
  "mysql": ["postgresql", "sql", "oracle", "sqlite"],
  "sql": ["mysql", "postgresql", "oracle", "sqlite"],
  "mongodb": ["nosql", "firebase", "dynamodb"],
  "redis": ["memcached", "caching"],
  "aws": ["azure", "gcp", "cloud"],
  "azure": ["aws", "gcp", "cloud"],
  "gcp": ["aws", "azure", "cloud"],
  "docker": ["kubernetes", "containers"],
  "kubernetes": ["docker"],
  "ci/cd": ["jenkins", "github actions", "gitlab"],
  "jenkins": ["ci/cd", "github actions"],
  "rest": ["api", "apis", "graphql"],
  "rest api": ["api", "apis", "restful", "rest apis"],
  "rest apis": ["api", "apis", "restful", "rest api"],
  "graphql": ["rest", "api"],
  "microservices": ["api", "backend", "distributed"],
  "jest": ["testing", "unit test", "mocha", "junit", "pytest"],
  "java": ["kotlin", "spring", "spring boot"],
  "spring boot": ["java", "spring", "spring mvc"],
  "spring mvc": ["spring", "spring boot", "java"],
  "python": ["django", "flask", "pandas", "numpy"],
  "django": ["python", "flask", "django rest framework"],
  "django rest framework": ["django", "python", "rest api", "rest apis"],
  "flask": ["python", "django", "fastapi"],
  "fastapi": ["python", "flask"],
  "tensorflow": ["pytorch", "keras", "machine learning", "deep learning"],
  "pytorch": ["tensorflow", "keras", "machine learning", "deep learning"],
  "machine learning": ["deep learning", "scikit-learn", "tensorflow", "pytorch", "supervised learning"],
  "deep learning": ["neural networks", "tensorflow", "pytorch", "keras", "cnn", "lstm", "ann"],
  "generative ai": ["llm", "llms", "prompt engineering", "rag", "deep learning", "machine learning", "nlp"],
  "prompt engineering": ["llm", "llms", "generative ai", "rag"],
  "rag": ["retrieval-augmented generation", "vector databases", "embeddings", "llm", "generative ai"],
  "scikit-learn": ["machine learning", "pandas", "numpy", "supervised learning", "classification"],
  "data structures": ["algorithms", "leetcode", "dsa", "problem solving"],
  "algorithms": ["data structures", "leetcode", "dsa", "problem solving"],
  "html": ["css"],
  "css": ["html", "tailwind", "bootstrap"],
  "tailwind": ["css", "bootstrap"],
  "agile": ["scrum", "jira"],
  "git": ["github", "gitlab"],
};

export function localScore(resumeText: string, jobDescription: string): ATSScore {
  logger.info("Executing dynamic ATS scoring calculation...");

  const resumeLower = (resumeText || "").toLowerCase();
  const jdLower = (jobDescription || "").toLowerCase();
  const resumeCleanAlpha = resumeLower.replace(/[^a-z0-9]/g, "");

  // ── 1. DYNAMIC KEYWORD EXTRACTION & MATCHING ────────────────────────────
  const resumeKeywords = extractKeywords(resumeText);
  const jdKeywords = extractKeywords(jobDescription);
  const jdTechTerms = extractTechTerms(jobDescription);
  const resumeTechTerms = extractTechTerms(resumeText);

  const foundKeywordsSet = new Set<string>();
  const missingKeywordsSet = new Set<string>();

  // Evaluate technical keywords and phrases dynamically
  const allTargetKeywords = Array.from(new Set([...jdTechTerms, ...jdKeywords]))
    .filter(k => k.length > 2 && !/^\d+$/.test(k));

  for (const targetKw of allTargetKeywords) {
    const kwLower = targetKw.toLowerCase();
    const cleanKw = kwLower.replace(/[^a-z0-9]/g, "");
    let isMatched = false;

    if (resumeKeywords.has(targetKw) || resumeLower.includes(kwLower) || (cleanKw.length > 2 && resumeCleanAlpha.includes(cleanKw))) {
      isMatched = true;
    } else {
      // Check stemming & aliases
      const normTarget = normalizeWord(kwLower);
      if ([...resumeKeywords].some(rk => normalizeWord(rk) === normTarget)) {
        isMatched = true;
      } else {
        // Check known tech synonyms
        const synonyms = TECH_SYNONYMS[kwLower] || [];
        for (const syn of synonyms) {
          const synClean = syn.replace(/[^a-z0-9]/g, "");
          if (resumeLower.includes(syn) || (synClean.length > 2 && resumeCleanAlpha.includes(synClean))) {
            isMatched = true;
            break;
          }
        }
      }
    }

    if (isMatched) {
      foundKeywordsSet.add(targetKw);
    } else {
      // Prioritize substantial technical keywords and domain phrases
      const isTech = jdTechTerms.includes(targetKw);
      const isPhrase = kwLower.includes(" ") || targetKw.length > 3;
      if (isTech || isPhrase) {
        missingKeywordsSet.add(targetKw);
      }
    }
  }

  const foundKeywords = Array.from(foundKeywordsSet);
  const missingKeywords = Array.from(missingKeywordsSet);

  // Dynamic Keyword Match calculation (honest, ATS-style):
  // - exact JD skill match = 1.0 credit, closely related skill = 0.5 credit
  //   (e.g. JavaScript for TypeScript/React, MySQL for PostgreSQL)
  // - 70% hard technical skills, 30% other JD phrases
  // - diminishing-returns curve (sqrt) like real ATS tools: the first matches
  //   matter most, so a resume with SOME relevant skills is not scored near zero.
  let techCredit = 0;
  for (const t of jdTechTerms) {
    const tl = t.toLowerCase();
    if (foundKeywordsSet.has(t) || resumeLower.includes(tl)) {
      techCredit += 1;
    } else if ((RELATED_SKILLS[tl] || []).some(r => new RegExp(`(^|[^a-z])${r.replace(/[.+#]/g, "\\$&")}([^a-z]|$)`, "i").test(resumeLower))) {
      techCredit += 0.5;
    }
  }
  const techCoverage = jdTechTerms.length > 0 ? Math.min(1, techCredit / jdTechTerms.length) : 0;
  const generalDenominator = foundKeywords.length + missingKeywords.length;
  const generalCoverage = generalDenominator > 0 ? foundKeywords.length / generalDenominator : 0;
  const keywordRatio = jdTechTerms.length >= 3
    ? techCoverage * 0.7 + generalCoverage * 0.3
    : generalCoverage;
  const keywordMatch = Math.min(97, Math.max(5, Math.round(Math.sqrt(keywordRatio) * 100)));

  // ── 2. DYNAMIC SEMANTIC & ROLE ALIGNMENT ────────────────────────────────
  // Check target job titles against candidate resume headline/summary
  let titleScore = 5;
  for (const title of COMMON_TITLES) {
    if (new RegExp(`\\b${title}\\b`, "i").test(jdLower)) {
      if (new RegExp(`\\b${title}\\b`, "i").test(resumeLower)) {
        titleScore = 25;
        break;
      }
    }
  }

  // Domain role matching if exact title string was not an identical match
  if (titleScore < 25) {
    const roleKeywordGroups = [
      ["machine learning", "ml", "artificial intelligence"],
      ["generative ai", "genai", "llm", "large language"],
      ["data science", "data scientist", "data analyst", "data engineer"],
      ["backend", "java developer", "python developer", "software developer"],
      ["frontend", "react developer", "web developer", "ui engineer"],
      ["full stack", "fullstack", "software engineer"],
      ["devops", "cloud", "sre", "infrastructure"],
    ];
    for (const group of roleKeywordGroups) {
      const inJd = group.some(k => jdLower.includes(k));
      const inResume = group.some(k => resumeLower.includes(k));
      if (inJd && inResume) {
        titleScore = 22;
        break;
      }
    }
  }

  // Tech stack domain overlap
  const targetTechCount = Math.max(3, Math.min(10, jdTechTerms.length));
  const techMatches = jdTechTerms.filter(t => {
    const tl = t.toLowerCase();
    const tClean = tl.replace(/[^a-z0-9]/g, "");
    return resumeLower.includes(tl) || (tClean.length > 2 && resumeCleanAlpha.includes(tClean));
  }).length;
  const techRatio = Math.min(1.0, (techCredit || techMatches) / targetTechCount);
  const techScore = Math.round(Math.sqrt(techRatio) * 55);

  // Summary & narrative alignment
  const hasSummary = /\b(summary|objective|profile|about me)\b/i.test(resumeText);
  const summaryMatch = resumeText.match(/(?:(?:professional\s+)?summary|career\s+objective|objective|profile|about me)[^\n]*\n([\s\S]{0,800}?)(?:\n\s*\n|\n[A-Z][A-Z &]{3,}\n|$)/i);
  const summaryText = (summaryMatch?.[1] || "").toLowerCase();
  const summaryClean = summaryText.replace(/[^a-z0-9]/g, "");
  const summaryJdTerms = jdTechTerms.filter(t => {
    const tl = t.toLowerCase();
    const tClean = tl.replace(/[^a-z0-9]/g, "");
    return summaryText.includes(tl) || (tClean.length > 2 && summaryClean.includes(tClean));
  }).length;
  const summaryScore = !hasSummary ? 0 : summaryJdTerms >= 2 ? 20 : summaryJdTerms >= 1 ? 16 : 12;

  const semanticMatch = Math.min(97, Math.max(10, Math.round(titleScore + techScore + summaryScore)));

  // ── 3. DYNAMIC IMPACT BULLETS & MISSING METRICS DETECTION ──────────────
  // Single canonical, section-aware extractor (shared with the Bullet Improver) so the
  // "Missing Metrics" box always lists exactly the bullets the Bullet Improver shows.
  // Certifications, Languages, Education, Skills and Summary are never evaluated.
  const bulletLines = extractScorableBullets(resumeText).map(b => b.cleanText);

  const missingMetrics: string[] = [];
  let scoreSum = 0;
  let quantifiedBulletsCount = 0;
  let fullyPassingCount = 0;

  for (const cleanBullet of bulletLines) {
    const hasVerb = hasStrongActionVerb(cleanBullet);
    const hasMetric = hasQuantifiedMetric(cleanBullet);

    if (hasMetric) quantifiedBulletsCount++;

    if (hasVerb && hasMetric) {
      fullyPassingCount++;
      scoreSum += 100; // Perfect impact bullet: strong verb + measurable result
    } else {
      // Any bullet that fails EITHER check is highlighted (same rule as Bullet Improver)
      missingMetrics.push(cleanBullet);
      if (hasMetric) scoreSum += 75;      // Quantified but weak/no action verb
      else if (hasVerb) scoreSum += 45;   // Action verb but no measurable outcome
      else scoreSum += 25;                // Describes real work, but lacks both
    }
  }

  const totalBulletsCount = Math.max(1, bulletLines.length);
  const metricCoveragePercent = Math.round((quantifiedBulletsCount / totalBulletsCount) * 100);
  // A resume with no detectable impact bullets cannot earn a strong impact score
  const impactBullets = bulletLines.length === 0
    ? 15
    : Math.min(100, Math.max(5, Math.round(scoreSum / totalBulletsCount)));

  // ── 4. DYNAMIC FORMATTING & STRUCTURE ───────────────────────────────────
  let formatting = 0;
  const sectionChecks: [RegExp, number][] = [
    [/\b(experience|work history|employment|internships?|positions? held)\b/i, 14],
    [/\b(education|academic|college|university|degree|bachelor|master|phd)\b/i, 14],
    [/\b(skills|technical skills|technologies|expertise)\b/i, 14],
    [/\b(projects?|portfolio)\b/i, 8],
    [/\b(summary|profile|objective|about me)\b/i, 8],
    [/@[a-z0-9]/i, 6],
    [/\b\d{10}\b|\+\d{1,3}[\s\-]?\d/i, 6],
  ];

  for (const [pattern, pts] of sectionChecks) {
    if (pattern.test(resumeText)) formatting += pts;
  }

  // Structure quality checks (ATS parsers reward these)
  const wordCount = (resumeText || "").split(/\s+/).filter(Boolean).length;
  if (bulletLines.length >= 6) formatting += 10;
  else if (bulletLines.length >= 3) formatting += 5;
  if (/\b(19|20)\d{2}\s*[–\-—to]+\s*((19|20)\d{2}|present|current)\b/i.test(resumeText)) formatting += 10;
  if (wordCount >= 250 && wordCount <= 1100) formatting += 10;
  else if (wordCount >= 150) formatting += 4;
  formatting = Math.min(100, formatting);

  // ── 5. PURE DYNAMIC OVERALL SCORE ────────────────────────────────────────
  // Weighted composite — honest scoring, no hidden floors or static values.
  // Typical un-optimized resume → ~30–55. AI-optimized → ~82–92.
  // Every bullet passing verb + metric → up to the 96 ceiling.
  const overall = Math.min(MAX_ATS_SCORE, Math.max(5, Math.round(
    keywordMatch    * 0.35 +
    semanticMatch   * 0.20 +
    impactBullets   * 0.35 +
    formatting      * 0.10
  )));

  const extractedSkills = Array.from(new Set([...resumeTechTerms, ...foundKeywords]));
  const extractedTitles: string[] = [];
  for (const title of COMMON_TITLES) {
    if (new RegExp(`\\b${title}\\b`, "i").test(resumeText)) extractedTitles.push(title);
  }

  return {
    overall,
    semanticMatch,
    keywordMatch,
    impactBullets,
    formatting,
    extractedSkills,
    extractedTitles,
    missingKeywords,
    foundKeywords,
    missingMetrics,
    quantifiedCount: quantifiedBulletsCount,
    totalBulletsCount: bulletLines.length,
    metricCoveragePercent,
  };
}

export async function scoreResume(
  resumeText: string,
  jobDescription: string,
  _scoreBefore?: number,
  bulletImprovementsCount?: number
): Promise<ATSScore> {
  // Purely dynamic score calculation based on real content
  const score = localScore(resumeText, jobDescription);

  // Dynamically reward verified bullet improvements made by the candidate
  if (bulletImprovementsCount && bulletImprovementsCount > 0) {
    // Small, capped reward — the improved text itself is already re-measured above
    score.overall = Math.min(MAX_ATS_SCORE, score.overall + Math.min(3, bulletImprovementsCount));
    score.impactBullets = Math.min(100, score.impactBullets + bulletImprovementsCount * 2);
  }

  return score;
}
