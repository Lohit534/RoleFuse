"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  X, 
  Send, 
  Loader2, 
  RefreshCw, 
  HelpCircle,
  ShieldCheck,
  Clock,
  HeadphonesIcon,
  Search,
  ChevronRight,
  ChevronDown,
  Mail,
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  CreditCard,
  FileText,
  User,
  Settings,
  Sparkles
} from "lucide-react";
import { toast } from "react-hot-toast";

interface FAQItem {
  id: string;
  category: "all" | "billing" | "optimization" | "account" | "gst";
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    id: "plan-status-free",
    category: "billing",
    question: "If I haven't purchased a plan, does it always show Free?",
    answer: "Yes! If you have not purchased a plan, your account strictly stays on the Free Plan with your monthly free credits. You can view all 3 plans on the Pricing page to compare features, but you will never be charged or switched to a paid plan without your explicit checkout."
  },
  {
    id: "payment-visibility",
    category: "billing",
    question: "Why is my payment not visible on the dashboard?",
    answer: "Payments are verified securely in real-time via Razorpay. If your credits haven't refreshed immediately, please check your Billing & Subscription page, click 'Refresh', or create a support ticket with your Payment ID or email support@rolefuse.in."
  },
  {
    id: "credits-reset",
    category: "billing",
    question: "When do my monthly optimization credits reset?",
    answer: "Your credits refresh automatically every 30 days on your monthly cycle. Free plan users get free monthly credits, Pro gets 20, and Pro Max members get unlimited optimizations."
  },
  {
    id: "ats-scoring",
    category: "optimization",
    question: "How does RoleFuse ATS scoring & keyword optimization work?",
    answer: "RoleFuse analyzes your resume against target job description keywords, technical requirements, and industry-standard ATS rubrics, highlighting exact keyword gaps and upgrading weak bullet points to help you reach a 90+ score."
  },
  {
    id: "gst-invoices",
    category: "gst",
    question: "How do GST tax invoices work?",
    answer: "Every transaction generates an official 5% GST tax invoice with an official breakdown. You can preview and download GST invoices as PDFs anytime on your Billing page."
  },
  {
    id: "plan-switching",
    category: "billing",
    question: "Can I upgrade or switch between plans anytime?",
    answer: "Yes! You can upgrade from Free to Pro (20 optimizations/month) or Pro Max (Unlimited) at any time from the Pricing page."
  },
  {
    id: "resume-import",
    category: "optimization",
    question: "Can I upload my existing PDF or DOCX resume?",
    answer: "Yes! Navigate to the Resume Editor or ATS Checker to upload any PDF or DOCX file. Our engine parses the text, extracts your contact info, skills, experience, and education, and prepares it for instant ATS tailoring."
  },
  {
    id: "data-privacy",
    category: "account",
    question: "Is my resume and personal data secure?",
    answer: "RoleFuse uses enterprise-grade Supabase encryption and strict row-level security (RLS). Your resume data is never shared with third parties or used to train public AI models."
  }
];

const TICKET_TOPICS = [
  {
    id: "billing",
    title: "Billing and Plans",
    icon: <CreditCard className="h-4 w-4 text-slate-500" />,
    questions: [
      "Why is my payment failing?",
      "How do I request a refund?",
      "How to upgrade my plan?",
      "Why did my credits not update?"
    ]
  },
  {
    id: "optimization",
    title: "Resume Optimization",
    icon: <FileText className="h-4 w-4 text-slate-500" />,
    questions: [
      "Why is my ATS score low?",
      "Missing keywords are not accurate",
      "PDF parsing error",
      "Formatting issues on export"
    ]
  },
  {
    id: "account",
    title: "Account and Data",
    icon: <User className="h-4 w-4 text-slate-500" />,
    questions: [
      "How to delete my account?",
      "Update email address",
      "Login issues"
    ]
  },
  {
    id: "other",
    title: "Other Issues",
    icon: <Settings className="h-4 w-4 text-slate-500" />,
    questions: [
      "Report a bug",
      "Feature request",
      "General inquiry"
    ]
  }
];

