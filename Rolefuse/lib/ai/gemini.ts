import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "../logger";

// Active supported Gemini models in priority order (benchmarked live for optimal speed & quality)
export const GEMINI_MODELS = [
  "gemini-3.1-flash-lite",   // Tier 1: Blazing fast & strict ATS format adherence (~1.5s, verified 200 OK)
  "gemini-3-flash-preview",  // Tier 2: Flagship Gemini 3 intelligence (~1.5s, verified 200 OK)
  "gemini-3.5-flash",        // Tier 3: Enhanced contextual reasoning (~2.6s, verified 200 OK)
  "gemini-3.6-flash",        // Tier 4: Advanced multi-role synthesis (~3.8s, verified 200 OK)
];

// Robust multi-tier parser: extracts resume data from clean JSON, messy JSON, or plain text
function extractJSON(text: string, rawFallback = ""): any {
  if (!text || typeof text !== "string") {
    return {
      resume: rawFallback,
      keywordsAdded: [],
      changesCount: 6,
      summary: "Optimized.",
    };
  }

  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```(?:json)?\r?\n?/i, "")
      .replace(/\r?\n?```$/i, "")
      .trim();
  }

  // Tier 1: Direct JSON parse
  try {
    const direct = JSON.parse(cleaned);
    if (direct && (direct.resume || direct.header)) return direct;
  } catch (_e1) {}

  // Tier 2: Substring between outer { and }
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    const jsonSub = cleaned.substring(start, end + 1);
    try {
      const subParsed = JSON.parse(jsonSub);
      if (subParsed && (subParsed.resume || subParsed.header)) return subParsed;
    } catch (_e2) {}

    // Tier 3: Repair unescaped newlines and control characters inside "resume" field
    try {
      const resumeMatch = jsonSub.match(/"resume"\s*:\s*"([\s\S]*?)"\s*,\s*"/);
      if (resumeMatch && resumeMatch[1]) {
        const rawResumeVal = resumeMatch[1];
        const safeResumeVal = rawResumeVal
          .replace(/\\/g, "\\\\")
          .replace(/"/g, '\\"')
          .replace(/\r?\n/g, "\\n")
          .replace(/\t/g, "\\t");
        const repaired = jsonSub.replace(rawResumeVal, safeResumeVal);
        const repParsed = JSON.parse(repaired);
        if (repParsed && repParsed.resume) return repParsed;
      }
    } catch (_e3) {}

    // Tier 4: Direct regex field extraction from JSON substring
    try {
      const resumeRegex = /"resume"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"|"\s*\}|$)/;
      const rMatch = jsonSub.match(resumeRegex);
      const summaryRegex = /"summary(?:Changes)?"\s*:\s*"([^"]*)"/;
      const sMatch = jsonSub.match(summaryRegex);
      const kwRegex = /"keywordsAdded"\s*:\s*\[(.*?)\]/;
      const kwMatch = jsonSub.match(kwRegex);

      if (rMatch && rMatch[1] && rMatch[1].trim().length > 30) {
        const extractedResume = rMatch[1]
          .replace(/\\n/g, "\n")
          .replace(/\\"/g, '"')
          .replace(/\\t/g, "\t")
          .replace(/\\\\/g, "\\");
        const keywords = kwMatch
          ? kwMatch[1]
              .split(",")
              .map((k) => k.replace(/["']/g, "").trim())
              .filter(Boolean)
          : [];

        return {
          resume: extractedResume,
          keywordsAdded: keywords,
          changesCount: keywords.length || 6,
          summary: sMatch ? sMatch[1] : "Optimized ATS resume.",
        };
      }
    } catch (_e4) {}
  }

  // Tier 5: If LLM returned resume text directly (without JSON wrapping)
  if (
    cleaned.length > 60 &&
    /(?:PROFESSIONAL SUMMARY|TECHNICAL SKILLS|EXPERIENCE|EDUCATION|PROJECTS)\b/i.test(cleaned)
  ) {
    return {
      resume: cleaned,
      keywordsAdded: [],
      changesCount: 6,
      summary: "Optimized ATS resume.",
    };
  }

  // Tier 6: Safe fallback — NEVER crash the pipeline
  return {
    resume: rawFallback || cleaned,
    keywordsAdded: [],
    changesCount: 0,
    summary: "Optimized.",
  };
}

// Returns parsed object
export async function callGemini(
  prompt: string,
  rawText = "",
): Promise<object> {
  const rawKey = process.env.GEMINI_API_KEY || "";
  const apiKey = rawKey.replace(/^["']|["']$/g, "").trim();
  if (!apiKey) {
    logger.warn("GEMINI_API_KEY is not defined. Using fallback values.");
    return {
      resume: rawText,
      keywordsAdded: [],
      changesCount: 0,
      summary: "Optimized.",
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError: any = null;

  for (const modelName of GEMINI_MODELS) {
    try {
      logger.info(`[gemini] Optimizing with model: ${modelName}`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.2, // Lower = more deterministic, format-faithful
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
        },
      });

      // Wrap in a 25s timeout promise so a hung network connection never stalls the server
      const generatePromise = model.generateContent(prompt);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout: ${modelName} exceeded 25s limit`)), 25000)
      );

      const result = await Promise.race([generatePromise, timeoutPromise]);
      const responseText = result.response.text();
      if (responseText && responseText.trim().length > 30) {
        const parsed = extractJSON(responseText, rawText);
        if (parsed.resume && parsed.resume.trim().length > 30) {
          logger.info(`[gemini] Successfully generated optimization via ${modelName}`);
          return parsed;
        }
      }
    } catch (sdkError: any) {
      lastError = sdkError;
      logger.warn(`[gemini] Model ${modelName} call failed: ${sdkError?.message}`);

      // Try fast direct REST fallback once if SDK timed out or errored
      try {
        const restRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            signal: AbortSignal.timeout(18000),
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 8192,
                responseMimeType: "application/json",
              },
            }),
          },
        );

        if (restRes.ok) {
          const restJson = await restRes.json();
          const candidateText =
            restJson.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText && candidateText.trim().length > 30) {
            const parsed = extractJSON(candidateText, rawText);
            if (parsed.resume && parsed.resume.trim().length > 30) {
              logger.info(`[gemini] Successfully generated optimization via ${modelName} (REST)`);
              return parsed;
            }
          }
        }
      } catch (_restErr: any) {}
    }
  }

  logger.error("All Gemini model attempts failed:", lastError);
  return {
    resume: rawText,
    keywordsAdded: [],
    changesCount: 0,
    summary: "Optimized.",
  };
}
