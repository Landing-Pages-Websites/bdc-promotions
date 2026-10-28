# Managed-site contract

Private runtime, schemas, framework adapters, annotations, and conformance CLI
for Gomega-managed websites. This package is the shared executable contract
used by site repositories and Site Guard; it is not the CMS UI and it does not
publish customer changes.

## Distribution

The package is published manually from `main` to GitHub Packages as
`@landing-pages-websites/managed-site-contract`. Releases are immutable: bump
the exact version in the workspace and lockfile in a reviewed PR before running
the `Publish managed-site contract` workflow.

The `managed-site-contract-release` Environment allows deployments from `main`
only. GitHub Team does not offer required Environment reviewers for private
repositories, so release approval comes from the reviewed version-bump PR,
green CI, an immutable version, and a manual workflow with no version override.
Add required Environment reviewers if the organization moves to Enterprise.

Same-organization repository workflows should:

1. receive explicit Actions access to the package in GitHub's package settings;
2. grant `packages: read` and `contents: read` to their workflow token;
3. configure `actions/setup-node` for `https://npm.pkg.github.com` and the
   `@landing-pages-websites` scope; and
4. provide `${{ github.token }}` as `NODE_AUTH_TOKEN` only to `npm ci`.

Cross-organization consumers such as `zleague/megaseo-web` must use a dedicated
read-only package credential with `read:packages`. Never place that credential
in a repository file, build artifact, browser bundle, or customer-site runtime.

## Review bridge versions

A contract names exactly one review-bridge delivery, and each version is
accepted only at its own immutable asset
(`https://app.gomega.ai/review-bridge/<version>/review-bridge.js`) with a
sha384 integrity value. `SUPPORTED_BRIDGE_VERSIONS` lists every version a
contract may name, oldest first; `CURRENT_BRIDGE_VERSION` is the one new sites
and the starter template install. Older versions stay in the list so sites
certified on them keep validating.

Since 0.43.0 a contract may instead name the unpinned `latest` delivery,
`https://app.gomega.ai/review-bridge/latest/review-bridge.js`, with no
`integrity` and no other field (`LATEST_BRIDGE_SRC`). A site may move onto it
from any pinned version, through the compatibility policy or a declared
migration step, and never needs a version step again. `latest` is not in
`SUPPORTED_BRIDGE_VERSIONS`, and moving back to a pinned version stays refused.

Changing a site's bridge descriptor, including moving it from one supported
version to the next, is a runtime identity change: the compatibility policy
refuses it with `COMPATIBILITY_RUNTIME_CHANGED`. A site moves to a newer bridge
by re-enrolling, never through an ordinary content or contract update, or
(since 0.15.0) through a declared field migration whose bridge step is exactly
the next supported version and admitted by the platform (see "Field
migrations" below). Remove a version from the list only after no enrolled site
still names it.

## Compatibility of a code change

`validateManagedSiteContractV1Compatibility(production, productionContent,
candidate, candidateContent)` decides whether a candidate contract may replace
production's through an ordinary code change. Besides keeping every
declaration, value and asset, a code change keeps every production URL and SEO
identity fact:

- every production page keeps its route exactly (`COMPATIBILITY_ROUTE_REMOVED`).
  URL moves are blocked until Site Guard has a combined content-and-code
  path, since a move changes the route and the canonical together;
- every production redirect is kept (`COMPATIBILITY_REDIRECT_REMOVED`) and
  compared whole, except its destination, which may change only to a page
  indexed at its own static path (a page-owned `index: true` value and a
  canonical naming that path on the site's own origin), and its status, which stays
  permanent if it was (`COMPATIBILITY_REDIRECT_CHANGED`). Every kept redirect
  that changed is listed in the result's `changedRedirects`;
- every `internalSeo` section the schema declares, except protected fields
  and redirects, is compared whole, values as well as references, except
  `MANAGED_SEO_FACTS_NOT_COMPARED` (a page's purpose, sitemap entry, minimum
  inbound links and performance budget) (`COMPATIBILITY_SEO_IDENTITY_CHANGED`,
  `COMPATIBILITY_PAGE_SEO_CHANGED`,
  `COMPATIBILITY_GENERATED_PAGE_SEO_CHANGED`). Facts may be added, never
  changed, dropped or filled: a null is a fact (a null share-card title means
  the card keeps its own text) except in business identity. A list the
  occurrence registry finds a reference in is a set, so its items may move
  (two sections swapped), and every move is listed in `reorderedSeo`; an
  outline's H1 is kept exactly, in its place, and none is added to a page
  that has one.

A page, static or generated, keeps the set of fields that render its H1,
read from every field it renders, collection items and site fields included
(`managedRenderedH1Sources`, `managedPageH1Fields`;
`COMPATIBILITY_PAGE_SEO_CHANGED`). A page with none may declare its H1 fields
in one change, which is listed in the result's `adoptedH1`.

Since 0.35.0 a generated page's own H1 field (a level 1 `heading_text` item
field of its route collection that its outline names at level 1) is an H1
source on that generated page only: a page listing the collection shows its
items as cards and does not gain that field as an H1. Every other level 1
heading item field still counts wherever its collection renders. So an
existing collection a page lists can become a route collection with a new H1
field, while making an existing listing-page H1 source the route H1 is still
refused (it would drop a declared H1).

Contract semantics also hold a static page's outline to headings: at most one
H1, and every entry a field the page renders that can carry that heading: a
heading field at its own level, or a rich-text field that admits heading
blocks, at a level its grammar has (`CONTRACT_SEO_FIELD_POLICY`). Content semantics
admit a level 1 rich-text heading block only in a field the page's outline
names at level 1 (`CONTENT_RICH_TEXT_H1_UNDECLARED`), and require a rich-text
field the outline names at level 1 to render exactly one
(`CONTENT_RICH_TEXT_H1_MISSING` for none, `CONTENT_RICH_TEXT_H1_REPEATED` for
more, since 0.16.1).

A collection keeps its policy: bounds may only widen, the item id policy and
deletion rules stay, and every uniqueness rule a candidate states must already
be production's (`COMPATIBILITY_COLLECTION_POLICY_NARROWED`), with one
exception since 0.33.0. A new rule is admitted when every field it names is new
in the candidate (absent from production, never tombstoned) and
`internal_protected`, and no customer can create an item of the collection (no
field listing it grants `collection.add`). Such a rule can refuse nothing a
customer holds or can write; the candidate's own content is still held to it
(`CONTENT_COLLECTION_UNIQUENESS`). This is how an existing collection becomes a
generated route's collection, gaining its protected `route.slug` and the exact
rule over it while every item keeps its id. For the same reason a customer may
not gain `collection.add` on a collection whose rules name a protected field.

Changing a business identity fact or a page's SEO source is a CMS content
change, not a code change. The one exception: a static page's title or
description may move to a new customer-editable `seo_*` field whose value is
exactly the page-owned text production serves today, while its share-card
echo names a protected field (kept, or set where production had none). See the 0.16.0 changelog entry for the details.

## Rich text rendered in one element

A `rich_text` field whose value renders inside ONE site element (a heading, a
paragraph, a button label) declares `maxBlocks: 1` and names its one block type
in `allowedBlocks`. `maxBlocks` is optional; absent is unbounded, so every
existing contract means what it meant, and the compatibility policy treats
adding or lowering it as narrowing.

Content stays semantic: a value says `italic`, `bold` or `link`, never how the
site styles it. The site renders each mark with its own element and names the
mark on that element with `data-gomega-mark="<type>"`
(`managedRichTextMarkAttributesV1`), and an unmarked run is a bare text node.
The field's root element keeps `data-gomega-field-id` (and
`data-gomega-item-id` for an item) exactly as a text field's does.

The helpers every renderer shares:

- `managedRichTextBlockInlines(document)` returns the one paragraph or heading
  block's text, and refuses (`RICH_TEXT_NOT_ONE_BLOCK`) anything else rather
  than rendering part of it.
- `groupManagedRichTextInlines(inlines)` groups runs that share their outer
  mark into one element; a text node lists its marks outermost first, and a
  hard break becomes a `hard_break` span (see below).
- `managedRichTextLinkAttributesV1(mark)` gives a link mark's `href` and
  `target` for an external, email or phone destination. An internal link names
  a page id, whose path this package is not given, so it is refused
  (`RICH_TEXT_LINK_UNRESOLVED`) for the site to resolve from its contract.

## Hard breaks

