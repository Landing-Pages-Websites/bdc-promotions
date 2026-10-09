// Run from the repository root: node --import tsx scripts/bdc-review-routes.mjs
// JSON goes only to stdout; redirect it to the controller's external run folder.
import { siteRoutes } from "../src/lib/routes.ts";
import { listPublishedPosts } from "../src/lib/blog.ts";

export function reviewRoutes() {
  return [
    ...siteRoutes.map(({ path }) => path),
    ...listPublishedPosts().map(({ slug }) => `/blog/${slug}`),
  ];
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], "file:").href) {
  process.stdout.write(`${JSON.stringify({ review_routes: reviewRoutes() }, null, 2)}\n`);
}
