import ts from "typescript";

import { extendAnchor, type AnchorPath, type AnchorSegment } from "./anchors.js";
import {
  POSITION_IDENTITY,
  type Candidate,
  type CollectionItemValue,
  type Ownership,
  type RawDestination,
} from "./candidates.js";
import { resolveStaticValue, type ResolutionContext } from "./evaluate.js";
import { propRoleOf, type PropRole, type PropRoleContext } from "./prop-roles.js";
import { analyseItemTemplate, readMapCall, type TagRoles } from "./collections.js";
import {
  attributeExpression,
  bindingPropertyName,
  CALLER_CONSUMED_ATTRIBUTES,
  childrenOf,
  containsJsx,
  findAttribute,
  headingLevelOf,
  isAriaAttribute,
  isComponentName,
  isWalkedElement,
  jsxExpressionStringValue,
  LANDMARK_TAGS,
  literalAttributeValue,
  overriddenByLaterSpread,
  refReachesComponents,
  namedAttributes,
  SECTIONING_TAGS,
  STRUCTURAL_ATTRIBUTES,
  tagNameOf,
  type JsxElementNode,
} from "./jsx-facts.js";
import {
  collectModuleConstants,
  itemPropertyRead,
  resolvedStringValueOf,
  templateOverItem,
  type ModuleConstants,
} from "./literals.js";
import { buildRichTextDocument, partitionChildren } from "./jsx-text.js";
import { readDestination, destinationDiscriminator } from "./destinations.js";
import { walkRenderOutput, NO_TRIGGERS } from "./render-output.js";
import type { Finding, SourceLocation } from "./report.js";
import {
  evidenceOf,
  lineOf,
  namedFunctionsOf,
  ModuleCache,
  reactMajorOf,
  type ParsedModule,
} from "./scan.js";
import { resolveTagAt, tagResolver, type TagResolver } from "./reachability.js";

export interface ComponentDeclaration {
  readonly name: string;
  readonly module: ParsedModule;
  readonly jsxRoot: ts.Node;
  /** How this component spells React's `children`, e.g. `children`, `props.children`. */
  readonly childrenSlots: ReadonlySet<string>;
  readonly line: number;
}

export interface ExtractionResult {
  readonly candidates: readonly Candidate[];
  readonly findings: readonly Finding[];
}

const CUSTOMER_EDITABLE: Ownership = "customer_editable";
const CODE_OWNED: Ownership = "code_owned_interface";

const CHILDREN_PROP = "children";

/**
 * React fills `children` from the call site, so it is a slot rather than a
 * value this component declares. Layouts are required by Next.js to render it.
 */
function childrenSlotsOf(parameters: readonly ts.ParameterDeclaration[]): ReadonlySet<string> {
  const slots = new Set<string>();
  for (const parameter of parameters) {
    if (ts.isIdentifier(parameter.name)) {
      slots.add(`${parameter.name.text}.${CHILDREN_PROP}`);
      continue;
    }
    if (!ts.isObjectBindingPattern(parameter.name)) continue;
    for (const element of parameter.name.elements) {
      if (bindingPropertyName(element) !== CHILDREN_PROP) continue;
      if (ts.isIdentifier(element.name)) slots.add(element.name.text);
    }
  }
  return slots;
}

/**
 * A component is a named function that writes JSX. Which functions a module
 * names is read from `namedFunctionsOf`, the same enumeration the render walk
 * resolves callbacks against, so no function shape can be a component to one
 * reading and invisible to the other.
 */
export function findComponentDeclarations(module: ParsedModule): readonly ComponentDeclaration[] {
  return namedFunctionsOf(module.source)
    .filter((entry) => isComponentName(entry.name) && containsJsx(entry.body))
    .map((entry) => ({
      name: entry.name,
      module,
      jsxRoot: entry.body,
      childrenSlots: childrenSlotsOf(entry.parameters),
      line: lineOf(module.source, entry.body),
    }));
}

/** Framework-declared roles. Read from the import graph, never from tag spelling alone. */
export function resolveTagRoles(module: ParsedModule): TagRoles {
  const imageTags = new Set<string>(["img"]);
  const linkTags = new Set<string>(["a"]);
  for (const statement of module.source.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
    const specifier = statement.moduleSpecifier.text;
    const defaultName = statement.importClause?.name?.text;
    if (defaultName === undefined) continue;
    if (specifier === "next/image") imageTags.add(defaultName);
    if (specifier === "next/link") linkTags.add(defaultName);
  }
  return { imageTags, linkTags };
}

