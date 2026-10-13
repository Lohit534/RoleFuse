/**
 * /api/credits
 *
 * GET: Returns the current user's credit balance.
 * POST: Upgrades or downgrades the user's plan and sets corresponding database credits.
 * Uses Supabase JS client (HTTPS/REST) — NO direct Postgres connection.
 * This works on Vercel without any Supabase IPv4 add-on.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { FREE_CREDITS_PER_MONTH, PRO_CREDITS_PER_MONTH, PRO_MAX_CREDITS_PER_MONTH, isOwnerEmail } from "@/types";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    // 1. Verify auth session
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Owner always gets unlimited — no DB lookup needed
    const isOwner = isOwnerEmail(user.email);
    if (isOwner) {
      return NextResponse.json({
        freeUsed: 0,
        paidCredits: 999999,
        freeRemaining: 999999,
        resetAt: new Date().toISOString(),
        isOwner: true,
        planId: "promax",
      });
    }

    const admin = getAdminClient() as any;
    const now = new Date();

    // Resolve user record ID in public.User to prevent email unique constraint violations or foreign key errors
    let activeUserId = user.id;
    try {
      if (user.email) {
        const { data: existingUser } = await admin
          .from("User")
          .select("id, createdAt")
          .eq("email", user.email.toLowerCase().trim())
          .maybeSingle();

        if (existingUser) {
          activeUserId = existingUser.id;
          logger.info(`[credits] Found existing User record for email ${user.email} with ID ${existingUser.id}. Reusing this ID.`);
          
          // Auto-heal: sync real signup time from Auth to public.User table to fix early adopter ranks (e.g. user 3)
          if (user.created_at) {
            const dbTime = existingUser.createdAt ? new Date(existingUser.createdAt).toISOString() : null;
            const authTime = new Date(user.created_at).toISOString();
            if (dbTime !== authTime) {
              await admin
                .from("User")
                .update({ createdAt: authTime })
                .eq("id", existingUser.id);
              logger.info(`[credits] Healed signup time for user ${user.email}: ${dbTime} -> ${authTime}`);
            }
          }
        } else {
          // If the user doesn't exist, we insert a new record using their actual signup time
          const signupTime = user.created_at ? new Date(user.created_at).toISOString() : now.toISOString();
          logger.info(`[credits] Creating new User record for email ${user.email} with ID ${user.id} and signup time ${signupTime}`);
          const { error: insertUserErr } = await admin
            .from("User")
            .insert({
              id: user.id,
              email: user.email.toLowerCase().trim(),
              name: user.user_metadata?.full_name || null,
              createdAt: signupTime,
            });
          if (insertUserErr) {
            logger.error("[credits] Failed to insert new User record:", insertUserErr.message);
          }
        }
      }
    } catch (e: any) {
      logger.error("[credits] Error during User resolution/insertion:", e.message);
    }

    // Determine if user is in the first 50 users (sorted by createdAt)
    let isFirst50 = false;
    try {
      const { data: first50Users } = await admin
        .from("User")
        .select("id")
        .order("createdAt", { ascending: true })
        .limit(50);

      const { count: totalUsersCount } = await admin
        .from("User")
        .select("id", { count: "exact", head: true });

      // First 50 criteria: total platform user count is <= 50 OR user ID is in top 50 users list
      isFirst50 =
        (totalUsersCount !== null && totalUsersCount <= 50) ||
        (first50Users?.some((u: any) => u.id === activeUserId || u.id === user.id) || false);
    } catch (e: any) {
      logger.warn("[credits] Failed checking first 50 users list:", e.message);
    }

    // 3. Fetch or create Credit row
    let { data: creditRow, error: creditFetchErr } = await admin
      .from("Credit")
      .select("*")
      .eq("userId", activeUserId)
      .maybeSingle();

    if (creditFetchErr) {
      logger.error("[credits] Credit fetch error:", creditFetchErr.message);
    }

    if (!creditRow) {
      // Create initial credit row (First 50 members automatically get 1 year of free Premium Pro plan with 20 credits/mo)
      const { data: newCredit, error: createErr } = await admin
        .from("Credit")
        .insert({
          userId: activeUserId,
          freeUsed: 0,
          paidCredits: isFirst50 ? PRO_CREDITS_PER_MONTH : 0,
          billingCycle: isFirst50 ? "yearly" : "monthly",
          resetAt: now.toISOString(),
        })
        .select()
        .single();

      if (createErr) {
        logger.error("[credits] Credit create error:", createErr.message);
        // Return safe default on DB error
        return NextResponse.json({
          freeUsed: 0,
          paidCredits: isFirst50 ? PRO_CREDITS_PER_MONTH : 0,
          freeRemaining: isFirst50 ? PRO_CREDITS_PER_MONTH : FREE_CREDITS_PER_MONTH,
          resetAt: now.toISOString(),
          isOwner: false,
          isFirst50: isFirst50,
          planId: isFirst50 ? "premium" : "free",
        });
      }
      creditRow = newCredit;
    } else if (isFirst50 && creditRow.paidCredits === 0 && creditRow.billingCycle !== "admin_free" && creditRow.billingCycle !== "free") {
      // Upgrade free tier credits to Premium Pro plan (20 credits/month) for first 50 members
      const { data: updatedCredit } = await admin
        .from("Credit")
        .update({ paidCredits: PRO_CREDITS_PER_MONTH, billingCycle: "yearly" })
        .eq("userId", activeUserId)
        .select()
        .single();
      if (updatedCredit) {
        creditRow = updatedCredit;
      }
    }

    if (!creditRow) {
      return NextResponse.json({
        freeUsed: 0,
        paidCredits: 0,
        freeRemaining: FREE_CREDITS_PER_MONTH,
        resetAt: now.toISOString(),
        isOwner: false,
        isFirst50: false,
        planId: "free",
      });
    }

    const userEmail = (user.email || "").toLowerCase().trim();
    const isProMaxPurchasedUser = userEmail === "payyalajyothika333@gmail.com";

    // 3b. Verify active paid subscription from Razorpay PaymentLog (promax or premium)
    let isPaidProMax = false;
    let isPaidPremium = false;
    let paymentValidUntil: Date | null = null;
    let paidPlanFromPayment: string | null = null;

    try {
      const { data: latestPayment } = await admin
        .from("PaymentLog")
        .select("*")
        .or(`userId.eq.${activeUserId},userId.eq.${user.id},email.eq.${userEmail}`)
        .in("planId", ["promax", "premium"])
        .order("createdAt", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestPayment) {
        paidPlanFromPayment = latestPayment.planId;
        const payDate = new Date(latestPayment.createdAt);
        const isYearly = latestPayment.billingCycle === "yearly" && (latestPayment.amount > 300);
        const days = isYearly ? 365 : 30;
        paymentValidUntil = new Date(payDate.getTime() + days * 24 * 60 * 60 * 1000);

        if (paymentValidUntil > now) {
          if (latestPayment.planId === "promax") isPaidProMax = true;
          if (latestPayment.planId === "premium") isPaidPremium = true;
        } else {
          logger.info(`[credits] Subscription payment for ${userEmail} (${latestPayment.planId}) expired on ${paymentValidUntil.toISOString()}`);
        }
      }
    } catch (e: any) {
      logger.warn("[credits] Failed checking payment logs:", e.message);
    }

    // Admin override flags: ONLY explicit admin assignments, NEVER inferred from credit balance
    const isAdminPromax = creditRow.billingCycle === "admin_promax";
    const isAdminFree = creditRow.billingCycle === "admin_free" || creditRow.billingCycle === "free";
    const isAdminPremium = creditRow.billingCycle === "admin_premium";

    if (isPaidProMax || isPaidPremium || isAdminPromax) {
      isFirst50 = false; // Paying or Admin customer is NOT a free promotional user
    }
    if (isAdminFree) {
      isFirst50 = false;
    }

    // Check if user currently has stored rollover credits from a previously expired subscription
    const isRolloverCycle = typeof creditRow.billingCycle === "string" && creditRow.billingCycle.startsWith("rollover:");
    const rolloverCredits = isRolloverCycle ? (parseInt(creditRow.billingCycle.split(":")[1]) || 0) : 0;

    // Determine definitive expiration date: check Credit.expiresAt OR PaymentLog validUntil
    let expiresAt: Date | null = null;
    if (creditRow.expiresAt) {
      expiresAt = new Date(creditRow.expiresAt);
    } else if (paymentValidUntil) {
      expiresAt = paymentValidUntil;
    }

    let billingCycle = (isPaidProMax || isPaidPremium) ? "monthly" : (creditRow.billingCycle || "monthly");
    let paidCredits = creditRow.paidCredits;
    let freeUsed = creditRow.freeUsed;

    if (isPaidProMax && paymentValidUntil && paymentValidUntil > now) {
      expiresAt = paymentValidUntil;
      billingCycle = "monthly";

      const targetExpiryStr = expiresAt.toISOString();
      if (!creditRow.expiresAt || creditRow.paidCredits === 0) {
        await admin
          .from("Credit")
          .update({
            paidCredits: PRO_MAX_CREDITS_PER_MONTH,
            billingCycle: "monthly",
            expiresAt: targetExpiryStr,
          })
          .eq("userId", activeUserId);
        creditRow.paidCredits = PRO_MAX_CREDITS_PER_MONTH;
        creditRow.billingCycle = "monthly";
        creditRow.expiresAt = targetExpiryStr;
        paidCredits = PRO_MAX_CREDITS_PER_MONTH;
        logger.info(`[credits] Initialized Pro Max plan (90 credits, expires ${targetExpiryStr}) for ${userEmail}`);
      } else {
        paidCredits = creditRow.paidCredits;
        if (creditRow.expiresAt !== targetExpiryStr) {
          await admin
            .from("Credit")
            .update({ expiresAt: targetExpiryStr })
            .eq("userId", activeUserId);
          creditRow.expiresAt = targetExpiryStr;
        }
      }
    } else {
      // For first 50 free promotional users ONLY, set 1 year expiry
      if (isFirst50 && !expiresAt && !isAdminFree) {
        const signupTime = new Date(creditRow.resetAt || now);
        expiresAt = new Date(signupTime.getTime() + 365 * 24 * 60 * 60 * 1000);
        await admin
          .from("Credit")
          .update({ expiresAt: expiresAt.toISOString(), billingCycle: "yearly" })
          .eq("userId", activeUserId);
      }
    }

    // EXPIRATION CHECK: If plan has expired (now >= expiresAt OR payment expired), automatically revert to FREE with Option 3!
    const isExpired = Boolean(
      !isAdminPromax &&
      !isAdminPremium &&
      (
        isRolloverCycle ||
        (expiresAt && now >= expiresAt) ||
        (paymentValidUntil && now >= paymentValidUntil)
      )
    );

    if (isExpired && !isRolloverCycle) {
      const leftoverCredits = creditRow.paidCredits > 0 ? creditRow.paidCredits : 0;
      // Option 3: Save unused credits as banked rollover credits so they unlock when user renews!
      const rolloverCycleStr = leftoverCredits > 0 ? `rollover:${leftoverCredits}` : "monthly";
      paidCredits = 0;
      billingCycle = rolloverCycleStr;
      expiresAt = null;
      isPaidProMax = false;
      isPaidPremium = false;

      await admin
        .from("Credit")
        .update({
          paidCredits: 0,
          billingCycle: rolloverCycleStr,
          expiresAt: null,
          freeUsed: creditRow.freeUsed || 0,
        })
        .eq("userId", activeUserId);
      
      logger.info(`[credits] Option 3: Plan expired for user ${user.email}. Saved ${leftoverCredits} rollover credits. Reverted to free tier.`);
    }

    // Auto-heal ONLY for non-paying users: If user has legacy abnormal credits (>20 and <90) and is not promax, clamp DB to 20 Pro credits
    if (!isAdminPromax && !isExpired && creditRow.paidCredits > 20 && creditRow.paidCredits < 90 && !isPaidProMax) {
      if (creditRow.paidCredits !== PRO_CREDITS_PER_MONTH) {
        await admin
          .from("Credit")
          .update({ paidCredits: PRO_CREDITS_PER_MONTH })
          .eq("userId", activeUserId);
        creditRow.paidCredits = PRO_CREDITS_PER_MONTH;
        paidCredits = PRO_CREDITS_PER_MONTH;
        logger.info(`[credits] Auto-healed credits for user ${user.email} to ${PRO_CREDITS_PER_MONTH} Pro credits.`);
      }
    }

    // 4. Monthly reset check
    const resetAt = new Date(creditRow.resetAt);
    const isNewMonth =
      now.getMonth() !== resetAt.getMonth() ||
      now.getFullYear() !== resetAt.getFullYear();

    if (isNewMonth) {
      freeUsed = 0;
      if (!isExpired && (isPaidProMax || isAdminPromax)) {
        paidCredits = PRO_MAX_CREDITS_PER_MONTH; // 90
      } else if (isAdminFree || isExpired) {
        paidCredits = 0;
      } else if (!isExpired && (paidCredits > 0 || isFirst50 || isAdminPremium)) {
        paidCredits = PRO_CREDITS_PER_MONTH; // 20
      } else {
        paidCredits = 0;
      }
      // Sync new monthly values to DB
      await admin
        .from("Credit")
        .update({ 
          freeUsed: 0, 
          paidCredits: paidCredits, 
          resetAt: now.toISOString() 
        })
        .eq("userId", activeUserId);
      // Update local creditRow to reflect new state
      creditRow.paidCredits = paidCredits;
      creditRow.freeUsed = 0;
    }

    // Determine correct planId:
    let planId = "free";
    if (isOwner) {
      planId = "promax";
    } else if (isAdminFree || isExpired) {
      planId = "free";
    } else if (isPaidProMax || isAdminPromax || (paidCredits >= 90 && paidCredits < 900000 && !isExpired)) {
      planId = "promax";
    } else if ((paidCredits > 0 || isFirst50 || isAdminPremium) && !isExpired) {
      planId = "premium";
    } else {
      planId = "free";
    }

    if (planId === "free") {
      paidCredits = 0;
      expiresAt = null;
    } else {
      // Use the in-memory paidCredits variable which reflects all updates (monthly reset, rollover, etc)
      paidCredits = isOwner ? 999999 : paidCredits;
    }

    const freeRemaining = isOwner
      ? 999999
      : (planId === "free"
          ? Math.max(0, FREE_CREDITS_PER_MONTH - freeUsed)
          : Math.max(0, paidCredits));

    return NextResponse.json({
      freeUsed,
      paidCredits: isOwner ? 999999 : (planId === "free" ? 0 : paidCredits),
      freeRemaining,
      rolloverCredits: isExpired ? rolloverCredits : 0,
      resetAt: isNewMonth ? now.toISOString() : creditRow.resetAt,
      isOwner: false,
      isFirst50: isFirst50 && !isPaidProMax && !isExpired,
      planId,
      billingCycle,
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
    });
  } catch (error: any) {
    logger.error("[credits] GET Unhandled error:", error?.message);
    return NextResponse.json(
      { error: "Internal server error during credit evaluation." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verify auth session
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId, billingCycle = "monthly" } = await request.json();
    const isOwner = isOwnerEmail(user.email);

    // Owner is always unlimited - no credits update needed
    if (isOwner) {
      return NextResponse.json({ success: true, message: "Bypassed for owner" });
    }

    const admin = getAdminClient() as any;
    const now = new Date();

    // Resolve user record ID in public.User to prevent email unique constraint violations or foreign key errors
    let activeUserId = user.id;
    try {
      if (user.email) {
        const { data: existingUser } = await admin
          .from("User")
          .select("id")
          .eq("email", user.email.toLowerCase().trim())
          .maybeSingle();

        if (existingUser) {
          activeUserId = existingUser.id;
          logger.info(`[credits POST] Found existing User record for email ${user.email} with ID ${existingUser.id}. Reusing this ID.`);
        } else {
          // If the user doesn't exist, we insert a new record
          logger.info(`[credits POST] Creating new User record for email ${user.email} with ID ${user.id}`);
          const { error: insertUserErr } = await admin
            .from("User")
            .insert({
              id: user.id,
              email: user.email.toLowerCase().trim(),
              name: user.user_metadata?.full_name || null,
              createdAt: now.toISOString(),
            });
          if (insertUserErr) {
            logger.error("[credits POST] Failed to insert new User record:", insertUserErr.message);
          }
        }
      }
    } catch (e: any) {
      logger.error("[credits POST] Error during User resolution/insertion:", e.message);
    }

    // Map planId to paidCredits and calculate expiration
    let paidCredits = 0;
    let expiresAt: Date | null = null;

    if (planId === "premium") {
      paidCredits = PRO_CREDITS_PER_MONTH;
      const days = billingCycle === "yearly" ? 365 : 30;
      expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    } else if (planId === "team" || planId === "promax") {
      paidCredits = PRO_MAX_CREDITS_PER_MONTH;
      const days = billingCycle === "yearly" ? 365 : 30;
      expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    }

    // Upsert or update the credit row
    // Fetch existing credit row to avoid not-null primary key constraint failures
    const { data: existingCredit } = await admin
      .from("Credit")
      .select("id, billingCycle, paidCredits")
      .eq("userId", activeUserId)
      .maybeSingle();

    // Option 3: If user had banked rollover credits from an earlier expired cycle, add them back upon renewal!
    let rolloverBonus = 0;
    if (existingCredit?.billingCycle && typeof existingCredit.billingCycle === "string" && existingCredit.billingCycle.startsWith("rollover:")) {
      rolloverBonus = parseInt(existingCredit.billingCycle.split(":")[1]) || 0;
    }
    if (planId !== "free" && rolloverBonus > 0) {
      paidCredits += rolloverBonus;
      logger.info(`[credits POST] Option 3: Restored ${rolloverBonus} rollover credits for user ${user.email}. Total paidCredits: ${paidCredits}`);
    }

    let query;
    if (existingCredit) {
      query = admin
        .from("Credit")
        .update({
          paidCredits: paidCredits,
          billingCycle: planId === "free" ? "monthly" : billingCycle,
          expiresAt: expiresAt ? expiresAt.toISOString() : null,
          resetAt: now.toISOString(),
        })
        .eq("userId", activeUserId);
    } else {
      const newId = "credit-" + Math.random().toString(36).substring(2, 11);
      query = admin
        .from("Credit")
        .insert({
          id: newId,
          userId: activeUserId,
          freeUsed: 0,
          paidCredits: paidCredits,
          billingCycle: planId === "free" ? "monthly" : billingCycle,
          expiresAt: expiresAt ? expiresAt.toISOString() : null,
          resetAt: now.toISOString(),
        });
    }

    const { data, error } = await query.select().single();

    if (error) {
      logger.error("[credits] POST update error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    logger.info(`[credits] Plan updated successfully for user ${user.email} -> ${planId} (${paidCredits} credits)`);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    logger.error("[credits] POST unhandled error:", error?.message);
    return NextResponse.json(
      { error: "Internal server error during plan upgrade." },
      { status: 500 }
    );
  }
}

