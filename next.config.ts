import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Autorise ton iPhone à charger les fichiers Next.js en dev
  allowedDevOrigins: ["192.168.1.201"],
};

export default nextConfig;
