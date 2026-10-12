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
} from "lucide-react";

export interface AppNotification {
  id: string;
  type: "upgrade" | "expiring" | "info";
  title: string;
  message: string;
  actionText?: string;
  actionHref?: string;
  actionOnClick?: () => void;
  dateStr?: string;
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
        message: "Unlock FastHire's best features! Upgrade to Pro Max for unlimited AI resume optimizations, highest ATS score accuracy, and priority exports.",
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
  return getActiveNotifications(credits, userEmail, dismissedIds).length > 0;
}

export function NotificationBell({ credits, userEmail, compact = false }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
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

  const activeNotifications = getActiveNotifications(credits, userEmail, dismissedIds);
  const unreadCount = activeNotifications.length;

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
    const updated = [...dismissedIds, ...activeNotifications.map((n) => n.id)];
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
          <span className="absolute top-1 right-1 flex items-center justify-center pointer-events-none">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 ring-1 ring-white shadow-xs" />
          </span>
        )}
      </button>

      {/* Notifications Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[300px] sm:w-[340px] bg-white text-slate-800 border border-slate-200 rounded-2xl shadow-xl p-3 space-y-2 select-none z-50 animate-in fade-in slide-in-from-top-2 duration-150">
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
          {activeNotifications.length === 0 ? (
            <div className="py-6 text-center space-y-1">
              <div className="h-8 w-8 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center mx-auto text-[#0d6e5a]">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <p className="text-xs font-bold text-slate-800">You're all caught up!</p>
              <p className="text-[10px] text-slate-400">No unread notifications at this time.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-0.5">
              {activeNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-2.5 rounded-xl border transition-all relative ${
                    notif.type === "expiring"
                      ? "bg-amber-50/70 border-amber-200/80 text-amber-950"
                      : "bg-teal-50/50 border-teal-200/70 text-slate-900"
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

                  <div className="flex items-start gap-2 pr-5">
                    <div
                      className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        notif.type === "expiring"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-teal-100 text-[#0d6e5a]"
                      }`}
                    >
                      {notif.type === "expiring" ? (
                        <AlertTriangle className="h-3.5 w-3.5" />
                      ) : (
                        <ShieldCheck className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-slate-900 leading-tight">
                          {notif.title}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-600 leading-relaxed font-medium">
                        {notif.message}
                      </p>
                      {notif.actionText && notif.actionHref && (
                        <div className="pt-1">
                          <Link
                            href={notif.actionHref}
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0d6e5a] hover:text-[#094d3f] hover:underline cursor-pointer"
                          >
                            <span>{notif.actionText}</span>
                            <ArrowRight className="h-2.5 w-2.5" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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

    // 2. Check if already dismissed monthly upgrade popup for this month
    try {
      const seen = localStorage.getItem(monthlyStorageKey);
      if (seen) return;
    } catch {
      return;
    }

    // 3. For Premiere Pro (Premium) users: Monthly once upgrade to Pro Max (best features)
    if (planId === "premium") {
      setModalDismissKey(monthlyStorageKey);
      setModalData({
        badge: "MONTHLY PRO MAX UPGRADE",
        title: "Upgrade to Best Features - Pro Max Tier",
        description: "Unlock FastHire's best features this month! Upgrade from Premium Pro to Pro Max for unlimited ATS resume optimizations, priority export speed, and executive Harvard templates.",
        actionText: "Upgrade to Best Features",
        actionHref: "/dashboard/pricing",
        isExpiring: false,
        features: [
          "Unlimited AI resume optimizations each month",
          "Highest ATS keyword & recruiter ranking power",
          "Priority DOCX & PDF generation with executive templates",
          "Dedicated cover letter & career roadmap generator",
        ],
      });
      setShowModal(true);
      return;
    }

    // 4. For Free plan users: Monthly once upgrade to Pro (best features)
    if (!isPaid) {
      setModalDismissKey(monthlyStorageKey);
      setModalData({
        badge: "MONTHLY PRO HIGHLIGHT",
        title: "Upgrade to Best Features - FastHire Pro",
        description: "Supercharge your job applications this month! Upgrade to access FastHire's best features: 20 monthly AI resume optimizations, full PDF and Word DOCX downloads, tailored cover letters, and custom career skill roadmaps.",
        actionText: "Upgrade to Best Features",
        actionHref: "/dashboard/pricing",
        isExpiring: false,
        features: [
          "20 AI optimizations every month",
          "Download Harvard & Modern ATS PDF & DOCX formats",
          "AI Cover Letters & tailored 90-day Skill Roadmaps",
          "Instant bullet improvement & scoring analysis",
        ],
      });
      setShowModal(true);
      return;
    }

    // Pro Max users with healthy plan: no upgrade popup
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
