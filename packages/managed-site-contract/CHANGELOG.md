# Changelog

Releases before 0.12.0 are described in their pull requests and in this
package's README.

## 0.43.0

**A contract may name the unpinned `latest` review bridge, and a site may move
onto it from any pinned version.** Live sites will load
`https://app.gomega.ai/review-bridge/latest/review-bridge.js` with no
`integrity`, so the bytes can change without a contract change.

Invariant: the only bridge change besides a declared one-version step is
pinned `vN` to exactly the `latest` delivery with every other descriptor field
identical. It never holds in reverse.

- **Contract**: `bridge.delivery` may be `{ version: "latest", src:
  LATEST_BRIDGE_SRC, crossOrigin: "anonymous", load: "head_defer" }`: the
  exact URL, no `integrity`, no other key. Pinned `vN` branches are unchanged
  and still require their own URL and a sha384 `integrity`. `latest` is not in
  `SUPPORTED_BRIDGE_VERSIONS` (new: `LATEST_BRIDGE_VERSION`,
  `LATEST_BRIDGE_SRC`, `isLatestBridgeVersion`).
- **Compatibility policy**: `COMPATIBILITY_RUNTIME_CHANGED` no longer fires for
  a pinned-to-`latest` move with the rest of the runtime identity unchanged.
  `latest` to a pinned version, `latest` on another URL or host, and a
  pinned version with another hash are still refused.
- **Field migration**: a declared bridge step may end on `latest` from any
  pinned version (no `MIGRATION_BRIDGE_GAP`). `admitBridge` is now asked
  `(version, integrity | null)`; `latest` is asked with `null`, so a platform
  whose admission predates `latest` refuses it. A step cannot start on
  `latest` (`MIGRATION_BRIDGE_DOWNGRADE` for a raw descriptor, a schema error
  for a declaration). Both schema artifacts regenerated.

- **Conformance CLI**: `migrate --admit-bridge latest` vouches for the
  `latest` delivery (the bare word; `latest=<integrity>` is a usage error).

Version: widens what the contract and policy admit, so a minor release.
`ManagedSiteBridgeAdmission` changed shape, so megaseo-web must update
`site_guard_bridge_admission.ts` when it moves its pin. The converter's own
bridge reader (`managed-site-conversion/src/config.ts`) still reads pinned
versions only; the template moves in a later PR.

## 0.42.0

**A declared migration corrects an image's derived metadata.** All Points
Media's seven "Venue networks" photos are stored 1500x1125 with EXIF
orientation 6, so browsers show them 1125x1500, but their values state the
stored size; the ordinary policy refuses any change to a production value and
no migration op could correct it.

Invariant: only the metadata derived from the file (`mimeType`, `width`,
`height`, `bytes`) moves, on every value and asset manifest entry naming the
path, and only to exactly what the committed file's own bytes derive (EXIF
aware), bound to production's digest; path, digest, alt text, crop and focal
point stay. Anything unreadable or underivable is refused.

- **Op** `image-metadata`: `{ op, images: [{ path, mimeType, width, height,
  bytes }] }` (`MANAGED_SITE_FIELD_MIGRATION_OPS`); migration schema
  regenerated.
- **Reader**: `ManagedSiteFieldMigrationOptionsV1.readImageFile(path)`
  returns the committed bytes or `null`; absent is
  `MIGRATION_IMAGE_METADATA_UNOBSERVED`. `managedSiteFieldMigrationImagePathsV1`
  lists the paths to read.
- **Derivation**: `managedImageFileMaterialV1(bytes)` (JPEG with EXIF
  orientation, PNG, WebP; refuses AVIF, EXIF in PNG or WebP, animated WebP,
  ambiguous or truncated files with `IMAGE_FILE_UNDERIVABLE`). Every
  container byte is accounted for (PNG: chunk grammar, one zlib stream ending
  with the image data); entropy-coded pixels are not decoded. Fixtures
  checked against sharp.
- **Verifier**: values and manifest entries naming the path are derived from
  production; each must be production's with exactly the derived metadata
  replaced. Fields holding a corrected value are claimed once against every
  other step.
- **Proof**: `{ op: "image-metadata", images: [{ path, sha256, from, to,
  values, assetSlotIds }] }`; corrected values count as consumed and as
  targets. `ManagedSiteFieldMigrationImageMetadataStepProofV1` exported.
- **Conversion**: its plan switch refuses an image-metadata step (a
  conversion never declares one).

## 0.41.0

**A link field's destination may carry a query its field declares.** All
Points Media's calls to action link to `/contact?type=strategy`,
`?type=rfp`, `?type=expert` and the rest (the header and footer CTAs, careers
and about, every "Get Started"); an internal destination could not hold a
query, so each stayed code-owned.

Invariant: a destination's query is admitted only parameter by parameter and
value by value from its field's `allowedQueries` entry for the page it names,
compared exactly; it has one canonical spelling, written by the one href
builder; a prose link mark carries none.

- **Destination**: `query` on an internal link field destination, a map of
  1 to 8 names (`MANAGED_LINK_QUERY_NAME`) to values
  (`MANAGED_LINK_QUERY_VALUE`), at most 64 characters each. Absent is no
  query, never `{}`. Schema regenerated.
- **Constraints**: `allowedQueries: [{ pageId, parameters: [{ name, values }] }]`
  on a link field (absent or `[]` admits none, as before). Values are an
  enumeration; each page, parameter and value once. The page is a reference
  in the occurrence registry.
- **Rendering**: `managedLinkQueryString(query)`, names in ascending code-unit
  order; `managedRichTextLinkAttributesV1` takes a link field's value
  (`ManagedLinkHrefSourceV1`) as well as a mark and writes path, query,
  fragment. The converted-site runtime's one link builder takes it too, so a
  link field's href carries its query.
- **Prose marks**: `managedRichTextLinkDestinationSchema`
  (`ManagedRichTextLinkDestination`), the destination less `query`; a mark
  with a query is refused by its shape, in content and in a migration's
  declared marks.
- **Compatibility**: removing a page, parameter or value narrows
  (`COMPATIBILITY_FIELD_POLICY_NARROWED`); adding widens.
- **Migrations**: a `link` step may declare a query destination, judged by
  the target's `allowedQueries` (`MIGRATION_TARGET_CONSTRAINTS`). A page
  retire drops every `allowedQueries` entry for the page (the candidate
  drops it, the verifier reads production without it); a value still linking
  there, query or not, keeps refusing the retire.
- `test/cms-link-query-cases.json`: one adversarial table (encodings,
  duplicate and empty parameters, case, ordering, `+` and `%20`, unknown
  parameters, a value carrying `&admin=1`) held byte-identical in megaseo-web,
  where the CMS's database rule and its TypeScript twin run it too.

megaseo-web, on an earlier version, parses a `query` member or
`allowedQueries` as invalid, so Site Guard refuses a site using either until
the platform adopts this version, and the CMS writer refuses to store one
until its rule admits it.

## 0.40.0

**A page field can move to site scope by a declared migration.** All Points
Media's home "Consumer journey" and "Network builder" copy also renders on
two solution pages; a page-scoped field may render on one page only, and an
ordinary change of scope is `COMPATIBILITY_FIELD_POLICY_NARROWED`.

- **Migration op `rescope`**: `{ op: "rescope", field, scope: "site" }`
  (`MANAGED_SITE_FIELD_MIGRATION_OPS`). The verifier proves the candidate
  declares the same field in the same section, identical but for scope and
  usages, every production usage kept, and holds production's value
  byte-identical under the site owner (`MIGRATION_RESCOPE_*`,
  `MIGRATION_TARGET_MISMATCH`). Lists and toggles are deferred.
- Why a migration and not a compatible change: the value's owner (its
  identity in every content store) changes, so a customer's open draft or
  unpublished change on the page owner would be stranded. A declared step is
  what lets the platform refuse while work is in flight and record the move.
- Proof: a `rescope` step proof (`field`, `from`, `to`) and an added item
  listing every usage the field gains (`addedUsages`). Migration schema
  regenerated.

megaseo-web, still on an earlier version, refuses a `rescope` step as
deferred, and its guarded merge record admits only the ops it knows, so Site
Guard refuses one until the platform adopts this version.

## 0.39.0

**A read-only view of a collection.** All Points Media's industry pages show
the two case studies most relevant to each industry, ranked in code; their
cards are case-study items, but the page has no list of its own, so the
editor could not offer those cells and the coverage gate could not count
them.

- **`section.views`**: `[{ collectionId }]` (absent is none, empty refused).
  Schema regenerated; the occurrence registry classifies the reference.
- **Contract semantics** (`CONTRACT_COLLECTION_VIEW`): the viewed collection
  is listed by a page field, is not a list inside an item, and a page views it
  at most once and does not also list it.
- **Rendered headings**: a viewed collection's item fields render on the
  page, as a listed one's do (a route H1 stays its own page's).
- **Field migrations**: a collection retire takes every view of the
  collection with it, as it takes its placements: each section that viewed
  it keeps exactly its other views, so a view repointed to another
  collection is refused (`MIGRATION_RETIRE_REFERENCED`).
- `managedPageRenderedCollections` (the one rule of what renders on a page,
  now also what H1 sources read), `managedPageCollectionViews` and
  `managedCollectionPageIds` (that rule read collection by collection)
  exported.
