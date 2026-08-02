import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  // Allow cross-origin requests from Vercel preview domains
  allowedDevOrigins: ["https://preview-chat-58c2b121-c276-44a7-9ce2-71290cfe6749.space-z.ai"],
};

export default nextConfig;