Since 0.17.0 a line inside one block is the inline node `{ "type": "hard_break" }`,
never a newline in text. The node has no attrs, no marks and no other key. It
sits in a paragraph's or heading's `content` between two non-empty text nodes:
never first, never last, and never next to another break or to empty text. Text nodes refuse every
control character (`\p{Cc}`, `"\n"` included), as the CMS writer and reader
do, so a value has one spelling for a line break.

A field admits breaks only with `allowHardBreaks: true`; absent (or `false`)
admits none, so a site whose renderer predates breaks is never handed one.
`maxHardBreaks` (a whole number from 1 to 16, `MANAGED_RICH_TEXT_MAX_HARD_BREAKS`)
caps the value's total, and is refused without the opt-in; absent is unbounded,
like `maxBlocks`. A break counts as a node toward `maxNodes` and as no character
toward `maxCharacters`. The compatibility policy treats adding the opt-in or
raising (or removing) the cap as widening, and dropping the opt-in, adding a cap
or lowering one as narrowing.

A break renders as `<br data-gomega-break="">` (`managedRichTextBreakAttributesV1`,
`MANAGED_RICH_TEXT_BREAK_ATTRIBUTE`) unless the site renders its own line
element, which carries the same attribute so an editor can find and clone it.
`groupManagedRichTextInlines` emits it as a `{ kind: "hard_break" }` span, inside
every mark its two neighbours share from the outside in, so
`<strong>Grow<br>more</strong>` round-trips.

A field migration can write a break (since 0.19.0, a part declared
`joinedBy: "hard_break"`, see "Field migrations") but does not move a block
already holding one: such a source is `MIGRATION_TRANSFORM_DEFERRED`.

Any internal destination -- a rich-text link mark's or, since 0.13.0, a link
field's -- must name exactly one path. A static page is its own path, so it
takes no item. A generated page is a pattern only an item fills, so since 0.25.0
a destination names one of its items with `itemId`:

```json
{ "kind": "internal", "pageId": "page_...", "itemId": "item_...", "fragment": null }
```

