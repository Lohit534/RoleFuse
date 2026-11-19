// Structured ResumeData & ResumeJSON types
// Used across the entire application: AI generation, normalization,
// live preview (ResumePreview), PDF export, and DOCX export.

export interface ResumeContact {
  phone?: string;
  email?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  location?: string;
}

export interface ResumeSkillCategory {
  label: string; // e.g. "Programming Languages", "Frameworks & Libraries"
  items: string[]; // e.g. ["Python", "TypeScript", "React.js"]
}

export interface ResumeExperience {
  title: string;
  company: string;
  start?: string;
  end?: string;
  tags: string[]; // Technologies used in this role (subset of original resume)
  bullets: string[]; // Action-verb accomplishment bullets (plain text, NO bullet chars)
}

export interface ResumeProject {
  name: string;
  tags: string[]; // Tech stack (subset of original resume)
  year?: string;
  link?: string;
  bullets: string[]; // Action-oriented bullets (plain text, NO bullet chars)
}

export interface ResumeEducation {
  degree: string; // e.g. "B.Tech in Computer Science"
  institution: string; // College or University
  start?: string;
  end?: string;
  score?: string; // e.g. "CGPA: 8.5/10" or "85%"
}

export interface ResumeCertification {
  title: string;
  issuer?: string;
  year?: string;
}

export interface ResumeData {
  name: string;
  role?: string;
  contact: ResumeContact;
  summary?: string;
  skills: ResumeSkillCategory[];
  experience: ResumeExperience[];
  projects: ResumeProject[];
  education: ResumeEducation[];
  certifications: ResumeCertification[];
  achievements: string[];
  languages: string[];
}

