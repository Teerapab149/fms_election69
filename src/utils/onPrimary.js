"use client";

import { useLayoutEffect, useRef, useState } from "react";

// Text colour for a surface painted with --color-primary. Some palettes have a
// very light primary (gumroad pink, studio-dark lime), where fixed white text
// measured 1.2 to 1.9:1. The colour is read from what the browser actually
// painted, then white or near-black is chosen by whichever contrasts more.
// The background itself is never changed.

const DARK = "#000000";
const LIGHT = "#ffffff";

function parse(css) {
  const s = String(css || "");
  const nums = s.match(/[\d.]+/g) || [];
  if (/^color\(/.test(s)) return { r: +nums[0] * 255, g: +nums[1] * 255, b: +nums[2] * 255, a: nums[3] === undefined ? 1 : +nums[3] };
  return { r: +nums[0], g: +nums[1], b: +nums[2], a: nums[3] === undefined ? 1 : +nums[3] };
}

function lum({ r, g, b }) {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function readableOn(css) {
  const c = parse(css);
  if (![c.r, c.g, c.b].every(Number.isFinite)) return LIGHT;
  const L = lum(c);
  const withLight = 1.05 / (L + 0.05);
  const withDark = (L + 0.05) / (lum(parse("rgb(0,0,0)")) + 0.05);
  return withDark > withLight ? DARK : LIGHT;
}

// ref goes on the element that has the primary background; style goes on the same element
// varName: write the colour into a CSS custom property instead of colour, so a
// :hover rule that repaints the background can still pick its own text colour
export function useOnPrimary(enabled = true, varName = null) {
  const ref = useRef(null);
  const [color, setColor] = useState(LIGHT);
  useLayoutEffect(() => {
    if (!enabled || !ref.current) return;
    const next = readableOn(getComputedStyle(ref.current).backgroundColor);
    setColor((prev) => (prev === next ? prev : next));
  });
  return { ref, style: varName ? { [varName]: color } : { color } };
}
