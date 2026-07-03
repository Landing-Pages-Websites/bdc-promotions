import type { MetadataRoute } from "next";
import { siteRoutes } from "@/lib/routes";
import { absoluteUrl } from "@/lib/seo";

const DEFAULT_PRIORITY = 0.5;

export default function sitemap(): MetadataRoute.Sitemap {
  return siteRoutes.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: new Date(),
    priority: route.priority ?? DEFAULT_PRIORITY,
  }));
}
