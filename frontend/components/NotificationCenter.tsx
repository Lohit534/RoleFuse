"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { CreditInfo, isOwnerEmail } from "@/types";
import { useUpgradeModalStore } from "@/store/useUpgradeModalStore";
import {
  Bell,
  X,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
  Tag,
  Zap,
  Info,
} from "lucide-react";

export interface AppNotification {
  id: string;
  type: "upgrade" | "expiring" | "info" | "offer" | "update" | "alert" | "general";
  title: string;
  message: string;
  tag?: string;
  highlightNumber?: string;
  actionText?: string;
  actionHref?: string;
  actionOnClick?: () => void;
  dateStr?: string;
  isBroadcast?: boolean;
}

interface NotificationBellProps {
  credits: CreditInfo | null;
  userEmail?: string | null;
  compact?: boolean;
}

/**
 * Derives notifications based on user's current plan and expiry status.
 *
 * Rules:
 *  - Paid users expiring within 24 hours (<= 24 hrs): "Plan expiring soon, please renew/upgrade" notification.
 *  - Free users: Monthly once "Upgrade to best features" notification.
 *  - Premiere Pro (Premium Pro) users: Monthly once "Upgrade to best features (Pro Max)" notification.
 *  - Pro Max users with healthy plan: NO upgrade notifications.
 *  - Owner: NO upgrade/expiry notifications.
 */
