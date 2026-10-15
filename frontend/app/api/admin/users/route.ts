import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { isOwnerEmail, PRO_CREDITS_PER_MONTH, PRO_MAX_CREDITS_PER_MONTH } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isOwner = isOwnerEmail(user.email);
    if (!isOwner) {
      logger.warn(`Unauthorized access attempt to GET /api/admin/users by ${user.email}`);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = getAdminClient() as any;

    // 1. Fetch all auth users from Supabase Auth (the absolute source of truth for accounts in Supabase)
    let authUsers: any[] = [];
    try {
      const { data: authData, error: authErr } = await admin.auth.admin.listUsers();
      if (!authErr && Array.isArray(authData?.users)) {
        authUsers = authData.users;
      }
    } catch (authErr: any) {
      logger.warn("[admin/users] auth.admin.listUsers error:", authErr.message);
    }

    // 2. Fetch all users from User table
    const { data: dbUsers, error: usersErr } = await admin
      .from("User")
      .select("id, email, name, createdAt")
      .order("createdAt", { ascending: false });

    let rawDbUsers: any[] = dbUsers ? [...dbUsers] : [];
    const dbUserMap = new Map<string, any>();
    for (const u of rawDbUsers) {
      if (u.id) dbUserMap.set(u.id, u);
      if (u.email) dbUserMap.set(u.email.toLowerCase().trim(), u);
    }

    let usersList: any[] = [];

    // 3. Reconcile with Supabase Auth:
    // If Supabase Auth returns active users (e.g. only 2 users), ONLY display those 2 users.
    if (authUsers.length > 0) {
      const validAuthIds = new Set(authUsers.map((u: any) => u.id));
      const validAuthEmails = new Set(authUsers.map((u: any) => (u.email || "").toLowerCase().trim()).filter(Boolean));

      // Asynchronously purge orphaned DB records for users who were deleted from Supabase
      const orphanedUsers = rawDbUsers.filter((u: any) => {
        const emailLower = (u.email || "").toLowerCase().trim();
        return !validAuthIds.has(u.id) && !validAuthEmails.has(emailLower) && !isOwnerEmail(u.email);
      });

      for (const orphan of orphanedUsers) {
        admin.from("Credit").delete().eq("userId", orphan.id).catch(() => {});
        admin.from("Resume").delete().eq("userId", orphan.id).catch(() => {});
        admin.from("User").delete().eq("id", orphan.id).catch(() => {});
      }

      for (const au of authUsers) {
        const auEmail = (au.email || "").toLowerCase().trim();
        const dbMatch = dbUserMap.get(au.id) || (auEmail ? dbUserMap.get(auEmail) : null);
        usersList.push({
          id: au.id,
          email: au.email || dbMatch?.email || "",
          name: au.user_metadata?.full_name || dbMatch?.name || au.email?.split("@")[0] || null,
          createdAt: au.created_at || dbMatch?.createdAt || new Date().toISOString(),
        });
      }
    } else {
      usersList = rawDbUsers;
    }

    // 4. Query all real payments from PaymentLog (isFreeGrant=false ensures no admin grants slip in)
    const { data: allPayments } = await admin
      .from("PaymentLog")
      .select("userId, email, planId")
      .or("isFreeGrant.is.null,isFreeGrant.eq.false");

    const paymentsList = allPayments || [];

    const proMaxPurchasers = paymentsList.filter((p: any) => p.planId === "promax");
    const proMaxUserIds = new Set(proMaxPurchasers.map((p: any) => p.userId).filter(Boolean));
    const proMaxEmails = new Set(proMaxPurchasers.map((p: any) => (p.email || "").toLowerCase().trim()).filter(Boolean));

    // Build sets for premium (paid, non-promax) purchasers
    const premiumPurchasers = paymentsList.filter((p: any) => p.planId === "premium");
    const premiumUserIds = new Set(premiumPurchasers.map((p: any) => p.userId).filter(Boolean));
    const premiumEmails = new Set(premiumPurchasers.map((p: any) => (p.email || "").toLowerCase().trim()).filter(Boolean));

    // 5. Fetch all credits
    const { data: credits, error: creditsErr } = await admin
      .from("Credit")
      .select("*");

    const creditsList: any[] = credits ? [...credits] : [];

    // 6. User and plan expiration evaluation
    // Determine early promotional adopters (First 50 registered users get 1 year free Premium Pro)
    const sortedByCreated = [...usersList].sort((a, b) => 
      new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
    );
    const first50UserIds = new Set(sortedByCreated.slice(0, 50).map(u => u.id));

    // 7. Merge users and credits with accurate expiration checking
    const merged = usersList.map((u: any) => {
      const userEmail = (u.email || "").toLowerCase().trim();
      const credit = creditsList.find((c: any) => c.userId === u.id) || {
        freeUsed: 0,
        paidCredits: 0,
        billingCycle: "monthly",
        expiresAt: null,
      };

      const now = new Date();
      const expiresAtDate = credit.expiresAt ? new Date(credit.expiresAt) : null;
      const isExpired = expiresAtDate && now >= expiresAtDate && credit.billingCycle !== "admin_promax" && credit.billingCycle !== "admin_premium";

      const isKnownProMax = !isExpired && (proMaxUserIds.has(u.id) || proMaxEmails.has(userEmail));
      const isKnownPremium = !isExpired && !isKnownProMax && (premiumUserIds.has(u.id) || premiumEmails.has(userEmail));
      const isEarlyPromotional = !isExpired && !isOwnerEmail(u.email) && !isKnownProMax && (first50UserIds.has(u.id) || usersList.length <= 50);

      // Determine plan tier:
      // Priority: Owner > Expired (revert to Free) > Admin Selection > Pro Max > Premium Pro > Free Tier
      let plan = "free";
      if (isOwnerEmail(u.email)) {
        plan = "owner";
      } else if (isExpired || credit.billingCycle === "admin_free" || credit.billingCycle === "free") {
        plan = "free";
      } else if (credit.billingCycle === "admin_promax") {
        plan = "promax";
      } else if (credit.billingCycle === "admin_premium") {
        plan = "premium";
      } else if (isKnownProMax || (credit.paidCredits >= 90 && !isExpired)) {
        plan = "promax";
      } else if (isKnownPremium || (credit.paidCredits > 0 && !isExpired) || isEarlyPromotional) {
        plan = "premium";
      } else {
        plan = "free";
      }

      // Auto-heal expired plans in database
      if (isExpired && credit.paidCredits > 0) {
        admin.from("Credit").update({ paidCredits: 0, expiresAt: null, billingCycle: "monthly" }).eq("userId", u.id).catch(() => {});
        credit.paidCredits = 0;
        credit.expiresAt = null;
      }

      // If user is early promotional and had no Credit record or 0 credits, persist it
      if (!isExpired && isEarlyPromotional && (!credit.id || credit.paidCredits === 0) && credit.billingCycle !== "admin_free" && credit.billingCycle !== "free") {
        admin.from("Credit").upsert({
          id: "credit-" + u.id.slice(0, 8),
          userId: u.id,
          freeUsed: credit.freeUsed ?? 0,
          paidCredits: PRO_CREDITS_PER_MONTH,
          billingCycle: "yearly",
          resetAt: u.createdAt || new Date().toISOString(),
        }, { onConflict: "userId" }).catch(() => {});
      }

      const displayCredits = plan === "owner" 
        ? 999999 
        : plan === "promax" 
          ? (credit.paidCredits >= 90 ? credit.paidCredits : 90) 
          : plan === "premium" 
            ? (credit.paidCredits > 0 ? credit.paidCredits : PRO_CREDITS_PER_MONTH) 
            : 0;

      return {
        ...u,
        plan,
        freeUsed: credit.freeUsed ?? 0,
        paidCredits: displayCredits,
        billingCycle: plan === "promax" ? "monthly" : (credit.billingCycle || "monthly"),
        expiresAt: isExpired ? null : (credit.expiresAt || null),
      };
    });

    // Fetch optimizations count
    const { count: totalOptimizations } = await admin
      .from("Resume")
      .select("id", { count: "exact", head: true })
      .neq("jobTitle", "SUPPORT_TICKET");

    // Fetch tickets count
    const { count: totalTickets } = await admin
      .from("Resume")
      .select("id", { count: "exact", head: true })
      .eq("jobTitle", "SUPPORT_TICKET");

    // ── Real revenue from PaymentLog ──────────────────────────────────────────
    // Only real Razorpay payments (isFreeGrant = false)
    const { data: paymentLogs, error: paymentErr } = await admin
      .from("PaymentLog")
      .select("*")
      .or("isFreeGrant.is.null,isFreeGrant.eq.false")
      .order("createdAt", { ascending: false })
      .limit(50);

    let totalRevenue = 0;
    let paidCount = 0;
    const recentPayments: any[] = [];

    if (!paymentErr && paymentLogs) {
      // Sum all real payments
      totalRevenue = paymentLogs.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      // Count unique paying users
      const uniquePayers = new Set(paymentLogs.map((p: any) => p.userId));
      paidCount = uniquePayers.size;
      // Last 20 for display
      recentPayments.push(
        ...paymentLogs.slice(0, 20).map((p: any) => ({
          id: p.razorpayPaymentId,
          email: p.email,
          planId: p.planId,
          billingCycle: p.billingCycle,
          amount: p.amount,
          createdAt: p.createdAt,
        }))
      );
    } else if (paymentErr) {
      // PaymentLog table may not exist yet — gracefully return zeros
      logger.warn("[admin/users] PaymentLog query failed (table may not exist yet):", paymentErr.message);
    }

    return NextResponse.json({
      users: merged,
      analytics: {
        totalOptimizations: totalOptimizations || 0,
        totalTickets: totalTickets || 0,
        totalRevenue,
        paidCount,
        recentPayments,
      }
    });
  } catch (error: any) {
    logger.error("[admin/users] GET unhandled error:", error.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isOwner = isOwnerEmail(user.email);
    if (!isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { targetUserId, planId } = body;

    if (!targetUserId || !planId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const admin = getAdminClient() as any;

    // Check if target user exists in database, or auto-sync from Supabase Auth admin
    let targetUserData = null;
    const { data: dbUser } = await admin
      .from("User")
      .select("id, email")
      .eq("id", targetUserId)
      .maybeSingle();

    targetUserData = dbUser;

    if (!targetUserData) {
      try {
        const { data: authUser } = await admin.auth.admin.getUserById(targetUserId);
        if (authUser?.user) {
          const syncUser = {
            id: targetUserId,
            email: authUser.user.email,
            name: authUser.user.user_metadata?.full_name || authUser.user.email?.split("@")[0] || null,
            createdAt: authUser.user.created_at || new Date().toISOString(),
          };
          await admin.from("User").upsert(syncUser, { onConflict: "id" }).catch(() => {});
          targetUserData = syncUser;
        }
      } catch (lookupErr: any) {
        logger.warn("[admin/users] User fallback lookup notice:", lookupErr?.message);
      }
    }

    const targetEmail = (targetUserData?.email || "").toLowerCase().trim();

    if (isOwnerEmail(targetEmail)) {
      logger.warn(`[admin/users] Blocked attempt to change Owner user ${targetEmail} (${targetUserId})`);
      return NextResponse.json({ 
        error: "Owner account cannot be modified." 
      }, { status: 403 });
    }

    // Map planId to paidCredits, cycleTag, and expiration
    let paidCredits = 0;
    let cycleTag = "monthly";
    let expiresAt: string | null = null;

    if (planId === "free") {
      paidCredits = 0;
      cycleTag = "admin_free";
      expiresAt = null;
    } else if (planId === "premium") {
      paidCredits = PRO_CREDITS_PER_MONTH; // 20
      cycleTag = "admin_premium";
      expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    } else if (planId === "promax") {
      paidCredits = PRO_MAX_CREDITS_PER_MONTH; // 90
      cycleTag = "admin_promax";
      expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    const now = new Date();

    // Fetch existing credit row to avoid not-null primary key constraint failures
    const { data: existingCredit } = await admin
      .from("Credit")
      .select("id")
      .eq("userId", targetUserId)
      .maybeSingle();

    let updateError: any = null;

    if (existingCredit) {
      const { error } = await admin
        .from("Credit")
        .update({
          paidCredits: paidCredits,
          billingCycle: cycleTag,
          resetAt: now.toISOString(),
          expiresAt: expiresAt,
        })
        .eq("userId", targetUserId);
      updateError = error;
    } else {
      const newId = "credit-" + targetUserId.slice(0, 8);
      const { error } = await admin
        .from("Credit")
        .insert({
          id: newId,
          userId: targetUserId,
          freeUsed: 0,
          paidCredits: paidCredits,
          billingCycle: cycleTag,
          resetAt: now.toISOString(),
          expiresAt: expiresAt,
        });
      updateError = error;
    }

    if (updateError) {
      logger.error("[admin/users] POST update plan failed:", updateError.message);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    try {
      if (admin?.auth?.admin?.updateUserById) {
        await admin.auth.admin.updateUserById(targetUserId, {
          user_metadata: { plan: planId },
        });
      }
    } catch (metaErr: any) {
      logger.warn("[admin/users] updateUserById notice:", metaErr?.message);
    }

    logger.info(`[admin/users] Plan modified by admin: targetUserId=${targetUserId} to plan=${planId} (paidCredits=${paidCredits})`);
    return NextResponse.json({ success: true, planId, paidCredits });
  } catch (error: any) {
    logger.error("[admin/users] POST unhandled error:", error.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const PATCH = POST;

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isOwnerEmail(user.email)) {
      return NextResponse.json({ error: "Forbidden: Owner access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("userId") || searchParams.get("id");
    if (!targetUserId) {
      return NextResponse.json({ error: "Missing target userId" }, { status: 400 });
    }

    const admin = getAdminClient() as any;

    // Check if target is owner/admin
    const { data: targetUser } = await admin
      .from("User")
      .select("email")
      .eq("id", targetUserId)
      .maybeSingle();

    if (targetUser?.email && isOwnerEmail(targetUser.email)) {
      return NextResponse.json({ error: "Owner account cannot be deleted." }, { status: 403 });
    }

    // Delete related records
    await admin.from("Credit").delete().eq("userId", targetUserId).catch(() => {});
    await admin.from("Resume").delete().eq("userId", targetUserId).catch(() => {});
    await admin.from("User").delete().eq("id", targetUserId).catch(() => {});

    // Delete from auth.users so it won't linger in Supabase Auth
    try {
      if (admin?.auth?.admin?.deleteUser) {
        await admin.auth.admin.deleteUser(targetUserId);
      }
    } catch (_e) {}

    logger.info(`[admin/users] User ${targetUserId} deleted by admin ${user.email}`);
    return NextResponse.json({ success: true, deletedUserId: targetUserId });
  } catch (error: any) {
    logger.error("[admin/users] DELETE unhandled error:", error.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
