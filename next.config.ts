import type { NextConfig } from "next";

const devOrigins = process.env.NEXT_DEV_ALLOWED_ORIGINS?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  ...(devOrigins && devOrigins.length > 0
    ? { allowedDevOrigins: devOrigins }
    : {}),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pitsasnwfilyyipkhhim.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
