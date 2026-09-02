import assert from "node:assert/strict";
import test from "node:test";

import { type ComponentExtraction, extractFiles } from "./support/proposals.js";

/**
 * What the CALLER writes, read against what the receiver does with it.
 *
 * A host element's attributes are a fixed vocabulary, so `jsx-facts` can
 * classify them by name. A component's props are not, and the caller side has
 * to ask the component before applying any host rule — otherwise `className`
 * is skipped and `aria-label` is code-owned no matter what the component
 * actually renders.
 */

function extractCaller(files: Readonly<Record<string, string>>): ComponentExtraction {
  return extractFiles(files, "Caller.tsx");
}

function editableValues(extracted: ComponentExtraction): readonly string[] {
  return extracted.candidates
    .filter((candidate) => candidate.ownership === "customer_editable")
    .map((candidate) => (candidate.kind === "plain_text" ? candidate.value : ""))
    .sort();
}

const RENDERS_CLASSNAME = `export function Inner({ className }: { className?: string }) {
  return <p>{className}</p>;
}
`;

const RENDERS_ARIA = `export function Inner(props: { "aria-label"?: string }) {
  return <p>{props["aria-label"]}</p>;
}
`;

const RENDERS_LABEL = `export function Inner({ label }: { label?: string }) {
  return <p>{label}</p>;
}
`;

function caller(body: string): string {
  return `import { Inner } from "./Inner";\nexport function Caller() {\n  return ${body};\n}\n`;
}

test("a component that renders className as copy is asked, not skipped by name", () => {
  const extracted = extractCaller({
    "Inner.tsx": RENDERS_CLASSNAME,
    "Caller.tsx": caller(`<Inner className="Copy" />`),
  });
  assert.deepEqual(editableValues(extracted), ["Copy"]);
});

test("a component that renders aria-label as copy is asked too", () => {
  const extracted = extractCaller({
    "Inner.tsx": RENDERS_ARIA,
    "Caller.tsx": caller(`<Inner aria-label="Copy" />`),
  });
  assert.deepEqual(editableValues(extracted), ["Copy"]);
});

test("a host element's className is still structural, and reported as nothing", () => {
  const extracted = extractCaller({
    "Inner.tsx": RENDERS_CLASSNAME,
    "Caller.tsx": caller(`<div className="wrapper">text</div>`),
  });
  assert.deepEqual(editableValues(extracted), ["text"]);
  assert.deepEqual(
    extracted.findings.filter((finding) => finding.code === "UNKNOWN_ATTRIBUTE_ROLE"),
    [],
  );
});

test("a host element's aria-label stays code-owned", () => {
  const extracted = extractCaller({
    "Inner.tsx": RENDERS_CLASSNAME,
    "Caller.tsx": caller(`<p aria-label="Described">text</p>`),
  });
  assert.equal(
    extracted.candidates.filter(
      (candidate) => candidate.ownership === "code_owned_interface",
    ).length,
    1,
  );
});

/**
 * JSX resolves attributes left to right, so only a spread that FOLLOWS a
 * literal can replace it. `<Inner label="Original" {...runtimeProps} />` shows
 * whatever `runtimeProps.label` holds, which is not written here.
 */
test("a literal a later spread may replace is reported, not proposed", () => {
  const extracted = extractCaller({
    "Inner.tsx": RENDERS_LABEL,
    "Caller.tsx":
      `import { Inner } from "./Inner";\n` +
      `export function Caller({ runtimeProps }: { runtimeProps: object }) {\n` +
      `  return <Inner label="Original" {...runtimeProps} />;\n}\n`,
  });
  assert.deepEqual(editableValues(extracted), []);
  assert.deepEqual(
    extracted.findings.map((finding) => finding.code),
    ["UNKNOWN_ATTRIBUTE_ROLE"],
  );
});

