import ts from "typescript";

import { extendAnchor, type AnchorPath, type AnchorSegment } from "./anchors.js";
import {
  POSITION_IDENTITY,
  type Candidate,
  type CollectionItemValue,
  type Ownership,
  type RawDestination,
} from "./candidates.js";
import {
  resolveStaticValue,
  textPropertyOf,
  type ResolutionContext,
} from "./evaluate.js";
import { propRoleOf, type PropRole, type PropRoleContext } from "./prop-roles.js";
import {
  analyseItemTemplate,
  readMapCall,
  type MapCall,
  type TagRoles,
} from "./collections.js";
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
  isProvablyHostTag,
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

/**
 * Whether a value written in a name-bearing attribute may become anchor
 * material, and if not, which of the two reasons applies.
 *
 * The two refusals are not interchangeable. A value this tool hands to the
 * customer is refused AND reported, because nothing else mentions the name it
 * stopped being. A value it simply could not read is refused in silence, because
 * `#collectComponentProp` already reports the same unreadable receiver against
 * the prop itself, and saying it twice adds noise rather than an action.
 */
type NameVerdict =
  | { readonly kind: "durable" }
  | { readonly kind: "the_customer's" }
  | { readonly kind: "not_proven" };

/** What reading a component's own source yielded about one of its props. */
type ComponentPropReading =
  | { readonly kind: "role"; readonly role: PropRole }
  /** The tag names nothing this repository declares, so nothing can be read. */
  | { readonly kind: "unresolved_tag" }
  /** The component was read, and its source does not decide what the prop is. */
  | { readonly kind: "undecided" };

/**
 * Whose the value in a component prop is, given what the component does with
 * it. `null` means the value is offered to nobody: code the page never shows
 * as text is not part of the contract.
 *
 * Two readings need this answer and must never disagree. `#collectAttributes`
 * needs it to propose a field, and `#durableAttributeOf` needs it to decide
 * whether a name may become anchor material, because a name this tool also
 * offers as a field makes a region's identity depend on its own contents.
 * Stating the mapping once, as a switch over the union, means a new role cannot
 * be added without both readings being made to account for it.
 */
function ownershipOfPropRole(role: PropRole): Ownership | null {
  switch (role) {
    case "content":
      return CUSTOMER_EDITABLE;
    case "accessibility":
      return CODE_OWNED;
    case "code":
      return null;
  }
}

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

/**
 * The attributes that give a landmark its name, strongest first.
 *
 * `aria-labelledby` holds an ID, which is the same kind of durable token an
 * `id` is, so it outranks the inline spelling.
 */
const ACCESSIBLE_NAME_ATTRIBUTES: readonly string[] = ["aria-labelledby", "aria-label"];

const ID_ATTRIBUTE = "id";

/**
 * Every attribute whose literal this walker may turn into anchor material,
 * strongest first. An `id` outranks an accessible name, and both are read
 * through `#durableAttributeOf`.
 *
 * Exported because it is a contract with two readers: adding an attribute here
 * means the value it carries can name a region, and `region-names.test.ts`
 * checks each one against the routing that decides whether a customer could
 * edit it. Hand-listing the set in the test instead would let an addition pass
 * the very check written to catch it.
 */
export const NAME_BEARING_ATTRIBUTES: readonly string[] = [
  ID_ATTRIBUTE,
  ...ACCESSIBLE_NAME_ATTRIBUTES,
];

