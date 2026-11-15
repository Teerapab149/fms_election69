// The build must not depend on Google Fonts. The fonts are files in
// src/app/fonts (written by scripts/vendor-fonts.mjs). These checks fail if
// someone brings next/font/google back, or commits fonts.css without its files.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const FONTS_DIR = path.join(ROOT, "src", "app", "fonts");
const css = fs.readFileSync(path.join(FONTS_DIR, "fonts.css"), "utf8");

function sourceFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(full, out);
    else if (/\.(js|jsx|mjs|ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

test("no source file imports next/font/google", () => {
  const offenders = sourceFiles(path.join(ROOT, "src")).filter((f) =>
    /from\s+['"]next\/font\/google['"]/.test(fs.readFileSync(f, "utf8"))
  );
  assert.deepEqual(offenders.map((f) => path.relative(ROOT, f)), []);
});

test("fonts.css points at no outside host", () => {
  assert.equal(/https?:\/\//.test(css), false);
});

test("every font file named in fonts.css exists, and no file is left unused", () => {
  const named = new Set([...css.matchAll(/url\(\.\/files\/([^)]+)\)/g)].map((m) => m[1]));
  const onDisk = new Set(fs.readdirSync(path.join(FONTS_DIR, "files")));
  assert.ok(named.size > 0);
  assert.deepEqual([...named].filter((f) => !onDisk.has(f)), [], "named in fonts.css but missing on disk");
  assert.deepEqual([...onDisk].filter((f) => !named.has(f)), [], "on disk but not named in fonts.css");
});

test("every --font-* variable the site reads is defined in fonts.css", () => {
  const defined = new Set([...css.matchAll(/(--font-[a-z-]+)\s*:/g)].map((m) => m[1]));
  const used = new Set();
  const files = [...sourceFiles(path.join(ROOT, "src")), path.join(ROOT, "tailwind.config.js")];
  for (const f of files) {
    for (const m of fs.readFileSync(f, "utf8").matchAll(/var\((--font-[a-z-]+)/g)) used.add(m[1]);
  }
  // --font-display and --font-body are theme tokens set by the active template
  // (templates/builtIn/*.js), not font files.
  const themeTokens = new Set(["--font-display", "--font-body"]);
  assert.ok(used.size > 0);
  assert.deepEqual([...used].filter((v) => !defined.has(v) && !themeTokens.has(v)).sort(), []);
});

test("every font family in fonts.css has its license file next to it", () => {
  // The SIL OFL lets these fonts ship inside software that is sold, on condition
  // that the license travels with the font files.
  const families = new Set(
    [...css.matchAll(/font-family:\s*'([^']+)'/g)].map((m) => m[1]).filter((f) => !/ Fallback$/.test(f))
  );
  const licenses = new Set(fs.readdirSync(path.join(FONTS_DIR, "licenses")));
  assert.ok(families.size > 0);
  const missing = [...families].filter((f) => !licenses.has(f.toLowerCase().replace(/[^a-z0-9]/g, "") + ".txt"));
  assert.deepEqual(missing, []);
});

test("the root layout and the global error page load fonts.css and set the variable class", () => {
  for (const name of ["layout.js", "global-error.js"]) {
    const src = fs.readFileSync(path.join(ROOT, "src", "app", name), "utf8");
    assert.match(src, /import\s+['"]\.\/fonts\/fonts\.css['"]/, name + " imports fonts.css");
    assert.match(src, /fms-fonts/, name + " sets the fms-fonts class");
  }
});