- A view holds no value, so a code change may add or drop one, still held to
  the H1 rule (a view can make a page adopt an H1 source, as a list can).

megaseo-web, still on an earlier version, parses `views` as invalid, so Site
Guard refuses one until the platform adopts this version and its editor
offers a viewed item's fields.

## 0.38.0

**Page text filled from a generated page's item.** All Points Media's detail
pages say "Build Your {name} Network." and "{name} FAQ"; as one template per
route, that text must be written once with the item's name in it.

- **Item-text patterns**: a plain-text (running text) or heading field's
  `constraints.pattern` may name, per placeholder, the route collection's item
  field that fills it (`placeholders[].fieldId`). Every placeholder names one
  or none does. Headings gain an optional `pattern`. Schema regenerated; the
  occurrence registry classifies the new references (a page field's
  route-collection scope is read through its page's `route`).
- **Contract semantics** (`CONTRACT_ITEM_PATTERN`): the field is its
  generated page's own (page-scoped, customer-editable, used once there), and
  each source is one non-empty, customer-editable line of its route
  collection's item text. An item field never holds one.
- **Compatibility**: a plain-text or heading field's pattern is kept exactly,
  as a template is. This also closes a gap for 0.26.0 search patterns, whose
  change was not compared.
- **Field migrations**: merge and link refuse any field whose text holds
  tokens (`isManagedTokenTextField`), patterns as well as templates.
- `managedItemPatternTextV1`, `isManagedItemPatternField`,
  `isManagedItemTextPattern`, `isManagedTokenTextField` exported.
- Converted-site runtime: `managedItemPatternText(fieldId, itemId)`.

megaseo-web, still on an earlier version, parses a heading pattern or a
placeholder `fieldId` as invalid, so Site Guard refuses one until the platform
adopts this version.

## 0.37.0

**An item's link may be optional.** All Points Media's case studies link a PDF
only where one exists; until now every item had to hold a link.

- **`optional: true` on an item's link field**, exactly as on an item's image
  (0.36.0): absent is required, its value may be `null`. Schema regenerated:
  a link content value is a link or `null`.
- **Content semantics**: `null` only on an optional item link
  (`CONTENT_VALUE_POLICY`; `FIELD_VALUE_LINK_REQUIRED` from
  `validateManagedFieldValue`); a `null` names no page. No uniqueness rule may
  name an optional field (0.36.0's rule). A customer who may empty an
  optional link can fill it again: it grants `link.label.edit` and
  `link.destination.edit`, and `link.target.edit` when it admits more than one
  window (`CONTRACT_OPTIONAL_FIELD_POLICY`).
- **Compatibility**: required may become optional, never the reverse
  (`COMPATIBILITY_FIELD_POLICY_NARROWED`).
- Converted-site runtime: `managedItemById(...).optionalLink(fieldId)`, `null`
  for no link; `link()` refuses an optional field, `optionalLink()` a required
  one, and `resolveManagedLink(null)` refuses.

megaseo-web, still on an earlier version, parses an optional link as invalid,
so Site Guard refuses one until the platform adopts this version and its CMS
can add and remove an item's link.

## 0.36.0

**An item's image may be optional.** All Points Media's networks without an
honest photo render a typographic card, so their item image cannot be
required; until now every item had to hold a picture.

- **`optional: true` on an item's image field** (absent is required, as
  before; no `false` spelling). Its value may be `null`. Schema regenerated:
  an image content value is an image or `null`.
- **Content semantics**: `null` only where the field is an optional item
  image (`CONTENT_VALUE_POLICY` elsewhere; `FIELD_VALUE_IMAGE_REQUIRED` from
  `validateManagedFieldValue` for a page image). A `null` needs no manifest
  entry. Every entry of a slot an image field declares must now be shown by a
  value, so material only an emptied image (or an empty list) named is
  unused (`CONTENT_ASSET_MANIFEST_UNUSED`); a slot only SEO names keeps its
  one entry. Source projection reads a `null` at the item's pointer as no
  picture.
- **Contract semantics**: no item-field reference may name an optional field
  (`CONTRACT_OPTIONAL_FIELD_REFERENCE`): share and primary images, JSON-LD
  sources, search slots, outlines, intents, derived from the occurrence
  registry; no uniqueness rule may name an optional field. A customer who may
  empty an optional image can fill it again: it grants `image.upload`, and
  `image.alt.edit` on an informative slot (`CONTRACT_OPTIONAL_FIELD_POLICY`).
- **Compatibility**: required may become optional, never the reverse
  (`COMPATIBILITY_FIELD_POLICY_NARROWED`).
- `isManagedOptionalItemField` exported.
- Converted-site runtime: `managedItemById(...).optionalImage(fieldId)`
  returns `null` for an item with no picture; `image()` refuses an optional
  field and `optionalImage()` a required one.

megaseo-web, still on an earlier version, parses `optional` as invalid, so
Site Guard refuses an optional image until the platform adopts this version
and its CMS can add and remove an item's picture.

## 0.35.0

**A generated page's own H1 is not a listing page's H1.** A generated page's
H1 must be a level 1 heading item field of its route collection, and every
page listing that collection counted every item field as rendered there, so
adding the route's H1 field to a collection already listed on a page with an
H1 (All Points Media's Case studies on / and /work) read as a second H1 there
(`COMPATIBILITY_PAGE_SEO_CHANGED`).

- **H1 sources** (`managedRenderedH1Sources`, `managedPageH1Fields`): a level 1
  `heading_text` item field that its generated page's outline names at level 1
  is an H1 source only on that generated page. Every other level 1 heading
  item field still counts on every page that renders its collection.
- An existing listing-page H1 source made the route H1 is still refused: the
  listing page would lose a declared H1. A static outline still cannot name an
  item field (`CONTRACT_REFERENCE_SCOPE`).

## 0.34.0

**"Hide this page from search engines."** A page's robots become the
customer's switch, for static pages and each item of a generated page, with a
confirmation in the editor. The canonical stays protected, derived from the
route.

- **Field type `toggle`** (page and item fields): value `true` or `false`,
  capability `toggle.set`, `semantic` from `MANAGED_TOGGLE_SEMANTICS`, whose
  only member is `seo_hidden`. Schema regenerated; the occurrence registry
  classifies the new declarations and `metadata.hiddenFieldId`.
- **`metadata.hiddenFieldId`** on a static page's search entry (its own
  page-scoped, customer-editable toggle) and a generated page's (an item
  field of its route collection). A `seo_hidden` toggle is named by exactly
  one entry and nothing else (`CONTRACT_SEO_FIELD_POLICY`).
- **Served indexing has one reader**: `managedServedIndexingV1` /
  `managedServedItemIndexingV1` (the toggle when named, else the protected
  directives). Hidden serves `noindex, nofollow`, shown `index, follow`
  (`managedSearchRobotsV1`); `managedSearchHiddenV1` reads the switch. The
  redirect rule reads indexing through it.
- **Compatibility**: `metadata.hiddenFieldId` is the one page fact a code
  change may adopt (`MANAGED_SEO_ADOPTABLE_FACTS`), never drop or swap, and
  adopting must leave every page's and item's `index` and `follow` the same
  (`COMPATIBILITY_SEARCH_VISIBILITY_CHANGED`).
- A page retire (0.30.0) takes a page's toggle with it.
- Converted-site runtime: `managedMetadata` and `managedItemMetadata` apply
  the toggle to robots (googleBot too; string robots or a string googleBot on
  a page with a toggle fail the build); `managedSearchRobots` and `managedSearchHidden` exported.

megaseo-web, still on an earlier version, parses a toggle as invalid, so Site
Guard refuses one until the platform adopts this version and its CMS writer
stores `SET_TOGGLE`.

## 0.33.0

**An existing collection can become a generated route's collection.** A
generated route's key must be a protected `route.slug` with an exact unique
rule, and Site Guard refused any uniqueness rule a production collection did
not already have, so All Points Media's Case studies (3 items with stable ids)
could become `/work/[slug]` only through a retire, which loses the ids.

- **Compatibility**: a candidate's new uniqueness rule is admitted when every
  field it names is new in the candidate (absent from production, never
  tombstoned) and `internal_protected`, and no field listing the collection
  grants `collection.add`. Anything else is still
  `COMPATIBILITY_COLLECTION_POLICY_NARROWED`. The candidate's content is still
  held to the rule (`CONTENT_COLLECTION_UNIQUENESS`).
- **Compatibility**: granting `collection.add` on a collection whose rules
  name a protected field is narrowing: a customer-added item would hold a
  protected value its customer cannot set.
- Re-keying a served generated route is now refused by the route rule
  (`COMPATIBILITY_ROUTE_REMOVED`) rather than the collection rule.

## 0.32.0

**The contract accepts review bridge v13.** Bridge v13 (megaseo-web) changes
only what a click outside every editable place means. A click just beside a
field's words, on a wrapper whose words are all that one field's (a small
uppercase label inside a wrapper with a trailing space, on a tall line), picks
the field instead of saying "This part isn't editable yet". A click on an
element whose words belong to several fields says nothing. Words no field owns
still say "not editable". No new message or capability.

- `SUPPORTED_BRIDGE_VERSIONS` is `v7` to `v13`, and `CURRENT_BRIDGE_VERSION`
  is `v13`. v7 to v12 stay supported.
