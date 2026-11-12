import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: path.resolve(__dirname, ".."),
  },
  // These packages use Node.js native features / CJS require() and must NOT be
  // bundled by Turbopack/webpack. They are loaded at runtime via require() inside
  // serverless functions where Node.js is available.
  serverExternalPackages: ["pdf-parse", "mammoth"],
  async redirects() {
    return [
      // 1. Force 301 Permanent Redirect from any *.vercel.app domain to canonical https://rolefuse.in
      // Excludes Google verification files (e.g. /google*.html) so Search Console can verify ownership
      {
        source: "/:path((?!google.*\\.html$).*)",
        has: [
          {
            type: "host",
            value: "(?<subdomain>.*)\\.vercel\\.app",
          },
        ],
        destination: "https://rolefuse.in/:path*",
        permanent: true,
      },
      // 2. Force 301 Permanent Redirect from www.rolefuse.in to canonical https://rolefuse.in
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "www\\.rolefuse\\.in",
          },
        ],
        destination: "https://rolefuse.in/:path*",
        permanent: true,
      },
      {
        source: "/admin",
        destination: "https://rolefuseadmin.vercel.app",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      // Never allow search engines to index any *.vercel.app deployment URL
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "(?<subdomain>.*)\\.vercel\\.app",
          },
        ],
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
