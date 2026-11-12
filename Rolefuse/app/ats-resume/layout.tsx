import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RoleFuse — Free ATS Resume Builder & Optimizer",
  description: "Generate and optimize ATS-friendly resumes with RoleFuse. Designed to pass Workday, Taleo, and Greenhouse screening with 100% parseable formatting and bullet point enhancers.",
  keywords: [
    "rolefuse",
    "rolefuse ats resume",
    "rolefuse resume builder",
    "rolefuse free ats optimization",
    "free ats resume",
    "ats friendly resume format",
    "ats resume templates",
    "single column ats resume"
  ],
  alternates: {
    canonical: "/ats-resume",
  },
  openGraph: {
    title: "RoleFuse — Free ATS Resume Builder & Optimizer",
    description: "Create 100% ATS-compliant resumes with RoleFuse.",
    url: "/ats-resume",
  },
};

export default function AtsResumeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
