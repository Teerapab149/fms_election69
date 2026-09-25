// H1 regression (2026-09-25) — admin-controlled theme/template values must never
// be able to leave the <style> element they are rendered into.
//
//   node --test scripts/smoke/cssSafety.test.mjs
//
// Two layers are exercised separately, because each must hold on its own:
//   • validate*()  — what the admin APIs use to reject input with a 400
//   • build*()     — templateTokens.js, which renders into
//                    <style dangerouslySetInnerHTML> on every public page and
//                    must stay safe even when a bad value reached the DB anyway
//
// The end-to-end proof (real server, real page, script does not run) is
// e2e/security-h1-h2.spec.js.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateThemeTokens,
  validateElementVars,
  validateElementCss,
  validateTemplateStyles,
  isSafeCssValue,
  isSafeColor,
  isSafeLength,
  isSafeFontFamily,
  isSafeElementId,
  isSafeVarName,
  isSafeCustomCss,
} from '../../src/lib/cssSafety.mjs';
import { buildTokenStyles, buildTemplateStyles, buildElementCss } from '../../src/lib/templateTokens.js';

// ── payloads ────────────────────────────────────────────────────────────────
const SCRIPT_BREAKOUT = [
  'red}</style><script>alert(1)</script><style>',
  '</style><script>fetch("/api/vote",{method:"POST",body:\'{"candidateId":3}\'})</script>',
  '</STYLE><SCRIPT>alert(1)</SCRIPT>',
  '#fff</style ><img src=x onerror=alert(1)>',
  '<!--',
  '#fff</style\n><svg onload=alert(1)>',
];
const CSS_INJECTION = [
  'red; background: url(https://evil.example/x)',
  'red} body{display:none',
  'red}.fms-app{--x:1',
  'url(javascript:alert(1))',
  'url("https://evil.example/steal?c=1")',
  'expression(alert(1))',
  'image-set("x.png" 1x)',
  'red !important',
  'red /* comment */',
  '\\3c /style\\3e',
  '@import "x.css"',
  "'unterminated",
  'rgb(1,2,3',
  'red)',
  'env(safe-area-inset-top)',
  'attr(data-x)',
  'red\nbackground:blue',
  'javascript:alert(1)',
];
const MALICIOUS_IDS = [
  'x"] {} </style><script>alert(1)</script>',
  'x"]{background:red}[x="',
  'hero title',
  'hero;title',
  '-starts-with-hyphen',
  'ends-',
  'a--b',
  '',
  'x'.repeat(65),
];
const MALICIOUS_VAR_NAMES = [
  '--x: red; } </style><script>alert(1)</script>',
  '--x}',
  '--X-UPPER',
  'color',
  '-single',
  '--',
  '--a--b',
  '--a;b',
];

// ── legitimate values (inventoried from the 32 built-in templates) ──────────
const LEGIT_TOKENS = {
  '--color-primary': '#8A2680',
  '--color-accent': '#C026D3',
  '--color-bg': '#F8F9FD',
  '--color-text': '#0F172A',
  '--color-border': 'transparent',
  '--radius-sm': '6px',
  '--radius-button': '9999px',
  '--radius-card': '0',
  '--shadow-card': '0 8px 24px -12px color-mix(in srgb, #FF6FBF 40%, transparent)',
  '--shadow-button': '5px 5px 0 #26271c',
  '--font-display': "var(--font-archivo), 'Archivo Black', 'Kanit', system-ui, sans-serif",
  '--font-body': "var(--font-plex-thai), 'IBM Plex Sans Thai', var(--font-manrope), system-ui, sans-serif",
};
const LEGIT_VARS = {
  '--btn-bg': 'var(--color-primary)',
  '--btn-bg-gradient': 'linear-gradient(135deg, #8A2680 0%, #601A59 100%)',
  '--btn-shadow': '0 6px 20px rgba(6,182,212,0.35)',
  '--btn-hover-transform': 'translateY(-2px)',
  '--btn-text-transform': 'uppercase',
  '--btn-font-weight': '800',
  '--btn-padding-x': 'calc(1rem + 4px)',
  '--banner-shadow': 'none',
};

// ── validation layer ────────────────────────────────────────────────────────

test('legitimate theme tokens + element vars pass validation', () => {
  assert.deepEqual(validateThemeTokens(LEGIT_TOKENS), []);
  assert.deepEqual(validateElementVars({ home: { 'voteCTA-button': LEGIT_VARS, 'hero-title': { '--vh-title-color': '#fff' } } }), []);
  assert.deepEqual(validateElementCss({ home: { 'hero-title': 'transform: rotate(-2deg); letter-spacing: 0.02em;' } }), []);
  assert.deepEqual(validateTemplateStyles({ theme: { tokens: LEGIT_TOKENS }, elements: { 'voteCTA-button': { variant: 'default', vars: LEGIT_VARS } } }), []);
});