`itemId` is absent for a page, never `null`. One predicate decides both kinds of
value, each with its own code (a prose link's `CONTENT_RICH_TEXT_LINK_...`, a
link field's `CONTENT_LINK_...`):

- a generated page with no item: `..._PAGE_UNPATHED`;
- a static page with an item, or an item of a collection other than the one the
  page's route iterates: `..._ITEM_SCOPE`;
- an item that is not active (in no collection's ordered items, or
  tombstoned): `..._ITEM_UNRESOLVED`. Removing an item a link names therefore
  refuses the content until the link is repointed.

A renderer resolves an item link with its own resolver:
`managedRichTextLinkAttributesV1(mark, resolvePagePath, resolveItemPath)` calls
`resolveItemPath(pageId, itemId)` for an item and refuses
(`RICH_TEXT_LINK_UNRESOLVED`) when it is not given one, so a resolver written for
pages alone is never handed an item it would answer with the pattern.
`managedGeneratedRoutePath(pattern, routeKey)` fills a one-parameter pattern with
an item's route key (`/networks/[slug]`, `healthcare` -> `/networks/healthcare`),
refusing a key `isManagedGeneratedRouteKey` does not accept.

### A link field's query (since 0.41.0)

A link field's internal destination may carry a `query`, one value per name,
which its field's constraints must declare:

```json
{ "kind": "internal", "pageId": "page_...", "fragment": null, "query": { "type": "strategy" } }
```

```json
"allowedQueries": [
  { "pageId": "page_...", "parameters": [{ "name": "type", "values": ["strategy", "rfp", "expert"] }] }
]
```

- **The invariant**: a query is admitted only parameter by parameter and value
  by value from the field's `allowedQueries` entry for the page the destination
  names, compared exactly (`Type` is not `type`, `STRATEGY` is not
  `strategy`). An undeclared name or value, a page with no entry, or a query on
  a field with no `allowedQueries` refuses the value (`FIELD_VALUE_LINK` from
  `validateManagedFieldValue`, `CONTENT_VALUE_POLICY` in content semantics).
  Absent `allowedQueries`, as `[]`, admits no query: every link field before
  0.41.0 is unchanged.
- **Tokens**: a name is `MANAGED_LINK_QUERY_NAME` (`^[A-Za-z][A-Za-z0-9._-]*$`)
  and a value `MANAGED_LINK_QUERY_VALUE` (`^[A-Za-z0-9._-]+$`), each at most
  64 characters, at most 8 parameters. Every character is one a URL leaves
  unencoded, so a token is written exactly as held: `%20`, `+`, a space, `&`,
  `=`, `?`, `#` and `~` are refused rather than decoded, and no value can carry
  a second parameter.
- **One spelling**: `query` is a map, so a name cannot repeat and the order it
  was written in means nothing. `managedLinkQueryString(query)` writes `?`
  and `name=value` pairs joined by `&`, names in ascending code-unit order
  (ASCII, so byte order). `managedRichTextLinkAttributesV1` writes path, query,
  fragment: `/contact?source=footer&type=rfp#form`. Never empty: no query is
  the key absent.
- **Policy**: each `allowedQueries` entry names a page (a reference: an
  undeclared page is `CONTRACT_REFERENCE_UNRESOLVED`), each page once, each
  parameter once with 1 to 64 unique values. Values are an enumeration, never
  a pattern: three implementations (this package, the CMS's database and its
  editor) hold the rule, and a pattern is read differently by each regular
  expression engine.
- **Compatibility**: a candidate keeps every page, parameter and value
  production declares, else `COMPATIBILITY_FIELD_POLICY_NARROWED`; adding
  any of them widens.
- **Prose links carry none**: a rich-text link mark's destination
  (`managedRichTextLinkDestinationSchema`) has no `query` key, so a mark with
  one is refused by its shape.

`MANAGED_RICH_TEXT_HEADING_LEVELS` is the set of heading levels a document may
hold (1, 2 and 3), read from the schema.

## Template text: editable words, live numbers

Since 0.23.0 a `plain_text` field may declare `constraints.template`, so a
customer edits the words around a number the site computes ("{count}
networks"), and the number stays the site's:

```json
"constraints": {
  "minLength": 1, "maxLength": 60, "newlines": "forbid",
  "template": {
    "locale": "en",
    "placeholders": [{ "name": "count", "minimumIntegerDigits": 1, "grouping": false }],
    "plural": { "placeholder": "count", "category": "other" }
  }
}
```

- **The value is still a string**, holding each declared placeholder as the
  token `{name}`. It must hold each token exactly once, and once the tokens are
  removed no `{` or `}` may remain (`FIELD_VALUE_TEXT` otherwise). So a
  removed, repeated or renamed placeholder, `{ count }`, `{Count}`, a literal or
  stray brace and an undeclared `{other}` are all refused, and there is no
  escape for a brace. Length is the field's ordinary `minLength`/`maxLength` in
  code points, counted on the stored text with each token as written; a maximum
  shorter than the tokens alone is refused. Spaces (NBSP included) beside a
  token are ordinary text, and nothing is trimmed.
- **The declaration.** `locale` is a canonical BCP 47 tag this runtime formats
  and pluralizes in. One to four placeholders, each a distinct name
  (`^[a-z][a-z0-9_]{0,31}$`), with `minimumIntegerDigits` (1 to 8: `2` renders
  7 as `07`, as `padStart(2, "0")` does) and `grouping` (whether 1234567 is
  `1,234,567`). Numbers are written with Latin digits. Only running text
  (`body`, `label`, `caption`) may be a template; `heading_text`, link labels
  and rich text may not.
- **Plural forms are fields.** A word that changes with its number is one field
  per form, each declaring `plural: { placeholder, category }` with a category
  (`zero`, `one`, `two`, `few`, `many`, `other`) the locale's cardinal rules can
  select: English has `one` and `other`. A template with no plural word says
  `plural: null`. Each form is annotated like any text field, so a page's
  "1 network" opens the `one` field and "3 networks" the `other` one.
- **Rendering.** `renderManagedTextTemplateV1(template, text, inputs)` returns
  the text with each token replaced by its number, and
  `renderManagedPluralTextV1(forms, inputs)` picks the form the number selects
  (`Intl.PluralRules`), falling back to `other`. Both throw on inputs that are
  not exactly the placeholders as safe integers. The module imports nothing but
  the error class, so a client component imports it as
  `@landing-pages-websites/managed-site-contract/text-template` without the
  rest of the package.
- **Reading a page.** `matchManagedTextTemplateV1(template, text, rendered)`
  returns the numbers a rendered text was made with, or `null` when it is not
  exactly that template rendered. A coverage check reads an annotated element
  through it instead of comparing the element's text to the value.
- **Runtimes.** Which locales and plural categories a declaration may name,
  and how a number is written (a group separator is CLDR data), are read from
  the `Intl` of whatever parses or renders it. Site Guard, a site's build and a
  visitor's browser can carry different CLDR versions, so a page that renders
  a template on the client should compare like with like: `en` without
  grouping (the common case) is the same everywhere.
- **Compatibility.** A template is kept exactly or the change is narrowing:
  adding one refuses every value production holds, dropping one would show
  tokens as braces, and changing a placeholder, its format, the plural or the
  locale changes what a stored value means. The text limits widen as before.
- **Migrations.** A template field cannot be a merge or link source or target
  (`MIGRATION_TRANSFORM_DEFERRED`): its tokens would arrive as literal braces.

`test/cms-text-template-rule-cases.json` is the adversarial table this package
and megaseo-web's CMS writer (SQL and TypeScript) are each held to. Keep every
copy byte-identical.

## Attribute text: labels, placeholders, titles

Some words a customer owns are not an element's text but one of its
attributes: a navigation's screen-reader label (`aria-label="Primary"`), a menu
button's "Open menu", a search box's placeholder, an iframe's title, a
decorative image's description. A `plain_text` field may declare
`constraints.attribute` (0.24.0) to render into exactly that attribute.

- **The attributes:** `aria-label`, `aria-roledescription`, `placeholder`,
  `title`, `alt` (`MANAGED_TEXT_ATTRIBUTES`), lowercase, exactly as listed.
  Anything else (`href`, `src`, `style`, `class`, `id`, an `on*` handler, a
  different case) is refused. `alt` is for an image that is not an image
  field: an image field writes its own `alt`.
- **The declaration:** `label` or `caption` semantics, `newlines: "forbid"`,
  `minLength` at least 1, `maxLength` at most 512
  (`MAX_MANAGED_ATTRIBUTE_TEXT_CHARACTERS`), and no `template`.
- **The value:** no control, bidi-control or line-separator character, and
  never blank: a value of only White_Space or zero-width characters
  (`MANAGED_ATTRIBUTE_TEXT_BLANK_CODE_POINTS`) is refused (`FIELD_VALUE_TEXT`),
  because an empty screen-reader label is worse than the one it replaced.
  `managedAttributeTextRefusal` names the CMS's reason (`unsafe_character`,
  then `blank`). Markup and quotes in a value are only text: a renderer sets the
  attribute (`aria-label={value}`), which escapes them.
- **The binding:** never `data-gomega-field-id`. An editor writes a text field by
  replacing the element's children, so a `<nav>` annotated as a text field would
  lose its links on the first edit. Spread
  `managedSiteAttributeFieldAttributesV1(attribute, fieldId, itemId?)` onto the
  element beside the attribute itself:

  ```tsx
  <nav aria-label={nav.value} {...managedSiteAttributeFieldAttributesV1("aria-label", nav.fieldId)}>
  ```

  It returns `data-gomega-attr-<attribute>="<field id>"` and, for an item's
  copy, `data-gomega-attr-<attribute>-item="<item id>"`. Each binding names its
  own item, never the element's `data-gomega-item-id`, so one element can be a
  text field and several attribute fields at once. A field is one kind of place
  everywhere: the same field bound as text in one element and as an attribute
  in another, or as two attributes, makes the editor refuse the page. A button
  whose label changes with its state (`aria-label={open ? close : open}`)
  switches its binding with it.
- **The editor:** review bridge v12 and later reports and previews these
  places; an attribute place is hovered but never takes a click, so the page's
  own button still opens a menu. It counts toward the 1,024 places a page may
  hold.
- **Compatibility:** the attribute is kept exactly; adding, dropping or
  changing it moves where a stored value renders. The text limits widen as
  before.
- **Migrations:** an attribute field cannot be a merge or link source or target
  (`MIGRATION_TRANSFORM_DEFERRED`).
- **Conversion:** the converter does not yet propose attribute fields: it reads
  `aria-*` as code-owned and `title` / `placeholder` as an unknown attribute
  role, so a converted site gains them by hand or by a later converter change.

`test/cms-attribute-text-rule-cases.json` is the adversarial table this package
and megaseo-web's CMS writer (SQL and TypeScript) are each held to. Keep every
copy byte-identical.

## Generated pages: search patterns and overrides

Since 0.26.0 a generated page's search title and description can be the
customer's: written once for every page the route serves, with each item's own
words filled in, and optionally overridden page by page. The page declares a
search-pattern field (a `plain_text` field with `semantic: "seo_title"` or
`"seo_description"` and `constraints.pattern`), and the route collection an
item override field of the same semantic:

```json
"constraints": {
  "minLength": 1, "maxLength": 160, "newlines": "forbid",
  "pattern": { "placeholders": [{ "name": "name" }] }
}
```

```json
"metadata": {
  "title": "field_<item override, seo_title, minLength 0>",
  "titlePattern": {
    "fieldId": "field_<the page's seo_title pattern>",
    "sources": [{ "placeholder": "name", "fieldId": "field_<item heading>" }]
  },
  "description": "field_<item override, seo_description, minLength 0>",
  "descriptionPattern": { "fieldId": "field_...", "sources": [ ... ] },
  ...
}
```

A page serves, per item, the override when it holds text (JavaScript `trim()`),
else the pattern with each `{placeholder}` replaced by the item's text:
`managedGeneratedSeoTextV1(contract, content, pageId, itemId, slot)` decides it,
and `renderManagedGeneratedSeoTextV1` / `renderManagedSeoPatternV1` are the
zod-free parts (also in `./text-template`). Item text is inserted verbatim, in
one pass, so a name holding `{city}` or `$&` is written as it is.

The rules (`CONTRACT_SEO_FIELD_POLICY` unless noted):

- a slot names a protected item field (every generated page before 0.26.0) or
  the item's editable search text: customer-editable `plain_text` of the slot's
  semantic, one line, at most 320 characters, no template, pattern or attribute.
  With a pattern it is the optional override (`minLength` 0); without one it is
  the text itself and must hold some (`minLength` >= 1). A protected slot takes
  no pattern;
- a pattern is this page's own search-pattern field of the slot's semantic,
  declared on the page, used once, `scope: "page"`; its sources fill exactly its
  placeholders, each from customer-editable item text of the route collection
  that is one non-empty line (running-text `plain_text`, or `heading_text`)
  (`CONTRACT_REFERENCE_SCOPE` for a field outside it);
- a pattern field is named from that pattern only, and a static page's search
  field never declares a pattern (a static page has no item to fill it);
- an item's search field is named from one generated page's slot, and otherwise
  only from that slot's social echo; a social echo is null, a protected field,
  or the slot's own field;
- a pattern's value is held to the template value rule (each token exactly
  once, no other brace) and to search text's unsafe-character rule.

Canonical and indexing stay protected: a URL derives from the route.

## Page text filled from a generated page's item

Since 0.38.0 a generated page's own text may name its item: "Build Your
{name} Network." or "{name} FAQ", written once for every page the route
serves. It reuses the search pattern (0.26.0): the field's
`constraints.pattern` declares one placeholder per token, and here each
placeholder names the route collection's item field that fills it:

```json
"constraints": {
  "minLength": 1, "maxLength": 120, "newlines": "forbid",
  "pattern": { "placeholders": [{ "name": "name", "fieldId": "field_..." }] }
}
```

The invariant: every token is filled, on every page it renders on, by one
line of the customer's text from the item that page serves. So:

- a plain-text field (running text: `body`, `label`, `caption`) or a heading
  may hold one; every placeholder names its `fieldId`, or none does (a search
  pattern, whose sources its SEO descriptor states). A heading's pattern
  always names them; search text never does;
- the field is its generated page's own: page-scoped, customer-editable, used
  once on that page; each source is an item field of that page's route
  collection holding one non-empty, customer-editable line
  (`isManagedPatternSourceField`, the search pattern's rule); an item field
  never holds one (`CONTRACT_ITEM_PATTERN`; a source outside the collection is
  `CONTRACT_REFERENCE_UNRESOLVED`);
- the value holds each token exactly once and no other brace, the template
  value rule;
- a code change keeps a pattern exactly, search or item text alike: adding,
  dropping or re-sourcing one is `COMPATIBILITY_FIELD_POLICY_NARROWED`
  (dropping would show stored tokens as braces). Before 0.38.0 a search
  pattern's change was not compared;
- a field migration never moves a pattern's text (`isManagedTokenTextField`,
  `MIGRATION_TRANSFORM_DEFERRED`), as it never moves a template's.

