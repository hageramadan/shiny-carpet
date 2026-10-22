import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/data";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/profile",
        "/addresses",
        "/cart",
        "/checkout",
        "/orders",
        "/tracking",
        "/order-confirmation",
        "/login",
        "/register",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
