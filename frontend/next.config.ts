import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowLocalIP: true,

    remotePatterns: [
      // Local Django development
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

      // Supabase Storage - production
      {
        protocol: "https",
        hostname: "hcpogsaulctxkkhnadpi.supabase.co",
        pathname: "/storage/v1/object/public/media/**",
      },
    ],
  },
};

export default nextConfig;