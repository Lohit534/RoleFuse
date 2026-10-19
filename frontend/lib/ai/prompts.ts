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
  const hasOriginalLanguages = /(?:languages?|languages?\s*(?:spoken|known))\b/i.test(resumeText);
  const includeSummary = !isFresher || hasOriginalSummary;

  let sectionOrderStr = "1. NAME\n2. CONTACT LINE (phone | email | LinkedIn | GitHub | Portfolio)\n3. (blank line)\n";
  let stepNum = 4;

  if (includeSummary) {
    sectionOrderStr += `${stepNum++}. PROFESSIONAL SUMMARY\n${stepNum++}. (blank line)\n`;
  }

  if (isFresher) {
    sectionOrderStr += `${stepNum++}. TECHNICAL SKILLS\n${stepNum++}. (blank line)\n`;
    sectionOrderStr += `${stepNum++}. PROJECTS\n${stepNum++}. (blank line)\n`;
    sectionOrderStr += `${stepNum++}. CERTIFICATIONS & ACHIEVEMENTS  (omit if candidate has none)\n${stepNum++}. (blank line)\n`;
    sectionOrderStr += `${stepNum++}. EDUCATION\n`;
  } else {
    sectionOrderStr += `${stepNum++}. PROFESSIONAL EXPERIENCE\n${stepNum++}. (blank line)\n`;
    sectionOrderStr += `${stepNum++}. TECHNICAL SKILLS\n${stepNum++}. (blank line)\n`;
    sectionOrderStr += `${stepNum++}. PROJECTS\n${stepNum++}. (blank line)\n`;
    sectionOrderStr += `${stepNum++}. CERTIFICATIONS & ACHIEVEMENTS  (omit if candidate has none)\n${stepNum++}. (blank line)\n`;
    sectionOrderStr += `${stepNum++}. EDUCATION\n`;
  }

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
    "EXACT SECTION ORDER (follow dynamically based on candidate's background):\n" +
    sectionOrderStr +
    "EXACT LINE FORMAT FOR EACH SECTION:\n\n" +
    "NAME LINE:\n" +
    "  Candidate full name -- e.g. DINESH KAARTHIK MOODE\n\n" +
    "CONTACT LINE (single line, | separator):\n" +
    "  phone | email | LinkedIn URL | GitHub URL | portfolio URL | location (City, State/Country)\n" +
    "  CRITICAL CONTACT RULES:\n" +
    "  - Extract and include ALL candidate contact details from the original resume: Phone number, Email address, LinkedIn profile, GitHub profile, Portfolio/Website, and Location/City.\n" +
    "  - NEVER drop or omit candidate phone number, email, or location.\n" +
    "  - DO NOT add a target job title, job name, or domain subtitle line under the name or inside the contact details line. Place the contact line directly beneath candidate name.\n" +
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
    "  - If internship tools/technologies were provided, list them under 'Developer Tools: ...' or 'Frameworks: ...' without bullets, and weave them into the internship experience bullets.\n" +
    "  Organized into clean 'Category: values' lines (each on ONE single line):\n" +
    "    Programming Languages: Java, SQL, JavaScript\n" +
    "    Frameworks: Spring Boot, Spring MVC, Hibernate, JPA\n" +
    "    Databases: MySQL, PostgreSQL, DynamoDB, MongoDB\n" +
    "    Developer Tools: Git, GitHub, Maven, Postman, Docker, IntelliJ IDEA\n" +
    "    Cloud: AWS (EC2, S3), GCP (if applicable)\n" +
    "    Core Concepts: REST APIs, Microservices, OOP, Multithreading, JWT Authentication\n" +
    "  List JD-matching skills FIRST in each category\n\n" +
    "PROFESSIONAL EXPERIENCE & INTERNSHIPS:\n" +
    "  Header: PROFESSIONAL EXPERIENCE (ALL CAPS)\n" +
    "  For each role / internship:\n" +
    "    Line 1: Role Title | Company Name | Tech Stack\n" +
    "    Line 2 (IF DATES EXIST IN RESUME OR USER-VERIFIED ANSWERS): Month YYYY - Month YYYY (or Duration / Present)\n" +
    "    Lines 3+: • Strong bullet (one per line)\n" +
    "    CRITICAL FOR INTERNSHIP DATES: If the user provided verified internship duration/period in their answers or original resume, you MUST include it on Line 2! However, NEVER invent or guess fake years/dates if neither the resume nor the user provided them.\n" +
    "  Every bullet MUST begin with a powerful past-tense action verb and quantify impact.\n\n" +
    "PROJECTS:\n" +
    "  Header: PROJECTS (ALL CAPS)\n" +
    "  For each project:\n" +
    "    Line 1: Project Name — Tech Stack (do NOT invent or append fake years/dates if candidate did not mention them!)\n" +
    "    Lines 2+: 2-4 impact-oriented bullets describing contributions, architectures, and outcomes.\n\n" +
    "EDUCATION:\n" +
    "  Header: EDUCATION (ALL CAPS)\n" +
    "  CRITICAL EDUCATION RULE: Preserve EVERY education stage and credential mentioned in original resume or user answers:\n" +
    "  - College / University Degree (e.g. B.Tech, B.S., M.Tech, Degree)\n" +
    "  - Intermediate / 12th / Class XII / Diploma (if present)\n" +
    "  - SSC / 10th / Class X / Secondary School Certificate / Matriculation (MANDATORY if present in resume or provided in user answers)\n" +
    "  NEVER DELETE, DROP, OR OMIT SSC OR INTERMEDIATE! Retain all candidate schooling and degree records.\n" +
    "  For each entry:\n" +
    "    Line 1: Degree / Qualification Name | Graduated: YYYY (or Month YYYY - Month YYYY)\n" +
    "    Line 2: Institution / School Name | Board / Stream | CGPA / Percentage (only if available)\n\n" +
    "CERTIFICATIONS & ACHIEVEMENTS:\n" +
    "  Header: CERTIFICATIONS & ACHIEVEMENTS (ALL CAPS)\n" +
    "  CRITICAL: COMBINE all certifications, achievements, awards, and honors into this SINGLE unified section. Do NOT create two separate sections.\n" +
    "  Format: • Item Details (e.g. • AWS Certified Solutions Architect - Amazon Web Services, or • 1st Place at National Hackathon)\n" +
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
    "TASK 1 -- KEYWORD INJECTION (top priority):\n" +
    "Keywords to inject (ALL of them, at least once each):\n" +
    (keywordList || "(inject all JD tech terms you can identify)") + "\n\n" +
    "Rules:\n" +
    "- Add every technical keyword to the appropriate Technical Skills category\n" +
    "- Weave remaining keywords naturally into existing bullet rewrites\n" +
    "- Match EXACT casing from the JD (e.g., React.js not ReactJS)\n" +
    "- Rewrite the Professional Summary to include 5+ top JD keywords\n\n" +
    sep + "\n" +
    "STEP 3 — BULLET REWRITING (Experience and Projects ONLY)\n" +
    sep + "\n\n" +
    "Formula: [Strong Verb] + [Specific Task / Technology] + [Quantified Result with Scale or Percentage]\n\n" +
    "CRITICAL: Apply this formula ONLY to Professional Experience and Projects sections. NEVER apply this to Languages, Education, or Certifications. Leave those sections purely factual and unchanged.\n\n" +
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
    "✓ KEEP all education details exactly\n" +
    "✓ KEEP all URLs and links exactly\n" +
    "✓ KEEP all certifications exactly\n" +
    "✓ KEEP all project names exactly\n" +
    "✓ EXACT RESUME CONTENT FIDELITY: Parse, preserve, and reflect every single piece of information from the candidate's original resume exactly as written (all roles, titles, schools, GPAs, dates, projects, skills, and languages). Never drop or omit candidate data.\n" +
    "✓ DO NOT ADD EXTRA OR UNREQUESTED TEXT: Do NOT invent commentary, explanations, side notes, or fake filler text. Just adjust and optimize the formatting, structure, metrics, and alignment of the candidate's actual qualifications.\n" +
    "✓ NEVER fabricate companies, employers, universities, or degrees\n" +
    "✓ NEVER change employment dates\n" +
    "✓ NEVER remove any section from the original (you may tighten wording to respect the PAGE BUDGET)\n" +
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
    "[ ] Contact line has email | phone | location | URLs separated by | (ALL contact items from original resume preserved)\n" +
    (includeSummary ? "[ ] Professional Summary is a concise 2-3 sentence executive paragraph\n" : "[ ] No artificial professional summary added for fresher (jump straight to Technical Skills and Projects)\n") +
    "[ ] TECHNICAL SKILLS appears exactly ONCE with ZERO bullet points (•, -, *) anywhere in the skills section\n" +
    "[ ] No extra or invented commentary text added beyond candidate facts and target JD keywords\n" +
    "[ ] Every experience AND project bullet starts with a strong past-tense verb AND contains a number/metric\n" +
    "[ ] Education contains all candidate stages including SSC (10th) and Intermediate (12th) if in original resume -- zero dropped education entries\n" +
    "[ ] Resume fits the PAGE BUDGET (" + pageBudget.maxPages + " page" + (pageBudget.maxPages > 1 ? "s" : "") + " max)\n" +
    "[ ] Zero fabricated or invented dates/years/months for internships, projects, or certifications\n" +
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
  company?: string
): string {
  const truncatedJd = jobDescription.slice(0, 4000);
  const truncatedResume = resumeText.slice(0, 6000);

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
    "4. Keep tone: professional, natural, engaging, genuinely human.\n" +
    "5. Strictly avoid: I am writing with great enthusiasm, synergy, hardworking team player, dynamic professional, or any AI cliches.\n" +
    "6. Structure: Salutation -> Engaging Introduction -> 1-2 Strong Body Paragraphs with concrete achievements -> Professional Closing Call-to-Action.\n" +
    "7. Length: 300-400 words. Not longer.\n\n" +
    "==================================================\n" +
    "TARGET JOB DESCRIPTION:\n" +
    truncatedJd + "\n\n" +
    "==================================================\n" +
    "CANDIDATE RESUME:\n" +
    truncatedResume + "\n\n" +
    "Return ONLY the complete text of the personalized cover letter. Do not include markdown code fences or conversational intro/outro text."
  );
}
