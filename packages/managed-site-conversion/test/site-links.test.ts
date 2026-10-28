/**
 * A same-site link becomes a customer-editable link field ONLY when the
 * contract can state its destination exactly: a declared page, plus a fragment
 * that page renders. The rendered href of that value (the page's path, then
 * `#fragment`) must be byte-for-byte the href the source wrote, on every page
 * the link renders on. Anything else stays in code and proposes no link field
 * at all, because a field whose stated destination is not the one the page
 * renders is a wrong-destination value whichever classification it carries.
 *
 * Until this, every same-site route folded into one `self` destination, and
 * emission wrote it as an internal link to the page the link SITS on, so the
 * footer's "Contact" on the home page was stored as a link to the home page.
 *
 * The corpus was written before the implementation. The positive rows are the
 * shapes All Points Media actually emits (`/work#case-studies`,
 * `/solutions/custom-networks`, `localize(item.href)`, `ctas.primary.href`);
 * the negative rows are every reading of an href that looks like a page and is
 * not one exactly.
 */
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

import { renderAnchor } from "../src/anchors.js";
import type { FieldBinding } from "../src/bindings.js";
import { propose, type Proposal } from "../src/propose.js";
import { configFor } from "./support/proposals.js";

const ROUTES = [
  "/",
  "/about",
  "/contact",
  "/work",
  "/services/seo",
  "/solutions/custom-networks",
  "/cases",
  "/early",
  "/ternary",
] as const;

interface Row {
  readonly name: string;
  /** The JSX attribute as written, e.g. `href="/about"` or `href={x}`. */
  readonly href: string;
  /** Module-level declarations the attribute reads. */
  readonly prelude?: string;
  /** Extra attributes on the anchor. */
  readonly attributes?: string;
}

interface Editable extends Row {
  readonly route: (typeof ROUTES)[number];
  readonly fragment: string | null;
  /** The href the source renders, which the stored value must render again. */
  readonly rendered: string;
}

/** Each row sits on the home page, in its own region, so anchors never collide. */
const EDITABLE: readonly Editable[] = [
  { name: "the home route", href: `href="/"`, route: "/", fragment: null, rendered: "/" },
  { name: "a top-level route", href: `href="/about"`, route: "/about", fragment: null, rendered: "/about" },
  {
    name: "a nested route (APM's NetworkBuilderTeaser)",
    href: `href="/solutions/custom-networks"`,
    route: "/solutions/custom-networks",
    fragment: null,
    rendered: "/solutions/custom-networks",
  },
  {
    name: "a route plus a fragment its page renders (APM's Proof)",
    href: `href="/work#case-studies"`,
    route: "/work",
    fragment: "case-studies",
    rendered: "/work#case-studies",
  },
  {
    name: "the home page plus a fragment its own returned JSX renders",
    href: `href="/#intro"`,
    route: "/",
    fragment: "intro",
    rendered: "/#intro",
  },
  {
    name: "a route with the attributes a real nav link carries",
    href: `href="/about"`,
    attributes: `className="nav" aria-label="About us" data-track="nav" prefetch={false} title="About"`,
    route: "/about",
    fragment: null,
    rendered: "/about",
  },
  {
    name: "a string in an expression container",
    href: `href={"/about"}`,
    route: "/about",
    fragment: null,
    rendered: "/about",
  },
  {
    name: "a template literal with no substitution",
    href: "href={`/contact`}",
    route: "/contact",
    fragment: null,
    rendered: "/contact",
  },
  {
    name: "a module constant",
    href: `href={ABOUT_HREF}`,
    prelude: `const ABOUT_HREF = "/about";`,
    route: "/about",
    fragment: null,
    rendered: "/about",
  },
  {
    name: "a declared path (APM's ctas.primary.href)",
    href: `href={ctasA.primary.href}`,
    prelude: `const ctasA = { primary: { href: "/contact", label: "Talk" } };`,
    route: "/contact",
    fragment: null,
    rendered: "/contact",
  },
  {
    name: "a declared path behind a type assertion",
    href: `href={ctasB.primary.href as string}`,
    prelude: `const ctasB = { primary: { href: "/about" } };`,
    route: "/about",
    fragment: null,
    rendered: "/about",
  },
  {
    name: "an identity arrow around a literal",
    href: `href={localizeA("/about")}`,
    prelude: `const localizeA = (href: string) => href;`,
    route: "/about",
    fragment: null,
    rendered: "/about",
  },
  {
    name: "an identity arrow around a declared path (APM's localize(ctas.primary.href))",
    href: `href={localizeB(ctasC.primary.href)}`,
    prelude: `const localizeB = (href: string) => href;\nconst ctasC = { primary: { href: "/contact" } };`,
    route: "/contact",
    fragment: null,
    rendered: "/contact",
  },
  {
    name: "an identity function declaration",
    href: `href={keepA("/services/seo")}`,
    prelude: `function keepA(href: string): string {\n  return href;\n}`,
    route: "/services/seo",
    fragment: null,
    rendered: "/services/seo",
  },
  {
    name: "an identity arrow with a block body",
    href: `href={keepB("/about")}`,
    prelude: `const keepB = (href: string) => {\n  return href;\n};`,
    route: "/about",
    fragment: null,
    rendered: "/about",
  },
  {
    name: "a route opened in a new window, with the rel the runtime renders",
    href: `href="/about"`,
    attributes: `target="_blank" rel="noopener noreferrer"`,
    route: "/about",
    fragment: null,
    rendered: "/about",
  },
];

