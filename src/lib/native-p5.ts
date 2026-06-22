import ts from "typescript";

/**
 * Result of converting an instance-mode p5 TypeScript sketch into native
 * global-mode JavaScript (the form used by the online p5.js editor).
 *
 * See `specs/002-native-p5js-output/contracts/native-conversion.md`.
 */
export type NativeConversion =
  | { ok: true; code: string; externalImports: string[] }
  | { ok: false; reason: string };

/** True for module specifiers that are provided by the target runtime (p5/q5 globals
 *  and their official addons). These are silently dropped from the native output rather
 *  than reported as missing external imports. */
function isKnownModule(specifier: string): boolean {
  return (
    specifier === "p5" ||
    specifier === "q5" ||
    specifier === "p5play" ||
    specifier === "q5play" ||
    specifier === "./globals"
  );
}

/** Modifier keywords that exist only in TypeScript and have no runtime form, so
 *  they must be stripped from class members in the native output. `static` and
 *  `async` are valid JavaScript and are intentionally absent. */
const TS_ONLY_MODIFIERS = new Set<ts.SyntaxKind>([
  ts.SyntaxKind.ReadonlyKeyword,
  ts.SyntaxKind.PublicKeyword,
  ts.SyntaxKind.PrivateKeyword,
  ts.SyntaxKind.ProtectedKeyword,
  ts.SyntaxKind.AbstractKeyword,
  ts.SyntaxKind.OverrideKeyword,
  ts.SyntaxKind.DeclareKeyword,
]);

/** A text edit applied to the original source: replace [start, end) with `text`. */
interface Edit {
  start: number;
  end: number;
  text: string;
}

/**
 * Convert instance-mode p5 TypeScript source to native global-mode JavaScript.
 *
 * Pure and deterministic: it never throws for expected/unsupported input, returning
 * `{ ok: false, reason }` instead. The transform is a faithful 1:1 text splice — it
 * parses the source with the TypeScript compiler API to locate AST node spans, then
 * edits only what the conversion rules require (imports, the instance-mode wrapper,
 * hook syntax, the `p.` prefix, and TypeScript-only syntax), preserving all logic,
 * literal values, identifiers, and in-body comments exactly. (research D1, D6)
 */