- The JSON Schema is regenerated with a strict delivery branch for v13.
- The starter template, the Astro reference (source and rebuilt `dist`), the
  conversion example, the parity fixture and the contract and conversion test
  fixtures move to v13, SRI
  `sha384-GrpOL0+U/drV+M5Xmr7vIU11jHh4rpRJrsIAvBgdXnytkyWHDnssPzhI1wK/GpTg`,
  the hash of the bytes served at
  `https://app.gomega.ai/review-bridge/v13/review-bridge.js`.
- A declared field migration may step the bridge one supported version forward
  (v12 to v13); v11 to v13 is a gap and v13 to v12 a downgrade.

## 0.31.0

**A declared link can open one item of a generated page.** Code-owned labels
whose href is a detail page (`/work/<slug>`, `/networks/<slug>`) can become
customer-editable item links once those pages are CMS-managed. Before, a link
step refused any item destination (`MIGRATION_LINK_DESTINATION_UNEXPRESSIBLE`).

- A link step's internal destination may name `{ pageId, itemId }` when the
  page is a generated page production and the candidate both declare over the
  same collection and the item is active in production and of that collection
  (read by `managedContentActiveItemCollections`, the content rules' own
  derivation). A generated page with no item, a static page with one, an item
  production does not hold, or holds in another collection, stay
  `MIGRATION_LINK_DESTINATION_UNEXPRESSIBLE`; an item the candidate stops
  serving is refused by the candidate's content rules or as an undeclared
  change.
- A merge step's declared link marks are held to the same rule against
  production (before, only the candidate's content rule read them, so a mark
  to a page that does not exist is now `MIGRATION_LINK_DESTINATION_UNEXPRESSIBLE`
  rather than `CONTENT_LINK_PAGE_UNRESOLVED`).

## 0.30.0

**A retire can remove a whole page.** All Points Media's
`/innovation/network-portal` 404s live and is being removed. A retire could
not remove it: its own search slots are protected fields
(`MIGRATION_RETIRE_PROTECTED`), and nothing could remove a page.

- **`{ "op": "retire", "pages": [...] }`**, and a step naming pages names
  nothing else (parser refinement and published schema `if`/`then`, from one
  key). A static page carries its sections, every field it declares, the
  page-scoped protected fields only it renders (its search slots) and its search entry,
  derived from production; every field that stays loses its usage on the page
  and nothing else.
- The page is judged against production before the candidate is read; then
  every other step and rule runs against production with the pages removed,
  so whatever they did not carry is held to the ordinary rules unchanged.
- Refused: an unknown page (`MIGRATION_RETIRE_UNKNOWN`), a page named twice
  (`MIGRATION_RETIRE_CLAIMED_TWICE`), a generated page or one holding a list,
  an image or an aliased field (`MIGRATION_TRANSFORM_DEFERRED`), a field it
  declares that another page renders or a field declared elsewhere only it
  renders (a site-scoped protected field included), and any contract
  occurrence or production value that stays naming anything it carries or
  spelling its URL on the site's own origin (`MIGRATION_RETIRE_REFERENCED`), anything still declared
  or not tombstoned (`MIGRATION_RETIRE_STILL_DECLARED`,
  `MIGRATION_TOMBSTONES_INCOMPLETE`).
- Proof: a page step lists, under `pages`
  (`ManagedSiteFieldMigrationRetiredPageProofV1`), each page with its path,
  sections, fields, protected fields and `unrendered`; its `fields` and
  `sections` are empty. A step naming no page is unchanged.
- `managedSiteFieldMigrationRetireCarriedIdsV1` carries each named page's
  sections, fields and search slots; the converter's plan may name a page this
  run retired.

megaseo-web, still on an earlier version, parses a declaration naming pages as
invalid, so Site Guard refuses one until the platform adopts this version and
its guarded merge record accepts it.

## 0.29.0

**A retire can remove a whole collection.** All Points Media's /about carries a
placeholder "careers openings" list (six invented roles) that is being replaced
by a link to its real listings. Emptying the list breaks its `minItems`, and a
retire could not remove it: item fields were deferred and the list's placement
is code-owned.

