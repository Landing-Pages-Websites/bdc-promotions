import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

import { resolveRenderTree } from "../src/reachability.js";
import type { FindingCode } from "../src/report.js";
import { ModuleCache } from "../src/scan.js";
import { findingsOf, run, sourceDocumentOf, workspace } from "./support/proposals.js";

/**
 * A field may only be proposed for a component the rendered route or layout tree
 * actually reaches. Where the tree cannot be followed the subtree is withheld
 * AND named, because a silent drop and a silent inclusion are the same failure
 * wearing different clothes.
 */

const ENTRY = "app/page.tsx";

interface Outcome {
  readonly reached: readonly string[];
  readonly codes: readonly FindingCode[];
}

function renderTreeOf(files: Readonly<Record<string, string>>): Outcome {
  const root = mkdtempSync(join(tmpdir(), "managed-site-reachability-"));
  for (const [path, source] of Object.entries(files)) {
    const file = join(root, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, source, "utf8");
  }
  const tree = resolveRenderTree([join(root, ENTRY)], root, new ModuleCache());
  return {
    reached: tree.components.map((declaration) => declaration.name).sort(),
    codes: tree.findings.map((finding) => finding.code),
  };
}

interface ReachabilityCase {
  readonly name: string;
  readonly files: Readonly<Record<string, string>>;
  readonly reached: readonly string[];
  readonly codes: readonly FindingCode[];
}