// Backward-compatibility interface for legacy ResumeJSON references
export interface LegacyHeader {
  name: string;
  phone?: string;
  email?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export interface LegacySkillCategory {
  category: string;
  items: string[];
}

export interface LegacyExperience {
  role: string;
  company: string;
  duration: string;
  location?: string;
  bullets: string[];
}

export interface LegacyProject {
  title: string;
  stack: string[];
  link?: string;
  bullets: string[];
}

export interface LegacyEducation {
  degree: string;
  institution: string;
  university?: string;
  cgpa?: string;
  year: string;
}

export interface ResumeJSON {
  header: LegacyHeader;
  summary: string;
  skills: LegacySkillCategory[];
  experience?: LegacyExperience[];
  projects?: LegacyProject[];
  education: LegacyEducation[];
  certifications?: string[];
  achievements?: string[];
  languages?: string[];
  combinedCertAchiev?: boolean;
  keywordsAdded?: string[];
  changesCount?: number;
  summaryChanges?: string;
  detectedJobTitle?: string;
  detectedCompany?: string;
}

/**
 * Type guard to check if an unknown object is structured ResumeData
 */
export function isResumeData(val: any): val is ResumeData {
  if (!val || typeof val !== "object") return false;
  return (
    typeof val.name === "string" &&
    val.contact &&
    typeof val.contact === "object" &&
    Array.isArray(val.skills) &&
    Array.isArray(val.experience || val.experiences || []) &&
    Array.isArray(val.education || [])
  );
}

/**
 * Deterministically serialize structured ResumeData into clean ATS-formatted plain text
 * (used for scoring, clipboard copy, diff analysis, and fallback export)
 */
export function resumeDataToText(data: ResumeData): string {
  if (!data) return "";
  const lines: string[] = [];

  // 1. Name
  if (data.name) lines.push(data.name.trim().toUpperCase());

  // Subtitle / Role if present
  if (data.role && data.role.trim()) {
    lines.push(data.role.trim());
  }

  // 2. Contact Line
  const contactParts: string[] = [];
  const c = data.contact || {};
  if (c.phone) contactParts.push(c.phone.trim());
  if (c.email) contactParts.push(c.email.trim());
  if (c.linkedin) contactParts.push(c.linkedin.trim());
  if (c.github) contactParts.push(c.github.trim());
  if (c.portfolio) contactParts.push(c.portfolio.trim());
  if (c.location) contactParts.push(c.location.trim());

  if (contactParts.length) {
    lines.push(contactParts.join(" | "));
  }
  lines.push("");

  // 3. Professional Summary
  if (data.summary && data.summary.trim()) {
    lines.push("PROFESSIONAL SUMMARY");
    const cleanSummary = data.summary
      .replace(/^[•\-\*–—\s]+/gm, "")
      .replace(/\s+/g, " ")
      .trim();
    lines.push(cleanSummary);
    lines.push("");
  }

  // 4. Technical Skills
  if (data.skills && data.skills.length > 0) {
    lines.push("TECHNICAL SKILLS");
    for (const cat of data.skills) {
      if (cat.items && cat.items.length > 0) {
        lines.push(`${cat.label}: ${cat.items.join(", ")}`);
      }
    }
    lines.push("");
  }

  // 5. Experience
  if (data.experience && data.experience.length > 0) {
    lines.push("PROFESSIONAL EXPERIENCE");
    for (const exp of data.experience) {
      const dates = [exp.start, exp.end].filter(Boolean).join(" – ");
      lines.push(`${exp.title} | ${exp.company}${dates ? ` | ${dates}` : ""}`);
      if (exp.tags && exp.tags.length > 0) {
        lines.push(exp.tags.join(", "));
      }
      for (const bullet of exp.bullets || []) {
        const cleanB = bullet.replace(/^[•\-\*–—\s]+/, "").trim();
        if (cleanB) lines.push(`• ${cleanB}`);
      }
      lines.push("");
    }
  }

  // 6. Projects
  if (data.projects && data.projects.length > 0) {
    lines.push("PROJECTS");
    for (const proj of data.projects) {
      const tagsStr = (proj.tags || []).join(", ");
      const headerParts = [proj.name];
      if (tagsStr) headerParts.push(tagsStr);
      if (proj.year) headerParts.push(proj.year);
      if (proj.link) headerParts.push(proj.link);
      lines.push(headerParts.join(" | "));
      for (const bullet of proj.bullets || []) {
        const cleanB = bullet.replace(/^[•\-\*–—\s]+/, "").trim();
        if (cleanB) lines.push(`• ${cleanB}`);
      }
      lines.push("");
    }
  }

  // 7. Awards & Certifications
  const hasCerts = data.certifications && data.certifications.length > 0;
  const hasAchievs = data.achievements && data.achievements.length > 0;
  if (hasCerts || hasAchievs) {
    lines.push("AWARDS & CERTIFICATIONS");
    for (const cert of data.certifications || []) {
      const parts = [cert.title];
      if (cert.issuer) parts.push(cert.issuer);
      if (cert.year) parts.push(`(${cert.year})`);
      lines.push(`• ${parts.join(" – ")}`);
    }
    for (const ach of data.achievements || []) {
      const cleanA = ach.replace(/^[•\-\*–—\s]+/, "").trim();
      if (cleanA) lines.push(`• ${cleanA}`);
    }
    lines.push("");
  }

  // 8. Education
  if (data.education && data.education.length > 0) {
    lines.push("EDUCATION");
    for (const edu of data.education) {
      const dates = [edu.start, edu.end].filter(Boolean).join(" – ");
      lines.push(`${edu.degree}${dates ? ` | ${dates}` : ""}`);
      const line2 = [edu.institution, edu.score].filter(Boolean).join(" | ");
      if (line2) lines.push(line2);
      lines.push("");
    }
  }

  // 9. Languages
  if (data.languages && data.languages.length > 0) {
    lines.push("LANGUAGES");
    for (const lang of data.languages) {
      const cleanL = lang.replace(/^[•\-\*–—\s]+/, "").trim();
      if (cleanL) lines.push(`• ${cleanL}`);
    }
    lines.push("");
  }

  return lines.join("\n").trim();
}
