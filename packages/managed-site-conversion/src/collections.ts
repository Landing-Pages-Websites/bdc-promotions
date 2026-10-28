import ts from "typescript";

import type { ItemFieldSpec, Ownership } from "./candidates.js";
import {
  childrenOf,
  findAttribute,
  attributeExpression,
  headingLevelOf,
  normaliseJsxText,
  tagNameOf,
  unwrapTransparent,
  type JsxElementNode,
} from "./jsx-facts.js";
import { itemPropertyRead } from "./literals.js";
import {
  resolveArrayOfObjects,
  type ArrayResolution,
  type ResolutionContext,
} from "./evaluate.js";
import type { Finding } from "./report.js";
import { evidenceOf, locationOf } from "./scan.js";
import { isValueReference } from "./scopes.js";

export interface TagRoles {
  readonly imageTags: ReadonlySet<string>;
  readonly linkTags: ReadonlySet<string>;
}

export interface MapCall {
  /** The chain of names the array is read from, for the anchor. */
  readonly source: ArrayResolution;
  readonly parameterName: string;
  readonly template: ts.Expression;
  /** The item objects, unread: only the template knows which keys are fields. */
  readonly items: readonly ts.ObjectLiteralExpression[];
}

function arrowBodyExpression(callback: ts.Expression): ts.Expression | null {
  if (!ts.isArrowFunction(callback)) return null;
  const body = callback.body;
  if (!ts.isBlock(body)) return unwrapTransparent(body);
  const returned = body.statements.find(ts.isReturnStatement);
  return returned?.expression === undefined ? null : unwrapTransparent(returned.expression);
}

/** `BINDING.map((item) => <jsx/>)` over a module-level array of flat objects. */
/**
 * `SOURCE.map((item) => <jsx/>)` where SOURCE is an array of object literals.
 *
 * SOURCE is resolved by the same rules as any other value, so an array kept in
 * a data module — which is where a real site keeps one — reads exactly as a
 * local one does, and a path like `company.offices` reads too.
 */
export function readMapCall(
  expression: ts.Expression,
  context: ResolutionContext,
): MapCall | null {
  if (!ts.isCallExpression(expression)) return null;
  const callee = expression.expression;
  if (!ts.isPropertyAccessExpression(callee) || callee.name.text !== "map") return null;
  const callback = expression.arguments[0];
  if (callback === undefined || !ts.isArrowFunction(callback)) return null;
  const parameter = callback.parameters[0]?.name;
  if (parameter === undefined || !ts.isIdentifier(parameter)) return null;
  const template = arrowBodyExpression(callback);
  const source = resolveArrayOfObjects(callee.expression, context);
  if (template === null || source === null) return null;
  return {
    source,
    parameterName: parameter.text,
    template,
    items: source.objects,
  };
}

export interface ItemTemplateAnalysis {
  readonly itemFields: readonly ItemFieldSpec[];
  /** Image property name to the JSX expression supplying its alt text. */
  readonly altExpressions: ReadonlyMap<string, ts.Expression>;
  readonly findings: readonly Finding[];
}

interface ItemWalkState {
  readonly specs: Map<string, ItemFieldSpec>;
  readonly altExpressions: Map<string, ts.Expression>;
  readonly findings: Finding[];
}

const CUSTOMER_EDITABLE: Ownership = "customer_editable";

function recordSpec(state: ItemWalkState, spec: ItemFieldSpec): void {
  const existing = state.specs.get(spec.property);
  // A rendered read wins over a derived one; identical reads are idempotent.
  if (existing === undefined || existing.kind === "plain_text") state.specs.set(spec.property, spec);
}

function visitItemElement(
  element: JsxElementNode,
  mapCall: MapCall,
  roles: TagRoles,
  state: ItemWalkState,
): void {
  const tag = tagNameOf(element);
  if (roles.imageTags.has(tag)) {
    collectItemImage(element, mapCall, state);
    return;
  }
  if (roles.linkTags.has(tag)) collectItemLink(element, mapCall, state);
  for (const child of childrenOf(element)) {
    if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
      visitItemElement(child, mapCall, roles, state);
      continue;
    }
    if (ts.isJsxExpression(child)) collectItemText(child, tag, mapCall, state);
  }
}

