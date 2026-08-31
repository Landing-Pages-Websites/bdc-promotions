import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

import { renderAnchor } from "../src/anchors.js";
import { applyConfidenceGate } from "../src/gate.js";
import { extractComponent, findComponentDeclarations, resolveTagRoles } from "../src/extract.js";
import { ModuleCache } from "../src/scan.js";

/**
 * What NAMES a region.
 *
 * A section's identity came from one place: a literal `id`. Real pages more
 * often name a landmark for assistive technology instead — `aria-labelledby`
 * points at an id, and `aria-label` carries the name inline — and both are
 * written by a developer and read as code by this tool, which is the same
 * durability an `id` has. Reading only `id` left those sections unnamed, so
 * everything inside them could be told apart only by position, and identical
 * siblings collided.
 */

function anchorsOf(files: Readonly<Record<string, string>>): readonly string[] {
  const root = mkdtempSync(join(tmpdir(), "managed-site-regions-"));
  for (const [relative, text] of Object.entries(files)) {
    const file = join(root, relative);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, text, "utf8");
  }
  const cache = new ModuleCache();
  const parsed = cache.read(join(root, "Page.tsx"));
  const roles = resolveTagRoles(parsed);
  const candidates = findComponentDeclarations(parsed).flatMap(
    (declaration) => extractComponent(declaration, roles, root, cache).candidates,
  );
  return applyConfidenceGate(candidates)
    .accepted.map((candidate) => renderAnchor(candidate.anchor))
    .sort();
}

function findingsOf(files: Readonly<Record<string, string>>): readonly string[] {
  const root = mkdtempSync(join(tmpdir(), "managed-site-regions-"));
  for (const [relative, text] of Object.entries(files)) {
    const file = join(root, relative);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, text, "utf8");
  }
  const cache = new ModuleCache();
  const parsed = cache.read(join(root, "Page.tsx"));
  const roles = resolveTagRoles(parsed);
  return findComponentDeclarations(parsed)
    .flatMap((declaration) => extractComponent(declaration, roles, root, cache).findings)
    .map((finding) => finding.code);
}

/**
 * An accessible name is a HOST fact.
 *
 * `aria-label` on a component is an ordinary prop, and the component is free to
 * render it as customer copy — which `#collectAttributes` already says, and
 * which is why it asks the component instead of assuming a host meaning. Naming
 * a region from it would let a copy edit move the anchors of every descendant.
 */
const COMPONENT_NAME_PROPS: readonly (readonly [string, string])[] = [
  ["aria-label", `aria-label="Editable headline"`],
  ["aria-labelledby", `aria-labelledby="offer-heading"`],
];

for (const [description, attribute] of COMPONENT_NAME_PROPS) {
  test(`a component's ${description} does not name a region`, () => {
    const anchors = anchorsOf({
      "Promo.tsx":
        `export function Promo({ children }: { children?: unknown }) {\n` +
        `  return <section>{children as never}</section>;\n}\n`,
      "Page.tsx":
        `import { Promo } from "./Promo";\n` +
        `export function Page() {\n` +
        `  return (\n` +
        `    <Promo ${attribute}>\n      <span>Body</span>\n    </Promo>\n  );\n}\n`,
    });
    assert.ok(
      !anchors.some((one) => one.includes("region:Editable headline")),
      `a component prop must not name a region, got ${anchors.join(", ")}`,
    );
    assert.ok(
      !anchors.some((one) => one.includes("region:offer-heading")),
      `a component prop must not name a region, got ${anchors.join(", ")}`,
    );
  });
}

/**
 * A dotted tag is a component, however its parts are spelled.
 *
 * JSX resolves `<motion.div>` as a member expression, so the browser is not what
 * receives its props and its `aria-label` is an ordinary prop that may be
 * customer copy. `!isComponentName("motion.div")` is true, which is why the
 * PascalCase test was not enough and `isProvablyHostTag` is the predicate --
 * `render-output.ts` already stated that rule and now defers to the same one.
 */
const DOTTED_TAGS: readonly (readonly [string, string])[] = [
  ["a lowercase dotted tag", "motion.div"],
  ["a capitalised dotted tag", "Motion.Div"],
  ["a deeper dotted tag", "ui.layout.section"],
];

