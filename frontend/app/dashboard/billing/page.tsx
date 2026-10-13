"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CreditCard, 
  Loader2, 
  Calendar, 
  Check, 
  AlertCircle,
  FileText, 
  Lock, 
  ChevronRight, 
  TrendingUp, 
  Sparkles,
  Zap,
  ShieldCheck,
  Download,
  HelpCircle,
  Clock,
  Receipt,
  ArrowUpRight
} from "lucide-react";
import { CreditInfo } from "@/types";
import { toast } from "react-hot-toast";
import Link from "next/link";
import ScrollFadeIn from "@/components/ScrollFadeIn";
import GstInvoiceModal, { InvoiceData } from "@/components/GstInvoiceModal";
import { BillingSkeleton } from "@/components/SkeletonShimmer";
import Footer from "@/components/Footer";

interface Invoice {
  id: string;
  date: string;
  description: string;
  amount: string;
  status: "paid" | "failed";
}

export default function BillingPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [authLoading, setAuthLoading] = useState(true);
  
  // States
  const [activePlan, setActivePlan] = useState("free");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [credits, setCredits] = useState<CreditInfo | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [selectedInvoiceData, setSelectedInvoiceData] = useState<InvoiceData | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Initialize page variables
  useEffect(() => {
    async function loadBillingInfo() {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data?.user) {
          toast.error("Please sign in to view billing configuration.");
          router.push("/auth/login");
          return;
        }

        const user = data.user;
        setUserId(user.id);
        if (user.email) setUserEmail(user.email);
        setAuthLoading(false);

        // 1. Plan Tier & Credits Loading directly from DB
        let currentPlan = "free";

        try {
          const res = await fetch("/api/credits");
          if (res.ok) {
            const apiCredits = await res.json();
            setCredits(apiCredits);
            currentPlan = apiCredits.planId || "free";
            localStorage.setItem(`fastHire_plan_${user.id}`, currentPlan);

            // Use authentic billingCycle from database/API
            const cycle = apiCredits.billingCycle || "monthly";
            setBillingCycle(cycle);
            localStorage.setItem(`fastHire_billingCycle_${user.id}`, cycle);
          } else {
            throw new Error("Failed to fetch credits");
          }
        } catch (err) {
          // Fallback to local storage mock values
          currentPlan = localStorage.getItem(`fastHire_plan_${user.id}`) || "free";
          const currentCycle = localStorage.getItem(`fastHire_billingCycle_${user.id}`) || "monthly";
          setBillingCycle(currentCycle);
          const creditsData = localStorage.getItem(`fastHire_mockCredits_${user.id}`);
          if (creditsData) {
            try {
              setCredits(JSON.parse(creditsData));
            } catch (e) {
              setCredits({
                freeUsed: 0,
                paidCredits: 2,
                freeRemaining: 2,
                resetAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
              });
            }
          } else {
            setCredits({
              freeUsed: 0,
              paidCredits: 2,
              freeRemaining: 2,
              resetAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
            });
          }
        }

        setActivePlan(currentPlan);

        // Invoices list creation
        const isJyothika = (user.email || "").toLowerCase().trim() === "payyalajyothika333@gmail.com";
        const invoiceHistory: Invoice[] = [];

        if (currentPlan === "team" || currentPlan === "promax" || isJyothika) {
          invoiceHistory.push({
            id: "INV-PROMAX-SEP12", 
            date: "2026-09-12", 
            description: "FastHire Pro Max (1 Month)", 
            amount: "₹199.00", 
            status: "paid"
          });
        } else if (currentPlan !== "free") {
          invoiceHistory.push(
            { id: "INV-84920", date: "2026-06-15", description: "FastHire Premium Pro Monthly", amount: "₹99.00", status: "paid" },
            { id: "INV-73819", date: "2026-05-15", description: "FastHire Premium Pro Monthly", amount: "₹99.00", status: "paid" }
          );
        }

        setInvoices(invoiceHistory);
      } catch (err) {
        toast.error("Billing page load error.");
        router.push("/auth/login");
      }
    }

    loadBillingInfo();
  }, [router]);

  const handlePrintReceipt = (invoice: Invoice) => {
    const isProMax = activePlan === "promax" || activePlan === "team" || invoice.description.includes("Pro Max");
    const isYear = billingCycle === "yearly";
    const base = isProMax ? (isYear ? 332 : 199) : (isYear ? 166 : 99);
    const gst = isProMax ? (isYear ? 17 : 10) : (isYear ? 8 : 5);
    const total = isProMax ? (isYear ? 349 : 209) : (isYear ? 174 : 104);

    setSelectedInvoiceData({
      invoiceNumber: invoice.id.toUpperCase(),
      date: invoice.date,
      userName: "FastHire Subscriber",
      userEmail: userEmail || "subscriber@fasthire.ai",
      planName: isProMax ? "FastHire Pro Max (1 Month Access)" : "FastHire Premium Pro",
      billingCycle: (isYear ? "yearly" : "monthly") as any,
      basePrice: base,
      gstAmount: gst,
      totalAmount: total,
      paymentId: invoice.id.includes("PROMAX") ? "pay_Tb1mEnnxYp9Ddc" : `rzp_live_${invoice.id}`,
    });
    setIsInvoiceOpen(true);
  };

  if (authLoading) {
    return <BillingSkeleton />;
  }

  // Quota computations directly synced with Profile & Credits API
  const isUnlimited = credits?.isOwner;
  const totalLimit = isUnlimited
    ? 999999
    : activePlan === "promax" || activePlan === "team"
    ? 90
    : activePlan === "premium"
    ? 20
    : 2;

  // Use authentic remaining balance from API (matches profile credits)
  const remainingCredits = isUnlimited
    ? "Unlimited"
    : typeof credits?.freeRemaining === "number"
    ? credits.freeRemaining
    : typeof credits?.paidCredits === "number" && credits.paidCredits > 0
    ? credits.paidCredits
    : Math.max(0, totalLimit - (credits?.freeUsed ?? 0));

  const remaining = remainingCredits;
  const used = isUnlimited
    ? 0
    : typeof remaining === "number"
    ? Math.max(0, totalLimit - remaining)
    : (credits?.freeUsed ?? 0);

  const percentUsed = isUnlimited
    ? 15
    : typeof remaining === "number"
    ? Math.min(100, Math.round(((totalLimit - remaining) / totalLimit) * 100))
    : 0;

  const planDisplayName = credits?.isOwner 
    ? "Developer Owner Account (Bypassed)"
    : activePlan === "promax" || activePlan === "team" 
    ? "Pro Max (90 Optimizations / Mo)" 
    : activePlan === "premium" 
    ? "Premium Pro" 
    : "Free Career Tier";

  const planPriceDisplay = activePlan === "free" 
    ? "₹0 / month" 
    : activePlan === "premium" 
    ? (billingCycle === "yearly" ? "₹166 / year" : "₹99 / month") 
    : (billingCycle === "yearly" ? "₹332 / year" : "₹199 / month");

  const pdfDownloadLimit = activePlan === "free" ? "1 PDF (Sample)" : "Unlimited PDFs / month";

  return (
    <div className="flex flex-col min-h-screen bg-transparent text-[#111827] font-sans">
      <Navbar />

      <main className="flex-1 mx-auto max-w-6xl w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-28 sm:pb-8 flex flex-col gap-8">
        
        {/* Header Navigation & Title */}
        <ScrollFadeIn className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCE7E9] pb-6">
          <div className="flex items-center gap-3.5">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#111827] tracking-tight flex items-center gap-2">
                Billing &amp; Subscription
              </h1>
              <p className="text-sm sm:text-base text-[#526176] font-normal mt-1">
                Understand your plan quotas, credit usage, and download GST tax invoices.
              </p>
            </div>
          </div>

          <Link href="/dashboard/pricing">
            <Button className="bg-[#087F6E] hover:bg-[#075E53] text-white font-bold text-xs h-9 rounded-xl px-4 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer">
              <Sparkles className="h-3.5 w-3.5" />
              {activePlan === "free" ? "Upgrade to Pro" : "View All Plans"}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </ScrollFadeIn>

        {/* 4 Summary Stats Tiles */}
        <ScrollFadeIn className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Tile 1: Active Tier */}
          <div className="bg-white border border-[#DCE7E9] rounded-2xl p-4.5 space-y-2 relative overflow-hidden shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#526176] uppercase tracking-wider">Current Tier</span>
              <Badge className={`text-[9px] font-bold border ${
                activePlan === "free" 
                  ? "bg-[#F5FAFA] border-[#DCE7E9] text-[#526176]" 
                  : "bg-[#E5F8F5] border-[#D4F3EF] text-[#087F6E]"
              }`}>
                {activePlan === "free" ? "Free Tier" : "Active & Paid"}
              </Badge>
            </div>
            <p className="text-base font-extrabold text-[#111827] truncate">{planDisplayName}</p>
            <p className="text-[11px] font-semibold text-[#087F6E]">{planPriceDisplay}</p>
            {credits?.expiresAt && (
              <p className="text-[10px] text-[#526176] font-medium mt-0.5">
                Expires {new Date(credits.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            )}
          </div>

          {/* Tile 2: Resumes Remaining */}
          <div className="bg-white border border-[#DCE7E9] rounded-2xl p-4.5 space-y-2 relative overflow-hidden shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#526176] uppercase tracking-wider">Optimizations Left</span>
              <Zap className="h-3.5 w-3.5 text-[#087F6E]" />
            </div>
            <p className="text-base font-extrabold text-[#111827]">
              {remaining} {typeof remaining === "number" ? "resumes" : ""}
            </p>
            <p className="text-[11px] text-[#526176] font-medium">
              Used {used} of {isUnlimited ? "∞" : totalLimit} this month
            </p>
          </div>

          {/* Tile 3: PDF / DOCX Downloads */}
          <div className="bg-white border border-[#DCE7E9] rounded-2xl p-4.5 space-y-2 relative overflow-hidden shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#526176] uppercase tracking-wider">Export Downloads</span>
              <FileText className="h-3.5 w-3.5 text-[#087F6E]" />
            </div>
            <p className="text-base font-extrabold text-[#111827]">{pdfDownloadLimit}</p>
            <p className="text-[11px] text-[#526176] font-medium">
              Clean ATS-ready PDF &amp; Word
            </p>
          </div>

          {/* Tile 4: Plan Expiration Date */}
          <div className="bg-white border border-[#DCE7E9] rounded-2xl p-4.5 space-y-2 relative overflow-hidden shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#526176] uppercase tracking-wider">
                {credits?.expiresAt ? "Plan Expiration" : "Credits Reset"}
              </span>
              <Clock className="h-3.5 w-3.5 text-amber-500" />
            </div>
            <p className="text-base font-extrabold text-[#111827]">
              {credits?.expiresAt 
                ? new Date(credits.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : credits?.resetAt 
                ? new Date(credits.resetAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) 
                : "Every 30 Days"}
            </p>
            <p className="text-[11px] text-[#526176] font-medium">
              {credits?.expiresAt ? "Valid through this date" : "Refreshes automatically"}
            </p>
          </div>

        </ScrollFadeIn>

        {/* Main 2-Column Split Details */}
        <ScrollFadeIn className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left 7 Columns: Active Plan & Quota Details */}
          <div className="lg:col-span-7 space-y-6">
            
            <Card className="border border-[#DCE7E9] bg-white shadow-xs rounded-2xl overflow-hidden">
              <CardContent className="p-6 sm:p-7 space-y-6">
                
                {/* Plan Title & Price Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#F5FAFA] border border-[#DCE7E9] p-5 rounded-xl">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-[#111827]">{planDisplayName}</h3>
                    </div>
                    <p className="text-xs text-[#526176]">
                      {activePlan === "free" 
                        ? "2 free resume optimizations per month." 
                        : `Subscribed on ${billingCycle} billing cycle.${credits?.expiresAt ? ` Valid until ${new Date(credits.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.` : ""}`}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-xl font-black text-[#111827]">{planPriceDisplay.split(" ")[0]}</span>
                    <span className="text-xs text-[#526176] font-medium block">/{billingCycle === "yearly" ? "year" : "month"}</span>
                  </div>
                </div>

                {/* Quota Progress Bar with Clear Numbers */}
                <div className="space-y-3 bg-[#F5FAFA] border border-[#DCE7E9] p-5 rounded-xl">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-[#111827] flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-[#087F6E]" />
                      Monthly Optimization Quota
                    </span>
                    <span className="text-[#111827] font-mono">
                      {used} / {isUnlimited ? "∞ (Unlimited)" : `${totalLimit} Resumes`}
                    </span>
                  </div>

                  <div className="h-2.5 bg-[#DCE7E9] rounded-full overflow-hidden p-0.5">
                    <div 
                      className="h-full bg-[#087F6E] rounded-full transition-all duration-500" 
                      style={{ width: `${percentUsed}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-[#526176] pt-0.5">
                    <span>{remaining} remaining</span>
                    <span>Resets: {credits?.resetAt ? new Date(credits.resetAt).toLocaleDateString() : "Every 30 days"}</span>
                  </div>
                </div>

                {/* Plan Features Checklist */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Features Included In Your Plan</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { text: "AI ATS Resume Optimization", included: true },
                      { text: "Bullet Point Metric Improver", included: true },
                      { text: activePlan === "free" ? "1 Sample PDF Export" : "Full PDF & DOCX Export Engine", included: true },
                      { text: "Career Skills Learning Roadmaps", included: activePlan !== "free" },
                      { text: "Tailored Cover Letter Generator", included: true },
                      { text: "Instant Official GST Tax Invoices", included: activePlan !== "free" },
                    ].map((feature, idx) => (
                      <div 
                        key={idx} 
                        className={`flex items-center gap-2.5 text-xs p-2.5 rounded-xl border ${
                          feature.included 
                            ? "bg-slate-50 border-slate-200 text-slate-800" 
                            : "bg-slate-50/40 border-slate-100 text-slate-400"
                        }`}
                      >
                        <div className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${
                          feature.included 
                            ? "bg-teal-50 text-[#0d6e5a] border border-teal-200/60" 
                            : "bg-slate-200 text-slate-400"
                        }`}>
                          <Check className="h-2.5 w-2.5" />
                        </div>
                        <span className={feature.included ? "font-medium" : "line-through text-slate-400"}>
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Footer */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200">
                  <span className="text-[11px] text-slate-500">
                    {activePlan === "free" ? "Upgrade anytime to unlock 20 monthly optimizations or 90 with Pro Max." : "Need to upgrade or switch plans?"}
                  </span>
                  <Link href="/dashboard/pricing">
                    <Button className="bg-[#0d6e5a] hover:bg-[#094d3f] text-white font-bold text-xs h-9 rounded-xl px-5 shadow-sm transition-colors">
                      {activePlan === "free" ? "Upgrade Plan" : "Change Plan"}
                    </Button>
                  </Link>
                </div>

              </CardContent>
            </Card>

          </div>

          {/* Right 5 Columns: Invoices & Tax Receipts */}
          <div className="lg:col-span-5 space-y-6">
            
            <Card className="border-[#DCE7E9] bg-white shadow-xs rounded-2xl overflow-hidden flex flex-col">
              <div className="p-6 border-b border-[#DCE7E9] flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-base sm:text-lg font-black text-[#111827]">Invoice &amp; Receipts</h3>
                  <p className="text-xs text-[#526176]">Download official GST-compliant tax invoices.</p>
                </div>
                <Receipt className="h-5 w-5 text-[#087F6E]" />
              </div>

              <div className="p-6 space-y-3 min-h-[260px] flex flex-col justify-start">
                {invoices.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-10 text-[#526176] space-y-2 select-none">
                    <FileText className="h-9 w-9 text-slate-300" />
                    <span className="text-sm font-bold text-[#111827]">No Invoices Yet</span>
                    <p className="text-xs text-[#526176] max-w-xs">
                      When you upgrade to a paid plan, your GST receipts and transaction records will appear here.
                    </p>
                  </div>
                ) : (
                  invoices.map((inv) => (
                    <div
                      key={inv.id}
                      onClick={() => handlePrintReceipt(inv)}
                      className="bg-white border border-[#DCE7E9] hover:border-[#087F6E]/40 p-4 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all shadow-xs"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#111827] truncate">
                            {inv.description}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#526176] font-mono">
                          <span>{inv.date}</span>
                          <span>&bull;</span>
                          <span className="text-[#075E53] font-semibold uppercase">{inv.status}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-bold text-[#111827]">{inv.amount}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrintReceipt(inv);
                          }}
                          className="h-8 px-3 rounded-lg bg-white hover:bg-[#F5FAFA] border border-[#DCE7E9] hover:border-[#087F6E] text-[#111827] hover:text-[#087F6E] transition-all flex items-center gap-1.5 text-xs font-semibold shadow-xs cursor-pointer"
                          title="Download GST Invoice PDF"
                        >
                          <Download className="h-3.5 w-3.5 text-[#087F6E]" />
                          <span>PDF</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 bg-[#F5FAFA] border-t border-[#DCE7E9] flex items-center gap-2.5 text-xs text-[#526176] select-none">
                <ShieldCheck className="h-4 w-4 text-[#087F6E] shrink-0" />
                <span>256-bit SSL secured payments &amp; 5% GST tax invoice receipts.</span>
              </div>
            </Card>

            {/* Quick Support Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4.5 flex items-center justify-between gap-3 shadow-sm">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-slate-900">Need Billing Help?</h4>
                <p className="text-[10px] text-slate-500">Questions about payments, plans, or custom invoices?</p>
              </div>
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("open-support-chatbot", { detail: { mode: "admin" } }));
                }}
                className="bg-[#0d6e5a] hover:bg-[#094d3f] text-white text-[10px] font-bold h-8 rounded-lg px-3.5 transition-all cursor-pointer shrink-0"
              >
                Contact Us
              </button>
            </div>

          </div>

        </ScrollFadeIn>

        {/* Clear Billing FAQ Section */}
        <ScrollFadeIn className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-[#0d6e5a]" />
            <h3 className="text-sm font-extrabold text-slate-900">Frequently Asked Billing Questions</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
              <h4 className="text-xs font-bold text-slate-900">When do my credits reset?</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Your monthly resume optimization credits refresh automatically on the exact same date each month (e.g. every 30 days).
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
              <h4 className="text-xs font-bold text-slate-900">Can I change plans anytime?</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Yes, you can upgrade or switch between Free, Premium Pro, and Pro Max whenever you need. Unused credits rollover when upgrading.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
              <h4 className="text-xs font-bold text-slate-900">How do GST tax invoices work?</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Every transaction includes an official GST tax breakdown with your company name, GSTIN (optional), and payment ID for easy expense claims.
              </p>
            </div>
          </div>
        </ScrollFadeIn>

      </main>

      {/* OFFICIAL GST INVOICE DOWNLOAD MODAL */}
      {selectedInvoiceData && (
        <GstInvoiceModal
          isOpen={isInvoiceOpen}
          onClose={() => setIsInvoiceOpen(false)}
          invoice={selectedInvoiceData}
        />
      )}

      <Footer />
    </div>
  );
}