test("a spread BEFORE the literal cannot replace it, so the literal is read", () => {
  const extracted = extractCaller({
    "Inner.tsx": RENDERS_LABEL,
    "Caller.tsx":
      `import { Inner } from "./Inner";\n` +
      `export function Caller({ runtimeProps }: { runtimeProps: object }) {\n` +
      `  return <Inner {...runtimeProps} label="Original" />;\n}\n`,
  });
  assert.deepEqual(editableValues(extracted), ["Original"]);
});

/**
 * Once a tag is a component, host semantics no longer apply to its props. If
 * the receiver cannot be read, the honest answer is that nothing here knows
 * what the prop is — not that `className` is structural and `aria-label` is an
 * accessibility interface, which are facts about HOST elements.
 */
test("an unreadable component receiver reports, rather than falling back to host rules", () => {
  const extracted = extractCaller({
    "Inner.tsx": RENDERS_LABEL,
    "Caller.tsx":
      `import { Dynamic } from "some-package";\n` +
      `export function Caller() {\n` +
      `  return <div><Dynamic className="Visible copy" /><Dynamic aria-label="Also copy" /></div>;\n}\n`,
  });
  assert.deepEqual(editableValues(extracted), []);
  assert.deepEqual(
    extracted.candidates.filter((c) => c.ownership === "code_owned_interface").length,
    0,
  );
  assert.deepEqual(
    extracted.findings.map((finding) => finding.code),
    ["UNKNOWN_ATTRIBUTE_ROLE", "UNKNOWN_ATTRIBUTE_ROLE"],
  );
});

/**
 * A tag is resolved by NAME, and a local declaration of that name is what JSX
 * actually renders. Reading the import instead classifies the prop from a
 * component the page never renders.
 */
test("a locally shadowed tag is not classified from the import it shadows", () => {
  const extracted = extractCaller({
    "Inner.tsx": RENDERS_LABEL,
    "Caller.tsx":
      `import { Inner } from "./Inner";\n` +
      `export function Caller() {\n` +
      `  function Inner() { return null; }\n` +
      `  return <Inner label="Copy" />;\n}\n`,
  });
  assert.deepEqual(editableValues(extracted), []);
});

/** A component rendering itself is not shadowing its own name. */
test("a recursive component still classifies its own props", () => {
  const extracted = extractCaller({
    "Inner.tsx": RENDERS_LABEL,
    "Caller.tsx":
      `import { Inner } from "./Inner";\n` +
      `export function Caller({ depth }: { depth: number }) {\n` +
      `  if (depth === 0) return <Inner label="Copy" />;\n` +
      `  return <Caller depth={depth - 1} />;\n}\n`,
  });
  assert.deepEqual(editableValues(extracted), ["Copy"]);
});

/**
 * A component's own parameters bind inside it, so a prop named like an import
 * is what JSX renders. The guard must reach them without also treating the
 * component's own NAME as a shadow, which would break self-recursion.
 */
test("a tag shadowed by the component's own parameter is not read from the import", () => {
  const extracted = extractCaller({
    "Inner.tsx": RENDERS_LABEL,
    "Caller.tsx":
      `import { Inner } from "./Inner";\n` +
      `export function Caller({ Inner }: { Inner: () => null }) {\n` +
      `  return <Inner label="Copy" />;\n}\n`,
  });
  assert.deepEqual(editableValues(extracted), []);
});

/**
 * `key` is consumed by React on the CALLER's side and never reaches a
 * component, so nothing written into it can render, whatever the component's
 * body does with a prop of that name.
 *
 * `ref` is NOT universally that. React 19 passes it to a function component
 * like any other prop; React 18 consumes it unless the component was wrapped in
 * `forwardRef`. Which one applies is a fact about the repository being read, so
 * it is read from there — and when it cannot be read, the value is skipped,
 * which can only cost a field nobody writes rather than propose one that edits
 * nothing.
 */