test('typed token validators accept real values and reject the wrong kind', () => {
  for (const v of ['#8A2680', '#fff', '#FFFFFF80', 'rgba(6,182,212,0.18)', 'hsl(300 50% 40%)', 'transparent', 'var(--color-primary)']) {
    assert.ok(isSafeColor(v), `colour should pass: ${v}`);
  }
  for (const v of ['6px', '1.5rem', '50%', '0', '9999px', 'calc(1rem + 2px)']) assert.ok(isSafeLength(v), `length should pass: ${v}`);
  for (const v of ['12', 'red', 'rgb(0,0,0)', '1px solid']) assert.ok(!isSafeLength(v), `not a length: ${v}`);
  for (const v of ['#12', '12px', '1px solid red']) assert.ok(!isSafeColor(v), `not a colour: ${v}`);
  assert.ok(isSafeFontFamily("var(--font-kanit), 'Kanit', system-ui, sans-serif"));
  assert.ok(!isSafeFontFamily('rgb(0,0,0)'), 'a font stack only calls var()');
  // Layer 1 typed dispatch: a shadow in a colour slot is rejected
  assert.notDeepEqual(validateThemeTokens({ '--color-primary': '0 1px 2px #000' }), []);
});

test('script-breakout payloads are rejected in every slot', () => {
  for (const p of SCRIPT_BREAKOUT) {
    assert.ok(!isSafeCssValue(p), `generic value must reject: ${p}`);
    assert.ok(!isSafeCustomCss(p), `custom CSS must reject: ${p}`);
    assert.notDeepEqual(validateThemeTokens({ '--color-primary': p }), [], `token: ${p}`);
    assert.notDeepEqual(validateThemeTokens({ '--shadow-card': p }), [], `shadow token: ${p}`);
    assert.notDeepEqual(validateElementVars({ home: { 'hero-title': { '--x': p } } }), [], `element var: ${p}`);
    assert.notDeepEqual(validateTemplateStyles({ theme: { tokens: { '--font-body': p } } }), [], `template token: ${p}`);
    assert.notDeepEqual(validateTemplateStyles({ elements: { 'hero-title': { vars: { '--x': p } } } }), [], `template var: ${p}`);
  }
});

test('CSS declaration / function injection is rejected in token + var values', () => {
  for (const p of CSS_INJECTION) {
    assert.ok(!isSafeCssValue(p), `must reject: ${JSON.stringify(p)}`);
    assert.notDeepEqual(validateElementVars({ home: { 'hero-title': { '--x': p } } }), [], `var: ${JSON.stringify(p)}`);
  }
});

test('custom CSS (Layer 3) keeps : and ; but refuses rule escapes and loaders', () => {
  for (const p of ['color: red} body{display:none', 'background: url(https://x/y)', 'color:red; @import "x"', 'behavior: x', 'background-image: image-set("a" 1x)', 'color: red\\7d']) {
    assert.ok(!isSafeCustomCss(p), `must reject: ${p}`);
  }
});

test('malicious element ids and page ids are rejected', () => {
  for (const id of MALICIOUS_IDS) {
    assert.ok(!isSafeElementId(id), `id must reject: ${JSON.stringify(id)}`);
    assert.notDeepEqual(validateElementVars({ home: { [id]: { '--x': 'red' } } }), [], `element id: ${id}`);
    assert.notDeepEqual(validateElementVars({ [id]: { 'hero-title': { '--x': 'red' } } }), [], `page id: ${id}`);
    assert.notDeepEqual(validateElementCss({ home: { [id]: 'color: red;' } }), [], `css element id: ${id}`);
    assert.notDeepEqual(validateTemplateStyles({ elements: { [id]: { vars: { '--x': 'red' } } } }), [], `template element id: ${id}`);
  }
  assert.ok(isSafeElementId('voteCTA-button'), 'real mixed-case id still passes');
});

test('malicious CSS variable names are rejected', () => {
  for (const name of MALICIOUS_VAR_NAMES) {
    assert.ok(!isSafeVarName(name), `name must reject: ${JSON.stringify(name)}`);
    assert.notDeepEqual(validateThemeTokens({ [name]: 'red' }), [], `token name: ${name}`);
    assert.notDeepEqual(validateElementVars({ home: { 'hero-title': { [name]: 'red' } } }), [], `var name: ${name}`);
  }
});

test('page-layout allow-list still refuses unknown Layer 1 keys', () => {
  const allowed = new Set(['--color-primary']);
  assert.deepEqual(validateThemeTokens({ '--color-primary': '#000' }, allowed), []);
  assert.notDeepEqual(validateThemeTokens({ '--color-secret': '#000' }, allowed), []);
});

