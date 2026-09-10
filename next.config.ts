import type { NextConfig } from "next";
import { megaArticleImageRemotePatterns } from "./src/lib/blog-images";
import { redirectMap } from "./src/lib/redirects";

const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
// e.g. https://us.i.posthog.com -> https://us-assets.i.posthog.com
const POSTHOG_ASSETS_HOST = POSTHOG_HOST.replace(
  ".i.posthog.com",
  "-assets.i.posthog.com",
);

const nextConfig: NextConfig = {
  // Pin the workspace root: stray lockfiles in parent directories otherwise
  // make Next.js guess wrong.
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: megaArticleImageRemotePatterns,
  },
  async redirects() {
    // 301-equivalent redirects for migrations. Builders fill the map in
    // src/lib/redirects.ts; Next serves permanent redirects as 308
    // (SEO-equivalent to 301 — go-live QA accepts either).
    const migrationRedirects = redirectMap.map(({ source, destination }) => ({
      source,
      destination,
      permanent: true,
    }));
    // The paid landing Vercel project serves info.bdcpromotions.com, whose
    // validated LP lives at /lp. Send only that host's root to the LP so the
    // custom-domain root opens the landing page; the primary domain
    // (bdcpromotions.com) root is untouched and keeps serving the homepage.
    // Temporary (307) — this is corrective host routing, not a permanent move.
    return [
      {
        source: "/",
        has: [{ type: "host", value: "info.bdcpromotions.com" }],
        destination: "/lp",
        permanent: false,
      },
      ...migrationRedirects,
    ];
  },
  async rewrites() {
    // Same-origin reverse proxy for PostHog (PostHog's documented Next.js
    // pattern) so analytics requests are not blocked by ad blockers.
    return [
      {
        source: "/ingest/static/:path*",
        destination: `${POSTHOG_ASSETS_HOST}/static/:path*`,
      },
      {
        source: "/ingest/:path*",
        destination: `${POSTHOG_HOST}/:path*`,
      },
    ];
  },
  // Required for the PostHog proxy: its API calls can use trailing slashes,
  // which Next would otherwise redirect (dropping the POST body).
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
