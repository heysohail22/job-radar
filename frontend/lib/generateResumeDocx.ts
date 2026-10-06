import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ExternalHyperlink,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  WidthType,
  AlignmentType,
  convertInchesToTwip,
  UnderlineType,
} from "docx";
import type { ResumeDataType, SpacingConfig } from "./resumeData";

const NO_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0, color: "auto" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
  left: { style: BorderStyle.NONE, size: 0, color: "auto" },
  right: { style: BorderStyle.NONE, size: 0, color: "auto" },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
};

function sanitizeUrl(u?: string): string {
  if (!u) return "";
  if (u.includes("datapilot.duckdns.org")) return "https://datapilot-ebon-sigma.vercel.app";
  if (u.includes("cortex-ai.duckdns.org")) return "https://cortex-azure-six.vercel.app";
  if (u.includes("vaanibook.duckdns.org")) return "https://vaani-book.vercel.app";
  return u;
}

export function buildResumeDocx(
  resume: ResumeDataType,
  spacing?: Partial<SpacingConfig>
): Document {
  const font = "Calibri";
  const primaryColor = "0F172A"; // Slate 900
  const secondaryColor = "334155"; // Slate 700
  const mutedColor = "64748B"; // Slate 500
  const linkColor = "1D4ED8"; // Blue 700

  // Calculate spacings in twips (20 twips = 1pt)
  const baseFontSizePt = spacing?.fontSize || 10.5;
  const baseSizeHalfPt = Math.round(baseFontSizePt * 2);
  const nameSizeHalfPt = Math.round(baseFontSizePt * 2.3);
  const titleSizeHalfPt = Math.round(baseFontSizePt * 1.8);
  const sectionHeadingSizeHalfPt = Math.round(baseFontSizePt * 1.9);

  const sectionGapTwips = Math.round((spacing?.sectionGap ?? 8) * 15);
  const projectGapTwips = Math.round((spacing?.projectGap ?? 6) * 15);
  const bulletGapTwips = Math.round((spacing?.bulletGap ?? 2) * 10);

  // Section Heading Builder
  const createSectionHeading = (title: string, topGapTwips: number = sectionGapTwips) => {
    return new Paragraph({
      border: {
        bottom: {
          style: BorderStyle.SINGLE,
          size: 8,
          color: primaryColor,
          space: 4,
        },
      },
      spacing: {
        before: topGapTwips,
        after: 80, // ~4pt
      },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          font,
          bold: true,
          size: sectionHeadingSizeHalfPt,
          color: primaryColor,
        }),
      ],
    });
  };

  // Header Elements
  const headerParagraphs: Paragraph[] = [
    // Candidate Name
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 40 },
      children: [
        new TextRun({
          text: resume.name.toUpperCase(),
          font,
          bold: true,
          size: nameSizeHalfPt,
          color: primaryColor,
        }),
      ],
    }),
    // Professional Title
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 80 },
      children: [
        new TextRun({
          text: resume.title.toUpperCase(),
          font,
          bold: true,
          size: titleSizeHalfPt,
          color: secondaryColor,
        }),
      ],
    }),
  ];

  // Contact Info Row
  const contactChildren: (TextRun | ExternalHyperlink)[] = [];

  const addContactItem = (text: string, link?: string) => {
    if (contactChildren.length > 0) {
      contactChildren.push(
        new TextRun({
          text: "  •  ",
          font,
          color: mutedColor,
          size: baseSizeHalfPt - 1,
        })
      );
    }
    if (link) {
      contactChildren.push(
        new ExternalHyperlink({
          link,
          children: [
            new TextRun({
              text,
              font,
              bold: true,
              size: baseSizeHalfPt - 1,
              color: primaryColor,
              underline: { type: UnderlineType.SINGLE },
            }),
          ],
        })
      );
    } else {
      contactChildren.push(
        new TextRun({
          text,
          font,
          size: baseSizeHalfPt - 1,
          color: secondaryColor,
        })
      );
    }
  };

  if (resume.contact.location) addContactItem(resume.contact.location);
  if (resume.contact.phone) {
    addContactItem(resume.contact.phone, `tel:${resume.contact.phone.replace(/\s+/g, "")}`);
  }
  if (resume.contact.email) {
    addContactItem(resume.contact.email, `mailto:${resume.contact.email}`);
  }
  if (resume.contact.linkedin) {
    addContactItem("LinkedIn", resume.contact.linkedin);
  }
  if (resume.contact.github) {
    addContactItem("GitHub", resume.contact.github);
  }

  headerParagraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 120 },
      border: {
        bottom: {
          style: BorderStyle.SINGLE,
          size: 4,
          color: "CBD5E1",
          space: 6,
        },
      },
      children: contactChildren,
    })
  );

  // Body Sections
  const bodyElements: (Paragraph | Table)[] = [];

  // 1. Professional Summary
  if (resume.summary) {
    bodyElements.push(createSectionHeading("Professional Summary", 120));
    bodyElements.push(
      new Paragraph({
        alignment: AlignmentType.BOTH,
        spacing: { before: 40, after: sectionGapTwips },
        children: [
          new TextRun({
            text: resume.summary,
            font,
            size: baseSizeHalfPt,
            color: secondaryColor,
          }),
        ],
      })
    );
  }

  // 2. Technical Skills
  if (resume.skills && resume.skills.length > 0) {
    bodyElements.push(createSectionHeading("Technical Skills"));
    resume.skills.forEach((skillGroup, idx) => {
      bodyElements.push(
        new Paragraph({
          spacing: {
            before: 20,
            after: idx === resume.skills.length - 1 ? sectionGapTwips : 30,
          },
          children: [
            new TextRun({
              text: "•  ",
              font,
              bold: true,
              size: baseSizeHalfPt,
              color: mutedColor,
            }),
            new TextRun({
              text: `${skillGroup.category}: `,
              font,
              bold: true,
              size: baseSizeHalfPt,
              color: primaryColor,
            }),
            new TextRun({
              text: skillGroup.items.join(", "),
              font,
              size: baseSizeHalfPt,
              color: secondaryColor,
            }),
          ],
        })
      );
    });
  }

  // 3. Technical Experience & Projects
  if (resume.projects && resume.projects.length > 0) {
    bodyElements.push(createSectionHeading("Technical Experience & Projects"));

    resume.projects.forEach((proj, pIdx) => {
      // Collect links
      const demoUrl = sanitizeUrl(proj.demoUrl);
      const videoUrl = sanitizeUrl(proj.videoUrl);
      const docUrl = sanitizeUrl(proj.docUrl);

      const linkRuns: (TextRun | ExternalHyperlink)[] = [];
      const addProjLink = (label: string, url: string) => {
        if (linkRuns.length > 0) {
          linkRuns.push(
            new TextRun({
              text: " | ",
              font,
              color: mutedColor,
              size: baseSizeHalfPt - 2,
            })
          );
        }
        linkRuns.push(
          new ExternalHyperlink({
            link: url,
            children: [
              new TextRun({
                text: label,
                font,
                bold: true,
                size: baseSizeHalfPt - 2,
                color: linkColor,
                underline: { type: UnderlineType.SINGLE },
              }),
            ],
          })
        );
      };

      if (demoUrl) addProjLink("Live Demo", demoUrl);
      if (videoUrl) addProjLink("Project Walkthrough", videoUrl);
      if (docUrl) addProjLink("Documentation", docUrl);

      // Top row of project (Title & Subtitle on left, links on right)
      const projectHeaderTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: NO_BORDERS,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: NO_BORDERS,
                width: { size: 70, type: WidthType.PERCENTAGE },
                margins: { top: 0, bottom: 0, left: 0, right: 0 },
                children: [
                  new Paragraph({
                    spacing: { before: pIdx > 0 ? projectGapTwips : 40, after: 30 },
                    children: [
                      new TextRun({
                        text: proj.name,
                        font,
                        bold: true,
                        size: baseSizeHalfPt + 1,
                        color: primaryColor,
                      }),
                      new TextRun({
                        text: " | ",
                        font,
                        color: mutedColor,
                        size: baseSizeHalfPt,
                      }),
                      new TextRun({
                        text: proj.subtitle,
                        font,
                        italics: true,
                        size: baseSizeHalfPt,
                        color: secondaryColor,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                borders: NO_BORDERS,
                width: { size: 30, type: WidthType.PERCENTAGE },
                margins: { top: 0, bottom: 0, left: 0, right: 0 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    spacing: { before: pIdx > 0 ? projectGapTwips : 40, after: 30 },
                    children: linkRuns,
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      bodyElements.push(projectHeaderTable);

      // Bullets
      proj.bullets.forEach((bullet, bIdx) => {
        bodyElements.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: {
              before: bulletGapTwips,
              after:
                bIdx === proj.bullets.length - 1 && pIdx === resume.projects.length - 1
                  ? sectionGapTwips
                  : bulletGapTwips + 10,
            },
            children: [
              new TextRun({
                text: bullet,
                font,
                size: baseSizeHalfPt,
                color: secondaryColor,
              }),
            ],
          })
        );
      });
    });
  }

  // 4. Education
  if (resume.education) {
    bodyElements.push(createSectionHeading("Education"));

    const eduTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: NO_BORDERS,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: NO_BORDERS,
              width: { size: 70, type: WidthType.PERCENTAGE },
              margins: { top: 0, bottom: 0, left: 0, right: 0 },
              children: [
                new Paragraph({
                  spacing: { before: 40, after: 20 },
                  children: [
                    new TextRun({
                      text: resume.education.degree,
                      font,
                      bold: true,
                      size: baseSizeHalfPt + 1,
                      color: primaryColor,
                    }),
                  ],
                }),
                new Paragraph({
                  spacing: { before: 0, after: 20 },
                  children: [
                    new TextRun({
                      text: resume.education.institution,
                      font,
                      size: baseSizeHalfPt,
                      color: secondaryColor,
                    }),
                  ],
                }),
                new Paragraph({
                  spacing: { before: 0, after: 40 },
                  children: [
                    new TextRun({
                      text: resume.education.cgpa,
                      font,
                      size: baseSizeHalfPt - 1,
                      color: mutedColor,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              borders: NO_BORDERS,
              width: { size: 30, type: WidthType.PERCENTAGE },
              margins: { top: 0, bottom: 0, left: 0, right: 0 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  spacing: { before: 40, after: 20 },
                  children: [
                    new TextRun({
                      text: resume.education.duration,
                      font,
                      bold: true,
                      size: baseSizeHalfPt,
                      color: primaryColor,
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  spacing: { before: 0, after: 20 },
                  children: [
                    new TextRun({
                      text: resume.education.location,
                      font,
                      size: baseSizeHalfPt - 1,
                      color: mutedColor,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });

    bodyElements.push(eduTable);
  }

  // Create document with 0.5 inch margins (standard ATS 1-page friendly layout)
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.5),
              bottom: convertInchesToTwip(0.5),
              left: convertInchesToTwip(0.5),
              right: convertInchesToTwip(0.5),
            },
          },
        },
        children: [...headerParagraphs, ...bodyElements],
      },
    ],
  });

  return doc;
}

export async function generateResumeDocxBlob(
  resume: ResumeDataType,
  spacing?: Partial<SpacingConfig>
): Promise<Blob> {
  const doc = buildResumeDocx(resume, spacing);
  return await Packer.toBlob(doc);
}

export async function generateResumeDocxBuffer(
  resume: ResumeDataType,
  spacing?: Partial<SpacingConfig>
): Promise<Buffer> {
  const doc = buildResumeDocx(resume, spacing);
  return await Packer.toBuffer(doc);
}
