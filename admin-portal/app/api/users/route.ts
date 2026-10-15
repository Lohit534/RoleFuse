import { NextRequest, NextResponse } from "next/server";
import { getAdminClient, getBackendUrl } from "@/lib/supabase";
import { verifyAdmin, isAdminEmail } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/users — list all users with synchronized plan status and accurate pricing credits
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const adminClient = getAdminClient(auth.token) as any;
    const now = new Date();

    // 1. Fetch all auth users from Supabase Auth (the definitive source of active accounts in Supabase)
    let authUsers: any[] = [];
    try {
      if (adminClient?.auth?.admin?.listUsers) {
        const { data: authData, error: authErr } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
        if (!authErr && Array.isArray(authData?.users)) {
          authUsers = authData.users;
        } else if (authErr) {
          console.warn("[users/GET] auth.admin.listUsers error:", authErr.message);
        }
      }
    } catch (authErr: any) {
      console.warn("[users/GET] auth.admin.listUsers exception:", authErr.message);
    }

    // 2. Fetch all User table records from database
    let dbUsers: any[] = [];
    const { data: dbUserRows, error: usersErr } = await adminClient
      .from("User")
      .select("id, email, name, createdAt")
      .order("createdAt", { ascending: false });

    if (!usersErr && Array.isArray(dbUserRows)) {
      dbUsers = dbUserRows;
    }

    const dbUserMap = new Map<string, any>();
    for (const u of dbUsers) {
      if (u.id) dbUserMap.set(u.id, u);
      if (u.email) dbUserMap.set(u.email.toLowerCase().trim(), u);
    }

    let mergedUsers: any[] = [];

    // 3. If Supabase Auth returned the active accounts (e.g. only 2 users):
    // Strictly respect Supabase Auth as the source of truth, and purge orphaned DB rows
    if (authUsers.length > 0) {
      const validAuthIds = new Set(authUsers.map((u: any) => u.id));
      const validAuthEmails = new Set(authUsers.map((u: any) => (u.email || "").toLowerCase().trim()).filter(Boolean));

      // Asynchronously purge orphaned DB records for users who were deleted from Supabase
      const orphanedUsers = dbUsers.filter((u: any) => {
        const emailLower = (u.email || "").toLowerCase().trim();
        return !validAuthIds.has(u.id) && !validAuthEmails.has(emailLower) && !isAdminEmail(u.email);
      });

      for (const orphan of orphanedUsers) {
        adminClient.from("Credit").delete().eq("userId", orphan.id).catch(() => {});
        adminClient.from("Resume").delete().eq("userId", orphan.id).catch(() => {});
        adminClient.from("User").delete().eq("id", orphan.id).catch(() => {});
      }

      // Merge ONLY active Supabase Auth users
      for (const au of authUsers) {
        const auEmail = (au.email || "").toLowerCase().trim();
        const dbMatch = dbUserMap.get(au.id) || (auEmail ? dbUserMap.get(auEmail) : null);
        mergedUsers.push({
          id: au.id,
          email: au.email || dbMatch?.email || "",
          name: au.user_metadata?.full_name || dbMatch?.name || au.email?.split("@")[0] || null,
          createdAt: au.created_at || dbMatch?.createdAt || now.toISOString(),
        });
      }
    } else {
      // Fallback if auth.admin.listUsers is unavailable
      mergedUsers = dbUsers.map((u: any) => ({
        id: u.id,
        email: u.email || "",
        name: u.name || u.email?.split("@")[0] || null,
        createdAt: u.createdAt || now.toISOString(),
      }));
    }

    // Sort by createdAt descending
    mergedUsers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 4. Fetch all credit records from "Credit" table
    let credits: any[] = [];
    const { data: dbCredits, error: creditsErr } = await adminClient
      .from("Credit")
      .select("*");

    if (!creditsErr && Array.isArray(dbCredits)) {
      credits = dbCredits;
    }

    // Map credit records by userId
    const creditMap: Record<string, any> = {};
    for (const c of credits) {
      creditMap[c.userId] = c;
    }

    // 4b. Fetch PaymentLog to cross-reference payment expiration dates
    const paymentMap: Record<string, any> = {};
    try {
      const { data: dbPayments } = await adminClient
        .from("PaymentLog")
        .select("*")
        .order("createdAt", { ascending: false });

      if (Array.isArray(dbPayments)) {
        for (const p of dbPayments) {
          if (p.userId && !paymentMap[p.userId]) paymentMap[p.userId] = p;
          if (p.email && !paymentMap[p.email.toLowerCase().trim()]) paymentMap[p.email.toLowerCase().trim()] = p;
        }
      }
    } catch (_pErr) {}

    // 5. Merge user profiles with exact database credits and official pricing plans
    const enriched = mergedUsers.map((u: any) => {
      const emailLower = (u.email || "").toLowerCase().trim();
      const cred = creditMap[u.id] || creditMap[emailLower] || {};
      const rawPaidCredits = cred.paidCredits ?? 0;
      const freeUsed = cred.freeUsed ?? 0;
      const planId = (cred.planId || "").toLowerCase();
      const billingCycle = cred.billingCycle || "monthly";

      const userPayment = paymentMap[u.id] || (u.email ? paymentMap[emailLower] : null);
      let paymentValidUntil: Date | null = null;
      if (userPayment) {
        const payDate = new Date(userPayment.createdAt);
        const isYearly = userPayment.billingCycle === "yearly" && userPayment.amount > 300;
        const days = isYearly ? 365 : 30;
        paymentValidUntil = new Date(payDate.getTime() + days * 24 * 60 * 60 * 1000);
      }

      let isExpired = false;
      if (cred.expiresAt) {
        const exp = new Date(cred.expiresAt);
        if (now >= exp) isExpired = true;
      } else if (paymentValidUntil) {
        if (now >= paymentValidUntil) isExpired = true;
      }

      const isRollover = typeof billingCycle === "string" && billingCycle.startsWith("rollover:");
      const rolloverCredits = isRollover ? (parseInt(billingCycle.split(":")[1]) || 0) : 0;
      if (isRollover) isExpired = true;

      // Auto-heal DB if user is expired but still has raw paid credits
      if (isExpired && rawPaidCredits > 0 && !isRollover && !isAdminEmail(u.email)) {
        const leftover = rawPaidCredits;
        const rolloverStr = `rollover:${leftover}`;
        adminClient.from("Credit").update({ paidCredits: 0, expiresAt: null, billingCycle: rolloverStr }).eq("userId", u.id).catch(() => {});
      }

      let plan: "owner" | "promax" | "premium" | "free" = "free";
      let displayPaidCredits = 0;

      if (isAdminEmail(u.email)) {
        plan = "owner";
        displayPaidCredits = 999999;
      } else if (isExpired || billingCycle === "admin_free" || billingCycle === "free") {
        plan = "free";
        displayPaidCredits = 0;
      } else if (billingCycle === "admin_promax" || (!isExpired && (rawPaidCredits >= 90 || planId === "promax" || userPayment?.planId === "promax"))) {
        plan = "promax";
        displayPaidCredits = rawPaidCredits >= 90 ? rawPaidCredits : 90;
      } else if (billingCycle === "admin_premium" || (!isExpired && (rawPaidCredits > 0 || planId === "premium" || billingCycle === "yearly" || userPayment?.planId === "premium"))) {
        plan = "premium";
        displayPaidCredits = rawPaidCredits > 0 ? rawPaidCredits : 20;
      } else {
        plan = "free";
        displayPaidCredits = 0;
      }

      return {
        ...u,
        plan,
        paidCredits: displayPaidCredits,
        rolloverCredits: isExpired ? rolloverCredits : 0,
        freeUsed,
        billingCycle,
        expiresAt: isExpired ? null : (cred.expiresAt || null),
      };
    });

    // 6. Fetch platform analytics
    let totalOptimizations = 0;
    let totalTickets = 0;

    try {
      const { count: optCount } = await adminClient
        .from("Resume")
        .select("id", { count: "exact", head: true })
        .neq("jobTitle", "SUPPORT_TICKET");
      totalOptimizations = optCount || 0;
    } catch {}

    try {
      const { count: tickCount } = await adminClient
        .from("Resume")
        .select("id", { count: "exact", head: true })
        .eq("jobTitle", "SUPPORT_TICKET");
      totalTickets = tickCount || 0;
    } catch {}

    const analytics = {
      totalOptimizations,
      totalTickets,
    };

    return NextResponse.json(
      { users: enriched, analytics },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (e: any) {
    console.error("[users/GET] Error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/users — modify a user's plan and credits in Supabase "Credit" table
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { targetUserId, planId, customCredits } = await request.json();
    if (!targetUserId || !planId) {
      return NextResponse.json({ error: "targetUserId and planId are required" }, { status: 400 });
    }

    const adminClient = getAdminClient(auth.token) as any;
    const now = new Date();

    // Fetch target user email to verify owner protection
    let targetEmail = "";
    try {
      const { data: dbUser } = await adminClient
        .from("User")
        .select("email")
        .eq("id", targetUserId)
        .maybeSingle();
      targetEmail = dbUser?.email || "";
    } catch {}

    if (!targetEmail) {
      // Try auth admin
      try {
        if (adminClient?.auth?.admin?.getUserById) {
          const { data: authUser } = await adminClient.auth.admin.getUserById(targetUserId);
          targetEmail = authUser?.user?.email || "";
        }
      } catch {}
    }

    if (isAdminEmail(targetEmail)) {
      return NextResponse.json({ error: "Owner account cannot be modified." }, { status: 403 });
    }

    // Map plan to exact pricing credits and cycle tags
    let paidCredits = 0;
    let billingCycle = "monthly";
    let expiresAt: string | null = null;

    if (customCredits !== undefined && Number(customCredits) >= 0) {
      paidCredits = Number(customCredits);
      billingCycle = paidCredits >= 90 ? "admin_promax" : paidCredits > 0 ? "admin_premium" : "admin_free";
      expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    } else if (planId === "free") {
      paidCredits = 0;
      billingCycle = "admin_free";
      expiresAt = null;
    } else if (planId === "premium") {
      paidCredits = 20;
      billingCycle = "admin_premium";
      expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
    } else if (planId === "promax") {
      paidCredits = 90;
      billingCycle = "admin_promax";
      expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    // Ensure target user exists in User table to satisfy foreign key constraint
    const { data: dbUser } = await adminClient
      .from("User")
      .select("id")
      .eq("id", targetUserId)
      .maybeSingle();

    if (!dbUser) {
      try {
        if (adminClient?.auth?.admin?.getUserById) {
          const { data: authUser } = await adminClient.auth.admin.getUserById(targetUserId);
          if (authUser?.user) {
            await adminClient.from("User").upsert({
              id: targetUserId,
              email: authUser.user.email,
              name: authUser.user.user_metadata?.full_name || authUser.user.email?.split("@")[0] || null,
              createdAt: authUser.user.created_at || now.toISOString(),
            }, { onConflict: "id" }).catch(() => {});
          }
        }
      } catch {}
    }

    const { data: existingCredit } = await adminClient
      .from("Credit")
      .select("id")
      .eq("userId", targetUserId)
      .maybeSingle();

    if (existingCredit?.id) {
      const { error } = await adminClient
        .from("Credit")
        .update({
          paidCredits: paidCredits,
          billingCycle: billingCycle,
          resetAt: now.toISOString(),
          expiresAt: expiresAt,
        })
        .eq("userId", targetUserId);
      if (error) throw error;
    } else {
      const newCreditId = "cred-" + targetUserId.slice(0, 12);
      const { error } = await adminClient
        .from("Credit")
        .insert({
          id: newCreditId,
          userId: targetUserId,
          freeUsed: 0,
          paidCredits: paidCredits,
          billingCycle: billingCycle,
          resetAt: now.toISOString(),
          expiresAt: expiresAt,
        });
      if (error) throw error;
    }

    // Also update Supabase auth user_metadata if available
    try {
      if (adminClient?.auth?.admin?.updateUserById) {
        await adminClient.auth.admin.updateUserById(targetUserId, {
          user_metadata: { plan: planId },
        });
      }
    } catch {}

    return NextResponse.json({ success: true, planId, paidCredits, billingCycle });
  } catch (e: any) {
    console.error("[users/POST] Error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const PATCH = POST;

export async function DELETE(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("userId") || searchParams.get("id");
    if (!targetUserId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const adminClient = getAdminClient(auth.token) as any;

    // Check if target is admin/owner
    const { data: targetUser } = await adminClient
      .from("User")
      .select("email")
      .eq("id", targetUserId)
      .maybeSingle();

    if (targetUser?.email && isAdminEmail(targetUser.email)) {
      return NextResponse.json({ error: "Owner account cannot be deleted." }, { status: 403 });
    }

    // Delete associated data from DB
    await adminClient.from("Credit").delete().eq("userId", targetUserId).catch(() => {});
    await adminClient.from("Resume").delete().eq("userId", targetUserId).catch(() => {});
    await adminClient.from("User").delete().eq("id", targetUserId).catch(() => {});

    // Delete from auth.users as well so it's completely cleaned up
    try {
      if (adminClient?.auth?.admin?.deleteUser) {
        await adminClient.auth.admin.deleteUser(targetUserId);
      }
    } catch (_e) {}

    return NextResponse.json({ success: true, deletedUserId: targetUserId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
