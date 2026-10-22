import type { NextConfig } from "next";
const config: NextConfig = {
  images: { qualities: [75, 100] },
  turbopack: {
    root: process.cwd(),
    rules: { "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" } },
  },
};
export default config;
