import ts from "typescript";

import { isComponentName } from "./jsx-facts.js";

/**
 * Which names a piece of syntax binds.
 *
 * Two readers need this and they must not drift apart. The value resolver asks
 * whether a module-level `const` is shadowed at a reference; the prop-role
 * reader asks whether a prop name is rebound between a reference and the
 * component that declares it. Those are the same question with different stop
 * points, so they are one derivation with a parameter — not two lists that
 * agree right up until one of them is extended.
 */

/** Every name a binding introduces, including destructured and renamed ones. */
export function bindingNames(name: ts.BindingName, into: Set<string>): void {
  if (ts.isIdentifier(name)) {
    into.add(name.text);
    return;
  }
  if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) {
    for (const element of name.elements) {
      if (ts.isBindingElement(element)) bindingNames(element.name, into);
    }
  }
}

/** Every name a declaration list binds, destructuring included. */
function declarationNames(list: ts.VariableDeclarationList, into: Set<string>): void {
  for (const declaration of list.declarations) {
    bindingNames(declaration.name, into);
  }
}

function parameterNames(
  parameters: readonly ts.ParameterDeclaration[],
  into: Set<string>,
): void {
  for (const parameter of parameters) bindingNames(parameter.name, into);
}

/** Every `var` in a function body, which binds the FUNCTION however deeply nested. */
function hoistedVarNames(body: ts.Node, into: Set<string>): void {
  const visit = (node: ts.Node): void => {
    // A nested function has its own `var` scope; its declarations are not ours.
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node) ||
      ts.isMethodDeclaration(node)
    ) {
      return;
    }
    if (ts.isVariableStatement(node) && (node.declarationList.flags & ts.NodeFlags.Let) === 0) {
      const isVar =
        (node.declarationList.flags & (ts.NodeFlags.Let | ts.NodeFlags.Const)) === 0;
      if (isVar) declarationNames(node.declarationList, into);
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(body, visit);
}

/**
 * The syntax that binds `name` in this scope, or null.
 *
 * `declaresName` is this question with the answer thrown away, and a caller
 * that needs to know WHAT the name is — a local component it can read, or an
 * opaque parameter it cannot — was left approximating. One walk answers both,
 * so the two cannot drift.
 */
/**
 * Whether this syntax can introduce a binding at all.
 *
 * The same list `declarationOfName` walks, named once. A reader that
 * enumerated "block, module block, case clause" separately left out loop
 * initializers, and a component declared in one passed as module scoped.
 */
