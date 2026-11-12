import { MetadataRoute } from "next";
import { headers } from "next/headers";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = "https://rolefuse.in";
  const headersList = await headers();
  const host = headersList.get("host") ?? "";

  // Block all crawlers on Vercel preview/production URLs — only rolefuse.in should be indexed
  if (host.includes("vercel.app")) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
      host: baseUrl,
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/auth/callback", "/auth/confirm"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/", "/dashboard/"],
      },
      {
        userAgent: "Googlebot-Image",
        allow: [
          "/",
          "/logo.png",
          "/icon.png",
          "/icon-512.png",
          "/icon-192.png",
          "/icon-96.png",
          "/icon-48.png",
          "/favicon.ico",
        ],
        disallow: ["/api/", "/dashboard/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