for (const [description, tag] of DOTTED_TAGS) {
  test(`${description} is not named by its accessible name`, () => {
    const anchors = anchorsOf({
      "Page.tsx":
        `declare const motion: Record<string, (props: never) => null>;\n` +
        `declare const Motion: Record<string, (props: never) => null>;\n` +
        `declare const ui: { layout: Record<string, (props: never) => null> };\n` +
        `export function Page() {\n` +
        `  return (\n` +
        `    <${tag} aria-label="Editable headline">\n      <span>Body</span>\n    </${tag}>\n  );\n}\n`,
    });
    assert.ok(
      !anchors.some((one) => one.includes("region:Editable headline")),
      `a dotted tag must not be named by a prop, got ${anchors.join(", ")}`,
    );
  });
}

/** The same attribute on a HOST element still names it, so the rows above fail
 * for their own reason rather than because naming stopped working. */
test("the same aria-label on a host element still names the region", () => {
  const anchors = anchorsOf({
    "Page.tsx":
      `export function Page() {\n` +
      `  return (\n` +
      `    <section aria-label="Editable headline">\n      <span>Body</span>\n    </section>\n  );\n}\n`,
  });
  assert.ok(
    anchors.some((one) => one.includes("region:Editable headline")),
    `expected the host element to be named, got ${anchors.join(", ")}`,
  );
});

/**
 * When a section carries both, `aria-labelledby` wins: it holds an ID, which is
 * the same kind of durable token an `id` is, where `aria-label` is prose the
 * developer may reword without moving anything it points at.
 */
test("aria-labelledby outranks aria-label when a section carries both", () => {
  const anchors = anchorsOf({
    "Page.tsx":
      `export function Page() {\n` +
      `  return (\n` +
      `    <section aria-labelledby="offer-heading" aria-label="Browse venue networks">\n` +
      `      <h2 id="offer-heading">Offer</h2>\n` +
      `      <p>Body</p>\n` +
      `    </section>\n  );\n}\n`,
  });
  assert.ok(
    anchors.some((one) => one.includes("region:offer-heading")),
    `expected the labelledby id to name the region, got ${anchors.join(", ")}`,
  );
  assert.ok(
    !anchors.some((one) => one.includes("region:Browse venue networks")),
    `the inline label must not name it, got ${anchors.join(", ")}`,
  );
});

/**
 * An `id` outranks both, so a section that carries an accessible name as well
 * is still addressed by the id it already had.
 */
test("an id outranks an accessible name", () => {
  const anchors = anchorsOf({
    "Page.tsx":
      `export function Page() {\n` +
      `  return (\n` +
      `    <section id="hero" aria-label="Browse venue networks">\n` +
      `      <p>Body</p>\n` +
      `    </section>\n  );\n}\n`,
  });
  assert.ok(
    anchors.some((one) => one.includes("region:hero")),
    `expected the id to name the region, got ${anchors.join(", ")}`,
  );
});

/**
 * A later spread decides the attribute, whichever attribute it is.
 *
 * JSX applies attributes left to right, so `<section id="hero" {...rest}>` is
 * named whatever `rest` says `id` is. Naming a region from the literal there
 * names an element that may not carry it — and the same is true of both
 * accessible-name spellings, so the guard belongs to the reading rather than to
 * one attribute. A spread BEFORE the attribute is harmless: the literal wins.
 */
const SPREADABLE_NAMES: readonly (readonly [string, string])[] = [
  ["id", `id="hero"`],
  ["aria-labelledby", `aria-labelledby="offer-heading"`],
  ["aria-label", `aria-label="Browse venue networks"`],
];

