// "FMS Official" — the faculty-branded formal template.
//
// WHY A SECOND OFFICIAL TEMPLATE. The other families are design directions
// (gumroad = poster energy, studio-dark = editorial, verdure = paper craft…).
// This one is not a direction, it is an identity: its colour, type and chrome
// are taken from the faculty's own site (fms.psu.ac.th) so a student recognises
// the ballot as the faculty's before reading a word. For an election system the
// visual claim "this is official" does real work — it is the difference between
// a result that is accepted and a result that gets argued with.
//
// SELF-CONTAINED family: it owns home, login and all six inner pages
// (FmsOfficialHome / FmsOfficialLogin / FmsOfficial{Candidates,Party,Vote,
// Results,Success,Closed} on FmsOfficialShell). Nothing falls through to the
// classic layout, which is why the tokens below matter less than in `original` —
// they still ship, so any page that ever DOES fall through stays in palette.
//
// PARITY RULE (like gumroad/verdure/original): every colour derives from
// utils/fmsOfficialPalette.js — the SAME ramp the layouts read, so an applied
// variant matches its preview exactly. It has to be that plain module and not
// FmsOfficialChrome.js: this file is pulled into the SERVER graph (index.js →
// layout.js getThemeTokenCss), and the chrome is a "use client" component.
//
// NO FUCHSIA in the plum build, deliberately. The flagship `original` ramp runs
// #8A2680 → #C026D3 → #D946EF, but the faculty site carries no magenta at all.
// Correcting that drift is half the point of this family.
import { FMS_OFFICIAL_THEMES } from "../../../../../utils/fmsOfficialPalette";

// Every variant is a FULL build from its palette, not a token patch on the
// default — same rule verdure and receipt follow. A half-built variant is how a
// preview and an applied template drift apart.
function buildFmsOfficialTemplate(slug, name, description, p) {
  return {
    slug,
    name,
    description,
    layoutFamily: "fms-official",
    isLocked: true,
    // primary = the brand fill (what the chooser chip should show), secondary =
    // the plum plate that dominates every inner page
    colorSwatch: { primary: p.brand, secondary: p.plum, background: p.surface },

    // Hardcoded layouts (same contract as `original`): the EditorElement Wraps in
    // FmsOfficialHome still expose each section for selection, but the visual
    // system is owned by the layout rather than assembled from element presets.
    elements: {},

    theme: {
      tokens: {
        "--color-primary":    p.brand,
        "--color-accent":     p.plum,
        "--color-bg":         p.bg,
        "--color-surface":    p.surface,
        "--color-text":       p.ink,
        "--color-text-muted": p.muted,
        "--color-border":     p.line,
      },
    },

    pages: { home: {}, candidates: {}, party: {}, vote: {}, results: {}, success: {}, closed: {} },
  };
}

// ── the flagship ──
// The ONLY variant that actually matches fms.psu.ac.th. Ship this one for a real
// election; the rest are there so the structure outlives the palette.
export const fmsOfficialTemplate = buildFmsOfficialTemplate(
  "fms-official", "FMS Official",
  "ธีมทางการของคณะ — ม่วงพลัม-ขาว อิงสีและตัวอักษรจากเว็บไซต์หลักคณะวิทยาการจัดการ เรียบ น่าเชื่อถือ ใช้ได้ทุกปี",
  FMS_OFFICIAL_THEMES["fms-official"]);

// ── colour variants ──
// Same chrome, same layouts, same restraint — only the hue moves. The footer
// stays neutral charcoal in all of them (the faculty's own footer is neutral),
// which is what keeps a recoloured build reading as institutional rather than
// as a themed product page.
export const fmsOfficialNavyTemplate = buildFmsOfficialTemplate(
  "fms-official-navy", "FMS Official · Navy",
  "โทนกรมท่า — ทางการแบบราชการสากล น่าเชื่อถือ สุขุม",
  FMS_OFFICIAL_THEMES["fms-official-navy"]);

export const fmsOfficialEmeraldTemplate = buildFmsOfficialTemplate(
  "fms-official-emerald", "FMS Official · Emerald",
  "โทนเขียวมรกต — สงบ เป็นกลาง ไม่ชนกับสีประจำพรรคใด",
  FMS_OFFICIAL_THEMES["fms-official-emerald"]);

export const fmsOfficialMaroonTemplate = buildFmsOfficialTemplate(
  "fms-official-maroon", "FMS Official · Maroon",
  "โทนแดงเบอร์กันดี — อบอุ่น หนักแน่น ใกล้เคียงอุณหภูมิสีม่วงเดิมที่สุด",
  FMS_OFFICIAL_THEMES["fms-official-maroon"]);

export const fmsOfficialSlateTemplate = buildFmsOfficialTemplate(
  "fms-official-slate", "FMS Official · Slate",
  "โทนเทาน้ำเงิน — เงียบที่สุด ไม่มีสีให้ตีความ เหมาะกับปีที่ผลคะแนนสูสี",
  FMS_OFFICIAL_THEMES["fms-official-slate"]);

export default fmsOfficialTemplate;
