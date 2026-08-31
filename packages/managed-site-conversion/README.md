# managed-site conversion proposer

Reads a Next.js repository and **proposes** a managed-site contract, the content
that fills it, and a report of everything it refused to decide.

It automates steps 2 to 4 of `docs/managed-site-adoption.md` — declare the
contract, mint stable IDs, classify every customer-facing value — for the parts
of a repository that are already named well enough to be automated, and names
the rest as work for a person.

```bash
npm --workspace @landing-pages-websites/managed-site-conversion run propose -- \
  --repo ../some-customer-site \
  --config ./example.conversion.json \
  --out /tmp/proposal \
  --write-sources
```

Output:

| file | what it is |
| --- | --- |
| `managed-site.contract.json` | the proposed contract, in the canonical v1 shape |
| `managed-site.content.json` | the values the site renders today, as a content document |
| `sources/src/content/**.json` | the proposed structured sources the resolvers point at |
| `needs-human.txt` / `.json` | every decision the tool refused to make, with the evidence |
| `managed-site.idmap.json` | the anchor-to-ID ledger (commit this) |

The process exits non-zero while anything is unresolved, so it can gate a
conversion pull request.

## The confidence rule

> A value enters the proposed contract only when its **identity**, its **field
> type** and its **classification** are each decided by a rule reading
> exclusively from structural source facts — declared identifiers, JSX tags,
> attribute names, literal syntactic kind — and no other candidate in the
> repository resolves to the same anchor path. If any one of the three is
> undetermined, the value is reported and **nothing** is written into the
> contract for it.

The rule is printed at the top of every report, so a reader never has to infer
what "confident" meant for a given run.

### A component's props are read from the component

A host element's attributes are a fixed vocabulary, so a list can classify
them. A component's props are not: `title` is customer copy on one component
and a tooltip on another, and `as` is never copy anywhere. So the role is not
read from the NAME — it is read from what the receiving component does with the
value, in that component.

A prop rendered as text is content. A prop that ends up in an `aria-*` or `alt`
attribute is an accessibility interface. A prop that is tested, used as a tag,
used as a key into a lookup, or lands in a structural attribute is code.

Nothing is guessed. The reading returns nothing — and the value is reported
exactly as any other refusal — when the prop's uses disagree, when the
receiving component cannot be read, when the value crosses a call this reader
cannot see through, when a later spread could replace it, or when the props
object reaches anything this reader cannot follow.

One prop's meaning depends on the site rather than on the code: `ref` reaches a
function component from React 19 and is consumed before it. That is read from
the repository being converted, and a manifest that does not PIN a major
answers unknown, which fails closed.

The trade this makes is deliberate. A wrong classification is a silent failure:
either internal SEO copy becomes customer-editable, or content the customer
needs is locked away, and neither is discovered until much later. An unresolved
value is a loud failure that costs a person five minutes. The tool is tuned to
convert loud failures into work and never to convert silent ones into coverage.

Concretely it refuses, rather than guesses, on:

| code | what it means |
| --- | --- |
| `AMBIGUOUS_ANCHOR` | two or more values resolve to the same anchor; both are withheld, and so is anything nested inside them |
| `NO_DURABLE_ANCHOR` | a `<section>` with no `id` and no component of its own |
| `NON_LITERAL_VALUE` | the rendered value is computed, not a literal that can be migrated |
| `UNKNOWN_ATTRIBUTE_ROLE` | on a host element, a literal attribute that is neither structural nor a known accessibility interface; on a COMPONENT, one whose receiver was read but does not decide what the prop is |
| `DUPLICATE_COMPONENT_NAME` | one component name declared in two files |
| `UNRESOLVED_COMPONENT` | a local import of a rendered component that could not be resolved, so its markup was never read |
| `UNRESOLVED_RENDER_TARGET` | a rendered element names no traceable declaration — chosen at runtime, arriving as a prop, or an unnamed default export — or a JSX-writing function was handed to a call or to a component and where its result renders could not be read |
| `COLLECTION_BOUNDS_NOT_DERIVABLE` | item counts are policy, and item IDs were bootstrapped from present array order |
| `COLLECTION_ITEM_IMAGE_UNSUPPORTED` | items each carry a different image, which one asset slot cannot express |
| `ASSET_UNREADABLE` | an image whose dimensions could not be read |
| `ASSET_PATH_UNREPRESENTABLE` | the configured `assetRoot` joined to the referenced file is not a path the standard can carry |
| `SEO_INPUT_REQUIRED` | an internal-SEO or platform fact with no source in the repository |
| `SCOPE_NOT_OBSERVABLE` | a component renders on several routes, so site scope was assumed and needs confirming |
| `CONSTRAINTS_DEFAULTED` | a length or node limit came from policy rather than from anything the source proves |
| `DYNAMIC_ROUTE_NOT_A_PAGE` | a route template stands for many URLs, so it is not one page to convert |
| `ROUTE_PATH_UNREPRESENTABLE` | a route folds into a file name longer than one path segment may be, so no content file can hold it |