interface Refused extends Row {
  /** Whether the converter can READ the href, and so has a decision to report. */
  readonly read: boolean;
  /** A phrase the refusal must give as its reason, where the reason matters. */
  readonly reason?: string;
}

const REFUSED: readonly Refused[] = [
  // Spelling: the page is declared, the href is not its path exactly.
  { name: "a trailing slash", href: `href="/about/"`, read: true },
  { name: "different case", href: `href="/About"`, read: true },
  { name: "a dot-relative path", href: `href="./about"`, read: true, reason: "not a path on this site" },
  { name: "a parent-relative path", href: `href="../about"`, read: true },
  { name: "a bare relative path", href: `href="about"`, read: true },
  { name: "a percent-encoded path", href: `href="/%61bout"`, read: true },
  { name: "a doubled slash inside the path", href: `href="/services//seo"`, read: true },
  { name: "leading whitespace", href: `href=" /about"`, read: true },
  { name: "trailing whitespace", href: `href="/about "`, read: true },
  { name: "a protocol-relative URL", href: `href="//example.com/about"`, read: true },
  { name: "the site's own host over http", href: `href="http://example.com/about"`, read: true },
  // What the destination cannot carry.
  { name: "a query string (APM's /contact?type=expert)", href: `href="/contact?type=expert"`, read: true, reason: "query string" },
  { name: "an empty query string", href: `href="/contact?"`, read: true, reason: "query string" },
  { name: "a query and a fragment", href: `href="/work?x=1#case-studies"`, read: true, reason: "query string" },
  { name: "a bare #", href: `href="#"`, read: true, reason: "names no page" },
  { name: "an empty href", href: `href=""`, read: true },
  { name: "an empty fragment after a route", href: `href="/work#"`, read: true },
  { name: "a fragment with a space", href: `href="/work#case studies"`, read: true },
  {
    name: "a fragment the page renders but the contract cannot spell",
    href: `href="/work#_raw"`,
    read: true,
    reason: "contract can store",
  },
  // Which page, and whether the place exists on it.
  { name: "an unknown route", href: `href="/nowhere"`, read: true },
  { name: "a detail page a template serves", href: `href="/blog/hello"`, read: true },
  { name: "the template's own spelling", href: `href="/blog/[slug]"`, read: true },
  { name: "a fragment the target page does not render", href: `href="/work#missing"`, read: true },
  { name: "a fragment only ANOTHER page renders", href: `href="/about#case-studies"`, read: true },
  { name: "a bare fragment, even one this page renders", href: `href="#intro"`, read: true, reason: "bare fragment" },
  { name: "a bare fragment this page does not render", href: `href="#missing"`, read: true },
  { name: "a fragment rendered only conditionally", href: `href="/#maybe"`, read: true },
  { name: "a fragment rendered only by a repeated item", href: `href="/#repeated"`, read: true },
  { name: "a fragment passed to a component, not rendered by a host", href: `href="/#card"`, read: true },
  { name: "a fragment inside an inert element", href: `href="/#hidden"`, read: true },
  { name: "a fragment whose id a later spread can replace", href: `href="/#spread-id"`, read: true },
  { name: "a fragment only the layout renders", href: `href="/#primary"`, read: true },
  { name: "a fragment a child component renders", href: `href="/cases#child"`, read: true },
  { name: "a fragment a conditionally rendered child renders", href: `href="/cases#conditional-child"`, read: true },
  { name: "a fragment outside the returned JSX", href: `href="/cases#mapped"`, read: true },
  { name: "a fragment in JSX a handler builds", href: `href="/cases#handler"`, read: true },
  { name: "a fragment written twice on the page", href: `href="/cases#twice"`, read: true },
  { name: "a fragment behind an early return", href: `href="/early#early-a"`, read: true },
  { name: "a fragment on the last return after an early one", href: `href="/early#early-b"`, read: true },
  { name: "a fragment inside a ternary root", href: `href="/ternary#tern"`, read: true },

  // Values the converter must not evaluate.
  {
    name: "a template literal with a substitution, which is not evaluated inline",
    href: "href={`/blog/${SLUG_A}`}",
    prelude: `const SLUG_A = "hello";`,
    read: false,
  },
  {
    name: "a template literal whose only part is a constant",
    href: "href={`${BASE_A}/about`}",
    prelude: `const BASE_A = "";`,
    read: false,
  },
  {
    name: "concatenation",
    href: `href={"/ab" + "out"}`,
    read: false,
  },
  {
    name: "a wrapper that transforms the href",
    href: `href={withLocale("/about")}`,
    prelude: `const withLocale = (href: string) => "/en" + href;`,
    read: false,
  },
  {
    name: "a wrapper that returns a different parameter",
    href: `href={secondOf("/nowhere", "/about")}`,
    prelude: `const secondOf = (first: string, second: string) => second;`,
    read: false,
  },
  {
    name: "a wrapper with a default argument",
    href: `href={defaulted()}`,
    prelude: `const defaulted = (href: string = "/about") => href;`,
    read: false,
  },
  {
    name: "an identity wrapper given two arguments",
    href: `href={localizeC("/about", "/nowhere")}`,
    prelude: `const localizeC = (href: string) => href;`,
    read: false,
  },
  {
    name: "an identity wrapper that is reassigned",
    href: `href={swapped("/about")}`,
    prelude: `let swapped = (href: string) => href;\nswapped = (href: string) => "/nowhere";`,
    read: false,
  },
  {
    name: "a wrapper with side statements",
    href: `href={logged("/about")}`,
    prelude: `const logged = (href: string) => {\n  track(href);\n  return href;\n};\nconst track = (_: string) => undefined;`,
    read: false,
  },
  {
    name: "a wrapper imported from another module",
    href: `href={importedKeep("/about")}`,
    prelude: `import { importedKeep } from "./keep";`,
    read: false,
  },
  {
    name: "a reassignable binding",
    href: `href={LET_HREF}`,
    prelude: `let LET_HREF = "/about";\nLET_HREF = "/nowhere";`,
    read: false,
  },
  {
    name: "a spread that can replace the key",
    href: `href={spreadA.href}`,
    prelude: `const overrides = { href: "/nowhere" };\nconst spreadA = { href: "/about", ...overrides };`,
    read: false,
  },
  {
    name: "an optional read",
    href: `href={maybeA?.href}`,
    prelude: `const maybeA = { href: "/about" };`,
    read: false,
  },
  {
    name: "an indexed read",
    href: `href={listA[0]}`,
    prelude: `const listA = ["/about"];`,
    read: false,
  },
  {
    name: "an async identity wrapper",
    href: `href={asyncKeep("/about")}`,
    prelude: `const asyncKeep = async (href: string) => href;`,
    read: false,
  },
  {
    name: "a spread after the href, which can replace it",
    href: `href="/about"`,
    attributes: `{...SPREAD_PROPS}`,
    prelude: `const SPREAD_PROPS = { href: "/nowhere" };`,
    read: false,
  },
  {
    name: "an identity function declaration that is reassigned",
    href: `href={keepSwapped("/about")}`,
    prelude: `function keepSwapped(href: string): string {\n  return href;\n}\n// @ts-expect-error reassigning a function\nkeepSwapped = () => "/nowhere";`,
    read: false,
  },
  {
    name: "an identity arrow declared twice",
    href: `href={twice("/about")}`,
    prelude: `const twice = (href: string) => href;\n// @ts-expect-error redeclared\nconst twice = (href: string) => "/nowhere";`,
    read: false,
  },
  {
    name: "a conditional",
    href: `href={FLAG_A ? "/about" : "/contact"}`,
    prelude: `const FLAG_A = true;`,
    read: false,
  },
];

