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
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