## What counts as customer content

Only what a visitor can actually reach. A route is read through the chain that
renders it — its `page` module and every `layout` above it, nearest first — and
the render tree is followed from those default exports through JSX element names,
across imports, renames, default exports and barrel re-exports.

A capitalized export sitting beside a page is **not** proposed: an editor for
markup the browser never shows is worse than no editor at all. Neither is a
function declared *inside* a component and left there — nested or top level,
capitalized or not, its JSX renders only where something runs or renders that
function, so it is read only when the tree reaches it, and then under its own
name rather than its parent's.

Running a function is **not** the same as rendering what it returns.
`useEffect(() => <Row />)` runs its function and throws the result away, and so
do `setTimeout` and `forEach`. So the question asked of every nested function is
not whether something runs it but whether **what it returns reaches the browser
as markup**. One answer says yes: a call runs it *and* the call's own result
lands in rendered output — written as a child of an element, or handed back by
the function it sits in. A component reached that way is still extracted under
its own name, never its caller's.

Being written as an element's **attribute** is not such an answer. An attribute's
function renders only if the element renders what it returns, and the attribute
says nothing about whether it does: `<button onClick={() => <Row />}>` hands the
result to the DOM, which discards it, and a component is as free to take a
callback it never renders (`onConfirm`, `onSelect`) as one it does. Nothing is
followed on attribute spelling. Where the answer is knowable it comes from the
receiving element and is always no, so the element decides only whether the
refusal is silent or spoken:

| Given to | Answer | Result |
| --- | --- | --- |
| a host element | renders no return value, ever | ignored, **silently** |
| a component | only its own declaration says | withheld and **reported** |

So `renderItem={() => <Row />}` is reported rather than extracted, even where the
receiving component does render it: resolving a tag to its declaration and
proving it renders the prop is beyond what this reads, and a rule right about
`renderItem` but wrong about `onConfirm` cannot tell you which one you have. The
refusal is scoped to callbacks that actually write JSX, so ordinary handlers stay
silent. A dotted tag is a component whatever its case — `<motion.div />` is not a
`div` — so it is reported rather than ignored.

Which call it is never matters, so no list of method or hook names appears
anywhere in the rule. One consequence is worth stating: `{items.filter((i) =>
<Row />)}` puts its result in rendered output, but `filter` passes the items
through rather than what the function returned, so `Row` is read when nothing
renders it. Nothing syntactic separates it from `map`, and such a filter is
already broken — every item is truthy, so it filters nothing.

One call shape does not render what the function returns but builds a component
out of it: `memo`, `forwardRef`, `lazy`, `dynamic`. They are told apart by what
the call's **result** becomes, never by the callee's name, which no list could
keep up with — a result bound to a component-shaped name is a declaration, and
React reaches a declaration only through a capitalized tag, so that tag is the
edge.

Where the tree cannot be followed — a component chosen at runtime, one arriving
as a prop, an import that does not resolve, an unnamed default export, a call
given a JSX-writing function whose result goes somewhere unreadable, or a
component given a JSX-writing function as an attribute — the
subtree is withheld **and** reported, because a silent drop hides the same
coverage gap as a silent inclusion. That last case covers `const rows =
items.map((i) => <Row />)`: following the binding to the place it is read is
dataflow this proposer does not do, so the call is named rather than guessed at.

Being unrendered is not such a case: it is a resolved answer, so it is left out
in silence rather than filed as a decision. A discarded result is resolved in
the same way — nothing an effect or a `forEach` returns reaches a visitor, so
there is nothing for a human to decide, and neither does anything returned by a
host element's handler.

Two shapes are still left out in silence, and both are recoverable by hand: a
component passed by name rather than written as a tag (`renderItem={Card}`,
`items.map(Card)`), and a callback named twice in one module, where which
declaration a call reaches is a scope question the source alone cannot settle.