/**
 * A duplicate key renders its LAST value. Whatever the reader decides, it must
 * never store the first one as the destination.
 */
/**
 * A link field stores `same_window` or `new_window`, which render as no target
 * and `_blank`. Every other target opens somewhere else once stored, whatever
 * kind of destination the link has.
 */
const UNSUPPORTED_TARGETS: readonly Row[] = [
  // Navigation the value cannot carry, on any kind of link.
  { name: "next/link's as", href: `href="/about"`, attributes: `as="/team"` },
  { name: "next/link's locale", href: `href="/about"`, attributes: `locale="fr"` },
  { name: "next/link's replace", href: `href="/about"`, attributes: `replace` },
  { name: "next/link's scroll={false}", href: `href="/about"`, attributes: `scroll={false}` },
  { name: "a click handler", href: `href="/about"`, attributes: `onClick={NOOP}` },
  { name: "download", href: `href="/about"`, attributes: `download` },
  { name: "rel nofollow", href: `href="/about"`, attributes: `rel="nofollow"` },
  { name: "rel noopener noreferrer without _blank", href: `href="/about"`, attributes: `rel="noopener noreferrer"` },
  { name: "_blank with rel noopener only", href: `href="/about"`, attributes: `target="_blank" rel="noopener"` },
  {
    name: "a spread before the href, which can carry as",
    href: `{...SPREAD_BEFORE} href="/about"`,
    prelude: `const SPREAD_BEFORE = { as: "/team" };`,
  },
  { name: "an external link with replace", href: `href="https://example.org/x"`, attributes: `replace` },
  { name: "an external link with rel sponsored", href: `href="https://example.org/x"`, attributes: `rel="sponsored"` },
  { name: "a phone link with a handler", href: `href="tel:+15555550100"`, attributes: `onClick={NOOP}` },
  // Targets other than the two a link field stores.
  { name: "_parent", href: `href="/about"`, attributes: `target="_parent"` },
  { name: "_top", href: `href="/about"`, attributes: `target="_top"` },
  { name: "a named frame", href: `href="/about"`, attributes: `target="preview"` },
  { name: "_self written out", href: `href="/about"`, attributes: `target="_self"` },
  { name: "_BLANK in another case", href: `href="/about"`, attributes: `target="_BLANK"` },
  { name: "a computed target", href: `href="/about"`, attributes: `target={TARGET_A}` },
  { name: "an external link with _parent", href: `href="https://example.org/x"`, attributes: `target="_parent"` },
  { name: "an email link with _top", href: `href="mailto:a@example.com"`, attributes: `target="_top"` },
];

