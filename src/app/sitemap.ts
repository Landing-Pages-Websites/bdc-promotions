import type { MetadataRoute } from "next";
import { siteRoutes } from "@/lib/routes";
import { absoluteUrl } from "@/lib/seo";

const DEFAULT_PRIORITY = 0.5;
const DEFAULT_CHANGE_FREQUENCY = "weekly";

export default function sitemap(): MetadataRoute.Sitemap {
  return siteRoutes.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: new Date(),
    changeFrequency: DEFAULT_CHANGE_FREQUENCY,
    priority: route.priority ?? DEFAULT_PRIORITY,
  }));
}
