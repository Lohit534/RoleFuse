import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://rolefuse.in";

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
