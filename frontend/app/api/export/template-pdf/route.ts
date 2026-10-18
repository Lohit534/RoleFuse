import { NextRequest, NextResponse } from "next/server";
import { generatePDF } from "@/lib/export/pdf";
import { getTemplateById } from "@/lib/ats-templates-data";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get("template") || "financial-analyst";

    const template = getTemplateById(templateId);
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    logger.info(`Generating downloadable template PDF for template: ${template.id}`);
    const pdfBuffer = await generatePDF(template.plainText, false);

    const safeFilename = `${template.name.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_")}_ATS_Template.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFilename}"`,
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error: any) {
    logger.error("Failed to generate template PDF:", error);
    return NextResponse.json(
      { error: "Internal server error during template PDF generation." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const templateId = body.templateId || "financial-analyst";

    const template = getTemplateById(templateId);
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    logger.info(`Generating downloadable template PDF (POST) for template: ${template.id}`);
    const pdfBuffer = await generatePDF(template.plainText, false);

    const safeFilename = `${template.name.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_")}_ATS_Template.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFilename}"`,
      },
    });
  } catch (error: any) {
    logger.error("Failed to generate template PDF:", error);
    return NextResponse.json(
      { error: "Internal server error during template PDF generation." },
      { status: 500 }
    );
  }
}