Internal SEO follows the same chain. `metadata.title`, `metadata.description` and
`robots` are resolved per route from the route's own module first, then its
layouts: a field the route omits legitimately inherits from a layout, exactly as
Next.js renders it, and nothing a sibling route declares can reach it. A field a
route declares but the tool cannot read as a literal does **not** fall back to a
layout — it is reported, so an ancestor's value is never attributed to a route
that overrode it.

## The ID scheme

Stable IDs are random, exactly as the platform mints them. What has to be
durable is the **binding** between an ID and the source, and that binding is the
**anchor path**: a chain of names a developer wrote on purpose.

```
component:Navigation / region:pricing / role:a / at:#contact
component:Hero       / role:h1        / text
component:Method     / region:steps   / each:STEPS / prop:title
```

A segment may only be:

- `component:<Name>` — a uniquely named component declaration
- `region:<id>` — a container's literal `id` attribute (also a URL fragment target), or a unique landmark element
- `role:<tag>[#<attribute>]` — the element, or the attribute a value flows into
- `at:<discriminator>` — a durable way to tell siblings apart: a link fragment, a module constant name, a declared `id`, an image path
- `each:<BINDING>` / `prop:<name>` — a module-level array and an object-literal property name
- `text` — the direct text run of an element

Deliberately excluded, because none of it survives normal work: **visible text**
(changes on every copy edit), **DOM or sibling order** (changes when a section
moves), **array index** (changes on reorder), **file name or path** (changes when
a component is extracted), and **external URL literals** (a customer editing a
destination would silently re-identify the field).

Consequences, all covered by `test/anchors.test.ts`:

- Wrapping content in extra `<div>`s changes nothing. Layout containers that
  render no text of their own contribute no anchor segment at all.
- Reordering siblings changes nothing.
- Rewriting every word of copy changes nothing.
- Swapping `<section>` for `<article>` changes nothing.
- Moving a component into its own file changes nothing — the anchor is rooted on
  the component **name**, not its path. This is the one refactor the real
  TrendCandy conversion actually performed.
- Renaming a component **does** move its anchors. That is intended: the tool
  reports the old anchors as retired and the new ones as fresh, so a human
  either accepts the churn or declares an alias. A silent rebind would be worse.

Re-running is idempotent. `managed-site.idmap.json` maps anchor to ID; a known
anchor keeps its ID, a new one mints, and an anchor that disappeared has its ID
written to `tombstonedIds` rather than recycled.

Item IDs inside a collection are the one place position is used, and only once:
at the first run, when position is the only truth available. The IDs are written
straight into the emitted content, so from then on they live in the source. Every
collection carries a `COLLECTION_BOUNDS_NOT_DERIVABLE` finding saying so.

## What the operator must supply

The repository cannot know its own production origin, legal name, telephone,
sitemap policy, performance budget, page intent, or the current review-bridge
integrity hash. Those come from `--config` (see `example.conversion.json`).
Anything missing is reported as `SEO_INPUT_REQUIRED` and the contract is withheld
— it is never defaulted into place.

A key nobody wrote takes the default. A key somebody wrote, with a value the
loader cannot use, is refused by name — `"pages": 42` is a mistake in the file,
and loading it as no declared pages hides the one thing the writer needs told.
An explicit `null` is how JSON says "not set", so it counts as absence. The
values the standard defines — page purpose, sitemap policy, performance budget —
are checked by the standard's own parser rather than by a second description of
them here.

`contentRoot` and `assetRoot` are checked against the paths derived beneath them,
not only their own shape, because the standard bounds a whole path: a root that
loads must not be able to fail at emission. A content root has to leave room for
`/pages/<slug>.json` at the longest slug that can exist. An asset root has to
leave room for one file name at the longest the standard permits — an asset path
is whatever the repository already calls the file, so anything deeper is decided
when that path is built, and reported as `ASSET_PATH_UNREPRESENTABLE` naming
whichever of the two is at fault.

What *is* migrated automatically: `metadata.title`, `metadata.description` and
`robots`, resolved per route from the Next.js `metadata` exports along that
route's own chain (that export is the route's SEO contract), the heading outline
from the headings actually found, and image dimensions, byte counts and SHA-256
digests read from the committed files.

## Verification

The proposal is only reported as valid when the platform's own parsers accept
it: `parseManagedSiteContractV1`, `parseManagedSiteContentDocument` and
`validateManagedSiteContractV1ContentSemantics`. There is no second
implementation of the schema in this package — resolvers and pointers are built
through `parseRepositoryPath` and `parseJsonPointer` so a malformed address fails
at construction rather than at review time.