export function getActiveNotifications(
  credits: CreditInfo | null,
  userEmail?: string | null,
  dismissedIds: string[] = []
): AppNotification[] {
  if (!credits) return [];

  const isOwner = credits.isOwner || isOwnerEmail(userEmail || undefined);
  if (isOwner) return [];

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, "0")}`;
  const planId = (credits.planId || "free").toLowerCase();
  const isPaid = planId === "premium" || planId === "promax" || (credits.paidCredits && credits.paidCredits > 0);

  const notifications: AppNotification[] = [];

  // Check 24-hour expiration for paid plans
  if (isPaid && credits.expiresAt) {
    const expiry = new Date(credits.expiresAt);
    const diffMs = expiry.getTime() - now.getTime();

    // Trigger notification before 24 hours (diffMs > 0 && diffMs <= 24 * 60 * 60 * 1000)
    if (diffMs > 0 && diffMs <= 24 * 60 * 60 * 1000) {
      const diffHours = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));
      const notifId = `expiring_24h_${planId}_${expiry.toISOString().slice(0, 10)}`;
      if (!dismissedIds.includes(notifId)) {
        const planTitle = planId === "promax" ? "Pro Max" : "Premium Pro";
        const formattedDate = expiry.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        notifications.push({
          id: notifId,
          type: "expiring",
          title: `${planTitle} Plan Expiring in ${diffHours <= 1 ? "1 Hour" : `${diffHours} Hours`}`,
          message: `Your ${planTitle} subscription expires within 24 hours (${diffHours <= 1 ? "in less than an hour" : `in ${diffHours} hours`} on ${formattedDate}). Renew or upgrade now to keep your ATS optimizations and downloads active.`,
          actionText: "Renew Plan",
          actionHref: "/dashboard/pricing",
          dateStr: "Expiring Today",
        });
      }
    }
  }

  // Monthly upgrade notification for Premiere Pro users
  if (planId === "premium") {
    const notifId = `premium_upgrade_promax_${currentMonthKey}`;
    if (!dismissedIds.includes(notifId)) {
      notifications.push({
        id: notifId,
        type: "upgrade",
        title: "Upgrade to Best Features (Pro Max)",
        message: "Unlock RoleFuse's best features! Upgrade to Pro Max for unlimited AI resume optimizations, highest ATS score accuracy, and priority exports.",
        actionText: "Upgrade to Best Features",
        actionHref: "/dashboard/pricing",
        dateStr: "Monthly Highlight",
      });
    }
  }

  // Monthly upgrade notification for Free plan users
  if (!isPaid) {
    const notifId = `free_upgrade_${currentMonthKey}`;
    if (!dismissedIds.includes(notifId)) {
      notifications.push({
        id: notifId,
        type: "upgrade",
        title: "Upgrade to Best Features",
        message: "Unlock 20 monthly AI optimizations, full PDF & DOCX downloads, AI cover letters, and career roadmaps.",
        actionText: "Upgrade to Best Features",
        actionHref: "/dashboard/pricing",
        dateStr: "Monthly Highlight",
      });
    }
  }

  return notifications;
}

export function hasUnreadNotifications(credits: CreditInfo | null, userEmail?: string | null): boolean {
  if (!credits) return false;
  let dismissedIds: string[] = [];
  try {
    const stored = typeof window !== "undefined" ? localStorage.getItem("fastHire_dismissed_notifications") : null;
    if (stored) dismissedIds = JSON.parse(stored);
  } catch {
    // Ignore
  }

  // Check cached broadcasts count
  let unreadBroadcastCount = 0;
  try {
    const cachedBc = typeof window !== "undefined" ? localStorage.getItem("fastHire_cached_broadcasts") : null;
    if (cachedBc) {
      const list = JSON.parse(cachedBc);
      if (Array.isArray(list)) {
        unreadBroadcastCount = list.filter((b: any) => !dismissedIds.includes(b.id)).length;
      }
    }
  } catch {}

  return getActiveNotifications(credits, userEmail, dismissedIds).length + unreadBroadcastCount > 0;
}

export function NotificationBell({ credits, userEmail, compact = false }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [broadcasts, setBroadcasts] = useState<AppNotification[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load dismissed notifications from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("fastHire_dismissed_notifications");
      if (stored) {
        setDismissedIds(JSON.parse(stored));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Fetch live admin broadcasts with 30s auto-refresh
  useEffect(() => {
    let isMounted = true;
    async function loadBroadcasts() {
      try {
        const res = await fetch(`/api/notifications/broadcast?t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && Array.isArray(data.broadcasts)) {
          const mapped: AppNotification[] = data.broadcasts.map((b: any) => ({
            id: b.id,
            type: b.category || "general",
            title: b.title,
            message: b.message,
            tag: b.tag,
            highlightNumber: b.highlightNumber,
            actionText: b.actionText,
            actionHref: b.actionHref,
            dateStr: b.createdAt ? new Date(b.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : undefined,
            isBroadcast: true,
          }));
          setBroadcasts(mapped);
          try {
            localStorage.setItem("fastHire_cached_broadcasts", JSON.stringify(mapped));
          } catch {}
        }
      } catch {
        // silent fail
      }
    }
    loadBroadcasts();
    const interval = setInterval(loadBroadcasts, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Also refresh immediately whenever user clicks/opens the bell
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    fetch(`/api/notifications/broadcast?t=${Date.now()}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data && Array.isArray(data.broadcasts)) {
          const mapped: AppNotification[] = data.broadcasts.map((b: any) => ({
            id: b.id,
            type: b.category || "general",
            title: b.title,
            message: b.message,
            tag: b.tag,
            highlightNumber: b.highlightNumber,
            actionText: b.actionText,
            actionHref: b.actionHref,
            dateStr: b.createdAt ? new Date(b.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : undefined,
            isBroadcast: true,
          }));
          setBroadcasts(mapped);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Handle outside click to close popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const planNotifications = getActiveNotifications(credits, userEmail, dismissedIds);
  const activeBroadcasts = broadcasts.filter((b) => !dismissedIds.includes(b.id));
  const allNotifications = [...activeBroadcasts, ...planNotifications];
  const unreadCount = allNotifications.length;

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    try {
      localStorage.setItem("fastHire_dismissed_notifications", JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = [...dismissedIds, ...allNotifications.map((n) => n.id)];
    setDismissedIds(updated);
    try {
      localStorage.setItem("fastHire_dismissed_notifications", JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  return (
    <div className="relative inline-flex items-center" ref={containerRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="View notifications"
        className={`relative rounded-xl flex items-center justify-center transition-all cursor-pointer ${
          compact
            ? "h-7 w-7 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            : "h-9 w-9 text-slate-600 hover:text-slate-900 border border-slate-200/90 bg-white hover:bg-slate-50 shadow-xs"
        }`}
      >
        <Bell className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center pointer-events-none">
            <span className="h-4 min-w-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white shadow-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Notifications Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[320px] sm:w-[360px] bg-white text-slate-800 border border-slate-200 rounded-2xl shadow-xl p-3 space-y-2 select-none z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-teal-50 border border-teal-200 text-[#0d6e5a] text-[9px] font-extrabold px-1.5 py-0.2 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[10px] text-slate-400 hover:text-slate-700 font-semibold transition-colors cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Notifications List */}
          {allNotifications.length === 0 ? (
            <div className="py-6 text-center space-y-1">
              <div className="h-8 w-8 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center mx-auto text-[#0d6e5a]">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <p className="text-xs font-bold text-slate-800">You're all caught up!</p>
              <p className="text-[10px] text-slate-400">No unread notifications at this time.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-0.5">
              {allNotifications.map((notif) => {
                const isOffer = notif.type === "offer";
                const isUpdate = notif.type === "update";
                const isAlert = notif.type === "alert" || notif.type === "expiring";

                return (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-xl border transition-all relative ${
                      isOffer
                        ? "bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-amber-50/40 border-amber-300/80 shadow-2xs"
                        : isUpdate
                        ? "bg-gradient-to-br from-teal-50/90 via-emerald-50/40 to-teal-50/30 border-teal-300/80 shadow-2xs"
                        : isAlert
                        ? "bg-rose-50/70 border-rose-200/80 text-rose-950"
                        : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  >
                    {/* Delete (X) button */}
                    <button
                      type="button"
                      onClick={(e) => handleDismiss(notif.id, e)}
                      aria-label="Delete message"
                      className="absolute top-2 right-2 text-slate-400 hover:text-slate-700 p-0.5 rounded-md hover:bg-slate-200/50 transition-colors cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>

                    <div className="flex items-start gap-2.5 pr-5">
                      <div
                        className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isOffer
                            ? "bg-amber-100 text-amber-800 shadow-2xs"
                            : isUpdate
                            ? "bg-[#087F6E] text-white shadow-2xs"
                            : isAlert
                            ? "bg-rose-100 text-rose-700"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {isOffer ? (
                          <Tag className="h-3.5 w-3.5" />
                        ) : isUpdate ? (
                          <Zap className="h-3.5 w-3.5" />
                        ) : isAlert ? (
                          <AlertTriangle className="h-3.5 w-3.5" />
                        ) : (
                          <Info className="h-3.5 w-3.5" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1.5">
                        {/* Header Tags & Highlight */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {notif.tag && (
                            <span
                              className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                                isOffer
                                  ? "bg-amber-200/80 text-amber-900"
                                  : isUpdate
                                  ? "bg-teal-100 text-[#087F6E]"
                                  : "bg-slate-200 text-slate-800"
                              }`}
                            >
                              {notif.tag}
                            </span>
                          )}
                          {notif.highlightNumber && (
                            <span className="text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded-md">
                              {notif.highlightNumber}
                            </span>
                          )}
                          {notif.dateStr && (
                            <span className="text-[9px] text-slate-400 font-semibold ml-auto">
                              {notif.dateStr}
                            </span>
                          )}
                        </div>

                        <div className="text-xs font-black text-slate-900 leading-snug">
                          {notif.title}
                        </div>

                        <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                          {notif.message}
                        </p>

                        {notif.actionText && notif.actionHref && (
                          <div className="pt-1">
                            <Link
                              href={notif.actionHref}
                              onClick={() => setIsOpen(false)}
                              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                                isOffer
                                  ? "bg-amber-600 hover:bg-amber-700 text-white shadow-2xs"
                                  : isUpdate
                                  ? "bg-[#087F6E] hover:bg-[#065F53] text-white shadow-2xs"
                                  : "bg-slate-900 hover:bg-slate-800 text-white"
                              }`}
                            >
                              <span>{notif.actionText}</span>
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Monthly One-Time Popup Notification.
 *
 * Rules:
 *  - Paid Users expiring within 24 hours: Shows 24-hr urgent expiry popup ("Your plan expires in less than 24 hours").
 *  - Free Users: One popup per month highlighting Pro features and "Upgrade to Best Features" option.
 *  - Premiere Pro Users: One popup per month highlighting Pro Max features and "Upgrade to Best Features" option.
 *  - Pro Max Users with healthy plan: NEVER show upgrade popups.
 *  - Owners: NEVER show popups.
 *  - Dismissal is saved to localStorage per month / per expiry cycle so users are never spammed.
 */
export function MonthlyNotificationModal({
  credits,
  userEmail,
}: {
  credits: CreditInfo | null;
  userEmail?: string | null;
}) {
  const [showModal, setShowModal] = useState(false);
  const [modalDismissKey, setModalDismissKey] = useState<string>("");
  const [modalData, setModalData] = useState<{
    title: string;
    description: string;
    badge: string;
    actionText: string;
    actionHref: string;
    isExpiring?: boolean;
    features?: string[];
  } | null>(null);

  useEffect(() => {
    if (!credits) return;

    const isOwner = credits.isOwner || isOwnerEmail(userEmail || undefined);
    if (isOwner) return;

    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthlyStorageKey = `fastHire_monthly_popup_${currentMonthKey}`;

    const planId = (credits.planId || "free").toLowerCase();
    const isPaid = planId === "premium" || planId === "promax" || (credits.paidCredits && credits.paidCredits > 0);

    // 1. Check if paid plan is expiring within 24 hours (before 24 hrs)
    if (isPaid && credits.expiresAt) {
      const expiry = new Date(credits.expiresAt);
      const diffMs = expiry.getTime() - now.getTime();

      // Trigger if expiring in 24 hours or less (diffMs > 0 && diffMs <= 24 * 60 * 60 * 1000)
      if (diffMs > 0 && diffMs <= 24 * 60 * 60 * 1000) {
        const expiryKey = `fastHire_expiring_24h_${expiry.toISOString().slice(0, 10)}`;
        try {
          if (!localStorage.getItem(expiryKey)) {
            const diffHours = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));
            const planTitle = planId === "promax" ? "Pro Max" : "Premium Pro";
            const formattedDate = expiry.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            setModalDismissKey(expiryKey);
            setModalData({
              badge: "EXPIRES IN 24 HOURS",
              title: `Your ${planTitle} Plan Expires in ${diffHours <= 1 ? "1 hour" : `${diffHours} hours`}`,
              description: `You have ${diffHours <= 1 ? "less than an hour" : `${diffHours} hours`} left on your current billing cycle (${formattedDate}). Renew or upgrade now to keep your ATS optimizations, high-scoring bullet improvers, and exports active without disruption.`,
              actionText: "Renew / Upgrade Plan",
              actionHref: "/dashboard/pricing",
              isExpiring: true,
            });
            setShowModal(true);
            return;
          }
        } catch {
          // ignore storage errors
        }
      }
    }

    // Unsolicited auto-marketing popups disabled as requested by user.
    // Users can access upgrade options cleanly from Pricing page or Notification center.
  }, [credits, userEmail]);

  const handleClose = () => {
    setShowModal(false);
    if (modalDismissKey) {
      try {
        localStorage.setItem(modalDismissKey, "dismissed");
      } catch {
        // Ignore
      }
    }
  };

  if (!showModal || !modalData) return null;

  return (
    <div className="hidden sm:flex fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 select-none relative">
        {/* Close (X) button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close monthly notification"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Badge & Icon */}
        <div className="flex items-center gap-3">
          <div
            className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 border ${
              modalData.isExpiring
                ? "bg-amber-50 border-amber-200 text-amber-600"
                : "bg-teal-50 border-teal-200 text-[#0d6e5a]"
            }`}
          >
            {modalData.isExpiring ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <ShieldCheck className="h-5 w-5" />
            )}
          </div>
          <div>
            <span
              className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                modalData.isExpiring
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-teal-50 text-[#0d6e5a] border-teal-200"
              }`}
            >
              {modalData.badge}
            </span>
            <h3 className="font-extrabold text-slate-900 text-base mt-1 leading-snug">
              {modalData.title}
            </h3>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          {modalData.description}
        </p>

        {/* Feature Highlights for Free & Premiere Pro Users */}
        {!modalData.isExpiring && modalData.features && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5 text-xs text-slate-700">
            {modalData.features.map((feature, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#0d6e5a] shrink-0" />
                <span className="font-medium text-[11px]">{feature}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-600 hover:text-slate-900 text-xs font-semibold px-4 h-9 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Dismiss
          </button>
          <Link
            href={modalData.actionHref}
            onClick={handleClose}
            className="bg-[#0d6e5a] hover:bg-[#094d3f] text-white text-xs font-bold px-4 h-9 rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>{modalData.actionText}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