for (const [description, attribute] of SPREADABLE_NAMES) {
  test(`a section whose ${description} a later spread may replace is not named by it`, () => {
    const findings = findingsOf({
      "Page.tsx":
        `declare const rest: Record<string, unknown>;
` +
        `export function Page() {
` +
        `  return (
` +
        `    <section ${attribute} {...rest}>
` +
        `      <h2 id="offer-heading">Offer</h2>
` +
        `      <p>Body</p>
` +
        `    </section>
  );
}
`,
    });
    assert.ok(
      findings.includes("NO_DURABLE_ANCHOR"),
      `expected the section to report no durable name, got ${findings.join(", ")}`,
    );
  });

  test(`a section whose ${description} follows a spread is still named by it`, () => {
    const anchors = anchorsOf({
      "Page.tsx":
        `declare const rest: Record<string, unknown>;
` +
        `export function Page() {
` +
        `  return (
` +
        `    <section {...rest} ${attribute}>
` +
        `      <p>Body</p>
` +
        `    </section>
  );
}
`,
    });
    assert.ok(
      anchors.some((one) => one.includes("region:")),
      `expected a named region, got ${anchors.join(", ")}`,
    );
  });
}

test("a section named by aria-labelledby is named by the id it points at", () => {
  const anchors = anchorsOf({
    "Page.tsx":
      `export function Page() {\n` +
      `  return (\n` +
      `    <section aria-labelledby="offer-heading">\n` +
      `      <h2 id="offer-heading">Offer</h2>\n` +
      `      <p>Body</p>\n` +
      `    </section>\n  );\n}\n`,
  });
  assert.ok(
    anchors.some((anchor) => anchor.includes("region:offer-heading")),
    `expected a region named for the labelledby target, got ${anchors.join(", ")}`,
  );
});

test("a section named by aria-label is named by that label", () => {
  const anchors = anchorsOf({
    "Page.tsx":
      `export function Page() {\n` +
      `  return (\n` +
      `    <section aria-label="Browse venue networks">\n      <p>Body</p>\n    </section>\n  );\n}\n`,
  });
  assert.ok(
    anchors.some((anchor) => anchor.includes("region:Browse venue networks")),
    `expected a region named for the label, got ${anchors.join(", ")}`,
  );
});

test("an accessible name keeps two otherwise identical sections apart", () => {
  const anchors = anchorsOf({
    "Page.tsx":
      `export function Page() {\n` +
      `  return (\n    <div>\n` +
      `      <section aria-label="First"><p>One</p></section>\n` +
      `      <section aria-label="Second"><p>Two</p></section>\n` +
      `    </div>\n  );\n}\n`,
  });
  // The labels themselves are candidates too (code-owned), so the claim is
  // about the two paragraphs: both survive, under distinct anchors.
  const paragraphs = anchors.filter((anchor) => anchor.endsWith("role:p/text"));
  assert.equal(paragraphs.length, 2, anchors.join(", "));
  assert.equal(new Set(paragraphs).size, 2);
});

test("a literal id still wins over an accessible name", () => {
  const anchors = anchorsOf({
    "Page.tsx":
      `export function Page() {\n` +
      `  return (\n` +
      `    <section id="offer" aria-label="Something else"><p>Body</p></section>\n  );\n}\n`,
  });
  assert.ok(anchors.every((anchor) => anchor.includes("region:offer")), anchors.join(", "));
});

test("a section with an accessible name is no longer reported as unnamed", () => {
  const codes = findingsOf({
    "Page.tsx":
      `export function Page() {\n` +
      `  return <section aria-label="Named"><p>Body</p></section>;\n}\n`,
  });
  assert.ok(!codes.includes("NO_DURABLE_ANCHOR"), codes.join(", "));
});

test("a section with no name at all is still reported", () => {
  const codes = findingsOf({
    "Page.tsx":
      `export function Page() {\n` +
      `  return <section className="plain"><p>Body</p></section>;\n}\n`,
  });
  assert.ok(codes.includes("NO_DURABLE_ANCHOR"), codes.join(", "));
});

test("a non-literal accessible name does not name anything", () => {
  const codes = findingsOf({
    "Page.tsx":
      `export function Page({ label }: { label: string }) {\n` +
      `  return <section aria-label={label}><p>Body</p></section>;\n}\n`,
  });
  assert.ok(codes.includes("NO_DURABLE_ANCHOR"), codes.join(", "));
});

/** An empty accessible name names nothing, and must not stand in for one. */
test("an empty aria-label does not name a region", () => {
  const codes = findingsOf({
    "Page.tsx":
      `export function Page() {\n` +
      `  return <section aria-label=""><p>Body</p></section>;\n}\n`,
  });
  assert.ok(codes.includes("NO_DURABLE_ANCHOR"), codes.join(", "));
});
