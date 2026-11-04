import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildEvaluateAnswerPrompt } from "@/lib/ai/prompts";
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
    throw new Error("Invalid AI evaluation JSON format");
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
    const { question, userAnswer, jobDescription, resumeText } = body;

    if (!question || !userAnswer || !userAnswer.trim()) {
      return NextResponse.json(
        { error: "Question and your practice answer are required." },
        { status: 400 }
      );
    }

    const prompt = buildEvaluateAnswerPrompt(
      question,
      userAnswer,
      jobDescription,
      resumeText
    );

    const rawResponse = await callAIText(prompt);
    const parsedData = extractJSON(rawResponse);

    return NextResponse.json({
      success: true,
      evaluation: parsedData
    });
  } catch (error: any) {
    logger.error("[interview-evaluate] API error:", error?.message);
    return NextResponse.json(
      { error: error?.message || "Failed to evaluate interview answer." },
      { status: 500 }
    );
  }
}

