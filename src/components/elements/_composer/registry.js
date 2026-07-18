// Atom registry — maps a Layer-1 atom (type + variant) to its component.
//
// This is the seed of the editor's "element palette": every entry here is a
// pickable library element. Keep keys aligned with elementTypes.js IDs where a
// match exists (text-title, text-label, text-body, button-primary, image).
//
// Resolution: ATOMS[type][variant] → component. Falls back to the type's first
// registered variant; warns (never throws — a descriptor typo must not crash UI).

import ImageGumroad from "../image/gumroad.jsx";
import BadgeGumroad from "../badge/gumroad.jsx";
import BadgeSoft from "../badge/soft.jsx";
import TextTitleGumroad from "../text-title/gumroad.jsx";
import TextLabelGumroad from "../text-label/gumroad.jsx";
import TextBodyGumroad from "../text-body/gumroad.jsx";
import ButtonPrimaryGumroad from "../button-primary/gumroad.jsx";
import ButtonPrimarySoft from "../button-primary/soft.jsx";
import TextMetaGumroad from "../text-meta/gumroad.jsx";
import TextStatGumroad from "../text-stat/gumroad.jsx";
import TextPlainGumroad from "../text-plain/gumroad.jsx";
import ChipGumroad from "../chip/gumroad.jsx";
import ChipSoft from "../chip/soft.jsx";

const ATOMS = {
  image: { gumroad: ImageGumroad },
  badge: { gumroad: BadgeGumroad, soft: BadgeSoft },
  "text-title": { gumroad: TextTitleGumroad },
  "text-label": { gumroad: TextLabelGumroad },
  "text-body": { gumroad: TextBodyGumroad },
  "button-primary": { gumroad: ButtonPrimaryGumroad, soft: ButtonPrimarySoft },
  "text-meta": { gumroad: TextMetaGumroad },
  "text-stat": { gumroad: TextStatGumroad },
  "text-plain": { gumroad: TextPlainGumroad },
  chip: { gumroad: ChipGumroad, soft: ChipSoft },
};

// list the variant ids registered for a type (for the editor's variant picker)
export function variantsOf(type) {
  return Object.keys(ATOMS[type] || {});
}

export function resolveAtom(type, variant = "gumroad") {
  const byVariant = ATOMS[type];
  if (!byVariant) return null;
  if (byVariant[variant]) return byVariant[variant];
  const keys = Object.keys(byVariant);
  if (keys.length) {
    if (typeof console !== "undefined") console.warn(`[composition] atom "${type}" has no variant "${variant}", using "${keys[0]}"`);
    return byVariant[keys[0]];
  }
  return null;
}

export { ATOMS };
