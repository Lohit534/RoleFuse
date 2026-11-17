import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RoleFuse Pricing — AI Resume Builder & Optimizer Plans",
  description: "Affordable ATS resume builder and AI optimizer pricing. Choose between Free Career Tier, Pro, and Pro Max plans with transparent pricing.",
  keywords: [
    "rolefuse pricing",
    "ai resume builder pricing",
    "ats resume optimizer cost",
    "free resume builder",
    "resume optimization subscription",
  ],
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "RoleFuse Pricing — AI Resume Builder & Optimizer Plans",
    description: "Affordable ATS resume builder and AI optimizer pricing. Choose between Free Career Tier, Pro, and Pro Max plans.",
    url: "/pricing",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
