import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "../logger";

// Active supported Gemini models in priority order
const GEMINI_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.8-flash",
];

// Helper to extract and clean JSON from AI output
function extractJSON(text: string): any {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```(?:json)?\r?\n?/i, "")
      .replace(/\r?\n?```$/i, "")
      .trim();
  }

  try {
    return JSON.parse(cleaned);
  } catch (_e) {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      const jsonSub = cleaned.substring(start, end + 1);
      try {
        return JSON.parse(jsonSub);
      } catch (_e2) {}

      // Repair unescaped newlines inside the "resume" field
      try {
        const repaired = jsonSub.replace(
          /"resume"\s*:\s*"([\s\S]*?)"\s*,\s*"(?:keywordsAdded|bulletsRewritten|changesCount|summary)/i,
          (match, resumeVal) => {
            const escapedVal = resumeVal
              .replace(/\\/g, "\\\\")
              .replace(/"/g, '\\"')
              .replace(/\r?\n/g, "\\n")
              .replace(/\t/g, "\\t");
            const afterKey = match.split('", "')[1] || "keywordsAdded";
            return `"resume": "${escapedVal}", "${afterKey}`;
          },
        );
        return JSON.parse(repaired);
      } catch (_e3) {}
    }
    throw new Error("Unable to parse JSON from AI response.");
  }
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
    // Retry up to 3 times per model with backoff for 503 transient spikes
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        logger.info(
          `[gemini] Attempt ${attempt}/3 with model: ${modelName}`,
        );
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.2, // Lower = more deterministic, format-faithful
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
          },
        });

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        if (responseText && responseText.trim().length > 50) {
          const parsed = extractJSON(responseText);
          logger.info(
            `[gemini] Successfully generated optimization via ${modelName} on attempt ${attempt}`,
          );
          return parsed;
        }
      } catch (sdkError: any) {
        lastError = sdkError;
        logger.warn(
          `[gemini] Model ${modelName} attempt ${attempt} failed: ${sdkError?.message}`,
        );

        // If transient spike (503 or 429), short wait before retry
        const isTransient = sdkError?.status === 503 || sdkError?.status === 429 || /503|429|demand/i.test(sdkError?.message || "");
        if (isTransient && attempt < 3) {
          await new Promise((r) => setTimeout(r, 800 * attempt));
          continue;
        }

        // If not transient or last attempt, try direct REST fallback once
        if (attempt === 3) {
          try {
            logger.info(
              `[gemini] Attempting direct REST fallback for ${modelName}...`,
            );
            const restRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
              {
                method: "POST",
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
              if (candidateText && candidateText.trim().length > 50) {
                const parsed = extractJSON(candidateText);
                logger.info(
                  `[gemini] Successfully generated optimization via ${modelName} (REST)`,
                );
                return parsed;
              }
            }
          } catch (restErr: any) {
            logger.warn(`[gemini] REST fallback also failed for ${modelName}:`, restErr?.message);
          }
        }
      }
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
