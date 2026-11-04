import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildLinkedInOptimizerPrompt } from "@/lib/ai/prompts";
import { callAIText } from "@/lib/ai/router";
import { logger } from "@/lib/logger";

function extractJSON(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error("Invalid AI LinkedIn JSON format");
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { resumeText, targetRole, industry, jobDescription, linkedinUrl } = body;

    // Use provided resume text or a default placeholder from LinkedIn URL
    let content = resumeText;
    if (!content || !content.trim()) {
      if (linkedinUrl) {
        content = `LinkedIn Profile URL: ${linkedinUrl}\nCandidate is targeting ${targetRole || "Technical Roles"}.`;
      } else {
        return NextResponse.json(
          { error: "LinkedIn Profile URL or Resume text is required." },
          { status: 400 }
        );
      }
    }

    const prompt = buildLinkedInOptimizerPrompt(
      content,
      targetRole || "Target Industry Professional",
      industry || "Technology / Corporate",
      jobDescription,
      linkedinUrl
    );

    const rawResponse = await callAIText(prompt);
    const parsedData = extractJSON(rawResponse);

    return NextResponse.json({
      success: true,
      data: parsedData
    });
  } catch (error: any) {
    logger.error("[linkedin-optimize] API error:", error?.message);
    return NextResponse.json(
      { error: error?.message || "Failed to generate LinkedIn optimization pack." },
      { status: 500 }
    );
  }
}

