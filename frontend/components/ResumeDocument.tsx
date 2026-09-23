import React from "react";
import type { ResumeDataType } from "../lib/resumeData";

export interface SpacingConfig {
  fontSize: number;
  lineHeight: number;
  sectionGap: number;
  projectGap: number;
  paddingX: number;
  paddingY: number;
}

interface ResumeDocumentProps {
  resume: ResumeDataType;
  spacing?: SpacingConfig;
  onEditableBlur?: (fieldPath: string, newValue: string) => void;
  resumeRef?: React.RefObject<HTMLDivElement | null>;
  isEditable?: boolean;
}

export const ResumeDocument: React.FC<ResumeDocumentProps> = ({
  resume,
  spacing = {
    fontSize: 12,
    lineHeight: 1.45,
    sectionGap: 8,
    projectGap: 6,
    paddingX: 36,
    paddingY: 28,
  },
  onEditableBlur = () => {},
  resumeRef,
  isEditable = true,
}) => {
  const { fontSize, lineHeight, sectionGap, projectGap, paddingX, paddingY } = spacing;

  const editableClass = isEditable
    ? "focus:outline-hidden focus:ring-1 focus:ring-indigo-400 focus:bg-indigo-50/40 rounded px-0.5 transition-colors cursor-text"
    : "";

  return (
    <div
      id="resume-page"
      ref={resumeRef}
      style={
        {
          padding: `${paddingY}px ${paddingX}px`,
          fontSize: `${fontSize}px`,
          lineHeight: lineHeight,
          "--resume-font-size": `${fontSize}px`,
          "--resume-line-height": lineHeight,
          "--resume-padding": `${paddingY}px ${paddingX}px`,
          "--resume-section-gap": `${sectionGap}px`,
        } as React.CSSProperties
      }
      className="w-full max-w-[794px] bg-white text-slate-900 shadow-2xl rounded-2xl border border-slate-200 relative overflow-hidden transition-all duration-150 ease-out print:overflow-visible print:m-0 print:shadow-none print:border-none print:w-full print:rounded-none max-md:p-4 text-left font-sans"
    >
      {/* Edit Hint Banner (Non-printable) */}
      {isEditable && (
        <div className="mb-3 px-3 py-1.5 bg-indigo-50/80 border border-indigo-200 text-indigo-900 text-[11px] font-semibold rounded-xl flex items-center justify-between print:hidden select-none">
          <span className="flex items-center gap-1.5">
            <span>✏️</span>
            <span>
              <strong>Click-to-Edit Live:</strong> Click directly on any text below to edit your resume instantly!
            </span>
          </span>
          <span className="text-[10px] bg-indigo-200/60 px-2 py-0.5 rounded-md font-bold text-indigo-950">
            Live Sync
          </span>
        </div>
      )}

      {/* Header - Centered Layout */}
      <header className="flex flex-col items-center text-center mb-2 print:mb-1.5">
        <h1
          contentEditable={isEditable}
          suppressContentEditableWarning
          onBlur={(e) => onEditableBlur("name", e.currentTarget.innerText)}
          className={`text-[1.5em] font-black text-slate-900 leading-tight tracking-tight uppercase print:font-extrabold mb-0.5 ${editableClass}`}
        >
          {resume.name}
        </h1>
        <p
          contentEditable={isEditable}
          suppressContentEditableWarning
          onBlur={(e) => onEditableBlur("title", e.currentTarget.innerText)}
          className={`text-[1.05em] font-bold tracking-widest text-slate-600 uppercase mb-1.5 ${editableClass}`}
        >
          {resume.title}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[0.95em] text-slate-700">
          {resume.contact.location && (
            <span
              contentEditable={isEditable}
              suppressContentEditableWarning
              onBlur={(e) => onEditableBlur("contact.location", e.currentTarget.innerText)}
              className={editableClass}
            >
              {resume.contact.location}
            </span>
          )}
          {resume.contact.phone && (
            <>
              <span className="text-slate-300 select-none">•</span>
              <a
                href={`tel:${resume.contact.phone.replace(/\s+/g, "")}`}
                className="text-slate-700 hover:text-slate-900 transition-colors"
              >
                <span
                  contentEditable={isEditable}
                  suppressContentEditableWarning
                  onBlur={(e) => onEditableBlur("contact.phone", e.currentTarget.innerText)}
                  className={editableClass}
                >
                  {resume.contact.phone}
                </span>
              </a>
            </>
          )}
          {resume.contact.email && (
            <>
              <span className="text-slate-300 select-none">•</span>
              <a
                href={`mailto:${resume.contact.email}`}
                className="text-slate-700 hover:text-slate-900 transition-colors"
              >
                <span
                  contentEditable={isEditable}
                  suppressContentEditableWarning
                  onBlur={(e) => onEditableBlur("contact.email", e.currentTarget.innerText)}
                  className={editableClass}
                >
                  {resume.contact.email}
                </span>
              </a>
            </>
          )}
          {resume.contact.linkedin && (
            <>
              <span className="text-slate-300 select-none">•</span>
              <a
                href={resume.contact.linkedin}
                className="text-slate-700 hover:text-slate-900 transition-colors underline decoration-slate-300"
                target="_blank"
                rel="noreferrer"
              >
                LinkedIn
              </a>
            </>
          )}
          {resume.contact.github && (
            <>
              <span className="text-slate-300 select-none">•</span>
              <a
                href={resume.contact.github}
                className="text-slate-700 hover:text-slate-900 transition-colors underline decoration-slate-300"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
            </>
          )}
        </div>
      </header>

      {/* Divider */}
      <div className="h-px bg-slate-300 my-2 print:my-1.5" />

      {/* Professional Summary Section */}
      <section style={{ marginBottom: `${sectionGap}px` }} className="break-inside-avoid">
        <h2 className="text-[1.05em] font-bold tracking-[0.1em] uppercase text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-1 inline-block">
          Professional Summary
        </h2>
        <p className="text-[1em] text-slate-700 text-justify leading-relaxed">
          <span
            contentEditable={isEditable}
            suppressContentEditableWarning
            onBlur={(e) => onEditableBlur("summary", e.currentTarget.innerText)}
            className={editableClass}
          >
            {resume.summary}
          </span>
        </p>
      </section>

      {/* Technical Skills Section */}
      <section style={{ marginBottom: `${sectionGap}px` }} className="break-inside-avoid">
        <h2 className="text-[1.05em] font-bold tracking-[0.1em] uppercase text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-1 inline-block">
          Technical Skills
        </h2>
        <div className="flex flex-col gap-1">
          {resume.skills.map((skillGroup, sIdx) => (
            <div key={sIdx} className="flex items-start gap-1.5 text-[0.98em]">
              <span className="text-slate-500 font-bold select-none text-[0.9em] mt-[2px]">•</span>
              <span
                contentEditable={isEditable}
                suppressContentEditableWarning
                onBlur={(e) => onEditableBlur(`skillCat.${sIdx}`, e.currentTarget.innerText)}
                className={`font-bold text-slate-800 shrink-0 ${editableClass}`}
              >
                {skillGroup.category}
              </span>
              <span className="font-bold text-slate-800">:</span>
              <span
                contentEditable={isEditable}
                suppressContentEditableWarning
                onBlur={(e) => onEditableBlur(`skillItems.${sIdx}`, e.currentTarget.innerText)}
                className={`text-slate-700 flex-1 ${editableClass}`}
              >
                {skillGroup.items.join(", ")}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Projects & Technical Experience */}
      <section style={{ marginBottom: `${sectionGap}px` }}>
        <h2 className="text-[1.05em] font-bold tracking-[0.1em] uppercase text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-1.5 inline-block">
          Technical Experience & Projects
        </h2>
        <div className="flex flex-col" style={{ gap: `${projectGap}px` }}>
          {resume.projects.map((project, idx) => (
            <div key={idx} className="break-inside-avoid print:break-inside-avoid">
              <div className="flex items-baseline justify-between gap-2 mb-0.5 flex-wrap">
                <div className="flex-1 min-w-0 flex items-baseline gap-1.5 flex-wrap">
                  <h3
                    contentEditable={isEditable}
                    suppressContentEditableWarning
                    onBlur={(e) => onEditableBlur(`projName.${idx}`, e.currentTarget.innerText)}
                    className={`text-[1.12em] font-bold text-slate-900 shrink-0 ${editableClass}`}
                  >
                    {project.name}
                  </h3>
                  <span className="text-[1.02em] text-slate-400 font-medium shrink-0">|</span>
                  <span
                    contentEditable={isEditable}
                    suppressContentEditableWarning
                    onBlur={(e) => onEditableBlur(`projSubtitle.${idx}`, e.currentTarget.innerText)}
                    className={`text-[1.02em] text-slate-600 font-medium ${editableClass}`}
                  >
                    {project.subtitle}
                  </span>
                </div>
                {(() => {
                  const links = [
                    project.demoUrl ? { label: "Live Demo", url: project.demoUrl } : null,
                    project.videoUrl ? { label: "Video Explanation", url: project.videoUrl } : null,
                    project.docUrl ? { label: "Documentation", url: project.docUrl } : null,
                  ].filter(Boolean) as { label: string; url: string }[];

                  if (links.length === 0) return null;

                  return (
                    <div className="flex items-center gap-1.5 text-[0.88em] shrink-0 ml-2 whitespace-nowrap">
                      {links.map((link, lIdx) => (
                        <React.Fragment key={link.label}>
                          {lIdx > 0 && <span className="text-slate-300 font-normal select-none">|</span>}
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 hover:text-indigo-900 font-semibold no-underline transition-colors"
                          >
                            {link.label}
                          </a>
                        </React.Fragment>
                      ))}
                    </div>
                  );
                })()}
              </div>
              <ul className="flex flex-col gap-0.5 list-none ml-0.5">
                {project.bullets.map((bullet, bIdx) => (
                  <li key={bIdx} className="flex items-start gap-2 text-[1em] text-slate-700">
                    <span className="text-slate-600 font-bold select-none text-[11px] mt-[1px]">•</span>
                    <span
                      contentEditable={isEditable}
                      suppressContentEditableWarning
                      onBlur={(e) => onEditableBlur(`projBullet.${idx}.${bIdx}`, e.currentTarget.innerText)}
                      className={`flex-1 ${editableClass}`}
                    >
                      {bullet}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Education */}
      <section className="mb-0 break-inside-avoid print:break-inside-avoid">
        <h2 className="text-[1.05em] font-bold tracking-[0.1em] uppercase text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-1.5 inline-block">
          Education
        </h2>
        <div className="flex items-start justify-between gap-4 print:break-inside-avoid">
          <div className="flex-1">
            <h3
              contentEditable={isEditable}
              suppressContentEditableWarning
              onBlur={(e) => onEditableBlur("edu.degree", e.currentTarget.innerText)}
              className={`text-[1.12em] font-bold text-slate-900 mb-0.5 ${editableClass}`}
            >
              {resume.education.degree}
            </h3>
            <p
              contentEditable={isEditable}
              suppressContentEditableWarning
              onBlur={(e) => onEditableBlur("edu.institution", e.currentTarget.innerText)}
              className={`text-[1.02em] text-slate-700 font-medium ${editableClass}`}
            >
              {resume.education.institution}
            </p>
            <p
              contentEditable={isEditable}
              suppressContentEditableWarning
              onBlur={(e) => onEditableBlur("edu.cgpa", e.currentTarget.innerText)}
              className={`text-[0.95em] text-slate-600 mt-0.5 ${editableClass}`}
            >
              {resume.education.cgpa}
            </p>
          </div>
          <div className="flex flex-col items-end gap-0.5 shrink-0">
            <span
              contentEditable={isEditable}
              suppressContentEditableWarning
              onBlur={(e) => onEditableBlur("edu.duration", e.currentTarget.innerText)}
              className={`text-[1.02em] font-semibold text-slate-800 ${editableClass}`}
            >
              {resume.education.duration}
            </span>
            <span
              contentEditable={isEditable}
              suppressContentEditableWarning
              onBlur={(e) => onEditableBlur("edu.location", e.currentTarget.innerText)}
              className={`text-[0.95em] text-slate-500 ${editableClass}`}
            >
              {resume.education.location}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
