import type { NextConfig } from "next";

const NOINDEX = process.env.NEXT_PUBLIC_NOINDEX === "true";

const robotsHeaders = NOINDEX
  ? [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ]
  : [];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Game code data is read from JSON at build time by server components.
  outputFileTracingIncludes: { "/**": ["./data/games/*.json"] },
  async headers() {
    return robotsHeaders;
  },
};

export default nextConfig;
