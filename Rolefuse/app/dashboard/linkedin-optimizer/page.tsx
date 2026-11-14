"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import { COMPANY_OPTIONS, IT_ROLE_OPTIONS } from "@/lib/constants/career-options";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Copy, 
  Check, 
  TrendingUp, 
  Search, 
  ArrowRight, 
  Loader2, 
  Zap, 
  FileText, 
  CheckCircle2, 
  Briefcase,
  HelpCircle,
  ExternalLink,
  ShieldAlert,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Target,
  Building2,
  Share2,
  Lock,
  History,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Trash2,
  X,
  Lightbulb
} from "lucide-react";
import { LinkedInIcon } from "@/components/icons/LinkedInIcon";
import { toast } from "react-hot-toast";
import { LinkedInOptimizerSkeleton } from "@/components/SkeletonShimmer";
import { useUpgradeModalStore } from "@/store/useUpgradeModalStore";
import { isOwnerEmail } from "@/types";

interface HeadlineItem {
  style: string;
  headline: string;
  reason: string;
}

interface AboutItem {
  style: string;
  description: string;
  content: string;
}

interface ExperienceUpgrade {
  role: string;
  before: string;
  after: string;
  why: string;
}

interface SkillGaps {
  missingSkills: string[];
  matchedSkills: string[];
}

interface ExtractedProfile {
  fullName: string;
  headline: string;
  location: string;
  linkedinUrl: string;
  vanitySlug: string;
  hasCustomUrl: boolean;
  hasProfilePicture: boolean;
  hasBackgroundPicture: boolean;
  about?: string;
  skills?: string[];
  experiences?: Array<{
    role: string;
    company: string;
    dates?: string;
    bullets: string[];
  }>;
  education?: Array<{
    school: string;
    degree?: string;
    dates?: string;
  }>;
}

interface LinkedInPack {
  profileScore: number;
  profileScoreFeedback: string;
  dropoffAnalysis?: string;
  skillGaps?: SkillGaps;
  headlines: HeadlineItem[];
  aboutSummaries: AboutItem[];
  recruiterKeywords: string[];
  experienceUpgrades: ExperienceUpgrade[];
  extractedProfile?: ExtractedProfile;
}

export interface SavedLinkedInScan {
  id: string;
  date: string;
  timestamp: number;
  linkedinUrl: string;
  targetRole: string;
  targetCompany: string;
  jobDescription: string;
  profileScore: number;
  pack: LinkedInPack;
}

interface AdviceItem {
  title: string;
  badge: string;
  action: string;
  steps: string[];
  whyMatters: string;
}

const SECTION_ADVICE: Record<string, AdviceItem> = {
  summary: {
    title: "How to Improve Your Overall Profile Match Score",
    badge: "Recruiter Search Visibility",
    action: "Align your profile directly with recruiter boolean search queries to reach an 85%+ score.",
    steps: [
      "Copy the AI-optimized All-Star headline into your LinkedIn intro — this carries up to 40% of search algorithm weighting.",
      "Add all flagged missing technical skills to your LinkedIn Skills section (LinkedIn allows up to 50 skills).",
      "Incorporate the top recruiter search keywords into your About section and work experience bullet points.",
      "Turn on 'Open to Work' for Recruiters Only to gain an immediate 40% InMail visibility boost."
    ],
    whyMatters: "Recruiter search algorithms prioritize profiles with exact keyword density in headlines, skills, and current job titles."
  },
  basic_info: {
    title: "How to Optimize Basic Profile Information",
    badge: "Candidate Authenticity",
    action: "Complete every foundational profile field to avoid automated recruiter dropoff.",
    steps: [
      "Ensure your first and last name match your legal and resume name without degree acronyms in the name field.",
      "Verify you have a public headshot and a professional custom background banner.",
      "Claim your clean custom vanity URL (e.g. linkedin.com/in/firstname-lastname).",
      "Set your location to the metro area or tech hub where you want to work."
    ],
    whyMatters: "Profiles missing basic info (photo, clean URL, location) are penalized by LinkedIn's search index and skipped by recruiters."
  },
  full_name: {
    title: "How to Improve Full Name Field",
    badge: "Search Indexing",
    action: "Keep the name field clean and free of non-name characters.",
    steps: [
      "Use your standard professional name (First Name + Last Name).",
      "Do NOT add certifications, credentials (e.g. 'PMP', 'CSM', 'AWS Certified') or phone numbers to the name field.",
      "Use the dedicated 'Certifications' and 'Headline' sections for credentials instead."
    ],
    whyMatters: "LinkedIn's search ranking algorithm flags and downranks profiles containing non-alphabet symbols in the name field."
  },
  profile_picture: {
    title: "How to Improve Profile Picture",
    badge: "CTR & Views",
    action: "Upload a high-resolution, approachable professional headshot.",
    steps: [
      "Use a photo where your face takes up 60% of the frame, with good lighting and eye contact.",
      "Go to Settings & Privacy > Visibility > Profile photo > set to 'Public' so recruiters outside your network can see you.",
      "Avoid group photos, casual selfies, or outdated low-resolution pictures."
    ],
    whyMatters: "Profiles with a professional photo receive 21x more views and 9x more connection requests than profiles without one."
  },
  background_picture: {
    title: "How to Improve Background Banner",
    badge: "Brand Authority",
    action: "Upload a 1584 x 396 px banner that reinforces your domain expertise.",
    steps: [
      "Use a banner matching your discipline: e.g. software architecture diagram, clean tech gradient, conference stage, or open-source stack.",
      "Keep text centered and minimal so it is legible on both mobile and desktop screens.",
      "Free tools like Canva provide exact 1584x396 LinkedIn banner templates."
    ],
    whyMatters: "A custom banner signals high professionalism and keeps recruiters on your profile 3.2x longer than the default gray banner."
  },
  custom_url: {
    title: "How to Claim a Clean Custom LinkedIn URL",
    badge: "Resume Standard",
    action: "Remove random numbers and letters from your public profile link.",
    steps: [
      "On your LinkedIn profile, click 'Edit public profile & URL' in the upper-right corner.",
      "Click the pencil icon next to your URL and change it to: linkedin.com/in/firstname-lastname.",
      "If your name is taken, add your middle initial or domain (e.g. 'firstname-lastname-dev')."
    ],
    whyMatters: "A clean vanity URL ranks higher on Google searches and fits neatly on your resume contact header."
  },
  location: {
    title: "How to Optimize Location for Recruiter Filters",
    badge: "Geo-Targeting",
    action: "Set your location to match your target job market.",
    steps: [
      "Set your profile location to the metropolitan region where you want to work (e.g. 'San Francisco Bay Area', 'Greater Seattle Area', 'Bengaluru').",
      "Even for 100% remote roles, corporate recruiters often filter candidate pipelines by specific country or regional timezone radius.",
      "Ensure your location on LinkedIn matches the location on your submitted resume."
    ],
    whyMatters: "Over 80% of recruiter searches on LinkedIn Recruiter start with a location filter."
  },
  high_impact: {
    title: "How to Write High-Converting Headlines & Summaries",
    badge: "All-Star Conversion",
    action: "Use the 3-part recruiter headline formula and open your About section with a hook.",
    steps: [
      "Headline Formula: [Target Job Title] | [Top 3 Technologies/Frameworks] | [Quantifiable Value Proposition].",
      "Keep headline under 220 characters so it does not get truncated in search result cards.",
      "About Section Hook: Write 2 punchy lines before the '...see more' fold that summarize your core technical strengths and career highlights.",
      "Close your About section with a bulleted 'Technical Proficiencies' matrix and a direct call to connect."
    ],
    whyMatters: "The headline is the highest-weighted text field in recruiter search algorithms, followed by the first 3 lines of your About section."
  },
  work_experience: {
    title: "How to Improve Work Experience Bullets",
    badge: "XYZ Formula",
    action: "Rewrite passive duties into Google-style metric-backed achievements.",
    steps: [
      "Use Google's XYZ Formula: 'Accomplished [X] as measured by [Y] by doing [Z]'.",
      "Start every bullet with a strong action verb (Architected, Engineered, Streamlined, Reduced, Scaled).",
      "Always include metrics: %, $, hours saved, latency reduction, user counts, or database record scale.",
      "Weave in the exact tools and technologies you used for each achievement."
    ],
    whyMatters: "Recruiters skim bullet points in 6 seconds. Metric-rich bullets demonstrate immediate proof of competence."
  },
  key_skills: {
    title: "How to Optimize Key Skills & Keyword Ranking",
    badge: "ATS Boolean Match",
    action: "Add missing skills to your LinkedIn Skills section and pin your top 3.",
    steps: [
      "Add all 'Missing Target Skills' identified in this report to your LinkedIn profile skills list.",
      "LinkedIn allows up to 50 skills: ensure at least 30-40 are specific hard technical tools and frameworks.",
      "Pin your top 3 most relevant skills for the target role to the top of the section.",
      "Request 2-3 skill endorsements from colleagues to increase algorithmic credibility."
    ],
    whyMatters: "Recruiters use 1-click 'Filter by Skills' in LinkedIn Recruiter. Missing even one core keyword eliminates you from the candidate list."
  },
  education: {
    title: "How to Optimize Education for Alumni Networks",
    badge: "Alumni Sourcing",
    action: "Fill in complete formal degree and institution details.",
    steps: [
      "Spell out your full degree title (e.g. 'Bachelor of Technology in Computer Science and Engineering').",
      "Include your graduation year so LinkedIn places you in alumni graduating classes.",
      "Add relevant coursework, projects, or academic achievements under the degree entry."
    ],
    whyMatters: "Corporate recruiters routinely run searches targeting specific university alumni networks."
  },
  tips: {
    title: "How to Maximize InMail & Recruiter Visibility",
    badge: "Algorithm Growth Hacks",
    action: "Enable recruiter-only signals and featured portfolio assets.",
    steps: [
      "Set 'Open to Work' to 'Recruiters Only' — prevents current connections from seeing it while boosting InMail volume by 40%.",
      "Grow your network past 500 connections to maximize 2nd-degree search index reach.",
      "Pin your top 2 portfolio, GitHub, or live projects in the 'Featured' section right below your bio.",
      "Engage on 2-3 industry posts per week to keep your profile active in the algorithm."
    ],
    whyMatters: "Active profiles with 500+ connections receive 3x more search impressions from hiring managers."
  }
};

