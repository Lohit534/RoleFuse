import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { sendPlanExpirationReminderEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

/**
 * GET /api/cron/check-expirations
 *
 * Runs daily via Supabase pg_cron or Vercel Cron.
 * Checks for users with active paid plans expiring within 3 days or today,
 * and sends an automated branded renewal reminder email.
 */
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Verify secret if configured
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = getAdminClient() as any;
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Fetch credits expiring between now and 3 days from now
    const { data: expiringCredits, error } = await admin
      .from("Credit")
      .select("id, userId, paidCredits, billingCycle, expiresAt")
      .gt("paidCredits", 0)
      .gt("expiresAt", now.toISOString())
      .lte("expiresAt", threeDaysFromNow.toISOString());

    if (error) {
      logger.error("[cron/check-expirations] DB query failed:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!expiringCredits || expiringCredits.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No expiring plans found today.",
        processedCount: 0,
      });
    }

    let sentCount = 0;

    for (const credit of expiringCredits) {
      // Fetch user profile
      const { data: user } = await admin
        .from("User")
        .select("id, email, name, plan")
        .eq("id", credit.userId)
        .maybeSingle();

      if (!user?.email) continue;

      const expiryDate = new Date(credit.expiresAt);
      const diffTime = expiryDate.getTime() - now.getTime();
      const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

      try {
        await sendPlanExpirationReminderEmail({
          userEmail: user.email,
          userName: user.name || undefined,
          planName: user.plan || (credit.paidCredits > 20 ? "Pro Max" : "Pro"),
          daysRemaining: diffDays,
          expiresAt: credit.expiresAt,
        });
        sentCount++;
        logger.info(`[cron/check-expirations] Sent expiry reminder to ${user.email} (${diffDays} days left)`);
      } catch (sendErr: any) {
        logger.warn(`[cron/check-expirations] Failed sending to ${user.email}:`, sendErr?.message);
      }
    }

    return NextResponse.json({
      success: true,
      processedCount: expiringCredits.length,
      sentCount,
    });
  } catch (err: any) {
    logger.error("[cron/check-expirations] Unhandled error:", err?.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

