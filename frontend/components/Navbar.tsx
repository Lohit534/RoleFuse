"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useResumeStore } from "@/store/useResumeStore";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  LogOut,
  ChevronDown,
  Compass,
  History,
  CreditCard,
  HelpCircle,
  MessageSquare,
  Lock,
  FileText,
  Sparkles,
  DollarSign,
  Gift,
  Menu,
  X,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Search,
  LayoutTemplate,
  FileCheck,
  Type,
  Key,
  AlertTriangle,
  BookOpen,
  Bot,
  Target,
  Star,
} from "lucide-react";
import { CreditInfo } from "@/types";
import { toast } from "react-hot-toast";
import SupportChatbot from "@/components/SupportChatbot";

import FeedbackToast from "@/components/FeedbackToast";
import { ReferralModal } from "@/components/ReferralModal";
import { DemoVideoModal } from "@/components/DemoVideoModal";
import { DataPreferencesModal } from "@/components/DataPreferencesModal";
import UpgradePaywallModal from "@/components/UpgradePaywallModal";
import { useUpgradeModalStore } from "@/store/useUpgradeModalStore";
import {
  NotificationBell,
  MonthlyNotificationModal,
  hasUnreadNotifications,
} from "@/components/NotificationCenter";

interface NavbarProps {
  refreshKey?: number;
  hideNav?: boolean;
}