/** Each case names one shape of render reference and the ONE answer it must get. */
const REACHABILITY_CASES: readonly ReachabilityCase[] = [
  {
    name: "an export sitting beside the page renders nothing",
    files: {
      [ENTRY]: `export default function Page() { return <main><h1>Real</h1></main>; }
        export function UnusedPromo() { return <section id="p"><h2>Never</h2></section>; }`,
    },
    reached: ["Page"],
    codes: [],
  },
  {
    name: "a component is reached through another component",
    files: {
      [ENTRY]: `import { A } from "@/components/A";
        export default function Page() { return <main><A /></main>; }`,
      "components/A.tsx": `import { B } from "./B";
        export function A() { return <section id="a"><B /></section>; }`,
      "components/B.tsx": `export function B() { return <section id="b"><p>Deep</p></section>; }`,
    },
    reached: ["A", "B", "Page"],
    codes: [],
  },
  {
    name: "a nested component that is rendered is a target in its own right",
    files: {
      [ENTRY]: `export default function Page() {
          const Badge = () => <span id="badge">New</span>;
          return <main><Badge /></main>;
        }`,
    },
    reached: ["Badge", "Page"],
    codes: [],
  },
  {
    name: "a nested arrow nothing renders is left out",
    files: {
      [ENTRY]: `export default function Page() {
          const UnusedPromo = () => <section id="promo"><h2>Never shown</h2></section>;
          return <main><h1>Live</h1></main>;
        }`,
    },
    reached: ["Page"],
    codes: [],
  },
  {
    name: "a nested function declaration nothing renders is left out",
    files: {
      [ENTRY]: `export default function Page() {
          function UnusedPromo() { return <section id="promo"><h2>Never shown</h2></section>; }
          return <main><h1>Live</h1></main>;
        }`,
    },
    reached: ["Page"],
    codes: [],
  },
  {
    name: "a lowercase nested helper returning JSX is not a render target",
    files: {
      [ENTRY]: `export default function Page() {
          const promoMarkup = () => <section id="promo"><h2>Never shown</h2></section>;
          return <main><h1>Live</h1></main>;
        }`,
    },
    reached: ["Page"],
    codes: [],
  },
  {
    name: "a nested declaration inside a nested declaration is left out",
    files: {
      [ENTRY]: `export default function Page() {
          const UnusedPromo = () => {
            const Deeper = () => <section id="deep"><h2>Never shown</h2></section>;
            return <section id="promo"><Deeper /></section>;
          };
          return <main><h1>Live</h1></main>;
        }`,
    },
    reached: ["Page"],
    codes: [],
  },
  {
    name: "an import rendered only by an unrendered nested helper is not reached",
    files: {
      [ENTRY]: `import { Banner } from "@/components/Banner";
        export default function Page() {
          const UnusedPromo = () => <Banner />;
          return <main><h1>Live</h1></main>;
        }`,
      "components/Banner.tsx": `export function Banner() { return <section id="b"><p>Never shown</p></section>; }`,
    },
    reached: ["Page"],
    codes: [],
  },
  {
    name: "a nested component rendered conditionally is still a target",
    files: {
      [ENTRY]: `export default function Page({ show }: { show: boolean }) {
          const Badge = () => <span id="badge">New</span>;
          return <main>{show && <Badge />}</main>;
        }`,
    },
    reached: ["Badge", "Page"],
    codes: [],
  },
  {
    name: "a nested component may render its sibling in the same closure",
    files: {
      [ENTRY]: `export default function Page() {
          const Inner = () => <section id="inner"><Leaf /></section>;
          const Leaf = () => <p id="leaf">Leaf</p>;
          return <main><Inner /></main>;
        }`,
    },
    reached: ["Inner", "Leaf", "Page"],
    codes: [],
  },
  {
    name: "a nested component is out of scope for a component it is not declared in",
    files: {
      [ENTRY]: `export function Other() {
          const Badge = () => <span id="badge">New</span>;
          return <section id="other"><Badge /></section>;
        }
        export default function Page() { return <main><Badge /></main>; }`,
    },
    reached: ["Page"],
    codes: ["UNRESOLVED_RENDER_TARGET"],
  },
  {
    name: "two nested components of one name are both kept, for the gate to withhold",
    files: {
      [ENTRY]: `export default function Page() {
          const Badge = () => <span id="badge">One</span>;
          const Row = () => {
            const Badge = () => <span id="badge">Two</span>;
            return <section id="row"><Badge /></section>;
          };
          return <main><Badge /><Row /></main>;
        }`,
    },
    reached: ["Badge", "Badge", "Page", "Row"],
    codes: [],
  },
  {
    name: "a named re-export through a barrel is followed",
    files: {
      [ENTRY]: `import { Barrelled } from "@/components";
        export default function Page() { return <main><Barrelled /></main>; }`,
      "components/index.ts": `export { Barrelled } from "./Barrelled";`,
      "components/Barrelled.tsx": `export function Barrelled() { return <section id="b"><p>Via barrel</p></section>; }`,
    },
    reached: ["Barrelled", "Page"],
    codes: [],
  },
  {
    name: "a star re-export through a barrel is followed",
    files: {
      [ENTRY]: `import { Starred } from "@/components";
        export default function Page() { return <main><Starred /></main>; }`,
      "components/index.ts": `export * from "./Starred";`,
      "components/Starred.tsx": `export function Starred() { return <section id="s"><p>Via star</p></section>; }`,
    },
    reached: ["Page", "Starred"],
    codes: [],
  },
  {
    name: "a renamed import still names the declaration it renders",
    files: {
      [ENTRY]: `import { Panel as Renamed } from "@/components/Panel";
        export default function Page() { return <main><Renamed /></main>; }`,
      "components/Panel.tsx": `export function Panel() { return <section id="p"><p>Renamed</p></section>; }`,
    },
    reached: ["Page", "Panel"],
    codes: [],
  },
  {
    name: "a default export re-exported by name is followed",
    files: {
      [ENTRY]: `import Hero from "@/components/Hero";
        export default function Page() { return <main><Hero /></main>; }`,
      "components/Hero.tsx": `function Hero() { return <section id="h"><h1>Hero</h1></section>; }
        export default Hero;`,
    },
    reached: ["Hero", "Page"],
    codes: [],
  },
  {
    name: "a member of a namespace import of our own code is followed",
    files: {
      [ENTRY]: `import * as Panels from "@/components/panels";
        export default function Page() { return <main><Panels.Check /></main>; }`,
      "components/panels.tsx": `export function Check() { return <section id="c"><p>Checked</p></section>; }`,
    },
    reached: ["Check", "Page"],
    codes: [],
  },
  {
    name: "a component from a package is resolved, not refused",
    files: {
      [ENTRY]: `import { Suspense } from "react";
        export default function Page() { return <main><Suspense><h1>Real</h1></Suspense></main>; }`,
    },
    reached: ["Page"],
    codes: [],
  },
  {
    name: "a conditional branch still renders what it holds",
    files: {
      [ENTRY]: `import { Banner } from "@/components/Banner";
        export default function Page({ show }: { show: boolean }) {
          return <main>{show ? <Banner /> : null}</main>;
        }`,
      "components/Banner.tsx": `export function Banner() { return <section id="b"><p>Sometimes</p></section>; }`,
    },
    reached: ["Banner", "Page"],
    codes: [],
  },
  {
    name: "a component chosen at runtime is reported, never guessed",
    files: {
      [ENTRY]: `import { A } from "@/components/A";
        const VARIANTS = { a: A };
        export default function Page({ pick }: { pick: "a" }) {
          const Chosen = VARIANTS[pick];
          return <main><Chosen /></main>;
        }`,
      "components/A.tsx": `export function A() { return <section id="a"><p>A</p></section>; }`,
    },
    reached: ["Page"],
    codes: ["UNRESOLVED_RENDER_TARGET"],
  },
  {
    name: "a component arriving as a prop is reported",
    files: {
      [ENTRY]: `export default function Page({ Icon }: { Icon: () => JSX.Element }) {
          return <main><Icon /></main>;
        }`,
    },
    reached: ["Page"],
    codes: ["UNRESOLVED_RENDER_TARGET"],
  },
  {
    name: "a member of a namespace holding local values is reported",
    files: {
      [ENTRY]: `const Registry = { Card: () => <p>Card</p> };
        export default function Page() { return <main><Registry.Card /></main>; }`,
    },
    reached: ["Page"],
    codes: ["UNRESOLVED_RENDER_TARGET"],
  },
  {
    name: "an import that does not resolve is reported against its own module",
    files: {
      [ENTRY]: `import { Gone } from "./gone";
        export default function Page() { return <main><Gone /></main>; }`,
    },
    reached: ["Page"],
    codes: ["UNRESOLVED_COMPONENT"],
  },
  {
    name: "an unnamed default export cannot be anchored, so it is reported",
    files: {
      [ENTRY]: `export default function () { return <main><h1>Anonymous</h1></main>; }`,
    },
    reached: [],
    codes: ["UNRESOLVED_RENDER_TARGET"],
  },
  {
    name: "components that render each other terminate",
    files: {
      [ENTRY]: `import { A } from "@/components/A";
        export default function Page() { return <main><A /></main>; }`,
      "components/A.tsx": `import { B } from "./B";
        export function A() { return <section id="a"><B /></section>; }`,
      "components/B.tsx": `import { A } from "./A";
        export function B() { return <section id="b"><A /></section>; }`,
    },
    reached: ["A", "B", "Page"],
    codes: [],
  },
];

