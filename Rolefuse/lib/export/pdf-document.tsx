import React from "react";
import {
  Font,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
  Svg,
  Path,
} from "@react-pdf/renderer";
import { logger } from "../logger";
import {
  parseResume,
  ParsedResume,
  parseResumeIntoBlocks,
  stripMarkdownAsterisks,
  getCleanExportFilename,
  toSectionTitle,
  splitCertText,
  isRoleOrTitle,
  extractRoleFromResume,
  cleanUrl,
  computeDensityScale,
  isFresherResume,
  getMaxPages,
  ParsedResumeBlock,
  ResumeBlock,
  ContactSegment,
  SkillLine,
  ProjectBlock,
  JobBlock,
  EducationBlock,
  StandaloneLink,
} from "../parser/resume-parser";

// Re-export shared parser utilities for complete backward compatibility across the app
export {
  parseResume,
  parseResumeIntoBlocks,
  stripMarkdownAsterisks,
  getCleanExportFilename,
  toSectionTitle,
  splitCertText,
  isRoleOrTitle,
  extractRoleFromResume,
  cleanUrl,
  computeDensityScale,
  isFresherResume,
  getMaxPages,
};
export type {
  ParsedResume,
  ParsedResumeBlock,
  ResumeBlock,
  ContactSegment,
  SkillLine,
  ProjectBlock,
  JobBlock,
  EducationBlock,
  StandaloneLink,
};

// Register hyphenation callback to prevent word breaks
Font.registerHyphenationCallback((word) => [word]);

// Contact icons (Vector SVGs)
const ContactIcon: React.FC<{ type: string }> = ({ type }) => {
  let path = "";
  if (type === "phone") {
    path =
      "M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1v3.5a1 1 0 01-1 1A19.93 19.93 0 012 3a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.21 2.2z";
  } else if (type === "email") {
    path =
      "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z";
  } else if (type === "linkedin") {
    path =
      "M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v7.6h2.79v-7.6H6.46M7.86 6.5a1.63 1.63 0 1 0 0 3.26 1.63 1.63 0 0 0 0-3.26z";
  } else if (type === "github") {
    path =
      "M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z";
  } else {
    // portfolio / globe
    path =
      "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z";
  }

  return (
    <Svg width={8} height={8} viewBox="0 0 24 24" style={{ marginRight: 3 }}>
      <Path d={path} fill="#444444" />
    </Svg>
  );
};

// Exact PDF Styles matching the ATS resume template specification
const styles = StyleSheet.create({
  page: {
    fontFamily: "Times-Roman",
    fontSize: 10.5,
    lineHeight: 1.4,
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 42,
    color: "#000000",
    backgroundColor: "#FFFFFF",
  },
  watermark: {
    fontFamily: "Times-Bold",
    fontSize: 9,
    color: "#CC0000",
    textAlign: "center",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  // 1. Name: Times-Bold 20pt centered
  name: {
    fontFamily: "Times-Bold",
    fontSize: 20,
    textAlign: "center",
    marginBottom: 2,
    color: "#000000",
  },
  // Role: Times-Italic 11pt centered marginBottom 3
  role: {
    fontFamily: "Times-Italic",
    fontSize: 11,
    textAlign: "center",
    marginBottom: 3,
    color: "#000000",
  },
  // 2. Contact row: centered, icons before each, separated by spaces, all on one line
  contactRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 5,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 6,
    marginVertical: 1,
  },
  contactText: {
    fontFamily: "Times-Roman",
    fontSize: 9.5,
    color: "#444444",
  },
  // 3. Horizontal rule after contact
  contactDivider: {
    borderBottomWidth: 0.75,
    borderBottomColor: "#000000",
    width: "100%",
    marginBottom: 6,
  },
  // SECTION HEADERS: Times-Bold 11pt uppercase, borderBottom 0.75pt solid black paddingBottom 2, 10pt margin top, 4pt margin bottom
  sectionHeaderWrapper: {
    marginTop: 10,
    marginBottom: 4,
  },
  sectionHeader: {
    fontFamily: "Times-Bold",
    fontSize: 11,
    textTransform: "uppercase",
    borderBottomWidth: 0.75,
    borderBottomColor: "#000000",
    paddingBottom: 2,
    color: "#000000",
  },
  // Summary
  summaryText: {
    fontFamily: "Times-Roman",
    fontSize: 10.5,
    lineHeight: 1.4,
    textAlign: "justify",
    color: "#000000",
  },
  // Skills: "Bold Label: normal value" on each line, plain lines only (no bullets)
  skillLine: {
    flexDirection: "row",
    marginBottom: 2,
  },
  skillLabel: {
    fontFamily: "Times-Bold",
    fontSize: 10.5,
    color: "#000000",
  },
  skillValue: {
    fontFamily: "Times-Roman",
    fontSize: 10.5,
    color: "#000000",
  },
  // Experience / Projects / Education common rows
  twoColRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 1,
  },
  leftBold: {
    fontFamily: "Times-Bold",
    fontSize: 10.5,
    color: "#000000",
    flex: 1,
  },
  rightDate: {
    fontFamily: "Times-Roman",
    fontSize: 10,
    color: "#555555",
    textAlign: "right",
    marginLeft: 8,
  },
  rightDateBold: {
    fontFamily: "Times-Bold",
    fontSize: 10,
    color: "#000000",
    textAlign: "right",
    marginLeft: 8,
  },
  leftItalic: {
    fontFamily: "Times-Italic",
    fontSize: 10,
    color: "#000000",
    flex: 1,
  },
  techTagsItalic: {
    fontFamily: "Times-Italic",
    fontSize: 10,
    color: "#666666",
  },
  rightGradeItalic: {
    fontFamily: "Times-Italic",
    fontSize: 10,
    color: "#555555",
    textAlign: "right",
    marginLeft: 8,
  },
  // Bullets: flex row, • dot 10pt, text flex-1
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 1.5,
    paddingLeft: 6,
  },
  bulletDot: {
    width: 10,
    fontSize: 10,
    fontFamily: "Times-Roman",
    color: "#000000",
  },
  bulletText: {
    flex: 1,
    fontFamily: "Times-Roman",
    fontSize: 10.5,
    lineHeight: 1.4,
    textAlign: "justify",
    color: "#000000",
  },
  boldInline: {
    fontFamily: "Times-Bold",
  },
  // Education entry spacing: 4pt space between entries
  eduEntry: {
    marginBottom: 4,
  },
});

