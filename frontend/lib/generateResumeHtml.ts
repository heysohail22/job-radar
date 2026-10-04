import type { ResumeDataType, SpacingConfig } from "./resumeData";

export function generateResumeHtml(
  resume: ResumeDataType,
  spacing?: Partial<SpacingConfig>
): string {
  const fontSize = spacing?.fontSize || 12;
  const lineHeight = spacing?.lineHeight || 1.45;
  const sectionGap = spacing?.sectionGap || 8;
  const projectGap = spacing?.projectGap || 6;
  const summarySkillsGap = spacing?.summarySkillsGap || 8;
  const skillsProjectsGap = spacing?.skillsProjectsGap || 8;
  const bulletGap = spacing?.bulletGap || 2;
  const paddingX = spacing?.paddingX || 36;
  const paddingY = spacing?.paddingY || 28;

  const sanitizeUrl = (u?: string) => {
    if (!u) return "";
    if (u.includes("datapilot.duckdns.org")) return "https://datapilot-ebon-sigma.vercel.app";
    if (u.includes("cortex-ai.duckdns.org")) return "https://cortex-azure-six.vercel.app";
    if (u.includes("vaanibook.duckdns.org")) return "https://vaani-book.vercel.app";
    return u;
  };

  const escapeHtml = (str: string) => {
    return (str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(resume.name)} - ATS Resume</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: ${fontSize}px;
      line-height: ${lineHeight};
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .sheet {
      box-sizing: border-box;
      width: 210mm;
      max-width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: ${paddingY}px ${paddingX}px;
      background: #ffffff;
      position: relative;
    }
    .header {
      text-align: center;
      margin-bottom: 6px;
    }
    .name {
      font-size: 1.5em;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: -0.02em;
      margin: 0 0 2px 0;
      line-height: 1.15;
    }
    .title {
      font-size: 1.05em;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #475569;
      text-transform: uppercase;
      margin: 0 0 6px 0;
    }
    .contact-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 4px 10px;
      font-size: 0.95em;
      color: #334155;
    }
    .dot {
      color: #cbd5e1;
      user-select: none;
    }
    a {
      color: #0f172a;
      text-decoration: none;
      transition: color 0.15s ease;
    }
    a:hover {
      color: #000000;
      text-decoration: none;
    }
    .contact-link {
      color: #0f172a;
      text-decoration: none;
    }
    .contact-link:hover {
      color: #000000;
      text-decoration: none;
    }
    .divider {
      height: 1px;
      background-color: #cbd5e1;
      margin: 8px 0;
    }
    .section-title {
      font-size: 1.05em;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #0f172a;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 2px;
      margin: 0 0 4px 0;
      display: inline-block;
    }
    section {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .summary-text {
      font-size: 1em;
      color: #334155;
      text-align: justify;
      line-height: 1.45;
      margin: 0;
    }
    .skills-list {
      display: flex;
      flex-col: column;
      flex-direction: column;
      gap: 3px;
    }
    .skill-item {
      display: flex;
      align-items: baseline;
      gap: 6px;
      font-size: 0.98em;
    }
    .bullet {
      color: #64748b;
      font-weight: bold;
      user-select: none;
      font-size: 0.9em;
    }
    .skill-category {
      font-weight: 700;
      color: #1e293b;
      white-space: nowrap;
    }
    .skill-names {
      color: #334155;
    }
    .projects-container {
      display: flex;
      flex-direction: column;
      gap: ${projectGap}px;
    }
    .project-card {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .project-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 2px;
    }
    .project-name-wrap {
      display: flex;
      align-items: baseline;
      gap: 6px;
      flex-wrap: wrap;
    }
    .project-name {
      font-size: 1.12em;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    .project-pipe {
      color: #94a3b8;
      font-weight: 500;
    }
    .project-subtitle {
      font-size: 1.02em;
      color: #475569;
      font-weight: 500;
    }
    .project-links {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.88em;
      white-space: nowrap;
    }
    .project-link-item {
      font-weight: 700;
      color: #0f172a;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 2px;
    }
    .project-link-item:hover {
      color: #000000;
      text-decoration: none;
    }
    .bullet-list {
      list-style: none;
      margin: 0 0 0 2px;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: ${bulletGap}px;
    }
    .bullet-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 1em;
      color: #334155;
    }
    .bullet-icon {
      color: #475569;
      font-weight: bold;
      user-select: none;
      font-size: 11px;
      margin-top: 1px;
    }
    .bullet-content {
      flex: 1;
    }
    .edu-card {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
    }
    .edu-degree {
      font-size: 1.12em;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 2px 0;
    }
    .edu-inst {
      font-size: 1.02em;
      color: #334155;
      font-weight: 500;
      margin: 0;
    }
    .edu-cgpa {
      font-size: 0.95em;
      color: #475569;
      margin: 2px 0 0 0;
    }
    .edu-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
      text-align: right;
    }
    .edu-duration {
      font-size: 1.02em;
      font-weight: 600;
      color: #1e293b;
    }
    .edu-location {
      font-size: 0.95em;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="sheet">
    <!-- Header -->
    <div class="header">
      <h1 class="name">${escapeHtml(resume.name)}</h1>
      <div class="title">${escapeHtml(resume.title)}</div>
      <div class="contact-row">
        ${resume.contact.location ? `<span>${escapeHtml(resume.contact.location)}</span>` : ""}
        ${
          resume.contact.phone
            ? `<span class="dot">•</span><a href="tel:${resume.contact.phone.replace(/\s+/g, "")}" class="contact-link">${escapeHtml(resume.contact.phone)}</a>`
            : ""
        }
        ${
          resume.contact.email
            ? `<span class="dot">•</span><a href="mailto:${resume.contact.email}" class="contact-link">${escapeHtml(resume.contact.email)}</a>`
            : ""
        }
        ${
          resume.contact.linkedin
            ? `<span class="dot">•</span><a href="${resume.contact.linkedin}" target="_blank" rel="noopener noreferrer">LinkedIn</a>`
            : ""
        }
        ${
          resume.contact.github
            ? `<span class="dot">•</span><a href="${resume.contact.github}" target="_blank" rel="noopener noreferrer">GitHub</a>`
            : ""
        }
      </div>
    </div>

    <div class="divider"></div>

    <!-- Professional Summary -->
    <section style="margin-bottom: ${summarySkillsGap}px;">
      <div class="section-title">Professional Summary</div>
      <p class="summary-text">${escapeHtml(resume.summary)}</p>
    </section>

    <!-- Technical Skills -->
    <section style="margin-bottom: ${skillsProjectsGap}px;">
      <div class="section-title">Technical Skills</div>
      <div class="skills-list">
        ${resume.skills
          .map(
            (group) => `
          <div class="skill-item">
            <span class="bullet">•</span>
            <span class="skill-category">${escapeHtml(group.category)}</span>
            <span style="font-weight: 700; color: #1e293b;">:</span>
            <span class="skill-names">${group.items.map(escapeHtml).join(", ")}</span>
          </div>`
          )
          .join("")}
      </div>
    </section>

    <!-- Technical Experience & Projects -->
    <section style="margin-bottom: ${sectionGap}px;">
      <div class="section-title">Technical Experience &amp; Projects</div>
      <div class="projects-container">
        ${resume.projects
          .map((project) => {
            const demoUrl = sanitizeUrl(project.demoUrl);
            const videoUrl = sanitizeUrl(project.videoUrl);
            const docUrl = sanitizeUrl(project.docUrl);

            const links = [
              demoUrl ? { label: "Live Demo", url: demoUrl } : null,
              videoUrl ? { label: "Project Walkthrough", url: videoUrl } : null,
              docUrl ? { label: "Documentation", url: docUrl } : null,
            ].filter(Boolean) as { label: string; url: string }[];

            return `
          <div class="project-card">
            <div class="project-header">
              <div class="project-name-wrap">
                <span class="project-name">${escapeHtml(project.name)}</span>
                <span class="project-pipe">|</span>
                <span class="project-subtitle">${escapeHtml(project.subtitle)}</span>
              </div>
              ${
                links.length > 0
                  ? `<div class="project-links">
                  ${links
                    .map(
                      (link, lIdx) =>
                        `${lIdx > 0 ? '<span class="dot">|</span>' : ""}<a href="${link.url}" target="_blank" rel="noopener noreferrer" class="project-link-item"><span>${escapeHtml(link.label)}</span><span style="font-size:0.85em; font-weight:normal;">↗</span></a>`
                    )
                    .join("")}
                </div>`
                  : ""
              }
            </div>
            <ul class="bullet-list">
              ${project.bullets
                .map(
                  (bullet) => `
                <li class="bullet-item">
                  <span class="bullet-icon">•</span>
                  <span class="bullet-content">${escapeHtml(bullet)}</span>
                </li>`
                )
                .join("")}
            </ul>
          </div>`;
          })
          .join("")}
      </div>
    </section>

    <!-- Education -->
    <section style="margin-bottom: 0;">
      <div class="section-title">Education</div>
      <div class="edu-card">
        <div>
          <div class="edu-degree">${escapeHtml(resume.education.degree)}</div>
          <div class="edu-inst">${escapeHtml(resume.education.institution)}</div>
          <div class="edu-cgpa">${escapeHtml(resume.education.cgpa)}</div>
        </div>
        <div class="edu-right">
          <div class="edu-duration">${escapeHtml(resume.education.duration)}</div>
          <div class="edu-location">${escapeHtml(resume.education.location)}</div>
        </div>
      </div>
    </section>
  </div>
</body>
</html>`;
}
