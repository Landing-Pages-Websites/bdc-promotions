import type { MetadataRoute } from "next";
import { listPublishedPosts } from "@/lib/blog";
import { siteRoutes } from "@/lib/routes";
import { absoluteUrl } from "@/lib/seo";

const DEFAULT_PRIORITY = 0.5;
const DEFAULT_CHANGE_FREQUENCY = "weekly" as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = siteRoutes.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: new Date(),
    changeFrequency: DEFAULT_CHANGE_FREQUENCY,
    priority: route.priority ?? DEFAULT_PRIORITY,
  }));
  const posts = listPublishedPosts().map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  return [...pages, ...posts];
}