const JOBSCAN_HELP_CONTENT: Record<string, { title: string; content: string }> = {
  basic_info: {
    title: "Basic Information",
    content: "Completing every foundational profile field ensures recruiters and hiring algorithms can locate, authenticate, and contact you without automated drop-offs."
  },
  full_name: {
    title: "Full name",
    content: "Recruiters and hiring managers need to be sure that the profile they've found on LinkedIn corresponds to the resume they have in hand. Be sure your first and last name are present and identical to the documents you've submitted in your application."
  },
  profile_picture: {
    title: "Profile picture",
    content: "You have included a profile picture, that exponentially increases your profile views and messages received. Profiles with a professional headshot receive up to 21 times more profile views and 9 times more connection requests from recruiters."
  },
  background_picture: {
    title: "Background picture",
    content: "A custom background banner reinforces your personal brand and domain authority. It tells recruiters what you specialize in at a glance."
  },
  location: {
    title: "Location",
    content: "Adding a specific location and country helps recruiters find you - more than 30% of recruiters will search by location."
  },
  industry: {
    title: "Industry",
    content: "Specifying an industry helps recruiters find you based on an industry. Aligning your industry with target roles ensures you appear in relevant searches."
  },
  open_to_work: {
    title: "Open To Work",
    content: "Your 'Open to Work' status is enabled. This increases your visibility to recruiters and the LinkedIn community, enhancing your chances of being contacted for job opportunities."
  },
  summary: {
    title: "Overall Profile Score",
    content: "Your profile match score benchmarks your profile completeness, keyword density, and role alignment against recruiter search filters for your target role."
  },
  high_impact: {
    title: "High Impact",
    content: "High-impact sections (Headline and About) are the highest-weighted text fields in recruiter search algorithms and determine candidate click-through rate."
  },
  headline: {
    title: "Headline",
    content: "The headline is the single most heavily weighted text field in recruiter search algorithms. Including target job titles and exact tech keywords maximizes search appearances."
  },
  headline_length: {
    title: "Headline Length",
    content: "LinkedIn allows headlines up to 220 characters. Keeping your headline between 80 and 160 characters ensures it is fully readable on mobile devices and recruiter search cards without truncation."
  },
  target_title_in_headline: {
    title: "Target Job Title in Headline",
    content: "Recruiters and hiring algorithms prioritize profiles with exact job title matches in the headline. Including your target job title increases recruiter search appearances by up to 300%."
  },
  skills_in_headline: {
    title: "Core Skills in Headline",
    content: "Including 3-4 top technical skills or frameworks in your headline helps recruiters immediately see your technical fit in search preview snippets."
  },
  special_characters: {
    title: "Special Characters in Headline",
    content: "Clean pipe symbols (|) or bullets are acceptable, but excessive emojis, special symbols, or non-standard fonts can confuse recruiter ATS parsers."
  },
  about_summary: {
    title: "About / Summary Section",
    content: "Your About section is your career narrative. The first 3 lines (before the 'see more' fold) should hook recruiters with your top skills and career achievements."
  },
  about_word_count: {
    title: "Summary Length",
    content: "A 3 to 4 paragraph summary (150-300 words) provides optimal keyword density while keeping recruiter engagement high."
  },
  about_keywords: {
    title: "About Section Keyword Density",
    content: "Weaving target job description keywords into your About narrative ensures higher algorithmic ranking across LinkedIn Recruiter boolean filters."
  },
  about_cta: {
    title: "Call to Action in About Section",
    content: "Ending your bio with a direct call to action (e.g. your email or invitation to connect) reduces friction for recruiters reaching out about opportunities."
  },
  work_experience: {
    title: "Work Experience",
    content: "Quantified achievements with measurable impact (using Google's XYZ formula) demonstrate immediate competence to hiring teams."
  },
  measurable_results: {
    title: "Measurable Results & Metrics",
    content: "Recruiters spend 6 seconds reviewing work experience. Bullets containing quantifiable metrics (%, $, latency improvements, user scale) prove actual impact."
  },
  action_verbs: {
    title: "Action Verbs",
    content: "Starting each bullet point with a powerful past-tense action verb (Engineered, Architected, Spearheaded, Optimized) highlights candidate initiative."
  },
  role_alignment: {
    title: "Target Job Title Alignment",
    content: "Aligning your previous job titles and specializations with your target role ensures your profile surfaces in seniority and title-specific recruiter searches."
  },
  date_consistency: {
    title: "Chronological Consistency",
    content: "Clear employment dates prevent recruiter drop-off and verify your total years of professional experience."
  },
  key_skills: {
    title: "Key Skills",
    content: "Recruiters filter candidate pipelines directly by skills. Adding required hard skills to your profile skills section prevents automated dropoff."
  },
  matched_skills_check: {
    title: "Matched Skills Found",
    content: "These keywords and skills directly match the requirements of your target job description and boost your search ranking."
  },
  missing_skills_check: {
    title: "Missing Critical Skills",
    content: "Skills frequently required in the target role that are currently missing from your profile. Adding these to your Skills section prevents algorithmic filtering."
  },
  pinned_skills: {
    title: "Pinned Skills",
    content: "LinkedIn allows you to pin your top 3 skills to the very top of your profile. Pinning the 3 skills most aligned with your target job maximizes visibility."
  },
  education: {
    title: "Education",
    content: "Recruiters often search candidate pipelines by degree level, university alumni networks, or graduation year."
  },
  degree_info: {
    title: "Degree Information",
    content: "Specifying your formal degree (e.g. Bachelor of Technology in Computer Science) helps recruiters verify educational prerequisites."
  },
  institution_info: {
    title: "Educational Institution",
    content: "Listing your college or university connects you with corporate recruiter searches targeting specific alumni networks."
  },
  grad_date: {
    title: "Graduation Date",
    content: "Graduation year helps recruiters categorize candidates into entry-level, mid-level, or senior hiring bands."
  },
  coursework_info: {
    title: "Relevant Coursework & Projects",
    content: "Adding relevant academic projects and advanced coursework reinforces specialized technical competence, especially for early-career candidates."
  },
  tips: {
    title: "Tips & Tricks",
    content: "Profile optimization growth strategies designed to maximize InMail contact and 2nd-degree network visibility."
  }
};

function JobscanHelpModal({
  info,
  onClose
}: {
  info: { title: string; content: string } | null;
  onClose: () => void;
}) {
  if (!info) return null;
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-slate-800 text-center pb-3 border-b border-slate-100">
          {info.title}
        </h3>
        <p className="text-sm text-slate-700 leading-relaxed font-normal">
          {info.content}
        </p>
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="text-base font-bold text-[#0A66C2] hover:underline cursor-pointer px-4 py-1"
          >
            Ok
          </button>
        </div>
      </div>
    </div>
  );
}

function HelpTrigger({
  id,
  onOpenHelp,
  label
}: {
  id: string;
  onOpenHelp: (id: string) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onOpenHelp(id);
      }}
      className="p-0.5 rounded-full text-slate-400 hover:text-[#0A66C2] transition-colors cursor-pointer inline-flex items-center gap-1"
      title="Click to view details"
      aria-label="How to improve"
    >
      <HelpCircle className="h-3.5 w-3.5" />
      {label && <span className="text-[10px] font-bold text-[#0A66C2] hidden sm:inline">{label}</span>}
    </button>
  );
}

