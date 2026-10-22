import type { NextConfig } from "next";
const config: NextConfig = {
  images: {
    qualities: [75, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "admin.shinycarpet-sa.com",
        port: "",
        pathname: "/storage/products/**",
        search: "",
      },
      {
        protocol: "https",
        hostname: "admin.shinycarpet-sa.com",
        port: "",
        pathname: "/storage/categories/**",
        search: "",
      },
    ],
  },
  turbopack: {
    root: process.cwd(),
    rules: { "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" } },
  },
};
export default config;