`managedItemPatternTextV1(contract, content, fieldId, itemId)` is what an
item's page shows. The converted-site runtime reads such a field with
`managedItemPatternText(fieldId, itemId)`, never `managedText`, which would
show its tokens.

## Read-only views of a collection

Since 0.39.0 a section may declare `views`: the page shows a subset of another
collection's items that code chooses ("the two case studies most relevant to
this industry"), and those cells are the items' own fields:

```json
{ "id": "section_...", "presentation": { ... }, "fields": [],
  "views": [{ "collectionId": "collection_..." }] }
```

The invariant: every item a view can show is an active item of a page-ordered
collection, edited on the view's page only through its own fields. So the
viewed collection is listed by a page field elsewhere (its order lives
there), is not a list inside an item, and a page views it at most once and
does not also list it (`CONTRACT_COLLECTION_VIEW`). A view has no value and no
capabilities: an editor offers the items' fields there, never reorder, add or
remove. `views` absent is no view; an empty list is refused.

A view renders its items' fields, so their headings count on the page
(`managedRenderedH1Sources`; a route H1 stays its own page's), and an item's
own list inside it is that item's field, edited with its own capabilities. A
code change may add or drop a view (it holds nothing), still held to every
other rule: a page with no H1 that gains a view of a collection with a level 1
heading item field adopts it as an H1 source, exactly as a list would, and
from then on keeps it. A retire of a collection (0.29.0) takes every view of it
with it, as it takes its placements: each section that viewed it keeps exactly
its other views (a view repointed to another collection is refused,
`MIGRATION_RETIRE_REFERENCED`). `managedPageRenderedCollections(contract,
pageId)` is the one statement of which collections render on a page;
`managedPageCollectionViews` lists a page's views and
`managedCollectionPageIds(contract, collectionId)` reads the same rule the
other way (lists, views, its generated page, and a nested list's parent
pages), which is what a coverage gate reads as "declared on this page".

## Lists inside items

Since 0.27.0 an item field may be `type: "collection"`: each item holds its own
ordered list of another collection's items ("Networks > Healthcare > its
venues"). The listed (nested) collection is an ordinary collection whose
resolver holds every item of every list as one pool; each parent item's field
holds `{ "orderedItemIds": [...] }` for its own:

```json
{
  "id": "field_...", "type": "collection", "classification": "customer_editable",
  "capabilities": ["collection.reorder", "collection.add", "collection.remove"],
  "itemPointer": "/venues", "presentation": { ... }, "collectionId": "collection_..."
}
```

Contract semantics (`CONTRACT_NESTED_COLLECTION`): the nested collection is
declared, is not the parent itself, is listed by exactly one item field and by
no page field, is no generated page's route, and lists nothing itself (one level
deep). Content semantics: every nested item sits in exactly one list
(`CONTENT_NESTED_ITEM_SHARED` for two), an item in no list is an orphan
(`CONTENT_ITEM_ORPHAN`), each list is held to the nested collection's
`minItems`/`maxItems` and duplicates (`CONTENT_COLLECTION_POLICY`), and a
uniqueness rule holds within each list, so two parents may each list the same
words. Removing a parent item therefore removes its list's items with it, or the
content is refused. The capabilities decide what an editor offers: reorder, add
and remove, each on its own.

## Hiding a page from search engines

Since 0.34.0 a page's search entry may name a "Hide this page from search
engines" toggle: `metadata.hiddenFieldId`, on a static page's entry and on a
generated page's. A toggle is a field of type `toggle` (value `true` or
`false`, capability `toggle.set`) whose `semantic` is one the platform knows;
`seo_hidden` is the only one, so a toggle is declared only for a switch the
platform can show and explain:

    { "id": "field_...", "type": "toggle", "semantic": "seo_hidden",
      "classification": "customer_editable", "capabilities": ["toggle.set"],
      "scope": "page", "usages": [{ "pageId": "page_...", "itemId": null }], ... }

The invariant: a page's search visibility is decided by its own toggle and
nothing else's, the toggle switches exactly that and is named from exactly
that one place, and a code change never takes the switch away once the
customer has it. So:

- a static page's toggle is its own: customer-editable, page-scoped, declared
  on the page and used once on it. A generated page's is an item field of the
  collection its route iterates, customer-editable, so each item has its own.
  Anything else is `CONTRACT_SEO_FIELD_POLICY`;
- a `seo_hidden` toggle is named by exactly one entry's `hiddenFieldId` and by
  nothing else (another entry, an outline, JSON-LD, an alias group, a
  reference path added later), else `CONTRACT_SEO_FIELD_POLICY`;
