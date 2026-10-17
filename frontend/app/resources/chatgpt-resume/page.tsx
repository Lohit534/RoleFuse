"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  User,
  Calendar,
  BookOpen,
  ShieldCheck,
  Bot,
  Lightbulb,
  Briefcase,
  FileText,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function PromptCard({ title, prompt }: { title: string; prompt: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-teal-200 bg-teal-50/40 p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-[#087F6E]">
          {title}
        </span>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-teal-200 text-[#087F6E] hover:bg-teal-50 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-[#087F6E]" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy Prompt</span>
            </>
          )}
        </button>
      </div>
      <p className="text-xs sm:text-sm text-slate-800 font-mono bg-white p-3.5 rounded-xl border border-slate-200 leading-relaxed whitespace-pre-wrap">
        {prompt}
      </p>
    </div>
  );
}

export default function ChatGptResumePage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] text-[#111827] font-sans selection:bg-[#087F6E]/15 selection:text-[#087F6E]">
      <Navbar />

      <main className="flex-1">
        {/* Breadcrumb & Article Header */}
        <section className="bg-white border-b border-slate-200 pt-10 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
              <Link
                href="/resources"
                className="text-[#087F6E] hover:underline"
              >
                Optimize Your Resume
              </Link>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-slate-500">
                <Calendar className="h-3.5 w-3.5" />
                May 30, 2025
              </span>
            </div>

            <h1 className="font-heading text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              How to Write a ChatGPT Resume (With Prompts)
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Creating a compelling resume with ChatGPT is easy. Follow our guide to quickly create a
              professional and impactful resume that stands out.
            </p>

            {/* Author Meta */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-[#087F6E] font-bold text-sm">
                  RH
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Robert Henderson, CPRW
                  </div>
                  <div className="text-[11px] text-slate-500">Resume Expert &amp; Career Coach</div>
                </div>
              </div>

              <Link href="/resume-builder">
                <Button className="h-10 px-5 bg-[#087F6E] hover:bg-[#065F53] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer">
                  Build Your Best Resume
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Main Article Container */}
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Table of Contents Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
              <BookOpen className="h-4 w-4 text-[#087F6E]" />
              <span>Table of Contents</span>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs text-slate-700">
              <li>
                <a href="#what-is-chatgpt" className="hover:text-[#087F6E] font-medium transition-colors">
                  What is ChatGPT and how does it work?
                </a>
              </li>
              <li>
                <a href="#should-you-use-chatgpt" className="hover:text-[#087F6E] font-medium transition-colors">
                  Should you use ChatGPT to write your resume?
                </a>
              </li>
              <li>
                <a href="#how-to-create-effective-prompts" className="hover:text-[#087F6E] font-medium transition-colors">
                  How to create effective prompts
                </a>
              </li>
              <li>
                <a href="#how-to-use-chatgpt-to-write-your-resume" className="hover:text-[#087F6E] font-medium transition-colors">
                  How to use ChatGPT to write your resume
                </a>
              </li>
              <li>
                <a href="#how-to-tailor-your-resume-with-chatgpt" className="hover:text-[#087F6E] font-medium transition-colors">
                  How to tailor your resume with ChatGPT
                </a>
              </li>
              <li>
                <a href="#chatgpt-resume-dos-and-donts" className="hover:text-[#087F6E] font-medium transition-colors">
                  ChatGPT resume dos and don'ts
                </a>
              </li>
              <li>
                <a href="#how-to-use-chatgpt-to-update-your-resume" className="hover:text-[#087F6E] font-medium transition-colors">
                  How to use ChatGPT to update your resume
                </a>
              </li>
              <li>
                <a href="#how-to-use-chatgpt-for-a-career-change-resume" className="hover:text-[#087F6E] font-medium transition-colors">
                  How to use ChatGPT for a career change resume
                </a>
              </li>
              <li>
                <a href="#is-chatgpt-the-best-tool-for-writing-your-resume" className="hover:text-[#087F6E] font-medium transition-colors">
                  Is ChatGPT the best tool for writing your resume?
                </a>
              </li>
              <li>
                <a href="#how-to-use-chatgpt-to-write-your-cover-letter" className="hover:text-[#087F6E] font-medium transition-colors">
                  How to use ChatGPT to write your cover letter
                </a>
              </li>
              <li>
                <a href="#how-to-use-chatgpt-for-your-job-search" className="hover:text-[#087F6E] font-medium transition-colors">
                  How to use ChatGPT for your job search
                </a>
              </li>
              <li>
                <a href="#key-takeaways" className="hover:text-[#087F6E] font-medium transition-colors">
                  Key takeaways
                </a>
              </li>
            </ul>
          </div>

          {/* Intro Section */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <p className="text-slate-900 font-semibold text-base">
              Using ChatGPT to write your resume can save you hours of work, but only if you use it the right way.
            </p>
            <p>
              In this guide, you will learn how to create a ChatGPT resume that stands out, and how to avoid the
              common mistakes that can keep yours from ever being seen.
            </p>
          </div>

          {/* Section 1: What is ChatGPT */}
          <section id="what-is-chatgpt" className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
            <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900">
              What is ChatGPT and how does it work?
            </h2>
            <div className="text-xs sm:text-sm text-slate-700 space-y-3.5 leading-relaxed">
              <p>
                ChatGPT is an AI tool built by OpenAI. It is designed to understand your written instructions—called
                prompts—and respond like a human would.
              </p>
              <p>
                You can ask it to explain a concept, summarize an article, or write full documents like resumes,
                cover letters, or emails. And it generates a response in just seconds.
              </p>
              <p className="font-semibold text-slate-900">
                Instead of staring at a blank page, you can ask ChatGPT to:
              </p>
              <ul className="space-y-2 pl-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#087F6E] shrink-0 mt-0.5" />
                  <span>Draft a resume based on your work history.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#087F6E] shrink-0 mt-0.5" />
                  <span>Rewrite bullet points to sound more impactful.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#087F6E] shrink-0 mt-0.5" />
                  <span>Tailor your resume to match a specific job description.</span>
                </li>
              </ul>
              <p>
                <strong>But here is the catch:</strong> ChatGPT does not know you or your genuine experience. You have
                to guide it with clear, detailed prompts to get good results. The better your instructions, the better
                your resume will be.
              </p>
              <p className="text-slate-500 italic">
                <strong>Is ChatGPT free?</strong> Yes, it is free to use for basic resume drafting, though some features
                may require a paid subscription.
              </p>
            </div>

            {/* FastHire In-Article CTA Box */}
            <div className="bg-teal-50/60 border border-teal-200 rounded-2xl p-5 space-y-3">
              <div className="font-heading font-extrabold text-sm sm:text-base text-slate-900">
                Build your best resume yet
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Create a polished, ATS-friendly resume with RoleFuse's resume builder. Start fresh or upload yours,
                tailor it to the job, and apply with confidence all in one place.
              </p>
              <div>
                <Link href="/resume-builder">
                  <Button className="h-9 px-4 bg-[#087F6E] hover:bg-[#065F53] text-white font-bold text-xs rounded-lg shadow-xs transition-all cursor-pointer">
                    Start Building Your Resume Now
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          {/* Section 2: Should you use ChatGPT */}
          <section id="should-you-use-chatgpt" className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900">
              Should you use ChatGPT to write your resume?
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              Yes, but only if you use it wisely. ChatGPT can be a powerful tool, but it is not perfect.
              Here is a quick look at the pros and cons:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pros */}
              <div className="p-5 rounded-2xl bg-teal-50/40 border border-teal-200 space-y-4">
                <span className="text-xs font-extrabold uppercase text-[#087F6E] tracking-wider">
                  Pros
                </span>
                <ul className="space-y-3 text-xs text-slate-700 leading-relaxed">
                  <li className="space-y-1">
                    <strong className="text-slate-900 block">Saves time:</strong>
                    <span>ChatGPT can generate a full draft in minutes, especially useful when tailoring your resume for multiple jobs.</span>
                  </li>
                  <li className="space-y-1">
                    <strong className="text-slate-900 block">Offers a fresh perspective:</strong>
                    <span>It can help rephrase your experience, highlight overlooked skills, and break you out of resume writer's block.</span>
                  </li>
                  <li className="space-y-1">
                    <strong className="text-slate-900 block">Customizable:</strong>
                    <span>You can guide ChatGPT with prompts to target specific industries, roles, or accomplishments.</span>
                  </li>
                </ul>
              </div>

              {/* Cons */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <span className="text-xs font-extrabold uppercase text-slate-600 tracking-wider">
                  Cons
                </span>
                <ul className="space-y-3 text-xs text-slate-700 leading-relaxed">
                  <li className="space-y-1">
                    <strong className="text-slate-900 block">It does not know you:</strong>
                    <span>ChatGPT can only work with what you tell it. If your prompt is vague, the output will be too.</span>
                  </li>
                  <li className="space-y-1">
                    <strong className="text-slate-900 block">It can sound generic or robotic:</strong>
                    <span>Without your personal input and edits, the resume may feel like it was written by a machine.</span>
                  </li>
                  <li className="space-y-1">
                    <strong className="text-slate-900 block">It is not always accurate:</strong>
                    <span>ChatGPT might insert filler skills or fabricate achievements. Always double-check everything it generates.</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 space-y-2">
              <p>
                ChatGPT is great for drafting text, but it won't format your resume or tailor it for ATS.
              </p>
              <p>
                That is where RoleFuse's ATS resume builder comes in. It organizes your content, chooses clean layouts, and optimizes every section for automated hiring systems.
              </p>
            </div>
          </section>

          {/* Section 3: Effective Prompts */}
          <section id="how-to-create-effective-prompts" className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900">
              How to create effective prompts
            </h2>
            <div className="text-xs sm:text-sm text-slate-700 space-y-3 leading-relaxed">
              <p>
                ChatGPT is only as good as the prompts you give it. If your prompt is vague, the result will be generic or full of filler.
              </p>
              <p className="font-semibold text-slate-900">
                The best prompts for creating your resume should include:
              </p>
              <ul className="space-y-1.5 pl-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#087F6E]" />
                  <span>Your years of experience and industry.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#087F6E]" />
                  <span>Specific accomplishments or projects.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#087F6E]" />
                  <span>Key skills you want to highlight.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#087F6E]" />
                  <span>The job title or industry you are targeting.</span>
                </li>
              </ul>
            </div>

            {/* Strong vs Weak Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200 space-y-2">
                <span className="text-xs font-bold text-[#087F6E] uppercase">Strong Prompts</span>
                <p className="text-xs text-slate-700 font-mono bg-white p-2.5 rounded border border-teal-100">
                  "I have 6 years of experience in customer success, with a focus on SaaS and client onboarding. Write a resume summary that highlights my communication skills, leadership, and success improving customer retention."
                </p>
                <p className="text-xs text-slate-700 font-mono bg-white p-2.5 rounded border border-teal-100">
                  "Here is what I did as a marketing coordinator: managed email campaigns, grew social media, and wrote blog posts. Write 3 bullet points that include results and match this job description."
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Weak Prompts</span>
                <p className="text-xs text-slate-600 font-mono bg-white p-2.5 rounded border border-slate-200">
                  "Write my resume."
                </p>
                <p className="text-xs text-slate-600 font-mono bg-white p-2.5 rounded border border-slate-200">
                  "Make bullet points for my job."
                </p>
              </div>
            </div>

            {/* Advanced Prompt Techniques */}
            <div className="space-y-4 pt-2">
              <h3 className="font-heading font-extrabold text-base text-slate-900">
                Advanced Prompting Techniques
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                  <strong className="text-xs font-bold text-slate-900 block">Role Prompting</strong>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Tell ChatGPT who to "be," like an experienced resume writer:
                  </p>
                  <p className="text-xs text-slate-800 font-mono bg-slate-50 p-2 rounded border border-slate-200">
                    "You're an expert resume writer. Help me write a summary for a marketing job."
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                  <strong className="text-xs font-bold text-slate-900 block">Chain-of-Thought Prompting</strong>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Walk ChatGPT through the task step-by-step instead of asking everything at once:
                  </p>
                  <p className="text-xs text-slate-800 font-mono bg-slate-50 p-2 rounded border border-slate-200">
                    Prompt 1: "What are the top 5 skills in this job description?"<br />
                    Prompt 2: "What is missing from my resume for those skills?"<br />
                    Prompt 3: "Rewrite my bullets to align with the job."
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Step-by-Step Guide */}
          <section id="how-to-use-chatgpt-to-write-your-resume" className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-8">
            <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900">
              How to use ChatGPT to write your resume
            </h2>

            {/* Step 1 */}
            <div className="space-y-3">
              <h3 className="font-heading font-extrabold text-base text-slate-900">
                1. Start with a simple prompt
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                If you are writing a brand new resume, ChatGPT needs to know a bit about you first. Provide a brief overview of your background and then ask what information it needs to draft your resume.
              </p>
              <PromptCard
                title="Overview & Discovery Prompt"
                prompt="I am a recent computer science graduate looking for an entry-level software development role. What information do you need from me to create my resume?"
              />
            </div>

            {/* Step 2 */}
            <div className="space-y-3">
              <h3 className="font-heading font-extrabold text-base text-slate-900">
                2. Use ChatGPT to write your resume headline
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                A resume headline is a short, one-line statement that sits right below your contact information. It should include your target job title and highlight your top strengths.
              </p>
              <PromptCard
                title="Resume Headline Prompt"
                prompt="Create a resume headline for me. I have [number of years] years of experience in [your field/industry], specializing in [key skills or areas of expertise]. I am seeking a role as a [specific job title you are targeting]."
              />
            </div>

            {/* Step 3 */}
            <div className="space-y-3">
              <h3 className="font-heading font-extrabold text-base text-slate-900">
                3. Use ChatGPT to write your resume summary
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                Your resume summary sits below your headline and gives a quick snapshot of your experience, skills, and achievements.
              </p>
              <PromptCard
                title="Resume Summary Prompt"
                prompt="Create a resume summary for me. I have [number of years] years of experience in [your field/industry]. My key skills include [list key skills or areas of expertise]. I have achieved [mention notable achievements or milestones]. I am looking for opportunities in [specific job or industry you are targeting] where I can [mention your goals or what you hope to accomplish in the new role]."
              />
            </div>

            {/* Step 4 */}
            <div className="space-y-3">
              <h3 className="font-heading font-extrabold text-base text-slate-900">
                4. Use ChatGPT to write your work experience section
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                Your work experience is where you show hiring managers what you have done and what kind of results you deliver.
              </p>
              <PromptCard
                title="Work Experience Bullets Prompt"
                prompt="Help me write bullet points for my resume based on these accomplishments: [paste rough notes]. Match them to this target job description: [paste job description] and include metrics or measurable results where possible."
              />
            </div>

            {/* Step 5 */}
            <div className="space-y-3">
              <h3 className="font-heading font-extrabold text-base text-slate-900">
                5. Use ChatGPT to refine your bullet points
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                Break down your refinements into focused prompts for action verbs, clichés, conciseness, and metrics:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <strong>To strengthen language:</strong>
                  <p className="text-slate-600 font-mono">"Make these bullet points more impactful using strong action verbs."</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <strong>To replace clichés:</strong>
                  <p className="text-slate-600 font-mono">"Find and replace any clichés in these bullet points with specific language."</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <strong>To make them concise:</strong>
                  <p className="text-slate-600 font-mono">"Rewrite these bullet points to be shorter without losing meaning."</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <strong>To add metrics:</strong>
                  <p className="text-slate-600 font-mono">"Where can I add quantifiable results to these bullet points?"</p>
                </div>
              </div>
            </div>

            {/* Step 6 */}
            <div className="space-y-3">
              <h3 className="font-heading font-extrabold text-base text-slate-900">
                6. Use ChatGPT to proofread your resume
              </h3>
              <PromptCard
                title="Proofreading Prompt"
                prompt="Please proofread my resume carefully and point out any spelling, grammar, or formatting errors. Also, let me know if there are any vague or weak sections that might concern a recruiter. Here is my resume: [paste full resume]"
              />
            </div>
          </section>

          {/* Section 5: Tailoring */}
          <section id="how-to-tailor-your-resume-with-chatgpt" className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
            <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900">
              How to tailor your resume with ChatGPT
            </h2>
            <div className="text-xs sm:text-sm text-slate-700 space-y-3 leading-relaxed">
              <p>
                Most companies use applicant tracking systems (ATS) to scan resumes for specific keywords, job titles, and qualifications pulled straight from the job description.
              </p>
              <PromptCard
                title="Tailoring Prompt"
                prompt="Help me tailor my resume for a specific job application. I will provide the job description and my resume. Please adjust my resume to highlight the most relevant experiences and skills that align with the job requirements. Also, suggest any changes or additions that would make my resume more appealing for this position."
              />
              <p className="text-slate-600">
                ChatGPT can guess at keywords, but it cannot measure your exact match score. Run your resume through RoleFuse's ATS scanner to see exactly which keywords are present or missing.
              </p>
            </div>
          </section>

          {/* Section 6: Dos and Don'ts */}
          <section id="chatgpt-resume-dos-and-donts" className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900">
              ChatGPT resume dos and don'ts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-teal-50/40 border border-teal-200 space-y-3">
                <span className="text-xs font-extrabold uppercase text-[#087F6E]">Do</span>
                <ul className="space-y-2 text-xs text-slate-700 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#087F6E] shrink-0 mt-0.5" />
                    <span><strong>Be specific with prompts:</strong> The more detail you provide, the more tailored the output.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#087F6E] shrink-0 mt-0.5" />
                    <span><strong>Personalize the output:</strong> Edit text so it sounds authentic to your personal voice.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#087F6E] shrink-0 mt-0.5" />
                    <span><strong>Verify and edit:</strong> Check for factual accuracy, correct employment dates, and formatting.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#087F6E] shrink-0 mt-0.5" />
                    <span><strong>Highlight metrics:</strong> Ensure your bullet points demonstrate measurable impact.</span>
                  </li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-xs font-extrabold uppercase text-slate-600">Don't</span>
                <ul className="space-y-2 text-xs text-slate-700 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <span><strong>Don't rely solely on AI:</strong> Always verify and refine suggestions before applying.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <span><strong>Don't ignore formatting:</strong> Raw AI text loses layout structure when pasted into documents.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <span><strong>Don't use empty clichés:</strong> Avoid fluff like "hard worker" or "dynamic go-getter."</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <span><strong>Don't skip the job posting:</strong> Ensure your resume reflects qualifications from the ad.</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 7: Update Resume */}
          <section id="how-to-use-chatgpt-to-update-your-resume" className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
            <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900">
              How to use ChatGPT to update your resume
            </h2>
            <div className="text-xs sm:text-sm text-slate-700 space-y-3 leading-relaxed">
              <p>
                If your resume is outdated, ChatGPT can quickly help you rewrite your experience with stronger action verbs, expand your skills section, and polish wording.
              </p>
              <PromptCard
                title="Resume Update Prompt"
                prompt="Help me update my current resume. I have [number of years] of experience in [your field/industry] with a focus on [key skills or areas of expertise]. Since my last update, I have achieved [new accomplishments] and developed skills in [new skills]. Please revise my resume to highlight these updates and tailor it for a [specific job title or industry]."
              />
            </div>
          </section>

          {/* Section 8: Career Change */}
          <section id="how-to-use-chatgpt-for-a-career-change-resume" className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
            <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900">
              How to use ChatGPT for a career change resume
            </h2>
            <div className="text-xs sm:text-sm text-slate-700 space-y-3 leading-relaxed">
              <p>
                The key to a successful career change resume is highlighting transferable skills and demonstrating how your past achievements apply to the new role.
              </p>
              <PromptCard
                title="Career Change Prompt"
                prompt="Help me create a career change resume. I have [number of years] of experience in [your current field/industry] and am looking to transition to [new field/industry]. My key skills include [list of transferable skills], and I have achieved [notable accomplishments] in my current role. Please tailor my resume to highlight my transferable skills and relevant experience for a position as a [target job title]."
              />
            </div>
          </section>

          {/* Section 9: Is ChatGPT the Best Tool */}
          <section id="is-chatgpt-the-best-tool-for-writing-your-resume" className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
            <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900">
              Is ChatGPT the best tool for writing your resume?
            </h2>
            <div className="text-xs sm:text-sm text-slate-700 space-y-3 leading-relaxed">
              <p>
                ChatGPT is a powerful drafting assistant, but it cannot test your resume against ATS parsers, format PDF margins, or check keyword density.
              </p>
              <p>
                Combining generative AI with a dedicated platform like RoleFuse gives you the best of both worlds: compelling bullet points backed by guaranteed ATS-compatible formatting and real-time keyword scoring.
              </p>
            </div>
          </section>

          {/* Section 10: Cover Letter */}
          <section id="how-to-use-chatgpt-to-write-your-cover-letter" className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
            <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900">
              How to use ChatGPT to write your cover letter
            </h2>
            <div className="text-xs sm:text-sm text-slate-700 space-y-3 leading-relaxed">
              <p>
                You can generate a strong cover letter draft by giving ChatGPT your core background, the company name, and the specific accomplishments you want to highlight.
              </p>
              <PromptCard
                title="Cover Letter Prompt"
                prompt="Write a cover letter for me. I have [number of years] of experience in [your field/industry], with a strong background in [key skills]. I am applying for the [job title] role at [company name]. Highlight my accomplishments in [relevant projects or achievements], and explain how my skills could benefit [company name]."
              />
            </div>
          </section>

          {/* Section 11: Job Search */}
          <section id="how-to-use-chatgpt-for-your-job-search" className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900">
              How to use ChatGPT for your job search
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-teal-50/30 border border-teal-200 space-y-2">
                <span className="h-6 w-6 rounded-full bg-[#087F6E] text-white flex items-center justify-center font-bold text-xs">
                  1
                </span>
                <strong className="text-xs font-extrabold uppercase text-slate-900 block">
                  Research Companies
                </strong>
                <p className="text-xs text-slate-600 leading-relaxed font-mono bg-white p-2.5 rounded border border-teal-100">
                  "What does [Company Name] do? Summarize their business model and mission in 2-3 sentences."
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-teal-50/30 border border-teal-200 space-y-2">
                <span className="h-6 w-6 rounded-full bg-[#087F6E] text-white flex items-center justify-center font-bold text-xs">
                  2
                </span>
                <strong className="text-xs font-extrabold uppercase text-slate-900 block">
                  Prep for Interviews
                </strong>
                <p className="text-xs text-slate-600 leading-relaxed font-mono bg-white p-2.5 rounded border border-teal-100">
                  "Act as a hiring manager interviewing me for a [target role]. Ask me 5 behavioral interview questions."
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-teal-50/30 border border-teal-200 space-y-2">
                <span className="h-6 w-6 rounded-full bg-[#087F6E] text-white flex items-center justify-center font-bold text-xs">
                  3
                </span>
                <strong className="text-xs font-extrabold uppercase text-slate-900 block">
                  Write Professional Messages
                </strong>
                <p className="text-xs text-slate-600 leading-relaxed font-mono bg-white p-2.5 rounded border border-teal-100">
                  "Write a short thank-you email to a recruiter after an interview for a [job title] role."
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-teal-50/30 border border-teal-200 space-y-2">
                <span className="h-6 w-6 rounded-full bg-[#087F6E] text-white flex items-center justify-center font-bold text-xs">
                  4
                </span>
                <strong className="text-xs font-extrabold uppercase text-slate-900 block">
                  Organize Your Search
                </strong>
                <p className="text-xs text-slate-600 leading-relaxed font-mono bg-white p-2.5 rounded border border-teal-100">
                  "Help me build a weekly job search checklist. I am applying to [industry] roles and want to stay consistent."
                </p>
              </div>
            </div>
          </section>

          {/* Section 12: Key Takeaways */}
          <section id="key-takeaways" className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md space-y-5">
            <h2 className="font-heading font-extrabold text-xl sm:text-2xl">
              Key Takeaways
            </h2>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#0D9488] shrink-0 mt-0.5" />
                <span>ChatGPT speeds up drafting, but only if you guide it with clear, detailed prompts.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#0D9488] shrink-0 mt-0.5" />
                <span>Always edit what AI generates to eliminate robotic clichés and verify genuine facts.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#0D9488] shrink-0 mt-0.5" />
                <span>Tailor your resume using target keywords so you get discovered in applicant tracking systems.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#0D9488] shrink-0 mt-0.5" />
                <span>RoleFuse bridges the gap between raw text generation and verified ATS-friendly documents.</span>
              </li>
            </ul>

            <div className="pt-3">
              <Link href="/resume-builder">
                <Button className="h-11 px-6 bg-[#087F6E] hover:bg-[#065F53] text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer">
                  Build Your ATS Resume on RoleFuse
                </Button>
              </Link>
            </div>
          </section>

          {/* Author Bio Section */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row gap-5 items-start">
            <div className="h-14 w-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#087F6E] font-extrabold text-lg shrink-0">
              RH
            </div>
            <div className="space-y-2">
              <h3 className="font-heading font-extrabold text-base text-slate-900">
                Robert Henderson, CPRW, Resume Expert
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Robert Henderson, CPRW, is a certified professional résumé writer and a member of the Professional Association of Résumé Writers &amp; Career Coaches. He produces articles on resume optimization, ATS compliance, and job search strategies for job seekers worldwide.
              </p>
              <div className="pt-2">
                <Link
                  href="/resources"
                  className="text-xs font-bold text-[#087F6E] hover:underline"
                >
                  Explore More RoleFuse Career Resources
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