const RENDERS = (name: string) =>
  `export function Inner({ ${name} }: { ${name}?: string }) {\n  return <p>{${name}}</p>;\n}\n`;

const CALLER = (name: string) =>
  `import { Inner } from "./Inner";\n` +
  `export function Caller() {\n  return <Inner ${name}="Visible" />;\n}\n`;

const REACT_VERSIONS: readonly (readonly [string, string | null, readonly string[]])[] = [
  ["React 19 hands a component its ref", "19.2.4", ["Visible"]],
  ["React 18 consumes ref before the component", "18.3.1", []],
  ["a caret range is read by its major", "^19.0.0", ["Visible"]],
  ["a tilde range is read by its major", "~19.1.0", ["Visible"]],
  ["a prerelease pin is read by its major", "19.0.0-rc.1", ["Visible"]],
  // Every row below answers "this does not pin one major", which fails closed.
  // Deciding what a RANGE permits needs a semver implementation; three
  // attempts to reason about operators each got a different spelling wrong.
  ["an alternation is not a pin", "^19.0.0 || ^18.0.0", []],
  ["an alternation with no spaces is not a pin", "^19.0.0||^18.0.0", []],
  ["a comma list is not a pin", "^19.0.0,^18.0.0", []],
  ["an alternation of 19 and 20 is still not a pin", "^19.0.0 || ^20.0.0", []],
  ["a lower bound is not a pin", ">=18", []],
  ["a lower bound at 19 is not a pin either", ">=19", []],
  ["an UPPER bound naming 19 excludes it", "<19", []],
  ["a wildcard is not a pin", "*", []],
  ["a workspace protocol is not a pin", "workspace:*", []],
  ["a future major still hands it over", "20.1.0", ["Visible"]],
  ["an unreadable version skips it", null, []],
];

for (const [description, version, expected] of REACT_VERSIONS) {
  test(`ref: ${description}`, () => {
    const files: Record<string, string> = {
      "Inner.tsx": RENDERS("ref"),
      "Caller.tsx": CALLER("ref"),
    };
    if (version !== null) {
      files["package.json"] = JSON.stringify({ dependencies: { react: version } });
    }
    assert.deepEqual(editableValues(extractCaller(files)), [...expected]);
  });
}

/**
 * React is normally a runtime dependency, but a reference app or a component
 * library pins it elsewhere, and reading only one group would answer "unknown"
 * for a repository that states the version plainly.
 */
for (const group of ["devDependencies", "peerDependencies"] as const) {
  test(`ref: a version pinned in ${group} is read`, () => {
    const extracted = extractCaller({
      "package.json": JSON.stringify({ [group]: { react: "19.2.4" } }),
      "Inner.tsx": RENDERS("ref"),
      "Caller.tsx": CALLER("ref"),
    });
    assert.deepEqual(editableValues(extracted), ["Visible"]);
  });
}

/** `key` is never a prop, at any React version. */
for (const version of ["19.2.4", "18.3.1"]) {
  test(`key is not a field under React ${version}`, () => {
    const extracted = extractCaller({
      "package.json": JSON.stringify({ dependencies: { react: version } }),
      "Inner.tsx": RENDERS("key"),
      "Caller.tsx": CALLER("key"),
    });
    assert.deepEqual(editableValues(extracted), []);
    assert.deepEqual(extracted.findings.map((finding) => finding.code), []);
  });
}

/** A `ref` landing on a HOST element is never rendered text, whatever the
 * React version says about components. */
test("ref on a host element is not a field", () => {
  const extracted = extractCaller({
    "package.json": JSON.stringify({ dependencies: { react: "19.2.4" } }),
    "Caller.tsx": `export function Caller() {\n  return <p ref="Visible" />;\n}\n`,
  });
  assert.deepEqual(editableValues(extracted), []);
  assert.deepEqual(extracted.findings.map((finding) => finding.code), []);
});