- a code change may adopt a toggle on an entry that has none
  (`metadata.hiddenFieldId` is the one page fact a candidate may add,
  `MANAGED_SEO_ADOPTABLE_FACTS`), and never drop or swap it once production
  has one (`COMPATIBILITY_PAGE_SEO_CHANGED`, or the field's own removal).
  Adopting changes nothing a page or item serves: its `index` and `follow`
  must read the same before and after, so the first value is `true` exactly
  where production serves `noindex, nofollow` and `false` where it serves
  `index, follow`, and a page served `index, nofollow` (or the reverse)
  cannot adopt one (`COMPATIBILITY_SEARCH_VISIBILITY_CHANGED`). Once a toggle
  is production's, its value is the customer's, held as any content;
- everything that judges whether a page is indexed reads it the same way,
  `managedServedIndexingV1` (`managedServedItemIndexingV1` for an item): the
  toggle when there is one, else the protected directives. The redirect rule
  (a redirect may only move to an indexed page) reads it so, and a site's
  sitemap should leave out what `managedSearchHidden` (runtime) reports
  hidden;
- a page retire (0.30.0) takes a page's toggle with it;
- the canonical is never a customer's: it stays a protected field, derived
  from the route.

`managedSearchHiddenV1(contract, content, pageId, itemId?)` reads a page's
(or an item's) toggle, `null` when its entry names none, and
`managedSearchRobotsV1(hidden)` is what it serves: hidden is `{ index: false,
follow: false }`, shown `{ index: true, follow: true }`. The `indexing` slot
still names the protected directives for everything else (snippet and preview
limits). The converted-site runtime applies it in `managedMetadata` and
`managedItemMetadata`, and exports `managedSearchRobots` for a site that builds
its own metadata, and `managedSearchHidden` for its sitemap. Robots, and a
`googleBot` they state, must be objects when a page has a toggle (a string
form fails the build), the toggle decides `index` and `follow` for every
crawler stated, and
the metadata passed must be the page's effective metadata, as for share
cards: Next replaces a layout's robots with a page's whole.

## Icons chosen from the site's set

Since 0.28.0 a field may be `type: "icon"` (on a page or an item, capability
`icon.choose`): the customer picks one icon from a set the site declares, and
the site renders the chosen name with its own icon component.

```json
"constraints": {
  "library": "lucide",
  "choices": [
    { "name": "heart-pulse", "label": "Healthcare" },
    { "name": "landmark", "label": "Government" }
  ]
}
```

- `library` is `lucide` (`MANAGED_ICON_LIBRARIES`), so the editor can draw the
  same icons by name. Names are the library's kebab-case names
  (`isManagedIconName`, at most 64 characters); 1 to 200 unique choices, each
  with the label the picker shows.
- The value is the chosen name, a string; one outside the choices is
  `FIELD_VALUE_ICON`.
- A code change may add a choice or change a label, never drop or rename one a
  stored value may hold (compatibility), and never change the library.

## Optional item images

Since 0.36.0 an item's image field (and since 0.37.0 its link field, below) may be declared `optional: true`: an item
may go without a picture ("a network with no honest photo yet"). Absent means
required, exactly as every image was before; there is no `false` spelling.

```json
{
  "id": "field_...", "type": "image", "classification": "customer_editable",
  "capabilities": ["image.upload", "image.alt.edit"], "itemPointer": "/photo",
  "presentation": { ... }, "assetSlotId": "asset_...", "optional": true
}
```

The invariant: an item's image value is `null` only where its field is
declared optional; a `null` is no picture, and nothing that needs a picture on
every item may name such a field. So:

- the value is an image or `null` (the item's source holds `null` at the
  field's pointer; a missing key is still `CONTENT_ITEM_VALUE_MISSING`). A
  `null` anywhere else (a required item image, a page's image) is
  `CONTENT_VALUE_POLICY` in content semantics; `validateManagedFieldValue`,
  which judges a page field's value, names a page image holding none
  `FIELD_VALUE_IMAGE_REQUIRED`;
- a `null` is no material: it needs no asset manifest entry, and every entry
  of a slot an image field declares must be shown by some value, so material
  only a removed picture named must leave the manifest, even when every item
  is empty (`CONTENT_ASSET_MANIFEST_UNUSED`). A slot only SEO names keeps its
  one entry;
- only an item field may be optional (a page's image is one value, always
  shown); `isManagedOptionalItemField` reads the declaration;
- nothing that reads an item field on every item may name an optional one:
  every item-field reference the occurrence registry classifies (a generated
  page's share or primary image, a JSON-LD source, a search slot, an outline
  entry, an intent, and any added later) is refused
  (`CONTRACT_OPTIONAL_FIELD_REFERENCE`), and no uniqueness rule may name an
  optional field (two items without a picture are not the same picture);
- a customer who may empty it can fill it again: a customer-editable optional
  image grants `image.upload`, and `image.alt.edit` when its slot is
  informative (a first informative picture needs alt text)
  (`CONTRACT_OPTIONAL_FIELD_POLICY`); a code-owned one needs none;
- a code change may make a required image optional, never an optional one
  required (`COMPATIBILITY_FIELD_POLICY_NARROWED`): production may hold an
  item with no picture.

Once the platform adopts this version, its editor offers "Add image" and
"Remove image" on such a field. The
converted-site runtime reads it with `managedItemById(...).optionalImage(fieldId)`,
`null` when the item holds none, so the site renders nothing in its place;
`image(fieldId)` refuses an optional field and `optionalImage` a required one,
so code always handles the absence a customer can create. An empty image
renders no element, so there is nothing in the preview to click: the editor
offers "Add image" from its field panel.

## Optional item links

Since 0.37.0 an item's link field may be declared `optional: true`, exactly as
an image may (0.36.0): an item may have no link ("a case study with no PDF").
Its value is a link or `null`, by the same rules:

- `null` only on an optional item link (`CONTENT_VALUE_POLICY`;
  `FIELD_VALUE_LINK_REQUIRED` from `validateManagedFieldValue`), and the item's
  source holds `null` at the field's pointer (a missing key is still
  `CONTENT_ITEM_VALUE_MISSING`); a `null` names no page;
- a held link is judged exactly as a required one (label, destination, window);
- a customer who may empty it can fill it again: a customer-editable optional
  link grants `link.label.edit` and `link.destination.edit`, and
  `link.target.edit` when it admits more than one window
  (`CONTRACT_OPTIONAL_FIELD_POLICY`);
- no uniqueness rule and no item-field reference may name it
  (`CONTRACT_OPTIONAL_FIELD_REFERENCE`, 0.36.0's rule); required may become
  optional, never back (`COMPATIBILITY_FIELD_POLICY_NARROWED`).

Once the platform adopts this version, its editor offers "Add link" and
"Remove link". The converted-site runtime
reads it with `managedItemById(...).optionalLink(fieldId)`, `null` for no
link; `link(fieldId)` refuses an optional field, `optionalLink` a required one,
and `resolveManagedLink(null)` refuses (an empty value is never an anchor).

## Field migrations

The compatibility policy refuses any change to a production value, so a
change that reshapes fields (two plain-text fields becoming one rich-text
heading, say) cannot pass it however faithful the new value is. Since 0.15.0
such a change can be declared and proved instead.

A site commits the declaration beside its contract as
`managed-site.migration.json` (`MANAGED_SITE_FIELD_MIGRATION_FILE`, schema in
`schema/managed-site.migration.v1.schema.json`):

    { "schemaVersion": "1.0",
      "from": { "contractSha256": "...", "contentSha256": "..." },
      "bridge": { "from": "v8", "to": "v9" },
      "steps": [{ "op": "merge", "target": "field_...",
                  "into": { "type": "rich_text", "block": { "type": "heading", "level": 2 } },
                  "parts": [{ "source": "field_..." }, { "literal": " " },
                            { "source": "field_...", "marks": [{ "type": "italic" }] }] }] }

A part is a source or a literal, with optional declared `marks`, and since
0.19.0 an optional `"joinedBy": "hard_break"`: the part meets the one before it
through one `hard_break` node instead of directly. It is declared on the part,
never inferred, because a line of a block may be several parts (`"Activate"`, a
literal `" "`, an italic `"Real-World"`): the first part has none, and only a
paragraph or heading target takes one (not plain text, not list items).

`from` is the sha256 of the canonical production contract and content, as
`normalizeManagedSiteArtifactsV1` digests them (`managedSiteFieldMigrationFromV1`
computes it), so a declaration written against other production artifacts is
refused. `bridge` is present only when the bridge changes. The ops are
`merge`, (since 0.21.0) `retire`, (since 0.22.0) `link`, (since 0.40.0)
`rescope` and (since 0.42.0) `image-metadata`
(`MANAGED_SITE_FIELD_MIGRATION_OPS`); anything else (split, rename, type
widening, alias groups) is refused with `MIGRATION_TRANSFORM_DEFERRED`. Merge
still defers collection item fields; `link` takes them one value per item,
and (since 0.29.0) `retire` takes them only with their whole collection.

`validateManagedSiteContractV1MigrationCompatibility(production contract,
production content, candidate contract, candidate content, declaration,
{ admitBridge })` holds one invariant: every production value is either
unchanged in the candidate or consumed by exactly one step, and each step's
target is exactly `F(sources, parts)` in canonical JSON. `F`
(`applyManagedSiteFieldMigrationStepV1`) is pure: a source's text with its own
marks, a part's declared marks outermost, adjacent runs with identical marks
joined, a bullet list holding one item per part, and one `hard_break` before
each part declared `joinedBy` (runs on either side of a break never join, even
with identical marks). Reading the target back
(`readBackManagedSiteFieldMigrationStepV1`) must give each source's text with
its original marks and the target's breaks exactly where the parts declare
them, none moved, dropped or added. Beyond that:

- a break is only ever the node: a part whose text holds a control character
  (a newline, a tab) is `MIGRATION_TRANSFORM_DEFERRED`, and a source that
  already holds a break stays deferred. A break sits between two lines that
  each hold text (an empty part beside a break is
  `MIGRATION_HARD_BREAK_EMPTY_LINE` too), so a line of only empty or space parts is
  `MIGRATION_HARD_BREAK_EMPTY_LINE`. The target admits breaks only by its own
  constraints: `allowHardBreaks`, and the declared breaks within
  `maxHardBreaks`, else `MIGRATION_TARGET_CONSTRAINTS`; each break is listed in
  the proof as a `hard_break` item;

- the contract id and adapter are unchanged; the bridge is unchanged, or moves
  one supported version forward and `admitBridge(version, integrity)`, which
  the caller supplies and which has no default, says the platform serves it;
- a source is a live production page or site field, claimed once, no longer
  declared, and tombstoned in the candidate;
- a target is new (never declared, never tombstoned), customer-editable, of
  the declared type, shares its sources' scope and owner and is shown on
  exactly the pages each of them was (its `usages`), and its constraints
  admit F's value, so a declared mark, block or link its policy refuses fails
  as `MIGRATION_TARGET_CONSTRAINTS`;
- a source keeps the structure a reader or crawler sees: a `heading_text`
  source goes only into a rich-text heading at exactly its `semanticLevel`,
  and a rich-text source keeps its block type and level, so flattening either
  into plain text, a paragraph, a list item or another level is refused
  (`MIGRATION_SOURCE_STRUCTURE_LOST`); a step joins at most one heading or
  rich-text block, so no block boundary is lost. A `heading_text` that no
  outline names is a line of a heading, not a heading the contract can see
  (the converter declares each line of a split heading, a TextReveal or a
  `<br>`, as its own field), so since 0.19.0 the lines of one heading count as
  one block, provided they share a level and are consecutive fields of one
  section with nothing declared between them, and the declaration separates
  each pair (a break, or a literal part, never nothing)
  (`MIGRATION_SOURCE_STRUCTURE_LOST` otherwise); a heading the outline names,
  and any rich-text source, still counts as its own. Plain text keeps its role:
  only running text (`body`, `label`, `caption`) may merge, and every other
  role in the schema's enum (phone, email, address, legal, search text, and
  any role added later) carries structured meaning and is deferred; only a
  label or caption may become a heading, never body copy
  (`MIGRATION_SEMANTIC_CHANGED`). The block running text lands in comes from
  code, and the proof's block item names it with each source's role
  (`heading:2`, `label`, `body`, `rich_text`) and the target's. A plain-text
  target whose role differs from a source's (`body` made `label`) is named
  in a `role` item; for a rich-text target the block item is the authority;
- references follow the occurrence registry, the authority on where a
  contract names a field. Only a heading-outline entry may name a source: it
  names a heading, and the target renders that heading. Any other reference
  (JSON-LD, intent, business identity, an alias group) reads the field's
  value, and a merged target holds more than one source did, so it is
  deferred (`MIGRATION_TRANSFORM_DEFERRED`). Every outline that named a source
  must name its target instead, at the same level (other entries are the
  ordinary policy's business, so an unrelated heading added to the same
  outline blocks nothing). Since 0.16.0 where every entry sits is the
  ordinary URL and SEO rule's, run with production read through the
  migration (each source renamed to its target, since 0.16.2 only where the
  occurrence registry declares a global field reference; any other string
  equal to a source, such as a JSON-LD `schemaType` or
  `requiredOutputProperties` literal, is compared verbatim): entries may move, as they
  should when a target renders elsewhere, and each move is listed as a
  `seo_reordered` item, exactly as the ordinary result's `reorderedSeo`
  lists it; nothing may be dropped or re-levelled.
  No other reference may name a target
  (`MIGRATION_REFERENCE_CHANGED`); an outline must give a target the level its
  heading renders (`MIGRATION_OUTLINE_LEVEL_MISMATCH`). One exception, since
  0.19.0: a level 1 rich-text target may add the one level 1 outline entry, per
  outline, that no source had, listed as an `outline_entry` item, because content semantics
  require every rich-text H1 to be outlined (`CONTENT_RICH_TEXT_H1_UNDECLARED`)
  and a `heading_text` H1 never was; the page's H1 itself stays the H1 rule's
  (a page keeps the H1 fields production had, read through the migration, or a
  page that had none adopts one, listed as `h1_adopted`). Routes, redirects
  and every other SEO fact are held by the ordinary URL and SEO rule, exactly
  as for any change, except that a migration may not move a production page
  (`COMPATIBILITY_ROUTE_REMOVED`) or add or change a redirect
  (`COMPATIBILITY_REDIRECT_CHANGED`): its proof does not list URLs;
- every other compatibility rule holds for everything the migration does not
  retire, and the candidate content passes content semantics.

### Retiring fields

Since 0.21.0 a step can remove customer-editable fields, and the sections
they leave empty, that are in production content:

    { "op": "retire",
      "fields": ["field_...", "field_..."],
      "sections": ["section_..."] }

The invariant: a retire removes exactly the declarations it names and their
values, the page serves the same words afterwards, and everything else is
held by the same rules as any other change. So:

- a retired field is a field a page renders and a customer edits
  (`customer_editable`). A protected SEO field is
  `MIGRATION_RETIRE_PROTECTED` and a code-owned field
  `MIGRATION_RETIRE_NOT_EDITABLE`, because removing either is not a content
  decision; a collection item field or an aliased field is
  `MIGRATION_TRANSFORM_DEFERRED`; an id production does not declare is
  `MIGRATION_RETIRE_UNKNOWN`;
- the removal is real: the candidate no longer declares the id
  (`MIGRATION_RETIRE_STILL_DECLARED`), tombstones it
  (`MIGRATION_TOMBSTONES_INCOMPLETE`) and holds no value for it
  (`MIGRATION_SOURCE_VALUE_REMAINS`). A field is claimed once across every
  step, merge sources included (`MIGRATION_RETIRE_CLAIMED_TWICE`, and a
  repeat within one step is `MIGRATION_DECLARATION_INVALID`). Removing a
  declaration no step names is still `COMPATIBILITY_DECLARATION_REMOVED`, and
  removing a value no step names `MIGRATION_UNDECLARED_CHANGE`;
- a section may be named only once the migration empties it: every field
  production declared in it is merged or retired
  (`MIGRATION_RETIRE_SECTION_NOT_EMPTY`). A section emptied but not named
  stays declared, empty;
- nothing may still read a retired id. Every production reference the
  occurrence registry finds (an outline, JSON-LD, intent, business identity,
  a collection, an occurrence the registry defers) is
  `MIGRATION_RETIRE_REFERENCED`, with one exception: a static page's own
  search title or description slot that names the retired field, when the
  slot's share-card echo is a protected field production and candidate both
  keep and that field holds, for that page, exactly the text the retired
  field holds. That slot falls back to its echo: production is read with the
  field renamed to the echo, so the ordinary URL and SEO rule requires the
  candidate to point the slot at the echo and keep every other fact, and the
  proof lists it as a `seo_repointed` item. This is the inverse of the
  editable re-point the ordinary policy admits. A slot whose text differs
  from its echo's (a customer edited it, cleared it, or added a space) is
  refused, because the page would serve other words.

#### Retiring a whole collection

Since 0.29.0 a retire step can name collections, with or without fields:

    { "op": "retire",
      "collections": ["collection_..."],
      "sections": ["section_..."] }

At least one of `fields` and `collections` is named; the published schema
says so too (an `anyOf` projected from the list the parser reads), so a
schema-only consumer refuses `{ "op": "retire" }` and a sections-only step.
A collection carries
what lives under it, derived from production rather than listed: its item
fields, every value its items hold, and every page field of type
`collection` that places it (its "placement", the list's order value). The
same invariant holds over all of it:

- a placement goes with its list whatever its classification. A code-owned
  placement is how a list reaches a page, so it is not a content decision of
  its own; naming it in `fields` is still `MIGRATION_RETIRE_NOT_EDITABLE`.
  Every item field goes too, `customer_editable` or code-owned: the values a
  customer holds in them are exactly what Site Guard's content checks
  protect. A protected item field (a generated page's search fact) is
  `MIGRATION_RETIRE_PROTECTED`, so a generated page's collection is never
  retired; a list inside an item (an item field of type `collection`, or a
  collection placed by one), an image item field (its asset slot and manifest
  entries would have to go too, which is not proven yet) and an aliased
  placement are `MIGRATION_TRANSFORM_DEFERRED`;
- the collection, each item field and each placement are claimed like a
  named field (`MIGRATION_RETIRE_CLAIMED_TWICE`), and each must be undeclared
  and tombstoned in the candidate (`MIGRATION_RETIRE_STILL_DECLARED`,
  `MIGRATION_TOMBSTONES_INCOMPLETE`), with no value left on any of them
  (`MIGRATION_SOURCE_VALUE_REMAINS`). Every item the collection held in
  production is tombstoned too (`MIGRATION_TOMBSTONES_INCOMPLETE`), so no
  candidate can list a retired item again, in a new list or a kept one
  (`CONTENT_ITEM_TOMBSTONED`), and nothing keyed on an item id can re-attach
  to an item that means something else. A placement counts toward emptying a
  named section;
- dropping some items, or some item fields, is not a retire: without the
  whole collection it is `MIGRATION_UNDECLARED_CHANGE` or
  `MIGRATION_TRANSFORM_DEFERRED`;
- nothing that stays may name the collection, a placement, an item field or
  one of its items (read from production content: the placements' order and
  the item values' owners). A contract occurrence is
  `MIGRATION_RETIRE_REFERENCED` unless it sits inside the retired collection
  or placement itself (a placement's `collectionId`, the collection's
  uniqueness rules), which goes with it, and so is any production value that
  stays and spells one of those ids anywhere in it (a link to an item since
  0.25.0, a rich-text link mark, anything else), read structurally over every
  value.

The proof lists each retire step at its position among the steps: the
fields with their owners, pages and sections, the sections removed and, only
when the step names collections, each collection with its placements (as
fields), item fields and items (sorted). A step naming no collection proves exactly what it
did before 0.29.0. The accounting counts the removed values as consumed.

A caller that accounts for what it retired before the candidate exists (the
converter's ledger) reads what a declaration carries with
`managedSiteFieldMigrationRetireCarriedIdsV1(productionContract,
productionContent, declaration)`: each named collection's placements, item
fields and items, from production alone, through the same derivations the
verifier claims them by.

What the package cannot see is the platform's: whether a customer has an
open draft on a retired field (an item field or a list's placement
included, so an item added, removed or reordered in a draft counts), a
change on its way to production, or a published value code never wrote
(a customer's item, edit or reorder). Site Guard (megaseo-web) judges those from
the production chain before a retire is admitted, and refuses when it cannot
tell.

#### Retiring a whole page

Since 0.30.0 a retire step can name static pages, and then names nothing else:

    { "op": "retire", "pages": ["page_..."] }

The published schema says so too (`if: { required: ["pages"] }, then:
{ propertyNames: { enum: ["op", "pages"] } }`). A page carries what is its
own, derived from production rather than listed: its sections, every field
it declares (whatever its classification), every page-scoped protected field
only it renders (its search title, description, canonical and indexing slots,
which are code's and go with the page; naming one in `fields` is still
`MIGRATION_RETIRE_PROTECTED`), and its search entry. A site-scoped protected
field is the site's, never the page's, even when only the page renders it. Every field that stays
and also rendered on the page loses that usage and nothing else. The
invariant: a retired page takes exactly that, with every value on it, and
everything else is held to the ordinary rules unchanged. So:

- the page is judged against production before the candidate is read. A page
  production does not declare is `MIGRATION_RETIRE_UNKNOWN`; one named twice,
  across steps, `MIGRATION_RETIRE_CLAIMED_TWICE`. A generated page, a page
  placing a list (retire the collection first), holding an image or an
  aliased field is `MIGRATION_TRANSFORM_DEFERRED`;
- a field it declares that another page also renders, and a field declared
  elsewhere (a site-scoped protected field included) that only it renders,
  which would be left rendering nowhere, are `MIGRATION_RETIRE_REFERENCED`;
- nothing that stays may name the page or anything it carries: a contract
  occurrence (another page's breadcrumb parent or required internal link, a
  redirect destination, the business identity, another page's outline, JSON-LD
  or search slot) is `MIGRATION_RETIRE_REFERENCED` unless it sits inside the
  page, its search entry or one of its own search slots, or is a field's usage
  record on the page (dropped with it); so is any production value that stays
  and spells one of those ids anywhere in it (an internal link, a menu entry,
  a rich-text link mark, an item link), or spells the page's URL (its path
  exactly, or an absolute URL on an origin the site's own canonicals name,
  whatever its query: another page's canonical, a link typed as external to
  the site itself), read structurally over every value. Production is read
  before any other step, so a field retire in the same declaration that
  removes the last link to the page does not help: retire the link first,
  then the page. A link field's `allowedQueries` entry for the page (since
  0.41.0) is not a reference that holds it: the candidate drops the entry
  with the page, and the verifier reads production without it, so no other
  narrowing is admitted with it (an entry for a page that stays still
  narrows);
- every id it carries is undeclared and tombstoned in the candidate
  (`MIGRATION_RETIRE_STILL_DECLARED`, `MIGRATION_TOMBSTONES_INCOMPLETE`);
- every other step and rule then runs against production with the pages
  removed (their declarations and values gone, their ids tombstoned, their
  usages dropped). Whatever the pages did not carry is held exactly as it
  would be without them: a value changed or dropped is
  `MIGRATION_UNDECLARED_CHANGE`, a usage dropped on a page that stays
  `COMPATIBILITY_FIELD_POLICY_NARROWED`, a redirect added from the retired
  path `COMPATIBILITY_REDIRECT_CHANGED`, and a field retire naming a field the
  page took `MIGRATION_RETIRE_UNKNOWN`. A new page at the retired path is an
  ordinary addition, listed in `additions.stableIds`.

The proof lists a page step at its position among the steps with empty
`fields` and `sections` and, under `pages`, each page with its path,
sections, fields (owner, section), protected fields (owner) and `unrendered`
(the fields that stay whose usage on it was dropped). The accounting counts
its values as consumed. `managedSiteFieldMigrationRetireCarriedIdsV1` carries
each named page's sections, fields and search slots.

Whether a customer holds content on the page (an open draft, an unpublished
change, a published value code never wrote, on any field it carries, search
slots included) is Site Guard's to judge, exactly as for a named field.

### Turning text into links

Since 0.22.0 a step can turn a plain-text field whose href lives in code (a
nav label read by index, a button label) into a customer-editable link field:

    { "op": "link",
      "source": "field_...", "target": "field_...",
      "links": [{ "item": "item_...",
                  "destination": { "kind": "internal", "pageId": "page_...", "fragment": null },
                  "target": "same_window" }] }

The invariant: a link step consumes exactly one plain-text value per owner and
writes one link value on a new field with the same owner, whose label is that
text byte for byte and whose destination and window are exactly the declared
ones, and nothing else changes. Whether the declared destination is the href
the site renders today is the site's build to prove: the package cannot see
code. So:

- the source is a production `plain_text` field a page renders
  (`MIGRATION_LINK_SOURCE_NOT_TEXT` for a heading, rich text, image or
  protected field), customer-editable (`MIGRATION_LINK_SOURCE_NOT_EDITABLE`),
  in a running-text role (`label`, `caption`, `body`; a structured role such as
  a phone number or search title is `MIGRATION_TRANSFORM_DEFERRED`, as is an
  aliased field). It is no longer declared, tombstoned and valueless in the
  candidate, and nothing may read it: any production reference the occurrence
  registry finds besides its declaration (an outline, SEO metadata, intent,
  JSON-LD, a uniqueness rule, a route key) is
  `MIGRATION_LINK_SOURCE_REFERENCED`, because a link field holds no plain text
  for it to read;
- the target is new (`MIGRATION_TARGET_EXISTS`, `MIGRATION_TARGET_TOMBSTONED`),
  a `link` field (`MIGRATION_TARGET_TYPE_MISMATCH`), customer-editable, and
  renders where the source did: in the same page section with the same scope,
  owner and usages, or as an item field of the same collection
  (`MIGRATION_LINK_PLACE_CHANGED`, `MIGRATION_SCOPE_MISMATCH`). Sources and
  targets are claimed once across every step, merges and retires included;
- a page or site field declares one link with no `item`; a collection item
  field declares one link per item, each naming its item once, and the
  declared items are exactly the items production holds a value for
  (`MIGRATION_LINK_ITEMS_MISMATCH`): an item left out, added, or from another
  collection refuses, so no value is dropped or invented;
- a destination is one the contract states exactly. An internal destination
  names a static page production and the candidate both declare, or (since
  0.31.0) one item of a generated page production and the candidate both
  declare over the same collection, where the item is active in production
  and of exactly that collection (`{ "kind": "internal", "pageId":
  "page_...", "itemId": "item_...", "fragment": null }`), with a fragment
  the target's `fragmentPolicy` admits. A generated page with no item, a
  static page with one, an item production does not hold, has tombstoned or
  holds in another collection are `MIGRATION_LINK_DESTINATION_UNEXPRESSIBLE`;
  an item the candidate stops serving is refused by the candidate's own
  content rules (or as an undeclared change). A code-owned label whose href
  is a detail page (`/work/<slug>`) so becomes a customer-editable item link
  once that page is a generated page. A merge step's declared link marks are
  held to the same rule (since 0.31.0), so a mark cannot name a page or item
  production does not serve where a link step could not. Since 0.41.0 a
  link step's internal destination may carry a `query`, judged by the
  target's `allowedQueries` like any value (`MIGRATION_TARGET_CONSTRAINTS`
  when the target does not declare it), so `/contact?type=strategy` becomes
  a customer-editable link whose href renders byte for byte as the code
  wrote it. A query that is not a map of tokens, or one on a merge step's
  link mark, is `MIGRATION_DECLARATION_INVALID`. An https URL keeps its query and fragment
  verbatim, and an email or phone destination is carried as declared. Each
  value is held to the target's own constraints (label length and newlines,
  authority, scheme, host policy, fragment, query, window), else
  `MIGRATION_TARGET_CONSTRAINTS`;
- each candidate value on the target is exactly
  `{ label: source text, destination, target }` in canonical JSON
  (`MIGRATION_TARGET_MISMATCH`), and there is one per declared link and no
  other (`MIGRATION_UNDECLARED_CHANGE`). A label a customer edited is carried
  over as the customer wrote it: the text is preserved, never re-derived.

The proof lists each link step at its position: `source`, `target` and the
owner of each value in the declaration's order, plus one `link_field` item in
`added` per value with its owner, destination and window, since the
destination is code's. The accounting counts the source values as consumed and
the link values as targets.

As with a retire, the platform judges what the package cannot see: Site Guard
refuses a link step while the source has an open draft or a change on its way
to production, or when its history cannot be attributed.

It returns a `ManagedSiteFieldMigrationProofV1`: the declaration's sha256,
the bridge step, the accounting (production values, unchanged, consumed), each
step's target, owner, sources and part offsets, `added`, every literal, mark,
link, hard break and block the declaration adds, an `outline_entry` item for each level 1 outline entry a rich-text H1 target adds, plus a `reordered` item for any step
whose sources were not side by side in production: joined in another order,
or with other fields declared between them (`interleaved`). Production's
order is the contract's declaration order, pages then sections then fields,
which the converter writes in rendering order; a hand-written contract is
held to that order, not to `presentation.order`. A `moved` item names text a
reader now sees somewhere else, with from and to: each source that rendered
in another section than its target's (#73 has two), and each target declared
out of production's order within its section, ranked by its source in that
section and judged by the fewest unchanged fields out of order, so a field
added or retired beside a target never makes it look moved, an unchanged
neighbour is never blamed for a target's move, and two targets that swap are
both named. A move is listed, not refused. A field is read on its usage page,
so a site-scoped target, or a page-scoped one declared off its usage page, has
no declaration place a reader sees and reports no move; its usages are bound
exactly instead. Section and page order stay the
ordinary policy's, as for any change, and a section a merge empties stays
declared (#73 keeps two empty), because removing a declaration is refused.
Then `additions`, every declaration, value
and asset entry the candidate adds outside any step, read from the diff rather
than from the declaration. Added material comes from code, not content; it is
allowed, and listed so a reviewer sees each item. The accounting holds both
ways: production values are unchanged or consumed, and candidate values are
unchanged, a target, or a listed addition.

A site's CI can run the same check:

    gomega-managed-site-conformance migrate --production-contract <path> \
      --production-content <path> --contract <path> --content <path> \
      --migration <path> [--admit-bridge <version>=<integrity>]

The CLI cannot see what the platform serves, so a bridge change passes only
when `--admit-bridge` names exactly the candidate's version and integrity.

Site Guard runs this check whenever the candidate carries a
`managed-site.migration.json` that differs from production's, and the merge
advance records the migration in the platform's field-migration ledger. A
copy byte-identical to production's is an applied migration: Site Guard
ignores it and runs the ordinary policy.

### Moving a page field to site scope

Since 0.40.0 a declaration may move one page-scoped field to site scope when
its usages grow to another page ("the home page's network builder copy also
shows on two solution pages"):

```json
{ "op": "rescope", "field": "field_...", "scope": "site" }
```

An ordinary code change cannot do this: a page field's value is owned by its
page and a site field's by the site, so the value's identity changes, and a
customer's open draft or unpublished change on the page owner would be
stranded. A declared step lets the platform refuse while such work is in
flight and record the move in its ledger. The invariant: the field keeps its
id, its policy and every production usage; its one value moves,
byte-identical, from its page's owner to the site's; nothing else changes.

- the field is a page-scoped plain-text, heading, rich-text, link, image or
  icon field, not aliased (`MIGRATION_RESCOPE_NOT_PAGE`,
  `MIGRATION_TRANSFORM_DEFERRED` for a list or toggle, whose value means one
  page's order or switch);
- the candidate declares it in the same section, site-scoped, identical but
  for `scope` and `usages` (`MIGRATION_RESCOPE_NOT_SITE`,
  `MIGRATION_RESCOPE_MOVED`, `MIGRATION_RESCOPE_POLICY_CHANGED`), keeping
  every production usage (`MIGRATION_RESCOPE_USAGE_DROPPED`);
- the candidate holds exactly one value for it, production's under
  `{ "kind": "site" }` (`MIGRATION_TARGET_MISMATCH`);
- it is claimed once: no other step may rescope, merge, retire or link it;
- every other rule runs as before, so a page the field newly renders on is
  still held to its H1 and SEO rules.

The proof's step is `{ op: "rescope", field, from: { kind: "page", pageId },
to: { kind: "site" } }`; its value counts as consumed and as the step's
target, and `added` lists `{ kind: "rescope", field, addedUsages }` (every usage it adds).

### Correcting an image's derived metadata

Since 0.42.0 a declaration may correct what production states about an image
file whose bytes do not change: its `mimeType`, `width`, `height` and
`bytes`. A JPEG stored 1500x1125 with EXIF orientation 6 is shown 1125x1500 by
every browser, so a value that says 1500x1125 is wrong, and the ordinary
policy refuses any change to a production value (`COMPATIBILITY_*`):

```json
{ "op": "image-metadata",
  "images": [{ "path": "public/venues/photo.jpg", "mimeType": "image/jpeg",
               "width": 1125, "height": 1500, "bytes": 179874 }] }
```

The invariant: only the metadata derived from the file moves, on every value
and asset manifest entry naming the path, and only to exactly what the
committed file's own bytes derive, bound to production's digest; the path,
digest, alt text, crop and focal point stay exactly as they are. A value a
customer edited is fine: nothing they chose moves.

- the verifier reads the file itself through `options.readImageFile(path)`,
  which returns the committed bytes from the candidate's tree or `null`;
  without a reader the step is refused (`MIGRATION_IMAGE_METADATA_UNOBSERVED`),
  and an unreadable file is refused (`MIGRATION_IMAGE_METADATA_UNREADABLE`).
  `managedSiteFieldMigrationImagePathsV1(declaration)` lists the paths to
  read. The `migrate` CLI passes no reader, so it refuses this step;
- the bytes must digest to production's `sha256` for the path
  (`MIGRATION_IMAGE_METADATA_FILE_MISMATCH`), so bytes of any other file are
  refused, never trusted;
- `managedImageFileMaterialV1(bytes)` derives the displayed size (EXIF
  orientation 5 to 8 swaps the axes), format and length of a JPEG, PNG or
  WebP, and refuses (`IMAGE_FILE_UNDERIVABLE`, read as
  `MIGRATION_IMAGE_METADATA_UNDERIVABLE`) anything browsers might show
  differently or not at all: an EXIF block Chrome and Firefox read
  differently (not the first APP1, a non-zero pad byte, an entry cut short,
  two blocks), two frames or a second SOI, an orientation outside 1 to 8, a
  frame of unknown height, a PNG or WebP carrying EXIF, a WebP canvas its
  frame does not fill, an animated WebP, AVIF, a truncated or unrecognized
  file. The container must account for every byte: a JPEG ends at its end
  of image after its scans, a PNG's chunks pass their CRC and follow the
  chunk grammar (four-letter types, no critical chunk a decoder does not
  know, one header, at most one palette and before the image data), its image
  data is one zlib stream that inflates to exactly the scanlines its header
  states and ends where the image data does, and its empty end chunk ends the
  file, a WebP's container ends the file and a simple one is one
  frame. JPEG scans and VP8/VP8L bitstreams are not decoded:
  damage inside them changes no size (a browser shows a damaged JPEG or WebP
  at the size its header states), decoders differ on how much of it they
  tolerate (libjpeg and libwebp give the same damaged bytes different
  verdicts), and the bytes are bound to the digest of the file production
  already serves. Fixtures are checked against
  sharp, and every image All Points Media commits (187) derives;
- the declared metadata must equal the derivation
  (`MIGRATION_IMAGE_METADATA_MISMATCH`) and differ from what production
  states (`MIGRATION_IMAGE_METADATA_UNCHANGED`); a path production does not
  name is `MIGRATION_IMAGE_METADATA_UNKNOWN_PATH`, and a path is corrected
  once (`MIGRATION_IMAGE_PATH_CLAIMED_TWICE`);
- which values and manifest entries name the path is derived from
  production, never listed; each candidate value must be production's with
  exactly the derived metadata replaced
  (`MIGRATION_IMAGE_METADATA_VALUE_MISMATCH`), and each manifest entry
  likewise (`COMPATIBILITY_ASSET_CHANGED`);
- every field holding a corrected value is claimed once: no other step may
  merge, retire, link or rescope it;
- the corrected value is still held to its slot (aspect ratios, sizes,
  crop), so a truth the slot does not admit is refused
  (`CONTENT_ASSET_POLICY`): widen the slot first.

The proof's step is `{ op: "image-metadata", images: [{ path, sha256, from,
to, values: [{ fieldId, owner }], assetSlotIds }] }`; each corrected value
counts as consumed and as the step's target. `values` is what the platform
asks about work in flight before admitting the change.

## Local workspace

The starter and reference fixtures resolve this package through npm workspaces,
so local development does not require a GitHub Packages credential.