export function convertToNative(source: string): NativeConversion {
  if (!source || source.trim() === "") {
    return { ok: false, reason: "Sketch source is empty or could not be parsed" };
  }

  let sf: ts.SourceFile;
  try {
    sf = ts.createSourceFile(
      "sketch.ts",
      source,
      ts.ScriptTarget.Latest,
      /* setParentNodes */ true,
      ts.ScriptKind.TS,
    );
  } catch {
    return { ok: false, reason: "Sketch source is empty or could not be parsed" };
  }

  // --- Locate the default-export factory and its p5 instance parameter --------
  const factory = findDefaultExportFactory(sf);
  if (!factory) {
    return { ok: false, reason: "No default-export sketch function found" };
  }

  // Reject unsupported top-level constructs (anything other than imports and the
  // single default-export factory). Helpers/consts must live inside the factory.
  //
  // Imports are tolerated but never emitted (only the factory body is). Collect any
  // non-p5 specifiers so the panel can warn that the native output references symbols
  // whose defining import was dropped and is unavailable in the global-mode editor.
  const externalImports: string[] = [];
  for (const stmt of sf.statements) {
    if (stmt === factory.node) continue;
    if (ts.isImportDeclaration(stmt)) {
      if (
        ts.isStringLiteral(stmt.moduleSpecifier) &&
        !isKnownModule(stmt.moduleSpecifier.text)
      ) {
        externalImports.push(stmt.moduleSpecifier.text);
      }
      continue;
    }
    if (ts.isImportEqualsDeclaration(stmt)) continue;
    return { ok: false, reason: "Unsupported module structure for native conversion" };
  }

  const instanceName = factory.instanceName;
  if (!instanceName) {
    return { ok: false, reason: "Sketch function has no p5 instance parameter" };
  }

  const body = factory.body;
  if (!body || !ts.isBlock(body)) {
    return { ok: false, reason: "Unsupported module structure for native conversion" };
  }

  // Inner span of the factory body: between its `{` and `}`.
  const bodyStart = body.getStart(sf) + 1;
  const bodyEnd = body.getEnd() - 1;

  const edits: Edit[] = [];
  const headerRegions: Array<[number, number]> = [];

  // --- R4: convert instance hook assignments to global functions -------------
  for (const stmt of body.statements) {
    const hook = asHookAssignment(stmt, instanceName);
    if (!hook) continue;

    const params = hook.fn.parameters.map((p) => p.name.getText(sf)).join(", ");
    const headerStart = stmt.getStart(sf);
    const fnBodyStart = hook.fn.body.getStart(sf); // the `{`
    edits.push({
      start: headerStart,
      end: fnBodyStart,
      text: `function ${hook.name}(${params}) `,
    });
    headerRegions.push([headerStart, fnBodyStart]);

    // Drop the trailing `;` of the assignment statement (R4).
    if (stmt.getEnd() > hook.fn.body.getEnd()) {
      edits.push({ start: hook.fn.body.getEnd(), end: stmt.getEnd(), text: "" });
    }
  }

  const inHeader = (pos: number) =>
    headerRegions.some(([s, e]) => pos >= s && pos < e);

  // Edit that deletes the whole line(s) a node occupies — its leading indentation
  // through its trailing newline, plus any blank lines immediately after it — so a
  // wholesale-removed declaration leaves no dangling gap for the dedent pass.
  const removeWholeLines = (node: ts.Node): Edit => {
    let start = node.getStart(sf);
    while (start > bodyStart && source[start - 1] !== "\n") start--;
    let end = node.getEnd();
    while (end < bodyEnd && source[end] !== "\n") end++;
    if (end < bodyEnd) end++; // the node's own trailing newline
    // Collapse blank lines left behind so removal doesn't double up separators.
    while (end < bodyEnd) {
      let i = end;
      while (i < bodyEnd && (source[i] === " " || source[i] === "\t")) i++;
      if (i < bodyEnd && source[i] === "\n") end = i + 1;
      else break;
    }
    return { start, end, text: "" };
  };

  // --- Walk the whole tree for prefix removal, type stripping, as/satisfies ---
  const visit = (node: ts.Node) => {
    // R6: drop type-only declarations entirely (`interface … {}`, `type … = …`).
    // They have no runtime form, so they must not appear in the native output.
    if (
      (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) &&
      !inHeader(node.getStart(sf))
    ) {
      edits.push(removeWholeLines(node));
      return; // don't descend; the whole declaration is being removed
    }

    // R6: drop class fields that have no initializer (`readonly x: number;`).
    // These are TypeScript type-only members with no runtime effect — and the
    // bare class-field syntax they'd reduce to (`x;`) is rejected by the p5 web
    // editor's parser. Fields WITH an initializer (`x = 0;`) are kept below.
    if (
      ts.isPropertyDeclaration(node) &&
      !node.initializer &&
      !inHeader(node.getStart(sf))
    ) {
      edits.push(removeWholeLines(node));
      return; // don't descend; the whole declaration is being removed
    }

    // R5b: drop destructuring of the p5 instance (`const { a, b } = p;`). In
    // global mode those members are accessible globally, so the binding is dead
    // weight; the references it introduced resolve to the globals unchanged.
    if (
      ts.isVariableStatement(node) &&
      node.declarationList.declarations.length > 0 &&
      node.declarationList.declarations.every((d) => isInstanceDestructure(d, instanceName)) &&
      !inHeader(node.getStart(sf))
    ) {
      edits.push(removeWholeLines(node));
      return; // don't descend; the declaration is being removed wholesale
    }

    // R6: strip TypeScript-only member modifiers (readonly / access / abstract /
    // override / declare). `static` and the rest are valid JS, so keep them.
    if (ts.canHaveModifiers(node)) {
      for (const mod of ts.getModifiers(node) ?? []) {
        if (TS_ONLY_MODIFIERS.has(mod.kind) && !inHeader(mod.getStart(sf))) {
          let end = mod.getEnd();
          while (end < bodyEnd && (source[end] === " " || source[end] === "\t")) end++;
          edits.push({ start: mod.getStart(sf), end, text: "" });
        }
      }
    }

    // R5: remove the instance prefix from instance member access.
    if (
      ts.isPropertyAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === instanceName &&
      !inHeader(node.getStart(sf))
    ) {
      // Delete `p.` — from the object identifier start to the member name start.
      edits.push({ start: node.expression.getStart(sf), end: node.name.getStart(sf), text: "" });
    }

    // R6: strip TypeScript-only type annotations (`: T` on vars/params/returns).
    const typed = node as ts.Node & { type?: ts.TypeNode };
    if (
      typed.type &&
      (ts.isVariableDeclaration(node) ||
        ts.isParameter(node) ||
        ts.isPropertyDeclaration(node) ||
        ts.isFunctionDeclaration(node) ||
        ts.isFunctionExpression(node) ||
        ts.isArrowFunction(node) ||
        ts.isMethodDeclaration(node)) &&
      !inHeader(typed.type.getStart(sf))
    ) {
      const colon = source.lastIndexOf(":", typed.type.getStart(sf));
      if (colon !== -1) {
        edits.push({ start: colon, end: typed.type.getEnd(), text: "" });
      }
    }

    // R6: strip `as Type` / `satisfies Type` assertions, keeping the expression.
    if (
      (ts.isAsExpression(node) || ts.isSatisfiesExpression(node)) &&
      !inHeader(node.getStart(sf))
    ) {
      edits.push({ start: node.expression.getEnd(), end: node.getEnd(), text: "" });
    }

    ts.forEachChild(node, visit);
  };
  visit(body);

  // --- Apply edits (within the body span) to the body substring --------------
  const bodyEdits = edits
    .filter((e) => e.start >= bodyStart && e.end <= bodyEnd)
    .sort((a, b) => b.start - a.start);

  let out = source.slice(bodyStart, bodyEnd);
  for (const e of bodyEdits) {
    out = out.slice(0, e.start - bodyStart) + e.text + out.slice(e.end - bodyStart);
  }

  return { ok: true, code: dedent(out), externalImports: [...new Set(externalImports)] };
}