/**
 * A DOTTED tag is a component, and its props are read from the receiver when the
 * receiver can be read.
 *
 * `isComponentName("ui.Card")` is false, so host rules used to decide a dotted
 * tag's attributes by NAME. That silently dropped a customer's copy: a namespace
 * component rendering `{id}` as a heading had its caller's `id="..."` skipped as
 * structural, so no field was proposed and nothing said it had been. `aria-label`
 * was worse than silent, offered as a code-owned interface, so the customer
 * could not edit their own heading.
 *
 * When the receiver CANNOT be read the host rules still apply, deliberately.
 * `motion.div` forwards its props to the `div` it names, so those rules describe
 * it correctly, and asking a package this reader cannot open would turn every
 * `className` on a `motion.*` tag into a finding a human must dismiss.
 */
const DOTTED_PROP_CASES: readonly {
  readonly description: string;
  readonly attribute: string;
  readonly receiver: string;
  readonly editable: readonly string[];
  readonly codes: readonly string[];
}[] = [
  {
    description: "renders a resolvable namespace component's id as a heading",
    attribute: "id",
    receiver: "return <section><h2>{value}</h2></section>;",
    editable: ["Copy"],
    // The two readings agree, which is the point: the value is offered as the
    // customer's AND refused as a name, with the refusal reported.
    codes: ["NO_DURABLE_ANCHOR"],
  },
  {
    description: "renders a resolvable namespace component's aria-label as a heading",
    attribute: "aria-label",
    receiver: "return <section><h2>{value}</h2></section>;",
    editable: ["Copy"],
    codes: [],
  },
  {
    description: "forwards a resolvable namespace component's id to a host id",
    attribute: "id",
    receiver: "return <section id={value} />;",
    editable: [],
    codes: [],
  },
  {
    description: "puts a resolvable namespace component's id in an aria-label",
    attribute: "id",
    receiver: "return <section aria-label={value} />;",
    editable: [],
    codes: [],
  },
];

for (const row of DOTTED_PROP_CASES) {
  test(`the caller is asked when the component ${row.description}`, () => {
    const extracted = extractCaller({
      "ui.tsx":
        `export function Card({ "${row.attribute}": value }: Record<string, never>) {\n` +
        `  ${row.receiver}\n}\n`,
      "Caller.tsx":
        `import * as ui from "./ui";\n` +
        `export function Caller() {\n` +
        `  return <ui.Card ${row.attribute}="Copy" />;\n}\n`,
    });
    assert.deepEqual(editableValues(extracted), [...row.editable]);
    assert.deepEqual(
      extracted.findings.map((finding) => finding.code),
      [...row.codes],
    );
  });
}

/**
 * An unreadable dotted receiver keeps the host reading, so a package wrapper
 * costs no new findings.
 */
const UNREADABLE_DOTTED: readonly (readonly [string, string, readonly string[], readonly string[]])[] = [
  ["className stays structural", `className="grid gap-4"`, [], []],
  ["aria-label stays a code-owned interface", `aria-label="Named"`, [], []],
  ["an unclassifiable name is still reported", `data-thing="x"`, [], ["UNKNOWN_ATTRIBUTE_ROLE"]],
];

for (const [description, attribute, editable, codes] of UNREADABLE_DOTTED) {
  test(`on an unreadable dotted tag, ${description}`, () => {
    const extracted = extractCaller({
      "Caller.tsx":
        `declare const motion: Record<string, (props: never) => null>;\n` +
        `export function Caller() {\n` +
        `  return <motion.div ${attribute} />;\n}\n`,
    });
    assert.deepEqual(editableValues(extracted), [...editable]);
    assert.deepEqual(
      extracted.findings.map((finding) => finding.code),
      [...codes],
    );
  });
}

/**
 * `ref` follows the same boundary as every other prop.
 *
 * On React 19 a `ref` written on a component reaches it as a prop, so a
 * resolvable dotted component is asked what it does with one. An unreadable
 * dotted tag keeps the host reading, where `ref` is a handle the DOM consumes
 * and nothing renders.
 */
