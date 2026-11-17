import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Resume Optimizer — RoleFuse",
  description: "Optimize your resume with AI to match target job descriptions, pass ATS screening filters, and increase interview callbacks with RoleFuse.",
  keywords: [
    "ai resume optimizer",
    "ats resume optimizer",
    "rolefuse optimizer",
    "resume keyword matcher",
    "tailor resume with ai",
  ],
  alternates: {
    canonical: "/ats-optimizer",
  },
  openGraph: {
    title: "AI Resume Optimizer — RoleFuse",
    description: "Match job descriptions, fix ATS formatting, and inject required technical keywords with RoleFuse AI.",
    url: "/ats-optimizer",
  },
};

export default function AtsOptimizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
