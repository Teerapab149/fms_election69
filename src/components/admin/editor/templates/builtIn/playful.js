/**
 * Playful Template — STUB (Day 3 will expand to full 47 elements)
 */

import { classicTemplate } from "./classic";

export const playfulTemplate = {
  ...classicTemplate,
  id: "playful",
  slug: "playful",
  name: "สนุกสนาน",
  description: "สีสันสดใส rounded มากขึ้น (ขยายเต็มที่ Day 3)",

  colorSwatch: {
    primary: "#ec4899",
    secondary: "#f59e0b",
    background: "#fef3c7"
  },

  theme: {
    colors: {
      primary:    "#ec4899",
      accent:     "#f59e0b",
      background: "#fffbeb",
      surface:    "#ffffff",
      text:       "#1f2937",
      textMuted:  "#6b7280",
      border:     "#fde68a"
    },
    typography: classicTemplate.theme.typography,
    spacing:    classicTemplate.theme.spacing,
    effects: {
      borderRadius: "1.5rem",
      shadow:       "0 4px 6px -1px rgba(236,72,153,0.1)"
    }
  },

  pages:    { ...classicTemplate.pages },
  elements: { ...classicTemplate.elements }
};

export default playfulTemplate;
