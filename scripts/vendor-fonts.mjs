#!/usr/bin/env node
// Downloads the web fonts into the repository so that `npm run build` never
// talks to Google.
//
// Why this exists: the site used next/font/google, which fetches every font
// from fonts.googleapis.com / fonts.gstatic.com during each build. That failed
// builds at random (CI and a clean rehearsal machine, several times) and made a
// build impossible on a machine that cannot reach those two hosts. The fonts
// now live in src/app/fonts/ and are plain files to the build.
//
// Run this ONLY when the list below changes (a new family, weight or subset),
// on a machine with internet access:
//
//     node scripts/vendor-fonts.mjs
//
// then commit src/app/fonts/ (fonts.css + files/). Nothing runs it at build
// time or on the server.
//
// It reuses Next's own Google Fonts helpers, so the result is what
// next/font/google would have produced: the same font files, the same
// unicode-range split, the same family names and the same fallback metrics.

import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const G = "next/dist/compiled/@next/font/dist/google/";
const { validateGoogleFontFunctionCall } = require(G + "validate-google-font-function-call.js");
const { getFontAxes } = require(G + "get-font-axes.js");
const { getGoogleFontsUrl } = require(G + "get-google-fonts-url.js");
const { fetchCSSFromGoogleFonts } = require(G + "fetch-css-from-google-fonts.js");
const { fetchFontFile } = require(G + "fetch-font-file.js");
const { getFallbackFontOverrideMetrics } = require(G + "get-fallback-font-override-metrics.js");