const DUPLICATE_KEY: Row = {
  name: "a duplicate key, last one wins",
  href: `href={dupA.href}`,
  prelude: `// @ts-expect-error duplicate key\nconst dupA = { href: "/about", href: "/nowhere" };`,
};

/** A component parameter that shadows the module's constant of the same name. */
const SHADOWED_PRELUDE = `const SHADOW_HREF = "/about";
function Shadowing({ SHADOW_HREF }: { SHADOW_HREF: string }) {
  return (
    <section id="shadowed">
      <a href={SHADOW_HREF}>Shadowed</a>
    </section>
  );
}`;

function regionOf(index: number, prefix: string): string {
  return `${prefix}${index}`;
}

function rowSection(row: Row, region: string): string {
  const attributes = row.attributes === undefined ? "" : ` ${row.attributes}`;
  return `      <section id="${region}">\n        <a ${row.href}${attributes}>Label ${region}</a>\n      </section>`;
}

function preludeOf(rows: readonly Row[]): string {
  return rows.flatMap((row) => (row.prelude === undefined ? [] : [row.prelude])).join("\n");
}

/** The home page: every row, plus the ids its fragments point at. */
function homePage(): string {
  const rows: Row[] = [...EDITABLE, ...REFUSED, ...UNSUPPORTED_TARGETS, DUPLICATE_KEY];
  const imports = rows
    .flatMap((row) => (row.prelude?.startsWith("import") === true ? [row.prelude] : []))
    .join("\n");
  const prelude = preludeOf(rows.filter((row) => row.prelude?.startsWith("import") !== true));
  const sections = [
    ...EDITABLE.map((row, index) => rowSection(row, regionOf(index, "e"))),
    ...REFUSED.map((row, index) => rowSection(row, regionOf(index, "r"))),
    ...UNSUPPORTED_TARGETS.map((row, index) => rowSection(row, regionOf(index, "t"))),
    rowSection(DUPLICATE_KEY, "dup"),
  ].join("\n");
  return `import { Card } from "./card";
${imports}
${prelude}
${SHADOWED_PRELUDE}
const SHOW = Math.random() > 2;
const REPEATS = ["one"];
const NOOP = () => undefined;
const TARGET_A = "_self";
const ID_SPREAD = { id: "elsewhere" };

export default function Home() {
  return (
    <main>
      <h1>Home</h1>
      <p id="intro">Intro copy.</p>
      {SHOW && <p id="maybe">Sometimes.</p>}
      {REPEATS.map((one) => (
        <p key={one} id="repeated">{one}</p>
      ))}
      <Card id="card" />
      <noscript><p id="hidden">No script.</p></noscript>
      <p id="spread-id" {...ID_SPREAD}>Spread.</p>
      <Shadowing SHADOW_HREF="/nowhere" />
${sections}
    </main>
  );
}
`;
}

