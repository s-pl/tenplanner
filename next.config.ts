import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['10.131.105.5'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pitsasnwfilyyipkhhim.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