// [Google Fonts function name, options]. `variable` is the CSS custom property
// the rest of the site reads (tailwind.config.js, the templates).
//
// Why each family is here (moved from src/app/layout.js):
//   Anuphan            site-wide body font (font-sans), a loopless Thai sans
//   Kanit, Prompt      fallback for font-sans, and the "original" template
//   Archivo Black, Space Grotesk            gumroad template (Latin only)
//   Inter, JetBrains Mono, Instrument Serif studio-dark template (Latin only)
//   DM Serif Display, Manrope, IBM Plex Sans Thai, Space Mono   verdure template
//   Chakra Petch       receipt template
//   Noto Sans Thai (+ Looped for long reading)   ballot-official template
// A font-family named in a template does nothing unless its family is in this list.
const FONTS = [
  ["Prompt", { subsets: ["thai", "latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-prompt" }],
  ["Kanit", { subsets: ["thai", "latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-kanit" }],
  ["Anuphan", { subsets: ["thai", "latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-anuphan" }],
  ["Archivo_Black", { subsets: ["latin"], weight: ["400"], variable: "--font-archivo" }],
  ["Space_Grotesk", { subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-space-grotesk" }],
  ["Inter", { subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-studio-sans" }],
  ["JetBrains_Mono", { subsets: ["latin"], weight: ["400", "500"], variable: "--font-studio-mono" }],
  ["Instrument_Serif", { subsets: ["latin"], weight: ["400"], style: ["normal", "italic"], variable: "--font-instrument-serif" }],
  ["DM_Serif_Display", { subsets: ["latin"], weight: ["400"], style: ["normal", "italic"], variable: "--font-dm-serif" }],
  ["Manrope", { subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"], variable: "--font-manrope" }],
  ["IBM_Plex_Sans_Thai", { subsets: ["thai", "latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-plex-thai" }],
  ["Space_Mono", { subsets: ["latin"], weight: ["400", "700"], variable: "--font-space-mono" }],
  ["Chakra_Petch", { subsets: ["thai", "latin"], weight: ["400", "500", "600", "700"], variable: "--font-chakra" }],
  ["Noto_Sans_Thai", { subsets: ["thai", "latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-noto-thai" }],
  ["Noto_Sans_Thai_Looped", { subsets: ["thai", "latin"], weight: ["400", "500"], variable: "--font-noto-thai-looped" }],
];

const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "app", "fonts");
const FILES_DIR = path.join(OUT_DIR, "files");
const FONT_URL = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g;

function fail(message) {
  console.error("vendor-fonts: " + message);
  process.exit(1);
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function vendorFamily(fn, options, written) {
  const v = validateGoogleFontFunctionCall(fn, { display: "swap", ...options });
  const axes = getFontAxes(v.fontFamily, v.weights, v.styles, v.selectedVariableAxes);
  const url = getGoogleFontsUrl(v.fontFamily, axes, v.display);
  let css = await fetchCSSFromGoogleFonts(url, v.fontFamily, false);
  if (!css) fail(`no CSS returned for ${v.fontFamily}`);
  css = css.split("body {", 1)[0].trim();

  // Google labels each @font-face with its subset in a comment (/* thai */).
  // Remember the label for every font URL so the saved file gets a readable name.
  const subsetOf = new Map();
  let label = "all";
  for (const line of css.split("\n")) {
    const c = /^\/\*\s*(.+?)\s*\*\/$/.exec(line.trim());
    if (c) label = c[1];
    for (const m of line.matchAll(FONT_URL)) if (!subsetOf.has(m[1])) subsetOf.set(m[1], label);
  }
  if (subsetOf.size === 0) fail(`no font files found in the CSS for ${v.fontFamily}`);

  for (const [remote, subset] of subsetOf) {
    const ext = /\.(woff2|woff|ttf|otf)$/.exec(remote);
    if (!ext) fail(`font URL without a known extension for ${v.fontFamily}: ${remote}`);
    const buf = await fetchFontFile(remote, false);
    // Some subset files are under 1 KB, so check the file signature, not the size.
    const magic = buf ? buf.subarray(0, 4).toString("latin1") : "";
    if (ext[1] === "woff2" ? magic !== "wOF2" : !buf?.length) fail(`download failed or not a font file: ${remote}`);
    const hash = createHash("sha256").update(buf).digest("hex").slice(0, 10);
    const name = `${slug(v.fontFamily)}-${slug(subset)}-${hash}.${ext[1]}`;
    fs.writeFileSync(path.join(FILES_DIR, name), buf);
    written.add(name);
    css = css.split(remote).join(`./files/${name}`);
  }
  if (/fonts\.gstatic\.com|fonts\.googleapis\.com/.test(css)) fail(`a Google URL is left in the CSS for ${v.fontFamily}`);

  // The fallback face keeps the page from jumping when the real font arrives:
  // Arial, resized to the real font's metrics. Same numbers next/font used.
  const m = getFallbackFontOverrideMetrics(v.fontFamily);
  if (!m) fail(`no fallback metrics for ${v.fontFamily}`);
  const fallback = `${v.fontFamily} Fallback`;
  const fallbackCss = [
    "@font-face {",
    `  font-family: '${fallback}';`,
    `  src: local("${m.fallbackFont}");`,
    `  ascent-override: ${m.ascentOverride};`,
    `  descent-override: ${m.descentOverride};`,
    `  line-gap-override: ${m.lineGapOverride};`,
    `  size-adjust: ${m.sizeAdjust};`,
    "}",
  ].join("\n");

  return {
    css: `/* ===== ${v.fontFamily} ===== */\n${css}\n${fallbackCss}`,
    variable: `  ${options.variable}: '${v.fontFamily}', '${fallback}';`,
    files: subsetOf.size,
  };
}

async function main() {
  fs.rmSync(FILES_DIR, { recursive: true, force: true });
  fs.mkdirSync(FILES_DIR, { recursive: true });

  const written = new Set();
  const blocks = [];
  const variables = [];
  for (const [fn, options] of FONTS) {
    const r = await vendorFamily(fn, options, written);
    blocks.push(r.css);
    variables.push(r.variable);
    console.log(`${fn.padEnd(24)} ${String(r.files).padStart(3)} files`);
  }

  const header = [
    "/* GENERATED by scripts/vendor-fonts.mjs. Do not edit by hand.",
    "   To add or change a font: edit the list in that script, run it, commit the result.",
    "   The font files sit in ./files and are bundled by the build like any other asset,",
    "   so the build needs no access to Google. */",
  ].join("\n");
  const variableBlock = `.fms-fonts {\n${variables.join("\n")}\n}`;
  const out = [header, ...blocks, variableBlock].join("\n\n") + "\n";
  fs.writeFileSync(path.join(OUT_DIR, "fonts.css"), out);

  const bytes = [...written].reduce((n, f) => n + fs.statSync(path.join(FILES_DIR, f)).size, 0);
  console.log(`\nwrote src/app/fonts/fonts.css and ${written.size} font files (${(bytes / 1024).toFixed(0)} KB)`);
}

main().catch((err) => fail(err?.stack || String(err)));