test("a resolvable dotted component is asked what it does with ref", () => {
  const extracted = extractCaller({
    "package.json": `{"dependencies":{"react":"^19.0.0"}}\n`,
    "ui.tsx":
      `export function Card({ ref }: Record<string, never>) {\n` +
      `  return <section><h2>{ref}</h2></section>;\n}\n`,
    "Caller.tsx":
      `import * as ui from "./ui";\n` +
      `export function Caller() {\n  return <ui.Card ref="Visible" />;\n}\n`,
  });
  assert.deepEqual(editableValues(extracted), ["Visible"]);
});

test("an unreadable dotted tag's ref stays a host handle", () => {
  const extracted = extractCaller({
    "package.json": `{"dependencies":{"react":"^19.0.0"}}\n`,
    "Caller.tsx":
      `declare const motion: Record<string, (props: never) => null>;\n` +
      `export function Caller() {\n  return <motion.div ref="Visible" />;\n}\n`,
  });
  assert.deepEqual(editableValues(extracted), []);
  assert.deepEqual(extracted.findings.map((finding) => finding.code), []);
});

/**
 * WHAT KIND of text a prop holds is decided where the receiver shows it.
 *
 * `#pushAttributeText` hardcoded `semantic: "label"`, so a paragraph a
 * component renders in a `<p>` was capped at the label length. On a real site
 * that was 42 fields of body copy, and the only way to emit them was to raise
 * the cap in that site's config by hand.
 *
 * The rule is the one the host walk already used, asked of the receiver's
 * element instead of the caller's.
 */
const SEMANTIC_CASES: readonly (readonly [string, string, "body" | "label"])[] = [
  ["rendered in a paragraph", `<p>{copy}</p>`, "body"],
  ["rendered in a blockquote", `<blockquote>{copy}</blockquote>`, "body"],
  ["rendered in a span", `<span>{copy}</span>`, "label"],
  ["rendered in a button", `<button type="button">{copy}</button>`, "label"],
  ["rendered in a div", `<div>{copy}</div>`, "label"],
  // No element of its own to read, so the stricter cap stands.
  ["rendered in a fragment", `<>{copy}</>`, "label"],
  // Two sites that disagree cannot both be right; body needs unanimity.
  ["rendered in a paragraph AND a span", `<div><p>{copy}</p><span>{copy}</span></div>`, "label"],
  ["rendered in two paragraphs", `<div><p>{copy}</p><p>{copy}</p></div>`, "body"],
];

for (const [why, body, expected] of SEMANTIC_CASES) {
  test(`a prop ${why} is ${expected}`, () => {
    const extracted = extractCaller({
      "Inner.tsx": `export function Inner({ copy }: { copy?: string }) {\n  return ${body};\n}\n`,
      "Caller.tsx":
        `import { Inner } from "./Inner";\n` +
        `export function Caller() {\n  return <Inner copy="Some words" />;\n}\n`,
    });
    const found = extracted.candidates.find(
      (candidate) => candidate.kind === "plain_text" && candidate.value === "Some words",
    );
    assert.ok(found !== undefined, JSON.stringify(extracted.candidates.map((c) => c.kind)));
    assert.equal(found.kind === "plain_text" ? found.semantic : null, expected, why);
  });
}

/** An accessibility string is a name, never a paragraph, whatever it sits in. */
test("an aria attribute on a host element stays a label", () => {
  const extracted = extractCaller({
    "Caller.tsx":
      `export function Caller() {\n  return <p aria-label="A described region">Text</p>;\n}\n`,
  });
  const found = extracted.candidates.find(
    (candidate) => candidate.kind === "plain_text" && candidate.value === "A described region",
  );
  assert.ok(found !== undefined);
  assert.equal(found.kind === "plain_text" ? found.semantic : null, "label");
});