function simplePage(name: string, body: string): string {
  return `export const metadata = { title: "${name}", description: "The ${name} page." };

export default function ${name}Page() {
  return (
    <main>
      <h1>${name}</h1>
${body}
    </main>
  );
}
`;
}

/** Rendered by the root layout, so on every page: a site-scoped link. */
const HEADER = `export function Header() {
  return (
    <header>
      <nav id="primary">
        <a href="/about">About</a>
      </nav>
      <div id="to-work">
        <a href="/work#case-studies">Case studies</a>
      </div>
      <div id="own-fragment">
        <a href="#intro">Skip</a>
      </div>
    </header>
  );
}
`;

const LAYOUT = `import { Header } from "@/components/Header";

export const metadata = { title: "Site", description: "A site whose links are tested." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
`;

/** Ids that look rendered and are not provably rendered exactly once. */
const CASES_PAGE = `export const metadata = { title: "Cases", description: "The cases page." };

const SHOW_CHILD = Math.random() > 2;
const ITEMS = ["one"];

function Child() {
  return <section id="child">Child</section>;
}

function ConditionalChild() {
  return <section id="conditional-child">Sometimes</section>;
}

export default function CasesPage() {
  const list = ITEMS.map((item) => <p key={item} id="mapped">{item}</p>);
  const later = () => <div id="handler">Later</div>;
  return (
    <main>
      <h1>Cases</h1>
      <p id="twice">One</p>
      <p id="twice">Two</p>
      <Child />
      {SHOW_CHILD && <ConditionalChild />}
      {list.length > 0 && later.length === 0 ? null : null}
    </main>
  );
}
`;

const EARLY_PAGE = `export const metadata = { title: "Early", description: "The early page." };

const EARLY = Math.random() > 2;

export default function EarlyPage() {
  if (EARLY) return <main id="early-a"><h2>Early</h2></main>;
  return (
    <main id="early-b">
      <h1>Late</h1>
    </main>
  );
}
`;

const TERNARY_PAGE = `export const metadata = { title: "Ternary", description: "The ternary page." };

const FLIP = Math.random() > 2;

export default function TernaryPage() {
  return FLIP ? <main id="tern"><h1>A</h1></main> : <main><h2>B</h2></main>;
}
`;

function write(root: string, path: string, text: string): void {
  const file = join(root, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text, "utf8");
}