- **`{ "op": "retire", "collections": [...] }`** (`fields` is now optional;
  a step names at least one field or collection). A collection carries its
  item fields, every item value and every page field placing it, derived from
  production. Each is claimed once, undeclared and tombstoned in the
  candidate, and valueless; every item it held is tombstoned too, so a
  retired item id is never listed again. Schema regenerated; the published
  schema's retire step carries `anyOf: [{ required: ["fields"] }, { required:
  ["collections"] }]`, projected from the same list the parser's refinement
  reads, so a schema-only consumer refuses `{ "op": "retire" }` and a
  sections-only step exactly as the parser does.
- **`managedSiteFieldMigrationRetireCarriedIdsV1(productionContract,
  productionContent, declaration)`**: every production id a declaration's
  retires carry without naming (each named collection's placements, item
  fields and items), read from production through the derivations the
  verifier claims by.
- A protected item field is `MIGRATION_RETIRE_PROTECTED`; a list inside an
  item, either way, an image item field and an aliased placement are
  `MIGRATION_TRANSFORM_DEFERRED`.
- References: nothing that stays may name the collection, a placement, an
  item field or an item, in the contract (except inside the retired collection
  or placement itself) or anywhere in a production value that stays
  (`MIGRATION_RETIRE_REFERENCED`). This structural value read also applies to
  fields and sections a retire names.
- Proof: a retire step that names collections lists each with its placements
  item fields and items (`ManagedSiteFieldMigrationRetiredCollectionProofV1`);
  one that names none is unchanged.
- Converter: a plan's retire step may name a collection this run retired, and
  consumes what it carries (`managedSiteFieldMigrationRetireCarriedIdsV1`), so
  a conversion that removes a list resolves its placement, item fields and
  items. `buildFieldMigrationDeclaration` returns `consumed`, which
  `unresolvedRetirements(evidence, consumed)` now takes.

megaseo-web, still on an earlier version, parses a declaration naming a collection as
invalid, so Site Guard refuses one until the platform adopts this version and
its guarded merge record accepts it.

## 0.28.0

**Icons a customer chooses from the site's set.** All Points Media's industries
each show an icon (lucide's heart-pulse, landmark, shopping-bag), chosen in
code. Now a field can let the customer pick one from the set the site declares.

- **Field `type: "icon"`** (page and item fields, capability `icon.choose`):
  `constraints: { library: "lucide", choices: [{ name, label }] }`, 1 to 200
  unique kebab-case names. The value is the chosen name; one outside the
  choices is `FIELD_VALUE_ICON`. Schema regenerated.
- **Compatibility**: a choice may be added or relabelled, never dropped or
  renamed; the library is kept.
- **Converted-site runtime**: `managedIcon(fieldId)` and
  `managedItemById(...).icon(fieldId)`.

megaseo-web, still on 0.27.0, parses a contract with an icon field as invalid,
so Site Guard refuses one until the platform adopts this version.

## 0.27.0

**Lists inside items.** All Points Media's detail pages hold lists per item (a
network's venues, a solution's benefits), which no collection could express:
an item field could not be a collection. Now one can, one level deep.

- **Item field `type: "collection"`**: `collectionId` names the nested
  collection, whose resolver is the pool every list draws from; each parent
  item holds its own `orderedItemIds`. Schema regenerated.
- **Contract semantics** (`CONTRACT_NESTED_COLLECTION`): listed by exactly one
  item field, by no page field, never a generated route, never itself, and
  listing nothing itself.
- **Content semantics**: one list per nested item (`CONTENT_NESTED_ITEM_SHARED`),
  bounds and duplicates per list, uniqueness rules per list; an unlisted nested
  item is `CONTENT_ITEM_ORPHAN`.
- **Rendered headings** count a nested list's items on every page that renders
  its parent.
- **Converted-site runtime**: `managedItemById(...).list(fieldId)`;
  `managedOrder` refuses a nested collection, which has no page order.

megaseo-web, still on 0.26.0, parses a contract with a nested list as invalid,
so Site Guard refuses one until the platform adopts this version.

## 0.26.0

**A generated page's search title and description are the customer's.** All
Points Media's detail pages are generated (one template, one item per page), and
their search titles and descriptions were protected item fields only code could
change. A page now writes each once for every item, with the item's name filled
in ("{name} advertising | All Points Media"), and any page may override it.

- **`constraints.pattern`** on `seo_title` / `seo_description` `plain_text`
  fields: 1 to 4 placeholder names; one line, at most 320 characters, never with
  a template or attribute. Its value is held to the template value rule.
- **`metadata.titlePattern` / `metadata.descriptionPattern`** on generated page
  SEO: `{ fieldId, sources: [{ placeholder, fieldId }] }`, beside a slot naming
  the item's optional override. Absent is the old shape. Schema regenerated.
- **Semantics** (`CONTRACT_SEO_FIELD_POLICY`): see the README section
  "Generated pages: search patterns and overrides". An item field with search
  semantics, refused outright before, is admitted only as one generated page's
  slot.
- **Rendering**: `managedGeneratedSeoTextV1`, `renderManagedGeneratedSeoTextV1`
  (override when it holds text after `trim()`, else the pattern),
  `renderManagedSeoPatternV1`, `isManagedSeoPatternField`.
- **Converted-site runtime**: `managedItemMetadata(pageId, itemId, fallback)`
  serves an item's editable title and description, page and share cards.

megaseo-web, still on 0.25.0, parses a contract with a pattern as invalid, so
Site Guard refuses one until the platform adopts this version.

## 0.25.0

**A link can open one item of a generated page.** All Points Media's ~40
network, solution, industry and work detail pages become generated pages (one
template, one collection item per page), and every link to one of them
("Networks > Healthcare") must name the item, not only the page: a generated
page alone is a pattern with no path.

- **`itemId`** on an internal destination (link fields and prose link marks):
  optional, absent for a page and never `null`. Schema regenerated.
- **Content semantics**: an internal destination names exactly one path. A
  generated page with no item stays `..._PAGE_UNPATHED`; a static page with an
  item, or an item of another collection, is `CONTENT_LINK_ITEM_SCOPE` /
  `CONTENT_RICH_TEXT_LINK_ITEM_SCOPE`; an item that is not active (not in its
  collection's ordered items, or tombstoned) is `CONTENT_LINK_ITEM_UNRESOLVED`
  / `CONTENT_RICH_TEXT_LINK_ITEM_UNRESOLVED`.
- **Rendering**: `managedRichTextLinkAttributesV1(mark, resolvePagePath,
  resolveItemPath)`; an item link without `resolveItemPath` is
  `RICH_TEXT_LINK_UNRESOLVED`. `managedGeneratedRoutePath(pattern, routeKey)`
  and `isManagedGeneratedRouteKey` (the route-key rule content semantics already
  held items to) are exported.
- **Migrations**: a declared link to an item is
  `MIGRATION_LINK_DESTINATION_UNEXPRESSIBLE`, as one to a generated page was.

megaseo-web, still on 0.24.0, parses an item destination as invalid, so Site
Guard refuses content holding one until the platform adopts this version.

## 0.24.0

**Attribute text: screen-reader labels, placeholders and titles a customer can
edit.** All Points Media's navigation labels ("Primary", "Footer", "Mobile"),
its menu button's "Open menu" / "Close menu", a search placeholder and an
iframe title are words in attributes, and a text field cannot hold them: the
editor writes a text field by replacing the element's children, so a `<nav>`
annotated to edit its label would lose its links.

- **`constraints.attribute`** (`plain_text` only): `aria-label`,
  `aria-roledescription`, `placeholder`, `title` or `alt`. `label` or `caption`
  semantics, `newlines: "forbid"`, `minLength` >= 1, `maxLength` <= 512, no
  `template`. Schema regenerated.
- **The value rule** (`FIELD_VALUE_TEXT`): no control, bidi-control or line
  separator character, and not blank (only White_Space or zero-width
  characters). `managedAttributeTextRefusal`, `MANAGED_TEXT_ATTRIBUTES`,
  `MANAGED_ATTRIBUTE_TEXT_BLANK_CODE_POINTS`, also exported on their own as
  `@landing-pages-websites/managed-site-contract/attribute-text`.
- **The binding**: `managedSiteAttributeFieldAttributesV1(attribute, fieldId,
  itemId?)` gives `data-gomega-attr-<attribute>` (and `-item`), never
  `data-gomega-field-id`.
- **Compatibility**: the attribute is kept exactly. **Migrations**: an attribute
  field as a merge or link source or target is `MIGRATION_TRANSFORM_DEFERRED`.
- **Review bridge v12** (megaseo-web), which reports and previews attribute
  places: `SUPPORTED_BRIDGE_VERSIONS` is v7 to v12 and `CURRENT_BRIDGE_VERSION`
  is v12, SRI
  `sha384-qaXU28Niz5bKvU+5YgsqqPaLvTtxMpQ/ek9xp+DwaufW6GcrKtBXbt5KbIi/bW2h`. The
  starter template, the Astro reference, the conversion example and every
  fixture move to v12. A declared migration may step v11 to v12; v10 to v12 is
  a gap, v12 to v11 a downgrade.
- `test/cms-attribute-text-rule-cases.json` is the shared adversarial table
  megaseo-web's CMS writer and its TypeScript twin are held to.

megaseo-web, still on 0.23.0, parses a contract with an attribute field as
invalid, so Site Guard refuses one until the platform adopts this version.

## 0.23.0

**Template text: a customer edits the words around a number the site
computes.** All Points Media renders counts in its copy ("1 network",
"2 networks", "178 venues"), built in code from its data, so the words could
not be made editable without freezing the number. A `plain_text` field may now
declare `constraints.template`; its value is still a string holding each
declared placeholder as a `{name}` token, and the site fills the number in.

- **`constraints.template`** (`plain_text` only, running-text semantics only):
  `locale` (canonical, supported by `Intl`), `placeholders` (1 to 4, each
  `{ name, minimumIntegerDigits, grouping }`) and `plural` (`null`, or
  `{ placeholder, category }` with a category the locale selects). Schema
  regenerated.
- **The value rule**: each token exactly once, and no `{` or `}` once the tokens
  are removed (`FIELD_VALUE_TEXT`). Length is unchanged: code points of the
  stored text, tokens as written. A plain-text field without a template is
  judged exactly as before.
- **Rendering**: `renderManagedTextTemplateV1`, `renderManagedPluralTextV1`,
  `managedTextTemplatePluralCategoryV1`, and the inverse
  `matchManagedTextTemplateV1`, also exported on their own as
  `@landing-pages-websites/managed-site-contract/text-template` for client
  components. `managedTextTemplateRefusal` names the CMS's reasons
  (`placeholder_missing`, `placeholder_repeated`, `stray_brace`).
- **Compatibility**: a template is kept exactly or the change is narrowing.
- **Migrations**: a template field as a merge or link source or target is
  `MIGRATION_TRANSFORM_DEFERRED`.
- `test/cms-text-template-rule-cases.json` is the shared adversarial table
  megaseo-web's CMS writer and its TypeScript twin are held to.

megaseo-web, still on 0.22.0, parses a contract with a template as invalid, so Site Guard
refuses one until the platform adopts this version, and its CMS enforces the
token rule from that version on.

## 0.22.0

**A declared field migration can turn plain-text fields into link fields,
collection item fields included.** All Points Media's header, footer and legal
nav labels are editable item fields while their hrefs are hard-coded and read
by index, and its call-to-action labels are editable text fields whose hrefs
are in code, so a customer can retype a label but never repoint it. Turning
them into link fields removes a production field and changes its value's
type: `COMPATIBILITY_DECLARATION_REMOVED` under the ordinary policy, and
deferred as a migration. It is now a declared `link` step.

- **`{ "op": "link", "source", "target", "links": [{ "item"?, "destination", "target" }] }`**
  (migration schema, regenerated; `MANAGED_SITE_FIELD_MIGRATION_OPS` is
  `merge`, `retire`, `link`). One link with no `item` for a page or site field;
  one per item for a collection item field, and exactly production's items
  (`MIGRATION_LINK_ITEMS_MISMATCH`).
- **The label is the source's text, byte for byte**, and the destination and
  window are exactly the declared ones (`MIGRATION_TARGET_MISMATCH`), held to
  the target's own constraints (`MIGRATION_TARGET_CONSTRAINTS`). Destinations:
  an internal static page both sides declare
  (`MIGRATION_LINK_DESTINATION_UNEXPRESSIBLE` otherwise) with a fragment the
  target admits, an https URL, an email address or a phone number.
- **The source** is customer-editable running-text `plain_text`
  (`MIGRATION_LINK_SOURCE_NOT_TEXT`, `MIGRATION_LINK_SOURCE_NOT_EDITABLE`;
  structured roles and aliased fields stay deferred) that nothing else reads
  (`MIGRATION_LINK_SOURCE_REFERENCED`). **The target** is a new
  customer-editable link field in the source's place: the same section,
  scope, owner and usages, or the same collection
  (`MIGRATION_LINK_PLACE_CHANGED`, `MIGRATION_SCOPE_MISMATCH`).
- **Proof.** `ManagedSiteFieldMigrationStepProofV1` gains
  `ManagedSiteFieldMigrationLinkStepProofV1` (`source`, `target`, `owners` in
  declaration order), and `added` lists one `link_field` item per value. A
  declaration without a link step proves byte-identically to 0.21.0.
- `ManagedSiteFieldMigrationLinkStepV1` and `ManagedSiteFieldMigrationLinkV1`
  are new types. The conversion package treats a link step as consuming its
  one source, which must be the field its target's anchor replaced.

Whether a source has an open draft or an unpublished change, and whether its
history can be attributed, is the platform's to judge: Site Guard refuses a
link step until it adopts this version and checks those.

## 0.21.0

**A declared field migration can retire customer-editable fields that are in
production content.** All Points Media #79 gave its internal `/admin` page
(not a page customers edit) a "Search and sharing" section with a
customer-editable search title and description. Removing them was
`COMPATIBILITY_DECLARATION_REMOVED` under the ordinary policy and
`MIGRATION_TRANSFORM_DEFERRED` as a migration, which left a site retire as
the only way out. It is now a declared `retire` step.

- **`{ "op": "retire", "fields": [...], "sections": [...] }`** (migration
  schema, regenerated; `MANAGED_SITE_FIELD_MIGRATION_OPS` is `merge`,
  `retire`). Fields are customer-editable fields a page renders; protected
  fields (`MIGRATION_RETIRE_PROTECTED`) and code-owned fields
  (`MIGRATION_RETIRE_NOT_EDITABLE`) are refused, collection item and aliased
  fields stay deferred. The candidate must stop declaring each id
  (`MIGRATION_RETIRE_STILL_DECLARED`), tombstone it and drop its values. A
  section may be named only once the migration empties it
  (`MIGRATION_RETIRE_SECTION_NOT_EMPTY`). Every id is claimed once across all
  steps (`MIGRATION_RETIRE_CLAIMED_TWICE`); unknown ids are
  `MIGRATION_RETIRE_UNKNOWN`.
- **Nothing may still read a retired id** (`MIGRATION_RETIRE_REFERENCED`),
  read through the occurrence registry, deferred occurrences included. The one
  exception is a static page's own search title or description slot whose
  share-card echo is a kept protected field holding exactly the same text:
  production is read with the field renamed to its echo, so the ordinary URL
  and SEO rule holds the candidate to falling back to it, and the proof lists
  a `seo_repointed` item. A customer-edited, cleared or otherwise different
  text is refused.
- **Proof.** `ManagedSiteFieldMigrationStepProofV1` is now a union:
  `ManagedSiteFieldMigrationMergeStepProofV1` (unchanged) and
  `ManagedSiteFieldMigrationRetireStepProofV1` (`fields` with owner, page and
  section; `sections`), each at its step's position in the declaration. A
  merge-only declaration's proof is byte-identical to 0.20.0's. Removed values
  count as `consumed`.
- `ManagedSiteFieldMigrationStepV1` stays the merge step;
  `ManagedSiteFieldMigrationRetireStepV1` and
  `ManagedSiteFieldMigrationAnyStepV1` are new.
- A merge step relabelled `retire` is now `MIGRATION_DECLARATION_INVALID`
  (a malformed retire), not `MIGRATION_TRANSFORM_DEFERRED`.

Whether a customer still has content in a retired field (an open draft, a
change in flight, a published value code never wrote) is the platform's to
judge: Site Guard refuses a retire until it adopts this version and checks
those from the production chain.

## 0.20.0

**The contract accepts review bridge v11.** Bridge v11 (megaseo-web) lets a
page report up to 1,024 editable places in one message (v7 to v10 stopped at
256), announced as the capability `large_pages`, and answers a page past that
limit with an explicit `GOMEGA_EDIT_ERROR` instead of silence. It is what lets
the Site editor outline and open the items of repeated blocks on a long page
(All Points Media's home page has 292 cells).

- `SUPPORTED_BRIDGE_VERSIONS` is `v7` to `v11`, and `CURRENT_BRIDGE_VERSION`
  is `v11`. v7 to v10 stay supported.
- The JSON Schema is regenerated with a strict delivery branch for v11.
- The starter template, the Astro reference (source and rebuilt `dist`), the
  conversion example, the parity fixture and the contract and conversion test
  fixtures move to v11, SRI
  `sha384-q7KwfzP0VNd8hCxqx8Sm11jYGMeKloOttq9LBL5wlqbyiIZfatKndJH9nIPw0Gl2`,
  the hash of the bytes served at
  `https://app.gomega.ai/review-bridge/v11/review-bridge.js`.
