import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  TabStopType,
  Tab,
  ExternalHyperlink,
} from "docx";
import { logger } from "../logger";
import { parseResume, stripMarkdownAsterisks } from "../parser/resume-parser";
import type { ResumeData } from "@/types/resume";

const FONT = "Times New Roman";
const BODY_SIZE = 22; // 11pt throughout
const RIGHT_TAB_POSITION = 9000; // 9000 twips as specified

function run(text: string, opts: Record<string, any> = {}): TextRun {
  return new TextRun({
    text: stripMarkdownAsterisks(text || ""),
    font: FONT,
    size: BODY_SIZE,
    ...opts,
  });
}

function twoCol(
  left: string,
  right: string,
  leftOpts: Record<string, any> = {},
  rightOpts: Record<string, any> = {},
  after = 30
): Paragraph {
  const children: (TextRun | Tab)[] = [run(left, leftOpts)];
  if (right) {
    children.push(new TextRun({ children: [new Tab()] }));
    children.push(run(right, rightOpts));
  }

  return new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB_POSITION }],
    children,
    spacing: { after },
  });
}

function bullet(text: string, boldPrefix = "", rest = ""): Paragraph {
  const children: TextRun[] = [];
  if (boldPrefix) {
    children.push(run(boldPrefix, { bold: true }));
  }
  if (rest) {
    children.push(run(rest));
  }
  if (!boldPrefix && !rest) {
    children.push(run(text.replace(/^[•\-*\u2022]\s*/, "")));
  }

  return new Paragraph({
    bullet: { level: 0 },
    children,
    spacing: { after: 30 },
  });
}