test("the render tree is followed where it can be, and named where it cannot", () => {
  for (const entry of REACHABILITY_CASES) {
    const outcome = renderTreeOf(entry.files);
    assert.deepEqual(outcome.reached, entry.reached, `wrong components for: ${entry.name}`);
    assert.deepEqual(outcome.codes, entry.codes, `wrong findings for: ${entry.name}`);
  }
});

test("only what a route renders becomes an editable field", () => {
  const proposal = run(workspace("reachability", null));

  // Home renders Feature, which renders Detail; Barrelled arrives through a barrel.
  // Detail's nested Badge is rendered, so it is proposed once, under its own name.
  assert.deepEqual(sourceDocumentOf(proposal, "src/content/pages/home.json"), {
    feature: { feature: { h2: { text: "Rendered feature" } } },
    detail: { detail: { p: { text: "Reached through Feature." } } },
    badge: { span: { badge: { text: "New" } } },
    barrelled: { barrelled: { p: { text: "Reached through a barrel file." } } },
  });

  // The layout wraps every route, so what it renders is site-scoped.
  assert.deepEqual(sourceDocumentOf(proposal, "src/content/site.json"), {
    siteFooter: {
      footer: {
        h2: { text: "Footer heading" },
        p: { text: "Rendered only by the layout." },
      },
    },
  });
});