class ComponentWalker {
  readonly #candidates: Candidate[] = [];
  readonly #findings: Finding[] = [];
  readonly #declaration: ComponentDeclaration;
  readonly #constants: ModuleConstants;
  readonly #roles: TagRoles;
  readonly #resolution: ResolutionContext;
  readonly #tags: TagResolver;

  constructor(
    declaration: ComponentDeclaration,
    constants: ModuleConstants,
    roles: TagRoles,
    resolution: ResolutionContext,
    tags: TagResolver,
  ) {
    this.#declaration = declaration;
    this.#constants = constants;
    this.#roles = roles;
    this.#resolution = resolution;
    this.#tags = tags;
  }

  run(): ExtractionResult {
    const base: AnchorPath = [{ kind: "component", name: this.#declaration.name }];
    this.#walkNode(this.#declaration.jsxRoot, base);
    return { candidates: this.#candidates, findings: this.#findings };
  }

  /** One reading of the repository's React version, shared by both sides. */
  #propRoleContext(): PropRoleContext {
    return {
      resolver: this.#tags,
      refReachesComponents: refReachesComponents(
        reactMajorOf(this.#resolution.repositoryRoot),
      ),
    };
  }

  #locationOf(node: ts.Node): SourceLocation {
    return {
      file: this.#declaration.module.file,
      line: lineOf(this.#declaration.module.source, node),
    };
  }

  #evidenceOf(node: ts.Node): string {
    return evidenceOf(this.#declaration.module.source, node);
  }

  #report(
    code: Finding["code"],
    node: ts.Node,
    decision: string,
    anchor: string | null = null,
  ): void {
    this.#findings.push({
      code,
      anchor,
      location: this.#locationOf(node),
      evidence: this.#evidenceOf(node),
      decision,
    });
  }