export async function generateDOCX(
  resumeInput: string | ResumeData,
  watermarked = false,
  originalText?: string,
): Promise<Buffer> {
  try {
    logger.info(`Generating DOCX matching ATS resume template (watermarked=${watermarked})...`);
    const parsed = parseResume(resumeInput, originalText);
    const children: Paragraph[] = [];

    // Optional Watermark (Free tier)
    if (watermarked) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            run("ROLEFUSE AI", {
              bold: true,
              color: "555555",
              size: 17, // 8.5pt
            }),
          ],
          spacing: { after: 60 },
        })
      );
    }

    // 1. Name — 19pt bold centered
    if (parsed.name) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: stripMarkdownAsterisks(parsed.name),
              font: FONT,
              size: 38, // 19pt
              bold: true,
            }),
          ],
          spacing: { after: 30 },
        })
      );
    }

    // Role — 10.5pt italic centered
    if (parsed.role) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: stripMarkdownAsterisks(parsed.role),
              font: FONT,
              size: 21, // 10.5pt
              italics: true,
            }),
          ],
          spacing: { after: 30 },
        })
      );
    }

    // 2. Contact row — centered, separated by bullets, no bottom line
    const uniqueContacts = parsed.contacts.filter((c, idx, arr) => arr.findIndex(x => x.type === c.type) === idx);
    if (uniqueContacts.length > 0) {
      const contactRuns: (TextRun | ExternalHyperlink)[] = [];
      uniqueContacts.forEach((c, idx) => {
        let displayPhone = c.text;
        if (c.type === "phone") {
          const cleaned = c.text.trim();
          if (/^(\+)?91\s*\d{10}$/.test(cleaned)) {
            displayPhone = cleaned.replace(/^(\+)?91\s*/, "+91 ");
          } else if (/^91\s*\d+/.test(cleaned)) {
            displayPhone = `+${cleaned}`;
          }
        }
        const linkUrl = c.url || (c.type === "email" ? `mailto:${c.text}` : (c.type === "phone" ? `tel:${displayPhone.replace(/[^+\d]/g, "")}` : null));
        if (linkUrl) {
          contactRuns.push(
            new ExternalHyperlink({
              children: [
                new TextRun({
                  text: displayPhone,
                  font: FONT,
                  size: 19, // 9.5pt
                  color: "000000",
                }),
              ],
              link: linkUrl,
            })
          );
        } else {
          contactRuns.push(
            new TextRun({
              text: displayPhone,
              font: FONT,
              size: 19, // 9.5pt
              color: "000000",
            })
          );
        }
        if (idx < uniqueContacts.length - 1) {
          contactRuns.push(
            new TextRun({
              text: "   •   ",
              font: FONT,
              size: 19,
              color: "666666",
            })
          );
        }
      });

      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: contactRuns,
          spacing: { after: 60 },
        })
      );
    }

    // Helper for Section Headers: 10.5pt bold allCaps with bottom border single 6pt black
    const addSectionHeader = (title: string) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: title.toUpperCase(),
              font: FONT,
              size: 21, // 10.5pt
              bold: true,
              allCaps: true,
            }),
          ],
          border: {
            bottom: {
              color: "000000",
              space: 2,
              style: BorderStyle.SINGLE,
              size: 6,
            },
          },
          spacing: { before: 120, after: 30 }, // tightened spacing
        })
      );
    };

    // 4. Sections in strict order:
    // SUMMARY → SKILLS → EXPERIENCE → PROJECTS → AWARDS & CERTIFICATIONS → EDUCATION → LANGUAGES

    // SECTION 1: SUMMARY
    if (parsed.summary) {
      addSectionHeader("SUMMARY");
      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [run(parsed.summary)],
          spacing: { after: 60 },
        })
      );
    }

    // SECTION 2: SKILLS
    if (parsed.skills.length > 0) {
      addSectionHeader("SKILLS");
      for (const s of parsed.skills) {
        children.push(
          new Paragraph({
            children: [
              run(`${s.label}: `, { bold: true }),
              run(s.skills),
            ],
            spacing: { after: 40 },
          })
        );
      }
    }

    // SECTION 3: EXPERIENCE
    if (parsed.experience.length > 0) {
      addSectionHeader("EXPERIENCE");
      for (const exp of parsed.experience) {
        const cleanExpTitle = exp.title.replace(/[\s|–—\-,:]+$/, "").replace(/^[\s|–—\-,:]+/, "").trim();
        const cleanExpComp = exp.company.replace(/[\s|–—\-,:]+$/, "").replace(/^[\s|–—\-,:]+/, "").trim();
        const fullTitle = cleanExpComp && !cleanExpTitle.includes(cleanExpComp)
          ? `${cleanExpTitle} – ${cleanExpComp}`
          : cleanExpTitle;
        const cleanTech = (exp.techTags || "").replace(/[\s|–—\-,:]+$/, "").replace(/^[\s|–—\-,:]+/, "").trim();

        // Line 1: "Job Title – Company" LEFT + "Date Range" RIGHT
        children.push(
          twoCol(fullTitle, exp.dateRange, { bold: true }, { color: "000000" }, 20)
        );

        // Line 2: "Tech stack tags" left in gray italic
        if (cleanTech) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: cleanTech,
                  font: FONT,
                  size: 20, // 10pt
                  italics: true,
                  color: "666666",
                }),
              ],
              spacing: { after: 30 },
            })
          );
        }

        // Bullets below
        for (const b of exp.bullets) {
          children.push(bullet(b));
        }
      }
    }

    // SECTION 4: PROJECTS
    if (parsed.projects.length > 0) {
      addSectionHeader("PROJECTS");
      for (const proj of parsed.projects) {
        const cleanProjName = proj.name.replace(/[\s|–—\-,:]+$/, "").replace(/^[\s|–—\-,:]+/, "").trim();
        const cleanProjTech = proj.techStack.replace(/[\s|–—\-,:]+$/, "").replace(/^[\s|–—\-,:]+/, "").trim();
        const projectTitle = cleanProjTech
          ? `${cleanProjName} — ${cleanProjTech}`
          : cleanProjName;

        // Line 1: "Project Name — Tech Stack" LEFT + "Year" RIGHT
        children.push(
          twoCol(projectTitle, proj.year, { bold: true }, { bold: true }, 20)
        );

        // Bullets below
        for (const b of proj.bullets) {
          children.push(bullet(b));
        }
      }
    }

    // SECTION 5: AWARDS & CERTIFICATIONS
    const validCerts = parsed.certifications.filter(c => !/^&?\s*(?:ACHIEVEMENTS?|CERTIFICATIONS?|AWARDS?)\s*$/i.test(c.raw.trim()));
    if (validCerts.length > 0) {
      addSectionHeader("AWARDS & CERTIFICATIONS");
      for (const cert of validCerts) {
        children.push(bullet(cert.raw, cert.boldPrefix, cert.rest));
      }
    }

    // SECTION 6: EDUCATION
    if (parsed.education.length > 0) {
      addSectionHeader("EDUCATION");
      for (const edu of parsed.education) {
        let cleanDegree = edu.degree.replace(/[\s|–—\-,:]+$/, "").replace(/^[\s|–—\-,:]+/, "").trim();
        let cleanInst = edu.institution.replace(/[\s|–—\-,:]+$/, "").replace(/^[\s|–—\-,:]+/, "").trim();

        // Strip dates from cleanDegree if attached (prevents duplicate dates)
        const dateInDegree = cleanDegree.match(/\s*\|\s*(\b(?:19|20)\d{2}\b(?:\s*[-–—\s]+\s*(?:(?:19|20)\d{2}|Present|Current))?)\s*$/i);
        if (dateInDegree) {
          cleanDegree = cleanDegree.replace(dateInDegree[0], "").trim();
        }

        // Strip CGPA/score from cleanInst if attached (prevents duplicate CGPA)
        const scoreInInst = cleanInst.match(/\s*\|\s*((?:CGPA|GPA|Percentage|Score)?\s*:?\s*[\d.]+(?:\s*\/\s*[\d.]+)?%?)\s*$/i);
        if (scoreInInst) {
          cleanInst = cleanInst.replace(scoreInInst[0], "").trim();
        }

        cleanDegree = cleanDegree.replace(/[\s|–—\-,:]+$/, "").trim();
        cleanInst = cleanInst.replace(/[\s|–—\-,:]+$/, "").trim();

        // Line 1: "Degree" LEFT + "Year" RIGHT
        children.push(
          twoCol(cleanDegree, edu.yearOrDates, { bold: true }, { color: "000000" }, 15)
        );

        // Line 2: "Institution" LEFT + "CGPA/GPA" RIGHT, separated by space
        children.push(
          twoCol(cleanInst, edu.grade, { italics: true }, { color: "000000" }, 50)
        );
      }
    }

    // SECTION 7: LANGUAGES
    if (parsed.languages.length > 0) {
      addSectionHeader("LANGUAGES");
      for (const lang of parsed.languages) {
        children.push(bullet(lang));
      }
    }

    // Document creation with 576 twips (0.4 inch) margins all sides
    const doc = new Document({
      styles: {
        default: {
          document: {
            run: { font: FONT, size: BODY_SIZE },
          },
        },
      },
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 576,
                bottom: 576,
                left: 576,
                right: 576,
              },
            },
          },
          children,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    logger.info("DOCX generation completed successfully.");
    return buffer;
  } catch (error) {
    logger.error("Failed to generate DOCX:", error);
    throw error;
  }
}
