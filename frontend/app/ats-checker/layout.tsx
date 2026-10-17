import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RoleFuse — Free ATS Resume Checker & Scanner",
  description: "Check your resume ATS compatibility for free with RoleFuse. Scan your resume against target job descriptions, discover missing keywords, and get instant recommendations to beat applicant tracking systems.",
  keywords: [
    "rolefuse",
    "rolefuse ats scanner",
    "rolefuse ats checker",
    "rolefuse ats resume",
    "free ats scanner",
    "free ats checker",
    "check resume ats score",
    "resume keyword scanner",
    "ats score test"
  ],
  alternates: {
    canonical: "/ats-checker",
  },
  openGraph: {
    title: "RoleFuse — Free ATS Resume Checker & Scanner",
    description: "Instant ATS score check & missing keyword analysis with RoleFuse.",
    url: "/ats-checker",
  },
};

export default function AtsCheckerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