// ── render layer (defence in depth: bad data already in the DB) ─────────────

function assertNoMarkup(css, label) {
  assert.ok(!/[<>]/.test(css), `${label}: output contains < or > → could close <style>: ${css}`);
  assert.ok(!/<\/style/i.test(css), `${label}: output contains </style`);
  assert.ok(!/url\s*\(|expression\s*\(|javascript/i.test(css), `${label}: output loads/executes something`);
}

test('buildTokenStyles drops every malicious name/value but keeps the legit ones', () => {
  const tokens = { ...LEGIT_TOKENS };
  SCRIPT_BREAKOUT.concat(CSS_INJECTION).forEach((p, i) => { tokens[`--evil-${i}`] = p; });
  MALICIOUS_VAR_NAMES.forEach((n) => { tokens[n] = 'red'; });
  const css = buildTokenStyles(tokens, '.fms-app');
  assertNoMarkup(css, 'buildTokenStyles');
  assert.ok(!css.includes('--evil-'), 'no malicious token survived');
  for (const [k, v] of Object.entries(LEGIT_TOKENS)) assert.ok(css.includes(`  ${k}: ${v};`), `legit token kept: ${k}`);
  // exactly one rule: nothing broke out of the scope block
  assert.equal((css.match(/{/g) || []).length, 1);
  assert.equal((css.match(/}/g) || []).length, 1);
});

test('buildTokenStyles output is byte-identical for legitimate input', () => {
  const expected = '.fms-app {\n' + Object.entries(LEGIT_TOKENS).map(([k, v]) => `  ${k}: ${v};`).join('\n') + '\n}';
  assert.equal(buildTokenStyles(LEGIT_TOKENS, '.fms-app'), expected);
});

test('buildTemplateStyles skips malicious element ids and malicious var values', () => {
  const elements = { 'voteCTA-button': { vars: LEGIT_VARS } };
  MALICIOUS_IDS.forEach((id) => { if (id) elements[id] = { vars: { '--x': 'red' } }; });
  elements['hero-title'] = { vars: Object.fromEntries(SCRIPT_BREAKOUT.map((p, i) => [`--v${i}`, p])) };
  const css = buildTemplateStyles({ theme: { tokens: { '--color-primary': 'red}</style><script>alert(1)</script>' } }, elements }, '.fms-app');
  assertNoMarkup(css, 'buildTemplateStyles');
  assert.ok(css.includes('[data-element="voteCTA-button"]'), 'legit element kept');
  assert.ok(css.includes('--btn-bg-gradient: linear-gradient(135deg, #8A2680 0%, #601A59 100%);'));
  assert.ok(!css.includes('hero-title'), 'element whose every var was malicious emits nothing');
  assert.equal((css.match(/\[data-element=/g) || []).length, 1, 'only the legit element rule exists');
});

test('buildElementCss skips malicious ids and rule-escaping declarations', () => {
  const map = {
    'hero-title': 'transform: rotate(-2deg);',
    'x"] {} </style><script>alert(1)</script>': 'color: red;',
    'meet-title': 'color: red} body{display:none',
    'meet-cta': 'color: red;</style><script>alert(1)</script>',
  };
  const css = buildElementCss(map, '.fms-app');
  assertNoMarkup(css, 'buildElementCss');
  assert.equal(css, '.fms-app [data-element="hero-title"] {\ntransform: rotate(-2deg);\n}');
});

test('random payload fuzz: builder output never contains markup', () => {
  const alphabet = ['<', '>', '/', 's', 't', 'y', 'l', 'e', '{', '}', ';', ':', '"', "'", '(', ')', '\\', ' ', 'u', 'r', '#', 'a', '-', '\n', '@', '!', '*'];
  let seed = 42;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  for (let i = 0; i < 3000; i++) {
    const len = 1 + Math.floor(rnd() * 40);
    let s = '';
    for (let j = 0; j < len; j++) s += alphabet[Math.floor(rnd() * alphabet.length)];
    const css = [
      buildTokenStyles({ '--color-primary': s, [`--${s}`]: 'red' }, '.fms-app'),
      buildTemplateStyles({ elements: { [s]: { vars: { '--x': s } } } }, '.fms-app'),
      buildElementCss({ [s]: s, 'hero-title': s }, '.fms-app'),
    ].join('\n');
    assert.ok(!/[<>]/.test(css), `fuzz #${i} leaked markup for ${JSON.stringify(s)}: ${css}`);
    assert.ok(!/\\/.test(css), `fuzz #${i} leaked a CSS escape for ${JSON.stringify(s)}`);
  }
});