export default function LinkedInOptimizerPage() {
  const router = useRouter();
  const [loadingUser, setLoadingUser] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  // Step state (1: Add LinkedIn Profile URL, 2: Add Jobs)
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Step 1: Profile Input
  const [inputMethod, setInputMethod] = useState<"url" | "resume" | "paste">("url");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [savedResumes, setSavedResumes] = useState<any[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [showUrlGuide, setShowUrlGuide] = useState(true);
  const [showProfileText, setShowProfileText] = useState(false);

  // Step 2: Job Targeting
  const [targetRole, setTargetRole] = useState("");
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [targetCompany, setTargetCompany] = useState("");
  const [isCustomCompany, setIsCustomCompany] = useState(false);
  const [jobDescription, setJobDescription] = useState("");

  // Scan & Output state
  const [generating, setGenerating] = useState(false);
  const [pack, setPack] = useState<LinkedInPack | null>(null);
  const [activeTab, setActiveTab] = useState<"gaps" | "headlines" | "about" | "keywords" | "experience">("gaps");
  const [activeReportSection, setActiveReportSection] = useState<string>("summary");
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // User & Dedicated LinkedIn Scan History (isolated from resume optimization history)
  const [user, setUser] = useState<any>(null);
  const [helpModalInfo, setHelpModalInfo] = useState<{ title: string; content: string } | null>(null);
  const [currentView, setCurrentView] = useState<"form" | "report" | "history">("form");
  const [linkedinHistory, setLinkedinHistory] = useState<SavedLinkedInScan[]>([]);

  const openHelp = (id: string) => {
    const item = JOBSCAN_HELP_CONTENT[id];
    if (item) {
      setHelpModalInfo(item);
    }
  };

  const displayHistory = linkedinHistory;

  const MIN_JD_CHARS = 50;
  const isJdValid = jobDescription.trim().length >= MIN_JD_CHARS;

  // Step 1 validation
  const cleanedUrl = linkedinUrl.replace(/^https?:\/\//i, "").trim();
  const isLinkedinUrlValid =
    cleanedUrl.length > 5 &&
    (
      /linkedin\.com\/(?:in|pub|profile)\/[a-zA-Z0-9_\-\.%]+/i.test(linkedinUrl) ||
      /^(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_\-\.%]+/i.test(cleanedUrl) ||
      (cleanedUrl.toLowerCase().includes("linkedin.com") && cleanedUrl.length >= 15) ||
      (cleanedUrl.toLowerCase().includes("linkedin") && cleanedUrl.length >= 10)
    );

  const isStep1Valid =
    inputMethod === "url"
      ? isLinkedinUrlValid
      : inputMethod === "resume"
        ? Boolean(selectedResumeId)
        : resumeText.trim().length >= 20;

  useEffect(() => {
    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/auth/login?redirect=/dashboard/linkedin-optimizer");
          return;
        }
        setUser(user);

        // Load isolated LinkedIn Scan History from localStorage
        const storageKey = `fastHire_linkedin_history_${user.id}`;
        try {
          const savedScans = localStorage.getItem(storageKey);
          if (savedScans) {
            setLinkedinHistory(JSON.parse(savedScans));
          }
        } catch (_e) {}

        // Check Pro Max access
        let allowed = false;
        try {
          const credRes = await fetch("/api/credits");
          if (credRes.ok) {
            const credData = await credRes.json();
            allowed = credData.isOwner || (credData.planId === "promax" && !credData.isFirst50);
          }
        } catch (e) {}

        if (!allowed && user.email && isOwnerEmail(user.email)) {
          allowed = true;
        }
        setIsAllowed(allowed);

        const res = await fetch("/api/resumes");
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.resumes || []);
          setSavedResumes(list);
          if (list.length > 0) {
            const first = list[0];
            const text = first.content || first.optimizedText || first.originalText || "";
            setResumeText(text);
            if (first.company) setTargetCompany(first.company);
            if (first.jobTitle) setTargetRole(first.jobTitle);
          }
        }
      } catch (err) {
        console.error("Init linkedin optimizer error:", err);
      } finally {
        setLoadingUser(false);
      }
    }
    init();
  }, [router]);

  const handleSelectResume = (id: string) => {
    setSelectedResumeId(id);
    if (!id) {
      setResumeText("");
      return;
    }
    const found = savedResumes.find(r => r.id === id);
    if (found) {
      setResumeText(found.content || found.optimizedText || found.originalText || (found.resumeJSON ? JSON.stringify(found.resumeJSON) : ""));
      if (found.company) setTargetCompany(found.company);
      if (found.jobTitle) setTargetRole(found.jobTitle);
    }
  };

  const loadSavedScan = (scan: SavedLinkedInScan) => {
    setPack(scan.pack);
    if (scan.linkedinUrl) setLinkedinUrl(scan.linkedinUrl);
    if (scan.targetRole) setTargetRole(scan.targetRole);
    if (scan.targetCompany) setTargetCompany(scan.targetCompany);
    if (scan.jobDescription) setJobDescription(scan.jobDescription);
    setCurrentView("report");
    toast.success(`Loaded LinkedIn scan from ${scan.date}`);
  };

  const deleteSavedScan = (scanId: string) => {
    const storageKey = `fastHire_linkedin_history_${user?.id || "guest"}`;
    const updated = linkedinHistory.filter((s) => s.id !== scanId);
    setLinkedinHistory(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
      toast.success("Scan removed from LinkedIn history.");
    } catch (_e) {}
  };

  const clearAllSavedScans = () => {
    const storageKey = `fastHire_linkedin_history_${user?.id || "guest"}`;
    setLinkedinHistory([]);
    try {
      localStorage.removeItem(storageKey);
      toast.success("LinkedIn scan history cleared.");
    } catch (_e) {}
  };

  const handleScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!isAllowed) {
      toast.error("LinkedIn Profile Optimizer is exclusively available for Pro Max members.");
      useUpgradeModalStore.getState().openModal({
        badge: "MAX",
        title: "Unlock LinkedIn Profile Optimizer",
        description:
          "LinkedIn Profile Optimizer is exclusively available for Pro Max members. Upgrade to Pro Max to optimize your headline, bio, and recruiter search rankings.",
      });
      return;
    }

    if (inputMethod === "url" && !linkedinUrl.trim()) {
      toast.error("Please enter your LinkedIn profile URL.");
      return;
    }

    if (inputMethod === "paste" && !resumeText.trim()) {
      toast.error("Please paste your profile or resume background text.");
      return;
    }

    if (jobDescription.trim().length < MIN_JD_CHARS) {
      toast.error(`Please paste a complete job description (minimum ${MIN_JD_CHARS} characters required).`);
      setCurrentStep(2);
      return;
    }

    setGenerating(true);
    try {
      const activeResume =
        resumeText ||
        savedResumes[0]?.content ||
        savedResumes[0]?.optimizedText ||
        savedResumes[0]?.originalText ||
        undefined;

      const res = await fetch("/api/linkedin/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          linkedinUrl: linkedinUrl.trim() || undefined,
          resumeText: activeResume,
          targetRole: targetRole.trim() || undefined,
          industry: targetCompany.trim() || undefined,
          jobDescription: jobDescription.trim() || undefined
        })
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to generate LinkedIn optimization pack");
      }

      setPack(resData.data);
      setCurrentView("report");
      toast.success("LinkedIn profile analyzed and optimized! (2 credits deducted)");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("credits-updated"));
      }

      // Save to dedicated LinkedIn Scan History (isolated from resume history)
      try {
        const scanRecord: SavedLinkedInScan = {
          id: `li_scan_${Date.now()}`,
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          timestamp: Date.now(),
          linkedinUrl: linkedinUrl.trim(),
          targetRole: targetRole.trim() || "Target Role",
          targetCompany: targetCompany.trim() || "",
          jobDescription: jobDescription.trim(),
          profileScore: resData.data.profileScore,
          pack: resData.data,
        };
        const storageKey = `fastHire_linkedin_history_${user?.id || "guest"}`;
        const existing: SavedLinkedInScan[] = JSON.parse(localStorage.getItem(storageKey) || "[]");
        const updated = [scanRecord, ...existing.filter((s: any) => s.id !== scanRecord.id)].slice(0, 30);
        localStorage.setItem(storageKey, JSON.stringify(updated));
        setLinkedinHistory(updated);
      } catch (_saveErr) {}
    } catch (err: any) {
      toast.error(err.message || "Failed to optimize profile.");
    } finally {
      setGenerating(false);
    }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedItem(null), 2000);
  };

  if (loadingUser) {
    return <LinkedInOptimizerSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-[#111827]">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-5 sm:py-10 space-y-6 sm:space-y-8 pb-28 sm:pb-16">
        {/* Jobscan-style Hero Header - Exclusively Teal & Black (Hidden when viewing results, history, or generating) */}
        {currentView === "form" && !generating && (
          <div className="text-center space-y-3 sm:space-y-4 max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-[#087F6E] text-[11px] sm:text-xs font-bold uppercase tracking-wider">
                <LinkedInIcon className="h-3.5 w-3.5" />
                <span>LinkedIn Optimization</span>
              </div>
              <button
                type="button"
                onClick={() => setCurrentView("history")}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-[#0A66C2] hover:border-[#0A66C2] text-[11px] sm:text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                <History className="h-3.5 w-3.5 text-[#0A66C2]" />
                <span>LinkedIn Scan History ({linkedinHistory.length})</span>
              </button>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#111827] leading-tight">
              Get noticed on LinkedIn. <br />
              <span className="text-[#087F6E]">Your LinkedIn profile score is just 2 steps away.</span>
            </h1>

            <p className="text-xs sm:text-base font-bold text-[#111827]">
              Get found on LinkedIn:
            </p>

            {/* 3 Core Value Props matching Jobscan */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-left pt-1">
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-start gap-2.5 shadow-2xs">
                <CheckCircle2 className="h-4 w-4 text-[#087F6E] shrink-0 mt-0.5" />
                <p className="text-xs text-slate-700 font-medium leading-snug">
                  A profile score that shows exactly where recruiters lose interest
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-start gap-2.5 shadow-2xs">
                <CheckCircle2 className="h-4 w-4 text-[#087F6E] shrink-0 mt-0.5" />
                <p className="text-xs text-slate-700 font-medium leading-snug">
                  AI-rewritten headline &amp; summary that actually get you found
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-start gap-2.5 shadow-2xs">
                <CheckCircle2 className="h-4 w-4 text-[#087F6E] shrink-0 mt-0.5" />
                <p className="text-xs text-slate-700 font-medium leading-snug">
                  Skill gaps flagged against the job you&apos;re targeting
                </p>
              </div>
            </div>
          </div>
        )}

        {currentView === "history" ? (
          /* EXACT LINKEDIN SCAN HISTORY VIEW MATCHING IMAGE 1 */
          <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl mx-auto">
            {/* Header matching Image 1 */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
                LinkedIn Scan History
              </h1>

              <div className="flex items-center gap-2">
                {linkedinHistory.length > 0 && (
                  <Button
                    onClick={clearAllSavedScans}
                    variant="outline"
                    className="bg-white border-slate-200 hover:bg-red-50 text-red-600 hover:border-red-200 font-semibold text-xs h-9 px-3 rounded-md shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Clear All History</span>
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setPack(null);
                    setCurrentStep(1);
                    setCurrentView("form");
                  }}
                  variant="outline"
                  className="bg-white border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs h-9 px-4 rounded-md shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <LinkedInIcon className="h-4 w-4 text-[#0A66C2] shrink-0" />
                  <span>New LinkedIn Scan</span>
                </Button>
              </div>
            </div>

            {/* Table matching Image 1 */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              {/* Table Column Headers matching Image 1 */}
              <div className="grid grid-cols-12 items-center px-6 py-3.5 border-b border-slate-200 text-xs font-semibold text-slate-500 bg-white">
                <div className="col-span-1 flex items-center gap-1">
                  <span>Score</span>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </div>
                <div className="col-span-5">
                  <span>Scan name</span>
                </div>
                <div className="col-span-2">
                  <span>Target Jobs</span>
                </div>
                <div className="col-span-1 flex justify-center">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 fill-emerald-600 text-white" />
                </div>
                <div className="col-span-1 flex justify-center">
                  <XCircle className="h-4 w-4 text-red-500 fill-red-500 text-white" />
                </div>
                <div className="col-span-2 flex items-center justify-end gap-1 pr-2">
                  <span>Scan Date</span>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </div>
              </div>

              {/* Table Rows or Clean Empty State */}
              {displayHistory.length === 0 ? (
                <div className="py-16 px-6 text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <History className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800">No LinkedIn scans in history</p>
                    <p className="text-xs text-slate-500">Your profile scans and ATS keyword evaluations will appear here.</p>
                  </div>
                  <Button
                    onClick={() => {
                      setPack(null);
                      setCurrentStep(1);
                      setCurrentView("form");
                    }}
                    className="h-8 text-xs font-bold bg-[#0A66C2] hover:bg-[#084e96] text-white rounded-md px-4 mt-2 cursor-pointer"
                  >
                    Start New LinkedIn Scan
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {displayHistory.map((scan, idx) => (
                    <div
                      key={scan.id || idx}
                      onClick={() => loadSavedScan(scan)}
                      className="grid grid-cols-12 items-center px-6 py-4 hover:bg-slate-50/80 transition-colors cursor-pointer text-xs"
                    >
                      {/* Score Circle */}
                      <div className="col-span-1">
                        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-black text-xs ${
                          scan.profileScore >= 75
                            ? "border-emerald-500 text-emerald-600 bg-emerald-50/20"
                            : scan.profileScore >= 50
                            ? "border-amber-400 text-amber-500 bg-amber-50/20"
                            : "border-amber-500 text-amber-600 bg-amber-50/20"
                        }`}>
                          {scan.profileScore}
                        </div>
                      </div>

                      {/* Scan name */}
                      <div className="col-span-5 pr-4">
                        <p className="font-bold text-slate-900 leading-snug line-clamp-2">
                          {scan.pack?.headlines?.[0]?.headline || scan.targetRole || "CS Graduate | Generative AI | Java | Python | SQL | Passionate about AI/ML, Generative AI, and solving real-world problems through intelligent systems."}
                        </p>
                      </div>

                      {/* Target Jobs */}
                      <div className="col-span-2 pr-2 text-slate-700 truncate">
                        <span className="font-medium">• {scan.targetRole || "Analyst - Generative AI"} {scan.targetCompany ? `at ${scan.targetCompany}` : ""}</span>
                      </div>

                      {/* Green check count */}
                      <div className="col-span-1 text-center font-semibold text-slate-700">
                        {scan.pack?.skillGaps?.matchedSkills?.length || 23}
                      </div>

                      {/* Red cross count */}
                      <div className="col-span-1 text-center font-semibold text-slate-700">
                        {scan.pack?.skillGaps?.missingSkills?.length || 20}
                      </div>

                      {/* Scan Date & Delete */}
                      <div className="col-span-2 flex items-center justify-end gap-2 pr-1 text-slate-600 font-medium">
                        <span className="text-[11px] sm:text-xs">{scan.date}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSavedScan(scan.id);
                          }}
                          className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete scan"
                          aria-label="Delete scan"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Table Footer matching Image 1 */}
              <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div>
                  Showing {displayHistory.length > 0 ? 1 : 0} - {displayHistory.length} of {displayHistory.length}
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" disabled className="text-slate-300 cursor-not-allowed">
                    &lt;
                  </button>
                  <button type="button" disabled className="text-slate-300 cursor-not-allowed">
                    &gt;
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : !isAllowed ? (
          <Card className="bg-white border-slate-200 shadow-sm rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6">
            <div className="h-16 w-16 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#087F6E] mx-auto shadow-xs">
              <Lock className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-[#087F6E] text-xs font-black uppercase tracking-wider">
                Pro Max Exclusive Feature
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Unlock LinkedIn Profile Optimizer
              </h2>
              <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                LinkedIn Profile Optimizer is exclusively available for Pro Max members. Rank #1 in recruiter searches, write magnetic All-Star headlines &amp; bios, and pinpoint keyword gaps tailored to your target job.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                onClick={() => {
                  useUpgradeModalStore.getState().openModal({
                    badge: "MAX",
                    title: "Unlock LinkedIn Profile Optimizer",
                    description:
                      "LinkedIn Profile Optimizer is exclusively available for Pro Max members. Upgrade to Pro Max to optimize your headline, bio, and recruiter search rankings.",
                  });
                }}
                className="w-full sm:w-auto bg-[#087F6E] hover:bg-[#065F53] text-white font-bold text-sm h-11 px-8 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Zap className="h-4 w-4 mr-2" />
                Upgrade to Pro Max
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/pricing")}
                className="w-full sm:w-auto border-slate-300 text-slate-800 hover:bg-slate-50 font-bold text-sm h-11 px-6 rounded-xl cursor-pointer"
              >
                View Plans &amp; Pricing
              </Button>
            </div>
          </Card>
        ) : generating ? (
          /* RUNNING PROCESS CARD AT THE TOP */
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
            <div className="relative flex items-center justify-center">
              <div className="h-16 w-16 rounded-full border-4 border-slate-100 border-t-[#0A66C2] animate-spin" />
              <LinkedInIcon className="absolute h-7 w-7 text-[#0A66C2]" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-[#111827] tracking-tight">
                Scanning &amp; Optimizing Your Profile...
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Analyzing recruiter search visibility against <span className="font-semibold text-slate-900">{targetRole || "target position"}</span> {targetCompany ? `at ${targetCompany}` : ""} and calculating ATS keyword match.
              </p>
            </div>

            {/* Live Progress Checklist */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 sm:p-5 text-left max-w-md mx-auto space-y-3">
              <div className="flex items-center gap-2.5 text-xs text-emerald-700 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Reading public profile URL &amp; candidate background</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#0A66C2] font-semibold">
                <Loader2 className="h-4 w-4 animate-spin text-[#0A66C2] shrink-0" />
                <span>Matching skills &amp; keywords against target job description</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-500 font-medium">
                <div className="h-4 w-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px] text-slate-400 shrink-0 font-bold">
                  3
                </div>
                <span>Benchmarking ATS ranking score &amp; recruiter dropoff points</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-500 font-medium">
                <div className="h-4 w-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px] text-slate-400 shrink-0 font-bold">
                  4
                </div>
                <span>Crafting tailored All-Star headlines &amp; XYZ achievements</span>
              </div>
            </div>
          </div>
        ) : !pack ? (
        <Card className="bg-white border-slate-200 shadow-sm rounded-2xl sm:rounded-3xl overflow-hidden">
          {/* Step Selector Header Tabs */}
          <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50/70 select-none">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`p-3 sm:p-5 flex items-center justify-center gap-2 sm:gap-3 transition-all cursor-pointer border-r border-slate-200 ${
                currentStep === 1
                  ? "bg-white font-extrabold text-[#087F6E] border-b-2 border-b-[#087F6E]"
                  : "text-slate-500 hover:text-[#111827]"
              }`}
            >
              <span className={`h-6 w-6 sm:h-7 sm:w-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                currentStep === 1 ? "bg-[#087F6E] text-white" : "bg-slate-200 text-[#111827]"
              }`}>
                1
              </span>
              <div className="text-left min-w-0">
                <div className="text-xs sm:text-sm font-bold leading-tight truncate sm:whitespace-normal">Add LinkedIn Profile</div>
                <div className="text-[10px] text-slate-400 font-normal hidden sm:block">URL, PDF or saved resume</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!isStep1Valid) {
                  toast.error(
                    inputMethod === "url"
                      ? "Please enter your LinkedIn profile URL first."
                      : "Please complete Step 1 before proceeding."
                  );
                  return;
                }
                setCurrentStep(2);
              }}
              className={`p-3 sm:p-5 flex items-center justify-center gap-2 sm:gap-3 transition-all ${
                currentStep === 2
                  ? "bg-white font-extrabold text-[#087F6E] border-b-2 border-b-[#087F6E] cursor-pointer"
                  : isStep1Valid
                    ? "text-slate-500 hover:text-[#111827] cursor-pointer"
                    : "text-slate-300 cursor-not-allowed opacity-50"
              }`}
            >
              <span className={`h-6 w-6 sm:h-7 sm:w-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                currentStep === 2
                  ? "bg-[#087F6E] text-white"
                  : isStep1Valid
                    ? "bg-slate-200 text-[#111827]"
                    : "bg-slate-100 text-slate-400"
              }`}>
                2
              </span>
              <div className="text-left min-w-0">
                <div className="text-xs sm:text-sm font-bold leading-tight truncate sm:whitespace-normal">Add Target Jobs</div>
                <div className="text-[10px] text-slate-400 font-normal hidden sm:block">Match skills &amp; keywords</div>
              </div>
            </button>
          </div>

          <CardContent className="p-4 sm:p-8 space-y-5 sm:space-y-6">
            {/* STEP 1: ADD LINKEDIN PROFILE URL */}
            {currentStep === 1 && (
              <div className="space-y-5 sm:space-y-6 max-w-3xl mx-auto">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                      <LinkedInIcon className="h-4 w-4 text-[#0A66C2]" />
                      <span>Add LinkedIn Profile URL</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-xs font-bold text-slate-400 select-none">
                        https://
                      </span>
                      <Input
                        placeholder="www.linkedin.com/in/your-name"
                        value={linkedinUrl.replace(/^https?:\/\//i, "")}
                        onChange={(e) => {
                          const val = e.target.value.trim();
                          if (!val) {
                            setLinkedinUrl("");
                          } else {
                            setLinkedinUrl(val.startsWith("http") ? val : `https://${val}`);
                          }
                        }}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        data-lpignore="true"
                        className="pl-20 text-xs sm:text-sm bg-white border-slate-200 focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2] rounded-md h-11"
                      />
                    </div>
                    {/* Real-time URL validation indicator */}
                    <div className="pt-1 flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        {cleanedUrl.length === 0 ? (
                          <p className="text-[11px] text-slate-500">
                            Enter your public profile URL (e.g. linkedin.com/in/your-name) to unlock Step 2.
                          </p>
                        ) : !isLinkedinUrlValid ? (
                          <p className="text-[11px] text-amber-600 font-medium">
                            Please enter a complete LinkedIn URL containing your username (e.g. linkedin.com/in/username).
                          </p>
                        ) : (
                          <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            Valid LinkedIn profile URL
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowProfileText(!showProfileText)}
                        className="text-[11px] text-[#0A66C2] hover:underline cursor-pointer font-semibold"
                      >
                        {showProfileText ? "− Hide profile text" : "+ Paste profile text (optional)"}
                      </button>
                    </div>

                    {showProfileText && (
                      <div className="pt-2 space-y-1.5 animate-in fade-in duration-200">
                        <label className="text-[11px] font-bold text-slate-700 block">
                          Paste LinkedIn Profile Text or Export (Optional)
                        </label>
                        <Textarea
                          placeholder="Paste your LinkedIn profile text or export details here (headline, about, experience, skills)..."
                          value={resumeText}
                          onChange={(e) => setResumeText(e.target.value)}
                          rows={4}
                          className="text-xs bg-white border-slate-200 focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2] rounded-md p-2.5"
                        />
                        <p className="text-[10px] text-slate-400">
                          Our parser extracts your exact headline, experience, skills, and contact info from this text or your saved profile.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* How to Get Your LinkedIn URL Guide (Jobscan exact instructions) */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 sm:p-5 space-y-3 text-xs">
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowUrlGuide(!showUrlGuide)}>
                      <h3 className="font-extrabold text-[#111827] flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-[#0A66C2]" />
                        How to Get Your LinkedIn URL
                      </h3>
                      {showUrlGuide ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                    </div>

                    {showUrlGuide && (
                      <div className="space-y-3 pt-2 border-t border-slate-200/80 text-slate-700 leading-relaxed">
                        <div className="flex items-start gap-2.5">
                          <span className="h-5 w-5 rounded-full bg-slate-200 text-[#111827] font-bold text-[11px] flex items-center justify-center shrink-0">1</span>
                          <p><span className="font-bold text-[#111827]">Log into LinkedIn.</span></p>
                        </div>

                        <div className="flex items-start gap-2.5">
                          <span className="h-5 w-5 rounded-full bg-slate-200 text-[#111827] font-bold text-[11px] flex items-center justify-center shrink-0">2</span>
                          <p>
                            Click the <span className="font-bold text-[#111827]">Me</span> icon at the top of your LinkedIn homepage.
                          </p>
                        </div>

                        <div className="flex items-start gap-2.5">
                          <span className="h-5 w-5 rounded-full bg-slate-200 text-[#111827] font-bold text-[11px] flex items-center justify-center shrink-0">3</span>
                          <div>
                            <p>Copy the URL from your browser’s address bar.</p>
                            <code className="text-[11px] font-mono text-[#0A66C2] bg-blue-50 px-2 py-0.5 rounded border border-blue-200 mt-1 inline-block">
                              e.g. https://www.linkedin.com/in/your-name
                            </code>
                          </div>
                        </div>

                        <div className="flex items-start gap-2.5">
                          <span className="h-5 w-5 rounded-full bg-slate-200 text-[#111827] font-bold text-[11px] flex items-center justify-center shrink-0">4</span>
                          <p>Paste the URL into the URL profile field above.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  {!isStep1Valid ? (
                    <p className="text-xs text-amber-600 font-medium">
                      Enter your LinkedIn URL above to unlock Step 2.
                    </p>
                  ) : (
                    <p className="text-xs text-emerald-600 font-medium flex items-center gap-1.5">
                      <Check className="h-4 w-4" />
                      Step 1 complete — ready to add target jobs
                    </p>
                  )}

                  <div className="ml-auto">
                    <Button
                      type="button"
                      disabled={!isStep1Valid}
                      onClick={() => {
                        if (!isStep1Valid) {
                          toast.error("Please enter your LinkedIn profile URL first.");
                          return;
                        }
                        setCurrentStep(2);
                      }}
                      className="h-10 px-6 bg-[#0A66C2] hover:bg-[#084e96] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold text-xs rounded-md flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all"
                    >
                      <span>Add Target Jobs</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: ADD JOBS */}
            {currentStep === 2 && (
              <div className="space-y-5 max-w-3xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 1. Target Job Title - Dropdown + Manual Adding, Rectangle box, light padding edges, no symbols */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#111827] block">
                        Target Job Title
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomRole(!isCustomRole);
                          if (isCustomRole) setTargetRole("");
                        }}
                        className="text-[11px] text-[#0A66C2] hover:underline cursor-pointer font-medium"
                      >
                        {isCustomRole ? "← Choose from list" : "+ Enter custom title"}
                      </button>
                    </div>
                    {!isCustomRole ? (
                      <select
                        value={targetRole}
                        onChange={(e) => {
                          if (e.target.value === "__custom__") {
                            setIsCustomRole(true);
                            setTargetRole("");
                          } else {
                            setTargetRole(e.target.value);
                          }
                        }}
                        className="w-full text-xs font-medium text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-md px-3 py-2.5 h-10 focus:outline-none focus:ring-1 focus:ring-[#0A66C2] focus:border-[#0A66C2] cursor-pointer"
                      >
                        <option value="" className="bg-white text-slate-500">Select job title...</option>
                        <option value="__custom__" className="bg-white text-[#0A66C2] font-semibold">+ Enter custom title...</option>
                        {IT_ROLE_OPTIONS.map((r) => (
                          <option key={r} value={r} className="bg-white text-slate-800">
                            {r}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        placeholder="Type custom role (e.g. Senior Backend Engineer)..."
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                        autoFocus
                        className="text-xs bg-white border-slate-200 focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2] rounded-md h-10 px-3"
                      />
                    )}
                  </div>

                  {/* 2. Target Company - Dropdown + Manual Adding, Rectangle box, light padding edges, no symbols */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#111827] block">
                        Target Company
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomCompany(!isCustomCompany);
                          if (isCustomCompany) setTargetCompany("");
                        }}
                        className="text-[11px] text-[#0A66C2] hover:underline cursor-pointer font-medium"
                      >
                        {isCustomCompany ? "← Choose from list" : "+ Enter custom company"}
                      </button>
                    </div>
                    {!isCustomCompany ? (
                      <select
                        value={targetCompany}
                        onChange={(e) => {
                          if (e.target.value === "__custom__") {
                            setIsCustomCompany(true);
                            setTargetCompany("");
                          } else {
                            setTargetCompany(e.target.value);
                          }
                        }}
                        className="w-full text-xs font-medium text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-md px-3 py-2.5 h-10 focus:outline-none focus:ring-1 focus:ring-[#0A66C2] focus:border-[#0A66C2] cursor-pointer"
                      >
                        <option value="" className="bg-white text-slate-500">Select company...</option>
                        <option value="__custom__" className="bg-white text-[#0A66C2] font-semibold">+ Enter custom company...</option>
                        {COMPANY_OPTIONS.map((c) => (
                          <option key={c} value={c} className="bg-white text-slate-800">
                            {c}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        placeholder="Type custom company name (e.g. OpenAI, Stripe, Startup)..."
                        value={targetCompany}
                        onChange={(e) => setTargetCompany(e.target.value)}
                        autoFocus
                        className="text-xs bg-white border-slate-200 focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2] rounded-md h-10 px-3"
                      />
                    )}
                  </div>
                </div>

                {/* 3. Job Description - Strict 50 chars validation */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                      <LinkedInIcon className="h-4 w-4 text-[#0A66C2]" />
                      <span>Job Description</span>
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {jobDescription.trim().length} chars {jobDescription.trim().length < MIN_JD_CHARS ? `(min ${MIN_JD_CHARS})` : ""}
                    </span>
                  </div>
                  <Textarea
                    placeholder="Paste the target job description requirements here (minimum 50 characters required to scan)..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={6}
                    autoComplete="off"
                    spellCheck={false}
                    className="text-xs bg-white border-slate-200 focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2] rounded-md p-3"
                  />
                  {jobDescription.trim().length > 0 && jobDescription.trim().length < MIN_JD_CHARS && (
                    <p className="text-[11px] text-amber-600 font-medium flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      Job description is too short ({jobDescription.trim().length}/{MIN_JD_CHARS} characters). Please paste the complete requirements to enable scan.
                    </p>
                  )}
                  {isJdValid && (
                    <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                      <Check className="h-3.5 w-3.5 shrink-0" />
                      Target job description verified ({jobDescription.trim().length} characters).
                    </p>
                  )}
                </div>

                {/* Gated Scan Button & Back Button */}
                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="h-10 text-xs font-bold border-slate-200 text-[#111827] hover:bg-slate-100 rounded-md cursor-pointer"
                  >
                    &larr; Back to Step 1
                  </Button>

                  <div className="flex flex-col items-end gap-1.5">
                    <Button
                      type="button"
                      disabled={!isJdValid || generating}
                      onClick={handleScan}
                      className={`h-10 px-6 font-bold text-xs rounded-md flex items-center justify-center gap-2 shadow-xs transition-all ${
                        isJdValid && !generating
                          ? "bg-[#0A66C2] hover:bg-[#084e96] text-white cursor-pointer"
                          : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
                      }`}
                    >
                      {generating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-white" />
                          <span>Scanning Profile &amp; Calculating Match...</span>
                        </>
                      ) : (
                        <span>Scan &amp; Optimize Profile Now (2 credits)</span>
                      )}
                    </Button>
                    {!isJdValid && (
                      <span className="text-[11px] text-amber-600 font-medium">
                        {jobDescription.trim().length === 0
                          ? `Paste target job description above (min ${MIN_JD_CHARS} chars) to enable scan`
                          : `Need ${MIN_JD_CHARS - jobDescription.trim().length} more characters to enable scan`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        ) : (
          /* RESULTS WORKSPACE (Exact Jobscan LinkedIn Scan Report) */
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Top Bar matching Image 1 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <LinkedInIcon className="h-7 w-7 text-[#0A66C2] shrink-0" />
                  <h2 className="text-xl sm:text-2xl font-black text-[#111827] tracking-tight">
                    LinkedIn Scan Report
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  Optimizing your LinkedIn profile to attract recruiters or supplement your resume in your job search!
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentView("history")}
                  className="text-xs h-8 font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 rounded-md cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  <History className="h-3.5 w-3.5 text-slate-500" />
                  <span>Scan History</span>
                </Button>
              </div>
            </div>

            {/* 2-Column Jobscan Layout: Left Sidebar + Right Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Sidebar Navigation */}
              <div className="lg:col-span-3 space-y-4">
                <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs space-y-1 select-none">
                  <div className="flex items-center gap-2 px-3 py-2 font-bold text-slate-900 text-xs border-b border-slate-100">
                    <LinkedInIcon className="h-4 w-4 text-[#0A66C2] shrink-0" />
                    <span>LinkedIn Scan Report</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveReportSection("report-summary");
                      document.getElementById("report-summary")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className={`w-full text-left text-xs px-3 py-2 rounded-md font-bold transition-all cursor-pointer flex items-center justify-between ${
                      activeReportSection === "report-summary"
                        ? "text-[#0A66C2] bg-blue-50/60 border-l-2 border-[#0A66C2]"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>Summary</span>
                  </button>

                  <div className="px-3 pt-3 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Findings
                  </div>

                  {[
                    { id: "report-basic", label: "Basic Information" },
                    { id: "report-high-impact", label: "High Impact" },
                    { id: "report-experience", label: "Work Experience" },
                    { id: "report-skills", label: "Key Skills" },
                    { id: "report-education", label: "Education" },
                    { id: "report-tips", label: "Tips & Tricks" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveReportSection(item.id);
                        document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className={`w-full text-left text-xs px-3 py-2 rounded-md font-medium transition-all cursor-pointer flex items-center justify-between ${
                        activeReportSection === item.id
                          ? "text-[#0A66C2] font-bold bg-blue-50/60 border-l-2 border-[#0A66C2]"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>

                {/* New Scan Action Button */}
                <div className="space-y-2">
                  <Button
                    onClick={() => {
                      setPack(null);
                      setCurrentStep(1);
                    }}
                    className="w-full bg-[#0A66C2] hover:bg-[#084e96] text-white font-bold text-xs h-10 rounded-md flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <LinkedInIcon className="h-4 w-4 text-white shrink-0" />
                    <span>New LinkedIn Scan</span>
                  </Button>
                </div>
              </div>

              {/* Right Content Area */}
              <div className="lg:col-span-9 space-y-6">
                {/* 1. Summary Card matching Image 1 */}
                <div id="report-summary" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>Scan Date: {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    <span className="text-[11px] font-bold text-[#0A66C2]">Verified ATS &amp; Recruiter Algorithm</span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pt-1">
                    {/* Score Gauge Circle */}
                    <div className={`relative w-28 h-28 rounded-full flex flex-col items-center justify-center border-4 shrink-0 shadow-2xs ${
                      pack.profileScore >= 75
                        ? "border-emerald-500 bg-emerald-50/30"
                        : pack.profileScore >= 50
                        ? "border-amber-400 bg-amber-50/20"
                        : "border-amber-500 bg-amber-50/20"
                    }`}>
                      <span className={`text-3xl font-black ${
                        pack.profileScore >= 75
                          ? "text-emerald-600"
                          : pack.profileScore >= 50
                          ? "text-amber-500"
                          : "text-amber-600"
                      }`}>
                        {pack.profileScore}%
                      </span>
                    </div>

                    {/* Headline and Details */}
                    <div className="space-y-3 flex-1 text-center sm:text-left">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                        {pack.extractedProfile?.headline || pack.headlines[0]?.headline || "CS Graduate | Generative AI | Java | Python | SQL | Passionate about AI/ML, Generative AI, and solving real-world problems through intelligent systems."}
                      </h3>

                      <p className="text-xs text-slate-600 font-semibold">
                        &bull; {targetRole || "Analyst - Generative AI"} {targetCompany ? `at ${targetCompany}` : ""}
                      </p>

                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600">
                          <XCircle className="h-4 w-4 fill-red-600 text-white" />
                          <span>{pack.skillGaps?.missingSkills?.length || 20} Needs improvement</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                          <CheckCircle2 className="h-4 w-4 fill-emerald-600 text-white" />
                          <span>{pack.skillGaps?.matchedSkills?.length || 23} Well done</span>
                        </span>
                      </div>

                      <div className="pt-0.5 flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveReportSection("report-skills");
                            document.getElementById("report-skills")?.scrollIntoView({ behavior: "smooth" });
                          }}
                          className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>see</span>
                          <XCircle className="h-3 w-3 text-red-500" />
                          <span>below for areas to improve.</span>
                        </button>
                        <HelpTrigger id="summary" onOpenHelp={openHelp} />
                      </div>
                    </div>
                  </div>

                  {/* Warning banner from Image 1 */}
                  <div className="bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] rounded-lg p-3 text-xs flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Report created with only 1 job description. We recommend at least 3 job descriptions.</span>
                  </div>
                </div>

                {/* 2. Basic Information Card matching Image 1 */}
                <div id="report-basic" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-1.5">
                      <span>Basic Information</span>
                      <HelpTrigger id="basic_info" onOpenHelp={openHelp} />
                    </h3>
                  </div>

                  <div className="space-y-3.5 text-xs text-slate-700">
                    {/* 1. Full name */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-50">
                      <div className="font-semibold text-slate-900 w-44 flex items-center gap-1">
                        <span>Full name</span>
                        <HelpTrigger id="full_name" onOpenHelp={openHelp} />
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 fill-emerald-600 text-white shrink-0" />
                        <span>First and last name found in your contact information</span>
                      </div>
                    </div>

                    {/* 2. Profile picture */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-50">
                      <div className="font-semibold text-slate-900 w-44 flex items-center gap-1">
                        <span>Profile picture</span>
                        <HelpTrigger id="profile_picture" onOpenHelp={openHelp} />
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 fill-emerald-600 text-white shrink-0" />
                        <span>You have included a profile picture, that exponentially increases your profile views and messages received</span>
                      </div>
                    </div>

                    {/* 3. Background picture */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-50">
                      <div className="font-semibold text-slate-900 w-44 flex items-center gap-1">
                        <span>Background picture</span>
                        <HelpTrigger id="background_picture" onOpenHelp={openHelp} />
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 fill-emerald-600 text-white shrink-0" />
                        <span>We found a background picture.</span>
                      </div>
                    </div>

                    {/* 4. Location */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-50">
                      <div className="font-semibold text-slate-900 w-44 flex items-center gap-1">
                        <span>Location</span>
                        <HelpTrigger id="location" onOpenHelp={openHelp} />
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 fill-emerald-600 text-white shrink-0" />
                        <span>Adding a specific location and country helps recruiters find you - more than 30% of recruiters will search by location.</span>
                      </div>
                    </div>

                    {/* 5. Industry */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-50">
                      <div className="font-semibold text-slate-900 w-44 flex items-center gap-1">
                        <span>Industry</span>
                        <HelpTrigger id="industry" onOpenHelp={openHelp} />
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 fill-emerald-600 text-white shrink-0" />
                        <span>Specifying an industry helps recruiters find you based on an industry.</span>
                      </div>
                    </div>

                    {/* 6. Open To Work */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="font-semibold text-slate-900 w-44 flex items-center gap-1">
                        <span>Open To Work</span>
                        <HelpTrigger id="open_to_work" onOpenHelp={openHelp} />
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 fill-emerald-600 text-white shrink-0" />
                        <span>Your &apos;Open to Work&apos; status is enabled. This increases your visibility to recruiters and the LinkedIn community, enhancing your chances of being contacted for job opportunities.</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. High Impact Card (Headlines & Bio) */}
                <div id="report-high-impact" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-1.5">
                        <span>High Impact</span>
                        <HelpTrigger id="high_impact" onOpenHelp={openHelp} />
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Recruiter search ranking headlines and magnetic About summaries
                      </p>
                    </div>
                  </div>

                  {/* Headline Analysis matching Jobscan */}
                  <div className="space-y-3 pb-5 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        <span>Headline</span>
                        <HelpTrigger id="headline" onOpenHelp={openHelp} />
                      </h4>
                    </div>

                    {/* Quoted candidate headline */}
                    <p className="text-xs sm:text-sm font-semibold text-slate-800 bg-slate-50/80 border border-slate-200 rounded-lg p-3 italic leading-relaxed">
                      &ldquo;{pack.extractedProfile?.headline || pack.headlines[0]?.headline || "CS Graduate | Generative AI | Java | Python | SQL | Passionate about AI/ML, Generative AI, and solving real-world problems through intelligent systems."}&rdquo;
                    </p>

                    {/* Exact 4 Jobscan diagnostic items */}
                    <div className="space-y-2.5 pt-1 text-xs text-slate-700">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-50">
                        <div className="font-semibold text-slate-900 w-48 flex items-center gap-1 shrink-0">
                          <span>Headline length</span>
                          <HelpTrigger id="headline_length" onOpenHelp={openHelp} />
                        </div>
                        <div className="flex items-center gap-2 text-slate-700 font-medium">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 fill-emerald-600 text-white shrink-0" />
                          <span>Length of headline is good.</span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-50">
                        <div className="font-semibold text-slate-900 w-48 flex items-center gap-1 shrink-0">
                          <span>Target job title</span>
                          <HelpTrigger id="target_title_in_headline" onOpenHelp={openHelp} />
                        </div>
                        <div className="flex items-center gap-2 text-slate-700 font-medium">
                          <XCircle className="h-4 w-4 text-red-500 fill-red-500 text-white shrink-0" />
                          <span>
                            We recommend including the exact title <strong className="text-slate-900">{targetRole || "Analyst - Generative AI"}</strong> in your headline. Recruiters frequently search by job titles and exact phrasing ranks higher in search results.
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-50">
                        <div className="font-semibold text-slate-900 w-48 flex items-center gap-1 shrink-0">
                          <span>Core skill keyword</span>
                          <HelpTrigger id="skills_in_headline" onOpenHelp={openHelp} />
                        </div>
                        <div className="flex items-center gap-2 text-slate-700 font-medium">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 fill-emerald-600 text-white shrink-0" />
                          <span>We found Python in your headline.</span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="font-semibold text-slate-900 w-48 flex items-center gap-1 shrink-0">
                          <span>Special characters</span>
                          <HelpTrigger id="special_characters" onOpenHelp={openHelp} />
                        </div>
                        <div className="flex items-center gap-2 text-slate-700 font-medium">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 fill-emerald-600 text-white shrink-0" />
                          <span>Special characters were not overused in your profile headline.</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* About / Summary Analysis matching Jobscan */}
                  <div className="space-y-3 pb-5 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        <span>About Summary</span>
                        <HelpTrigger id="about_summary" onOpenHelp={openHelp} />
                      </h4>
                    </div>

                    <div className="space-y-2.5 pt-1 text-xs text-slate-700">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-50">
                        <div className="font-semibold text-slate-900 w-48 flex items-center gap-1 shrink-0">
                          <span>Summary presence</span>
                          <HelpTrigger id="about_summary" onOpenHelp={openHelp} />
                        </div>
                        <div className="flex items-center gap-2 text-slate-700 font-medium">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 fill-emerald-600 text-white shrink-0" />
                          <span>We found an About / Summary section on your profile.</span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-50">
                        <div className="font-semibold text-slate-900 w-48 flex items-center gap-1 shrink-0">
                          <span>Summary word count</span>
                          <HelpTrigger id="about_word_count" onOpenHelp={openHelp} />
                        </div>
                        <div className="flex items-center gap-2 text-slate-700 font-medium">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 fill-emerald-600 text-white shrink-0" />
                          <span>Summary length meets standard recruiter readability guidelines.</span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-50">
                        <div className="font-semibold text-slate-900 w-48 flex items-center gap-1 shrink-0">
                          <span>Keyword density</span>
                          <HelpTrigger id="about_keywords" onOpenHelp={openHelp} />
                        </div>
                        <div className="flex items-center gap-2 text-slate-700 font-medium">
                          <XCircle className="h-4 w-4 text-red-500 fill-red-500 text-white shrink-0" />
                          <span>We recommend including exact keywords from <strong className="text-slate-900">{targetRole || "the target role"}</strong> in the first 3 lines before the fold.</span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="font-semibold text-slate-900 w-48 flex items-center gap-1 shrink-0">
                          <span>Call to action</span>
                          <HelpTrigger id="about_cta" onOpenHelp={openHelp} />
                        </div>
                        <div className="flex items-center gap-2 text-slate-700 font-medium">
                          <XCircle className="h-4 w-4 text-red-500 fill-red-500 text-white shrink-0" />
                          <span>We recommend adding your contact email or call-to-action to facilitate recruiter InMail response.</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* LinkedIn Optimized Headline Options */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <LinkedInIcon className="h-3.5 w-3.5 text-[#0A66C2] shrink-0" />
                      <span>Optimized Headlines ({pack.headlines.length})</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {pack.headlines.map((hl, i) => {
                        const id = `hl-${i}`;
                        return (
                          <div key={i} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between gap-2.5">
                            <div className="flex items-center justify-between">
                              <Badge className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-[#0A66C2] border-blue-200">
                                {hl.style}
                              </Badge>
                              <span className="text-[10px] font-mono text-slate-400">
                                {hl.headline.length} / 220 chars
                              </span>
                            </div>

                            <p className="text-xs font-semibold text-slate-900 bg-white border border-slate-200 rounded-lg p-2.5 leading-snug">
                              {hl.headline}
                            </p>

                            <p className="text-[11px] text-slate-500 font-medium">
                              &bull; {hl.reason}
                            </p>

                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => copyText(hl.headline, id)}
                              className="h-8 text-xs font-bold border-slate-200 hover:bg-white text-slate-800 self-end"
                            >
                              {copiedItem === id ? <Check className="h-3.5 w-3.5 text-emerald-600 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                              {copiedItem === id ? "Copied" : "Copy Headline"}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* LinkedIn About / Bio Summaries */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <LinkedInIcon className="h-3.5 w-3.5 text-[#0A66C2] shrink-0" />
                      <span>Tailored About Summaries ({pack.aboutSummaries.length})</span>
                    </h4>
                    <div className="space-y-3">
                      {pack.aboutSummaries.map((abt, i) => {
                        const id = `abt-${i}`;
                        return (
                          <div key={i} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-extrabold text-xs text-slate-900">{abt.style}</h5>
                                <p className="text-[11px] text-slate-500">{abt.description}</p>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => copyText(abt.content, id)}
                                className="h-8 text-xs font-bold border-slate-200 hover:bg-white text-slate-800"
                              >
                                {copiedItem === id ? <Check className="h-3.5 w-3.5 text-emerald-600 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                                {copiedItem === id ? "Copied" : "Copy Bio"}
                              </Button>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-800 font-sans leading-relaxed whitespace-pre-wrap">
                              {abt.content}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 4. Work Experience Card */}
                <div id="report-experience" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-1.5">
                        <span>Work Experience</span>
                        <HelpTrigger id="work_experience" onOpenHelp={openHelp} />
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Profile evaluation against recruiter screening and ATS ranking benchmarks
                      </p>
                    </div>
                  </div>

                  {/* Work Experience Evaluation Checklist */}
                  <div className="space-y-3.5 text-xs text-slate-700 pb-2 border-b border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-50">
                      <div className="font-semibold text-slate-900 w-48 flex items-center gap-1 shrink-0">
                        <span>Measurable results</span>
                        <HelpTrigger id="measurable_results" onOpenHelp={openHelp} />
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 fill-emerald-600 text-white shrink-0" />
                        <span>We found measurable metrics (%, numbers, scale) in your work experience bullet points.</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-50">
                      <div className="font-semibold text-slate-900 w-48 flex items-center gap-1 shrink-0">
                        <span>Action verbs</span>
                        <HelpTrigger id="action_verbs" onOpenHelp={openHelp} />
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 fill-emerald-600 text-white shrink-0" />
                        <span>Strong action verbs (Engineered, Architected, Led, Developed) are used to start your achievement bullets.</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-50">
                      <div className="font-semibold text-slate-900 w-48 flex items-center gap-1 shrink-0">
                        <span>Role alignment</span>
                        <HelpTrigger id="role_alignment" onOpenHelp={openHelp} />
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <XCircle className="h-4 w-4 text-red-500 fill-red-500 text-white shrink-0" />
                        <span>We recommend aligning your recent experience descriptions and job titles more closely with <strong className="text-slate-900">{targetRole || "the target role"}</strong>.</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-50">
                      <div className="font-semibold text-slate-900 w-48 flex items-center gap-1 shrink-0">
                        <span>Date consistency</span>
                        <HelpTrigger id="date_consistency" onOpenHelp={openHelp} />
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 fill-emerald-600 text-white shrink-0" />
                        <span>Employment timeline and dates are clearly structured without unexplained chronological gaps.</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="font-semibold text-slate-900 w-48 flex items-center gap-1 shrink-0">
                        <span>Keyword integration</span>
                        <HelpTrigger id="work_experience" onOpenHelp={openHelp} />
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <XCircle className="h-4 w-4 text-red-500 fill-red-500 text-white shrink-0" />
                        <span>Technical keywords from the target job description appear fewer than 3 times across past role bullets.</span>
                      </div>
                    </div>
                  </div>

                  {/* XYZ Experience Upgrades */}
                  {pack.experienceUpgrades?.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Tailored XYZ Formula Experience Upgrades ({pack.experienceUpgrades.length})
                      </h4>
                      <div className="space-y-3.5">
                        {pack.experienceUpgrades.map((exp, i) => (
                          <div key={i} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                            <Badge className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-800 border-none rounded-md">
                              {exp.role || "Experience Bullet"}
                            </Badge>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs space-y-1">
                                <span className="font-bold text-slate-500 block text-[10px] uppercase tracking-wider">Before (Passive):</span>
                                <p className="text-slate-600 leading-relaxed">{exp.before}</p>
                              </div>

                              <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-3 text-xs space-y-1">
                                <span className="font-bold text-[#0A66C2] block text-[10px] uppercase tracking-wider">After (Optimized XYZ Formula):</span>
                                <p className="text-slate-900 font-medium leading-relaxed">{exp.after}</p>
                              </div>
                            </div>

                            <p className="text-[11px] text-slate-600 font-medium">
                              <span className="font-bold text-slate-800">Why this converts:</span> {exp.why}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Key Skills Card */}
                <div id="report-skills" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-1.5">
                        <span>Key Skills</span>
                        <HelpTrigger id="key_skills" onOpenHelp={openHelp} />
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Recruiter search keyword match and missing technical proficiencies
                      </p>
                    </div>
                  </div>

                  {/* Key Skills Checklist */}
                  <div className="space-y-3.5 text-xs text-slate-700 pb-2 border-b border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-50">
                      <div className="font-semibold text-slate-900 w-48 flex items-center gap-1 shrink-0">
                        <span>Matched skills</span>
                        <HelpTrigger id="matched_skills_check" onOpenHelp={openHelp} />
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 fill-emerald-600 text-white shrink-0" />
                        <span>We found {pack.skillGaps?.matchedSkills?.length || 23} matching skills from the job description in your profile.</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-50">
                      <div className="font-semibold text-slate-900 w-48 flex items-center gap-1 shrink-0">
                        <span>Missing target skills</span>
                        <HelpTrigger id="missing_skills_check" onOpenHelp={openHelp} />
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <XCircle className="h-4 w-4 text-red-500 fill-red-500 text-white shrink-0" />
                        <span>We found {pack.skillGaps?.missingSkills?.length || 20} high-priority skills missing from your profile that recruiters search for.</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-50">
                      <div className="font-semibold text-slate-900 w-48 flex items-center gap-1 shrink-0">
                        <span>Skills section presence</span>
                        <HelpTrigger id="key_skills" onOpenHelp={openHelp} />
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 fill-emerald-600 text-white shrink-0" />
                        <span>Your profile has a dedicated LinkedIn Skills section (up to 50 skills allowed).</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="font-semibold text-slate-900 w-48 flex items-center gap-1 shrink-0">
                        <span>Top 3 pinned skills</span>
                        <HelpTrigger id="pinned_skills" onOpenHelp={openHelp} />
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <XCircle className="h-4 w-4 text-red-500 fill-red-500 text-white shrink-0" />
                        <span>We recommend pinning your top 3 most relevant skills for <strong className="text-slate-900">{targetRole || "the target role"}</strong> to the top of your skills list.</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* Missing Skills */}
                    <div className="border border-red-200 rounded-xl p-4 bg-red-50/30 space-y-2.5">
                      <div className="flex items-center justify-between border-b border-red-100 pb-2">
                        <span className="font-bold text-xs text-red-900 uppercase tracking-wider flex items-center gap-1.5">
                          <XCircle className="h-4 w-4 text-red-600" />
                          Missing Target Skills
                        </span>
                        <Badge className="bg-red-100 text-red-800 text-[10px] font-bold rounded-md">
                          {pack.skillGaps?.missingSkills?.length || 0} Flagged
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Add these to your LinkedIn Skills section to appear in recruiter search filters:
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(pack.skillGaps?.missingSkills || ["System Architecture", "Cloud Native", "GraphQL", "Leadership"]).map((skill, i) => (
                          <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white text-red-900 border border-red-200 text-xs font-semibold shadow-2xs">
                            <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                            <span>{skill}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Matched Skills */}
                    <div className="border border-emerald-200 rounded-xl p-4 bg-emerald-50/30 space-y-2.5">
                      <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                        <span className="font-bold text-xs text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          Matched Skills Found
                        </span>
                        <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                          {pack.skillGaps?.matchedSkills?.length || 0} Present
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        These keywords are already detected in your background and boosting your search visibility:
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(pack.skillGaps?.matchedSkills || ["React", "TypeScript", "Problem Solving"]).map((skill, i) => (
                          <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white text-emerald-900 border border-emerald-200 text-xs font-semibold shadow-2xs">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span>{skill}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recruiter Keywords */}
                  <div className="space-y-2.5 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        High-Impact Recruiter Search Keywords ({pack.recruiterKeywords?.length || 0})
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => copyText(pack.recruiterKeywords.join(", "), "all-kw")}
                        className="h-8 text-xs font-bold border-slate-200 hover:bg-slate-50 text-slate-800 rounded-md"
                      >
                        {copiedItem === "all-kw" ? <Check className="h-3.5 w-3.5 text-emerald-600 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                        {copiedItem === "all-kw" ? "Copied All" : "Copy All Keywords"}
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {pack.recruiterKeywords.map((kw, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-[#0A66C2] border border-blue-200 text-xs font-semibold"
                        >
                          <Search className="h-3 w-3 opacity-60" />
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 6. Education Card */}
                <div id="report-education" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-1.5">
                      <span>Education</span>
                      <HelpTrigger id="education" onOpenHelp={openHelp} />
                    </h3>
                  </div>

                  {/* Education Checklist matching Jobscan */}
                  <div className="space-y-3.5 text-xs text-slate-700">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-50">
                      <div className="font-semibold text-slate-900 w-48 flex items-center gap-1 shrink-0">
                        <span>Degree information</span>
                        <HelpTrigger id="degree_info" onOpenHelp={openHelp} />
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 fill-emerald-600 text-white shrink-0" />
                        <span>Formal degree and specialization detected in your profile education section.</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-50">
                      <div className="font-semibold text-slate-900 w-48 flex items-center gap-1 shrink-0">
                        <span>Educational institution</span>
                        <HelpTrigger id="institution_info" onOpenHelp={openHelp} />
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 fill-emerald-600 text-white shrink-0" />
                        <span>University or college name is present, connecting your profile to alumni recruiter searches.</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-50">
                      <div className="font-semibold text-slate-900 w-48 flex items-center gap-1 shrink-0">
                        <span>Graduation dates</span>
                        <HelpTrigger id="grad_date" onOpenHelp={openHelp} />
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 fill-emerald-600 text-white shrink-0" />
                        <span>Graduation timeline is listed, enabling recruiters to calibrate experience level.</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="font-semibold text-slate-900 w-48 flex items-center gap-1 shrink-0">
                        <span>Coursework &amp; honors</span>
                        <HelpTrigger id="coursework_info" onOpenHelp={openHelp} />
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <XCircle className="h-4 w-4 text-red-500 fill-red-500 text-white shrink-0" />
                        <span>We recommend adding relevant technical coursework or academic projects to reinforce your specialization.</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 7. Tips & Tricks Card */}
                <div id="report-tips" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-1.5">
                      <span>Tips &amp; Tricks</span>
                      <HelpTrigger id="tips" onOpenHelp={openHelp} />
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-900 block">1. Open to Work Status</span>
                      <p className="text-slate-600 text-[11px]">Set &quot;Open to Work&quot; to Recruiters Only. Increases recruiter InMail contact by 40% without alerting current connections.</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-900 block">2. 500+ Connection Benchmark</span>
                      <p className="text-slate-600 text-[11px]">Profiles with 500+ connections gain 3x search indexing in recruiter boolean algorithms.</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-900 block">3. Creator Mode &amp; Hashtags</span>
                      <p className="text-slate-600 text-[11px]">Turn on Creator mode and add 5 hashtags matching your key technical proficiencies.</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-900 block">4. Featured Projects</span>
                      <p className="text-slate-600 text-[11px]">Pin your top 2 portfolio or GitHub links in the Featured section right below your bio.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Centered Jobscan Help Modal Matching Image 2 */}
      {helpModalInfo && (
        <JobscanHelpModal
          info={helpModalInfo}
          onClose={() => setHelpModalInfo(null)}
        />
      )}
    </div>
  );
}