class ComponentWalker {
  readonly #candidates: Candidate[] = [];
  readonly #findings: Finding[] = [];
  readonly #declaration: ComponentDeclaration;
  readonly #constants: ModuleConstants;
  readonly #roles: TagRoles;
  readonly #resolution: ResolutionContext;
  readonly #tags: TagResolver;
  readonly #propRoles: PropRoleContext;
  /**
   * One reading per attribute, because two readings want the same one.
   *
   * `#namingOf` asks what a component does with an `id` before
   * `#collectAttributes` asks the same question about the same attribute of the
   * same element, and the answer is a function of that attribute node alone:
   * the node fixes its own name and its owner's tag, and the walker fixes the
   * declaration the tag is resolved from. Both callers hold the identical
   * `ts.JsxAttribute` object, since `findAttribute` returns what
   * `namedAttributes` built. Without this, naming doubled `propRoleOf` on every
   * component-named element, and each of those walks the receiver's whole body
   * and up to `MAX_COMPONENT_DEPTH` receivers behind it.
   */
  readonly #propReadings = new WeakMap<ts.Node, ComponentPropReading>();

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
    this.#propRoles = {
      resolver: tags,
      // One reading of the repository's React version, shared by both sides.
      refReachesComponents: refReachesComponents(reactMajorOf(resolution.repositoryRoot)),
    };
  }

  run(): ExtractionResult {
    const base: AnchorPath = [{ kind: "component", name: this.#declaration.name }];
    this.#walkNode(this.#declaration.jsxRoot, base);
    return { candidates: this.#candidates, findings: this.#findings };
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
    const mapCall = readMapCall(expression, this.#resolution);
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

  /**
   * The literal value this element really carries under a name, when that value
   * is provably not the customer's.
   *
   * Every attribute in `NAME_BEARING_ATTRIBUTES` is read through here, so this
   * is the one place the naming question is asked. It is NOT the only source of
   * anchor material: `#collectImage` and `#collectLink` build a discriminator
   * from `src` and `href` without passing through here, and both offer the same
   * value to the customer. That is the same mistake one segment kind over, and
   * fixing it moves existing anchors, so it is left to its own change rather
   * than smuggled in here.
   *
   * A later spread decides the attribute instead: JSX applies attributes left
   * to right, so `<section id="hero" {...rest}>` is named whatever `rest` says
   * `id` is. An identity read from the literal there names an element that may
   * not have it, which is the one way this reading can be confidently wrong.
   */
  #durableAttributeOf(element: JsxElementNode, tag: string, name: string): string | null {
    const attribute = findAttribute(element, name);
    if (attribute === null) return null;
    if (overriddenByLaterSpread(attribute)) return null;
    const value = literalAttributeValue(attribute);
    if (value === null || value.length === 0) return null;
    const verdict = this.#nameVerdictOf(tag, name, attribute);
    if (verdict.kind === "the_customer's") {
      // The one refusal with no other signal. An unsettled prop is already
      // reported against the prop itself by `#collectComponentProp`, and an
      // element whose name a spread may replace is already reported as unnamed;
      // but a prop classified as content is proposed as a field without
      // complaint, so the region it stopped naming would go unmentioned.
      this.#report(
        "NO_DURABLE_ANCHOR",
        attribute,
        `'${tag}' renders '${name}' as customer copy, so it cannot name this element: ` +
          "an anchor built from it would change the moment the copy did. Name the " +
          `element with an attribute '${tag}' does not render, or move the name onto a ` +
          "host element inside it, then re-run.",
      );
      return null;
    }
    if (verdict.kind === "not_proven") return null;
    return value;
  }

  /**
   * Whether this attribute's value may become anchor material, and when it may
   * not, which reason applies. A value is durable exactly when this tool will
   * refuse to offer it as the customer's copy.
   *
   * A region's name is the first segment of every anchor beneath it, so a name
   * this tool ALSO proposes as a field makes the region's identity depend on its
   * own contents: `<Promo id="Editable headline">` produced
   * `region:Editable headline/role:Promo#id`, a field sitting inside the region
   * it named. `anchors.ts` allows only names the developer owns.
   *
   * The attribute's NAME does not decide who owns it. On a component, `id` and
   * `aria-label` are ordinary props, and what the component does with one is
   * read from that component. A receiver this cannot read, or a prop its source
   * does not settle, refuses: an unread answer is not a proof that a value is
   * code.
   */
  #nameVerdictOf(tag: string, name: string, node: ts.JsxAttribute): NameVerdict {
    // A host attribute deliberately does NOT defer to `prop-roles.ts`'s host
    // tail, which answers a different question. That reader classifies a role,
    // and calls `alt` an accessibility interface; this one asks whether the
    // value can ever be offered as the customer's, and `#collectImage` offers
    // `alt` with `image.alt.edit`. Only these two facts prove a host value is
    // never offered: a structural attribute is dropped, and an `aria-*` one is
    // proposed as the developer's interface. Every name-bearing attribute is one
    // of the two today, so this is not yet a narrowing; it is written as the
    // derivation so a NEW one has to be routed deliberately rather than
    // inheriting a host's trust. `region-names.test.ts` holds the two together.
    if (isProvablyHostTag(tag)) {
      return STRUCTURAL_ATTRIBUTES.has(name) || isAriaAttribute(name)
        ? { kind: "durable" }
        : { kind: "not_proven" };
    }
    // A dotted tag reaches here rather than the host branch, because
    // `isProvablyHostTag` will not call a member expression a host element.
    // `#collectAttributes` disagrees: it routes by `isComponentName`, which a
    // dotted tag also fails, so the FIELD side reads a dotted tag's attributes
    // by host names.
    //
    // That disagreement is NOT harmless in both directions, and this reader is
    // what makes it visible. Given `<ui.Card aria-label="Editable headline">`
    // whose resolvable `Card` renders the label as a heading, naming reads the
    // receiver, refuses, and reports that the value is customer copy, while the
    // field side calls the same value a code-owned accessibility interface, so
    // the customer cannot edit their own heading. The misclassification predates
    // this reader. Routing both sides through `isProvablyHostTag` fixes it and
    // was measured: it costs no fields, but it turns every `className` on a
    // `motion.*` tag into a finding, 4 of them on All Points Media, because a
    // structural attribute stops being inert once the receiver decides. So the
    // repair needs a rule for structural attributes on an unreadable receiver,
    // which is a decision about fields rather than about names.
    const reading = this.#componentPropReading(tag, name, node);
    // A tag naming nothing this repository declares is a component this reader
    // never looked at, so it proposes NO field for the value and no edit can
    // reach it. Refusing here would cost real identity for no safety: `Link`,
    // `Image` and `Script` all live in `node_modules`, and `#collectImage` and
    // `#collectLink` fall back from a refused `id` to `src` and `href`, which
    // ARE the customer's. So the strict reading traded a name nothing can edit
    // for one the customer owns.
    if (reading.kind === "unresolved_tag") return { kind: "durable" };
    // A component that WAS read and whose uses disagree is different: one of
    // those uses may be rendering the value as copy.
    if (reading.kind === "undecided") return { kind: "not_proven" };
    // `null` from `ownershipOfPropRole` means the value is offered to nobody,
    // which is the strongest proof of durability there is, so an absence there
    // reads as a positive answer here. `=== CODE_OWNED` would refuse every prop
    // forwarded to a host `id`, which is most of them.
    return ownershipOfPropRole(reading.role) === CUSTOMER_EDITABLE
      ? { kind: "the_customer's" }
      : { kind: "durable" };
  }

  /**
   * What the receiving component makes of this prop.
   *
   * Both readings of a component prop come through here — the naming one above
   * and the field one in `#collectComponentProp` — so neither can resolve the
   * tag or read the role differently from the other. The two refusals stay
   * separate because the callers answer them differently: a field reports WHICH
   * half was missing, while naming treats an unread component as durable and an
   * unsettled prop as unproven.
   */
  #componentPropReading(tag: string, name: string, node: ts.Node): ComponentPropReading {
    const cached = this.#propReadings.get(node);
    if (cached !== undefined) return cached;
    const reading = this.#readComponentProp(tag, name, node);
    this.#propReadings.set(node, reading);
    return reading;
  }

  #readComponentProp(tag: string, name: string, node: ts.Node): ComponentPropReading {
    const target = resolveTagAt(this.#tags, tag, node, this.#declaration);
    if (target === null) return { kind: "unresolved_tag" };
    const role = propRoleOf(target, name, this.#propRoles);
    return role === null ? { kind: "undecided" } : { kind: "role", role };
  }

  /**
   * The name a landmark is given for assistive technology, when it is written
   * as a literal.
   *
   * `aria-labelledby` holds an ID, which is exactly the kind of name an `id`
   * attribute is. `aria-label` holds the name inline. Both are written by a
   * developer, and this tool already classifies them as code rather than
   * customer copy — so they are as durable as an `id` and are read the same
   * way. Reading only `id` left sections that carry one of these unnamed, and
   * everything inside them could then be told apart only by position.
   */
  #accessibleNameOf(element: JsxElementNode, tag: string): string | null {
    for (const attributeName of ACCESSIBLE_NAME_ATTRIBUTES) {
      const value = this.#durableAttributeOf(element, tag, attributeName);
      if (value !== null) return value;
    }
    return null;
  }

  /**
   * What names this element, and what merely tells it apart from its siblings.
   *
   * An `id` on a container names a region; an `id` on a leaf that renders its
   * own text only tells that leaf apart from its siblings. Promoting every `id`
   * to a region would split a section per paragraph.
   */
  #namingOf(
    element: JsxElementNode,
    tag: string,
  ): { readonly region: AnchorSegment | null; readonly discriminator: string | null } {
    const literalId = this.#durableAttributeOf(element, tag, ID_ATTRIBUTE);
    const isContainer =
      SECTIONING_TAGS.has(tag) ||
      LANDMARK_TAGS.has(tag) ||
      childrenOf(element).some((child) => ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child));
    if (literalId !== null && isContainer) {
      return { region: { kind: "region", name: literalId }, discriminator: null };
    }
    if (literalId !== null) return { region: null, discriminator: literalId };
    // An `id` is the strongest name, so it is tried first; an accessible name
    // is the next-strongest and names the same kind of thing. Which tags may be
    // named by either is not decided here: `#durableAttributeOf` refuses any
    // value the customer could edit, whatever the tag and whatever the
    // attribute's spelling.
    const accessibleName = isContainer ? this.#accessibleNameOf(element, tag) : null;
    if (accessibleName !== null) {
      return { region: { kind: "region", name: accessibleName }, discriminator: null };
    }
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
          "position. Give it an `id`, an `aria-label`, or an `aria-labelledby` " +
          "written as a literal, or extract it into a named component, then re-run.",
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
    // Which reading this tag gets. A PascalCase tag is a component beyond
    // doubt, so an unreadable one is reported rather than guessed. A DOTTED tag
    // is a component too, but only a resolvable one can be READ: `ui.Card` in
    // this repository is asked what it does with a prop, while `motion.div`
    // keeps the host reading, `ref` included, because a package wrapper
    // forwarding to the DOM element it names is exactly what those rules
    // describe. Asking a package this reader cannot open would turn every
    // `className` on a `motion.*` tag into a finding a human must dismiss.
    const readsAsComponent =
      isComponentName(tag) ||
      (!isProvablyHostTag(tag) &&
        resolveTagAt(this.#tags, tag, element, this.#declaration) !== null);
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
        (!readsAsComponent || !this.#propRoles.refReachesComponents)
      ) {
        continue;
      }
      const value = literalAttributeValue(attribute.node);
      if (value === null) continue;
      // A component prop is asked of the component BEFORE any host rule, for
      // the same reason `prop-roles.ts` does it in that order: `className` and
      // `aria-label` mean something fixed on a host element and nothing in
      // particular on a component, which is free to render either as copy.
      if (readsAsComponent) {
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
    const reading = this.#componentPropReading(tag, attributeName, node);
    if (reading.kind === "unresolved_tag") {
      this.#report(
        "UNKNOWN_ATTRIBUTE_ROLE",
        node,
        `'${tag}' does not resolve to a component declared in this repository, so what ` +
          `it does with '${attributeName}' cannot be read. Host attribute names mean ` +
          "nothing here: a component may render any of them as visible copy.",
      );
      return;
    }
    if (reading.kind === "undecided") {
      this.#report(
        "UNKNOWN_ATTRIBUTE_ROLE",
        node,
        `'${tag}' was read, but what it does with '${attributeName}' is not decided by ` +
          "its source. Decide whether this value is customer content, an accessibility " +
          "interface, or code.",
      );
      return;
    }
    const ownership = ownershipOfPropRole(reading.role);
    if (ownership === null) return;
    this.#pushAttributeText(
      attributeName, tag, value, scopeAnchor, discriminator, node, ownership,
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
        `Iterated binding '${sourceName(mapCall)}' exposes no readable item properties; declare this collection by hand.`,
      );
      return;
    }
    const imageField = analysis.itemFields.find((field) => field.kind === "image");
    if (imageField !== undefined) {
      this.#report(
        "COLLECTION_ITEM_IMAGE_UNSUPPORTED",
        child,
        `Items of '${sourceName(mapCall)}' each carry their own image ('${imageField.property}'), ` +
          "but the standard binds one asset slot to exactly one file, so a collection " +
          "cannot vary an image per item. Decide whether to declare these as individual " +
          "fields with their own asset slots, or to drop the images. Nothing was proposed " +
          "for this collection.",
      );
      return;
    }
    // A collection is anchored on the chain of names its array is read from,
    // the same way a value is — so an array in a data module and one declared
    // beside the markup are named the same way, and moving it does not move
    // the collection. A module-private array is qualified by the component
    // that reads it, for the reason `#collectDeclaredValue` gives.
    const collectionAnchor = mapCall.source.shared
      ? extendAnchor(anchor.filter((segment) => segment.kind === "component"), ...mapCall.source.path)
      : extendAnchor(anchor, ...mapCall.source.path);
    const items: (readonly CollectionItemValue[])[] = [];
    for (const item of mapCall.items) {
      const read = readItemValues(item, analysis, mapCall, this.#resolution);
      if (read === null) {
        this.#report(
          "NON_LITERAL_VALUE",
          child,
          `An item of '${sourceName(mapCall)}' does not hold every property the template ` +
            "renders as text, so the collection cannot be read without inventing a value " +
            "for it. Give every item the same text properties, or declare this collection " +
            "by hand.",
        );
        return;
      }
      items.push(read);
    }
    this.#candidates.push({
      kind: "collection",
      anchor: collectionAnchor,
      componentNames: [this.#declaration.name],
      identity: POSITION_IDENTITY,
      location: this.#locationOf(child),
      evidence: this.#evidenceOf(child),
      ownership: CUSTOMER_EDITABLE,
      bindingName: sourceName(mapCall),
      itemFields: analysis.itemFields,
      items,
    });
  }
}