- A move between versions is still `COMPATIBILITY_RUNTIME_CHANGED`, and a
  declared field migration may step the bridge one supported version forward
  (v10 to v11) as before.

## 0.19.0

**A declared field migration can merge line-split fields into one rich-text
field, joined by hard breaks.** All Points Media #76 collapses 61 fields (the
lines of 29 blocks: heroes and headings drawn line by line) into 29 rich-text
fields holding `hard_break` nodes. Until now F could not write a break and
refused a target holding one, so it needed a retire and re-enroll; with this
it is a declared migration. Three changes, one invariant: a migration may add
only what its declaration names or what the contract itself requires, and the
verifier proves the target is exactly F of the sources.

- **`joinedBy: "hard_break"` on a part** (migration schema, regenerated). The
  part meets the previous one through one `hard_break` node. Per part, not per
  step, because a line may be several parts; never inferred; not on the first
  part, plain text or list items. F writes the break and keeps runs on either
  side of it apart even with identical marks. A break needs text on both sides, not only spaces
  (`MIGRATION_HARD_BREAK_EMPTY_LINE`; a part on either side of a break must hold text, and a line of only spaces is empty), the target must opt in with
  `allowHardBreaks` and the declared breaks fit `maxHardBreaks`
  (`MIGRATION_TARGET_CONSTRAINTS`), and a part's text never becomes a break (a
  control character is still `MIGRATION_TRANSFORM_DEFERRED`; a source already
  holding a break stays deferred). Read-back reads the target's breaks as text
  offsets and requires exactly the declared ones: a break moved, dropped or
  added is `MIGRATION_READBACK_MISMATCH`. The proof lists each as a
  `hard_break` item.
- **The lines of one heading are one block.** `assertOneBlock` counted every
  `heading_text` source as a block, so merging the lines of a split heading
  (four level 1 fields, two level 2 fields) was `MIGRATION_SOURCE_STRUCTURE_LOST`
  ("would join 4 blocks into one"). A `heading_text` no outline names is a line
  of a heading, not a heading the contract can see; the lines now count as one
  block when they share a level and are consecutive fields of one section with
  nothing declared between them, and the declaration separates each pair with a
  break or a literal part, since F would otherwise write their text end to end
  (a page's outline need not name every heading,
  so "unoutlined" alone proves nothing). A field an outline names, and any
  rich-text source, still counts as its own.
- **A rich-text H1 target may add its level 1 outline entry.** The old H1 lines
  were `heading_text` level 1 fields, which are H1 sources by their level and
  were never outlined; content semantics (0.16.1) require every rich-text H1
  to be outlined (`CONTENT_RICH_TEXT_H1_UNDECLARED`), so the migrated candidate
  must add an entry production had no source for, which the reference rule
  refused (`MIGRATION_REFERENCE_CHANGED`: the migrated entries must equal
  production's, renamed). It now admits one level 1 entry per level 1
  rich-text target and outline, listed as an `outline_entry` item; whether the
  page's H1 is the same one, or a page with none adopts one (`h1_adopted`), is
  the H1 rule's. The page's H1 is still
  the H1 rule's, held exactly through the migration's renames, and the entry
  still sits where the ordinary SEO rule puts a first H1, before every section.

## 0.18.0

**The contract accepts review bridge v10.** Bridge v10 (megaseo-web) draws the
rich-text `hard_break` node from 0.17.0 in live preview: each break is a
shallow clone of the field's first `[data-gomega-break]` descendant (a `br` or
`span`, keeping class, style, lang, dir and `data-gomega-break`), else a
`<br>`. 0.17.0 shipped the node but not the bridge that previews it, so no site
could opt a field into `allowHardBreaks` and still preview it.

- `SUPPORTED_BRIDGE_VERSIONS` is `v7`, `v8`, `v9`, `v10`, and
  `CURRENT_BRIDGE_VERSION` is `v10`. v7, v8 and v9 stay supported.
- The JSON Schema is regenerated with a strict delivery branch for v10.
- The starter template, the Astro reference (source and rebuilt `dist`), the
  conversion example, the parity fixture and the contract and conversion test
  fixtures move to v10, SRI
  `sha384-/+5J7l1l8JNgnIgvgOqEHDgx92NrGmbjezpRb/MZb2y0RildsCcaOVu8+mLZbrmF`,
  the hash of the bytes served at
  `https://app.gomega.ai/review-bridge/v10/review-bridge.js`.
- A move between versions is still `COMPATIBILITY_RUNTIME_CHANGED`, and a
  declared field migration may step the bridge one supported version forward
  (v9 to v10) as before.

## 0.17.1

**A field migration verifies under any vm-isolated consumer.** Since 0.16.2
(#119) the migration verifier read production with each retired field renamed
on a copy made by `structuredClone`. Node builds that copy from the host
realm, so under a consumer that loads the package in its own vm context (Jest
runs every suite in one) the package's plain-object check refused its own copy
with `JSON_NON_PLAIN_OBJECT`. Plain Node, with one realm, was unaffected.

The invariant: every object the package builds and then checks comes from the
package's own realm.

- The copy is now a recursive plain copy of the JSON model (null, booleans,
  finite numbers, strings, arrays, plain objects) built in the package's realm.
  It keeps `-0`, which a JSON round-trip would turn into `0`, and defines keys
  rather than assigning them, so a `__proto__` key stays a key.
- `structuredClone` was the only host-built object reaching a plain-object
  check; `URL` and `TextDecoder` results are only read as strings.
- A new test bundles the package, loads it in a fresh `vm` context given the
  host's globals (as Jest's node environment is), and verifies All Points
  Media #73's migration there with the same result as the host. It fails on
  0.17.0 with `JSON_NON_PLAIN_OBJECT`.

