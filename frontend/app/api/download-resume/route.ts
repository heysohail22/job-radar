import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { resumeData } from "../../../lib/resumeData";
import { generateResumeHtml } from "../../../lib/generateResumeHtml";

const execFileAsync = promisify(execFile);

async function handleGeneratePdf(request: Request) {
  let targetResume = resumeData;
  let targetSpacing = undefined;

  if (request.method === "POST") {
    try {
      const body = await request.json();
      if (body.resume) targetResume = body.resume;
      if (body.spacing) targetSpacing = body.spacing;
    } catch {}
  }

  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const htmlPath = path.join("/tmp", `resume_${id}.html`);
  const pdfPath = path.join("/tmp", `resume_${id}.pdf`);

  try {
    const htmlContent = generateResumeHtml(targetResume, targetSpacing);
    fs.writeFileSync(htmlPath, htmlContent, "utf-8");

    // Execute headless Chrome directly on the standalone HTML file
    await execFileAsync("google-chrome", [
      "--headless",
      "--disable-gpu",
      "--no-sandbox",
      "--run-all-compositor-stages-before-draw",
      `--print-to-pdf=${pdfPath}`,
      htmlPath,
    ]);

    if (!fs.existsSync(pdfPath)) {
      throw new Error("PDF file was not created by Chrome");
    }

    const fileBuffer = fs.readFileSync(pdfPath);

    // Clean up temporary files
    try {
      if (fs.existsSync(htmlPath)) fs.unlinkSync(htmlPath);
      if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
    } catch {}

    const cleanFilename = `${targetResume.name.replace(/\s+/g, "_")}_Resume.pdf`;

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${cleanFilename}"`,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("PDF generation error:", error);
    try {
      if (fs.existsSync(htmlPath)) fs.unlinkSync(htmlPath);
      if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
    } catch {}

    return NextResponse.json(
      { error: "PDF generation failed", details: error?.message },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return handleGeneratePdf(request);
}

export async function POST(request: Request) {
  return handleGeneratePdf(request);
}
