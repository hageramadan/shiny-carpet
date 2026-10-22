import type { MetadataRoute } from "next";
import { products, siteUrl } from "@/lib/data";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/products`, changeFrequency: "weekly", priority: 0.9 },
    ...products.map((p) => ({
      url: `${siteUrl}/products/${p.id}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
