import type { NextConfig } from "next";

// Conservative, non-breaking security headers. Intentionally no CSP for now —
// a strict CSP risks breaking Vercel Analytics / Speed Insights, external badge
// images (zenodo/shields.io), chart export, and other external assets.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.86.162",
    "192.168.0.0/16",
    "10.0.0.0/8",
    "localhost",
  ],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
