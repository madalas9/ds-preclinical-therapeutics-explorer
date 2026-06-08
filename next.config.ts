import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.86.162",
    "192.168.0.0/16",
    "10.0.0.0/8",
    "localhost",
  ],
};

export default nextConfig;
