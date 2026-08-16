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
import {
  itemPropertyRead,
  objectArrayOf,
  type ModuleConstants,
  type ObjectLiteralRecord,
} from "./literals.js";
import type { Finding } from "./report.js";

export interface TagRoles {
  readonly imageTags: ReadonlySet<string>;
  readonly linkTags: ReadonlySet<string>;
}

export interface MapCall {
  readonly bindingName: string;
  readonly parameterName: string;
  readonly template: ts.Expression;
  readonly items: readonly ObjectLiteralRecord[];
}

function arrowBodyExpression(callback: ts.Expression): ts.Expression | null {
  if (!ts.isArrowFunction(callback)) return null;
  const body = callback.body;
  if (!ts.isBlock(body)) return unwrapTransparent(body);
  const returned = body.statements.find(ts.isReturnStatement);
  return returned?.expression === undefined ? null : unwrapTransparent(returned.expression);
}

/** `BINDING.map((item) => <jsx/>)` over a module-level array of flat objects. */
export function readMapCall(
  expression: ts.Expression,
  constants: ModuleConstants,
): MapCall | null {
  if (!ts.isCallExpression(expression)) return null;
  const callee = expression.expression;
  if (!ts.isPropertyAccessExpression(callee) || callee.name.text !== "map") return null;
  if (!ts.isIdentifier(callee.expression)) return null;
  const callback = expression.arguments[0];
  if (callback === undefined || !ts.isArrowFunction(callback)) return null;
  const parameter = callback.parameters[0]?.name;
  if (parameter === undefined || !ts.isIdentifier(parameter)) return null;
  const template = arrowBodyExpression(callback);
  const items = objectArrayOf(callee.expression, constants);
  if (template === null || items === null) return null;
  return {
    bindingName: callee.expression.text,
    parameterName: parameter.text,
    template,
    items,
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

function collectItemLink(element: JsxElementNode, mapCall: MapCall, state: ItemWalkState): void {
  const href = findAttribute(element, "href");
  const expression = href === null ? null : attributeExpression(href);
  const property = expression === null ? null : itemPropertyRead(expression, mapCall.parameterName);
  if (property === null) return;
  recordSpec(state, {
    property,
    kind: "link",
    semantic: "label",
    headingLevel: null,
    ownership: CUSTOMER_EDITABLE,
  });
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