## Measured behaviour on TrendCandy

`trendcandy-taste` is the only site converted by hand, so it is the only real
yardstick. The tool was run against its pre-conversion commit (`3093065`, the
parent of the adoption commit) and compared against the contract and content that
were actually shipped, matching on value rather than on ID.

The shipped artefacts hold **62 distinct customer-facing and internal values**.

| run | proposed | matched | needs human | classification errors |
| --- | --- | --- | --- | --- |
| pre-conversion source, untouched | 34 | 29 (47%) | 24 | **0** |
| after adding `id` to 4 unnamed sections (~5 min) | 36 | 31 (50%) | 16 | **0** |
| after the full mechanical pass (~30 min) | 62 | 57 (92%) | 3 | **0** |

The full mechanical pass is: name 4 sections, give 6 sibling paragraphs an `id`,
declare the three proof metrics as an array, and write the eight partner logos out
as declared list items. No copy was touched and no layout changed.

**What it got right, unaided.** All eight navigation fields, including the split
of `Trend<span>Candy</span>` into two editable values and the `href="#"` brand
link as `code_owned_interface`. The hero heading as `rich_text` with the `<em>`
preserved as an italic mark. Every heading, every link with its destination and
target, the hero image with real dimensions and digest, the method steps as a
collection, and the two `aria-label` values as `code_owned_interface`.

**Zero classification disagreements in every run.** Nothing the hand-written
contract protects was ever proposed as customer-editable, and nothing it exposes
was ever proposed as protected.

**What it missed, and reported.** On the untouched source: six proof metrics and
seven loose paragraphs, whose `<p>` siblings are indistinguishable without a
name; the two identical `BOOK_URL` calls to action, which cannot be told apart
from each other; and sixteen partner values, because a collection cannot vary an
image per item under this standard. That is seventeen `AMBIGUOUS_ANCHOR`
findings plus one `COLLECTION_ITEM_IMAGE_UNSUPPORTED` covering all sixteen
partner values — every missed value is covered by a finding that names the
decision required.

(The two calls to action do not appear as misses in the table, because the
comparison matches on value and the navigation's "Book a Call" link carries an
identical label and destination. The table therefore flatters the tool very
slightly.)

**What it never proposed at all.** Business identity: legal name, telephone,
email and same-as URLs appear nowhere in the pre-conversion source. Six of the
ten internal-SEO fields in the shipped contract were *authored* during the
conversion, not migrated. That is invisible in a diff and is the single most
underestimated part of the per-site cost.

**Where it disagrees defensibly.** Three method step titles are proposed as
`heading_text` (they are `<h3>` in the source) where the hand-written contract
used `plain_text`. The testimonial quote keeps the `&ldquo;` / `&rdquo;` the
source renders, which the hand-written version dropped. These show as
non-matches in the table above and are counted against the tool.

**One finding about the standard, not the site.** The hand-written contract keys
its eight partner entries as `workvivo`, `sap`, `adobe` and so on — identities
derived from logo file names and visible text, which is exactly what step 3 of
the runbook forbids. The tool cannot reproduce that and should not.

### Realistic per-site effort after tooling

TrendCandy is one route and 62 values. Extrapolating from it:

- **~30 minutes** of mechanical remediation to clear the structural findings —
  naming sections, disambiguating sibling paragraphs, declaring repeated content
  as arrays. This is the bulk of what the tool converts from authoring into
  review.
- **~15 minutes** of operator input per site — canonical origin, business
  identity, page intent, sitemap and performance policy. Mostly not derivable and
  mostly shared across a customer's routes.
- **~15 minutes** of review of the proposal itself: confirm collection bounds,
  confirm presentation names and grouping, confirm the classification of anything
  the tool marked `code_owned_interface`.
- Then the parts this tool does not touch at all: routing rendering through the
  adapter, annotations, and parity proof against the frozen baseline.

Against roughly a day per site today, this is a plausible **1 to 1.5 hours** for
the contract-and-content half of the work on a site of TrendCandy's size, with
the residual risk moved from silent misclassification to an explicit list.

Two caveats on that number. Multi-route sites will spend more on scope decisions
that a single route cannot make observable. And a repository written without
`id` attributes or named components will spend most of its time in the mechanical
pass, because that is precisely the input the tool needs.