function writeSite(): { readonly root: string; readonly configPath: string; readonly ledgerPath: string } {
  const directory = mkdtempSync(join(tmpdir(), "site-links-"));
  const root = join(directory, "repo");
  write(root, "tsconfig.json", JSON.stringify({ compilerOptions: { baseUrl: ".", paths: { "@/*": ["./*"] }, jsx: "preserve" } }));
  write(root, "app/layout.tsx", LAYOUT);
  write(root, "components/Header.tsx", HEADER);
  write(root, "app/page.tsx", `export const metadata = { title: "Home", description: "The home page." };\n${homePage()}`);
  write(root, "app/card.tsx", `export function Card({ id }: { id: string }) {\n  return <div data-id={id}>Card</div>;\n}\n`);
  write(root, "app/keep.ts", `export const importedKeep = (href: string) => href;\n`);
  write(root, "app/about/page.tsx", simplePage("About", `      <section id="team"><p>The team.</p></section>`));
  write(root, "app/contact/page.tsx", simplePage("Contact", `      <p>Call us.</p>`));
  write(root, "app/cases/page.tsx", CASES_PAGE);
  write(root, "app/early/page.tsx", EARLY_PAGE);
  write(root, "app/ternary/page.tsx", TERNARY_PAGE);
  write(root, "app/work/page.tsx", simplePage("Work", `      <section id="case-studies"><p>Our work.</p></section>\n      <p id="_raw">Raw.</p>`));
  write(root, "app/services/seo/page.tsx", simplePage("Seo", `      <p>Search.</p>`));
  write(root, "app/solutions/custom-networks/page.tsx", simplePage("Networks", `      <p>Networks.</p>`));
  write(
    root,
    "app/blog/[slug]/page.tsx",
    `export default function Post() {\n  return <main><h1>Post</h1></main>;\n}\n`,
  );
  const configPath = join(directory, "conversion.json");
  writeFileSync(configPath, JSON.stringify(configFor([...ROUTES])), "utf8");
  return { root, configPath, ledgerPath: join(directory, "idmap.json") };
}

let cached: Proposal | null = null;
function proposal(): Proposal {
  if (cached !== null) return cached;
  const site = writeSite();
  cached = propose({ repositoryRoot: site.root, configPath: site.configPath, ledgerPath: site.ledgerPath });
  return cached;
}

function linkFieldIn(region: string): FieldBinding | undefined {
  return proposal().fields.find(
    (field) =>
      field.candidate.kind === "link" &&
      renderAnchor(field.candidate.anchor).includes(`/region:${region}/`),
  );
}

function pageIdOf(route: string): string {
  const page = proposal().pages.find((one) => one.routePath === route);
  assert.ok(page !== undefined, `route ${route} is not a page of the proposal`);
  return page.pageId;
}

interface ContractLinkField {
  readonly id: string;
  readonly classification: string;
  readonly capabilities: readonly string[];
  readonly constraints: {
    readonly authority: string;
    readonly fragmentPolicy: string;
    readonly allowedFragments: readonly string[];
    readonly allowedTargets: readonly string[];
  };
}

function contractField(fieldId: string): ContractLinkField {
  const contract = proposal().contract;
  assert.ok(contract !== null, `the contract was refused: ${JSON.stringify(proposal().validationError)}`);
  const field = contract.pages
    .flatMap((page) => page.sections.flatMap((section) => section.fields))
    .find((one) => one.id === fieldId);
  assert.ok(field !== undefined, `${fieldId} is not in the contract`);
  return field as unknown as ContractLinkField;
}

interface StoredLink {
  readonly destination: { readonly kind: string; readonly pageId?: string; readonly fragment?: string | null };
  readonly target: string;
}

function storedValue(fieldId: string): StoredLink {
  const content = proposal().content;
  assert.ok(content !== null, "the content was refused");
  const value = content.values.find((one) => one.fieldId === fieldId);
  assert.ok(value !== undefined, `${fieldId} has no stored value`);
  return value.value as unknown as StoredLink;
}

/** The href the runtime renders for a stored internal destination. */
function renderedHref(link: StoredLink, onPage: string): string {
  const page = proposal().pages.find((one) => one.pageId === link.destination.pageId);
  assert.ok(page !== undefined, "the destination names no page");
  const fragment = link.destination.fragment ?? null;
  const path = `${page.routePath}${fragment === null ? "" : `#${fragment}`}`;
  // A fragment on the page the link renders on is the same place whether or
  // not the path is written; nothing else is.
  if (fragment !== null && page.routePath === onPage) return [path, `#${fragment}`].join("|");
  return path;
}

