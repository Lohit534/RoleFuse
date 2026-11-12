import type { ResumeJSON } from "@/types/resume";
import { getPageBudget } from "@/lib/resume-format";

/**
 * buildOptimizationPrompt
 *
 * Generates the elite-grade ATS optimization prompt.
 * Key design decisions:
 *  - Full JD and resume text (5000 chars each — no truncation for normal resumes)
 *  - ALL missing keywords passed (up to 40, not just top-20)
 *  - Strict format contract enforced in prompt — every section, every line
 *  - PRE-FLIGHT CHECKLIST the model must self-verify before returning output
 */
export function buildOptimizationPrompt(
  resumeText: string,
  jobDescription: string,
  missingKeywords: string[],
  extractedSkills: string[],
  instructions = "",
  lengthOption = "Auto-detect"
): string {
  const SKILL_CATEGORIES = [
    "Programming Languages",
    "Frameworks & Libraries",
    "Databases & Backend",
    "Cloud & DevOps",
    "Developer Tools",
  ];

  // All missing keywords + extracted skills not already in resume — cap at 40
  const allKeywordsToInject = Array.from(
    new Set([
      ...missingKeywords,
      ...extractedSkills.filter(
        (s) => !resumeText.toLowerCase().includes(s.toLowerCase())
      ),
    ])
  ).slice(0, 40);

  const keywordList = allKeywordsToInject.join(", ");

  const userInstructionBlock = instructions?.trim()
    ? "\nUSER INSTRUCTIONS (apply these on top of everything else):\n" + instructions + "\n"
    : "";

  const lengthInstruction =
    lengthOption === "Shorter"
      ? "- Trim bullets to 3 per role maximum"
      : lengthOption === "Longer"
      ? "- Expand bullets to 5-6 per role with more detail"
      : "";

  const sep = "=".repeat(51);

  // Dynamic page budget from the candidate's real experience dates
  const pageBudget = getPageBudget(resumeText);
  const isFresher = pageBudget.level === "fresher";
  const hasOriginalSummary = /(?:summary|about\s*me|objective|profile)\b/i.test(resumeText);
  const cleanResumeWithoutTech = resumeText
    .replace(/(?:programming|coding|technical|software|markup)\s+languages?\b/gi, "")
    .replace(/(?:languages?\s*:\s*[A-Za-z0-9#+.,\s]+\n)/gi, "");
  const hasOriginalLanguages = /(?:^|\n)\s*(?:spoken\s+languages?|languages?\s+known|languages?\s+spoken|languages)\s*[:\n]/i.test(cleanResumeWithoutTech);
  const includeSummary = !isFresher || hasOriginalSummary;

  // Detect whether the original resume actually has professional experience or internship content
  const hasOriginalExperience = /\b(professional\s+experience|work\s+experience|employment\s+history|work\s+history|employment|career\s+history)\b/i.test(resumeText);
  const hasOriginalInternship = /\b(internship|intern\b|trainee|apprentice|industrial\s+training)\b/i.test(resumeText);
  // Determine the correct experience section heading
  const expSectionHeading = hasOriginalExperience
    ? "PROFESSIONAL EXPERIENCE"
    : hasOriginalInternship
    ? "INTERNSHIP EXPERIENCE"
    : "PROFESSIONAL EXPERIENCE"; // default fallback

  let sectionOrderStr = "1. NAME\n2. CONTACT LINE (phone | email | LinkedIn | GitHub | Portfolio)\n3. (blank line)\n";
  let stepNum = 4;

  if (includeSummary) {
    sectionOrderStr += `${stepNum++}. PROFESSIONAL SUMMARY\n${stepNum++}. (blank line)\n`;
  }

  sectionOrderStr += `${stepNum++}. TECHNICAL SKILLS\n${stepNum++}. (blank line)\n`;
  if (hasOriginalExperience || hasOriginalInternship) {
    sectionOrderStr += `${stepNum++}. ${expSectionHeading}\n${stepNum++}. (blank line)\n`;
  }
  sectionOrderStr += `${stepNum++}. PROJECTS\n${stepNum++}. (blank line)\n`;
  sectionOrderStr += `${stepNum++}. CERTIFICATIONS & ACHIEVEMENTS  (omit if candidate has none)\n${stepNum++}. (blank line)\n`;
  sectionOrderStr += `${stepNum++}. EDUCATION\n`;

  if (hasOriginalLanguages) {
    sectionOrderStr += `${stepNum++}. (blank line)\n${stepNum++}. LANGUAGES\n`;
  }
  sectionOrderStr += "\n";

  return (
    "You are RoleFuse's elite ATS resume optimization engine.\n" +
    "Your sole job: produce a maximally ATS-optimized resume that preserves the candidate's facts\n" +
    "while injecting every target keyword and rewriting every bullet for measurable impact.\n\n" +
    sep + "\n" +
    "ABSOLUTE OUTPUT FORMAT CONTRACT -- EVERY RULE IS MANDATORY\n" +
    sep + "\n\n" +
    "PLAIN TEXT RULES:\n" +
    "- Return plain text ONLY in the \"resume\" field -- zero LaTeX, zero Markdown\n" +
    "- No \\textbf \\section \\begin \\end \\item\n" +
    "- No ** ## __ ~~ `` or any other Markdown inside resume text\n" +
    "- Use real newline characters to separate lines -- NOT the literal string \\n\n" +
    "- Maximum 2 blank lines between sections\n\n" +
    "TECH TERMS NEVER SPLIT ACROSS LINES:\n" +
    "MySQL TypeScript JavaScript PostgreSQL MongoDB Spring Boot Node.js Next.js\n" +
    "React.js Vue.js GraphQL FastAPI Django Kubernetes Docker TensorFlow PyTorch\n" +
    "GitHub GitLab VS Code Power BI CI/CD Machine Learning Deep Learning DevOps\n" +
    "REST API Microservices Cloud Native\n\n" +
    "ATS-STANDARD TAILORED RESUME ORDER (Format as the gold-standard ATS tailored resume):\n" +
    sectionOrderStr +
    "EXACT LINE FORMAT FOR EACH SECTION:\n\n" +
    "NAME LINE:\n" +
    "  Candidate full name -- e.g. DINESH KAARTHIK MOODE\n\n" +
    "CONTACT LINE (single line, | separator):\n" +
    "  Format: phone | email | LinkedIn URL | GitHub URL | portfolio URL\n" +
    "  ⚠️  LOCATION / CITY / COUNTRY — ABSOLUTE PROHIBITION:\n" +
    "  - NEVER add, infer, assume, or fabricate a city, state, country, or any geographic location.\n" +
    "  - If a location does NOT explicitly appear in the original resume text, it MUST NOT appear in the output.\n" +
    "  - Candidates often intentionally omit location for privacy — do NOT second-guess this.\n" +
    "  - Scan the original resume: if the word (Hyderabad, India, Bangalore, Remote, etc.) is NOT present, do NOT write it.\n" +
    "  CRITICAL CONTACT RULES:\n" +
    "  - ONLY include contact details that ACTUALLY exist in the candidate's original resume: Phone, Email, LinkedIn, GitHub, Portfolio, Location (only if present).\n" +
    "  - NEVER drop or omit candidate phone number, email, or LinkedIn/GitHub links that were provided in the original resume.\n" +
    "  - DO NOT add a target job title, job name, or domain subtitle line under the name or inside the contact details line.\n" +
    "  - Preserve ALL URLs exactly as in original resume.\n\n" +
    (includeSummary
      ? "PROFESSIONAL SUMMARY:\n" +
        "  Header: PROFESSIONAL SUMMARY (ALL CAPS)\n" +
        "  Content: 2-3 lines (45-65 words) pure narrative paragraph, NO bullets\n" +
        "  Highlight: target role, core technologies, scale of systems built, and measurable career value.\n" +
        "  AVOID generic clichés: 'I am hardworking', 'Quick learner', 'Self motivated', 'Passionate'.\n" +
        "  INSTEAD use direct impact: 'Experienced Backend Engineer specializing in Java, Spring Boot, and scalable microservices.'\n\n"
      : "") +
    "TECHNICAL SKILLS:\n" +
    "  Header: TECHNICAL SKILLS (ALL CAPS)\n" +
    "  CRITICAL: Output exactly ONE single skills section. NEVER output duplicate 'SKILLS' and 'TECHNICAL SKILLS' headers. Set only ONE.\n" +
    "  ABSOLUTE RULE FOR TECHNICAL SKILLS — ZERO BULLET POINTS:\n" +
    "  - NEVER use bullet points (•, -, *, etc.) anywhere in the TECHNICAL SKILLS section.\n" +
    "  - Every skill line MUST strictly be in 'Category: val1, val2, val3' format on a single line.\n" +
    "  - NEVER output bullet lines like '• Technologies & Tools: ...' or '• Python, React'.\n" +
    "  - Keep Technical Skills focused on core candidate competencies. Do NOT dump internship-specific stacks exclusively here; internship tools belong directly on the internship entry.\n" +
    "  Organized into clean 'Category: values' lines (each on ONE single line):\n" +
    "    Programming Languages: Java, SQL, JavaScript\n" +
    "    Frameworks: Spring Boot, Spring MVC, Hibernate, JPA\n" +
    "    Databases: MySQL, PostgreSQL, DynamoDB, MongoDB\n" +
    "    Developer Tools: Git, GitHub, Maven, Postman, Docker, IntelliJ IDEA\n" +
    "    Cloud: AWS (EC2, S3), GCP (if applicable)\n" +
    "    Core Concepts: REST APIs, Microservices, OOP, Multithreading, JWT Authentication\n" +
    "  List JD-matching skills FIRST in each category\n\n" +
    `PROFESSIONAL EXPERIENCE & INTERNSHIPS:\n` +
    `  Header: ${expSectionHeading} (ALL CAPS)\n` +
    `  CRITICAL: ONLY include this section if the original resume actually contains work experience, internship, or trainee content. DO NOT fabricate experience entries.\n` +
    `  For each role:\n` +
    `    Line 1: Role Title | Month YYYY – Month YYYY (or "Duration" / Present if dates given)\n` +
    `    Line 2: Company Name | Technologies & Frameworks used\n` +
    `    Lines 3+: 2-4 strong action-verb bullets (• prefix)\n` +
    `  For each INTERNSHIP entry, follow this EXACT format (MANDATORY):\n` +
    `    Line 1: Internship Title | Month YYYY – Month YYYY (use "Duration" if no specific dates given, or exact dates from original resume)\n` +
    `    Line 2: Company Name | Tech Stack (comma-separated technologies used in that internship)\n` +
    `    Lines 3+: • Strong past-tense action verb bullet with quantified impact\n` +
    `    INTERNSHIP FORMAT EXAMPLE:\n` +
    `    Web Development Intern | Jan 2024 – Jun 2024\n` +
    `    TechCorp Solutions | React, Node.js, MongoDB, Express\n` +
    `    • Developed 12 REST API endpoints using Node.js and Express, reducing data fetch time by 35%.\n` +
    `    • Built 8 reusable React components, improving page load speed by 28% across 5 screens.\n` +
    `  NEVER dump internship technologies into Technical Skills — they belong on Line 2 of the internship entry.\n` +
    `  NEVER fabricate dates/years that are not in the original resume; use "Duration" as placeholder if unknown.\n` +
    `  Every bullet MUST begin with a powerful past-tense action verb and quantify impact.\n\n` +
    "PROJECTS:\n" +
    "  Header: PROJECTS (ALL CAPS)\n" +
    "  For each project:\n" +
    "    Line 1: Project Name — Tech Stack | Year (e.g. Distributed Task Scheduling Engine — Java, Spring Boot, Redis, MySQL | 2025)\n" +
    "    Lines 2+: 2-4 impact-oriented bullets describing contributions, architectures, and outcomes.\n\n" +
    "EDUCATION:\n" +
    "  Header: EDUCATION (ALL CAPS)\n" +
    "  CRITICAL EDUCATION RULE: Preserve EVERY education stage and credential mentioned in original resume or user answers:\n" +
    "  - College / University Degree (e.g. B.Tech, B.S., M.Tech, Degree)\n" +
    "  - Intermediate / 12th / Class XII / Diploma (if present)\n" +
    "  - SSC / 10th / Class X / Secondary School Certificate / Matriculation (MANDATORY if present in resume or provided in user answers)\n" +
    "  NEVER DELETE, DROP, OR OMIT SSC OR INTERMEDIATE! Retain all candidate schooling and degree records.\n" +
    "  For each entry:\n" +
    "    Line 1: Degree / Qualification Name | YYYY (or Month YYYY - Month YYYY)\n" +
    "    Line 2: Institution / School Name | CGPA: X.X (or Stream / Percentage)\n" +
    "    CRITICAL EDUCATION RULES:\n" +
    "    - NEVER output words like 'Graduated:', 'Passing Year:', 'Batch:' before dates. Just output the year or date range directly (e.g. '2026' or '2020 - 2022').\n" +
    "    - If Intermediate / High School has a stream (like MPC, BiPC, Science, Commerce), attach it directly to the degree on Line 1: 'Intermediate (MPC) | 2020 - 2022'.\n" +
    "    - Never output stream names or 'Graduated:' as a standalone line.\n\n" +
    "CERTIFICATIONS & ACHIEVEMENTS:\n" +
    "  Header: CERTIFICATIONS & ACHIEVEMENTS (ALL CAPS)\n" +
    "  CRITICAL: COMBINE all certifications, achievements, awards, and honors into this SINGLE unified section. Do NOT create two separate sections.\n" +
    "  CERTIFICATIONS format: • Certification Name – Providing Organization / Platform (e.g. • Python Foundations – Infosys Springboard, • Python Programming – CodeTantra, • Foundations of Cybersecurity – Google)\n" +
    "  CRITICAL FOR CERTIFICATIONS: Keep the EXACT Certification Name and EXACT Providing Company Name as provided by the candidate. NEVER swap them, NEVER change company names, and NEVER write wordy sentences or explanations.\n" +
    "  ACHIEVEMENTS format: • Descriptive accomplishment sentence (e.g. • Solved 150+ Data Structures and Algorithms problems on LeetCode, • Solved 30+ Python algorithmic challenges on HackerRank)\n" +
    "  SIMPLE BULLET STANDARD: Keep certifications clean and simple — strictly '• Certification Name – Provider Company'. DO NOT generate paragraphs or fabricated project text.\n" +
    "  CRITICAL RULE FOR YEARS: NEVER invent, guess, or add a year or date to a certification or achievement if candidate did NOT mention a year in their original resume! ONLY set the year if explicitly in the original resume.\n\n" +
    (hasOriginalLanguages
      ? "LANGUAGES:\n" +
        "  Header: LANGUAGES (ALL CAPS)\n" +
        "  Format: • Language Name (e.g. • English, • Telugu, • Hindi)\n" +
        "  CRITICAL: The candidate listed spoken languages in their original resume. You MUST preserve and include them here. NEVER drop or remove languages.\n\n"
      : "") +
    sep + "\n" +
    "STEP 1 — METRIC & DETAIL INTEGRATION\n" +
    sep + "\n\n" +
    "Integrate all candidate metrics, technologies, and facts directly into the bullet rewrites.\n" +
    "If the user has provided supplemental metrics or answers in the instructions, you MUST weave them directly into the corresponding bullets.\n" +
    "For bullets lacking numbers, provide realistic, contextual impact quantification (e.g. 'improving processing speed by 35%', 'serving 15k+ active users', 'reducing latency by 40%').\n" +
    "Do NOT leave raw [ADD: ...] placeholders in the final resume text; produce complete, natural, recruiter-ready sentences.\n\n" +
    sep + "\n" +
    "STEP 2 — KEYWORD INJECTION\n" +
    sep + "\n\n" +
    "IMPORTANT — MAXIMUM ATS ALIGNMENT:\n" +
    "Even if the candidate's background differs significantly from the target job, maximize ATS alignment by:\n" +
    "1. Reframing existing bullet points to emphasize transferable skills that match JD requirements\n" +
    "2. Prioritizing JD keywords in Technical Skills categories (never fabricate technologies not in resume)\n" +
    "3. Restructuring the Professional Summary to bridge the candidate's background to target role\n" +
    "4. Highlighting overlapping skills and competencies between the resume and JD\n" +
    "5. Never fabricate experience — only reframe genuine experience with JD-aligned language\n\n" +
    "TASK 1 -- KEYWORD INJECTION (top priority):\n" +
    "Keywords to inject (ALL of them, at least once each):\n" +
    (keywordList || "(inject all JD tech terms you can identify)") + "\n\n" +
    "Rules:\n" +
    "- Add every technical keyword to the appropriate Technical Skills category\n" +
    "- Weave remaining keywords naturally into existing bullet rewrites\n" +
    "- Match EXACT casing from the JD (e.g., React.js not ReactJS)\n" +
    "- Rewrite the Professional Summary to include 5+ top JD keywords\n\n" +
    sep + "\n" +
    "STEP 3 — BULLET REWRITING (Experience / Internship / Projects ONLY)\n" +
    sep + "\n\n" +
    "Formula: [Strong Verb] + [Specific Task / Technology] + [Quantified Result with Scale or Percentage]\n\n" +
    "⚠️  SCOPE — STRICTLY ONLY THESE SECTIONS:\n" +
    "  Apply bullet rewrites ONLY to: Professional Experience, Internship Experience, Work Experience, Projects.\n" +
    "  NEVER touch: Education, Certifications, Achievements, Languages, Skills, Summary.\n" +
    "  Leave those sections exactly as the candidate wrote them (only add missing keywords to Skills).\n\n" +
    "⚠️  DO NOT FABRICATE OR INFLATE:\n" +
    "  - Only use metrics the candidate provided (via answers or in the original resume).\n" +
    "  - For bullets missing numbers, add realistic contextual estimates in brackets (e.g. 'reducing latency by ~35%').\n" +
    "  - Never invent company sizes, team sizes, or revenue numbers that the candidate did not mention.\n\n" +
    "MANDATORY BULLET STANDARDS:\n" +
    "- Every bullet MUST start with a strong past-tense action verb (no gerunds, no adverbs, no I/We)\n" +
    "- Every bullet MUST include a specific quantified outcome (%, count, scale, speed, cost)\n" +
    "- Bullets should be concise: 15-25 words per bullet — never write paragraphs\n" +
    "- Use diverse verbs — never repeat the same verb more than twice across the resume\n\n" +
    "Transform examples:\n" +
    "WEAK: 'Worked on backend' → 'Engineered 18+ RESTful APIs with Node.js, handling 25k+ daily requests and reducing p95 latency by 35%'\n" +
    "WEAK: 'Did data analysis' → 'Analyzed 500,000+ records using Python and Pandas, improving reporting accuracy by 28% and cutting ETL time by 45%'\n" +
    "WEAK: 'Used Docker' → 'Containerized 12 microservices with Docker and Kubernetes on AWS, cutting deployment time by 45% and achieving 99.9% uptime'\n" +
    "WEAK: 'Built UI screens' → 'Developed 20+ reusable React components, reducing code duplication by 40% and improving Lighthouse score from 62 to 91'\n" +
    "WEAK: 'Fixed bugs' → 'Resolved 80+ production bugs and regression issues, raising test coverage from 58% to 92% using Jest and CI/CD'\n\n" +
    "50 POWERFUL ACTION VERBS (use these to start EVERY bullet point):\n" +
    "Developed, Designed, Built, Implemented, Engineered, Optimized, Automated, Integrated, Improved, Reduced,\n" +
    "Created, Configured, Deployed, Refactored, Migrated, Enhanced, Accelerated, Streamlined, Maintained,\n" +
    "Secured, Validated, Tested, Documented, Analyzed, Solved, Led, Delivered, Collaborated, Architected,\n" +
    "Monitored, Debugged, Scaled, Generated, Processed, Queried, Visualized, Researched, Evaluated, Simplified,\n" +
    "Modernized, Orchestrated, Containerized, Trained, Provisioned, Hardened, Benchmarked, Transformed, Restructured.\n\n" +
    "Quantification rules:\n" +
    "- Weave verified user-provided numbers and metrics wherever available\n" +
    "- Performance bullets → 30-50% improvement, 2x faster, Xs to Ys latency\n" +
    "- Scale bullets → 5k-100k users, 1M+ records, 20k+ API calls/day\n" +
    "- Testing bullets → 80+ bugs fixed, 60%→90% test coverage\n" +
    "- Team bullets → team of 4-8, 2 weeks ahead of schedule, 3 sprints\n" +
    "- Cost bullets → ₹2L/month savings, 30% infra cost reduction\n" +
    "- NEVER use vague terms without numbers: 'significantly', 'greatly', 'multiple', 'various'\n" +
    "- Ensure every bullet reads as a strong, accomplished achievement\n\n" +
    sep + "\n" +
    "STEP 4 — SUMMARY REWRITE\n" +
    sep + "\n\n" +
    "TASK 4 -- SUMMARY REWRITE:\n" +
    "- Sentence 1: [Years / fresher] in [target role from JD] specializing in [top 3 JD skills]\n" +
    "- Sentence 2: [Key achievement from resume or strong capability statement with JD tech]\n" +
    "- Sentence 3: [Value proposition matching the JD role and organization type]\n" +
    "- 55-80 words total, no bullets, no dashes, include 6+ JD keywords\n\n" +
    sep + "\n" +
    "STEP 5 — SKILLS REORGANIZATION\n" +
    sep + "\n\n" +
    "TASK 3 -- SKILLS REORGANIZATION:\n" +
    "- Put JD-matching skills FIRST in every category\n" +
    "- Add every missing JD technical skill to the most relevant category\n" +
    "- Use ONLY these 5 categories (no others): " + SKILL_CATEGORIES.join(", ") + "\n\n" +
    sep + "\n" +
    "PRESERVATION RULES (never violate)\n" +
    sep + "\n\n" +
    "✓ KEEP all company names exactly as written\n" +
    "✓ KEEP all dates exactly as written\n" +
    "✓ KEEP all education details exactly — do NOT add, remove, or change education entries\n" +
    "✓ KEEP all URLs and links exactly\n" +
    "✓ KEEP all certifications exactly\n" +
    "✓ KEEP all project names exactly\n" +
    "✓ EXACT RESUME CONTENT FIDELITY: Parse, preserve, and reflect every single piece of information from the candidate's original resume exactly as written (all roles, titles, schools, GPAs, dates, projects, skills, and languages). Never drop or omit candidate data.\n" +
    "✓ DO NOT ADD EXTRA OR UNREQUESTED TEXT: Do NOT invent commentary, explanations, side notes, or fake filler text.\n" +
    "✓ NEVER fabricate companies, employers, universities, or degrees\n" +
    "✓ NEVER change employment dates\n" +
    "✓ NEVER remove any section from the original (you may tighten wording to respect the PAGE BUDGET)\n" +
    "✓ NEVER add a location, city, country, or state that is not in the original resume — not even as 'India', 'Remote', or 'Hyderabad'\n" +
    "✓ ATS STANDARD FORMAT: Structure the resume into the clean, ATS-standard tailored layout (Name, Contact, Summary, Technical Skills, Experience/Internships, Projects, Education, Certifications) so ATS screening parsers score it at 90%+.\n" +
    "✓ Respect the PAGE BUDGET below -- it overrides any desire to add more text\n\n" +
    sep + "\n" +
    "PAGE BUDGET (decided dynamically from the candidate's experience)\n" +
    sep + "\n" +
    pageBudget.instructions + "\n\n" +
    userInstructionBlock + "\n" +
    "LENGTH OPTION: " + lengthOption + "\n" +
    lengthInstruction + "\n\n" +
    sep + "\n" +
    "PRE-FLIGHT CHECKLIST (verify ALL before outputting):\n" +
    sep + "\n" +
    "[ ] Name is ALL CAPS on line 1\n" +
    "[ ] Contact line contains ONLY contact items from original resume — ZERO fabricated locations, cities, or countries\n" +
    "[ ] Location/city/state is NOT added if it was not in the original resume — this is a hard rule\n" +
    (includeSummary ? "[ ] Professional Summary is a concise 2-3 sentence executive paragraph\n" : "[ ] No artificial professional summary added — keep original structure\n") +
    "[ ] TECHNICAL SKILLS appears exactly ONCE with ZERO bullet points (•, -, *) anywhere in the skills section\n" +
    "[ ] No extra or invented commentary text added beyond candidate facts and target JD keywords\n" +
    "[ ] Only Experience/Internship/Project bullets were rewritten — Education, Certifications, Languages are UNTOUCHED\n" +
    "[ ] Education section preserved exactly as in original — no entries added, removed, or changed\n" +
    "[ ] Follows ATS-standard tailored layout for maximum recruiter and ATS parser score\n" +
    "[ ] Resume fits the PAGE BUDGET (" + pageBudget.maxPages + " page" + (pageBudget.maxPages > 1 ? "s" : "") + " max)\n" +
    "[ ] Zero fabricated or invented dates/years/months for internships, projects, or certifications\n" +
    "[ ] Every internship entry follows Line 1 (Title | Dates) + Line 2 (Company | Tech Stack) format\n" +
    "[ ] Certifications and achievements combined into a single CERTIFICATIONS & ACHIEVEMENTS section\n" +
    "[ ] Metrics/numbers added or [ADD:] placeholders used where missing\n" +
    "[ ] No LaTeX, no Markdown, no literal backslash-n in resume text\n" +
    "[ ] All original URLs and contact info preserved verbatim\n" +
    "[ ] No sections were dropped from the original resume\n" +
    (hasOriginalLanguages ? "[ ] LANGUAGES section preserved with all original spoken languages\n" : "") +
    "[ ] ALL " + allKeywordsToInject.length + " target keywords appear at least once\n\n" +
    sep + "\n" +
    "JOB DESCRIPTION:\n" +
    sep + "\n" +
    jobDescription.slice(0, 6000) + "\n\n" +
    sep + "\n" +
    "ORIGINAL RESUME:\n" +
    sep + "\n" +
    resumeText.slice(0, 10000) + "\n\n" +
    sep + "\n" +
    "OUTPUT FORMAT\n" +
    sep + "\n" +
    "Return ONLY this JSON -- no markdown, no preamble, no explanation:\n\n" +
    "{\n" +
    "  \"detectedJobTitle\": \"Exact Job Title from the JD\",\n" +
    "  \"detectedCompany\": \"Exact Company Name from the JD (or General Application if not mentioned)\",\n" +
    "  \"resume\": \"COMPLETE optimized resume -- every section, every role and project, fitted to the PAGE BUDGET. No placeholders.\",\n" +
    "  \"keywordsAdded\": [\"keyword1\", \"keyword2\", \"keyword3\"],\n" +
    "  \"placeholders\": [\n" +
    "    {\n" +
    "      \"line\": \"the full bullet or line that contains the placeholder\",\n" +
    "      \"placeholder\": \"[ADD: quantified metric — e.g. '40%']\",\n" +
    "      \"hint\": \"Add a specific percentage or number like 35% or 500+ to show your impact\",\n" +
    "      \"section\": \"PROFESSIONAL EXPERIENCE\"\n" +
    "    }\n" +
    "  ],\n" +
    "  \"bulletsRewritten\": 8,\n" +
    "  \"changesCount\": 15,\n" +
    "  \"summary\": \"X keywords injected, Y bullets rewritten, Z placeholders need your input\"\n" +
    "}"
  );
}

export function buildCoverLetterPrompt(
  resumeText: string,
  jobDescription: string,
  jobTitle?: string,
  company?: string,
  tone?: string
): string {
  const truncatedJd = jobDescription.slice(0, 4000);
  const truncatedResume = resumeText.slice(0, 6000);

  const toneInstruction = tone === "formal"
    ? "Tone: Polished, executive, respectful, and authoritative."
    : tone === "startup"
    ? "Tone: Agile, enthusiastic, high-impact, problem-solver mindset."
    : tone === "creative"
    ? "Tone: Compelling narrative, storytelling hooks, memorable and engaging."
    : "Tone: Modern, direct, confident, impact-driven, zero corporate fluff.";

  return (
    "You are an expert career consultant and professional cover letter writer.\n\n" +
    "CORE TASK:\n" +
    "Write a personalized, compelling cover letter for this role using the candidate's resume and target job description.\n" +
    "Explain why the candidate is interested in this company, connect their experience with the JD requirements,\n" +
    "and keep the tone professional, natural, and human.\n\n" +
    "==================================================\n" +
    "GUIDELINES:\n" +
    "==================================================\n" +
    "1. Write from the candidate's first-person perspective (I, my).\n" +
    "2. Explain clearly why the candidate is interested in " + (company || "this company") + " and the " + (jobTitle || "target role") + ".\n" +
    "3. Seamlessly connect the candidate's background, technical skills, and measurable achievements\n" +
    "   from their resume with key requirements in the JD.\n" +
    "4. " + toneInstruction + "\n" +
    "5. Strictly avoid: I am writing with great enthusiasm, synergy, hardworking team player, dynamic professional, or any AI cliches.\n" +
    "6. Structure: Salutation -> Engaging Introduction -> 1-2 Strong Body Paragraphs with concrete achievements -> Professional Closing Call-to-Action.\n" +
    "7. Length: 280-380 words. Punchy and readable.\n\n" +
    "==================================================\n" +
    "TARGET JOB DESCRIPTION:\n" +
    truncatedJd + "\n\n" +
    "==================================================\n" +
    "CANDIDATE RESUME:\n" +
    truncatedResume + "\n\n" +
    "Return ONLY the complete text of the personalized cover letter. Do not include markdown code fences or conversational intro/outro text."
  );
}

export function buildInterviewQuestionsPrompt(
  resumeText: string,
  jobDescription: string,
  jobTitle?: string,
  company?: string
): string {
  const truncatedJd = jobDescription.slice(0, 4000);
  const truncatedResume = resumeText.slice(0, 5000);

  return (
    "You are an elite Tech & Executive Interview Coach who has conducted hundreds of hiring loops at top companies.\n\n" +
    "CORE TASK:\n" +
    "Analyze this candidate's resume against the target Job Description (" + (jobTitle || "Target Role") + " at " + (company || "Target Company") + ").\n" +
    "Generate 8 realistic, high-signal interview questions tailored specifically to their background and the job requirements.\n\n" +
    "DISTRIBUTION:\n" +
    "- 3 Behavioral Questions (Conflict, Leadership, Deadline pressure, Overcoming failure)\n" +
    "- 3 Technical / Hard Skill Questions (Testing exact tools, frameworks, system design, or domain expertise in JD & resume)\n" +
    "- 2 Situational / Problem-Solving Questions (Real dilemmas they will face in the first 90 days in this role)\n\n" +
    "OUTPUT FORMAT:\n" +
    "Return ONLY valid JSON matching this schema with NO markdown code fences or extra text:\n" +
    "{\n" +
    '  "overview": "Brief 1-2 sentence preparation strategy for this role",\n' +
    '  "questions": [\n' +
    "    {\n" +
    '      "id": "q1",\n' +
    '      "category": "behavioral" | "technical" | "situational",\n' +
    '      "difficulty": "Easy" | "Medium" | "Hard",\n' +
    '      "question": "The exact question text",\n' +
    '      "whyAsked": "What the recruiter/interviewer is secretly looking for",\n' +
    '      "sampleAnswer": "A full, high-scoring STAR method answer the candidate can study",\n' +
    '      "keyPoints": ["Key point 1 to mention", "Key point 2 to mention", "Key point 3 to mention"]\n' +
    "    }\n" +
    "  ]\n" +
    "}\n\n" +
    "JOB DESCRIPTION:\n" + truncatedJd + "\n\n" +
    "CANDIDATE RESUME:\n" + truncatedResume
  );
}

export function buildEvaluateAnswerPrompt(
  question: string,
  userAnswer: string,
  jobDescription?: string,
  resumeText?: string
): string {
  return (
    "You are an expert interview evaluator.\n\n" +
    "Evaluate this candidate's practice interview answer for the following question.\n\n" +
    "QUESTION: " + question + "\n\n" +
    "CANDIDATE'S ANSWER:\n" + userAnswer + "\n\n" +
    (jobDescription ? "JOB CONTEXT:\n" + jobDescription.slice(0, 1500) + "\n\n" : "") +
    "Evaluate with honesty and actionable advice. Check for STAR format (Situation, Task, Action, Result), quantifiable metrics, and clarity.\n\n" +
    "Return ONLY valid JSON matching this schema:\n" +
    "{\n" +
    '  "score": 85,\n' +
    '  "verdict": "Exceptional" | "Solid" | "Needs Improvement",\n' +
    '  "feedback": "2-3 sentences of overall constructive assessment",\n' +
    '  "starBreakdown": {\n' +
    '    "situation": "Assessment of Situation context provided",\n' +
    '    "task": "Assessment of Task definition",\n' +
    '    "action": "Assessment of specific actions taken",\n' +
    '    "result": "Assessment of measurable outcomes/impact"\n' +
    "  },\n" +
    '  "strengths": ["Strength 1", "Strength 2"],\n' +
    '  "improvements": ["Improvement tip 1", "Improvement tip 2"],\n' +
    '  "improvedVersion": "A polished, top-tier rephrasing of their answer using the STAR method"\n' +
    "}"
  );
}

export function buildLinkedInOptimizerPrompt(
  resumeText: string,
  targetRole?: string,
  industry?: string,
  jobDescription?: string,
  linkedinUrl?: string
): string {
  const truncatedResume = resumeText.slice(0, 5000);
  const truncatedJd = jobDescription ? jobDescription.slice(0, 3500) : "";

  return (
    "You are the world's leading LinkedIn personal branding and executive profile consultant (comparable to Jobscan LinkedIn Optimization).\n\n" +
    "CORE OBJECTIVE:\n" +
    "Get this candidate noticed and found on LinkedIn by recruiters searching for: " + (targetRole || "Target Industry Role") + ".\n" +
    (linkedinUrl ? "LinkedIn Profile URL: " + linkedinUrl + "\n" : "") +
    (truncatedJd ? "TARGET JOB DESCRIPTION TO MATCH AGAINST:\n" + truncatedJd + "\n\n" : "") +
    "CANDIDATE PROFILE / RESUME DATA:\n" + truncatedResume + "\n\n" +
    "TASKS:\n" +
    "1. Calculate a realistic LinkedIn Profile Match Score (0-100) showing how well their profile matches recruiter search queries and target job expectations.\n" +
    "2. Diagnose exactly where human recruiters lose interest (dropoff points) and why.\n" +
    "3. Flag exact skill gaps (missing hard skills vs matched skills found in target job).\n" +
    "4. Generate 4 high-converting, magnetic headline variations (under 220 chars) that get found in LinkedIn Recruiter.\n" +
    "5. Generate 3 complete, formatted About summary variations tailored to convert views into interviews.\n" +
    "6. Identify the top 12 recruiter search keywords.\n" +
    "7. Provide 2-3 before/after bullet upgrades using Google's XYZ formula.\n\n" +
    "Return ONLY valid JSON matching this schema with NO markdown code fences or conversational text:\n" +
    "{\n" +
    '  "profileScore": 74,\n' +
    '  "profileScoreFeedback": "Summary of your profile readiness and recruiter search visibility",\n' +
    '  "dropoffAnalysis": "Recruiters lose interest after 6 seconds if your headline lacks hard skills or your summary is a generic bio. Adding quantifiable metrics and targeted keywords prevents dropoff.",\n' +
    '  "skillGaps": {\n' +
    '    "missingSkills": ["Key Skill 1", "Key Skill 2", "Key Skill 3", "Key Skill 4"],\n' +
    '    "matchedSkills": ["Matched Skill 1", "Matched Skill 2", "Matched Skill 3"]\n' +
    "  },\n" +
    '  "headlines": [\n' +
    "    {\n" +
    '      "style": "Keyword-Dense & ATS Ranked",\n' +
    '      "headline": "Target Role | Core Skills & Tech Stack | Value Proposition (under 220 chars)",\n' +
    '      "reason": "Why this headline ranks highest in LinkedIn search algorithm"\n' +
    "    },\n" +
    "    {\n" +
    '      "style": "Metric & Impact Driven",\n' +
    '      "headline": "Headline highlighting scale, metrics, dollars, or users impacted",\n' +
    '      "reason": "Builds instant authority with hiring leaders"\n' +
    "    },\n" +
    "    {\n" +
    '      "style": "Modern & Visionary",\n' +
    '      "headline": "Target Role | Building [Industry Innovation] | Core Competencies",\n' +
    '      "reason": "Ideal for fast-growing startups and scaleups"\n' +
    "    },\n" +
    "    {\n" +
    '      "style": "Executive & Authority",\n' +
    '      "headline": "Senior Role | Specialization | Delivering Strategic Business Outcomes",\n' +
    '      "reason": "Positions you as a proven domain expert"\n' +
    "    }\n" +
    "  ],\n" +
    '  "aboutSummaries": [\n' +
    "    {\n" +
    '      "style": "The First-Person Storyteller",\n' +
    '      "description": "Engaging hook -> career journey -> core expertise -> call to connect",\n' +
    '      "content": "Full formatted 3-paragraph LinkedIn About section"\n' +
    "    },\n" +
    "    {\n" +
    '      "style": "The Impact & Metrics Champion",\n' +
    '      "description": "Bold value proposition -> key achievements with numbers -> technical competencies",\n' +
    '      "content": "Full formatted LinkedIn About section"\n' +
    "    },\n" +
    "    {\n" +
    '      "style": "The Scannable Modern Executive",\n' +
    '      "description": "Optimized for mobile readers with clean bullets, emojis, and skills matrix",\n' +
    '      "content": "Full formatted LinkedIn About section with bullet points"\n' +
    "    }\n" +
    "  ],\n" +
    '  "recruiterKeywords": [\n' +
    '    "Keyword 1", "Keyword 2", "Keyword 3", "Keyword 4", "Keyword 5",\n' +
    '    "Keyword 6", "Keyword 7", "Keyword 8", "Keyword 9", "Keyword 10"\n' +
    "  ],\n" +
    '  "experienceUpgrades": [\n' +
    "    {\n" +
    '      "role": "Current/Past Role Context",\n' +
    '      "before": "Passive unquantified duty",\n' +
    '      "after": "Active XYZ metric-backed achievement",\n' +
    '      "why": "Why this bullet converts recruiter views into messages"\n' +
    "    }\n" +
    "  ]\n" +
    "}"
  );
}