interface ResumePDFProps {
  text: string;
  watermarked?: boolean;
}

export const ResumePDFDocument: React.FC<ResumePDFProps> = ({ text, watermarked = false }) => {
  const parsed = parseResume(text);

  return (
    <Document title={getCleanExportFilename(text, ".pdf")} author={parsed.name}>
      <Page size="A4" style={styles.page}>
        {/* Optional Watermark */}
        {watermarked && (
          <Text style={styles.watermark}>
            ROLEFUSE AI — FREE TIER PREVIEW (UPGRADE TO PRO TO DOWNLOAD)
          </Text>
        )}

        {/* 1. Name — large centered bold (20pt) */}
        {parsed.name ? <Text style={styles.name}>{parsed.name}</Text> : null}

        {/* Role — Times-Italic 11pt centered marginBottom 3 */}
        {parsed.role ? <Text style={styles.role}>{parsed.role}</Text> : null}

        {/* 2. Contact row — centered, icons before each, separated by spaces, all on one line */}
        {parsed.contacts.length > 0 && (
          <View style={styles.contactRow}>
            {parsed.contacts.map((c, i) => (
              <View key={i} style={styles.contactItem}>
                <ContactIcon type={c.type} />
                <Text style={styles.contactText}>{c.text}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 3. Horizontal rule after contact */}
        <View style={styles.contactDivider} />

        {/* 4. Sections in strict order:
            SUMMARY → SKILLS → EXPERIENCE → PROJECTS → AWARDS & CERTIFICATIONS → EDUCATION → LANGUAGES */}

        {/* SECTION 1: SUMMARY */}
        {parsed.summary ? (
          <View wrap={false}>
            <View style={styles.sectionHeaderWrapper}>
              <Text style={styles.sectionHeader}>SUMMARY</Text>
            </View>
            <Text style={styles.summaryText}>{parsed.summary}</Text>
          </View>
        ) : null}

        {/* SECTION 2: SKILLS */}
        {parsed.skills.length > 0 && (
          <View wrap={false}>
            <View style={styles.sectionHeaderWrapper}>
              <Text style={styles.sectionHeader}>SKILLS</Text>
            </View>
            {parsed.skills.map((s, i) => (
              <View key={i} style={styles.skillLine}>
                <Text>
                  <Text style={styles.skillLabel}>{s.label}: </Text>
                  <Text style={styles.skillValue}>{s.skills}</Text>
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* SECTION 3: EXPERIENCE */}
        {parsed.experience.length > 0 && (
          <View>
            <View style={styles.sectionHeaderWrapper}>
              <Text style={styles.sectionHeader}>EXPERIENCE</Text>
            </View>
            {parsed.experience.map((exp, i) => {
              const fullTitle = exp.company && !exp.title.includes(exp.company)
                ? `${exp.title} – ${exp.company}`
                : exp.title;

              return (
                <View key={i} style={{ marginBottom: 3 }} wrap={false}>
                  {/* Line 1: "Job Title – Company" LEFT + "Date Range" RIGHT */}
                  <View style={styles.twoColRow}>
                    <Text style={styles.leftBold}>{fullTitle}</Text>
                    {exp.dateRange ? <Text style={styles.rightDate}>{exp.dateRange}</Text> : null}
                  </View>

                  {/* Line 2: "Tech stack tags" left in gray italic */}
                  {exp.techTags ? (
                    <View style={{ marginBottom: 2 }}>
                      <Text style={styles.techTagsItalic}>{exp.techTags}</Text>
                    </View>
                  ) : null}

                  {/* Bullet points below */}
                  {exp.bullets.map((b, bi) => (
                    <View key={bi} style={styles.bulletRow}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text style={styles.bulletText}>{b}</Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        )}

        {/* SECTION 4: PROJECTS */}
        {parsed.projects.length > 0 && (
          <View>
            <View style={styles.sectionHeaderWrapper}>
              <Text style={styles.sectionHeader}>PROJECTS</Text>
            </View>
            {parsed.projects.map((proj, i) => {
              const projectTitle = proj.techStack
                ? `${proj.name} — ${proj.techStack}`
                : proj.name;

              return (
                <View key={i} style={{ marginBottom: 3 }} wrap={false}>
                  {/* Line 1: "Project Name — Tech Stack" LEFT + "Year" RIGHT */}
                  <View style={styles.twoColRow}>
                    <Text style={styles.leftBold}>{projectTitle}</Text>
                    {proj.year ? <Text style={styles.rightDateBold}>{proj.year}</Text> : null}
                  </View>

                  {/* Bullet points below */}
                  {proj.bullets.map((b, bi) => (
                    <View key={bi} style={styles.bulletRow}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text style={styles.bulletText}>{b}</Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        )}

        {/* SECTION 5: AWARDS & CERTIFICATIONS */}
        {parsed.certifications.length > 0 && (
          <View wrap={false}>
            <View style={styles.sectionHeaderWrapper}>
              <Text style={styles.sectionHeader}>AWARDS & CERTIFICATIONS</Text>
            </View>
            {parsed.certifications.map((cert, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>
                  {cert.boldPrefix ? (
                    <Text style={styles.boldInline}>{cert.boldPrefix}</Text>
                  ) : null}
                  <Text>{cert.rest}</Text>
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* SECTION 6: EDUCATION */}
        {parsed.education.length > 0 && (
          <View wrap={false}>
            <View style={styles.sectionHeaderWrapper}>
              <Text style={styles.sectionHeader}>EDUCATION</Text>
            </View>
            {parsed.education.map((edu, i) => (
              <View key={i} style={styles.eduEntry}>
                {/* Line 1: "Degree" LEFT + "Year" RIGHT */}
                <View style={styles.twoColRow}>
                  <Text style={styles.leftBold}>{edu.degree}</Text>
                  {edu.yearOrDates ? <Text style={styles.rightDate}>{edu.yearOrDates}</Text> : null}
                </View>

                {/* Line 2: "Institution" LEFT + "CGPA/GPA" RIGHT */}
                <View style={styles.twoColRow}>
                  <Text style={styles.leftItalic}>{edu.institution}</Text>
                  {edu.grade ? <Text style={styles.rightGradeItalic}>{edu.grade}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* SECTION 7: LANGUAGES */}
        {parsed.languages.length > 0 && (
          <View wrap={false}>
            <View style={styles.sectionHeaderWrapper}>
              <Text style={styles.sectionHeader}>LANGUAGES</Text>
            </View>
            {parsed.languages.map((lang, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{lang}</Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
};

export async function generatePDF(resumeText: string, watermarked = false): Promise<Buffer> {
  try {
    logger.info(`Generating PDF matching ATS resume template (watermarked=${watermarked})...`);
    const docElement = <ResumePDFDocument text={resumeText} watermarked={watermarked} />;
    const buffer = await renderToBuffer(docElement);
    logger.info("PDF generation completed successfully.");
    return buffer;
  } catch (error) {
    logger.error("Failed to generate PDF with @react-pdf/renderer:", error);
    throw error;
  }
}
