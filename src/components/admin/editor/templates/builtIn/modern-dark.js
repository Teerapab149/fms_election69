/**
 * Modern Dark Template — STUB (Day 3 will expand to full 47 elements)
 *
 * Day 1: minimal overrides — inherits classic for elements not redefined.
 */

import { classicTemplate } from "./classic";

export const modernDarkTemplate = {
  ...classicTemplate,
  id: "modern-dark",
  slug: "modern-dark",
  name: "โมเดิร์นดาร์ก",
  description: "ดีไซน์มืด สี cyan + เงา (ขยายเต็มที่ใน Day 3)",

  colorSwatch: {
    primary: "#06b6d4",
    secondary: "#8b5cf6",
    background: "#0f172a"
  },

  theme: {
    colors: {
      primary:    "#06b6d4",
      accent:     "#8b5cf6",
      background: "#0f172a",
      surface:    "#1e293b",
      text:       "#ffffff",
      textMuted:  "#94a3b8",
      border:     "#334155"
    },
    typography: classicTemplate.theme.typography,
    spacing:    classicTemplate.theme.spacing,
    effects: {
      borderRadius: "0.5rem",
      shadow:       "0 10px 40px rgba(6,182,212,0.15)"
    }
  },

  pages: {
    home:       { visible: true, backgroundColor: "#0f172a" },
    vote:       { visible: true, backgroundColor: "#0f172a" },
    candidates: { visible: true, backgroundColor: "#0f172a" },
    results:    { visible: true, backgroundColor: "#0f172a" },
    closed:     { visible: true, backgroundColor: "#0f172a" },
    success:    { visible: true, backgroundColor: "#0f172a" }
  },

  // STUB: minimal overrides — Day 3 will expand to full 47 coverage.
  elements: {
    ...classicTemplate.elements,
    "hero-title": {
      ...classicTemplate.elements["hero-title"],
      config: {
        ...classicTemplate.elements["hero-title"].config,
        color: "#ffffff"
      }
    }
  }
};

export default modernDarkTemplate;