  /**
   * Finds the JSX inside arbitrary statements without inventing structure.
   *
   * Which nested functions this reads is `render-output.ts`'s decision. Every
   * value here is anchored to a position and every crossing there is a call,
   * whose JSX renders an unknown number of times, so this reading takes
   * `NO_TRIGGERS` and crosses none of them. The one reader that can model that
   * repetition is `collectCollection`, which meets the call where it is written
   * and refuses it by name when it cannot.
   */
  #walkNode(node: ts.Node, anchor: AnchorPath): void {
    walkRenderOutput(node, NO_TRIGGERS, (current) => {
      if (ts.isJsxElement(current) || ts.isJsxSelfClosingElement(current)) {
        this.#walkElement(current, anchor);
        return true;
      }
      if (ts.isJsxFragment(current)) {
        this.#walkChildren(current.children, anchor);
        return true;
      }
      return false;
    });
  }

  #walkChildren(children: readonly ts.JsxChild[], anchor: AnchorPath): void {
    for (const child of children) {
      if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
        this.#walkElement(child, anchor);
        continue;
      }
      if (ts.isJsxFragment(child)) {
        this.#walkChildren(child.children, anchor);
        continue;
      }
      if (ts.isJsxExpression(child)) this.#walkExpressionChild(child, anchor);
    }
  }

  #walkExpressionChild(child: ts.JsxExpression, anchor: AnchorPath): void {
    const expression = child.expression;
    if (expression === undefined) return;
    if (jsxExpressionStringValue(child) !== null) return;
    // The caller's subtree is read where it is written, not here.
    if (this.#declaration.childrenSlots.has(expression.getText(this.#declaration.module.source))) {
      return;
    }
    const mapCall = readMapCall(expression, this.#constants);
    if (mapCall !== null) {
      this.#collectCollection(child, mapCall, anchor);
      return;
    }
    if (this.#collectDeclaredValue(expression, child)) return;
    this.#report(
      "NON_LITERAL_VALUE",
      child,
      "Decide whether this computed value is customer content; if it is, move it to a declared field first.",
    );
  }

  /**
   * A value read out of a declared binding is anchored on the binding, not on
   * where the markup happens to read it. The page is showing `ctas.primary.label`
   * — that chain of names is what the customer edits, and it survives the
   * paragraph moving, being restyled, or being read from a second component.
   */
  #collectDeclaredValue(expression: ts.Expression, node: ts.Node): boolean {
    const resolved = resolveStaticValue(expression, this.#resolution);
    if (resolved === null) return false;
    // An exported name is shared, so every component reading it names one value.
    // A module-private name means only what its own module says it means, so the
    // component reading it is part of its identity — two page modules each
    // declaring `LAST_UPDATED` are two dates, not one ambiguous field.
    const anchor = resolved.shared
      ? resolved.path
      : extendAnchor([{ kind: "component", name: this.#declaration.name }], ...resolved.path);
    this.#candidates.push({
      kind: "plain_text",
      anchor,
      componentNames: [this.#declaration.name],
      location: this.#locationOf(node),
      evidence: this.#evidenceOf(node),
      ownership: CUSTOMER_EDITABLE,
      identity: { kind: "declaration", module: resolved.declaredIn },
      semantic: "body",
      value: resolved.value,
    });
    return true;
  }

  #literalIdOf(element: JsxElementNode): string | null {
    const idAttribute = findAttribute(element, "id");
    const literalId = idAttribute === null ? null : literalAttributeValue(idAttribute);
    return literalId !== null && literalId.length > 0 ? literalId : null;
  }

  /**
   * An `id` on a container names a region; an `id` on a leaf that renders its
   * own text only tells that leaf apart from its siblings. Promoting every
   * `id` to a region would split a section per paragraph.
   */
  #namingOf(
    element: JsxElementNode,
    tag: string,
  ): { readonly region: AnchorSegment | null; readonly discriminator: string | null } {
    const literalId = this.#literalIdOf(element);
    const isContainer =
      SECTIONING_TAGS.has(tag) ||
      LANDMARK_TAGS.has(tag) ||
      childrenOf(element).some((child) => ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child));
    if (literalId !== null && isContainer) {
      return { region: { kind: "region", name: literalId }, discriminator: null };
    }
    if (literalId !== null) return { region: null, discriminator: literalId };
    if (LANDMARK_TAGS.has(tag)) {
      return { region: { kind: "region", name: tag }, discriminator: null };
    }
    return { region: null, discriminator: null };
  }

  #walkElement(element: JsxElementNode, anchor: AnchorPath): void {
    if (!isWalkedElement(element)) return;
    const tag = tagNameOf(element);

    const { region, discriminator } = this.#namingOf(element, tag);
    if (region === null && SECTIONING_TAGS.has(tag)) {
      this.#report(
        "NO_DURABLE_ANCHOR",
        element,
        "This section has no durable name, so its values can only be told apart by " +
          "position. Give it an `id` attribute or extract it into a named component, " +
          "then re-run.",
      );
    }
    const scopeAnchor = region === null ? anchor : extendAnchor(anchor, region);

    if (this.#roles.imageTags.has(tag)) {
      this.#collectImage(element, tag, scopeAnchor, discriminator);
      return;
    }
    if (this.#roles.linkTags.has(tag)) {
      this.#collectLink(element, tag, scopeAnchor, discriminator);
      return;
    }
    if (isComponentName(tag)) {
      this.#collectAttributes(element, tag, scopeAnchor, discriminator);
      this.#walkChildren(childrenOf(element), scopeAnchor);
      return;
    }
    this.#collectAttributes(element, tag, scopeAnchor, discriminator);
    this.#collectHostContent(element, tag, scopeAnchor, discriminator);
  }

  #elementAnchor(
    scopeAnchor: AnchorPath,
    tag: string,
    discriminator: string | null,
  ): AnchorPath {
    const role: AnchorSegment = { kind: "role", tag, attribute: null };
    return discriminator === null
      ? extendAnchor(scopeAnchor, role)
      : extendAnchor(scopeAnchor, role, { kind: "discriminator", value: discriminator });
  }

  #collectAttributes(
    element: JsxElementNode,
    tag: string,
    scopeAnchor: AnchorPath,
    discriminator: string | null,
  ): void {
    const isComponent = isComponentName(tag);
    for (const attribute of namedAttributes(element)) {
      if (this.#isHandledElsewhere(tag, attribute.name)) continue;
      // React consumes `key` before the component ever sees it, so nothing
      // written there renders — on a host element or a component alike.
      if (CALLER_CONSUMED_ATTRIBUTES.has(attribute.name)) continue;
      // `ref` is a handle on a host element, and on a COMPONENT it is a prop
      // only from React 19. Which applies is a fact about the repository being
      // read, so it is read from there and fails closed when it cannot be.
      if (
        attribute.name === "ref" &&
        (!isComponent || !refReachesComponents(reactMajorOf(this.#resolution.repositoryRoot)))
      ) {
        continue;
      }
      const value = literalAttributeValue(attribute.node);
      if (value === null) continue;
      // A component prop is asked of the component BEFORE any host rule, for
      // the same reason `prop-roles.ts` does it in that order: `className` and
      // `aria-label` mean something fixed on a host element and nothing in
      // particular on a component, which is free to render either as copy.
      if (isComponent) {
        if (overriddenByLaterSpread(attribute.node)) {
          this.#report(
            "UNKNOWN_ATTRIBUTE_ROLE",
            attribute.node,
            `A spread after '${attribute.name}' may replace it, so what this component ` +
              "receives is not decided here. Move the spread before the literal, or set " +
              "the value without one.",
          );
          continue;
        }
        // Host semantics are facts about HOST elements. None of them is true of
        // a component merely because its answer was not available, so this
        // always settles a component's prop — with a field when it can, and
        // with a finding naming WHICH half was missing when it cannot. There
        // is no fall-through to the host rules below, which is why it returns
        // nothing to branch on.
        this.#collectComponentProp(
          attribute.name, tag, value, scopeAnchor, discriminator, attribute.node,
        );
        continue;
      }
      if (STRUCTURAL_ATTRIBUTES.has(attribute.name)) continue;
      if (isAriaAttribute(attribute.name)) {
        this.#pushAttributeText(
          attribute.name, tag, value, scopeAnchor, discriminator, attribute.node, CODE_OWNED,
        );
        continue;
      }
      this.#report(
        "UNKNOWN_ATTRIBUTE_ROLE",
        attribute.node,
        `Decide whether the '${attribute.name}' attribute is customer content, an accessibility interface, or code.`,
      );
    }
  }

  #isHandledElsewhere(tag: string, attributeName: string): boolean {
    if (this.#roles.imageTags.has(tag) && (attributeName === "src" || attributeName === "alt")) {
      return true;
    }
    return this.#roles.linkTags.has(tag) && attributeName === "href";
  }

  /**
   * A prop the receiving component renders as text is the customer's copy; a
   * prop it puts in an `aria-*` or `alt` attribute is an accessibility
   * interface; a prop it tests, styles with, or uses as a tag is code and is
   * left alone. `prop-roles.ts` reads that from the component itself, so no
   * list of prop names decides it here.
   */
  #collectComponentProp(
    attributeName: string,
    tag: string,
    value: string,
    scopeAnchor: AnchorPath,
    discriminator: string | null,
    node: ts.Node,
  ): void {
    const target = resolveTagAt(this.#tags, tag, node, this.#declaration);
    if (target === null) {
      this.#report(
        "UNKNOWN_ATTRIBUTE_ROLE",
        node,
        `'${tag}' does not resolve to a component declared in this repository, so what ` +
          `it does with '${attributeName}' cannot be read. Host attribute names mean ` +
          "nothing here: a component may render any of them as visible copy.",
      );
      return;
    }
    const role: PropRole | null = propRoleOf(target, attributeName, this.#propRoleContext());
    if (role === null) {
      this.#report(
        "UNKNOWN_ATTRIBUTE_ROLE",
        node,
        `'${tag}' was read, but what it does with '${attributeName}' is not decided by ` +
          "its source. Decide whether this value is customer content, an accessibility " +
          "interface, or code.",
      );
      return;
    }
    if (role === "code") return;
    this.#pushAttributeText(
      attributeName,
      tag,
      value,
      scopeAnchor,
      discriminator,
      node,
      role === "content" ? CUSTOMER_EDITABLE : CODE_OWNED,
    );
  }

  #pushAttributeText(
    attributeName: string,
    tag: string,
    value: string,
    scopeAnchor: AnchorPath,
    discriminator: string | null,
    node: ts.Node,
    ownership: Ownership,
  ): void {
    const role: AnchorSegment = { kind: "role", tag, attribute: attributeName };
    const anchor =
      discriminator === null
        ? extendAnchor(scopeAnchor, role)
        : extendAnchor(scopeAnchor, role, { kind: "discriminator", value: discriminator });
    this.#candidates.push({
      kind: "plain_text",
      anchor,
      componentNames: [this.#declaration.name],
      identity: POSITION_IDENTITY,
      location: this.#locationOf(node),
      evidence: this.#evidenceOf(node),
      ownership,
      semantic: "label",
      value,
    });
  }

  #collectImage(
    element: JsxElementNode,
    tag: string,
    scopeAnchor: AnchorPath,
    declaredId: string | null,
  ): void {
    const sourceAttribute = findAttribute(element, "src");
    const source = sourceAttribute === null ? null : literalAttributeValue(sourceAttribute);
    if (source === null) {
      this.#report(
        "NON_LITERAL_VALUE",
        element,
        "Image source is not a literal path; declare the asset slot by hand.",
      );
      return;
    }
    const altAttribute = findAttribute(element, "alt");
    const altText = altAttribute === null ? null : literalAttributeValue(altAttribute);
    const discriminator = declaredId ?? source;
    const anchor = this.#elementAnchor(scopeAnchor, tag, discriminator);
    this.#candidates.push({
      kind: "image",
      anchor,
      componentNames: [this.#declaration.name],
      identity: POSITION_IDENTITY,
      location: this.#locationOf(element),
      evidence: this.#evidenceOf(element),
      ownership: CUSTOMER_EDITABLE,
      source,
      altText,
    });
  }

  #collectLink(
    element: JsxElementNode,
    tag: string,
    scopeAnchor: AnchorPath,
    declaredId: string | null,
  ): void {
    const hrefAttribute = findAttribute(element, "href");
    const expression = hrefAttribute === null ? null : attributeExpression(hrefAttribute);
    const destination =
      expression === null ? null : readDestination(expression, this.#constants);
    if (destination === null) {
      this.#report(
        "NON_LITERAL_VALUE",
        element,
        "Link destination is not a literal or a module constant; declare this link by hand.",
      );
      return;
    }
    const discriminator =
      declaredId ?? (expression === null ? null : destinationDiscriminator(destination, expression));
    const anchor = this.#elementAnchor(scopeAnchor, tag, discriminator);
    const partition = partitionChildren(childrenOf(element));
    const targetAttribute = findAttribute(element, "target");
    const target = targetAttribute === null ? null : literalAttributeValue(targetAttribute);
    this.#collectAttributes(element, tag, scopeAnchor, discriminator);
    this.#candidates.push({
      kind: "link",
      anchor,
      componentNames: [this.#declaration.name],
      identity: POSITION_IDENTITY,
      location: this.#locationOf(element),
      evidence: this.#evidenceOf(element),
      ownership: isContentDestination(destination) ? CUSTOMER_EDITABLE : CODE_OWNED,
      label: partition.allText,
      destination,
      newWindow: target === "_blank",
    });
    if (partition.elementChildren.length > 0 && !partition.hasInlineMark) {
      this.#pushDirectText(element, anchor, tag, null, partition);
      this.#collectStructuredChildren(partition, anchor);
    }
  }

  /**
   * A container that renders no text of its own contributes nothing to identity.
   * Layout wrappers are transparent so that moving a value into or out of a
   * `<div>` — which is pure presentation — cannot renumber the contract.
   */
  #collectHostContent(
    element: JsxElementNode,
    tag: string,
    scopeAnchor: AnchorPath,
    declaredId: string | null,
  ): void {
    const partition = partitionChildren(childrenOf(element));
    const headingLevel = headingLevelOf(tag);
    const rendersOwnText = partition.textRun.length > 0 || partition.hasInlineMark;
    if (!rendersOwnText) {
      this.#collectStructuredChildren(partition, scopeAnchor);
      return;
    }
    const anchor = this.#elementAnchor(scopeAnchor, tag, declaredId);
    if (partition.hasInlineMark) {
      this.#pushRichText(element, anchor, partition.children, headingLevel);
      return;
    }
    this.#pushDirectText(element, anchor, tag, headingLevel, partition);
    this.#collectStructuredChildren(partition, anchor);
  }

  /** Direct text always lives at `<element>/text`, whatever else the element holds. */
  #pushDirectText(
    element: JsxElementNode,
    anchor: AnchorPath,
    tag: string,
    headingLevel: number | null,
    partition: ReturnType<typeof partitionChildren>,
  ): void {
    if (partition.textRun.length === 0) return;
    this.#pushText(
      element,
      extendAnchor(anchor, { kind: "text" }),
      tag,
      headingLevel,
      partition.textRun,
    );
  }

  #collectStructuredChildren(
    partition: ReturnType<typeof partitionChildren>,
    anchor: AnchorPath,
  ): void {
    for (const child of partition.elementChildren) this.#walkElement(child, anchor);
    this.#walkChildren(partition.expressionChildren, anchor);
  }

  #pushRichText(
    element: JsxElementNode,
    anchor: AnchorPath,
    children: readonly ts.JsxChild[],
    headingLevel: number | null,
  ): void {
    const document = buildRichTextDocument(children);
    if (document === null) {
      this.#report(
        "NON_LITERAL_VALUE",
        element,
        "Formatted text contains a computed value; declare this rich-text field by hand.",
      );
      return;
    }
    this.#candidates.push({
      kind: "rich_text",
      anchor,
      componentNames: [this.#declaration.name],
      identity: POSITION_IDENTITY,
      location: this.#locationOf(element),
      evidence: this.#evidenceOf(element),
      ownership: CUSTOMER_EDITABLE,
      document,
      headingLevel,
    });
  }

  #pushText(
    element: JsxElementNode,
    anchor: AnchorPath,
    tag: string,
    headingLevel: number | null,
    value: string,
  ): void {
    const shared = {
      anchor,
      componentNames: [this.#declaration.name],
      identity: POSITION_IDENTITY,
      location: this.#locationOf(element),
      evidence: this.#evidenceOf(element),
      ownership: CUSTOMER_EDITABLE,
    } as const;
    if (headingLevel !== null) {
      this.#candidates.push({ ...shared, kind: "heading_text", level: headingLevel, value });
      return;
    }
    this.#candidates.push({
      ...shared,
      kind: "plain_text",
      semantic: tag === "p" || tag === "blockquote" ? "body" : "label",
      value,
    });
  }

  #collectCollection(
    child: ts.JsxExpression,
    mapCall: ReturnType<typeof readMapCall> & object,
    anchor: AnchorPath,
  ): void {
    const analysis = analyseItemTemplate(mapCall, this.#roles);
    this.#findings.push(...analysis.findings);
    if (analysis.itemFields.length === 0) {
      this.#report(
        "NON_LITERAL_VALUE",
        child,
        `Iterated binding '${mapCall.bindingName}' exposes no readable item properties; declare this collection by hand.`,
      );
      return;
    }
    const imageField = analysis.itemFields.find((field) => field.kind === "image");
    if (imageField !== undefined) {
      this.#report(
        "COLLECTION_ITEM_IMAGE_UNSUPPORTED",
        child,
        `Items of '${mapCall.bindingName}' each carry their own image ('${imageField.property}'), ` +
          "but the standard binds one asset slot to exactly one file, so a collection " +
          "cannot vary an image per item. Decide whether to declare these as individual " +
          "fields with their own asset slots, or to drop the images. Nothing was proposed " +
          "for this collection.",
      );
      return;
    }
    const collectionAnchor = extendAnchor(anchor, {
      kind: "binding",
      name: mapCall.bindingName,
    });
    this.#candidates.push({
      kind: "collection",
      anchor: collectionAnchor,
      componentNames: [this.#declaration.name],
      identity: POSITION_IDENTITY,
      location: this.#locationOf(child),
      evidence: this.#evidenceOf(child),
      ownership: CUSTOMER_EDITABLE,
      bindingName: mapCall.bindingName,
      itemFields: analysis.itemFields,
      items: mapCall.items.map((item) => readItemValues(item, analysis, mapCall.parameterName)),
    });
  }
}

