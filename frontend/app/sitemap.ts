import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://fasthireai.vercel.app";
  const now = new Date();

  const routes = [
    { url: "", changeFrequency: "daily", priority: 1.0 },
    { url: "/ats-checker", changeFrequency: "weekly", priority: 0.9 },
    { url: "/ats-resume", changeFrequency: "weekly", priority: 0.9 },
    { url: "/ats-optimizer", changeFrequency: "weekly", priority: 0.9 },
    { url: "/resume-builder", changeFrequency: "weekly", priority: 0.9 },
    { url: "/products", changeFrequency: "weekly", priority: 0.8 },
    { url: "/dashboard/pricing", changeFrequency: "weekly", priority: 0.8 },
    { url: "/resources", changeFrequency: "weekly", priority: 0.8 },
    { url: "/resources/ats-formatting-mistakes", changeFrequency: "monthly", priority: 0.7 },
    { url: "/resources/best-free-resume-builders", changeFrequency: "monthly", priority: 0.7 },
    { url: "/resources/best-resume-fonts", changeFrequency: "monthly", priority: 0.7 },
    { url: "/resources/how-ats-works", changeFrequency: "monthly", priority: 0.7 },
    { url: "/resources/resume-keywords", changeFrequency: "monthly", priority: 0.7 },
    { url: "/resources/tailor-resume", changeFrequency: "monthly", priority: 0.7 },
    { url: "/resources/convert-resume-ats", changeFrequency: "monthly", priority: 0.7 },
    { url: "/resources/chatgpt-resume", changeFrequency: "monthly", priority: 0.7 },
    { url: "/resources/blog", changeFrequency: "monthly", priority: 0.7 },
    { url: "/privacy", changeFrequency: "yearly", priority: 0.3 },
    { url: "/terms", changeFrequency: "yearly", priority: 0.3 },
  ];

  return routes.map((r) => ({
    url: `${baseUrl}${r.url}`,
    lastModified: now,
    changeFrequency: r.changeFrequency as "daily" | "weekly" | "monthly" | "yearly",
    priority: r.priority,
  }));
}