/** True for `const { … } = instance` — an object destructuring of the p5 instance. */
function isInstanceDestructure(d: ts.VariableDeclaration, instanceName: string): boolean {
  return (
    ts.isObjectBindingPattern(d.name) &&
    !!d.initializer &&
    ts.isIdentifier(d.initializer) &&
    d.initializer.text === instanceName
  );
}

/** A recognised p5 lifecycle-hook assignment: `instance.<name> = <arrow|function>`. */
interface HookAssignment {
  name: string;
  fn: (ts.ArrowFunction | ts.FunctionExpression) & { body: ts.Block };
}

/** Recognise `instance.<name> = () => {…}` / `= function () {…}` statements. */
function asHookAssignment(stmt: ts.Statement, instanceName: string): HookAssignment | null {
  if (!ts.isExpressionStatement(stmt)) return null;
  const expr = stmt.expression;
  if (!ts.isBinaryExpression(expr)) return null;
  if (expr.operatorToken.kind !== ts.SyntaxKind.EqualsToken) return null;

  const left = expr.left;
  if (!ts.isPropertyAccessExpression(left)) return null;
  if (!ts.isIdentifier(left.expression) || left.expression.text !== instanceName) return null;

  const fn = expr.right;
  if (!ts.isArrowFunction(fn) && !ts.isFunctionExpression(fn)) return null;
  if (!fn.body || !ts.isBlock(fn.body)) return null;

  return { name: left.name.text, fn: fn as HookAssignment["fn"] };
}

/** The located default-export factory, its body, and its instance parameter name. */
interface Factory {
  node: ts.Node;
  body: ts.ConciseBody | undefined;
  instanceName: string | undefined;
}

/** Find `export default function sketch(p) {…}` or `export default (p) => {…}`. */
function findDefaultExportFactory(sf: ts.SourceFile): Factory | null {
  for (const stmt of sf.statements) {
    // `export default function sketch(p) {…}`
    if (
      ts.isFunctionDeclaration(stmt) &&
      stmt.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) &&
      stmt.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)
    ) {
      return { node: stmt, body: stmt.body, instanceName: firstParamName(stmt.parameters) };
    }

    // `export default <function|arrow expression>`
    if (ts.isExportAssignment(stmt) && !stmt.isExportEquals) {
      const e = stmt.expression;
      if (ts.isArrowFunction(e) || ts.isFunctionExpression(e)) {
        return { node: stmt, body: e.body, instanceName: firstParamName(e.parameters) };
      }
    }
  }
  return null;
}

/** The text of a parameter list's first parameter name (the p5 instance), if any. */
function firstParamName(params: ts.NodeArray<ts.ParameterDeclaration>): string | undefined {
  const first = params[0];
  if (!first || !ts.isIdentifier(first.name)) return undefined;
  return first.name.text;
}

/**
 * R7: remove the wrapper's indentation unit so the emitted body sits at column 0,
 * and trim the blank lines left by the factory's `{`/`}`.
 */
function dedent(code: string): string {
  const lines = code.split("\n");
  let min = Infinity;
  for (const line of lines) {
    if (line.trim() === "") continue;
    const indent = line.match(/^[ \t]*/)?.[0].length ?? 0;
    if (indent < min) min = indent;
  }
  if (!Number.isFinite(min)) min = 0;

  const dedented = lines.map((line) => (line.trim() === "" ? "" : line.slice(min)));

  // Drop leading and trailing blank lines (the newlines hugging `{`/`}`).
  let start = 0;
  let end = dedented.length;
  while (start < end && dedented[start] === "") start++;
  while (end > start && dedented[end - 1] === "") end--;
  return dedented.slice(start, end).join("\n");
}