/**
 * Every shape of declaration nothing renders: exported beside a page, exported
 * beside a component, nested in a page, nested in a layout, and a lowercase
 * helper. None may reach the customer, and none is a decision for a human.
 */
const UNRENDERED_MARKERS: readonly string[] = [
  "Never rendered",
  "Never shown from the page",
  "Never shown from the layout",
  "Never shown from a helper",
];

test("what nothing renders is left out, and is not a decision for a human", () => {
  const proposal = run(workspace("reachability", null));
  const documents = JSON.stringify([...proposal.sourceDocuments.values()]);
  for (const marker of UNRENDERED_MARKERS) {
    assert.ok(!documents.includes(marker), `'${marker}' was proposed as customer content`);
    for (const finding of proposal.report.findings) {
      assert.ok(!finding.evidence.includes(marker), `'${marker}' was reported: ${finding.code}`);
    }
  }
});

test("a route whose tree cannot be followed proposes nothing and says so", () => {
  const proposal = run(workspace("reachability", null));
  const located = (code: FindingCode): readonly string[] =>
    findingsOf(proposal, code).map((finding) => finding.location?.file ?? "");

  assert.ok(
    located("UNRESOLVED_RENDER_TARGET").some((file) => file.endsWith("dynamic/page.tsx")),
  );
  assert.ok(
    located("UNRESOLVED_RENDER_TARGET").some((file) => file.endsWith("anonymous/page.tsx")),
  );
  // The import is reported against the module that writes it, not the entry route.
  assert.ok(located("UNRESOLVED_COMPONENT").some((file) => file.endsWith("missing/page.tsx")));

  for (const slug of ["dynamic", "missing", "anonymous"]) {
    assert.equal(
      proposal.sourceDocuments.get(`src/content/pages/${slug}.json`),
      undefined,
      `${slug} proposed a value from a tree it could not follow`,
    );
  }
});

test("a component rendered only by the layout is proposed once, for every route", () => {
  const proposal = run(workspace("reachability", null));
  const scope = findingsOf(proposal, "SCOPE_NOT_OBSERVABLE");
  assert.equal(scope.length, 2, "one per value the layout renders on every route");
  for (const finding of scope) {
    assert.ok(finding.location?.file.endsWith("components/SiteFooter.tsx"));
  }
});

const SEO_CONFIG = {
  contentRoot: "src/content",
  assetRoot: "public",
  bridge: {
    version: "v4",
    src: "https://app.gomega.ai/review-bridge/v4/review-bridge.js",
    integrity: "sha384-TWiiCKVSJzu92YjNDVu/A8HtnwVY8JTMkRUOCZRgi59PfAXr6Ya06VSizDsbEP9L",
    crossOrigin: "anonymous",
    load: "head_defer",
  },
  businessIdentity: {
    legalName: "Fixture Ltd",
    displayName: "Fixture",
    telephone: "+15555550100",
    email: "hello@example.com",
    description: "A fixture business.",
    sameAs: [],
  },
  pages: Object.fromEntries(
    ["/", "/anonymous", "/dynamic", "/missing"].map((route) => [
      route,
      {
        purpose: "landing",
        canonical: `https://example.com${route}`,
        sitemap: { included: true, changeFrequency: "monthly", priority: 0.5 },
        performanceBudget: {
          maxLcpMilliseconds: 2500,
          maxCls: 0.1,
          maxInpMilliseconds: 200,
          maxPageBytes: 2097152,
        },
      },
    ]),
  ),
};

test("a heading the layout renders is in the outline of every route it wraps", () => {
  const proposal = run(workspace("reachability", SEO_CONFIG));
  assert.equal(proposal.validationError, null);
  const pages = proposal.contract?.internalSeo.pages ?? [];
  assert.equal(pages.length, 4);
  for (const page of pages) {
    assert.ok(
      page.headingOutline.some((entry) => entry.semanticLevel === 2),
      "the layout's heading is missing from a route it renders on",
    );
  }
});
