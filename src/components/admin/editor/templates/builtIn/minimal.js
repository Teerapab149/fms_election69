/**
 * Minimal Template — STUB (Day 3 will expand to full 47 elements)
 */

import { classicTemplate } from "./classic";

export const minimalTemplate = {
  ...classicTemplate,
  id: "minimal",
  slug: "minimal",
  name: "มินิมอล",
  description: "ขาวสะอาด typography เด่น (ขยายเต็มที่ Day 3)",

  colorSwatch: {
    primary: "#1f2937",
    secondary: "#6b7280",
    background: "#ffffff"
  },

  theme: {
    colors: {
      primary:    "#1f2937",
      accent:     "#6b7280",
      background: "#ffffff",
      surface:    "#f9fafb",
      text:       "#000000",
      textMuted:  "#9ca3af",
      border:     "#e5e7eb"
    },
    typography: classicTemplate.theme.typography,
    spacing:    classicTemplate.theme.spacing,
    effects: {
      borderRadius: "0.25rem",
      shadow:       "none"
    }
  },

  pages:    { ...classicTemplate.pages },
  elements: { ...classicTemplate.elements }
};

export default minimalTemplate;
