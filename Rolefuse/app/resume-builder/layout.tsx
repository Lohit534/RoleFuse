import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RoleFuse — Free Interactive ATS Resume Builder",
  description: "Build an ATS-optimized resume step by step with RoleFuse. Pre-formatted reverse-chronological templates, live keyword matching, and instant PDF/DOCX export.",
  keywords: [
    "rolefuse",
    "rolefuse resume builder",
    "free resume builder",
    "ats resume builder",
    "interactive resume builder",
    "ats resume template"
  ],
  alternates: {
    canonical: "/resume-builder",
  },
  openGraph: {
    title: "RoleFuse — Free Interactive ATS Resume Builder",
    description: "Step-by-step ATS-safe resume builder by RoleFuse.",
    url: "/resume-builder",
  },
};

export default function ResumeBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
