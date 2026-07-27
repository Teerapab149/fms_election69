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
  // No "เลือกโทนพรีเมียมได้อีก 4 แบบ" here: the field-colour variants are built in
  // this file but deliberately not registered (see templates/index.js), so the
  // description was advertising tones an admin could not select.
  "original", "ออริจินัล · ม่วง FMS", "ดีไซน์ต้นฉบับ SAMO (ม่วง-ขาว) — อัตลักษณ์แบรนด์คณะ",
  ORIGINAL_THEMES["original"]);
export const originalNavyTemplate = buildOriginalTemplate(
  "original-navy", "ออริจินัล · กรมท่า-ทอง", "โทนกรมท่าเข้ม + ทองแมตต์ — ทางการ น่าเชื่อถือ หรูสุขุม",
  ORIGINAL_THEMES["original-navy"]);
export const originalEmeraldTemplate = buildOriginalTemplate(
  "original-emerald", "ออริจินัล · มรกต-แชมเปญ", "โทนเขียวมรกต + แชมเปญทอง — ลึก ประณีต สง่างาม",
  ORIGINAL_THEMES["original-emerald"]);
export const originalCrimsonTemplate = buildOriginalTemplate(
  "original-crimson", "ออริจินัล · เลือดหมู-แพลทินัม", "โทนแดงเข้ม + เทาแพลทินัม — โมเดิร์น หนักแน่น ทรงพลัง",
  ORIGINAL_THEMES["original-crimson"]);
export const originalAubergineTemplate = buildOriginalTemplate(
  "original-aubergine", "ออริจินัล · ม่วงมะเขือ-ทองแดง", "โทนม่วงมะเขือ + ทองแดงเผา — โมเดิร์น มีพลัง คอนทราสต์สูง",
  ORIGINAL_THEMES["original-aubergine"]);

export default originalTemplate;
