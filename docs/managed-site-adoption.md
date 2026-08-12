# Managed-site adoption

This runbook explains how Gomega adopts the Managed Site Standard for a new
website or a website that is still being built. It does not authorize a fleet
migration, customer editing, or changes to former-customer repositories.

## Choose the correct path

### New website

Create the repository from the current `site-starter` template. Keep the
managed-site contract workspace, structured content, adapters, bridge,
annotations, tests, and repository CI intact. Build new pages by extending
those primitives rather than creating a parallel content system.

### Active build that is not live

Adopt the standard before the next customer review or go-live. Preserve the
current rendered copy, routes, SEO output, forms, analytics, and asset behavior
while changing how those values are classified and loaded. Initial adoption is
a structural migration, not a redesign.

### Live website

Do not convert it through this runbook. Live-site conversion belongs to the
Phase 3 eligibility register and rollout, with an exact inventory, preview,
production verification, and rollback plan for each active customer.

### Landing page, former customer, or uncertain repository

Do not infer eligibility from the repository name or recent Git activity. An
operator must first prove the active customer entitlement and canonical
managed-site identity. Landing pages are enrolled only when explicitly chosen;
churned and former-customer repositories are excluded.

## Adoption sequence for an active build

Keep each pull request in one risk domain and preserve a working preview after
every merge.

1. **Inventory and freeze the baseline.** Record the current default-branch
   commit, Vercel project, preview URL, routes, redirects, content sources,
   managed assets, forms, analytics, metadata, schema, sitemap, and bridge.
   Capture desktop and mobile reference output before moving values.
2. **Introduce the contract and structured sources.** Add
   `managed-site.contract.json` and structured JSON for page, site, collection,
   image, and internal SEO values. Give every declared page, section, field,
   collection, item, asset slot, and alias a stable ID. Classify all visible
   customer content; keep SEO fields internal-protected.
3. **Route rendering through the framework adapter.** Use the Next.js or Astro
   adapter to read declared values. Add stable page and field annotations while
   preserving markup, layout, styling, routes, and behavior. Never select a
   source by label, file name guess, DOM text, or visual coordinates.
4. **Prove conformance and parity.** Run the repository checks, conform every
   declared route, and compare the candidate preview with the frozen baseline.
   Fix unclassified values, broken references, metadata differences, layout
   drift, missing assets, or bridge failures before continuing.
5. **Enroll the exact repository and site.** Operations links the immutable
   repository, provider project, production origin, contract revision, and
   content revision to the canonical managed-site registry. Repository names,
   slugs, and URLs are display facts, not authority.
6. **Enable organization governance.** Operations assigns the managed-site
   repository property and reconciles the dedicated Site Guard App and
   organization ruleset. Do not substitute a repository-owned workflow, a PAT,
   or a human bypass for the central required check.
7. **Certify only after exact evidence is green.** `CMS_READY` requires the
   immutable contract/content revision, production commit and deployment,
   bridge, routes, provider identity, and Site Guard policy to agree. Adoption
   alone does not expose a customer editor or publishing authority.

## Pull request boundaries

A normal active-build adoption should use concise, reviewable pull requests:

1. structured content and contract classification;
2. adapter, rendering, and annotation migration;
3. repository verification and operational enrollment.

Split further by page family when a repository is large. Do not combine the
structural migration with a redesign, copy refresh, SEO strategy change,
framework upgrade, analytics rewrite, or production cutover.

## Two independent protection layers

Repository CI and Site Guard solve different problems.

- **Repository CI is per repository.** The template's
  `.github/workflows/site-starter-ci.yml` runs on that repository's pull
  requests and `main`. It gives developers fast feedback for tests, contract
  conformance, lint, and builds. Repositories created from a template do not
  receive later template changes automatically.
- **Site Guard is organization-governed.** Once a repository is enrolled, the
  organization ruleset requires the check produced by the dedicated Site Guard
  App. The central service resolves the certified production baseline and
  evaluates the exact candidate commit. Editing or deleting repository-local
  scripts cannot make that central check pass.

The managed-site npm package contains the executable schema, validators,
normalizers, adapters, and policy facts shared by the starter and central
control plane. It is not the website structure by itself and it is not the CMS.
Do not fork or hand-edit that library inside a customer repository to weaken a
rule; update it centrally through its reviewed release process.

## Required verification

Before operational enrollment, the active-build pull request must prove:

- every public route is declared and renders from classified sources;
- no customer-facing copy or image is silently hard-coded;
- internal SEO fields remain protected from customer authority;
- content, collections, links, and assets pass contract semantics;
- the review/edit bridge version, integrity, framing, and annotations match;
- metadata, canonical URLs, robots, sitemap, redirects, JSON-LD, internal
  links, lead forms, analytics, and responsive output remain correct;
- an allowed content change passes the policy;
- an undeclared path change fails;
- an additive compatible code change passes; and
- a breaking contract or code change fails without an explicit migration.

## Stop conditions

Stop and create an internal task instead of widening the contract when:

- source ownership is ambiguous;
- a value is computed from multiple uncontrolled sources;
- adopting the adapter changes layout or runtime behavior;
- the repository or provider identity cannot be proven by immutable IDs;
- the site is live, former, churned, or lacks confirmed entitlement;
- required checks, bridge validation, or exact preview delivery are unavailable;
  or
- the migration would require direct production edits.

Phase 1 establishes this structure and its guardrails. Customer editing and
self-publishing remain disabled until the governed Phase 2 workflow is ready.