export default function Navbar({ refreshKey = 0, hideNav = false }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState<CreditInfo | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isReferralOpen, setIsReferralOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isDataPreferencesOpen, setIsDataPreferencesOpen] = useState(false);

  // Centered Middle Dropdown state
  const [activeMenu, setActiveMenu] = useState<"products" | "ats" | "resources" | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const productsNavRef = useRef<HTMLDivElement>(null);
  const atsNavRef = useRef<HTMLDivElement>(null);
  const resourcesNavRef = useRef<HTMLDivElement>(null);

  // Google Profile Picture extraction
  const userAvatarUrl =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    (user as any)?.identities?.[0]?.identity_data?.avatar_url ||
    (user as any)?.identities?.[0]?.identity_data?.picture ||
    null;

  // Determine if on landing page or public pages vs dashboard internal
  const isDashboardSubpage =
    pathname.startsWith("/dashboard") &&
    pathname !== "/dashboard/pricing";

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
    setActiveMenu(null);
  }, [pathname]);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleOpenDemo = () => setIsDemoModalOpen(true);
    const handleOpenDataPref = () => setIsDataPreferencesOpen(true);
    const handleOpenFeedback = () => setIsFeedbackOpen(true);
    window.addEventListener("open-demo-video", handleOpenDemo);
    window.addEventListener("open-data-preferences", handleOpenDataPref);
    window.addEventListener("open-feedback-toast", handleOpenFeedback);
    return () => {
      window.removeEventListener("open-demo-video", handleOpenDemo);
      window.removeEventListener("open-data-preferences", handleOpenDataPref);
      window.removeEventListener("open-feedback-toast", handleOpenFeedback);
    };
  }, []);

  // Sync auth state
  useEffect(() => {
    async function getSessionUser() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user) {
          setUser(sessionData.session.user);
        }
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          setUser(data.user);
        }
      } catch (err) {}
    }
    getSessionUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch credits
  useEffect(() => {
    if (!user) return;
    const userId = user.id;

    // Immediately load cached plan from localStorage to avoid UI flash
    const cachedPlan = localStorage.getItem(`fastHire_plan_${userId}`);
    if (cachedPlan === "premium" || cachedPlan === "promax" || cachedPlan === "owner") {
      const isOwnerCached = cachedPlan === "owner";
      const isProMaxCached = cachedPlan === "promax";
      setCredits(
        (prev) =>
          prev || {
            isOwner: isOwnerCached,
            paidCredits: isOwnerCached ? 999999 : isProMaxCached ? 90 : 20,
            freeRemaining: isOwnerCached ? 999999 : isProMaxCached ? 90 : 20,
            freeUsed: 0,
            resetAt: new Date().toISOString(),
            planId: cachedPlan,
          }
      );
    }

    async function fetchCredits() {
      try {
        const res = await fetch("/api/credits");
        if (res.ok) {
          const data = await res.json();
          setCredits(data);
          if (userId) {
            if (data.isOwner) {
              localStorage.setItem(`fastHire_plan_${userId}`, "owner");
            } else if (data.planId === "promax" && !data.isFirst50) {
              localStorage.setItem(`fastHire_plan_${userId}`, "promax");
            } else if (data.planId === "premium" || data.isFirst50) {
              localStorage.setItem(`fastHire_plan_${userId}`, "premium");
            } else {
              localStorage.setItem(`fastHire_plan_${userId}`, "free");
            }
          }
        }
      } catch (err) {}
    }
    fetchCredits();

    const handleCreditsUpdated = () => {
      fetchCredits();
    };
    window.addEventListener("credits-updated", handleCreditsUpdated);
    return () => {
      window.removeEventListener("credits-updated", handleCreditsUpdated);
    };
  }, [user, refreshKey]);

  // Click outside listener for profile and centered dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (
        productsNavRef.current &&
        !productsNavRef.current.contains(event.target as Node) &&
        atsNavRef.current &&
        !atsNavRef.current.contains(event.target as Node) &&
        resourcesNavRef.current &&
        !resourcesNavRef.current.contains(event.target as Node)
      ) {
        setActiveMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("fastHire_feedback_dismissed_login");
    }
    useResumeStore.getState().reset();
    setIsDropdownOpen(false);
    toast.success("Signed out successfully.");
    router.push("/");
    router.refresh();
  };

  const handleProtectedNavigate = async (path: string) => {
    setActiveMenu(null);
    let currentUser = user;
    if (!currentUser) {
      try {
        const { data } = await supabase.auth.getSession();
        currentUser = data?.session?.user ?? null;
      } catch (e) {}
    }
    if (!currentUser) {
      router.push(`/auth/login?redirect=${encodeURIComponent(path)}`);
    } else {
      router.push(path);
    }
  };

  // Nav links definitions for dashboard internal view
  const dashboardLinks = [
    { label: "Optimize", href: "/dashboard", icon: <Compass className="h-4 w-4" /> },
    { label: "Resumes", href: "/dashboard/resumes", icon: <FileText className="h-4 w-4" /> },
    { label: "Job Tracker", href: "/dashboard/job-tracker", icon: <Briefcase className="h-4 w-4" /> },
    { label: "History", href: "/dashboard/history", icon: <History className="h-4 w-4" /> },
    { label: "Pricing", href: "/dashboard/pricing", icon: <DollarSign className="h-4 w-4" /> },
  ];

  // Calculations for credit percentage and plan
  const isOwner = credits?.isOwner;
  const isProMax = !isOwner && credits?.planId === "promax" && !credits?.isFirst50;
  const isPremium =
    !isOwner && !isProMax && (credits?.planId === "premium" || credits?.isFirst50 || (credits?.paidCredits ?? 0) > 0);
  const totalFree = isOwner ? 9999 : isProMax ? 90 : isPremium ? 20 : 2;
  const freeRemaining = isOwner ? 9999 : Math.min(totalFree, credits?.freeRemaining ?? totalFree);

  const planLabel = isOwner
    ? "Owner Unlimited"
    : isProMax
    ? "Pro Max"
    : isPremium
    ? "Premium Pro"
    : "Free Career Tier";

  const creditsDisplay = isOwner ? "Unlimited" : `${freeRemaining} left`;

  return (
    <>
      <nav className="border-b border-[#DCE7E9] bg-white text-[#111827] sticky top-0 z-50 shadow-xs select-none">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Left: Brand logo & Navigation */}
            <div className="flex items-center gap-7">
              {/* Brand Logo */}
              <Link href="/" className="flex items-center gap-2 group select-none">
                <img
                  src="/logo.svg"
                  alt="RoleFuse Logo"
                  className="h-5 w-5 object-contain group-hover:scale-105 transition-transform"
                />
                <span className="font-heading font-black text-[19px] tracking-tight text-[#111827] leading-none">
                  RoleFuse
                </span>
              </Link>

              {/* ────────────────────────────────────────────────────────── */}
              {/* Desktop Navigation Links                                   */}
              {/* If on Public/Landing: Show 'Products, ATS Resume, Pricing, Resources' */}
              {/* If inside Dashboard: Show Dashboard sub-routes             */}
              {/* ────────────────────────────────────────────────────────── */}

              {!isDashboardSubpage ? (
                /* Public Navigation with Centered Middle Dropdowns (Teal, Black & White) */
                <div className="hidden md:flex items-center gap-1 h-16 ml-1">
                  {/* 1. Products (Hover Middle Box + Direct Link to /products) */}
                  <div
                    ref={productsNavRef}
                    className="relative"
                    onMouseEnter={() => setActiveMenu("products")}
                    onMouseLeave={() => setActiveMenu(null)}
                  >
                    <Link
                      href="/products"
                      className={`flex items-center gap-1 px-3 py-2 text-[14px] font-medium transition-colors cursor-pointer rounded-lg ${
                        pathname === "/products" || activeMenu === "products"
                          ? "text-[#087F6E] bg-teal-50 font-semibold"
                          : "text-[#526176] hover:text-[#111827] hover:bg-slate-50"
                      }`}
                    >
                      <span>Products</span>
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform duration-200 ${
                          activeMenu === "products" ? "rotate-180 text-[#087F6E]" : "text-slate-400"
                        }`}
                      />
                    </Link>

                    {/* Centered Middle Box */}
                    {activeMenu === "products" && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-[330px] bg-white border border-slate-200 rounded-2xl shadow-xl p-3 space-y-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                        <button
                          onClick={() => handleProtectedNavigate(user ? "/dashboard" : "/ats-optimizer")}
                          className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-teal-50 transition-colors text-left group cursor-pointer"
                        >
                          <div className="h-8 w-8 rounded-lg bg-teal-50 text-[#087F6E] flex items-center justify-center shrink-0 group-hover:bg-[#087F6E] group-hover:text-white transition-colors">
                            <Sparkles className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 group-hover:text-[#087F6E] transition-colors">
                              AI Resume Optimizer
                            </div>
                            <div className="text-[11px] text-slate-500 font-normal">
                              Tailor resume to target JD with AI.
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            setActiveMenu(null);
                            if (user) {
                              router.push("/dashboard");
                            } else {
                              router.push("/ats-checker");
                            }
                          }}
                          className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-teal-50 transition-colors text-left group cursor-pointer"
                        >
                          <div className="h-8 w-8 rounded-lg bg-teal-50 text-[#087F6E] flex items-center justify-center shrink-0 group-hover:bg-[#087F6E] group-hover:text-white transition-colors">
                            <Search className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 group-hover:text-[#087F6E] transition-colors">
                              ATS Resume Scanner
                            </div>
                            <div className="text-[11px] text-slate-500 font-normal">
                              Check ATS score &amp; missing keywords.
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => handleProtectedNavigate(user ? "/dashboard/resumes" : "/resume-builder")}
                          className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-teal-50 transition-colors text-left group cursor-pointer"
                        >
                          <div className="h-8 w-8 rounded-lg bg-teal-50 text-[#087F6E] flex items-center justify-center shrink-0 group-hover:bg-[#087F6E] group-hover:text-white transition-colors">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 group-hover:text-[#087F6E] transition-colors">
                              AI Resume Builder
                            </div>
                            <div className="text-[11px] text-slate-500 font-normal">
                              Build structured ATS-compliant resumes.
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => handleProtectedNavigate("/dashboard/job-tracker")}
                          className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-teal-50 transition-colors text-left group cursor-pointer"
                        >
                          <div className="h-8 w-8 rounded-lg bg-teal-50 text-[#087F6E] flex items-center justify-center shrink-0 group-hover:bg-[#087F6E] group-hover:text-white transition-colors">
                            <Briefcase className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 group-hover:text-[#087F6E] transition-colors">
                              Job Application Tracker
                            </div>
                            <div className="text-[11px] text-slate-500 font-normal">
                              Track applications in Kanban pipeline.
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => handleProtectedNavigate("/dashboard/history")}
                          className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-teal-50 transition-colors text-left group cursor-pointer"
                        >
                          <div className="h-8 w-8 rounded-lg bg-teal-50 text-[#087F6E] flex items-center justify-center shrink-0 group-hover:bg-[#087F6E] group-hover:text-white transition-colors">
                            <History className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 group-hover:text-[#087F6E] transition-colors">
                              Resume History &amp; Downloads
                            </div>
                            <div className="text-[11px] text-slate-500 font-normal">
                              Compare past scans &amp; re-download PDFs.
                            </div>
                          </div>
                        </button>

                        {/* Bottom Action Button for Products */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <Link href="/resume-builder" onClick={() => setActiveMenu(null)}>
                            <button
                              type="button"
                              className="bg-[#087F6E] hover:bg-[#065F53] text-white font-bold text-xs py-2 px-4 rounded-xl transition-all cursor-pointer shadow-xs"
                            >
                              Resume Builder
                            </button>
                          </Link>
                          <Link
                            href="/products"
                            onClick={() => setActiveMenu(null)}
                            className="text-xs font-semibold text-[#087F6E] hover:underline"
                          >
                            Explore All Products
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. ATS Resume (Hover Middle Box + Direct Link to /ats-resume) */}
                  <div
                    ref={atsNavRef}
                    className="relative"
                    onMouseEnter={() => setActiveMenu("ats")}
                    onMouseLeave={() => setActiveMenu(null)}
                  >
                    <Link
                      href="/ats-resume"
                      className={`flex items-center gap-1 px-3 py-2 text-[14px] font-medium transition-colors cursor-pointer rounded-lg ${
                        pathname === "/ats-resume" || activeMenu === "ats"
                          ? "text-[#087F6E] bg-teal-50 font-semibold"
                          : "text-[#526176] hover:text-[#111827] hover:bg-slate-50"
                      }`}
                    >
                      <span>ATS Resume</span>
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform duration-200 ${
                          activeMenu === "ats" ? "rotate-180 text-[#087F6E]" : "text-slate-400"
                        }`}
                      />
                    </Link>

                    {/* Centered Middle Box */}
                    {activeMenu === "ats" && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-[320px] bg-white border border-slate-200 rounded-2xl shadow-xl p-3 space-y-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                        <button
                          onClick={() => {
                            setActiveMenu(null);
                            if (user) {
                              router.push("/dashboard");
                            } else {
                              router.push("/ats-checker");
                            }
                          }}
                          className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-teal-50 transition-colors text-left group cursor-pointer"
                        >
                          <div className="h-8 w-8 rounded-lg bg-teal-50 text-[#087F6E] flex items-center justify-center shrink-0 group-hover:bg-[#087F6E] group-hover:text-white transition-colors">
                            <Search className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 group-hover:text-[#087F6E] transition-colors">
                              Resume Scanner
                            </div>
                            <div className="text-[11px] text-slate-500 font-normal">
                              Test resume against ATS filters.
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => handleProtectedNavigate(user ? "/dashboard/resumes" : "/resume-builder")}
                          className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-teal-50 transition-colors text-left group cursor-pointer"
                        >
                          <div className="h-8 w-8 rounded-lg bg-teal-50 text-[#087F6E] flex items-center justify-center shrink-0 group-hover:bg-[#087F6E] group-hover:text-white transition-colors">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 group-hover:text-[#087F6E] transition-colors">
                              ATS Resume Builder
                            </div>
                            <div className="text-[11px] text-slate-500 font-normal">
                              Build single-column parser-safe resume.
                            </div>
                          </div>
                        </button>

                        <Link
                          href="/ats-resume#templates"
                          onClick={() => setActiveMenu(null)}
                          className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-teal-50 transition-colors text-left group cursor-pointer"
                        >
                          <div className="h-8 w-8 rounded-lg bg-teal-50 text-[#087F6E] flex items-center justify-center shrink-0 group-hover:bg-[#087F6E] group-hover:text-white transition-colors">
                            <LayoutTemplate className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 group-hover:text-[#087F6E] transition-colors">
                              ATS Resume Templates
                            </div>
                            <div className="text-[11px] text-slate-500 font-normal">
                              4 verified parser-safe layouts.
                            </div>
                          </div>
                        </Link>

                        <Link
                          href="/ats-resume#rules"
                          onClick={() => setActiveMenu(null)}
                          className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-teal-50 transition-colors text-left group cursor-pointer"
                        >
                          <div className="h-8 w-8 rounded-lg bg-teal-50 text-[#087F6E] flex items-center justify-center shrink-0 group-hover:bg-[#087F6E] group-hover:text-white transition-colors">
                            <ShieldCheck className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 group-hover:text-[#087F6E] transition-colors">
                              The 5 Golden Rules of ATS
                            </div>
                            <div className="text-[11px] text-slate-500 font-normal">
                              Layout rules to avoid silent rejection.
                            </div>
                          </div>
                        </Link>

                        {/* Bottom Action Button for ATS Resume */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenu(null);
                              if (user) {
                                router.push("/dashboard");
                              } else {
                                router.push("/ats-checker");
                              }
                            }}
                            className="bg-[#087F6E] hover:bg-[#065F53] text-white font-bold text-xs py-2 px-4 rounded-xl transition-all cursor-pointer shadow-xs"
                          >
                            Check ATS Score
                          </button>
                          <Link
                            href="/ats-resume"
                            onClick={() => setActiveMenu(null)}
                            className="text-xs font-semibold text-[#087F6E] hover:underline"
                          >
                            Open ATS Resume Hub
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. Pricing */}
                  <Link
                    href="/dashboard/pricing"
                    className={`px-3 py-2 text-[14px] font-medium rounded-lg transition-colors ${
                      pathname === "/dashboard/pricing" || pathname === "/pricing"
                        ? "text-[#087F6E] bg-teal-50 font-semibold"
                        : "text-[#526176] hover:text-[#111827] hover:bg-slate-50"
                    }`}
                  >
                    Pricing
                  </Link>

                  {/* 4. Resources (Hover Middle Box + Direct Link to /resources - Displays all 9 resources from image) */}
                  <div
                    ref={resourcesNavRef}
                    className="relative"
                    onMouseEnter={() => setActiveMenu("resources")}
                    onMouseLeave={() => setActiveMenu(null)}
                  >
                    <Link
                      href="/resources"
                      className={`flex items-center gap-1 px-3 py-2 text-[14px] font-medium transition-colors cursor-pointer rounded-lg ${
                        pathname.startsWith("/resources") || activeMenu === "resources"
                          ? "text-[#087F6E] bg-teal-50 font-semibold"
                          : "text-[#526176] hover:text-[#111827] hover:bg-slate-50"
                      }`}
                    >
                      <span>Resources</span>
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform duration-200 ${
                          activeMenu === "resources" ? "rotate-180 text-[#087F6E]" : "text-slate-400"
                        }`}
                      />
                    </Link>

                    {/* Centered Middle Box matching Resources Screenshot */}
                    {activeMenu === "resources" && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-[720px] max-w-[95vw] bg-white border border-slate-200 rounded-3xl shadow-2xl p-4 sm:p-5 z-50 animate-in fade-in zoom-in-95 duration-150">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pb-3.5">
                          <Link
                            href="/resources/how-ats-works"
                            onClick={() => setActiveMenu(null)}
                            className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-teal-50/70 transition-colors text-left group cursor-pointer"
                          >
                            <div className="h-7 w-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0 group-hover:bg-[#087F6E] transition-colors">
                              <Search className="h-3.5 w-3.5 text-[#087F6E] group-hover:text-white transition-colors" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 group-hover:text-[#087F6E] transition-colors line-clamp-1">
                                How ATS Software Works
                              </div>
                              <div className="text-[11px] text-slate-500 line-clamp-1 leading-snug">
                                How recruiters screen resumes.
                              </div>
                            </div>
                          </Link>

                          <Link
                            href="/resources/resume-keywords"
                            onClick={() => setActiveMenu(null)}
                            className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-teal-50/70 transition-colors text-left group cursor-pointer"
                          >
                            <div className="h-7 w-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0 group-hover:bg-[#087F6E] transition-colors">
                              <Key className="h-3.5 w-3.5 text-[#087F6E] group-hover:text-white transition-colors" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 group-hover:text-[#087F6E] transition-colors line-clamp-1">
                                Resume Keywords
                              </div>
                              <div className="text-[11px] text-slate-500 line-clamp-1 leading-snug">
                                Add the keywords ATS scans for.
                              </div>
                            </div>
                          </Link>

                          <Link
                            href="/resources/ats-formatting-mistakes"
                            onClick={() => setActiveMenu(null)}
                            className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-teal-50/70 transition-colors text-left group cursor-pointer"
                          >
                            <div className="h-7 w-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0 group-hover:bg-[#087F6E] transition-colors">
                              <AlertTriangle className="h-3.5 w-3.5 text-[#087F6E] group-hover:text-white transition-colors" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 group-hover:text-[#087F6E] transition-colors line-clamp-1">
                                ATS Formatting Mistakes
                              </div>
                              <div className="text-[11px] text-slate-500 line-clamp-1 leading-snug">
                                Formatting errors ATS can't read.
                              </div>
                            </div>
                          </Link>

                          <Link
                            href="/resources/best-resume-fonts"
                            onClick={() => setActiveMenu(null)}
                            className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-teal-50/70 transition-colors text-left group cursor-pointer"
                          >
                            <div className="h-7 w-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0 group-hover:bg-[#087F6E] transition-colors">
                              <Type className="h-3.5 w-3.5 text-[#087F6E] group-hover:text-white transition-colors" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 group-hover:text-[#087F6E] transition-colors line-clamp-1">
                                Best Resume Fonts
                              </div>
                              <div className="text-[11px] text-slate-500 line-clamp-1 leading-snug">
                                The best fonts for an ATS resume.
                              </div>
                            </div>
                          </Link>

                          <Link
                            href="/resources/chatgpt-resume"
                            onClick={() => setActiveMenu(null)}
                            className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-teal-50/70 transition-colors text-left group cursor-pointer"
                          >
                            <div className="h-7 w-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0 group-hover:bg-[#087F6E] transition-colors">
                              <Bot className="h-3.5 w-3.5 text-[#087F6E] group-hover:text-white transition-colors" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 group-hover:text-[#087F6E] transition-colors line-clamp-1">
                                ChatGPT Resume
                              </div>
                              <div className="text-[11px] text-slate-500 line-clamp-1 leading-snug">
                                Write your resume with ChatGPT.
                              </div>
                            </div>
                          </Link>

                          <Link
                            href="/resources/tailor-resume"
                            onClick={() => setActiveMenu(null)}
                            className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-teal-50/70 transition-colors text-left group cursor-pointer"
                          >
                            <div className="h-7 w-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0 group-hover:bg-[#087F6E] transition-colors">
                              <Target className="h-3.5 w-3.5 text-[#087F6E] group-hover:text-white transition-colors" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 group-hover:text-[#087F6E] transition-colors line-clamp-1">
                                Tailor Your Resume to the Job
                              </div>
                              <div className="text-[11px] text-slate-500 line-clamp-1 leading-snug">
                                Match your resume to each job post.
                              </div>
                            </div>
                          </Link>

                          <Link
                            href="/resources/convert-resume-ats"
                            onClick={() => setActiveMenu(null)}
                            className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-teal-50/70 transition-colors text-left group cursor-pointer"
                          >
                            <div className="h-7 w-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0 group-hover:bg-[#087F6E] transition-colors">
                              <FileCheck className="h-3.5 w-3.5 text-[#087F6E] group-hover:text-white transition-colors" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 group-hover:text-[#087F6E] transition-colors line-clamp-1">
                                Convert Resume to ATS Format
                              </div>
                              <div className="text-[11px] text-slate-500 line-clamp-1 leading-snug">
                                Make any resume ATS-ready.
                              </div>
                            </div>
                          </Link>

                          <Link
                            href="/resources/best-free-resume-builders"
                            onClick={() => setActiveMenu(null)}
                            className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-teal-50/70 transition-colors text-left group cursor-pointer"
                          >
                            <div className="h-7 w-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0 group-hover:bg-[#087F6E] transition-colors">
                              <Star className="h-3.5 w-3.5 text-[#087F6E] group-hover:text-white transition-colors" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 group-hover:text-[#087F6E] transition-colors line-clamp-1">
                                Best Free Resume Builders
                              </div>
                              <div className="text-[11px] text-slate-500 line-clamp-1 leading-snug">
                                Free resume builders, compared.
                              </div>
                            </div>
                          </Link>

                          <Link
                            href="/resources/blog"
                            onClick={() => setActiveMenu(null)}
                            className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-teal-50/70 transition-colors text-left group cursor-pointer"
                          >
                            <div className="h-7 w-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0 group-hover:bg-[#087F6E] transition-colors">
                              <BookOpen className="h-3.5 w-3.5 text-[#087F6E] group-hover:text-white transition-colors" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 group-hover:text-[#087F6E] transition-colors line-clamp-1">
                                RoleFuse Career Blog
                              </div>
                              <div className="text-[11px] text-slate-500 line-clamp-1 leading-snug">
                                Advice and guides for job seekers.
                              </div>
                            </div>
                          </Link>
                        </div>

                        {/* Bottom Action Button for Resources */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                          <Link href="/resources" onClick={() => setActiveMenu(null)}>
                            <button
                              type="button"
                              className="bg-[#087F6E] hover:bg-[#065F53] text-white font-bold text-xs py-2 px-5 rounded-xl transition-all cursor-pointer shadow-xs"
                            >
                              Explore All Resources
                            </button>
                          </Link>
                          <Link
                            href="/ats-checker"
                            onClick={() => setActiveMenu(null)}
                            className="text-xs font-semibold text-[#087F6E] hover:underline"
                          >
                            Check ATS Score
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Inside Dashboard: Direct subpage tabs */
                user &&
                !hideNav && (
                  <div className="hidden md:flex items-center gap-1 h-16 ml-1">
                    {dashboardLinks.map((link) => {
                      const isActive = pathname === link.href;
                      return (
                        <Link
                          key={link.label}
                          href={link.href}
                          className={`relative flex items-center h-full px-3 text-sm font-semibold transition-colors select-none ${
                            isActive
                              ? "text-[#111827] font-bold"
                              : "text-[#526176] hover:text-[#111827]"
                          }`}
                        >
                          {link.label}
                          {isActive && (
                            <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#087F6E] rounded-full" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )
              )}
            </div>

            {/* Right Section Actions */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  {/* Quick Dashboard button when on marketing/landing pages */}
                  {!isDashboardSubpage && (
                    <Link
                      href="/dashboard"
                      className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-[#087F6E] font-bold text-xs hover:bg-teal-100 transition-all shadow-2xs"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-[#087F6E]" />
                      <span>Dashboard</span>
                    </Link>
                  )}

                  {/* Profile Button with Google Avatar & Credits Ring */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      aria-label="Open profile menu"
                      className="relative p-1 rounded-full hover:scale-105 transition-all focus:outline-none cursor-pointer group flex items-center justify-center"
                    >
                      {/* Red indicator dot if unread notification */}
                      {hasUnreadNotifications(credits, user.email) && (
                        <span className="absolute top-0.5 right-0.5 z-10 pointer-events-none flex items-center justify-center">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500 ring-1 ring-white shadow-xs" />
                        </span>
                      )}

                      {/* Continuous teal circular credits range around circular avatar */}
                      <div className="relative flex items-center justify-center">
                        {(() => {
                          const maxVal = isOwner ? 100 : Math.max(1, totalFree);
                          const currentVal = isOwner ? 100 : Math.max(0, freeRemaining);
                          const ratio = isOwner ? 1 : Math.max(0, Math.min(1, currentVal / maxVal));
                          const radius = 18;
                          const circumference = 2 * Math.PI * radius;
                          const offset = circumference * (1 - ratio);

                          return (
                            <svg className="w-10 h-10 -rotate-90 pointer-events-none select-none" viewBox="0 0 44 44">
                              <circle
                                cx="22"
                                cy="22"
                                r={radius}
                                fill="none"
                                stroke="#e2e8f0"
                                strokeWidth="2.5"
                              />
                              <circle
                                cx="22"
                                cy="22"
                                r={radius}
                                fill="none"
                                stroke="#087F6E"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                                className="transition-all duration-500 ease-out"
                              />
                            </svg>
                          );
                        })()}

                        {/* Centered Avatar Circle with Google Profile Picture */}
                        <div className="absolute inset-0 m-auto h-7 w-7 rounded-full bg-emerald-50 border border-[#087F6E]/30 flex items-center justify-center text-[#087F6E] font-black text-xs shadow-xs select-none overflow-hidden">
                          {userAvatarUrl ? (
                            <img
                              src={userAvatarUrl}
                              alt={user.email || "Profile"}
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-cover rounded-full"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <span>{user.email ? user.email.charAt(0).toUpperCase() : "U"}</span>
                          )}
                        </div>
                      </div>
                    </button>

                    {/* PROFILE DROPDOWN MENU */}
                    {isDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-[280px] max-w-[calc(100vw-1.5rem)] bg-white text-slate-800 border border-slate-200 rounded-2xl shadow-xl p-3 space-y-2.5 select-none animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                        {/* 1. User Header with Google Profile Picture */}
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-8 w-8 rounded-full bg-emerald-50 border-2 border-[#087F6E] ring-2 ring-[#087F6E]/25 flex items-center justify-center text-[#087F6E] font-black text-xs shrink-0 overflow-hidden">
                              {userAvatarUrl ? (
                                <img
                                  src={userAvatarUrl}
                                  alt="Google Profile"
                                  referrerPolicy="no-referrer"
                                  className="h-full w-full object-cover rounded-full"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <span>{user.email ? user.email.charAt(0).toUpperCase() : "U"}</span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-slate-900 truncate max-w-full">
                                {user.user_metadata?.full_name ||
                                  (user.email ? user.email.split("@")[0] : "User")}
                              </div>
                              <div className="text-[10px] text-slate-500 font-semibold truncate flex items-center gap-1 mt-0.5">
                                <span>{planLabel}</span>
                                {isOwner && (
                                  <span className="bg-amber-100 text-amber-800 text-[8px] font-black uppercase px-1 py-0.2 rounded border border-amber-200">
                                    Owner
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <NotificationBell credits={credits} userEmail={user.email} compact />
                        </div>

                        {/* 2. Credits Box */}
                        <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-xs font-bold text-slate-800">
                              <span>Credits</span>
                              <HelpCircle className="h-3 w-3 text-slate-400" />
                            </div>
                            <Link
                              href="/dashboard/billing"
                              onClick={() => setIsDropdownOpen(false)}
                              className="text-xs font-black text-[#087F6E] hover:text-[#065F53] flex items-center gap-0.5 transition-colors"
                            >
                              <span>{creditsDisplay}</span>
                            </Link>
                          </div>

                          {/* Progress dots */}
                          <div className="flex items-center gap-0.5 w-full overflow-hidden py-0.5">
                            {Array.from({ length: 24 }).map((_, i) => {
                              const maxVal = isOwner ? 24 : totalFree;
                              const currentVal = isOwner ? 24 : freeRemaining;
                              const filledCount = Math.round((Math.min(currentVal, maxVal) / maxVal) * 24);
                              const isActive = isOwner || i < filledCount;
                              return (
                                <span
                                  key={i}
                                  className={`h-1 flex-1 rounded-full transition-all ${
                                    isActive
                                      ? "bg-[#087F6E] shadow-[0_0_3px_rgba(8,127,110,0.6)]"
                                      : "bg-slate-200"
                                  }`}
                                />
                              );
                            })}
                          </div>

                          {/* Upgrades */}
                          {!isProMax && !isOwner ? (
                            <div className="space-y-1.5 pt-1 border-t border-slate-200/80">
                              {!isPremium && (
                                <div className="flex items-center justify-between gap-1.5 pb-1.5 border-b border-slate-100/50">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <div className="h-5 w-5 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
                                      <Sparkles className="h-3 w-3 text-[#087F6E]" />
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-700 truncate">
                                      Upgrade Pro (20/mo)
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsDropdownOpen(false);
                                      useUpgradeModalStore.getState().openModal({
                                        badge: "PRO",
                                        title: "Upgrade to Premium Pro",
                                        description:
                                          "Get 20 AI resume optimizations/month, unlimited PDF & DOCX downloads, and priority features.",
                                      });
                                    }}
                                    className="bg-[#087F6E] hover:bg-[#065F53] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs transition-all cursor-pointer shrink-0"
                                  >
                                    Get
                                  </button>
                                </div>
                              )}

                              <div className="flex items-center justify-between gap-1.5">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <div className="h-5 w-5 rounded-full bg-teal-100 border border-teal-200 flex items-center justify-center shrink-0">
                                    <Zap className="h-3 w-3 text-[#087F6E]" />
                                  </div>
                                  <span className="text-[11px] font-bold text-slate-700 truncate">
                                    Pro Max (90/mo)
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsDropdownOpen(false);
                                    useUpgradeModalStore.getState().openModal({
                                      badge: "PRO MAX",
                                      title: "Upgrade to Pro Max",
                                      description:
                                        "Unlock 90 AI optimizations every month, priority ATS scoring, and high-performance resume analysis.",
                                    });
                                  }}
                                  className="bg-[#087F6E] hover:bg-[#065F53] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs transition-all cursor-pointer shrink-0"
                                >
                                  Get
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/80 text-[11px] font-bold text-[#087F6E]">
                              <Zap className="h-3.5 w-3.5 text-[#087F6E]" />
                              <span>Pro Max Plan Active &bull; 90 / mo</span>
                            </div>
                          )}
                        </div>

                        {/* 3. Navigation Links List */}
                        <div className="space-y-0.5 pt-0.5">
                          <Link
                            href="/dashboard/pricing"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100/70 transition-colors"
                          >
                            <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                            <span>Pricing Plans</span>
                          </Link>
                          <Link
                            href="/dashboard/billing"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100/70 transition-colors"
                          >
                            <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                            <span>Billing &amp; Usage</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              setIsDropdownOpen(false);
                              setIsReferralOpen(true);
                            }}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100/70 transition-colors text-left cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <Gift className="h-3.5 w-3.5 text-slate-400" />
                              <span>Refer a Friend</span>
                            </div>
                            <span className="bg-emerald-50 border border-emerald-200 text-[#087F6E] text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full">
                              +1
                            </span>
                          </button>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-slate-100" />

                        {/* 4. Secondary actions */}
                        <div className="space-y-0.5">
                          {(isOwner || isPremium || isProMax) && (
                            <button
                              onClick={() => {
                                setIsDropdownOpen(false);
                                window.dispatchEvent(
                                  new CustomEvent("open-support-chatbot", {
                                    detail: { mode: "help-center" },
                                  })
                                );
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100/70 transition-colors text-left cursor-pointer"
                            >
                              <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                              <span>Help &amp; Support</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setIsDropdownOpen(false);
                              setIsFeedbackOpen(true);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100/70 transition-colors text-left cursor-pointer"
                          >
                            <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                            <span>Feedback</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsDropdownOpen(false);
                              setIsDataPreferencesOpen(true);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100/70 transition-colors text-left cursor-pointer"
                          >
                            <Lock className="h-3.5 w-3.5 text-slate-400" />
                            <span>Data Preferences</span>
                          </button>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-slate-100" />

                        {/* 5. Sign Out */}
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                        >
                          <LogOut className="h-3.5 w-3.5 text-rose-500" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Logged-Out Public Auth Buttons in Teal, Black & White */
                <div className="flex items-center gap-3 select-none">
                  <div className="hidden sm:flex items-center gap-4">
                    <Link
                      href="/auth/login"
                      className="text-[14px] font-medium text-[#111827] hover:text-[#087F6E] transition-colors px-2 py-1.5"
                    >
                      Sign In
                    </Link>
                    <Link href="/auth/signup">
                      <button className="bg-[#087F6E] hover:bg-[#065F53] text-white text-[14px] font-semibold px-4.5 py-2 rounded-xl transition-all shadow-xs hover:shadow cursor-pointer">
                        Get Started Free
                      </button>
                    </Link>
                  </div>

                  {/* Mobile hamburger menu toggle */}
                  <div className="flex sm:hidden items-center gap-2">
                    <Link href="/auth/signup">
                      <button className="bg-[#087F6E] hover:bg-[#065F53] text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs">
                        Get Started
                      </button>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                      aria-label="Toggle navigation"
                      className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden border-t border-[#DCE7E9] bg-white px-5 py-4 space-y-3 animate-in fade-in duration-150 select-none">
          <div className="font-bold text-xs uppercase tracking-wider text-slate-400 pb-1">
            Navigation
          </div>
          <Link
            href="/products"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2.5 text-sm font-semibold text-[#111827] hover:text-[#087F6E] py-1.5"
          >
            <Sparkles className="h-4 w-4 text-[#087F6E]" />
            <span>Products</span>
          </Link>
          <Link
            href="/ats-resume"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2.5 text-sm font-semibold text-[#111827] hover:text-[#087F6E] py-1.5"
          >
            <ShieldCheck className="h-4 w-4 text-[#087F6E]" />
            <span>ATS Resume</span>
          </Link>
          <Link
            href="/dashboard/pricing"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2.5 text-sm font-semibold text-[#111827] hover:text-[#087F6E] py-1.5"
          >
            <DollarSign className="h-4 w-4 text-[#087F6E]" />
            <span>Pricing</span>
          </Link>
          <Link
            href="/resources"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2.5 text-sm font-semibold text-[#111827] hover:text-[#087F6E] py-1.5"
          >
            <BookOpen className="h-4 w-4 text-[#087F6E]" />
            <span>Resources</span>
          </Link>

          {!user && (
            <div className="border-t border-[#E2E8F0] pt-3 flex flex-col gap-2">
              <Link
                href="/auth/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#111827] hover:bg-slate-50 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl bg-[#087F6E] hover:bg-[#065F53] text-sm font-semibold text-white shadow-xs transition-colors"
              >
                Get Started Free
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (for logged-in users on mobile) */}
      {user && !hideNav && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-slate-200 flex items-center justify-around px-2 py-3 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
          <Link
            href="/dashboard"
            className={`flex flex-col items-center gap-1 transition-colors ${
              pathname === "/dashboard" ? "text-[#087F6E]" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Sparkles className="h-5 w-5" />
            <span className="text-[10px] font-bold">Optimize</span>
          </Link>
          <Link
            href="/dashboard/resumes"
            className={`flex flex-col items-center gap-1 transition-colors ${
              pathname === "/dashboard/resumes" ? "text-[#087F6E]" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <FileText className="h-5 w-5" />
            <span className="text-[10px] font-bold">Resumes</span>
          </Link>
          <Link
            href="/dashboard/job-tracker"
            className={`flex flex-col items-center gap-1 transition-colors ${
              pathname === "/dashboard/job-tracker" ? "text-[#087F6E]" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Briefcase className="h-5 w-5" />
            <span className="text-[10px] font-bold">Tracker</span>
          </Link>
          <Link
            href="/dashboard/history"
            className={`flex flex-col items-center gap-1 transition-colors ${
              pathname === "/dashboard/history" ? "text-[#087F6E]" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <History className="h-5 w-5" />
            <span className="text-[10px] font-bold">History</span>
          </Link>
        </div>
      )}


      {/* Persistent Support, Feedback & Paywall */}
      {user && !hideNav && (isOwner || isPremium || isProMax) && <SupportChatbot />}
      <FeedbackToast isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} userEmail={user?.email} />
      <ReferralModal isOpen={isReferralOpen} onClose={() => setIsReferralOpen(false)} />
      <DemoVideoModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />
      <DataPreferencesModal isOpen={isDataPreferencesOpen} onClose={() => setIsDataPreferencesOpen(false)} />
      <UpgradePaywallModal />
      <MonthlyNotificationModal credits={credits} userEmail={user?.email} />
    </>
  );
}
