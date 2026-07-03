import type { NextConfig } from "next";

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
