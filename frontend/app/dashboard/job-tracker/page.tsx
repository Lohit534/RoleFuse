"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Briefcase, 
  Plus, 
  Trash2, 
  Search, 
  FileText, 
  Calendar, 
  DollarSign, 
  Link2, 
  Edit, 
  Loader2, 
  ArrowRight,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { toast } from "react-hot-toast";
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

const COLUMNS: { id: Job["status"]; label: string; color: string; border: string; dot: string }[] = [
  { id: "wishlist", label: "Wishlist", color: "bg-slate-100 text-slate-700", border: "border-slate-200", dot: "bg-slate-400" },
  { id: "applied", label: "Applied", color: "bg-teal-50 text-[#087F6E]", border: "border-teal-200", dot: "bg-[#087F6E]" },
  { id: "interviewing", label: "Interviewing", color: "bg-amber-50 text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  { id: "offered", label: "Offered", color: "bg-emerald-50 text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-600" },
  { id: "rejected", label: "Rejected", color: "bg-rose-50 text-rose-700", border: "border-rose-200", dot: "bg-rose-500" }
];

export default function JobTrackerPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Data State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [resumes, setResumes] = useState<MiniResume[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
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
          toast.error("Please sign in to view your Job Tracker.");
          router.push("/auth/login");
          return;
        }
        
        const user = data.user;
        setUserId(user.id);

        // Load cached jobs immediately so user's existing tracked values appear right away
        const storedJobs = localStorage.getItem(`fastHire_jobs_${user.id}`);
        if (storedJobs) {
          try {
            const parsed = JSON.parse(storedJobs);
            if (Array.isArray(parsed)) {
              // Sanitize any empty/corrupt placeholder entries
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

        // Fetch user's saved resumes via history API to ensure correct activeUserId resolution
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
        toast.error("Could not load user details.");
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

  // Instant 1-click status update (No floppy dragging)
  const handleStatusChange = (id: string, newStatus: Job["status"]) => {
    const updatedJobs = jobs.map((job) => {
      if (job.id === id) {
        return { ...job, status: newStatus };
      }
      return job;
    });

    saveJobsToLocalStorage(updatedJobs);
    const targetCol = COLUMNS.find((c) => c.id === newStatus);
    toast.success(`Job moved to ${targetCol?.label || newStatus}`);
  };

  // Form open for new or edit
  const openForm = (job: Job | null = null) => {
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

  // Delete Job Card
  const handleDeleteJob = (id: string) => {
    if (confirm("Are you sure you want to delete this job record?")) {
      const updated = jobs.filter((j) => j.id !== id);
      saveJobsToLocalStorage(updated);
      toast.success("Job record deleted.");
    }
  };

  // Submit Job
  const handleSubmitJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCompany.trim() || !formTitle.trim()) {
      toast.error("Company and Title fields are required.");
      return;
    }

    if (editingJob) {
      // Edit
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
      toast.success("Job details updated!");
    } else {
      // Add New
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
      toast.success("Job application tracked!");
    }

    setIsFormOpen(false);
  };

  const moveCardStep = (id: string, currentStatus: Job["status"], direction: "next" | "prev") => {
    const statusSequence: Job["status"][] = ["wishlist", "applied", "interviewing", "offered", "rejected"];
    const currentIndex = statusSequence.indexOf(currentStatus);
    let nextIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < statusSequence.length) {
      const targetStatus = statusSequence[nextIndex];
      const updated = jobs.map((j) => (j.id === id ? { ...j, status: targetStatus } : j));
      saveJobsToLocalStorage(updated);
      toast.success(`Job moved to ${COLUMNS.find(c => c.id === targetStatus)?.label}`);
    }
  };

  if (authLoading) {
    return <JobTrackerSkeleton />;
  }

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
    applied: jobs.filter((j) => j.status !== "wishlist").length,
    interviews: jobs.filter((j) => j.status === "interviewing").length,
    offers: jobs.filter((j) => j.status === "offered").length,
  };

  return (
    <div className="flex flex-col min-h-screen bg-transparent text-[#111827] font-sans">
      <Navbar />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-28 sm:pb-8 flex flex-col gap-6">
        
        {/* Title and Controls Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-[#111827] tracking-tight flex items-center gap-3">
              <Briefcase className="h-7 w-7 text-[#087F6E]" />
              Job Application Tracker
            </h1>
            <p className="text-sm sm:text-base text-[#526176] font-normal mt-1">
              Track your applications and never miss an opportunity.
            </p>
          </div>
          
          <div className="flex items-center gap-2 self-end md:self-auto">
            <div className="relative w-60">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#526176]" />
              <Input
                placeholder="Search jobs or companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs border-[#DCE7E9] bg-white text-[#111827] placeholder:text-[#526176]/50 focus:border-[#087F6E] focus:ring-2 focus:ring-[#087F6E]/20 rounded-xl shadow-xs"
              />
            </div>
            <Button
              onClick={() => openForm(null)}
              className="bg-[#087F6E] hover:bg-[#075E53] text-white font-bold h-9 text-xs rounded-md px-4 flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add Job
            </Button>
          </div>
        </div>

        {/* Stats Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border border-[#DCE7E9] bg-white rounded-2xl shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-[#526176] tracking-wider">Total Tracked</p>
                <h3 className="text-xl font-black text-[#111827] mt-1">{stats.total}</h3>
              </div>
              <Briefcase className="h-6 w-6 text-slate-500 opacity-80" />
            </CardContent>
          </Card>
          <Card className="border border-[#DCE7E9] bg-white rounded-2xl shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-[#526176] tracking-wider">Applications</p>
                <h3 className="text-xl font-black text-[#111827] mt-1">{stats.applied}</h3>
              </div>
              <TrendingUp className="h-6 w-6 text-blue-500 opacity-80" />
            </CardContent>
          </Card>
          <Card className="border border-[#DCE7E9] bg-white rounded-2xl shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-[#526176] tracking-wider">Interviews</p>
                <h3 className="text-xl font-black text-[#111827] mt-1">{stats.interviews}</h3>
              </div>
              <Clock className="h-6 w-6 text-amber-500 opacity-80" />
            </CardContent>
          </Card>
          <Card className="border border-[#DCE7E9] bg-white rounded-2xl shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-[#526176] tracking-wider">Offers Received</p>
                <h3 className="text-xl font-black text-[#111827] mt-1">{stats.offers}</h3>
              </div>
              <CheckCircle className="h-6 w-6 text-emerald-600 opacity-80" />
            </CardContent>
          </Card>
        </div>

        {/* Kanban Board Container (Resume Box Style - No Floppy Drag Cards) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-3.5 items-start min-h-[500px] overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const colJobs = filteredJobs.filter((j) => j.status === col.id);
            return (
              <div
                key={col.id}
                className="flex flex-col bg-slate-50/70 border border-slate-200/80 rounded-2xl p-2.5 min-w-[210px] space-y-2.5"
              >
                {/* Column header title */}
                <div className="flex items-center justify-between px-1 select-none">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <span className="font-bold text-xs text-[#111827]">{col.label}</span>
                  </div>
                  <Badge className={`text-[9px] font-bold border ${col.color} ${col.border}`}>
                    {colJobs.length}
                  </Badge>
                </div>

                {/* Resume-style Perfect Boxes */}
                <div className="flex flex-col gap-2.5">
                  {colJobs.length === 0 ? (
                    <div className="py-8 text-center text-[10px] text-slate-400 font-medium">
                      No jobs in this stage
                    </div>
                  ) : (
                    colJobs.map((job) => {
                      const associatedResume = resumes.find((r) => r.id === job.resumeId);
                      return (
                        <Card
                          key={job.id}
                          className="group relative border border-[#DCE7E9] bg-white hover:border-[#087F6E]/50 hover:shadow-md transition-all duration-200 rounded-2xl shadow-xs flex flex-col justify-between overflow-hidden"
                        >
                          <CardContent className="p-3.5 flex flex-col justify-between space-y-2.5">
                            {/* Card header */}
                            <div className="space-y-0.5">
                              <div className="flex justify-between items-start gap-1.5">
                                <h4
                                  className="font-bold text-xs text-[#111827] truncate max-w-[85%]"
                                  title={job.title}
                                >
                                  {job.title}
                                </h4>
                                {job.url && (
                                  <a
                                    href={job.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-slate-400 hover:text-[#087F6E] transition-colors shrink-0"
                                    title="Open Job Listing"
                                  >
                                    <ExternalLink className="h-3 w-3" />
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

                            {/* Details Row */}
                            <div className="space-y-1 pt-1.5 border-t border-slate-100">
                              {job.salary && (
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-700 font-semibold">
                                  <DollarSign className="h-3 w-3 text-[#087F6E] shrink-0" />
                                  <span className="truncate">{job.salary}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                                <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                                <span>{job.date}</span>
                              </div>
                              {associatedResume && (
                                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-teal-800 bg-teal-50 border border-teal-200/60 px-2 py-0.5 rounded-md truncate">
                                  <FileText className="h-3 w-3 text-[#087F6E] shrink-0" />
                                  <span className="truncate">
                                    {associatedResume.jobTitle || "Custom Resume"}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* 1-Click Fast Stage Selector */}
                            <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-100">
                              <span className="text-[9px] font-bold uppercase text-[#526176] tracking-wider">
                                Stage
                              </span>
                              <select
                                value={job.status}
                                onChange={(e) =>
                                  handleStatusChange(job.id, e.target.value as Job["status"])
                                }
                                className="h-6 text-[10px] font-bold rounded-md border border-[#DCE7E9] bg-slate-50/80 px-1.5 text-[#111827] hover:border-[#087F6E] focus:outline-none focus:ring-1 focus:ring-[#087F6E] cursor-pointer transition-colors"
                              >
                                <option value="wishlist">Wishlist</option>
                                <option value="applied">Applied</option>
                                <option value="interviewing">Interviewing</option>
                                <option value="offered">Offered</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            </div>

                            {/* Action Buttons (Matching Resume Boxes in My Resumes) */}
                            <div className="flex gap-1.5 items-center pt-2 border-t border-[#DCE7E9]">
                              <Button
                                onClick={() => openForm(job)}
                                variant="ghost"
                                className="flex-1 bg-[#F5FAFA] hover:bg-[#087F6E] text-[#111827] hover:text-white border border-[#DCE7E9] rounded-xl h-7 text-[10px] font-bold gap-1 transition-colors cursor-pointer"
                              >
                                <Edit className="h-3 w-3" />
                                Edit
                              </Button>
                              <Button
                                onClick={() => handleDeleteJob(job.id)}
                                variant="ghost"
                                className="h-7 w-7 p-0 rounded-xl hover:bg-rose-50 text-[#526176] hover:text-rose-600 border border-[#DCE7E9] cursor-pointer"
                                title="Remove Job"
                              >
                                <Trash2 className="h-3 w-3" />
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

      {/* JOB CREATION / EDITING FORM DRAWER MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-extrabold text-slate-900 text-base">
                {editingJob ? "Edit Tracked Job" : "Add Job to Pipeline"}
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSubmitJob} className="space-y-3 text-xs select-none">
              
              {/* Company input */}
              <div className="space-y-1">
                <label className="text-slate-600 font-bold uppercase text-[9px] tracking-wider">Company Name *</label>
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
                <label className="text-slate-600 font-bold uppercase text-[9px] tracking-wider">Role Title *</label>
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
                  <label className="text-slate-600 font-bold uppercase text-[9px] tracking-wider">Salary / Comp</label>
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
                  className="h-9 border-slate-200 bg-white text-slate-900 rounded-lg focus:border-[#0d6e5a] focus:ring-[#0d6e5a]"
                />
              </div>

              {/* Associate Resume select option */}
              <div className="space-y-1">
                <label className="text-slate-600 font-bold uppercase text-[9px] tracking-wider">Linked Resume version</label>
                <select
                  value={formResumeId}
                  onChange={(e) => setFormResumeId(e.target.value)}
                  className="w-full h-9 border border-slate-200 bg-white text-slate-900 rounded-lg px-2.5 focus:border-[#087F6E] outline-none focus:ring-1 focus:ring-[#087F6E] text-xs font-semibold"
                >
                  <option value="none">-- None (Not Linked) --</option>
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
                <label className="text-slate-600 font-bold uppercase text-[9px] tracking-wider">Notes &amp; Reminders</label>
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
                  className="border-slate-200 text-slate-700 hover:bg-slate-50 h-8 text-xs font-bold rounded-lg px-3"
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

