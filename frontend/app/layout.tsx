import React from "react";
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import SiteBackground from "@/components/SiteBackground";
import HomescreenPrompt from "@/components/HomescreenPrompt";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

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
  metadataBase: new URL("https://rolefuse.in"),
  manifest: "/manifest.json",
  title: {
    default: "RoleFuse — Free AI ATS Resume Optimizer & ATS Scanner",
    template: "%s | RoleFuse — AI Resume Optimization",
  },
  description: "RoleFuse is the leading free AI ATS resume optimization platform and free ATS resume scanner. Match missing keywords against any job description, optimize formatting for Workday, Taleo, & Greenhouse, and score 90+ on recruiter ATS filters in under 30 seconds.",
  keywords: [
    "rolefuse",
    "rolefuse.in",
    "www.rolefuse.in",
    "https://rolefuse.in",
    "rolefuse india",
    "rolefuse ai",
    "rolefuse ats",
    "rolefuse resume",
    "rolefuse ats resume",
    "rolefuse ats scanner",
    "rolefuse resume builder",
    "rolefuse free ats optimization",
    "rolefuse free ats scanner",
    "rolefuse login",
    "role fuse",
    "role fuse ai",
    "free ats optimization",
    "free ats resume",
    "free ats scanner",
    "ats resume scanner free",
    "ats resume builder",
    "free resume checker",
    "ats score checker",
    "resume ats score",
    "ai resume optimizer",
    "ats friendly resume",
    "resume keyword matcher",
    "rolefuse score",
    "rolefuse app",
    "rolefuse ats score"
  ],
  alternates: {
    canonical: "https://rolefuse.in",
  },
  openGraph: {
    title: "RoleFuse — Free AI ATS Resume Optimizer & ATS Scanner",
    description: "Score 90+ on recruiter ATS filters in 30 seconds. Scan against any job description, uncover missing keywords, and build recruiter-ready resumes 100% free.",
    url: "https://rolefuse.in",
    siteName: "RoleFuse",
    images: [{ url: "/logo.png", width: 1024, height: 1024, alt: "RoleFuse AI - Free ATS Resume Optimization & Scanner" }],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "RoleFuse — Free AI ATS Resume Optimizer & ATS Scanner",
    description: "Scan against any job description, uncover missing keywords, and score 90+ on ATS filters in 30 seconds. 100% free.",
    images: ["/logo.png"],
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
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico", sizes: "48x48 32x32 16x16" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ],
  },
};

const appBaseUrl = "https://rolefuse.in";

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${appBaseUrl}/#website`,
      "url": appBaseUrl,
      "name": "RoleFuse",
      "alternateName": ["RoleFuse AI", "Rolefuse", "Role Fuse"],
      "description": "RoleFuse is the leading free AI ATS resume optimizer and resume scanner.",
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${appBaseUrl}/resources?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "WebApplication",
      "@id": `${appBaseUrl}/#webapp`,
      "name": "RoleFuse",
      "alternateName": [
        "RoleFuse AI",
        "Rolefuse",
        "Role Fuse",
        "rolefuse ats resume",
        "rolefuse free ats optimization",
        "rolefuse free ats scanner",
        "rolefuse resume builder",
        "rolefuse ats scanner"
      ],
      "url": appBaseUrl,
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "All",
      "browserRequirements": "Requires JavaScript. Requires HTML5.",
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "ratingCount": "1420",
        "bestRating": "5",
        "worstRating": "1"
      },
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "featureList": [
        "Free ATS Resume Optimization",
        "Real-time ATS Score Scanner",
        "Job Description Missing Keyword Matching",
        "ATS Safe PDF & DOCX Export",
        "AI Bullet Point Quantifiable Impact Rewriter"
      ],
      "description": "RoleFuse offers free AI-powered ATS resume optimization, ATS resume builder, and instant ATS score scanner."
    },
    {
      "@type": "Organization",
      "@id": `${appBaseUrl}/#organization`,
      "name": "RoleFuse",
      "url": appBaseUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${appBaseUrl}/logo.png`,
        "width": 1024,
        "height": 1024,
        "caption": "RoleFuse AI Official Brand Logo"
      },
      "image": `${appBaseUrl}/logo.png`,
      "sameAs": [
        "https://twitter.com/rolefuse"
      ]
    },
    {
      "@type": "FAQPage",
      "@id": `${appBaseUrl}/#faq`,
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is RoleFuse?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "RoleFuse is the leading free AI-powered ATS resume optimization and scanner platform that scans your resume against any target job description, detects missing keywords, and boosts your score to 90+ in under 30 seconds."
          }
        },
        {
          "@type": "Question",
          "name": "Is RoleFuse completely free to use?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes! RoleFuse provides free AI resume optimizations every single month with zero credit card required."
          }
        },
        {
          "@type": "Question",
          "name": "How does RoleFuse improve my ATS resume score?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "RoleFuse analyzes your resume against recruiter screening patterns used by Workday, Taleo, and Greenhouse. It identifies missing technical and soft skills, rewrites bullet points for quantifiable impact, and ensures 100% parseable formatting."
          }
        },
        {
          "@type": "Question",
          "name": "Can I download ATS-friendly PDF and DOCX files on RoleFuse?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes! You can instantly export clean, recruiter-approved single-column ATS PDF and Microsoft Word DOCX resumes."
          }
        },
        {
          "@type": "Question",
          "name": "How is RoleFuse different from ChatGPT?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "RoleFuse is purpose-built for Applicant Tracking Systems. It scores your resume numerically, provides exact missing keyword rubrics, generates formatted exports, and keeps your career applications organized."
          }
        }
      ]
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
        <meta name="theme-color" content="#FFFFFF" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="RoleFuse" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.png" type="image/png" sizes="512x512" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.__rolefuse_deferred_prompt = null;
              window.addEventListener('beforeinstallprompt', function(e) {
                e.preventDefault();
                window.__rolefuse_deferred_prompt = e;
              });
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
        <meta name="google-site-verification" content="googleba8a3a56d2cebf5c" />
        <meta name="google-site-verification" content="ba8a3a56d2cebf5c" />
        <link rel="icon" href="/favicon.ico" sizes="48x48 32x32 16x16" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link rel="icon" type="image/png" sizes="48x48" href="/icon-48.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/icon-96.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="image_src" href="https://rolefuse.in/logo.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="min-h-screen bg-white text-[#111827] flex flex-col antialiased font-sans relative selection:bg-[#087F6E]/15 selection:text-[#087F6E]">
        <SiteBackground />
        <HomescreenPrompt />
        <Toaster
          position="top-center"
          gutter={8}
          toastOptions={{
            duration: 3500,
            style: {
              background: "#0f172a",
              color: "#f8fafc",
              padding: "11px 18px",
              borderRadius: "14px",
              fontSize: "13.5px",
              fontWeight: "500",
              letterSpacing: "-0.01em",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              maxWidth: "min(440px, 92vw)",
              width: "auto",
            },
            success: {
              duration: 0,
              style: {
                display: "none",
              },
            },
            error: {
              iconTheme: {
                primary: "#f43f5e",
                secondary: "#0f172a",
              },
              duration: 4500,
            },
          }}
        />
        <div className="flex flex-col min-h-screen flex-1 relative z-0">
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
