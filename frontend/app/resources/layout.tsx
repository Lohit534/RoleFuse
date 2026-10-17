import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RoleFuse — Career Blog, ATS Guides & Resume Formatting Resources",
  description: "Free guides, expert articles, and formatting tips from RoleFuse. Learn how Applicant Tracking Systems work, avoid common resume formatting mistakes, and master keyword matching.",
  keywords: [
    "rolefuse",
    "rolefuse resources",
    "rolefuse blog",
    "ats resume guide",
    "how ats works",
    "ats formatting mistakes",
    "best fonts for ats resume"
  ],
  alternates: {
    canonical: "/resources",
  },
  openGraph: {
    title: "RoleFuse — Career Blog & ATS Guides",
    description: "Expert guides on beating ATS algorithms by RoleFuse.",
    url: "/resources",
  },
};

export default function ResourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
