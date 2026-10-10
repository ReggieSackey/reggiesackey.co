import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow LAN devices (e.g. an iPhone on the same Wi-Fi hitting
  // http://192.168.x.x:3000) to load dev-server assets. Without this,
  // Next 16 blocks the client bundle cross-origin and the page never
  // hydrates outside localhost. Hostname only — no scheme/port; each
  // `*` stands for exactly one dot-separated label.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "*.local"],
};

export default nextConfig;