export default function SupportChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  // Views: 'help-center' | 'contact-options' | 'ticket' | 'mail'
  const [view, setView] = useState<"help-center" | "contact-options" | "ticket" | "mail">("help-center");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "billing" | "optimization" | "account" | "gst">("all");
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  
  const [ticketTopic, setTicketTopic] = useState<string | null>(null);
  const [ticketInput, setTicketInput] = useState("");
  const [sendingTicket, setSendingTicket] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // User state
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activePlan, setActivePlan] = useState<"free" | "premium" | "promax" | "owner">("free");
  
  const [adminTickets, setAdminTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Listen for global popup events so only one widget / dropdown / modal is open at a time
  useEffect(() => {
    const handleOpenHelp = () => {
      window.dispatchEvent(new CustomEvent("rolefuse_close_popups", { detail: { source: "help-center" } }));
      setIsOpen(true);
      setView("help-center");
    };

    const handleClosePopups = (e: any) => {
      if (e.detail?.source !== "help-center") {
        setIsOpen(false);
      }
    };

    window.addEventListener("fastHire_openHelpCenter", handleOpenHelp);
    window.addEventListener("rolefuse_close_popups", handleClosePopups);

    return () => {
      window.removeEventListener("fastHire_openHelpCenter", handleOpenHelp);
      window.removeEventListener("rolefuse_close_popups", handleClosePopups);
    };
  }, []);

  // Auto-scroll messages to bottom
  useEffect(() => {
    if (view === "ticket") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [adminTickets, isOpen, view]);

  // Load User Authentication & Plan details
  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email ?? null);
        
        const credRes = await fetch("/api/credits");
        if (credRes.ok) {
          const creds = await credRes.json();
          if (creds.isOwner) {
            setActivePlan("owner");
          } else if (creds.paidCredits >= 90) {
            setActivePlan("promax");
          } else if (creds.paidCredits > 0) {
            setActivePlan("premium");
          } else {
            setActivePlan("free");
          }
        }
      }
    } catch {
      // silent
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUserData();
    }
  }, [isOpen]);

  // External open trigger listener (from Navbar or Profile menu)
  useEffect(() => {
    const handleOpenChat = (e: Event) => {
      const customEvent = e as CustomEvent;
      const targetMode = customEvent.detail?.mode || "help-center";
      window.dispatchEvent(new CustomEvent("rolefuse_close_popups", { detail: { source: "help-center" } }));
      setIsDismissed(false);
      setIsOpen(true);
      if (targetMode === "admin" || targetMode === "ticket") {
        setView("ticket");
        loadAdminTickets(false);
      } else if (targetMode === "mail" || targetMode === "email") {
        setView("mail");
      } else if (targetMode === "contact" || targetMode === "contact-options") {
        setView("contact-options");
      } else {
        setView("help-center");
      }
      loadUserData();
    };

    window.addEventListener("open-support-chatbot", handleOpenChat as any);
    return () => {
      window.removeEventListener("open-support-chatbot", handleOpenChat as any);
    };
  }, []);

  // Load human admin support tickets
  const loadAdminTickets = async (isBackground = false) => {
    if (!isBackground) setLoadingTickets(true);
    try {
      const res = await fetch("/api/support/messages");
      if (res.ok) {
        const data = await res.json();
        const userTickets = Array.isArray(data) ? data : [];
        setAdminTickets(userTickets);
      }
    } catch {
      // silent
    } finally {
      if (!isBackground) setLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (isOpen && view === "ticket") {
      loadAdminTickets(false);
      const interval = setInterval(() => {
        loadAdminTickets(true);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, view]);

  // Send Ticket Message to Admin
  const handleSendTicket = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const msg = ticketInput.trim();
    if (!msg || sendingTicket) return;

    setTicketInput("");
    setSendingTicket(true);

    try {
      const res = await fetch("/api/support/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          userPlan: activePlan,
          topic: ticketTopic || "general"
        })
      });

      if (res.ok) {
        toast.success("Support ticket submitted to Admin team.");
        await loadAdminTickets(false);
      } else {
        toast.error("Failed to submit ticket. Please try again.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSendingTicket(false);
    }
  };

  const copySupportEmail = () => {
    navigator.clipboard.writeText("support@rolefuse.in");
    setCopiedEmail(true);
    toast.success("Support email copied to clipboard!");
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  // Filter FAQs based on query and category
  const filteredFaqs = FAQS.filter(faq => {
    const matchesCat = selectedCategory === "all" || faq.category === selectedCategory;
    const matchesQuery = !searchQuery.trim() || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  if (isDismissed && !isOpen) {
    return null;
  }

  return (
    <>
      {/* Mobile Backdrop when Help Center is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 sm:hidden z-[105] transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={`fixed select-none transition-all duration-200 ${
          isOpen
            ? "bottom-3 sm:bottom-6 right-3 sm:right-6 z-[110]"
            : "bottom-[max(74px,calc(env(safe-area-inset-bottom)+66px))] right-3.5 sm:bottom-6 sm:right-6 z-40"
        }`}
      >
        {/* Floating Help Center Launcher Button (Positioned statically above mobile navbar dock) */}
        {!isOpen && (
          <div className="relative group/help">
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("rolefuse_close_popups", { detail: { source: "help-center" } }));
                setIsOpen(true);
                setView("help-center");
              }}
              className="flex h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-white/95 backdrop-blur-md hover:bg-white text-[#087F6E] shadow-[0_4px_16px_rgba(0,0,0,0.1)] sm:shadow-lg items-center justify-center border border-slate-200/90 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer pointer-events-auto ring-1 ring-black/[0.04]"
              title="Open Help Center"
              aria-label="Open Help Center"
            >
              <HeadphonesIcon className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-[#087F6E] transition-transform" />
            </button>
            {/* Dismiss button to hide floating bubble if disturbing content reading */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsDismissed(true);
              }}
              className="absolute -top-1.5 -left-1.5 h-4 w-4 rounded-full bg-slate-300 hover:bg-slate-500 text-slate-700 hover:text-white flex items-center justify-center text-[10px] font-bold shadow-xs cursor-pointer opacity-70 sm:opacity-0 sm:group-hover/help:opacity-100 transition-opacity"
              title="Hide Help button"
              aria-label="Hide Help button"
            >
              ×
            </button>
          </div>
        )}

        {/* Main Container Widget */}
        {isOpen && (
          <Card className="w-[calc(100vw-24px)] max-w-[335px] sm:max-w-none sm:w-[400px] h-[470px] sm:h-[560px] max-h-[72dvh] bg-white border-slate-200 shadow-2xl rounded-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative pointer-events-auto text-left">
          
          {/* ============================================================ */}
          {/* VIEW 1: HELP CENTER FAQS                                      */}
          {/* ============================================================ */}
          {view === "help-center" && (
            <div className="flex flex-col h-full bg-white">
              {/* Header */}
              <div className="bg-white border-b border-slate-100 p-3 sm:p-4.5 flex items-start justify-between select-none">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0d6e5a] shrink-0">
                    <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-xs sm:text-base tracking-tight">Help Center</h3>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">How can we help you today?</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="h-7 w-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Search input */}
              <div className="p-2.5 sm:p-3 border-b border-slate-100 bg-slate-50/50">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Search answers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 text-[11px] sm:text-xs bg-white border-slate-200 focus:border-[#0d6e5a] h-7.5 sm:h-8.5 rounded-xl"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1 sm:gap-1.5 mt-2 sm:mt-2.5 overflow-x-auto no-scrollbar pb-0.5">
                  {[
                    { id: "all", label: "All" },
                    { id: "billing", label: "Billing" },
                    { id: "optimization", label: "ATS & Resume" },
                    { id: "gst", label: "GST Tax" },
                    { id: "account", label: "Account" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id as any)}
                      className={`text-[9px] sm:text-[10px] font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer border ${
                        selectedCategory === cat.id
                          ? "bg-[#0d6e5a] text-white border-[#0d6e5a]"
                          : "bg-white text-slate-600 hover:bg-slate-100 border-slate-200"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* FAQ Accordion List */}
              <div className="flex-1 overflow-y-auto p-2.5 sm:p-3.5 space-y-2 sm:space-y-2.5 bg-slate-50/40">
                {filteredFaqs.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <HelpCircle className="h-8 w-8 mx-auto opacity-40" />
                    <p className="text-xs font-semibold">No answers match your search</p>
                    <button
                      onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}
                      className="text-[11px] font-bold text-[#0d6e5a] hover:underline"
                    >
                      Reset filters
                    </button>
                  </div>
                ) : (
                  filteredFaqs.map((faq) => {
                    const isExpanded = expandedFaq === faq.id;
                    return (
                      <div
                        key={faq.id}
                        className="bg-white border border-slate-200/90 rounded-xl overflow-hidden transition-all shadow-xs"
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedFaq(isExpanded ? null : faq.id)}
                          className="w-full p-2.5 sm:p-3 text-left flex items-center justify-between gap-2 hover:bg-slate-50/80 transition-colors"
                        >
                          <span className="text-[11px] sm:text-xs font-bold text-slate-800 leading-snug">
                            {faq.question}
                          </span>
                          <span className="shrink-0 text-slate-400">
                            {isExpanded ? <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                          </span>
                        </button>
                        {isExpanded && (
                          <div className="px-2.5 pb-2.5 pt-0 text-[10px] sm:text-[11px] leading-relaxed text-slate-600 border-t border-slate-100 bg-slate-50/50">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom "Need more help? -> Contact Us" Footer */}
              <div className="p-2.5 sm:p-3.5 bg-slate-50 border-t border-slate-200 space-y-1.5 sm:space-y-2 text-center select-none">
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-semibold">Still need help?</p>
                <Button
                  onClick={() => setView("contact-options")}
                  className="w-full bg-[#0d6e5a] hover:bg-[#094d3f] text-white font-bold text-[11px] sm:text-xs h-8 sm:h-9.5 rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm cursor-pointer transition-colors"
                >
                  <HeadphonesIcon className="h-3.5 w-3.5" />
                  Contact Support Team
                </Button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW 2: CONTACT US OPTIONS                                   */}
          {/* ============================================================ */}
          {view === "contact-options" && (
            <div className="flex flex-col h-full bg-white">
              {/* Header */}
              <div className="bg-white border-b border-slate-100 p-4 flex items-center justify-between select-none">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setView("help-center")}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title="Back to FAQs"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">Contact Us</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Choose your preferred support channel</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="h-7 w-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Options */}
              <div className="p-3 sm:p-4 space-y-2.5 sm:space-y-3.5 flex-1 flex flex-col justify-center bg-slate-50/50">
                {/* Option 1: Mail Support (Email with Copy Icon) */}
                <div className="p-3 sm:p-4 bg-white border border-teal-200/80 rounded-2xl shadow-sm space-y-2.5 sm:space-y-3">
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0d6e5a] shrink-0">
                      <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-extrabold text-slate-900">Mail Support</h4>
                        <span className="text-[8px] sm:text-[9px] font-bold text-[#0d6e5a] bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                          Recommended
                        </span>
                      </div>
                      <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5">
                        Guaranteed response within 24 hours
                      </p>
                    </div>
                  </div>

                  {/* Mail address with copy icon */}
                  <div className="flex items-center justify-between gap-2 p-2 sm:p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[11px] sm:text-xs font-mono font-semibold text-slate-800 truncate select-all">
                      support@rolefuse.in
                    </span>
                    <button
                      type="button"
                      onClick={copySupportEmail}
                      className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[10px] sm:text-[11px] transition-colors cursor-pointer shadow-xs shrink-0"
                      title="Copy email address"
                    >
                      {copiedEmail ? (
                        <>
                          <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-slate-500" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Option 2: Admin Support Ticket */}
                <button
                  type="button"
                  onClick={() => {
                    setView("ticket");
                    if (userId) loadAdminTickets(false);
                  }}
                  className="w-full p-3 sm:p-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#0d6e5a]/40 rounded-2xl flex items-center justify-between gap-2.5 sm:gap-3 text-left transition-all shadow-sm cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 group-hover:scale-105 transition-transform shrink-0">
                      <HeadphonesIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-[#0d6e5a] transition-colors">
                        Admin Support Ticket
                      </h4>
                      <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 font-medium">
                        Submit a direct message &bull; Track replies here
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 group-hover:text-[#0d6e5a] group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              </div>

              {/* Bottom Quick Back Link */}
              <div className="p-3.5 border-t border-slate-200 text-center bg-slate-50">
                <button
                  type="button"
                  onClick={() => setView("help-center")}
                  className="text-xs font-bold text-slate-500 hover:text-[#0d6e5a] transition-colors"
                >
                  &larr; Back to Help Center FAQs
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW 3: ADMIN SUPPORT TICKET                                 */}
          {/* ============================================================ */}
          {view === "ticket" && (
            <div className="flex flex-col h-full bg-white">
              {/* Header */}
              <div className="bg-white border-b border-slate-100 p-3.5 sm:p-4 flex items-center justify-between select-none">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setView("contact-options")}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title="Back to Contact Options"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm tracking-tight">Admin Support Ticket</h3>
                    <span className="text-[9px] text-slate-500 font-semibold flex items-center gap-1 select-none">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Direct Admin Support
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => loadAdminTickets(false)}
                    className="h-7 w-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    title="Refresh tickets"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="h-7 w-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Ticket Messages Body */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-50/70 text-left">
                {loadingTickets ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-2 select-none">
                    <Loader2 className="h-5 w-5 text-[#0d6e5a] animate-spin" />
                    <p className="text-[10px] text-slate-500 font-semibold">Loading your tickets...</p>
                  </div>
                ) : adminTickets.length === 0 ? (
                  <div className="flex flex-col gap-2">
                    {!ticketTopic ? (
                      <>
                        <div className="px-1 mb-1">
                          <h4 className="text-[11px] font-bold text-slate-900">Choose a topic to create ticket</h4>
                          <p className="text-[9px] text-slate-500">Select a category related to your issue</p>
                        </div>
                        {TICKET_TOPICS.map((topic) => (
                          <button
                            key={topic.id}
                            type="button"
                            onClick={() => setTicketTopic(topic.id)}
                            className="bg-white border border-slate-200 hover:border-[#0d6e5a]/40 hover:bg-slate-50 p-3 rounded-xl flex items-center justify-between transition-all shadow-xs text-left cursor-pointer group"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                {topic.icon}
                              </div>
                              <span className="text-xs font-semibold text-slate-700">{topic.title}</span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#0d6e5a]" />
                          </button>
                        ))}
                      </>
                    ) : (
                      <>
                        <div className="px-1 mb-1 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setTicketTopic(null)}
                            className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500"
                          >
                            <ArrowLeft className="h-3 w-3" />
                          </button>
                          <div>
                            <h4 className="text-[11px] font-bold text-slate-900">Quick question prepopulate</h4>
                            <p className="text-[9px] text-slate-500">Click to fill message or type your own below</p>
                          </div>
                        </div>
                        {TICKET_TOPICS.find((t) => t.id === ticketTopic)?.questions.map((q, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setTicketInput(q)}
                            className="bg-white border border-slate-200 hover:border-[#0d6e5a]/40 hover:bg-slate-50 p-2.5 rounded-xl flex items-center justify-between transition-all shadow-xs text-left cursor-pointer group"
                          >
                            <span className="text-xs font-medium text-slate-700 leading-relaxed pr-2">{q}</span>
                            <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-[#0d6e5a] shrink-0" />
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-white border border-slate-200 p-2 rounded-xl text-[10px] text-slate-600 flex items-center justify-between select-none shadow-xs">
                      <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <Clock className="h-3 w-3 text-teal-600 shrink-0" />
                        Ticket history active
                      </span>
                      <button
                        type="button"
                        onClick={() => loadAdminTickets(false)}
                        className="text-[#0d6e5a] hover:text-[#094d3f] flex items-center gap-1 font-bold cursor-pointer text-[10px]"
                      >
                        <RefreshCw className="h-2.5 w-2.5" /> Refresh
                      </button>
                    </div>

                    {adminTickets.map((ticket: any) => (
                      <div key={ticket.id} className="space-y-2">
                        {/* User message */}
                        <div className="flex justify-end">
                          <div className="max-w-[88%] bg-[#0d6e5a] text-white rounded-2xl rounded-br-none px-3.5 py-2 text-xs leading-relaxed shadow-xs">
                            <p className="whitespace-pre-wrap">{ticket.message}</p>
                            <div className="flex items-center justify-end gap-1.5 mt-1 border-t border-white/20 pt-1">
                              <span className="text-[9px] text-white/80">
                                {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : "Sent"}
                              </span>
                              <span className="text-[8px] font-bold bg-white/20 px-1 py-0.2 rounded text-white">Sent</span>
                            </div>
                          </div>
                        </div>

                        {/* Admin reply */}
                        {ticket.reply ? (
                          <div className="flex justify-start">
                            <div className="max-w-[88%] bg-white border border-teal-200 text-slate-800 rounded-2xl rounded-bl-none p-3 text-xs leading-relaxed shadow-xs space-y-1.5">
                              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1">
                                <div className="flex items-center gap-1.5 text-[9px] text-[#0d6e5a] font-black uppercase tracking-wider">
                                  <ShieldCheck className="h-3 w-3 text-[#0d6e5a]" />
                                  <span>RoleFuse Support Reply</span>
                                </div>
                                <span className="text-[8px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded-full border border-teal-200/60">
                                  Official
                                </span>
                              </div>
                              <p className="text-slate-800 font-normal leading-relaxed whitespace-pre-wrap">{ticket.reply}</p>
                              <div className="text-[9px] text-slate-400 font-medium text-right pt-0.5">
                                Replied {ticket.repliedAt ? new Date(ticket.repliedAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : "Recently"}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-start">
                            <div className="max-w-[88%] bg-amber-50/90 border border-amber-200 text-amber-900 rounded-2xl rounded-bl-none p-2.5 text-xs leading-relaxed select-none">
                              <div className="flex items-center gap-1.5 text-[9px] text-amber-700 font-bold uppercase tracking-wider mb-0.5">
                                <Clock className="h-3 w-3 animate-spin" />
                                <span>Awaiting Support Team Reply</span>
                              </div>
                              <p className="text-[10px] text-amber-800/90 font-normal">
                                Your ticket has been logged with our team. Responses appear directly here.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Ticket Input Form */}
              <div className="p-3 border-t border-slate-200 bg-white">
                <form onSubmit={handleSendTicket} className="flex gap-2">
                  <Input
                    placeholder="Type your issue or ticket message..."
                    value={ticketInput}
                    onChange={(e) => setTicketInput(e.target.value)}
                    disabled={sendingTicket}
                    className="flex-1 bg-slate-50 border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0d6e5a] focus:bg-white rounded-xl h-9"
                  />
                  <Button
                    type="submit"
                    disabled={sendingTicket || !ticketInput.trim()}
                    className="h-9 w-9 p-0 bg-[#0d6e5a] hover:bg-[#094d3f] text-white rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-colors cursor-pointer"
                  >
                    {sendingTicket ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Send className="h-4 w-4" />}
                  </Button>
                </form>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW 4: DEDICATED MAIL SUPPORT                                */}
          {/* ============================================================ */}
          {view === "mail" && (
            <div className="flex flex-col h-full bg-white">
              {/* Header */}
              <div className="bg-white border-b border-slate-100 p-4 flex items-center justify-between select-none">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setView("help-center")}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">Mail Support</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Direct email communication</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="h-7 w-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col justify-center items-center text-center bg-slate-50/50 space-y-4">
                <div className="h-14 w-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0d6e5a] shadow-xs">
                  <Mail className="h-7 w-7" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-extrabold text-slate-900">Email Our Support Team</h4>
                  <p className="text-xs text-slate-500 max-w-[260px]">
                    Have an inquiry, billing issue, or feature request? Email us directly and our team will get back to you within 24 hours.
                  </p>
                </div>

                <div className="w-full bg-white border border-slate-200 rounded-xl p-3 shadow-xs space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Official Support Email</span>
                  <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-sm font-mono font-bold text-[#0d6e5a] truncate select-all">
                      support@rolefuse.in
                    </span>
                    <button
                      type="button"
                      onClick={copySupportEmail}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer shadow-xs shrink-0"
                      title="Copy email address"
                    >
                      {copiedEmail ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-slate-500" />}
                      <span>{copiedEmail ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Back Link */}
              <div className="p-3.5 border-t border-slate-200 text-center bg-slate-50">
                <button
                  type="button"
                  onClick={() => setView("help-center")}
                  className="text-xs font-bold text-slate-500 hover:text-[#0d6e5a] transition-colors"
                >
                  &larr; Back to Help Center FAQs
                </button>
              </div>
            </div>
          )}

        </Card>
      )}
    </div>
    </>
  );
}
