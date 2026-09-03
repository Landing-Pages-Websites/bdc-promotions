# BDC Promotions Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish a polished, phone-first, one-page BDC Promotions website that preserves the live site's copy and section flow.

**Architecture:** Extend the starter's managed-site JSON contract so all page copy remains editable and annotated, expose the content through the existing managed adapter, and compose focused server components for each section. Keep interaction CSS-first and use a single optimized automotive hero image plus a code-rendered brand mark.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, managed-site-contract, Node test runner, Vercel.

**Spec:** `docs/superpowers/specs/2026-09-03-bdc-promotions-design.md`

## Global Constraints

- Preserve the current site's substantive copy, business name, phone number `352-207-1074`, section order, and phone-first conversion path.
- Keep the public experience to one marketing page; the starter's required legal, blog, consent, SEO, analytics, and routing surfaces remain available.
- Use the "night-drive automotive" visual direction: deep navy, near-black, electric blue, crisp white typography, and restrained motion.
- Add only relevant automotive imagery and do not turn the page into a generic stock-photo collage.
- Do not connect or change `bdcpromotions.com`; publish to a new Vercel production URL in the `mega-websites` team.
- Keep one component per file, explicit exported return types, no `any`, no debug artifacts, and reduced-motion support.

---

### Task 1: Complete the managed content and operational configuration

**Files:**
- Create: `src/content/managed-site.test.ts`
- Modify: `src/content/pages/home.json`
- Modify: `src/content/site.json`
- Modify: `src/content/managed-site.contract.json`
- Modify: `src/content/managed-site.ts`
- Modify: `src/site.config.ts`
- Modify: `src/app/privacy-policy/page.tsx`
- Modify: `src/app/terms/page.tsx`
- Modify: `src/app/cookie-policy/page.tsx`
- Modify: `content/blog/welcome.md`

**Interfaces:**
- Produces: `managedHome.values`, `managedHome.services`, `managedHome.focus`, `managedHome.process`, `managedHome.insights`, and expanded `managedHome.contact` content objects.
- Produces: site identity and SEO values for BDC Promotions with canonical origin `https://bdcpromotions.com`.
- Consumes: stable managed-site field and collection IDs from `managed-site.contract.json`.

- [ ] **Step 1: Write the failing managed-content test**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { managedHome } from "./managed-site";

test("exposes every BDC Promotions home section in reference order", () => {
  assert.equal(managedHome.seo.identity.telephone, "352-207-1074");
  assert.equal(managedHome.values.items.length, 4);
  assert.equal(managedHome.services.items.length, 3);
  assert.equal(managedHome.focus.items.length, 4);
  assert.equal(managedHome.process.items.length, 4);
  assert.equal(managedHome.insights.items.length, 3);
  assert.match(managedHome.contact.heading.value, /appointments/i);
});
```

- [ ] **Step 2: Verify the test and configuration gate fail for the intended reasons**

Run: `npm test -- --test-name-pattern="exposes every BDC Promotions"`

Expected: FAIL because the new managed sections do not exist.

Run: `npm run check-config`

Expected: FAIL because starter `TODO_` values and placeholder assets are still present.

- [ ] **Step 3: Define the content schema and adapter**

Add the approved hero, value points, services, dealership benefits, process steps, insights, and contact copy to `home.json`. Extend `managed-site.contract.json` with a page section per content block and collection descriptors for repeated cards. Refactor the adapter around reusable helpers with these concrete shapes:

```ts
interface ManagedCard {
  itemId: StableId<"item">;
  title: { fieldId: StableId<"field">; value: string };
  description: { fieldId: StableId<"field">; value: string };
}

interface ManagedSection<Item> {
  heading: { fieldId: StableId<"field">; value: string };
  items: readonly Item[];
}
```

Every rendered value must come from `managedSite.readValue`; collection order must come from each section's managed `order` field.

- [ ] **Step 4: Complete site configuration and legal copy**

Set the business identity to BDC Promotions, phone `352-207-1074`, canonical domain `bdcpromotions.com`, schema type `Organization`, source provider `website-bdc-promotions`, and `budgetQualifier: null`. Use plain-language legal pages appropriate to a phone-first marketing site and re-mint the starter blog post ID. Until provisioning supplies real values, set `megaCustomerId`, `megaSiteId`, and `megaSiteKey` to the literal `unprovisioned`; the page does not expose a lead form.

- [ ] **Step 5: Run the focused test**

Run: `npm test -- --test-name-pattern="exposes every BDC Promotions"`

Expected: PASS.

- [ ] **Step 6: Commit the content foundation**

```bash
git add src/content/managed-site.test.ts src/content/pages/home.json src/content/site.json src/content/managed-site.contract.json src/content/managed-site.ts src/site.config.ts src/app/privacy-policy/page.tsx src/app/terms/page.tsx src/app/cookie-policy/page.tsx content/blog/welcome.md
git commit -m "feat: add BDC Promotions managed content"
```

### Task 2: Build the one-page visual experience

**Files:**
- Create: `src/components/home/SiteHeader.tsx`
- Create: `src/components/home/HeroSection.tsx`
- Create: `src/components/home/ValueGrid.tsx`
- Create: `src/components/home/ServicesSection.tsx`
- Create: `src/components/home/FocusSection.tsx`
- Create: `src/components/home/ProcessSection.tsx`
- Create: `src/components/home/InsightsSection.tsx`
- Create: `src/components/home/ContactSection.tsx`
- Create: `src/components/home/SiteFooter.tsx`
- Create: `src/app/page.test.ts`
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/components/legal/LegalPageLayout.tsx`
- Modify: `src/app/manifest.ts`
- Replace: `public/logo.png`
- Replace: `public/icon-192.png`
- Replace: `public/icon-512.png`
- Replace: `public/og-image.png`
- Create: `public/images/bdc-night-showroom.webp`
- Modify: `src/content/pages/home.json` image metadata

