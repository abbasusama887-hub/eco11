import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allows next/image to fetch and optimize images from the local Django
    // dev server (127.0.0.1 / localhost). Next.js blocks local IPs by
    // default as an SSRF protection. Safe here because this only matters
    // in local development — production will point at a real domain.
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/media/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/media/**",
      },
    ],
  },
};

export default nextConfig;