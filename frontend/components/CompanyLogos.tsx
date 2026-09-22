import React from "react";

export function CompanyLogo({ name, className = "w-11 h-11" }: { name: string; className?: string }) {
  const lower = name.toLowerCase();

  if (lower.includes("langchain")) {
    return (
      <div className={`${className} rounded-xl bg-[#1C3C3C] text-[#F8F8F8] flex items-center justify-center text-sm font-black shadow-xs shrink-0 border border-[#232B3B]`}>
        🦜🔗
      </div>
    );
  }

  if (lower.includes("perplexity")) {
    return (
      <div className={`${className} rounded-xl bg-[#20B2AA]/15 border border-[#20B2AA]/30 text-[#20B2AA] flex items-center justify-center font-bold text-xs shadow-xs shrink-0`}>
        PX
      </div>
    );
  }

  if (lower.includes("cursor")) {
    return (
      <div className={`${className} rounded-xl bg-[#6366F1]/15 border border-[#6366F1]/40 text-[#6366F1] flex items-center justify-center font-extrabold text-xs shadow-xs shrink-0`}>
        ⚡
      </div>
    );
  }

  if (lower.includes("hugging")) {
    return (
      <div className={`${className} rounded-xl bg-[#FFD21E]/15 border border-[#FFD21E]/30 text-white flex items-center justify-center text-sm font-bold shadow-xs shrink-0`}>
        🤗
      </div>
    );
  }

  if (lower.includes("scale")) {
    return (
      <div className={`${className} rounded-xl bg-[#101828] border border-[#232B3B] text-[#F8F8F8] flex items-center justify-center font-black text-xs shadow-xs shrink-0`}>
        SC
      </div>
    );
  }

  if (lower.includes("openai")) {
    return (
      <div className={`${className} rounded-xl bg-white flex items-center justify-center p-2 shadow-xs shrink-0`}>
        <svg viewBox="0 0 24 24" className="w-full h-full text-black" fill="currentColor">
          <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.674 8.105v-5.678a.79.79 0 0 0-.409-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zM8.307 13.626l-2.02-1.163a.08.08 0 0 1-.038-.057V6.793a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.096-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.612-1.5z"/>
        </svg>
      </div>
    );
  }

  // Fallback for any scraped company: clean initials avatar
  return (
    <div className={`${className} rounded-xl bg-[#181F30] border border-[#232B3B] text-[#6366F1] flex items-center justify-center font-bold text-xs shrink-0`}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

