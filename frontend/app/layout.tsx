import React from "react";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import SiteBackground from "@/components/SiteBackground";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  preload: false,
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://fasthireai.vercel.app"),
  title: {
    default: "FastHire AI — Free ATS Resume Optimization & Free ATS Scanner",
    template: "%s | FastHire AI — Free ATS Optimization",
  },
  description: "FastHire AI is the #1 free ATS optimization platform and free ATS scanner. Build an ATS resume, match missing keywords against any job description, and score 90+ on ATS filters in under 30 seconds. 100% free forever.",
  keywords: [
    "fasthire free ats optimization",
    "fasthire ats resume",
    "fassthire free ats scanner",
    "fasthire free ats scanner",
    "fasthire",
    "fassthire",
    "free ats optimization",
    "free ats resume",
    "free ats scanner",
    "ats resume builder",
    "free resume checker",
    "ats score checker",
    "resume ats score",
    "ai resume optimizer",
    "ats friendly resume",
    "resume keyword matcher"
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "FastHire AI — Free ATS Resume Optimization & Free ATS Scanner",
    description: "Score 90+ on recruiter ATS filters. Free ATS optimization, ATS resume builder, and instant ATS scanner.",
    url: "https://fasthireai.vercel.app",
    siteName: "FastHire AI",
    images: [{ url: "/icon.png", width: 1024, height: 1024, alt: "FastHire AI Logo" }],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "FastHire AI — Free ATS Resume Optimization & Free ATS Scanner",
    description: "Free ATS resume optimization and free ATS scanner. Score 90+ on ATS filters in 30 seconds.",
    images: ["/icon.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": "https://fasthireai.vercel.app/#webapp",
      "name": "FastHire AI",
      "alternateName": [
        "FastHire",
        "fasthire free ats optimization",
        "fasthire ats resume",
        "fassthire free ats scanner",
        "fasthire free ats scanner"
      ],
      "url": "https://fasthireai.vercel.app",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "All",
      "browserRequirements": "Requires JavaScript. Requires HTML5.",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "description": "FastHire AI offers free ATS optimization, ATS resume builder, and instant ATS score scanner."
    },
    {
      "@type": "Organization",
      "@id": "https://fasthireai.vercel.app/#organization",
      "name": "FastHire AI",
      "url": "https://fasthireai.vercel.app",
      "logo": "https://fasthireai.vercel.app/icon.png"
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${inter.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="min-h-screen bg-white text-[#111827] flex flex-col antialiased font-sans relative selection:bg-[#087F6E]/15 selection:text-[#087F6E]">
        <SiteBackground />
        <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
        <div className="flex flex-col min-h-screen flex-1 relative z-0">
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
