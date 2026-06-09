import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000"] },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "dl.airtable.com" },
      { protocol: "https", hostname: "v5.airtableusercontent.com" },
    ],
  },
};

export default nextConfig;