test("the whole proposal validates, so every assertion below reads a real contract", () => {
  assert.equal(proposal().validationError, null, JSON.stringify(proposal().validationError));
});

for (const [index, row] of EDITABLE.entries()) {
  test(`editable: ${row.name} (${row.href})`, () => {
    const region = regionOf(index, "e");
    const binding = linkFieldIn(region);
    assert.ok(binding !== undefined, `no link field in region ${region}`);
    assert.equal(binding.candidate.ownership, "customer_editable");
    const field = contractField(binding.fieldId);
    assert.equal(field.classification, "customer_editable");
    assert.ok(field.capabilities.includes("link.destination.edit"));
    assert.equal(field.constraints.authority, "internal_only");
    if (row.fragment === null) {
      assert.equal(field.constraints.fragmentPolicy, "forbid");
      assert.deepEqual(field.constraints.allowedFragments, []);
    } else {
      assert.equal(field.constraints.fragmentPolicy, "declared");
      assert.deepEqual(field.constraints.allowedFragments, [row.fragment]);
    }
    const stored = storedValue(binding.fieldId);
    assert.deepEqual(stored.destination, {
      kind: "internal",
      pageId: pageIdOf(row.route),
      fragment: row.fragment,
    });
    assert.equal(stored.target, row.attributes?.includes(`target="_blank"`) === true ? "new_window" : "same_window");
    assert.ok(
      renderedHref(stored, "/").split("|").includes(row.rendered),
      `stored destination renders ${renderedHref(stored, "/")}, the source renders ${row.rendered}`,
    );
  });
}

for (const [index, row] of REFUSED.entries()) {
  test(`code-owned: ${row.name} (${row.href})`, () => {
    const region = regionOf(index, "r");
    assert.equal(linkFieldIn(region), undefined, `region ${region} proposed a link field`);
    const reported = proposal().report.findings.filter(
      (finding) => finding.evidence.includes(`Label ${region}<`) || finding.evidence.includes(`Label ${region} `),
    );
    const codes = new Set(reported.map((finding) => finding.code));
    const expected = row.read ? "LINK_DESTINATION_CODE_OWNED" : "NON_LITERAL_VALUE";
    assert.ok(codes.has(expected), `expected ${expected}, saw ${[...codes].join(", ") || "nothing"}`);
    if (row.reason !== undefined) {
      const decisions = reported.map((finding) => finding.decision).join("\n");
      assert.ok(decisions.includes(row.reason), `the refusal does not say '${row.reason}':\n${decisions}`);
    }
  });
}

for (const [index, row] of UNSUPPORTED_TARGETS.entries()) {
  test(`behaviour: ${row.name} keeps the link in code`, () => {
    const region = regionOf(index, "t");
    assert.equal(linkFieldIn(region), undefined, `region ${region} proposed a link field`);
    assert.ok(
      proposal().report.findings.some(
        (finding) => finding.code === "LINK_BEHAVIOUR_UNSTORABLE" && finding.evidence.includes(`Label ${region}<`),
      ),
    );
  });
}

test("a duplicate key never stores the first value as the destination", () => {
  const binding = linkFieldIn("dup");
  if (binding === undefined) return;
  const stored = storedValue(binding.fieldId);
  assert.notEqual(stored.destination.pageId, pageIdOf("/about"));
});

test("a parameter that shadows the module constant is not read as the constant", () => {
  const binding = linkFieldIn("shadowed");
  assert.equal(binding, undefined, "the shadowed href was read from the module constant");
});

test("a site-scoped link to another page is editable and stores THAT page, not the one it sits on", () => {
  for (const [region, route, fragment] of [
    ["primary", "/about", null],
    ["to-work", "/work", "case-studies"],
  ] as const) {
    const binding = linkFieldIn(region);
    assert.ok(binding !== undefined, `no link field in header region ${region}`);
    assert.equal(binding.scope, "site");
    assert.ok(binding.pageIds.length > 1);
    assert.equal(contractField(binding.fieldId).classification, "customer_editable");
    assert.deepEqual(storedValue(binding.fieldId).destination, {
      kind: "internal",
      pageId: pageIdOf(route),
      fragment,
    });
  }
});

