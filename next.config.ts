import type { NextConfig } from "next";

/** Read at build time on Vercel — see src/lib/api-base.ts */
const apiProxy =
  process.env.API_PROXY_URL ||
  process.env.INTERNAL_API_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost/evva"
    : "https://pashanur.alwaysdata.net");

const nextConfig: NextConfig = {
  // Hide Next.js DevTools portal badge in local UI (nextjs-portal element).
  devIndicators: false,
  logging: {
    browserToTerminal: false,
  },
  async rewrites() {
    return [
      {
        source: "/legacy-ui/:path*",
        destination: `${apiProxy}/legacy-ui/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${apiProxy}/uploads/:path*`,
      },
      {
        source: "/legacy-assets/:path*",
        destination: `${apiProxy}/assets/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "evva.az" },
      { protocol: "https", hostname: "pashanur.alwaysdata.net" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
    unoptimized: true,
  },
};

export default nextConfig;