**Interfaces:**
- Consumes: all `managedHome` section objects from Task 1 and `siteConfig.contact.phone`.
- Produces: a server-rendered `HomePage(): ReactElement` with semantic section landmarks and working `tel:` and `#contact` actions.

- [ ] **Step 1: Write the failing render test**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import HomePage from "./page";

test("renders the complete phone-first landing page", () => {
  const html = renderToStaticMarkup(createElement(HomePage));
  assert.match(html, /We Help Dealerships Generate More Appointments/);
  assert.match(html, /href="tel:3522071074"/);
  assert.match(html, /id="services"/);
  assert.match(html, /id="process"/);
  assert.match(html, /id="contact"/);
});
```

Store this test as `.ts` so the existing test glob executes it.

- [ ] **Step 2: Verify the render test fails**

Run: `npm test -- --test-name-pattern="renders the complete phone-first"`

Expected: FAIL because the composed BDC landing page does not exist.

- [ ] **Step 3: Create and inspect the single hero image**

Generate one cinematic, unbranded dealership/showroom image with no legible text or logos, blue-hour lighting, clean modern vehicles, and negative space for page composition. Inspect it before integration, crop it to WebP for the hero, and record the actual SHA-256, dimensions, MIME type, and byte count in `home.json`.

- [ ] **Step 4: Implement focused section components**

Build the page in the reference order. Each section component renders its managed annotations, semantic heading hierarchy, and responsive layout. The header and closing panel use:

```tsx
<a href="tel:3522071074" aria-label="Call BDC Promotions at 352-207-1074">
  352-207-1074
</a>
```

The secondary hero action uses `href="#contact"`. Keep decorative icons `aria-hidden="true"` and do not introduce client state.

- [ ] **Step 5: Apply the night-drive design system**

Define shared CSS variables for `--ink`, `--panel`, `--panel-raised`, `--blue`, `--cyan`, `--text`, `--muted`, and `--line`. Use a condensed display face with a clean geometric body face through `next/font`, atmospheric gradients, subtle grid lines, visible focus rings, and one restrained reveal sequence. Preserve the starter accessibility baseline and reduced-motion override.

- [ ] **Step 6: Replace brand assets and metadata**

Create a crisp BDC square mark for the header and required PNG assets, derive a 1200×630 Open Graph image from the approved visual system, and update the manifest theme colors to the finished navy palette. Do not modify the current domain or DNS.

- [ ] **Step 7: Run the render test and full test suite**

Run: `npm test -- --test-name-pattern="renders the complete phone-first"`

Expected: PASS.

Run: `npm test`

Expected: all suites PASS with no warnings introduced by the page.

- [ ] **Step 8: Commit the finished page**

```bash
git add src/components/home/SiteHeader.tsx src/components/home/HeroSection.tsx src/components/home/ValueGrid.tsx src/components/home/ServicesSection.tsx src/components/home/FocusSection.tsx src/components/home/ProcessSection.tsx src/components/home/InsightsSection.tsx src/components/home/ContactSection.tsx src/components/home/SiteFooter.tsx src/app/page.test.ts src/app/page.tsx src/app/layout.tsx src/app/globals.css src/components/legal/LegalPageLayout.tsx src/app/manifest.ts src/content/pages/home.json public/logo.png public/icon-192.png public/icon-512.png public/og-image.png public/images/bdc-night-showroom.webp
git commit -m "feat: build BDC Promotions landing page"
```

### Task 3: Verify, review, publish, and merge

**Files:**
- Review: all files changed from `origin/main...HEAD`
- Modify only if verification finds a confirmed defect.

**Interfaces:**
- Produces: a reviewed pull request and a public Vercel production URL in the `mega-websites` team.

- [ ] **Step 1: Run local quality gates**

Run: `npm run check-config`, `npm run lint`, `npm test`, and `npm run build`.

Expected: all commands exit 0.

- [ ] **Step 2: Browser-verify desktop and mobile**

Run the development server and inspect `/` at desktop and phone widths. Verify all sections render in order, no horizontal overflow occurs, the hero image remains legible, both phone links target `tel:3522071074`, the secondary action reaches `#contact`, keyboard focus is visible, and the browser console has no errors.

- [ ] **Step 3: Simplify and independently review the diff**

Run the workspace `simplify` and `code-reviewer` skills. Fix every confirmed finding, rerun the affected checks, and verify the diff contains no `TODO_`, `console.log`, `debugger`, `any`, dead import, or unrelated template change.

- [ ] **Step 4: Push and open the pull request**

```bash
git push origin peter/build-bdc-promotions
gh pr create --repo Landing-Pages-Websites/bdc-promotions --base main --head peter/build-bdc-promotions --reviewer website-pr-review-mega --title "feat: build BDC Promotions website" --body-file /tmp/bdc-promotions-pr.md
```

Verify the reviewer request landed exactly once.

- [ ] **Step 5: Deploy to Vercel and validate the public URL**

Link the project to the `mega-websites` team, deploy the reviewed build to production, inspect deployment status, and open the resulting `.vercel.app` URL. Do not add `bdcpromotions.com`.

- [ ] **Step 6: Monitor review, CI, and merge**

Use the `pr-monitoring` workflow with merge intent. Address all actionable review findings by fixing the full defect class, rerun verification, re-request exact-head review after pushes, and enable squash auto-merge when ready. Keep the monitor active until merged.
