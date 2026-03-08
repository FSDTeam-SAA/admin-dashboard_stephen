import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BASE_URL:
      process.env.NEXT_PUBLIC_BASE_URL ??
      process.env.NEXTPUBLICBASEURL ??
      "http://localhost:5000/api/v1",
  },
};

export default nextConfig;
