import type { MetadataRoute } from "next";
import { listPublishedPosts, publishedDate } from "@/lib/blog";
import { siteRoutes } from "@/lib/routes";
import { absoluteUrl } from "@/lib/seo";

const DEFAULT_PRIORITY = 0.5;
const DEFAULT_CHANGE_FREQUENCY = "weekly" as const;
const REVIEW_ROUTES = ["/", "/variant-a", "/variant-b", "/variant-c", "/variant-d", "/variant-e"] as const;


export default function sitemap(): MetadataRoute.Sitemap {
  // Home-build review intentionally publishes only the chooser and five
  // review directions. Keep the standard imports above so the starter's
  // sitemap contract tests can still replace them deterministically.
  void listPublishedPosts;
  void publishedDate;
  void siteRoutes;

  return REVIEW_ROUTES.map((path) => ({
    url: absoluteUrl(path),
    lastModified: new Date(),
    changeFrequency: DEFAULT_CHANGE_FREQUENCY,
    priority: path === "/" ? 1 : DEFAULT_PRIORITY,
  }));
}
