// House rule (owner, 2026-10-01): no "·" (middle dot) in anything a person
// reads. It reads as machine-written copy; nobody writes Thai or English that
// way. Use a space between Thai phrases, "/" or ":" between English labels,
// or a real word. Comments and CSS comments may still use it.
//
// Parses every source file with the TypeScript parser, so only real text
// counts: string literals, template-literal text and JSX text.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const SRC = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "../../src");

function* sourceFiles(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== "node_modules") yield* sourceFiles(p); }
    else if (/\.(js|jsx|mjs)$/.test(e.name)) yield p;
  }
}

test("no middle dot in text a person reads", () => {
  const K = ts.SyntaxKind;
  const TEXT = new Set([K.StringLiteral, K.NoSubstitutionTemplateLiteral, K.TemplateHead, K.TemplateMiddle, K.TemplateTail, K.JsxText]);
  const found = [];
  for (const file of sourceFiles(SRC)) {
    const text = fs.readFileSync(file, "utf8");
    if (!text.includes("·")) continue;
    const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX);
    (function visit(n) {
      if (TEXT.has(n.kind)) {
        // CSS inside style templates keeps its /* comments */
        const seg = text.slice(n.getStart(sf), n.getEnd()).replace(/\/\*[\s\S]*?\*\//g, "");
        if (seg.includes("·")) {
          const { line } = sf.getLineAndCharacterOfPosition(n.getStart(sf));
          found.push(`${path.relative(SRC, file)}:${line + 1}  ${seg.replace(/\s+/g, " ").trim().slice(0, 80)}`);
        }
      }
      ts.forEachChild(n, visit);
    })(sf);
  }
  assert.deepEqual(found, [], `middle dot in UI text:\n${found.join("\n")}`);
});
