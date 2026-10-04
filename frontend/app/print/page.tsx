"use client";

import React, { useEffect, useState } from "react";
import { ResumeDocument } from "../../components/ResumeDocument";
import { resumeData, type ResumeDataType } from "../../lib/resumeData";

export default function ResumePrintPage() {
  const [resume, setResume] = useState<ResumeDataType>(resumeData);

  useEffect(() => {
    // If customized resume exists in sessionStorage or query, we could load it, otherwise use clean resumeData
    setResume(resumeData);
  }, []);

  return (
    <div className="w-full min-h-screen bg-white text-slate-900 flex justify-center items-start p-0 m-0 print:p-0 print:m-0">
      <ResumeDocument resume={resume} isEditable={false} />
    </div>
  );
}
