import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RoleFuse — AI Career Suite, Resume Builder & Job Tracker",
  description: "Explore the RoleFuse AI product suite: ATS Resume Optimizer, Resume Builder, Job Application Tracker, and Cover Letter Generator designed to accelerate your job search.",
  keywords: [
    "rolefuse",
    "rolefuse products",
    "rolefuse tools",
    "rolefuse ai suite",
    "ai resume tools",
    "job tracker ats",
    "ai cover letter generator"
  ],
  alternates: {
    canonical: "/products",
  },
  openGraph: {
    title: "RoleFuse — AI Career Suite & Job Tracker",
    description: "All-in-one AI career toolkit by RoleFuse.",
    url: "/products",
  },
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