Consumers that swapped `structuredClone` for a JSON round-trip to work around
this (megaseo-web's `site_guard_candidate_migration.test.ts`) can drop the
workaround once they pin 0.17.1.

## 0.17.0

0.17.0 also carries the unpublished 0.15.0 (#114), 0.16.0 (#115), 0.16.1 (#117) and 0.16.2 (#119): each was
merged but never published, so this is the first release that ships them.

**A line break inside one block is a node.** Nearly thirty All Points Media
blocks are drawn on fixed lines (hero headings split by `<br>`, line-by-line
reveals), and each stayed one field per line because the only way to store a
break was `"\n"` in a text node, which the CMS writer refuses. A break is now
the inline node `{ "type": "hard_break" }`.

The invariant: a block that draws N lines is one field, and its line breaks
are structure, never control characters.

- **The node** has exactly one key, `type`: no attrs, no marks, nothing else.
  It sits in a paragraph's or heading's `content` (list items' and
  blockquotes' paragraphs included) between two non-empty text nodes: never
  first, never last, never next to another break or to empty text. It counts as a node toward
  `maxNodes` and as no character toward `maxCharacters`.
- **The opt-in.** A rich-text field admits breaks only with
  `allowHardBreaks: true`; absent or `false` admits none. `maxHardBreaks`
  (whole, 1 to 16, `MANAGED_RICH_TEXT_MAX_HARD_BREAKS`) caps the value's total
  and is refused without the opt-in; absent is unbounded.
- **Text refuses every control character** (`\p{Cc}`), `"\n"` included,
  matching the CMS writer (`[[:cntrl:]]`) and reader.
- **Rendering.** `groupManagedRichTextInlines` emits a `{ kind: "hard_break" }`
  span, placed inside every mark both neighbours share from the outside in.
  A site renders it as `<br data-gomega-break="">`
  (`managedRichTextBreakAttributesV1`, `MANAGED_RICH_TEXT_BREAK_ATTRIBUTE`)
  unless it renders its own line element carrying the same attribute.
- **Compatibility.** Adding the opt-in, or raising or removing the cap, is
  widening; dropping the opt-in, adding a cap or lowering one is narrowing.
- **Field migrations** defer (`MIGRATION_TRANSFORM_DEFERRED`) a source block
  holding a break, and any part whose text carries a control character (a
  plain-text source allowing newlines, a literal) when the target is rich text;
  a read-back refuses a target holding a break.

Added: `MANAGED_RICH_TEXT_MAX_HARD_BREAKS`, `MANAGED_RICH_TEXT_BREAK_ATTRIBUTE`,
`managedRichTextBreakAttributesV1`, and the types `ManagedRichTextText`,
`ManagedRichTextHardBreak` and `ManagedRichTextBreakAttributesV1`.
`ManagedRichTextSummary` gains `hardBreaks`, and its `inlines` now include
breaks (`textNodes` stays text only).

Compatibility: breaking for 0.x, in three places.

- `ManagedRichTextInline` is now `text | hard_break`, and `ManagedRichTextSpan`
  gains `hard_break`, so code reading `.text` or `.mark` off either must narrow
  first. No field without the opt-in can hold a break, so every existing
  contract admits exactly the documents it did.
- A text node holding a control character, which the CMS writer has always
  refused, is now refused here too. A value written outside the CMS (a
  converter output with a tab or a C1 reference) no longer passes Site Guard.
  Measured before release: every rich-text text node committed on the default
  branch of the eight customer repositories carrying a managed contract (All
  Points Media, Conejo Bros, BDC, Co-Packing Express, Foro, Michelle Choe,
  Tekoda, TrendCandy; 80 nodes) holds none, so no live site is affected.
- The contract and content JSON Schema changes: the inline union, the text
  pattern `^\P{Cc}*$` and the two constraints.

CMS parity: `rich-text-block-grammar-cases.json` gains 74 hard-break rows
(the node, its placement, empty neighbours, the opt-in, the cap and what it
counts, its own keys, the order rules are judged in, misspelt types, its
parents, and control characters in text) with the CMS writer's reasons; its
`about` states the rule order and how the cap counts.
megaseo-web's byte-identical copy, its reader and its SQL writer move to it in
their own changes; until then the writer refuses every break, which is the safe
direction.

## 0.16.2

**A migration renames a field only where the contract names a field.** A
declared field migration reads production with each retired source renamed to
its target before comparing SEO facts. Since 0.15.0 that rename rewrote every
string in a production SEO entry, at any depth, so a JSON-LD literal equal to
a retired id (`requiredOutputProperties: ["field_old"]`, or a `schemaType`)
was read as the target, and a candidate that changed the literal to
`"field_new"` was accepted as unchanged, while one that kept it was refused.
The rename now applies only at a location the occurrence registry declares as
a global field reference (`idKind` field, role reference, global scope), the
same authority the migration's own reference rule reads. Every other string
(JSON-LD literals, page and asset references, collection-scoped references,
and any key the registry does not declare) is compared verbatim, so changing
it fails the ordinary SEO rule (`COMPATIBILITY_PAGE_SEO_CHANGED` and its
section siblings). The migration's outline rule
(`MIGRATION_REFERENCE_CHANGED`) reads the same renamed production, and picks
the entries that name a migrated field from the registry's reference records
rather than a `fieldId` key.

Compatibility: a narrowing of declared migrations only. A valid contract
holds field ids only at field references, so a real migration renames exactly
what it renamed before; the #73 fixtures pass unchanged. Ordinary code changes
pass no renames and are unaffected.

## 0.16.1

**An outlined rich-text H1 renders exactly one level 1 heading.** 0.16.0
required a rich-text field the page's outline names at level 1 to render a
level 1 heading block (`CONTENT_RICH_TEXT_H1_MISSING`), but accepted one that
renders two (`[h1 "a", h1 "b"]`): two `<h1>` elements from one field, on a
page whose outline declares one H1. Content semantics now refuse more than one
level 1 block in a rich-text value a page renders, as
`CONTENT_RICH_TEXT_H1_REPEATED`. A field the outline does not name at level 1
was already refused for holding any (`CONTENT_RICH_TEXT_H1_UNDECLARED`), so
this closes the outlined case. Headings are top-level blocks only (a list item
or quotation holds paragraphs), so a second H1 cannot hide in a nested block.
`managedRenderedH1Sources` reports such fields in a new
`repeatedRichTextFields`, and `managedRichTextLevelOneHeadingCount` is
exported, so a CMS refuses the same edit by calling the same reading.

Compatibility: a narrowing of content. Every real content revision checked
passes: every revision of All Points Media (all worktrees and apm-recheck),
BDC Promotions, the starter and the Astro reference, projected from their own
sources, and the #73 fixtures. Trendcandy Taste's contract does not parse on
its retired bridge version, so it was not checked.

CMS parity: megaseo-web's rich-text validation must refuse a second level 1
block in an outlined field, with the 0.16.0 rules, when it pins this version.

## 0.16.0

**A code change keeps every production URL and SEO identity fact.**
`validateManagedSiteContractV1Compatibility`, the policy Site Guard's
CODE_CHANGE mode runs, compared runtime identity, declarations, tombstones and
field, collection, asset and alias policy, but not `internalSeo` or a page's
`route`. A candidate that dropped a 301 redirect, moved `/about` to `/zzz` with
no redirect and re-pointed `businessIdentity.telephone` to another field was
`compatible`. It now fails on the first of these, each with its own code:

- `COMPATIBILITY_ROUTE_REMOVED`: every production page keeps its route
  exactly, a static path or a generated pattern with its collection and route
  key. **URL moves are blocked.** A move changes the route and the page's
  canonical together, and a code change cannot edit content, so no move is
  admitted until Site Guard can check a code change and a content change as
  one; that future combined path is where moves belong. The ordinary policy
  and a declared migration run the same rule (`assertProductionRoutesUnmoved`).
  Removing a page stays refused as `COMPATIBILITY_DECLARATION_REMOVED`,
  tombstoned or not, as before.
- `COMPATIBILITY_REDIRECT_REMOVED`: every production redirect is kept at its
  `fromPath`.
- `COMPATIBILITY_REDIRECT_CHANGED`: a kept redirect is compared whole, except
  the fields named in `MANAGED_REDIRECT_FIELDS_WITH_THEIR_OWN_RULE`
  (`destination`, `status`). Its destination may change only to a page the
  candidate serves at a static path, indexed at its own URL: its own
  indexing value is `index: true` and its own canonical names that path on the site's own origin (the one origin every canonical
  the site publishes names). A redirect to a
  noindex page, or to one that canonicalises elsewhere, hands the old URL to
  something search engines will not keep, and a site-owned value is no
  evidence about one page. A 301 or 308 stays permanent (any other status
  counts as temporary). New
  redirects are free. Every kept redirect that changed is listed in the
  result's new `changedRedirects` (`fromPath`, `fromDestination`,
  `toDestination`, `fromStatus`, `toStatus`, ordered by path), so Site Guard
  can show what a code change does to an existing URL.
- `COMPATIBILITY_SEO_IDENTITY_CHANGED`, `COMPATIBILITY_PAGE_SEO_CHANGED` and
  `COMPATIBILITY_GENERATED_PAGE_SEO_CHANGED` (`COMPATIBILITY_SEO_CHANGED` for
  a section the schema gains later): every `internalSeo` section the schema
  declares is compared, except those another rule owns
  (`MANAGED_SEO_SECTIONS_WITH_THEIR_OWN_RULE`: protected fields, held by the
  field policy, and redirects). Each page entry is compared whole, values as
  well as references, except the facts in `MANAGED_SEO_FACTS_NOT_COMPARED`:
  `intent.purpose`, `sitemap`, `internalLinks.minimumInboundLinks` and
  `performanceBudget`. All Points Media #61 changed a hidden 404 page's
  purpose and sitemap entry by code, which was right. A code change may add
  facts (a list item, a business-identity key) but may not change, drop or
  fill one: a null is a fact everywhere except in the sections named in
  `MANAGED_SEO_SECTIONS_WITH_OPEN_SLOTS` (business identity, where a null key
  publishes nothing). A null share-card title means the card keeps its own
  text, so filling it, even with a protected field, puts new words on the
  card; the same holds for the share description, image and image field.
  Re-pointing a reference is refused even to a field holding the same value:
  which field owns a fact is what later CMS edits change, so moving it is
  content, not code. One exception, below.

**Order is identity only where nothing says otherwise.** A list the
occurrence registry finds a reference in (an outline, JSON-LD declarations and
their sources, a page's services and locations, required internal links) is
a set: its production items must all stay, each kept by a distinct candidate
item, but they may move, so swapping two sections or reordering services
passes. Every such move is listed in the result's new `reorderedSeo`
(`path`, `from`, `to`), on the ordinary and migration paths alike; a list is
read as moved only when no in-order assignment of its items exists, so an
unchanged list, or items edited in place, list nothing. A list no reference
passes through (JSON-LD output properties) keeps its order. An outline's
level 1 entry is the page's H1: it is kept exactly, none may be added (a page
with no H1 may gain one, under the H1 rule below), and it
keeps its place, with the same production entries before and after it, while
the sections around it may reorder.

**A static page's outline names headings, and at most one H1.** Contract
semantics now refuse, as `CONTRACT_SEO_FIELD_POLICY`, a static page outline
with more than one level 1 entry, or an entry naming a field that is not a
heading the page renders: a field another page renders, a heading field at
another level, a plain-text, link, image, collection or protected field, a
rich-text field that admits no heading block, or a rich-text field at a level
its grammar cannot render (4 to 6). A rich-text field that admits only
paragraphs renders no heading the contract can see, even when code wraps it
in an `h1`; Trendcandy Taste's contract names one as its H1, and so would be
refused (its contract already fails to parse on a retired bridge version).
Generated pages already required exactly one H1 naming heading fields; a
static page may declare none. Seven
#114 migration refusal tests built production outlines naming plain-text
sources or levels their fields do not render; semantics now refuse those
inputs first, and their expected code is now `CONTRACT_SEO_FIELD_POLICY`.

**A page's H1 is read from what it renders, not only from its outline.** A
page, static or generated, renders an H1 three ways: a level 1 heading field
it renders, a level 1 outline entry, and a level 1 rich-text heading block.
"Renders" means every field the page shows: its own sections' fields,
site-wide fields it uses, and the item fields of every collection it renders
(a collection field on the page, or a generated page's own collection), with
the values those fields hold there (page-, site- or item-owned). One exported
reading, `managedRenderedH1Sources` (and `managedPageH1Fields`, the set it
yields), is what both rules below use, so a CMS can apply the same one.
Outlines do not list every rendered heading (All Points Media's pages render
their H1 as two level 1 heading fields, "Heading line 1" and "Heading line
2", that no outline names), so:

- compatibility compares each page's H1 field set, on static and generated
  pages alike. Once production's set is non-empty, any change to it is
  refused as `COMPATIBILITY_PAGE_SEO_CHANGED`: a page may not gain, lose or
  swap an H1 field, including a level 1 item field added to a collection the
  page lists. A page whose production set is empty may gain its H1 fields in
  one change (making the headline it already shows editable, as All Points
  Media did page by page); that is admitted and listed in the result's new
  `adoptedH1` (`pageId`, `fieldIds`), and in a migration proof as an
  `h1_adopted` item. The same rule applies to generated pages, though their
  outline must already declare exactly one H1, so none can adopt. An adopted
  outline H1 takes the H1's place, before every section production had. One
  visible H1 may span several fields, so this is a set, not a count; the
  outline still names at most one. A migration reads production's set
  renamed through it.
- content semantics hold a rich-text H1 to the outline, on every page:
  a level 1 rich-text heading block may render only in a field the page's
  outline names at level 1 (`CONTENT_RICH_TEXT_H1_UNDECLARED`), and a
  rich-text field the outline names at level 1 must render one
  (`CONTENT_RICH_TEXT_H1_MISSING`), so neither code nor a CMS edit can add a
  rich-text H1, or delete or demote the one the outline promises. A
  rich-text field's level lives in its content, and the schema cannot rule a
  level out (a field admits `heading` blocks at every level), so content
  semantics close it. Levels 2 and 3 are not held to the outline: All Points
  Media #73's content has a level 3 rich-text heading its outline does not
  name.

CMS parity: megaseo-web's rich-text validation must apply both content rules
when it pins this version, by calling `managedRenderedH1Sources` rather than
restating it. Until it does, its CMS refuses every level 1 heading (0.14.0),
but nothing stops it deleting a rich-text H1 the outline declares.

**Adopting editable SEO on a production page (0.10.0) stays possible.** A
static page's title or description may be re-pointed from its production
source to a new customer-editable `seo_*` field when the new field's one
candidate value is exactly the string production serves today from the old
source for that page alone (a page-owned value; a site-wide value need not be
what the page shows), and the slot's share-card echo (`social.title` or
`social.description`) names a protected field: production's echo kept, or,
where production had none (every converted site emits null), the re-point's
old source, whose text is the text the page serves. The site fills an og or
twitter card from an editable title whose echo is null or names it, so
without that echo the card's text would change. Nothing visible or indexed
changes. The eligible slots come from the slot table contract semantics
enforce (`MANAGED_METADATA_SLOT_POLICY`, a primary reference whose slot names
an editable semantic), so social echoes, canonical, indexing and generated
pages are never eligible. Refused as `COMPATIBILITY_PAGE_SEO_CHANGED`: any
other text (a changed word, a trailing space, a no-break space, a look-alike
letter), a blank or whitespace-only value (the site falls back from it to
something else), a site-owned old value, an echo left null or set to any
field but the old source, and a re-point to any field that is not a new
customer-editable `seo_*` field. A string not in NFC is refused earlier by
the parser.

The checks run after every older one, so a candidate the policy already
refused is refused with the same code. The result gains `changedRedirects`
and `reorderedSeo`, both empty for an unchanged pair. The one existing
compatibility test whose outcome changes is the 0.10.0 re-point fixture,
whose editable title differs from production's ("home | Gomega" for
"Gomega"): it is now refused, and a re-point of a page-scoped title and
description to production's own text, with protected share-card echoes, is
accepted. Checked against history: across every commit of
`src/content/managed-site.contract.json` in All Points Media (18 commit
pairs), BDC Promotions, Trendcandy Taste, the starter and the Astro
reference, no route or redirect ever changed, no business identity reference
changed and no SEO list was reordered. Refused pairs: All Points Media's five
field merges, which remove 69 to 102 production fields and so were already
refused (0.15.0's declared migrations are their path; #73 passes it). The
three All Points Media commits that made a page's existing headline editable
(4ef0352f, 698ab4ec, 268b1002 #70) pass, each listing the pages whose H1 it
declares in `adoptedH1` (1, 4 and 12 pages). None of those sites declares a
redirect.

**Declared field migrations run the same rule.**
`validateManagedSiteContractV1MigrationCompatibility` (0.15.0) said every SEO
fact outside its migrated outline entries was the ordinary policy's business,
but the ordinary policy compared none, and the migration path never ran it, so
a migration could also drop a redirect or re-point the telephone. It now runs
`assertManagedProductionUrlsAndSeoIdentity` with production read through the
migration: each retired source renamed to its target. Every SEO fact is then
compared as for any change, and any reorder (a target rendering in another
section, an unrelated heading moving around it) is listed in the proof as a
`seo_reordered` item, the same `path`, `from` and `to` the ordinary result
lists. This replaces 0.15.0's `outline_reordered` item and its exported type
`ManagedSiteFieldMigrationOutlineReorderV1`, now
`ManagedSiteFieldMigrationSeoReorderV1`; the migration rule itself still
requires every migrated outline entry, renamed, at its level. A migration
declares fields, not URLs, and its proof has nowhere to name one, so a
migration that moves a production page (`COMPATIBILITY_ROUTE_REMOVED`) or
adds or changes a redirect (`COMPATIBILITY_REDIRECT_CHANGED`) is refused. All
Points Media #73, the real migration in the test fixture, passes unchanged.

**Level 1 rich-text headings (0.14.0).** An outline entry naming a rich-text
field whose block is a level 1 heading is compared like any other H1:
dropping, re-levelling or re-pointing it is refused, and its text and level
are content, kept by `COMPATIBILITY_CONTENT_CHANGED`.

Version: a narrowing of what the policy and contract semantics admit, so a
minor release, as 0.12.0 and 0.13.0 were. megaseo-web pins 0.14.0 and gains
these rules only when it moves its pin; the converter's `--rewire` gate
follows the pin to [0.16.0, 0.17.0).

## 0.15.0

**A declared field migration, proved.** A change that reshapes production
fields (All Points Media #73 merged 69 text fields into 34 rich-text and
plain-text fields, and moved the bridge from v8 to v9) cannot pass the
compatibility policy, which refuses any changed production value. It can now
be declared in `managed-site.migration.json` and proved by
`validateManagedSiteContractV1MigrationCompatibility`.

The invariant: every production value is unchanged or consumed by exactly one
declared step; a step's target is exactly F of its sources and declared parts
in canonical JSON, and reads back to each source's text with its original
marks; a heading or rich-text source keeps its block and level, and a step
joins at most one such block; a source may be referenced (per the occurrence
registry) only by a heading outline, which must name the target at the level
it renders (an order change among migrated entries is listed, not refused); plain text keeps its role (running text only, and
only a label or caption may become a heading); sources joined out of
production's order, or around other fields, are listed as reordered; text a
reader now sees in another section, or a target out of order in its section,
is listed as moved, and an outline whose migrated headings now come in
another order as outline_reordered; a plain-text target that relabels its sources' role is
listed as a role change;
nothing is dropped
and nothing undeclared changes, and whatever else the candidate adds is listed
in the proof. The runtime changes
only along a declared forward step of one supported bridge version that an
injected `admitBridge(version, integrity)` admits. Only `merge` is supported;
every other op is refused with `MIGRATION_TRANSFORM_DEFERRED`. The README's
"Field migrations" section lists the rules and error codes.

Added:

- `parseManagedSiteFieldMigrationV1`, `MANAGED_SITE_FIELD_MIGRATION_FILE`,
  `MANAGED_SITE_FIELD_MIGRATION_OPS` and the generated JSON Schema
  `schema/managed-site.migration.v1.schema.json`;
- `applyManagedSiteFieldMigrationStepV1` (F) and
  `readBackManagedSiteFieldMigrationStepV1`;
- `validateManagedSiteContractV1MigrationCompatibility` and
  `managedSiteFieldMigrationFromV1`, returning a
  `ManagedSiteFieldMigrationProofV1` that lists every added literal, mark,
  link and block;
- `gomega-managed-site-conformance migrate`, the same check for a site's CI.

The converter writes the sidecar from a person's plan and refuses a plan
whose steps do not consume exactly the fields each target's anchor replaced;
it does not write the parts itself (see its README). A conversion now fails
when it retires any id no declared step consumes, including every retired
page, section, item, asset or collection, which no declaration can resolve.

Compatibility: additive. `validateManagedSiteContractV1Compatibility` is
unchanged: its checks now take an exclusion set, which it passes empty, and
its tests run unmodified. No schema, descriptor or content rule changes; the
contract and content JSON Schema is byte-identical. The conformance CLI's
`--help` gains the `migrate` line.

Consumers: megaseo-web pins 0.13.0 today. Site Guard does not run the
migration check until it moves to 0.15.0 and reads the sidecar, so until then
a migrated site still fails the ordinary policy. The converter now pins
0.15.0, which moves its `--rewire` gate to [0.15.0, 0.16.0).

Heading level 1 (0.14.0): a `heading_text` source at `semanticLevel` 1 merges
only into a rich-text heading at level 1, and an outline entry at level 1
binds a target exactly as at 2 or 3. Levels 4 to 6 have no rich-text heading,
so a source at one of them cannot be merged.

## 0.14.0

**A rich-text heading may be level 1.** The heading block admits levels 1, 2
and 3 (was 2 and 3); 0, 4 and anything that is not the number 1, 2 or 3 stay
refused. A converted page title is often one formatted `h1`, a hero heading
with a styled span (All Points Media has 13), and the converter, which reads
its levels from `MANAGED_RICH_TEXT_HEADING_LEVELS`, now stores one as a level 1
heading block rather than a paragraph. Levels 4 to 6 stay a paragraph, the
element keeping its tag in code. The generated runtime's document reader draws
each level at its own rank (it drew every level but 2 as `h3`).

Compatibility: a widening of content. Every document 0.13.0 accepts parses
unchanged, and no descriptor or compatibility rule changes. A field that
already opts into headings and states no `maxBlocks` (a prose body) may now
hold an `h1`; its renderer owns the page's outline, and the generated-page
heading outline still counts `heading_text` fields only. A site re-converted
with this version turns a formatted `h1` field from a paragraph field into a
heading field, which the compatibility policy treats as a changed policy, so
that field moves by re-enrolment like any contract change.

CMS parity: the shared grammar table flips "a heading whose level is 1" to
accepted, and nothing else; megaseo-web's copy and its writer
(`managed_site_cms_validate_rich_text`) and reader (`cms_rich_text_grammar.ts`)
move to levels 1 to 3 in the change that pins this version. Until then the CMS
refuses to save a level 1 heading.

## 0.13.0

**Only values a renderer can render exactly.** Two values the contract
accepted had no correct rendering:

- **A link field to a generated page.** An internal destination names a page
  and no item, so a generated page (`/services/[slug]`) has no URL for it; a
  renderer could only fail or invent one. Every internal destination -- a link
  field's, as a prose link mark's already was since 0.11.0 -- must now name a
  page with a single static path, decided by one predicate. A link field is
  refused with `CONTENT_LINK_PAGE_UNPATHED`, a prose link still with
  `CONTENT_RICH_TEXT_LINK_PAGE_UNPATHED`.
- **A crop smaller than a pixel.** A crop is a region of the image's own pixel
  grid, so its smallest meaningful size is one pixel on each axis:
  `crop.width >= 1 / width` and `crop.height >= 1 / height`, compared as IEEE
  doubles. `1 / width` is exactly how a one-pixel crop is written; the product
  form, `crop.width * width >= 1`, rounds and refused that very value for 540
  widths up to 5000 (the first is 49). Below one pixel a crop selects no whole
  pixel and asks a renderer to zoom by an unbounded factor (a 1e-307 crop of a
  1200px image is a 10^309-fold zoom, `Infinity%` in CSS). The bound comes from
  the image's own resolution, not a chosen constant; at one pixel a renderer's
  zoom, `100 / crop.width`, is at most `100 * width`. Coordinates were already
  finite (JSON carries no NaN or Infinity and the number schema refuses them)
  with `x + width <= 1` and `y + height <= 1`.

Compatibility: a narrowing of content, not of contracts. No descriptor,
schema shape or compatibility rule changes; the JSON Schema is regenerated
with the same meaning (the image value's parts are now shared definitions).
Before release, none of the affected values existed: production's 5 contract
revisions declare no generated page, its 5 content revisions hold 25 internal
link values (none to a generated page) and no image values, its one CMS draft
operation is a heading edit, and the All Points Media worktrees, the starter
content and every fixture hold no link to a generated page and no crop.

CMS parity: megaseo-web pins 0.9.0. When it moves past 0.13.0, its link rule
(`src/util/cms_link_rules.ts` and the SQL twin
`managed_site_cms_link_page_catalog`) must refuse generated pages as internal
destinations, and `managed_site_cms_validate_image` must enforce the same
one-pixel crop bound, in that same change. The twin has to compare the same
doubles, in float8, not numeric:

    (crop->>'width')::float8 >= 1.0::float8 / (p_value->>'width')::float8
    (crop->>'height')::float8 >= 1.0::float8 / (p_value->>'height')::float8

Its existing crop checks (`20260821025502_managed_site_cms_image_contract.sql`,
lines 175-180) cast to `::numeric`, including `x + width <= 1`. Exact decimal
arithmetic can accept a value this package's doubles refuse, which is the
lockout direction (the CMS saves what Site Guard then refuses), so those checks
move to float8 in the same change. The CMS crop UI must write a one-pixel crop
only as `1 / w`, never by any other arithmetic.

## 0.12.0

**An image's path must be a served path.** An image content value's `path`,
and every `assetManifest` entry's `path`, must begin with `public/`
(`MANAGED_SERVED_ASSET_ROOT`) and name a file beneath it. The prefix is compared
exactly, so `Public/`, `publicx/`, `./public/`, a bare `public` and
`public/../src` are refused along with any other directory. The same rule is in
the zod parsers, `validateManagedImageValue` and the published JSON Schema
(format `gomega-served-asset-path-v1`), and `isManagedServedAssetPath` exports
it for a renderer.

Why: Next.js serves only `public/`, so an image elsewhere was a value the
contract accepted and no site could render. A contract that accepts only what
renders lets a site's runtime refuse the rest instead of emitting a broken URL.

The converter follows: its config refuses, at load, any `assetRoot` but the
served root `public`, and every image path it emits is judged with
`isManagedServedAssetPath` as it is built, so a path outside `public/` becomes
an `ASSET_PATH_UNREPRESENTABLE` finding rather than a proposal the contract
refuses. The starter's own image reader uses the same export.

Compatibility: a narrowing of content, not of contracts. No contract field,
descriptor or compatibility rule changes; the published JSON Schema changes
one definition, the format shared by image and manifest paths. Content that stored an image outside
`public/` now fails validation. Before release there was none: production held
5 content revisions with no image values, no asset manifest entries, no CMS
image drafts and no CMS image assets, and every image value in the All Points
Media worktrees, the site-starter content and the conversion fixtures is under
`public/`. megaseo-web's CMS already writes only
`public/managed-site-cms/{sha256}.{ext}` (enforced by
`managed_site_cms_image_assets_material_valid`), and a SET_IMAGE either keeps the
stored material or names a recorded upload, so it cannot produce a refused path.

Low, known: a path under `public/` that Next.js does not serve as a plain file
-- `public/_next/...`, or a dotfile such as `public/.well-known/...` -- is still
accepted. The CMS cannot write one (it writes only `managed-site-cms/{sha256}.{ext}`)
and the converter only records files a site's own source references, so it is
left to a later rule if one is ever needed.