function collectItemImage(element: JsxElementNode, mapCall: MapCall, state: ItemWalkState): void {
  const source = findAttribute(element, "src");
  const expression = source === null ? null : attributeExpression(source);
  const property = expression === null ? null : itemPropertyRead(expression, mapCall.parameterName);
  if (property === null) return;
  recordSpec(state, {
    property,
    kind: "image",
    semantic: "label",
    headingLevel: null,
    ownership: CUSTOMER_EDITABLE,
  });
  const alt = findAttribute(element, "alt");
  const altExpression = alt === null ? null : attributeExpression(alt);
  if (altExpression !== null) state.altExpressions.set(property, altExpression);
}

/**
 * A link in an item template is never an item field, so its href stays in the
 * repository's own array and the rendered template keeps reading it.
 *
 * A link VALUE is `{ label, destination, target }`, and an item has no label of
 * its own for the link: the text inside the anchor is the item's text fields.
 * Proposing the bare href string as a link value made every such collection's
 * content fail the contract, which refused the WHOLE proposal; a destination
 * read through a wrapper or a slug template is no more a link value than that.
 * So any href that reads the item is reported and left in code.
 */
function collectItemLink(element: JsxElementNode, mapCall: MapCall, state: ItemWalkState): void {
  const href = findAttribute(element, "href");
  const expression = href === null ? null : attributeExpression(href);
  if (expression === null || !readsItem(expression, mapCall.parameterName)) return;
  const source = element.getSourceFile();
  state.findings.push({
    code: "COLLECTION_ITEM_LINK_UNSUPPORTED",
    anchor: null,
    location: locationOf(source, source.fileName, element),
    evidence: evidenceOf(source, element),
    decision:
      "Each item of this collection links somewhere of its own, and an item link has no " +
      "label of its own to make it a link value, so its destination stays in code. The " +
      "item's text is still proposed. Give the link its own field by hand if customers " +
      "must change where each item points.",
  });
}

/** Whether an expression reads the template's item parameter anywhere. */
function readsItem(expression: ts.Expression, parameterName: string): boolean {
  let found = false;
  const visit = (node: ts.Node): void => {
    if (found) return;
    if (ts.isIdentifier(node) && node.text === parameterName && isValueReference(node)) {
      found = true;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(expression);
  return found;
}

function collectItemText(
  child: ts.JsxExpression,
  enclosingTag: string,
  mapCall: MapCall,
  state: ItemWalkState,
): void {
  const expression = child.expression;
  if (expression === undefined) return;
  const property = itemPropertyRead(expression, mapCall.parameterName);
  if (property === null) return;
  const headingLevel = headingLevelOf(enclosingTag);
  recordSpec(state, {
    property,
    kind: headingLevel === null ? "plain_text" : "heading_text",
    semantic: enclosingTag === "p" ? "body" : "label",
    headingLevel,
    ownership: CUSTOMER_EDITABLE,
  });
}

export function analyseItemTemplate(mapCall: MapCall, roles: TagRoles): ItemTemplateAnalysis {
  const state: ItemWalkState = { specs: new Map(), altExpressions: new Map(), findings: [] };
  const template = mapCall.template;
  if (ts.isJsxElement(template) || ts.isJsxSelfClosingElement(template)) {
    visitItemElement(template, mapCall, roles, state);
  }
  return {
    itemFields: [...state.specs.values()].sort((left, right) =>
      left.property.localeCompare(right.property),
    ),
    altExpressions: state.altExpressions,
    findings: state.findings,
  };
}

/** Literal text inside a repeated template belongs to code, not to an item. */
export function templateHasLiteralProse(template: ts.Expression): boolean {
  let found = false;
  const visit = (node: ts.Node): void => {
    if (ts.isJsxText(node) && normaliseJsxText(node.text).trim().length > 0) found = true;
    ts.forEachChild(node, visit);
  };
  visit(template);
  return found;
}
