# site-starter

Mega's shared Next.js starter for customer landing pages and websites,
deployed to Vercel. Used as a **GitHub template repo** by both coding bots and
human developers: click "Use this template", fill in one config file, build
pages, ship.

## The 3 layers

1. **Plumbing (hard-coded, do not edit)** — SEO metadata, JSON-LD schema,
   robots/sitemap/llms.txt/manifest, consent-gated analytics loaders, the
   PostHog reverse proxy, cookie banner, lead form wiring, a11y baseline.
2. **`src/site.config.ts` (edit this)** — ALL customer-specific business data
   lives in this one typed file. Values start as `TODO_` sentinels; the build
   fails until every sentinel is replaced.
3. **Env vars (set later, in Vercel)** — tracking IDs (GA4, GTM, PostHog,
   GSC) are minted by the provisioning bot after the site exists. The
   site builds and runs fine with none of them set; each loader renders
   nothing until its var exists. The Mega optimizer snippet is NOT an env
   var — it is hard-coded plumbing that loads on every site.

## Building a new site — step by step

1. Create a repo from this template and clone it.
2. Fill in **every** field in `src/site.config.ts` (no `TODO_` left).
3. Replace the placeholder assets in `public/`: `logo.png`,
   `og-image.png` (1200x630), `icon-192.png`, `icon-512.png`, and
   `src/app/favicon.ico`. The shipped files are solid-gray placeholders.
4. Replace the demo content in `src/app/page.tsx` and build the site's pages.
   - Register every new page in `src/lib/routes.ts` (drives sitemap.xml,
     llms.txt, and the 404 page).
   - Use `buildMetadata({ title, description, path })` for every page's
     `export const metadata`.
   - Use the schema builders (`buildBusinessSchema`, `buildFaqSchema`,
     `buildBreadcrumbSchema`, `buildArticleSchema`) with `<JsonLd />` where
     appropriate.
   - Use `<LeadForm />` for lead capture — it submits to the Mega
     submission API (`analytics.gomega.ai/submission/submit`) with full
     attribution, fires analytics events, and redirects to `/thank-you`.
     It reads `megaCustomerId` / `megaSiteId` / `sourceProvider` /
     `budgetQualifier` from `src/site.config.ts`. The Mega optimizer needs
     `megaSiteKey` (sk_… from MEGA Admin Conversions tab) — set it in
     `src/site.config.ts` or the optimizer cannot function. NEVER submit leads any
     other way (no direct database access from frontend code).
     - `sourceProvider` uses the `website-<slug>` convention — the
       `website-` prefix distinguishes website leads from ad/LP leads in
       Keystone.
     - Set `budgetQualifier: null` to hide the yes/no budget toggles for
       sites where the qualifying question doesn't fit.
5. Replace the `TODO_POLICY_CONTENT` sections in the legal pages
   (`/privacy-policy`, `/terms`, `/cookie-policy`).
6. Run `npm run check-config` — fix anything it reports.
7. `npm run build` (runs check-config automatically) and deploy to Vercel.

## Do not edit (plumbing)

Bots and humans: leave these alone unless you are changing the template
itself.

- `src/lib/` — seo, routes types, consent store, tracking, posthog client
- `src/hooks/useMegaLeadForm.ts` — Mega lead submission + attribution hook
- `src/components/analytics/` — GA4 / GTM / Mega / PostHog loaders
- `src/components/consent/` — cookie banner + `useConsent()`
- `src/components/schema/` — JSON-LD renderer + builders
- `src/app/robots.ts`, `src/app/sitemap.ts`, `src/app/manifest.ts`,
  `src/app/llms.txt/route.ts`
- `next.config.ts` (PostHog `/ingest` reverse proxy)
- `scripts/check-config.mjs`

What you DO edit: `src/site.config.ts`, `src/lib/routes.ts` (append pages),
everything under `src/app/*/page.tsx`, and `public/` assets.

## Env vars

All optional; the site works with none of them. Set in **Vercel project env**
(Production + Preview), never committed.

| Var | Who sets it | Where | Required when |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_GA4_ID` | provisioning bot | Vercel env | GA4 tracking is provisioned |
| `NEXT_PUBLIC_GTM_ID` | provisioning bot | Vercel env | GTM container is provisioned |
| `NEXT_PUBLIC_POSTHOG_KEY` | provisioning bot | Vercel env | PostHog project is provisioned |
| `NEXT_PUBLIC_POSTHOG_HOST` | provisioning bot | Vercel env | Only for non-US PostHog (defaults to US cloud) |
| `NEXT_PUBLIC_GSC_VERIFICATION` | provisioning bot | Vercel env | Search Console verification is requested |
| `ALLOW_TODO` | builder | build command / CI only | Preview builds while config is unfinished |

GA4, GTM, and PostHog loaders are **consent-gated**: nothing loads until the
visitor accepts the cookie banner, even with the env vars set. PostHog
additionally lazy-initializes (first interaction or 3s idle) through the
same-origin `/ingest` proxy, with session recording off by default.

The **Mega optimizer snippet** (`cdn.gomega.ai/scripts/optimizer.min.js`) is
the exception: it is hard-coded in
`src/components/analytics/MegaSnippet.tsx` and **intentionally not
consent-gated** — it is the business-critical lead-capture/optimizer script
(decision made by Peter's assistant; flagged for review).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run check-config` | Fails if `TODO_` sentinels / empty fields remain in `site.config.ts` |
| `npm run build` | check-config, then production build (`ALLOW_TODO=1` downgrades to a warning) |
| `npm run lint` | ESLint |

## Conventions

- TypeScript strict, no `any`, explicit return types on exported functions.
- One component per file; files under 500 lines.
- Database/API calls never live in components.
- Comments explain non-obvious "why", not "what".