export function isScopeNode(node: ts.Node): boolean {
  return (
    ts.isFunctionDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isArrowFunction(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isConstructorDeclaration(node) ||
    ts.isGetAccessorDeclaration(node) ||
    ts.isSetAccessorDeclaration(node) ||
    ts.isCatchClause(node) ||
    ts.isBlock(node) ||
    ts.isModuleBlock(node) ||
    ts.isCaseClause(node) ||
    ts.isDefaultClause(node) ||
    ts.isForStatement(node) ||
    ts.isForOfStatement(node) ||
    ts.isForInStatement(node)
  );
}

export function declarationOfName(node: ts.Node, name: string): ts.Node | null {
  if (isFunctionLike(node)) {
    for (const parameter of node.parameters) {
      const names = new Set<string>();
      bindingNames(parameter.name, names);
      if (names.has(name)) return parameter;
    }
    if (node.body !== undefined) {
      const hoisted = new Set<string>();
      hoistedVarNames(node.body, hoisted);
      if (hoisted.has(name)) return node;
    }
  }
  if (ts.isMethodDeclaration(node) || ts.isConstructorDeclaration(node)) {
    for (const parameter of node.parameters) {
      const names = new Set<string>();
      bindingNames(parameter.name, names);
      if (names.has(name)) return parameter;
    }
  }
  if (ts.isGetAccessorDeclaration(node) || ts.isSetAccessorDeclaration(node)) {
    for (const parameter of node.parameters) {
      const names = new Set<string>();
      bindingNames(parameter.name, names);
      if (names.has(name)) return parameter;
    }
  }
  if (ts.isCatchClause(node) && node.variableDeclaration !== undefined) {
    const names = new Set<string>();
    bindingNames(node.variableDeclaration.name, names);
    if (names.has(name)) return node.variableDeclaration;
  }
  // A named function or class EXPRESSION binds its own name inside itself.
  if (
    (ts.isFunctionExpression(node) ||
      ts.isClassExpression(node) ||
      ts.isFunctionDeclaration(node) ||
      ts.isClassDeclaration(node)) &&
    node.name?.text === name
  ) {
    return node;
  }
  if (ts.isBlock(node) || ts.isCaseClause(node) || ts.isDefaultClause(node)) {
    for (const statement of node.statements) {
      const found = declaredByStatement(statement, name);
      if (found !== null) return found;
    }
  }
  if (ts.isForStatement(node) || ts.isForOfStatement(node) || ts.isForInStatement(node)) {
    const initializer = node.initializer;
    if (initializer !== undefined && ts.isVariableDeclarationList(initializer)) {
      const found = declaredByList(initializer, name);
      if (found !== null) return found;
    }
  }
  return null;
}

function declaredByStatement(statement: ts.Statement, name: string): ts.Node | null {
  if (ts.isVariableStatement(statement)) {
    return declaredByList(statement.declarationList, name);
  }
  if (
    (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) &&
    statement.name?.text === name
  ) {
    return statement;
  }
  return null;
}

function declaredByList(list: ts.VariableDeclarationList, name: string): ts.Node | null {
  for (const declaration of list.declarations) {
    const names = new Set<string>();
    bindingNames(declaration.name, names);
    if (names.has(name)) return declaration;
  }
  return null;
}

function isFunctionLike(
  node: ts.Node,
): node is ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction | ts.MethodDeclaration {
  return (
    ts.isFunctionDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isArrowFunction(node) ||
    ts.isMethodDeclaration(node)
  );
}

export function declaresName(node: ts.Node, name: string): boolean {
  const names = new Set<string>();
  if (
    ts.isFunctionDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isArrowFunction(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isConstructorDeclaration(node) ||
    ts.isGetAccessorDeclaration(node) ||
    ts.isSetAccessorDeclaration(node)
  ) {
    parameterNames(node.parameters, names);
  }
  if (
    (ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node) ||
      ts.isMethodDeclaration(node)) &&
    node.body !== undefined
  ) {
    hoistedVarNames(node.body, names);
  }
  if (ts.isCatchClause(node) && node.variableDeclaration !== undefined) {
    bindingNames(node.variableDeclaration.name, names);
  }
  // A named function or class EXPRESSION binds its own name inside itself, so
  // `const P = function copy() { … copy … }` refers to the function.
  if (
    (ts.isFunctionExpression(node) ||
      ts.isClassExpression(node) ||
      ts.isFunctionDeclaration(node) ||
      ts.isClassDeclaration(node)) &&
    node.name !== undefined
  ) {
    names.add(node.name.text);
  }
  if (ts.isBlock(node) || ts.isCaseClause(node) || ts.isDefaultClause(node)) {
    for (const statement of node.statements) {
      if (ts.isVariableStatement(statement)) {
        declarationNames(statement.declarationList, names);
        continue;
      }
      // A nested `function copy() {}` or `class copy {}` shadows an outer
      // `copy` just as firmly as a `const` does.
      if (
        (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) &&
        statement.name !== undefined
      ) {
        names.add(statement.name.text);
      }
    }
  }
  // A loop declares its own binding OUTSIDE its body block, so reading only
  // block statements would miss `for (const copy of rows)` entirely.
  if (ts.isForStatement(node) || ts.isForOfStatement(node) || ts.isForInStatement(node)) {
    const initializer = node.initializer;
    if (initializer !== undefined && ts.isVariableDeclarationList(initializer)) {
      declarationNames(initializer, names);
    }
  }
  return names.has(name);
}

/**
 * Whether anything between `node` and `root` binds `name`.
 *
 * A null `root` walks to the top of the file, which is what "shadows the
 * module's binding" means. A node `root` stops there, which is what "rebound
 * between this reference and the component that declares the prop" means.
 */
export function isBoundBetween(node: ts.Node, root: ts.Node | null, name: string): boolean {
  let current: ts.Node | undefined = node.parent;
  while (current !== undefined && current !== root && !ts.isSourceFile(current)) {
    if (declaresName(current, name)) return true;
    current = current.parent;
  }
  return false;
}

/**
 * Whether an identifier is a USE of a value, rather than a place a name is
 * written down. A declaration's own name, a property key, a binding element and
 * an import specifier all spell the name without reading the object, and
 * counting them as uses would report every declaration as escaped — including
 * the line that declares it.
 */
export function isValueReference(node: ts.Identifier): boolean {
  const parent = node.parent;
  if (parent === undefined) return false;
  if (ts.isPropertyAccessExpression(parent) && parent.name === node) return false;
  if (ts.isElementAccessExpression(parent) && parent.argumentExpression === node) return false;
  if (ts.isPropertyAssignment(parent) && parent.name === node) return false;
  if (ts.isPropertySignature(parent)) return false;
  if (ts.isPropertyDeclaration(parent)) return parent.initializer === node;
  if (ts.isVariableDeclaration(parent) && parent.name === node) return false;
  if (ts.isFunctionDeclaration(parent) || ts.isClassDeclaration(parent)) return false;
  if (ts.isFunctionExpression(parent) || ts.isClassExpression(parent)) return false;
  // A parameter, a binding element and a class field each have a NAME and a
  // VALUE. Only the name is a mention; `function f(value = copy)` and
  // `class M { field = copy }` hand the object out exactly as any other
  // expression does.
  if (ts.isParameter(parent)) return parent.initializer === node;
  if (ts.isBindingElement(parent)) return parent.initializer === node;
  if (ts.isJsxAttribute(parent) && parent.name === node) return false;
  // A lowercase JSX tag names an ELEMENT — React reads it as a string — so it
  // is not a use of anything called `main`. A capitalised one IS a use of the
  // binding it names.
  if (
    (ts.isJsxOpeningElement(parent) ||
      ts.isJsxSelfClosingElement(parent) ||
      ts.isJsxClosingElement(parent)) &&
    parent.tagName === node
  ) {
    return isComponentName(node.text);
  }
  if (ts.isImportSpecifier(parent) || ts.isExportSpecifier(parent)) return false;
  if (ts.isImportClause(parent) || ts.isNamespaceImport(parent)) return false;
  if (ts.isImportEqualsDeclaration(parent)) return false;
  if (ts.isMethodDeclaration(parent) || ts.isMethodSignature(parent)) return false;
  if (ts.isEnumMember(parent) || ts.isTypeReferenceNode(parent)) return false;
  if (ts.isQualifiedName(parent)) return false;
  // `typeof copy` names the value's TYPE. No type can write to it.
  if (ts.isTypeQueryNode(parent)) return false;
  if (ts.isLabeledStatement(parent) || ts.isBreakOrContinueStatement(parent)) return false;
  // `{ copy }` is deliberately NOT excluded. The identifier is both the key and
  // the value there, and as the value it hands the object out — so treating the
  // shorthand as a name-only mention would miss `const w = { copy };
  // w.copy.title = …` entirely.
  return true;
}
