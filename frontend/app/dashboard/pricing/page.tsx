"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Check,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Loader2,
  CreditCard,
  Lock,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  AlertTriangle,
  Receipt,
  Download
} from "lucide-react";
import { toast } from "react-hot-toast";
import ScrollFadeIn from "@/components/ScrollFadeIn";
import GstInvoiceModal, { InvoiceData } from "@/components/GstInvoiceModal";
import { PricingSkeleton } from "@/components/SkeletonShimmer";

interface Plan {
  id: "free" | "premium" | "promax";
  name: string;
  priceMonthly: string;
  priceYearly: string;
  periodMonthly: string;
  periodYearly: string;
  annualCharged?: string;
  description: string;
  features: string[];
  cta: string;
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free Career Tier",
    priceMonthly: "₹0",
    priceYearly: "₹0",
    periodMonthly: "forever",
    periodYearly: "forever",
    description: "Perfect for casual job seekers needing basic optimization.",
    features: [
      "2 AI resume optimizations per month",
      "1 resume download (PDF + DOCX)",
      "1 cover letter download (PDF + DOCX)",
      "Job application tracker"
    ],
    cta: "Current Plan"
  },
  {
    id: "premium",
    name: "Premium Pro",
    priceMonthly: "₹99",
    priceYearly: "₹99",
    periodMonthly: "month",
    periodYearly: "month",
    annualCharged: "₹1,188/yr",
    description: "For active job hunters targeting multiple roles.",
    features: [
      "20 AI resume optimizations per month",
      "Unlimited PDF + DOCX downloads",
      "5 cover letters / month",
      "Skills learning roadmap (5/month)",
      "Build up to 20 resumes from scratch",
      "AI resume builder (improve bullets, write summary)",
      "Import resume via AI",
      "Optimization history logs (2 months retention)",
      "Job application tracker",
      "Priority support"
    ],
    cta: "Upgrade to Pro",
    popular: true
  },
  {
    id: "promax",
    name: "Pro Max",
    priceMonthly: "₹199",
    priceYearly: "₹199",
    periodMonthly: "month",
    periodYearly: "month",
    annualCharged: "₹2,388/yr",
    description: "For active career changers needing maximum optimization power and 24/7 AI features.",
    features: [
      "90 AI resume optimizations per month",
      "Unlimited PDF + DOCX downloads",
      "15 cover letters / month",
      "Skills learning roadmap (15/month)",
      "Build up to 40 resumes from scratch",
      "24/7 AI Chatbot & Assistant",
      "AI resume builder (improve bullets, write summary)",
      "Import resume via AI",
      "Optimization history logs (4 months retention)",
      "Job application tracker",
      "Priority support"
    ],
    cta: "Upgrade to Pro Max"
  }
];

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "Can I see my results before paying?",
    answer: "Yes! You can input your resume and job description, run the optimization, and view your ATS scores and optimized suggestions before making any payments."
  },
  {
    question: "Are payments or plan switches refundable?",
    answer: "No. All payments, plan upgrades, and plan switches are strictly non-refundable. Whenever you purchase or switch a plan, money is non-refundable under any circumstances."
  },
  {
    question: "What is Premium Pro?",
    answer: "Premium Pro is our signature individual package designed for active job hunters, providing 20 monthly AI optimizations, full PDF/DOCX downloads, and custom instruction tuning."
  },
  {
    question: "What counts as a \"skill roadmap\"?",
    answer: "A skill roadmap is an AI-generated step-by-step learning guide that identifies gaps between your resume and a target job, recommending courses, topics, and projects."
  },
  {
    question: "What is the Optimization History?",
    answer: "It is a history log of all your previous resume scans and optimizations, stored for up to 4 months to let you retrieve and download previous versions."
  },
  {
    question: "Can I edit my resume or cover letter after the AI generates it?",
    answer: "Absolutely! Our interactive builder lets you refine personal information, experiences, and project descriptions manually inside the preview screen."
  },
  {
    question: "What is the difference between monthly and yearly plans?",
    answer: "Monthly plans bill every 30 days. Yearly plans are billed annually and offer heavily discounted pricing equivalent to 2 months free extra."
  },
  {
    question: "Can I cancel or switch my subscription?",
    answer: "Yes, anytime. Your plan stays active until the end of your billing cycle. Please note: all payments and plan switches are strictly non-refundable."
  },
  {
    question: "Is Razorpay secure?",
    answer: "Yes. Razorpay is PCI-DSS compliant. We never store your card details."
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [authLoading, setAuthLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [isOwner, setIsOwner] = useState(false);
  const [isFirst50, setIsFirst50] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  // GST Invoice Modal State
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);

  // Checkout Modal State
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Payment Success Details Modal State
  const [successDetails, setSuccessDetails] = useState<{
    planName: string;
    planId: string;
    amount: number;
    cycle: string;
    paymentId: string;
  } | null>(null);

  // FAQ open/close index state
  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(null);

  // Early user offer loading state
  const [earlyUserLoading, setEarlyUserLoading] = useState(false);

  // Load Razorpay Script dynamically
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      try {
        document.body.removeChild(script);
      } catch (e) { }
    };
  }, []);

  // Initialize and load plan state
  useEffect(() => {
    async function checkUser() {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data?.user) {
          setUserId(null);
          setCurrentPlan(null);
          setAuthLoading(false);
          return;
        }
        setUserId(data.user.id);
        if (data.user.email) setUserEmail(data.user.email);

        // Pre-load cached plan and billing cycle immediately to eliminate UI flash
        const cachedPlan = localStorage.getItem(`fastHire_plan_${data.user.id}`);
        if (cachedPlan) {
          setCurrentPlan(cachedPlan);
        }
        const cycle = localStorage.getItem(`fastHire_billingCycle_${data.user.id}`) as "monthly" | "yearly" || "monthly";
        setBillingCycle(cycle);

        try {
          const res = await fetch("/api/credits");
          if (res.ok) {
            const apiCredits = await res.json();
            if (apiCredits.isOwner) setIsOwner(true);
            if (apiCredits.paidCredits >= 365 || apiCredits.isFirst50) setIsFirst50(true);
            if (apiCredits.expiresAt) setExpiresAt(apiCredits.expiresAt);
            
            let plan = "free";
            if (apiCredits.isOwner) {
              plan = apiCredits.planId || "premium";
            } else if (apiCredits.planId === "promax" && !apiCredits.isFirst50) {
              plan = "promax";
            } else if (apiCredits.planId === "premium" || apiCredits.isFirst50 || apiCredits.paidCredits > 0) {
              plan = "premium";
            } else {
              plan = apiCredits.planId || cachedPlan || "free";
            }
            
            localStorage.setItem(`fastHire_plan_${data.user.id}`, plan);
            setCurrentPlan(plan);
          } else {
            const plan = cachedPlan || "free";
            setCurrentPlan(plan);
          }
        } catch (e) {
          const plan = cachedPlan || "free";
          setCurrentPlan(plan);
        }

        setAuthLoading(false);
      } catch (err) {
        setAuthLoading(false);
      }
    }
    checkUser();
  }, [router]);

  const handlePlanAction = async (plan: Plan) => {
    if (!userId) {
      if (plan.id === "free") {
        router.push("/auth/signup");
      } else {
        router.push("/auth/login?redirect=/dashboard/pricing");
      }
      return;
    }
    if (isOwner) {
      if (plan.id === currentPlan) {
        return; // already on this plan
      }
      try {
        if (userId) {
          const res = await fetch("/api/credits", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ planId: plan.id })
          });

          if (!res.ok) {
            throw new Error("Failed to sync plan state on backend");
          }

          localStorage.setItem(`fastHire_plan_${userId}`, plan.id);
          setCurrentPlan(plan.id);

          const limitValue = plan.id === "premium" ? 20 : plan.id === "promax" ? 90 : 2;
          const creditsObject = {
            freeUsed: 0,
            paidCredits: limitValue,
            freeRemaining: limitValue,
            resetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          };
          localStorage.setItem(`fastHire_mockCredits_${userId}`, JSON.stringify(creditsObject));

          toast.success(`Switched simulated plan to ${plan.name} (Owner Account Bypass).`);
        }
      } catch (err: any) {
        toast.error("Failed to switch plan: " + err.message);
      }
      return;
    }

    if (plan.id === currentPlan) {
      return; // already on this plan
    }

    if (plan.id === "free") {
      if (confirm("Are you sure you want to downgrade to the Free Plan? Monthly limits will be applied.")) {
        try {
          if (userId) {
            const res = await fetch("/api/credits", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ planId: "free" })
            });

            if (!res.ok) {
              throw new Error("API request failed");
            }

            localStorage.setItem(`fastHire_plan_${userId}`, "free");
            setCurrentPlan("free");
            toast.success("Downgraded to Free plan.");
          }
        } catch (err) {
          toast.error("Failed to downgrade plan. Please try again.");
        }
      }
      return;
    }

    // Trigger billing modal
    setSelectedPlan(plan);
    setIsCheckoutOpen(true);
  };

  // Claim early user free 1-year premium offer
  const handleAccessEarlyUser = async () => {
    if (!userId) {
      router.push("/auth/login?redirect=/dashboard/pricing");
      return;
    }
    setEarlyUserLoading(true);
    try {
      const res = await fetch("/api/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: "premium", billingCycle: "yearly", isEarlyUser: true }),
      });

      if (!res.ok) {
        throw new Error("Failed to activate early user offer");
      }

      localStorage.setItem(`fastHire_plan_${userId}`, "premium");
      localStorage.setItem(`fastHire_claimed_early_user_${userId}`, "true");
      setCurrentPlan("premium");
      setIsFirst50(false);
      toast.success("Welcome! You've claimed 1 Year Free Premium Pro as an early user! 🎉");
    } catch (err: any) {
      toast.error(err.message || "Failed to activate early user offer");
    } finally {
      setEarlyUserLoading(false);
    }
  };

  // Checkout submission handler
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !userId) return;

    setCheckoutLoading(true);

    const priceNum = billingCycle === "monthly"
      ? (selectedPlan.id === "premium" ? 99 : 199)
      : (selectedPlan.id === "premium" ? 99 * 10 : 199 * 10); // 2 months discount

    let userEmail = "";
    try {
      const { data } = await supabase.auth.getUser();
      userEmail = data?.user?.email || "";
    } catch (err) { }

    // Check if Razorpay script is loaded in window
    if (typeof (window as any).Razorpay !== "undefined") {
      try {
        // 1. Create order server-side
        const orderRes = await fetch("/api/payment/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId: selectedPlan.id, billingCycle }),
        });

        if (!orderRes.ok) {
          const err = await orderRes.json().catch(() => ({}));
          throw new Error(err.error || "Failed to create payment order.");
        }

        const { orderId, amount, currency, keyId } = await orderRes.json();

        // 2. Open Razorpay checkout with real order ID
        const options = {
          key: keyId,
          amount,
          currency,
          order_id: orderId,
          name: "RoleFuse",
          description: `${selectedPlan.name} (${billingCycle})`,
          image: "https://qasfeyddyolpdvmiogkl.supabase.co/storage/v1/object/public/assets/logo.png",
          handler: async function (response: any) {
            try {
              // 3. Verify payment server-side (HMAC signature check)
              const verifyRes = await fetch("/api/payment/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  planId: selectedPlan.id,
                  billingCycle,
                }),
              });

              if (!verifyRes.ok) {
                const errData = await verifyRes.json().catch(() => ({}));
                throw new Error(errData.error || "Payment verification failed.");
              }

              // 4. Update local state
              localStorage.setItem(`fastHire_plan_${userId}`, selectedPlan.id);
              localStorage.setItem(`fastHire_billingCycle_${userId}`, billingCycle);
              localStorage.setItem(`fastHire_planDate_${userId}`, new Date().toISOString());
              setCurrentPlan(selectedPlan.id);

              const limitValue = selectedPlan.id === "premium" ? 15 : 999999;
              const creditsObject = {
                freeUsed: 0,
                paidCredits: limitValue,
                freeRemaining: limitValue,
                resetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              };
              localStorage.setItem(`fastHire_mockCredits_${userId}`, JSON.stringify(creditsObject));

              setIsCheckoutOpen(false);

              // Set rich success confirmation details
              const calculatedAmount = selectedPlan.id === "premium" ? (billingCycle === "monthly" ? 104 : 174) : (billingCycle === "monthly" ? 209 : 349);
              setSuccessDetails({
                planName: selectedPlan.name,
                planId: selectedPlan.id,
                amount: calculatedAmount,
                cycle: billingCycle === "monthly" ? "30 Days Access (Monthly)" : "365 Days Access (Yearly)",
                paymentId: response.razorpay_payment_id || "pay_verified",
              });
            } catch (err: any) {
              toast.error(err.message || "Payment processed but verification failed. Contact support.");
            } finally {
              setCheckoutLoading(false);
            }
          },
          prefill: { email: userEmail },
          theme: { color: "#087F6E" },
          modal: {
            ondismiss: function () {
              setCheckoutLoading(false);
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } catch (err: any) {
        toast.error(err.message || "Failed to initialize payment.");
        setCheckoutLoading(false);
      }
    } else {
      // Sandbox fallback simulated Razorpay checkout window
      setTimeout(async () => {
        try {
          const res = await fetch("/api/credits", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ planId: selectedPlan.id })
          });

          if (!res.ok) {
            throw new Error("Failed to update credits");
          }

          localStorage.setItem(`fastHire_plan_${userId}`, selectedPlan.id);
          localStorage.setItem(`fastHire_billingCycle_${userId}`, billingCycle);
          localStorage.setItem(`fastHire_planDate_${userId}`, new Date().toISOString());
          setCurrentPlan(selectedPlan.id);

          const limitValue = selectedPlan.id === "premium" ? 20 : selectedPlan.id === "promax" ? 90 : 2;
          const creditsObject = {
            freeUsed: 0,
            paidCredits: limitValue,
            freeRemaining: limitValue,
            resetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          };
          localStorage.setItem(`fastHire_mockCredits_${userId}`, JSON.stringify(creditsObject));

          setIsCheckoutOpen(false);

          const calculatedAmount = selectedPlan.id === "premium" ? (billingCycle === "monthly" ? 104 : 174) : (billingCycle === "monthly" ? 209 : 349);
          setSuccessDetails({
            planName: selectedPlan.name,
            planId: selectedPlan.id,
            amount: calculatedAmount,
            cycle: billingCycle === "monthly" ? "30 Days Access (Monthly)" : "365 Days Access (Yearly)",
            paymentId: "pay_simulated_" + Date.now().toString().slice(-8),
          });
        } catch (err: any) {
          toast.error("Failed to update credits in sandbox.");
        } finally {
          setCheckoutLoading(false);
        }
      }, 1500);
    }
  };

  const toggleFAQ = (idx: number) => {
    setOpenFAQIndex(openFAQIndex === idx ? null : idx);
  };

  const handleBillingCycleChange = (cycle: "monthly" | "yearly") => {
    setBillingCycle(cycle);
    if (userId) {
      localStorage.setItem(`fastHire_billingCycle_${userId}`, cycle);
    }
  };

  if (authLoading) {
    return <PricingSkeleton />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-transparent text-[#111827] font-sans select-text">
      <Navbar />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-28 sm:pb-10 flex flex-col gap-10">

        {/* Title details */}
        <ScrollFadeIn className="text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#111827] tracking-tight leading-[1.15]">
            Choose the plan that <span className="bg-gradient-to-r from-[#087F6E] via-[#075E53] to-[#087F6E] bg-clip-text text-transparent">fits your goals</span>
          </h1>
          <p className="text-sm sm:text-base text-[#526176] max-w-xl mx-auto font-normal leading-relaxed">
            Get access to powerful AI tools and take control of your career journey.
          </p>

          {/* Monthly / Yearly Toggle switch (2 months free yearly) */}
          <div className="flex justify-center items-center gap-3 pt-2 select-none">
            <button
              onClick={() => handleBillingCycleChange("monthly")}
              className={`text-xs font-bold px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${billingCycle === "monthly"
                ? "bg-white text-[#111827] border border-[#DCE7E9] shadow-xs"
                : "text-[#526176] hover:text-[#111827]"
                }`}
            >
              Bill Monthly
            </button>
            <button
              onClick={() => handleBillingCycleChange("yearly")}
              className={`text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all cursor-pointer ${billingCycle === "yearly"
                ? "bg-white text-[#111827] border border-[#DCE7E9] shadow-xs"
                : "text-[#526176] hover:text-[#111827]"
                }`}
            >
              Bill Yearly
              <Badge className="bg-[#E5F8F5] border border-[#D4F3EF] text-[#087F6E] text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                1 month free
              </Badge>
            </button>
          </div>

          {/* Non-refundable policy notice */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-center max-w-xl mx-auto select-none">
            <p className="text-[11px] text-slate-700 font-medium flex items-center justify-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#087F6E] shrink-0" />
              <span><strong>Policy Notice:</strong> All payments &amp; plan switches are final. Money is <strong>strictly non-refundable</strong> under any circumstances.</span>
            </p>
          </div>
        </ScrollFadeIn>

        {/* Pricing Cards Grid with Clean Neutral Borders & Aligned Cards */}
        <ScrollFadeIn className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto w-full items-stretch">
          {PLANS.map((plan) => {
            const isActive = Boolean(userId && currentPlan === plan.id);
            const price = billingCycle === "monthly" ? plan.priceMonthly : plan.priceYearly;
            const period = billingCycle === "monthly" ? plan.periodMonthly : plan.periodYearly;

            const isPro = plan.id === "premium";

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-3xl transition-all duration-200 bg-white ${
                  isActive
                    ? "border-2 border-[#087F6E] shadow-sm ring-1 ring-[#087F6E]/10"
                    : "border border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-xs"
                }`}
              >
                {/* Most Popular Badge in Middle */}
                {isPro && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                    <span className="bg-[#087F6E] text-white px-3.5 py-1 font-bold text-[10px] uppercase tracking-wider rounded-full shadow-xs select-none inline-block whitespace-nowrap">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
                  {/* Top Block: Badges, Title, Price, Divider & Features */}
                  <div className="space-y-5">
                    {/* Top spacing */}
                    <div className="h-2" />

                    {/* Tier Title and Description */}
                    <div className="space-y-1.5">
                      <h3 className="font-heading font-extrabold text-xl text-slate-900 select-none">
                        {plan.name}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed font-normal min-h-[36px]">
                        {plan.description}
                      </p>
                    </div>

                    {/* Price Tag */}
                    <div className="pt-1">
                      <div className="flex items-baseline">
                        <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                          {price}
                        </span>
                        <span className="text-xs text-slate-500 font-semibold ml-1.5 uppercase tracking-wider">
                          / {period}
                        </span>
                      </div>
                      {billingCycle === "yearly" && (plan as any).annualCharged && (
                        <p className="text-[11px] text-slate-500 font-medium mt-1">
                          {(plan as any).annualCharged} · <span className="text-emerald-600 font-semibold">charged annually</span>
                        </p>
                      )}
                    </div>

                    {/* Clean Border Divider */}
                    <div className="border-t border-slate-100" />

                    {/* Feature Items List */}
                    <ul className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                          <Check className="h-4 w-4 shrink-0 text-[#087F6E] mt-0.5" />
                          <span className="leading-snug">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* First 50 Users Special Offer Box - shown inside Premium Pro, completely hidden once plan is taken */}
                    {isPro && !isActive && currentPlan !== "premium" && currentPlan !== "promax" && (
                      <div className="mt-4 p-3.5 rounded-2xl bg-teal-50 border border-teal-200 space-y-2 text-center select-none shadow-2xs">
                        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#087F6E]">
                          <Sparkles className="h-3.5 w-3.5 shrink-0" />
                          <span>First 50 Users Early Offer</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug">
                          Get 1 Year Free Premium Pro unlocked on your account with full access.
                        </p>
                        <Button
                          type="button"
                          disabled={earlyUserLoading}
                          onClick={handleAccessEarlyUser}
                          className="w-full h-8 text-[11px] font-bold bg-[#087F6E] hover:bg-[#065F53] text-white rounded-lg shadow-xs cursor-pointer transition-all"
                        >
                          {earlyUserLoading ? "Unlocking Access..." : "Access as Early User"}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Actions CTA Trigger */}
                  <div className="space-y-2 pt-6 mt-6 border-t border-slate-100">
                    {isActive && plan.id !== "free" && expiresAt && (
                      <div className="flex flex-col items-center justify-center gap-0.5 py-1 text-xs font-semibold text-slate-500">
                        <span>
                          Plan ends: {new Date(expiresAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    )}
                    <Button
                      onClick={() => handlePlanAction(plan)}
                      className={`w-full font-bold text-xs h-11 rounded-xl transition-all cursor-pointer ${
                        isActive
                          ? "bg-teal-50 border border-teal-200 text-[#087F6E] hover:bg-teal-100 shadow-2xs"
                          : plan.id === "free"
                          ? "bg-slate-100 hover:bg-slate-200 text-slate-800"
                          : "bg-[#087F6E] hover:bg-[#065F53] text-white shadow-2xs"
                      }`}
                    >
                      {isActive
                        ? (isOwner ? "✓ Active (Owner Unlimited)" : "✓ Current Plan")
                        : !userId
                        ? (plan.id === "free" ? "Get Started Free" : plan.cta)
                        : plan.id === "free"
                        ? "Free Plan"
                        : (isOwner ? `Simulate ${plan.name}` : plan.cta)}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </ScrollFadeIn>

        {/* Security badges & Trust banners */}
        <div className="flex flex-col items-center justify-center gap-2 text-center mt-4 select-none max-w-lg mx-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
            <Lock className="h-4 w-4 text-[#087F6E]" />
            <span>256-Bit SSL Secure Razorpay Payments</span>
          </div>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
            RoleFuse processes transactions securely. You can downgrade, cancel, or switch billing cycles at any point from your billing profile page.
          </p>
        </div>

        {/* Divider line before FAQs */}
        <div className="border-t border-slate-200 my-4" />

        {/* FAQ SECTION (Accordion dropdowns list) */}
        <div className="max-w-3xl mx-auto w-full space-y-4 select-none">
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">Frequently Asked Questions</h2>
            <p className="text-sm sm:text-base text-[#526176]">Everything you need to know about RoleFuse subscriptions.</p>
          </div>

          <div className="space-y-3.5">
            {FAQ_ITEMS.map((faq, idx) => {
              const isOpen = openFAQIndex === idx;
              return (
                <div
                  key={idx}
                  className="border border-slate-200 bg-white rounded-2xl overflow-hidden transition-all duration-200 shadow-xs"
                >
                  <button
                    onClick={() => toggleFAQ(idx)}
                    className="w-full flex items-center justify-between p-5 text-left font-semibold text-sm sm:text-base text-[#111827] transition-colors cursor-pointer"
                  >
                    <span className="text-[#111827]">{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-[#526176] shrink-0 ml-3" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-[#526176] shrink-0 ml-3" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-sm sm:text-[15px] text-[#526176] font-normal leading-relaxed border-t border-[#DCE7E9] pt-4 select-text">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </main>

      {/* SECURE MOCK BILLING CHECKOUT DIALOG */}
      {isCheckoutOpen && selectedPlan && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">

            {/* Header info */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#0d6e5a]" />
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Razorpay Secure Checkout
                </h3>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                disabled={checkoutLoading}
                className="text-slate-400 hover:text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4 select-none">

              {/* Reference Image Style Itemized Order Summary Card */}
              {(() => {
                const basePrice = selectedPlan.id === "premium"
                  ? (billingCycle === "monthly" ? 99 : 1188)
                  : (billingCycle === "monthly" ? 199 : 2388);
                const gstAndFee = selectedPlan.id === "premium"
                  ? (billingCycle === "monthly" ? 5 : 59)
                  : (billingCycle === "monthly" ? 10 : 119);
                const totalPayable = basePrice + gstAndFee;

                return (
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">{selectedPlan.name} (Base Price)</span>
                        <span className="font-semibold text-slate-900">₹{basePrice.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">Taxes &amp; Fees (5% GST)</span>
                        <span className="font-semibold text-slate-900">₹{gstAndFee.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                      <span className="font-extrabold text-slate-900 text-sm">Total Amount</span>
                      <span className="font-black text-[#0d6e5a] text-xl">
                        ₹{totalPayable.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Secure Trust Badge */}
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-semibold bg-slate-50 py-2.5 px-3 rounded-xl border border-slate-200">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>256-Bit SSL Encrypted &bull; Razorpay PCI-DSS Secured</span>
              </div>

              {/* Submit actions */}
              <Button
                type="submit"
                disabled={checkoutLoading}
                className="w-full bg-[#0d6e5a] hover:bg-[#094d3f] text-white font-extrabold text-sm h-12 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                {checkoutLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Opening Razorpay Gateway...
                  </>
                ) : (
                  <>
                    Proceed to Pay ₹{selectedPlan.id === "premium" ? (billingCycle === "monthly" ? "104" : "174") : (billingCycle === "monthly" ? "209" : "349")}
                  </>
                )}
              </Button>

            </form>
          </div>
        </div>
      )}

      {/* OFFICIAL GST INVOICE DOWNLOAD MODAL */}
      {invoiceData && (
        <GstInvoiceModal
          isOpen={isInvoiceOpen}
          onClose={() => setIsInvoiceOpen(false)}
          invoice={invoiceData}
        />
      )}

      {/* RICH PAYMENT SUCCESS CONFIRMATION MODAL */}
      {successDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Top header accent */}
            <div className="bg-gradient-to-r from-[#0d6e5a] to-emerald-600 p-6 text-white text-center">
              <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <CheckCircle2 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-black tracking-tight">Payment Successful!</h3>
              <p className="text-xs text-emerald-100 font-medium mt-1">
                Your account is upgraded to RoleFuse {successDetails.planName}
              </p>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              {/* Order Summary Receipt Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Plan Purchased:</span>
                  <span className="font-bold text-slate-900">{successDetails.planName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Amount Paid:</span>
                  <span className="font-black text-[#0d6e5a] text-sm">₹{successDetails.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Access Duration:</span>
                  <span className="font-bold text-slate-700">{successDetails.cycle}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Renewal Mode:</span>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                    Safe One-Time &bull; No Auto-Debits
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200/80 pt-2 text-[11px]">
                  <span className="text-slate-400">Payment ID:</span>
                  <span className="font-mono text-slate-600 truncate max-w-[170px]">{successDetails.paymentId}</span>
                </div>
              </div>

              {/* What is Unlocked Box */}
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Features Unlocked Right Now:</h4>
                <div className="grid grid-cols-1 gap-1.5 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>{successDetails.planId === "premium" ? "15 AI Optimizations per month" : "Unlimited AI Resume Optimizations"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>{successDetails.planId === "premium" ? "5 PDF/DOCX downloads" : "30 Pro ATS-Formatted PDF Downloads"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>AI Bullet Point Improver &amp; Learning Roadmaps</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Tailored Cover Letter Generator</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={() => {
                    setSuccessDetails(null);
                    router.push("/dashboard");
                    router.refresh();
                  }}
                  className="flex-1 bg-[#0d6e5a] hover:bg-[#094d3f] text-white font-bold text-xs h-10 rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => {
                    setSuccessDetails(null);
                    router.push("/dashboard/billing");
                  }}
                  variant="outline"
                  className="border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs h-10 rounded-xl"
                >
                  View Invoices
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
