// "Original" — the hand-crafted SAMO classic design, restored from the gold
// version at commit ee059dc. SELF-CONTAINED home layout family (OriginalHome +
// Navbar/Countdown/MeetCard); the INNER pages fall through to the classic layout.
//
// PARITY RULE (like gumroad/verdure): every colour derives from utils/
// originalPalettes.js — the SAME brand ramp OriginalBaseStyles reads (.orig-root
// --o-* vars for the home) and the classic inner pages read (Layer-1 --color-*
// tokens built here). Each formal colour variant carries its FULL palette so an
// applied variant matches the preview.
import { ORIGINAL_THEMES } from "../../../../../utils/originalPalettes";

function buildOriginalTemplate(slug, name, description, p) {
  return {
    slug,
    name,
    description,
    layoutFamily: "original",
    isLocked: true,
    colorSwatch: { primary: p.brand, secondary: p.bright, background: p.bg },
    // hardcoded home design (no editor element surface); tokens drive the classic
    // inner pages (Layer-1 allow-list in api/admin/page-layout).
    elements: {},
    theme: {
      tokens: {
        "--color-primary":    p.brand,
        "--color-accent":     p.bright,
        "--color-bg":         p.bg,
        "--color-surface":    "#FFFFFF",
        "--color-text":       p.ink,
        "--color-text-muted": "#64748B",
        "--color-border":     p.line,
      },
    },
    pages: { home: {}, candidates: {}, party: {}, vote: {}, results: {}, success: {}, closed: {} },
  };
}

export const originalTemplate = buildOriginalTemplate(
  "original", "ออริจินัล", "ดีไซน์ต้นฉบับ SAMO (ม่วง-ขาว) — เวอร์ชันที่ทำไว้ดีที่สุด · เลือกโทนทางการได้ 4 แบบ",
  ORIGINAL_THEMES["original"]);
export const originalNavyTemplate = buildOriginalTemplate(
  "original-navy", "ออริจินัล · ราชนาวี", "โทนกรมท่า + ทอง — ทางการ สุขุม น่าเชื่อถือ",
  ORIGINAL_THEMES["original-navy"]);
export const originalForestTemplate = buildOriginalTemplate(
  "original-forest", "ออริจินัล · ป่าลึก", "โทนเขียวขรึม — สงบ หนักแน่น เป็นทางการ",
  ORIGINAL_THEMES["original-forest"]);
export const originalMaroonTemplate = buildOriginalTemplate(
  "original-maroon", "ออริจินัล · เลือดหมู", "โทนเลือดหมู/แดงเข้ม — พิธีการ มีน้ำหนัก",
  ORIGINAL_THEMES["original-maroon"]);

export default originalTemplate;
