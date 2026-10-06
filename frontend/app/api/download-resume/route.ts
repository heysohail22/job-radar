import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { resumeData } from "../../../lib/resumeData";
import { generateResumeHtml } from "../../../lib/generateResumeHtml";
import { generateResumeDocxBuffer } from "../../../lib/generateResumeDocx";

const execFileAsync = promisify(execFile);

async function handleGenerateResume(request: Request) {
  let targetResume = resumeData;
  let targetSpacing = undefined;
  let format = "docx"; // Default to docx

  const url = new URL(request.url);
  const queryFormat = url.searchParams.get("format");
  if (queryFormat) {
    format = queryFormat.toLowerCase();
  }

  if (request.method === "POST") {
    try {
      const body = await request.json();
      if (body.resume) targetResume = body.resume;
      if (body.spacing) targetSpacing = body.spacing;
      if (body.format) format = body.format.toLowerCase();
    } catch {}
  }

  const cleanBaseName = (targetResume.name || "Resume").replace(/\s+/g, "_");

  // Handle DOCX format
  if (format === "docx" || format === "word") {
    try {
      const buffer = await generateResumeDocxBuffer(targetResume, targetSpacing);
      const filename = `${cleanBaseName}_Resume.docx`;

      return new Response(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Length": buffer.length.toString(),
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    } catch (error: any) {
      console.error("DOCX generation error:", error);
      return NextResponse.json(
        { error: "DOCX generation failed", details: error?.message },
        { status: 500 }
      );
    }
  }

  // Handle PDF format
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

    const cleanFilename = `${cleanBaseName}_Resume.pdf`;

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
  return handleGenerateResume(request);
}

export async function POST(request: Request) {
  return handleGenerateResume(request);
}
