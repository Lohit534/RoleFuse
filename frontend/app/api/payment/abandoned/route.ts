import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { sendAbandonedCheckoutEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

// In-memory 24-hour rate limit map: email -> timestamp of last sent email
const abandonedEmailCooldown = new Map<string, number>();
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json().catch(() => ({}));
    const { planId, billingCycle, price, email: fallbackEmail, name: fallbackName } = body;

    const targetEmail = (user?.email || fallbackEmail || "").toLowerCase().trim();
    if (!targetEmail) {
      return NextResponse.json({ error: "User email required" }, { status: 400 });
    }

    // 1. Check 24-hour cooldown so we don't spam the user if they open/close multiple times
    const lastSent = abandonedEmailCooldown.get(targetEmail);
    const now = Date.now();
    if (lastSent && now - lastSent < COOLDOWN_MS) {
      return NextResponse.json({
        success: true,
        message: "Cooldown active; recovery email already sent recently.",
      });
    }

    // 2. Check if user already has an active paid plan
    if (user?.id) {
      try {
        const admin = getAdminClient() as any;
        const { data: credit } = await admin
          .from("Credit")
          .select("paidCredits, expiresAt")
          .eq("userId", user.id)
          .maybeSingle();

        if (credit && credit.paidCredits > 0) {
          const isNotExpired = !credit.expiresAt || new Date(credit.expiresAt) > new Date();
          if (isNotExpired) {
            return NextResponse.json({
              success: true,
              message: "User already has active paid credits.",
            });
          }
        }
      } catch (err: any) {
        logger.warn("[payment/abandoned] Credit check warning:", err?.message);
      }
    }

    // 3. Send recovery email
    const planName = planId === "promax" ? "Pro Max" : "Premium Pro";
    const userName =
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      fallbackName ||
      undefined;

    await sendAbandonedCheckoutEmail({
      userEmail: targetEmail,
      userName,
      planName,
      price: price || (planId === "promax" ? "₹199/mo" : "₹99/mo"),
      billingCycle,
    });

    // Record cooldown
    abandonedEmailCooldown.set(targetEmail, now);
    logger.info(`[payment/abandoned] Sent recovery email to ${targetEmail} for plan ${planName}`);

    return NextResponse.json({
      success: true,
      message: "Abandoned checkout recovery email sent.",
    });
  } catch (error: any) {
    logger.warn("[payment/abandoned] Error sending abandoned email:", error?.message);
    return NextResponse.json(
      { error: error?.message || "Failed to trigger recovery email." },
      { status: 500 }
    );
  }
}