function readItemValues(
  item: ReadonlyMap<string, string>,
  analysis: ReturnType<typeof analyseItemTemplate>,
  parameterName: string,
): readonly CollectionItemValue[] {
  return [...analysis.itemFields].map((spec) => {
    const altExpression = analysis.altExpressions.get(spec.property);
    const altText =
      altExpression === undefined ? null : templateOverItem(altExpression, parameterName, item);
    return { property: spec.property, value: item.get(spec.property) ?? "", altText };
  });
}

/**
 * Whether a spread AFTER this attribute could replace what it sets.
 *
 * `<Inner label="Original" {...runtimeProps} />` renders whatever
 * `runtimeProps.label` holds, so the literal written here is not what the
 * component receives. JSX resolves attributes left to right, so only a spread
 * that follows the attribute can overwrite it.
 */
function isContentDestination(destination: RawDestination): boolean {
  return destination.kind !== "self";
}

export function extractComponent(
  declaration: ComponentDeclaration,
  roles: TagRoles,
  repositoryRoot: string,
  cache: ModuleCache,
  tags: TagResolver = tagResolver(repositoryRoot, cache),
): ExtractionResult {
  const constants = collectModuleConstants(declaration.module.source);
  const resolution: ResolutionContext = {
    module: declaration.module,
    repositoryRoot,
    cache,
  };
  return new ComponentWalker(declaration, constants, roles, resolution, tags).run();
}

export { itemPropertyRead, resolvedStringValueOf };
