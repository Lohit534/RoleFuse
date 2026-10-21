/**
 * POST /api/support/chat
 *
 * RoleFuse AI Assistant Chatbot handler.
 * Powered by Google Gemini and Groq AI, with intelligent contextual fallbacks.
 * Answers any platform question: safety, pricing plans, ATS scoring, career roadmaps, and support.
 * Guaranteed 100% clean formatting without asterisks.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { isOwnerEmail } from "@/types";
import { logger } from "@/lib/logger";
import { callAIText } from "@/lib/ai/router";

/**
 * In-memory token pool cache mapping userId -> remaining sub-credit tokens (0 to 7999)
 * 1 full optimization credit = 8,000 tokens (~30-50 chat messages per credit)
 */
const chatTokenPoolCache = new Map<string, number>();
const TOKENS_PER_CREDIT = 8000;

/**
 * Remove all markdown asterisks (**bold**, *italics*, and bullet asterisks)
 * and format cleanly with standard bullet characters.
 */
export function cleanAsterisks(text: string): string {
  if (!text) return "";
  return text
    // Replace **bold** with clean text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    // Replace *italics* with clean text
    .replace(/\*([^*]+)\*/g, "$1")
    // Replace markdown bullet asterisks or dashes with clean bullets
    .replace(/(^|\n)\s*[\*\-]\s+/g, "$1• ")
    // Remove any remaining stray asterisks
    .replace(/\*/g, "")
    // Normalize line breaks
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getSmartContextualAnswer(question: string): string {
  const q = question.toLowerCase();

  // Safety, Trust, Legitimacy & Security
  if (
    q.includes("safe") ||
    q.includes("trust") ||
    q.includes("secure") ||
    q.includes("security") ||
    q.includes("legit") ||
    q.includes("privacy") ||
    q.includes("scam") ||
    q.includes("data")
  ) {
    return cleanAsterisks(
      "RoleFuse is 100% safe, trustworthy, and enterprise-grade secure:\n\n" +
      "• 256-Bit SSL Encryption: All web traffic and resumes are encrypted in transit and at rest.\n" +
      "• RBI-Regulated Payments: All transactions are processed through Razorpay, a certified PCI-DSS Level 1 compliant gateway.\n" +
      "• Zero Payment Storage: We never store your UPI PINs, credit/debit card numbers, or banking credentials.\n" +
      "• Safe One-Time Charges: Payments are strictly one-time with no unexpected recurring auto-debits.\n" +
      "• Strict Non-Refundable Policy: As stated on our Pricing page, all purchases and plan switches are final and strictly non-refundable."
    );
  }

  // Plan Switching & Free Plan status
  if (
    q.includes("switch") ||
    q.includes("change plan") ||
    q.includes("only shows free") ||
    q.includes("did not purchase") ||
    q.includes("upgrade") ||
    q.includes("downgrade")
  ) {
    return cleanAsterisks(
      "About switching plans on RoleFuse:\n\n" +
      "• If you have not purchased a plan, your account strictly remains on the Free Tier with your free monthly credits.\n" +
      "• All 3 plans (Free, Premium Pro, and Pro Max) are shown on the Pricing page so you can easily compare features.\n" +
      "• You will never be switched or billed unexpectedly. A plan is only activated after you voluntarily complete a secure checkout.\n" +
      "• Whenever you want higher credits or AI features, you can upgrade on the Pricing page at any time."
    );
  }

  // Pricing & Plans
  if (
    q.includes("promax") ||
    q.includes("pro max") ||
    q.includes("unlimited") ||
    q.includes("plan") ||
    q.includes("pricing") ||
    q.includes("price") ||
    q.includes("cost")
  ) {
    return cleanAsterisks(
      "RoleFuse offers 3 simple, transparent plans:\n\n" +
      "• Free Tier: Free monthly optimizations, standard ATS score breakdown, and instant resume preview.\n" +
      "• Premium Pro (₹99/month or ₹1,188/yr charged annually): 20 resume optimizations/month, full keyword gap analysis, all resume templates, and PDF & DOCX downloads.\n" +
      "• Pro Max (₹199/month or ₹2,388/yr charged annually): 90 AI resume optimizations/month, AI bullet point rewriter, priority ATS processing, 24/7 AI Assistant, and official GST tax invoices.\n\n" +
      "All plans are processed securely via Razorpay with 5% GST."
    );
  }

  // ATS Scoring & Resume Optimization
  if (q.includes("ats") || q.includes("score") || q.includes("tailor") || q.includes("optimize") || q.includes("90")) {
    return cleanAsterisks(
      "To score 90+ on RoleFuse's ATS scanner:\n\n" +
      "1. Paste your target Job Description (JD) into the optimization panel.\n" +
      "2. Match critical hard skills and tools listed in the JD within your Skills and Experience sections.\n" +
      "3. Use strong action verbs and measurable metrics (e.g., Increased performance by 40% or reduced costs by ₹2L).\n" +
      "4. Our AI highlights missing keywords in red/amber and automatically inserts them naturally into your bullet points."
    );
  }

  // GST, Invoices & Tax
  if (q.includes("gst") || q.includes("tax") || q.includes("invoice") || q.includes("receipt") || q.includes("bill")) {
    return cleanAsterisks(
      "Official GST tax invoices are generated automatically for every purchase:\n\n" +
      "• Includes complete 5% GST breakdown, HSN code, and transaction ID.\n" +
      "• View, preview, and download official PDF tax invoices anytime from your Billing & Subscription page."
    );
  }

  // Downloads & Formats
  if (q.includes("download") || q.includes("pdf") || q.includes("docx") || q.includes("export") || q.includes("format")) {
    return cleanAsterisks(
      "RoleFuse supports full resume exports:\n\n" +
      "• ATS-Compliant PDF: Formatted cleanly for corporate Applicant Tracking Systems.\n" +
      "• Editable Word DOCX: Perfect for making quick manual adjustments or submitting to recruiters who require Word files.\n" +
      "• Both download options are available directly on the editor and in your History page."
    );
  }

  // Job Application Tracker
  if (q.includes("job tracker") || q.includes("tracker") || q.includes("applied") || q.includes("application")) {
    return cleanAsterisks(
      "RoleFuse includes an integrated Job Application Tracker:\n\n" +
      "• Organize your job search across Wishlist, Applied, Interviewing, Offer, and Rejected stages.\n" +
      "• Add job URLs, salary ranges, deadlines, and notes.\n" +
      "• Directly link the specific tailored resume used for each application so you're always prepared for interviews."
    );
  }

  // Career Roadmap
  if (q.includes("roadmap") || q.includes("skill") || q.includes("career") || q.includes("learn")) {
    return cleanAsterisks(
      "In the Career Roadmap tool, choose your target role or desired tech stack to generate an AI-powered learning pathway with milestones, project suggestions, and interview preparation guides tailored to your current level."
    );
  }

  // Refunds & Support
  if (q.includes("refund") || q.includes("money back") || q.includes("cancel") || q.includes("return")) {
    return cleanAsterisks(
      "RoleFuse Refund Policy:\n\n" +
      "• As clearly stated on our Pricing page, all payments, plan upgrades, and plan switches are strictly non-refundable under any circumstances.\n" +
      "• Because digital optimization credits and AI features are activated immediately upon purchase, payments cannot be refunded or reversed.\n" +
      "• If you experience any technical issues with your credits, our team is ready to assist you promptly via an Admin Support Ticket."
    );
  }

  if (q.includes("contact") || q.includes("admin") || q.includes("help") || q.includes("ticket") || q.includes("human") || q.includes("support")) {
    return cleanAsterisks(
      "Need human help or support?\n\n" +
      "• Create a ticket directly in this widget under Admin Support Ticket.\n" +
      "• Our administrative team responds directly within 1-2 business days, and replies appear right here in your widget."
    );
  }

  return cleanAsterisks(
    "RoleFuse helps you create ATS-optimized resumes tailored to any job description, track your job applications, and boost interview callbacks.\n\n" +
    "You can ask me about:\n" +
    "• How to achieve a 90+ ATS score\n" +
    "• How to tailor your resume for any Job Description\n" +
    "• Free, Premium Pro, and Pro Max plans\n" +
    "• GST invoices, PDF/DOCX downloads, and the Job Tracker"
  );
}

export const runtime = "nodejs";
export const maxDuration = 15;

const FAST_MODELS = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-1.0-pro",
];