function sourceName(mapCall: MapCall): string {
  return mapCall.source.path
    .map((segment) => (segment.kind === "binding" || segment.kind === "property" ? segment.name : ""))
    .filter((name) => name.length > 0)
    .join(".");
}

/**
 * The values one item holds for the properties the template renders.
 *
 * A property the template renders but the item does not hold as text refuses
 * the whole collection. Defaulting it to `""` — which is what this did — puts a
 * blank into the customer's content where the page shows words, and nothing
 * downstream can tell that apart from a value the site really is missing.
 */
function readItemValues(
  item: ts.ObjectLiteralExpression,
  analysis: ReturnType<typeof analyseItemTemplate>,
  mapCall: MapCall,
  context: ResolutionContext,
): readonly CollectionItemValue[] | null {
  const values: CollectionItemValue[] = [];
  const asRecord = new Map<string, string>();
  for (const spec of analysis.itemFields) {
    const value = textPropertyOf(item, spec.property, mapCall.source.declaredIn, context);
    if (value === null) return null;
    asRecord.set(spec.property, value);
  }
  for (const spec of analysis.itemFields) {
    const altExpression = analysis.altExpressions.get(spec.property);
    const altText =
      altExpression === undefined
        ? null
        : templateOverItem(altExpression, mapCall.parameterName, asRecord);
    values.push({ property: spec.property, value: asRecord.get(spec.property)!, altText });
  }
  return values;
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