test("a bare fragment rendered on several pages names no one page, so it stays in code", () => {
  assert.equal(linkFieldIn("own-fragment"), undefined);
  assert.ok(
    proposal().report.findings.some(
      (finding) => finding.code === "LINK_DESTINATION_CODE_OWNED" && finding.evidence.includes("Skip"),
    ),
  );
});

test("an absolute URL on the site's own host stays the external destination it is", () => {
  const directory = mkdtempSync(join(tmpdir(), "site-links-own-host-"));
  const root = join(directory, "repo");
  write(
    root,
    "app/page.tsx",
    `export const metadata = { title: "Home", description: "Home." };
export default function Home() {
  return (
    <main>
      <h1>Home</h1>
      <section id="www"><a href="https://www.example.com/about">WWW</a></section>
      <section id="apex"><a href="https://example.com/about">Apex</a></section>
    </main>
  );
}
`,
  );
  write(root, "app/about/page.tsx", simplePage("About", "      <p>About.</p>"));
  const configPath = join(directory, "conversion.json");
  writeFileSync(configPath, JSON.stringify(configFor(["/", "/about"])), "utf8");
  const own = propose({ repositoryRoot: root, configPath, ledgerPath: join(directory, "idmap.json") });
  assert.equal(own.validationError, null);
  for (const region of ["www", "apex"]) {
    const binding = own.fields.find(
      (field) => field.candidate.kind === "link" && renderAnchor(field.candidate.anchor).includes(`/region:${region}/`),
    );
    assert.ok(binding !== undefined && binding.candidate.kind === "link");
    assert.equal(binding.candidate.destination.kind, "external");
  }
});

test("a literal that only a wrapper made readable does not make a literal sibling ambiguous", () => {
  const directory = mkdtempSync(join(tmpdir(), "site-links-sibling-"));
  const root = join(directory, "repo");
  write(
    root,
    "app/page.tsx",
    `export const metadata = { title: "Home", description: "Home." };
const keepC = (href: string) => href;
export default function Home() {
  return (
    <main>
      <h1>Home</h1>
      <nav id="n">
        <a href="/about">About</a>
        <a href={keepC("/")}>Home</a>
      </nav>
    </main>
  );
}
`,
  );
  write(root, "app/about/page.tsx", simplePage("About", "      <p>About.</p>"));
  const configPath = join(directory, "conversion.json");
  writeFileSync(configPath, JSON.stringify(configFor(["/", "/about"])), "utf8");
  const sibling = propose({ repositoryRoot: root, configPath, ledgerPath: join(directory, "idmap.json") });
  assert.equal(sibling.validationError, null);
  const links = sibling.fields
    .filter((field) => field.candidate.kind === "link")
    .map((field) => renderAnchor(field.candidate.anchor))
    .sort();
  assert.deepEqual(links, [
    "component:Home/region:main/region:n/role:a/at:#",
    "component:Home/region:main/region:n/role:a/at:call:keepC",
  ]);
});

test("a path two routes both claim names no one page", () => {
  const directory = mkdtempSync(join(tmpdir(), "site-links-duplicate-"));
  const root = join(directory, "repo");
  write(
    root,
    "app/page.tsx",
    `export const metadata = { title: "Home", description: "Home." };
export default function Home() {
  return (
    <main>
      <h1>Home</h1>
      <section id="d"><a href="/dup">Dup</a></section>
    </main>
  );
}
`,
  );
  write(root, "app/(one)/dup/page.tsx", simplePage("One", "      <p>One.</p>"));
  write(root, "app/(two)/dup/page.tsx", simplePage("Two", "      <p>Two.</p>"));
  const configPath = join(directory, "conversion.json");
  writeFileSync(configPath, JSON.stringify(configFor(["/", "/dup"])), "utf8");
  const duplicate = propose({ repositoryRoot: root, configPath, ledgerPath: join(directory, "idmap.json") });
  assert.ok(
    duplicate.fields.every(
      (field) => !(field.candidate.kind === "link" && field.candidate.destination.kind === "page"),
    ),
  );
  assert.ok(
    duplicate.report.findings.some(
      (finding) => finding.code === "LINK_DESTINATION_CODE_OWNED" && finding.decision.includes("more than one route"),
    ),
  );
});