export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    // 2. Enforce strict plan rules and credit availability server-side
    const isOwner = isOwnerEmail(user.email);
    const admin = getAdminClient() as any;
    let activeUserId = user.id;
    let currentPaidCredits = 0;
    let isExpired = false;

    if (!isOwner) {
      const userEmail = (user.email || "").toLowerCase().trim();
      if (user.email) {
        const { data: existingUser } = await admin
          .from("User")
          .select("id")
          .eq("email", userEmail)
          .maybeSingle();
        if (existingUser) activeUserId = existingUser.id;
      }

      let creditRow = null;
      const { data: c1 } = await admin
        .from("Credit")
        .select("paidCredits, expiresAt, billingCycle")
        .eq("userId", activeUserId)
        .maybeSingle();
      creditRow = c1;

      if (!creditRow && activeUserId !== user.id) {
        const { data: c2 } = await admin
          .from("Credit")
          .select("paidCredits, expiresAt, billingCycle")
          .eq("userId", user.id)
          .maybeSingle();
        if (c2) creditRow = c2;
      }

      const now = new Date();
      currentPaidCredits = creditRow?.paidCredits ?? 0;

      // Verify payment validity from PaymentLog
      let isPaidProMax = false;
      try {
        const { data: latestPayment } = await admin
          .from("PaymentLog")
          .select("*")
          .or(`userId.eq.${activeUserId},userId.eq.${user.id},email.eq.${userEmail}`)
          .eq("planId", "promax")
          .order("createdAt", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestPayment) {
          const payDate = new Date(latestPayment.createdAt);
          const isYearly = latestPayment.billingCycle === "yearly" && (latestPayment.amount > 300);
          const days = isYearly ? 365 : 30;
          const validUntil = new Date(payDate.getTime() + days * 24 * 60 * 60 * 1000);
          if (validUntil > now) {
            isPaidProMax = true;
            if (currentPaidCredits === 0 && !creditRow?.expiresAt) {
              currentPaidCredits = 90;
            }
          } else {
            isExpired = true;
          }
        }
      } catch (_pErr) {}

      // Expiration check: Option 3 (Rollover on Renewal)
      const isRolloverCycle = typeof creditRow?.billingCycle === "string" && creditRow.billingCycle.startsWith("rollover:");
      if (creditRow?.expiresAt) {
        const exp = new Date(creditRow.expiresAt);
        if (now >= exp) isExpired = true;
      }
      if (isRolloverCycle) isExpired = true;

      const isAdminPromax = creditRow?.billingCycle === "admin_promax";
      const isAdminPremium = creditRow?.billingCycle === "admin_premium";

      // If plan has expired, enforce automatic downgrade to free with saved rollover credits
      if (isExpired && !isAdminPromax) {
        if (!isRolloverCycle && creditRow) {
          const leftoverCredits = creditRow.paidCredits > 0 ? creditRow.paidCredits : 0;
          const rolloverCycleStr = leftoverCredits > 0 ? `rollover:${leftoverCredits}` : "monthly";
          await admin
            .from("Credit")
            .update({ paidCredits: 0, expiresAt: null, billingCycle: rolloverCycleStr })
            .eq("userId", activeUserId)
            .catch(() => {});
        }
        return NextResponse.json(
          { error: "Your subscription has expired and automatically reverted to the Free plan. Please renew your Pro Max plan to continue using the 24/7 AI Assistant." },
          { status: 403 }
        );
      }

      // STRICT: AI Chat is exclusively a Pro Max feature (requires 90 credits or admin_promax or active Pro Max plan)
      // Premium (20 credits) users do NOT have access to AI Chat
      const hasProMaxAccess =
        isAdminPromax ||
        isPaidProMax ||
        (currentPaidCredits > 0 && !creditRow?.billingCycle?.includes("premium") && creditRow?.billingCycle !== "admin_premium") ||
        currentPaidCredits >= 90;

      if (!hasProMaxAccess) {
        const isPremiumUser = isAdminPremium || currentPaidCredits > 0;
        if (isPremiumUser) {
          return NextResponse.json(
            { error: "24/7 AI Assistant is exclusive to the Pro Max plan (₹199/month). Your Premium Pro plan does not include AI Chat. Please upgrade to Pro Max to unlock this feature." },
            { status: 403 }
          );
        }
        return NextResponse.json(
          { error: "AI Chat is exclusive to Pro Max plan. Please upgrade to Pro Max (₹199/month) to access the 24/7 AI Assistant." },
          { status: 403 }
        );
      }

      // Pro Max user with 0 remaining credits
      if (currentPaidCredits <= 0 && !isAdminPromax && !isPaidProMax) {
        return NextResponse.json(
          { error: "You have used all your Pro Max AI credits for this month. Credits reset at the start of next month, or you can renew your plan." },
          { status: 403 }
        );
      }
    }

    const body = await request.json().catch(() => ({}));
    const question = body.question;
    const messages = body.messages || [];

    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required." }, { status: 400 });
    }

    if (!question || typeof question !== "string" || !question.trim()) {
      return NextResponse.json({ error: "Question is required." }, { status: 400 });
    }

    const trimmedQuestion = question.trim();

    // Helper: Deduct credits on an accumulated token-pool basis (gentle fractional charging: 8,000 tokens = 1 credit)
    const deductTokens = async (totalTokens: number) => {
      if (isOwner) {
        return { creditsDeducted: 0, creditsRemaining: 999999, tokenPool: 0 };
      }

      // Read current token pool from in-memory cache or Supabase user_metadata
      const cachedPool = chatTokenPoolCache.get(activeUserId);
      const metadataPool = typeof user.user_metadata?.chat_tokens_pool === "number"
        ? user.user_metadata.chat_tokens_pool
        : 0;
      
      const currentPool = typeof cachedPool === "number" ? cachedPool : metadataPool;
      const accumulatedTokens = currentPool + totalTokens;
      const creditsDeducted = Math.floor(accumulatedTokens / TOKENS_PER_CREDIT);
      const remainingPool = accumulatedTokens % TOKENS_PER_CREDIT;

      // Update in-memory cache immediately
      chatTokenPoolCache.set(activeUserId, remainingPool);

      // Asynchronously persist new pool into user_metadata
      try {
        if (admin?.auth?.admin?.updateUserById) {
          admin.auth.admin.updateUserById(user.id, {
            user_metadata: {
              ...(user.user_metadata || {}),
              chat_tokens_pool: remainingPool
            }
          }).catch(() => {});
        }
      } catch (_metaErr) {}

      let creditsRemaining = currentPaidCredits;

      if (creditsDeducted > 0) {
        creditsRemaining = Math.max(0, currentPaidCredits - creditsDeducted);
        try {
          await admin
            .from("Credit")
            .update({ paidCredits: creditsRemaining })
            .eq("userId", activeUserId);
          logger.info(`[support-chat] Charged ${creditsDeducted} credit(s) after reaching ${accumulatedTokens} tokens (${user.email}). Remaining credits: ${creditsRemaining}, remaining token pool: ${remainingPool}/${TOKENS_PER_CREDIT}`);
        } catch (err: any) {
          logger.error("[support-chat] Failed to deduct chat credit:", err?.message);
        }
      } else {
        logger.info(`[support-chat] AI assistance consumed ${totalTokens} tokens (${user.email}). Pool: ${remainingPool}/${TOKENS_PER_CREDIT} tokens (0 full credits deducted). Credits left: ${creditsRemaining}`);
      }

      return { creditsDeducted, creditsRemaining, tokenPool: remainingPool };
    };

    const SYSTEM_PROMPT = `
You are the RoleFuse AI Support Assistant. Your tone is professional, helpful, polite, and articulate.
You must provide complete, meaningful, and self-contained answers to the user's questions. Never cut off or stop mid-sentence.
You must answer questions based on the following platform rules. NEVER invent pricing or policies.

1. Safety & Security:
- RoleFuse is 100% safe, trustworthy, and enterprise-grade secure.
- 256-Bit SSL Encryption for all traffic.
- Payments use Razorpay (PCI-DSS Level 1 compliant). We NEVER store UPI PINs or card details.
- No auto-debits; strictly one-time payments.

2. Plans & Pricing:
- Free Tier: Free monthly optimizations, standard ATS score, instant preview. (Users who didn't pay are on this plan).
- Premium Pro (₹99/month or ₹1,188/yr charged annually): 20 optimizations/month, full keyword gap, all templates, PDF/DOCX downloads.
- Pro Max (₹199/month or ₹2,388/yr charged annually): 90 optimizations/month, AI bullet rewriter, priority ATS processing, 24/7 AI Assistant.
- Option 3 Rollover on Renewal: When an active subscription ends without immediate renewal, remaining unused credits are securely banked. As soon as you renew, your rollover credits are unlocked and added to your new cycle!
- All plans are one-time payments. No recurring debits. Users upgrade securely via the Pricing page.

3. Refund Policy:
- All payments, plan upgrades, and plan switches are STRICTLY NON-REFUNDABLE under any circumstances.
- Digital credits are activated immediately, so payments cannot be reversed. Support tickets can resolve technical issues.

4. ATS Scoring (Getting 90+):
- Paste target Job Description (JD).
- Match critical hard skills.
- Use strong action verbs and measurable metrics.
- Use our AI to highlight and insert missing keywords.

5. Features (Downloads & GST):
- Official GST invoices (5% GST breakdown, HSN) are generated automatically and available in Billing.
- Resumes can be downloaded as ATS-Compliant PDF or Editable Word DOCX.
- Integrated Job Application Tracker (organize search, track salaries, link tailored resumes).

6. Support:
- Users can create an Admin Support Ticket right here in the widget. Admins reply in 1-2 business days.

IMPORTANT RULES FOR YOU:
- Always give a full, meaningful, and complete answer. Do not cut off mid-sentence.
- Format cleanly. NEVER use asterisks (**) or markdown formatting. Use standard dashes (-) or plain text bullets.
- Do not repeat yourself endlessly. If the user says "hello", just greet them warmly and offer help.
- Keep answers strictly relevant to the user's latest question while respecting chat history.
`;

    // Map existing history to prompt context
    let systemPrompt = SYSTEM_PROMPT + "\n\nChat History:\n";
    for (const msg of messages) {
      if (msg.role === 'user') systemPrompt += `User: ${msg.content}\n`;
      if (msg.role === 'assistant') systemPrompt += `Assistant: ${msg.content}\n`;
    }
    systemPrompt += `\nUser: ${trimmedQuestion}\nAssistant:`;

    // 2. Try Primary Groq LPU (fast response) if GROQ_API_KEY is present
    const groqKey = (process.env.GROQ_API_KEY || "").replace(/^["']|["']$/g, "").trim();
    if (groqKey) {
      try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: systemPrompt }],
            temperature: 0.2,
            max_tokens: 1200
          }),
          signal: AbortSignal.timeout(8000)
        });

        if (groqRes.ok) {
          const json = await groqRes.json();
          const content = json.choices?.[0]?.message?.content;
          if (content && content.trim().length > 5) {
            const tokens = json.usage?.total_tokens || Math.ceil((systemPrompt.length + content.length) / 4);
            const { creditsDeducted, creditsRemaining, tokenPool } = await deductTokens(tokens);
            return NextResponse.json({
              answer: cleanAsterisks(content.trim()),
              engine: "Groq AI (Llama 3.3)",
              tokensUsed: tokens,
              tokenPool,
              tokensPerCredit: TOKENS_PER_CREDIT,
              creditsDeducted,
              creditsRemaining
            });
          }
        }
      } catch (_groqErr) {
        // Groq failed or timed out — seamlessly falls through to Gemini below
      }
    }

    // 3. High-Speed Gemini Fallback / Primary (complete response)
    const geminiKey = (process.env.GEMINI_API_KEY || "").replace(/^["']|["']$/g, "").trim();
    if (geminiKey) {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(geminiKey);

      for (const modelName of FAST_MODELS) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 1200
            }
          });

          // Timeout promise to guarantee complete response without early abort
          const genPromise = model.generateContent(systemPrompt);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 9000)
          );

          const result: any = await Promise.race([genPromise, timeoutPromise]);
          const responseText = result.response.text();
          if (responseText && responseText.trim().length > 5) {
            const tokens = result.response?.usageMetadata?.totalTokenCount || Math.ceil((systemPrompt.length + responseText.length) / 4);
            const { creditsDeducted, creditsRemaining, tokenPool } = await deductTokens(tokens);
            return NextResponse.json({
              answer: cleanAsterisks(responseText.trim()),
              engine: "Gemini AI",
              tokensUsed: tokens,
              tokenPool,
              tokensPerCredit: TOKENS_PER_CREDIT,
              creditsDeducted,
              creditsRemaining
            });
          }
        } catch (e: any) {
          // Model failed or timed out, try next fast model
        }
      }
    }

    // 4. Fallback to CallAIText Router
    try {
      const aiResponse = await callAIText(systemPrompt);
      if (aiResponse && aiResponse.trim().length > 10) {
        const tokens = Math.ceil((systemPrompt.length + aiResponse.length) / 4);
        const { creditsDeducted, creditsRemaining, tokenPool } = await deductTokens(tokens);
        return NextResponse.json({
          answer: cleanAsterisks(aiResponse.trim()),
          engine: "RoleFuse AI",
          tokensUsed: tokens,
          tokenPool,
          tokensPerCredit: TOKENS_PER_CREDIT,
          creditsDeducted,
          creditsRemaining
        });
      }
    } catch (_aiErr) {}

    // 5. Smart Contextual Fallback
    const contextualAns = getSmartContextualAnswer(trimmedQuestion);
    const tokens = Math.ceil((systemPrompt.length + contextualAns.length) / 4);
    const { creditsDeducted, creditsRemaining, tokenPool } = await deductTokens(tokens);
    return NextResponse.json({
      answer: contextualAns,
      engine: "RoleFuse Contextual Engine",
      tokensUsed: tokens,
      tokenPool,
      tokensPerCredit: TOKENS_PER_CREDIT,
      creditsDeducted,
      creditsRemaining
    });

  } catch (error: any) {
    logger.error("[support-chat] Error:", error?.message);
    return NextResponse.json({ 
      answer: cleanAsterisks("I am ready to help! You can ask about ATS resume scoring, tailoring for job descriptions, pricing plans, or career roadmaps.") 
    });
  }
}

