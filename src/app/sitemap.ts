import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

const DEFAULT_PRIORITY = 0.5;
const DEFAULT_CHANGE_FREQUENCY = "weekly" as const;


export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/variant-a", "/variant-b"].map((path) => ({
    url: absoluteUrl(path),
    lastModified: new Date(),
    changeFrequency: DEFAULT_CHANGE_FREQUENCY,
    priority: path === "/" ? 1 : DEFAULT_PRIORITY,
  }));
}
