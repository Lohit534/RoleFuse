"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { JobTrackerSkeleton } from "@/components/SkeletonShimmer";

interface Job {
  id: string;
  company: string;
  title: string;
  salary?: string;
  url?: string;
  date: string;
  notes?: string;
  resumeId?: string;
  status: "wishlist" | "applied" | "interviewing" | "offered" | "rejected";
}

interface MiniResume {
  id: string;
  jobTitle?: string | null;
  company?: string | null;
  createdAt: string;
}

const COLUMNS: { id: Job["status"]; label: string; color: string; border: string }[] = [
  { id: "wishlist", label: "Wishlist", color: "bg-slate-100 text-slate-700", border: "border-slate-200" },
  { id: "applied", label: "Applied", color: "bg-teal-50 text-[#087F6E]", border: "border-teal-200" },
  { id: "interviewing", label: "Interviewing", color: "bg-amber-50 text-amber-700", border: "border-amber-200" },
  { id: "offered", label: "Offered", color: "bg-emerald-50 text-emerald-700", border: "border-emerald-200" },
  { id: "rejected", label: "Rejected", color: "bg-rose-50 text-rose-700", border: "border-rose-200" }
];

export default function JobTrackerPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // In-app error messages (replacing toast popups)
  const [pageError, setPageError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Data State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [resumes, setResumes] = useState<MiniResume[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Drag and Drop State
  const [draggedJobId, setDraggedJobId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<Job["status"] | null>(null);

  // Delete Target for centered confirmation popup modal (Like in History)
  const [deleteTargetJob, setDeleteTargetJob] = useState<Job | null>(null);

  // Modals / Editors
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  // Form Inputs
  const [formCompany, setFormCompany] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formSalary, setFormSalary] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formResumeId, setFormResumeId] = useState("");
  const [formStatus, setFormStatus] = useState<Job["status"]>("wishlist");

  // 1. Session check & resumes load
  useEffect(() => {
    async function initPage() {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data?.user) {
          setPageError("Please sign in to view your Job Tracker.");
          router.push("/auth/login");
          return;
        }

        const user = data.user;
        setUserId(user.id);

        // Load cached jobs immediately
        const storedJobs = localStorage.getItem(`fastHire_jobs_${user.id}`);
        if (storedJobs) {
          try {
            const parsed = JSON.parse(storedJobs);
            if (Array.isArray(parsed)) {
              const valid = parsed.filter(
                (j: any) => j && typeof j === "object" && (String(j.company || "").trim() || String(j.title || "").trim())
              );
              setJobs(valid);
              if (valid.length !== parsed.length) {
                localStorage.setItem(`fastHire_jobs_${user.id}`, JSON.stringify(valid));
              }
              if (valid.length > 0) {
                setAuthLoading(false);
              }
            }
          } catch (e) {}
        }

        // Fetch user's saved resumes via history API
        let dbData: any[] = [];
        let dbError: any = null;
        try {
          const historyRes = await fetch("/api/history");
          if (historyRes.ok) {
            const data = await historyRes.json();
            dbData = data.records || [];
          } else {
            dbError = new Error("Failed to load resumes");
          }
        } catch (e) {
          dbError = e;
        }

        if (!dbError) {
          setResumes(dbData as MiniResume[]);
        }
        setAuthLoading(false);
      } catch (err) {
        setPageError("Could not load user details. Please sign in again.");
        setAuthLoading(false);
        router.push("/auth/login");
      }
    }
    initPage();
  }, [router]);

  // Persist jobs state
  const saveJobsToLocalStorage = (newJobs: Job[]) => {
    if (!userId) return;
    localStorage.setItem(`fastHire_jobs_${userId}`, JSON.stringify(newJobs));
    setJobs(newJobs);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("fastHire_jobs_updated"));
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
    setDraggedJobId(id);
  };

  const handleDragEnd = () => {
    setDraggedJobId(null);
    setDragOverColId(null);
  };

  const handleDragOver = (e: React.DragEvent, colId: Job["status"]) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColId !== colId) {
      setDragOverColId(colId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, colId: Job["status"]) => {
    if (e.currentTarget === e.target) {
      setDragOverColId((prev) => (prev === colId ? null : prev));
    }
  };

  const handleDrop = (e: React.DragEvent, targetStatus: Job["status"]) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || draggedJobId;
    if (!id) return;

    const updatedJobs = jobs.map((job) => {
      if (job.id === id) {
        return { ...job, status: targetStatus };
      }
      return job;
    });

    saveJobsToLocalStorage(updatedJobs);
    setDraggedJobId(null);
    setDragOverColId(null);
  };

  // Form open for new or edit
  const openForm = (job: Job | null = null) => {
    setFormError(null);
    if (job) {
      setEditingJob(job);
      setFormCompany(job.company);
      setFormTitle(job.title);
      setFormSalary(job.salary || "");
      setFormUrl(job.url || "");
      setFormDate(job.date);
      setFormNotes(job.notes || "");
      setFormResumeId(job.resumeId || "none");
      setFormStatus(job.status);
    } else {
      setEditingJob(null);
      setFormCompany("");
      setFormTitle("");
      setFormSalary("");
      setFormUrl("");
      setFormDate(new Date().toISOString().split("T")[0]);
      setFormNotes("");
      setFormResumeId("none");
      setFormStatus("wishlist");
    }
    setIsFormOpen(true);
  };

  // Submit Job
  const handleSubmitJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCompany.trim() || !formTitle.trim()) {
      setFormError("Company name and role title are required.");
      return;
    }

    if (editingJob) {
      const updated = jobs.map((j) => {
        if (j.id === editingJob.id) {
          return {
            ...j,
            company: formCompany.trim(),
            title: formTitle.trim(),
            salary: formSalary.trim() || undefined,
            url: formUrl.trim() || undefined,
            date: formDate,
            notes: formNotes.trim() || undefined,
            resumeId: formResumeId === "none" ? undefined : formResumeId,
            status: formStatus
          };
        }
        return j;
      });
      saveJobsToLocalStorage(updated);
    } else {
      const newJob: Job = {
        id: Math.random().toString(36).substr(2, 9),
        company: formCompany.trim(),
        title: formTitle.trim(),
        salary: formSalary.trim() || undefined,
        url: formUrl.trim() || undefined,
        date: formDate,
        notes: formNotes.trim() || undefined,
        resumeId: formResumeId === "none" ? undefined : formResumeId,
        status: formStatus
      };
      saveJobsToLocalStorage([newJob, ...jobs]);
    }

    setIsFormOpen(false);
  };

  // Filter jobs by search query
  const filteredJobs = jobs.filter((job) => {
    const q = searchQuery.toLowerCase();
    return (
      job.company.toLowerCase().includes(q) ||
      job.title.toLowerCase().includes(q) ||
      (job.notes && job.notes.toLowerCase().includes(q))
    );
  });

  // Calculate Metrics
  const stats = {
    total: jobs.length,
    wishlist: jobs.filter((j) => j.status === "wishlist").length,
    applied: jobs.filter((j) => j.status === "applied").length,
    interviews: jobs.filter((j) => j.status === "interviewing").length,
    offers: jobs.filter((j) => j.status === "offered").length,
    rejected: jobs.filter((j) => j.status === "rejected").length,
  };

  if (authLoading) {
    return <JobTrackerSkeleton />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-transparent text-[#111827] font-sans">
      <Navbar />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-28 sm:pb-8 flex flex-col gap-6">

        {/* In-page Error Banner */}
        {pageError && (
          <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between">
            <span>{pageError}</span>
            <button
              onClick={() => setPageError(null)}
              className="text-rose-600 hover:text-rose-800 font-bold ml-2 underline text-xs cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Title and Controls Header Row (Text-Only, Crisp Rectangular Design) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-[#111827] tracking-tight">
              Job Application Tracker
            </h1>
            <p className="text-sm sm:text-base text-[#526176] font-normal mt-1">
              Track your applications and never miss an opportunity.
            </p>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <div className="relative w-60">
              <Input
                placeholder="Search jobs or companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 h-9 text-xs border-[#DCE7E9] bg-white text-[#111827] placeholder:text-[#526176]/60 focus:border-[#087F6E] focus:ring-2 focus:ring-[#087F6E]/20 rounded-lg shadow-2xs"
              />
            </div>
            <Button
              onClick={() => openForm(null)}
              className="bg-[#087F6E] hover:bg-[#075E53] text-white font-bold h-9 text-xs rounded-md px-3.5 shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>+</span>
              <span>Add Job</span>
            </Button>
          </div>
        </div>

        {/* ── CRISP RECTANGLE PIPELINE PERFORMANCE ANALYSIS BAR (Text-Only) ── */}
        <div className="border border-[#DCE7E9] bg-white rounded-lg shadow-2xs p-5 space-y-4">
          {/* Header Row: Title & Key Rates */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EAF0F1] pb-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#087F6E]">
                Pipeline Performance Analysis
              </span>
              <p className="text-xs text-[#526176] font-medium">
                Live recruitment conversion funnel, yield rates, and active pipeline velocity
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-[#E6F4F1] text-[#087F6E] border border-[#C2E4DD]">
                Active: {stats.total > 0 ? Math.round(((stats.applied + stats.interviews + stats.offers) / stats.total) * 100) : 0}%
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                Interview Yield: {stats.applied > 0 ? Math.round((stats.interviews / stats.applied) * 100) : 0}%
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Offer Win Rate: {stats.interviews > 0 ? Math.round((stats.offers / stats.interviews) * 100) : (stats.offers > 0 ? 100 : 0)}%
              </span>
            </div>
          </div>

          {/* 4 Connected Metric Columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#EAF0F1] pt-1">
            <div className="px-3 py-2 sm:py-0 first:pl-0">
              <p className="text-[10px] uppercase font-bold text-[#526176] tracking-wider">Total Tracked</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-[#111827]">{stats.total}</span>
                <span className="text-[10px] font-semibold text-[#526176]">roles</span>
              </div>
            </div>

            <div className="px-3 py-2 sm:py-0">
              <p className="text-[10px] uppercase font-bold text-[#526176] tracking-wider">Applications</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-[#087F6E]">{stats.applied}</span>
                <span className="text-[10px] font-semibold text-[#526176]">submitted</span>
              </div>
            </div>

            <div className="px-3 py-2 sm:py-0">
              <p className="text-[10px] uppercase font-bold text-[#526176] tracking-wider">Interviews</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-amber-600">{stats.interviews}</span>
                <span className="text-[10px] font-semibold text-[#526176]">rounds</span>
              </div>
            </div>

            <div className="px-3 py-2 sm:py-0 last:pr-0">
              <p className="text-[10px] uppercase font-bold text-[#526176] tracking-wider">Offers Received</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-emerald-600">{stats.offers}</span>
                <span className="text-[10px] font-semibold text-[#526176]">secured</span>
              </div>
            </div>
          </div>

          {/* Pipeline Stage Flow Distribution Bar */}
          <div className="pt-2 border-t border-[#EAF0F1] space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-semibold text-[#526176]">
              <span>Pipeline Stage Distribution</span>
              <span>{stats.total} total application{stats.total === 1 ? "" : "s"}</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-md overflow-hidden flex">
              <div
                style={{ width: `${stats.total > 0 ? (stats.wishlist / stats.total) * 100 : 0}%` }}
                className="bg-slate-400 transition-all duration-300"
                title={`Wishlist: ${stats.wishlist}`}
              />
              <div
                style={{ width: `${stats.total > 0 ? (stats.applied / stats.total) * 100 : 0}%` }}
                className="bg-[#087F6E] transition-all duration-300"
                title={`Applied: ${stats.applied}`}
              />
              <div
                style={{ width: `${stats.total > 0 ? (stats.interviews / stats.total) * 100 : 0}%` }}
                className="bg-amber-500 transition-all duration-300"
                title={`Interviewing: ${stats.interviews}`}
              />
              <div
                style={{ width: `${stats.total > 0 ? (stats.offers / stats.total) * 100 : 0}%` }}
                className="bg-emerald-500 transition-all duration-300"
                title={`Offered: ${stats.offers}`}
              />
              <div
                style={{ width: `${stats.total > 0 ? (stats.rejected / stats.total) * 100 : 0}%` }}
                className="bg-rose-400 transition-all duration-300"
                title={`Rejected: ${stats.rejected}`}
              />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-[#526176] pt-0.5">
              <span>Wishlist: {stats.wishlist}</span>
              <span>Applied: {stats.applied}</span>
              <span>Interviewing: {stats.interviews}</span>
              <span>Offered: {stats.offers}</span>
              <span>Rejected: {stats.rejected}</span>
            </div>
          </div>
        </div>

        {/* ── KANBAN PIPELINE BOARD (Rectangle Boxes, Drag & Drop, No Dropdown, Text-Only) ── */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-3.5 items-start min-h-[500px] overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const colJobs = filteredJobs.filter((j) => j.status === col.id);
            const isColumnTargeted = dragOverColId === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={(e) => handleDragLeave(e, col.id)}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`flex flex-col rounded-lg p-2.5 min-w-[210px] space-y-2.5 transition-all duration-200 ${
                  isColumnTargeted
                    ? "ring-2 ring-[#087F6E] bg-teal-50/70 border-2 border-[#087F6E]"
                    : "bg-slate-50/70 border border-slate-200"
                }`}
              >
                {/* Column header title */}
                <div className="flex items-center justify-between px-1 select-none">
                  <span className="font-bold text-xs text-[#111827]">{col.label}</span>
                  <Badge className={`text-[9px] font-bold border rounded-md ${col.color} ${col.border}`}>
                    {colJobs.length}
                  </Badge>
                </div>

                {/* Drop placeholder indicator when dragging over */}
                {isColumnTargeted && draggedJobId && (
                  <div className="border-2 border-dashed border-[#087F6E] rounded-lg p-2.5 text-center text-[10px] font-bold text-[#087F6E] bg-white/80 animate-pulse">
                    Drop to move to {col.label}
                  </div>
                )}

                {/* Rectangle Job Cards (No dropdown, crisp rectangle box) */}
                <div className="flex flex-col gap-2.5">
                  {colJobs.length === 0 ? (
                    <div className="py-8 text-center text-[10px] text-slate-400 font-medium">
                      No jobs in this stage
                    </div>
                  ) : (
                    colJobs.map((job) => {
                      const associatedResume = resumes.find((r) => r.id === job.resumeId);
                      const isBeingDragged = draggedJobId === job.id;

                      return (
                        <Card
                          key={job.id}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, job.id)}
                          onDragEnd={handleDragEnd}
                          className={`group relative border border-[#DCE7E9] bg-white hover:border-[#087F6E]/50 hover:shadow-sm transition-all duration-200 rounded-lg shadow-2xs flex flex-col justify-between overflow-hidden cursor-grab active:cursor-grabbing select-none ${
                            isBeingDragged ? "opacity-30 scale-95 ring-2 ring-[#087F6E]" : ""
                          }`}
                        >
                          <CardContent className="p-3.5 flex flex-col justify-between space-y-2.5">
                            {/* Card header */}
                            <div className="space-y-0.5">
                              <div className="flex justify-between items-start gap-1.5">
                                <h4
                                  className="font-bold text-xs text-[#111827] truncate max-w-[80%]"
                                  title={job.title}
                                >
                                  {job.title}
                                </h4>
                                {job.url && (
                                  <a
                                    href={job.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] font-bold text-[#087F6E] hover:underline shrink-0"
                                    title="Open Job Listing"
                                  >
                                    View Job
                                  </a>
                                )}
                              </div>
                              <p
                                className="text-[11px] font-semibold text-[#087F6E] truncate"
                                title={job.company}
                              >
                                {job.company}
                              </p>
                            </div>

                            {/* Details Row (Text-Only, No symbols) */}
                            <div className="space-y-1 pt-1.5 border-t border-slate-100">
                              {job.salary && (
                                <div className="text-[10px] text-slate-700 font-semibold truncate">
                                  Salary: <span className="text-[#087F6E]">{job.salary}</span>
                                </div>
                              )}
                              <div className="text-[10px] text-slate-500 font-medium truncate">
                                Date: {job.date}
                              </div>
                              {associatedResume && (
                                <div className="text-[10px] font-semibold text-teal-800 bg-teal-50 border border-teal-200/60 px-2 py-0.5 rounded-md truncate">
                                  Resume: {associatedResume.jobTitle || "Custom Resume"}
                                </div>
                              )}
                            </div>

                            {/* Action Buttons (Edit and Delete triggers popup modal) */}
                            <div className="flex gap-1.5 items-center pt-2 border-t border-[#DCE7E9]">
                              <Button
                                onClick={() => openForm(job)}
                                variant="ghost"
                                className="flex-1 bg-[#F5FAFA] hover:bg-[#087F6E] text-[#111827] hover:text-white border border-[#DCE7E9] rounded-md h-7 text-[10px] font-bold transition-colors cursor-pointer"
                              >
                                Edit
                              </Button>
                              <Button
                                onClick={() => setDeleteTargetJob(job)}
                                variant="ghost"
                                className="px-2.5 h-7 rounded-md hover:bg-rose-50 text-rose-600 border border-[#DCE7E9] text-[10px] font-bold cursor-pointer"
                                title="Remove Job"
                              >
                                Delete
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </main>

      {/* CENTERED DELETE CONFIRMATION POPUP MODAL (Matching History Style) */}
      {deleteTargetJob && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-slate-200 p-6 rounded-lg space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 select-none">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Delete Job Record</h3>
              <p className="text-xs text-slate-500 mt-0.5">Are you sure you want to delete this job application record?</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-700">
              <span className="font-bold text-slate-900 block truncate">{deleteTargetJob.title}</span>
              <span className="text-[11px] text-[#087F6E] font-semibold">{deleteTargetJob.company}</span>
            </div>

            <p className="text-[11px] text-red-600 font-medium">
              This action cannot be undone and will permanently remove this record from your pipeline.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDeleteTargetJob(null)}
                className="text-slate-600 hover:text-slate-900 text-xs font-semibold px-4 h-9 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  const updated = jobs.filter((j) => j.id !== deleteTargetJob.id);
                  saveJobsToLocalStorage(updated);
                  setDeleteTargetJob(null);
                }}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 h-9 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* JOB CREATION / EDITING FORM DRAWER MODAL (Crisp Rectangle Style) */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-slate-200 p-6 rounded-lg space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-extrabold text-slate-900 text-base">
                {editingJob ? "Edit Tracked Job" : "Add Job to Pipeline"}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {/* In-Modal Error Notification */}
            {formError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitJob} autoComplete="off" className="space-y-3 text-xs select-none">
              {/* Company input */}
              <div className="space-y-1">
                <label className="text-slate-600 font-bold uppercase text-[9px] tracking-wider">Company Name (Required)</label>
                <Input
                  required
                  placeholder="e.g. Google, Stripe"
                  value={formCompany}
                  onChange={(e) => setFormCompany(e.target.value)}
                  className="h-9 border-slate-200 bg-white text-slate-900 rounded-lg focus:border-[#0d6e5a] focus:ring-[#0d6e5a]"
                />
              </div>

              {/* Title input */}
              <div className="space-y-1">
                <label className="text-slate-600 font-bold uppercase text-[9px] tracking-wider">Role Title (Required)</label>
                <Input
                  required
                  placeholder="e.g. Senior Frontend Engineer"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="h-9 border-slate-200 bg-white text-slate-900 rounded-lg focus:border-[#0d6e5a] focus:ring-[#0d6e5a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Salary */}
                <div className="space-y-1">
                  <label className="text-slate-600 font-bold uppercase text-[9px] tracking-wider">Salary Comp</label>
                  <Input
                    placeholder="e.g. $140k - $160k"
                    value={formSalary}
                    onChange={(e) => setFormSalary(e.target.value)}
                    className="h-9 border-slate-200 bg-white text-slate-900 rounded-lg focus:border-[#0d6e5a] focus:ring-[#0d6e5a]"
                  />
                </div>
                {/* Application Date */}
                <div className="space-y-1">
                  <label className="text-slate-600 font-bold uppercase text-[9px] tracking-wider">Date Tracked</label>
                  <Input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="h-9 border-slate-200 bg-white text-slate-900 rounded-lg focus:border-[#0d6e5a] focus:ring-[#0d6e5a]"
                  />
                </div>
              </div>

              {/* Job URL */}
              <div className="space-y-1">
                <label className="text-slate-600 font-bold uppercase text-[9px] tracking-wider">Job Listing URL</label>
                <Input
                  type="url"
                  placeholder="https://jobs.lever.co/company/role"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-lpignore="true"
                  className="h-9 border-slate-200 bg-white text-slate-900 rounded-lg focus:border-[#0d6e5a] focus:ring-[#0d6e5a]"
                />
              </div>

              {/* Associate Resume select option */}
              <div className="space-y-1">
                <label className="text-slate-600 font-bold uppercase text-[9px] tracking-wider">Linked Resume Version</label>
                <select
                  value={formResumeId}
                  onChange={(e) => setFormResumeId(e.target.value)}
                  className="w-full h-9 border border-slate-200 bg-white text-slate-900 rounded-lg px-2.5 focus:border-[#087F6E] outline-none focus:ring-1 focus:ring-[#087F6E] text-xs font-semibold"
                >
                  <option value="none">None (Not Linked)</option>
                  {resumes.map((res) => (
                    <option key={res.id} value={res.id}>
                      {res.jobTitle || "Untitled"} ({res.company || "No Company"}) - {new Date(res.createdAt).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Select dropdown */}
              <div className="space-y-1">
                <label className="text-slate-600 font-bold uppercase text-[9px] tracking-wider">Pipeline Stage</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as Job["status"])}
                  className="w-full h-9 border border-slate-200 bg-white text-slate-900 rounded-lg px-2.5 focus:border-[#087F6E] outline-none focus:ring-1 focus:ring-[#087F6E] text-xs font-semibold"
                >
                  <option value="wishlist">Wishlist</option>
                  <option value="applied">Applied</option>
                  <option value="interviewing">Interviewing</option>
                  <option value="offered">Offered</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Notes textarea input */}
              <div className="space-y-1">
                <label className="text-slate-600 font-bold uppercase text-[9px] tracking-wider">Notes and Reminders</label>
                <textarea
                  placeholder="Key contacts, interview prep notes, referral names..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 border border-slate-200 bg-white text-slate-900 rounded-lg focus:border-[#087F6E] outline-none focus:ring-1 focus:ring-[#087F6E] font-sans text-xs resize-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                  className="border-slate-200 text-slate-700 hover:bg-slate-50 h-8 text-xs font-bold rounded-lg px-3 cursor-pointer"
                >
                  Discard
                </Button>
                <Button
                  type="submit"
                  className="bg-[#111827] hover:bg-slate-800 text-white font-bold h-8 text-xs rounded-lg px-4 shadow-sm transition-colors cursor-pointer"
                >
                  {editingJob ? "Save Changes" : "Create Card"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
