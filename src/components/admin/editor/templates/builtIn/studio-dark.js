/**
 * Studio Dark v2 Template — premium "Awwwards" warm-dark, lime accent
 *
 * Source: docs/design-refs/Studio Dark v2.html + studio-v2.css (a full 6-page
 * redesign of THIS site, made in a Claude Design session — user reaction:
 * "i like this one look good"). Identity: warm soft-dark canvas (#14140F, not
 * pure black), a single electric-lime accent (#D5FF3F) used sparingly, hairline
 * rules instead of heavy borders, quiet Geist sans + Instrument Serif italic
 * accent + Geist Mono small-caps labels, and a PERSISTENT 240px left rail nav.
 *
 * Built the gumroad/modern-dark way (P-LOG-005): spread classicTemplate first to
 * preserve text + element shape, then override (1) Layer-1 tokens, (2) per-element
 * configs/vars. The LAYOUT half is its own set of components dispatched by slug:
 * the shared shell (StudioDarkShell + StudioDarkRail) + per-page layouts
 * (StudioDark{Home,Candidates,Party,Vote,SingleParty,Results,Success,Closed},
 * plus the StudioDarkPartyIntro overlay + shared StudioDarkMemberModal/Lightbox).
 * Home dispatches in components/home/HomeRenderer.js; the rest in each app/<page>.
 *
 * Identity → mechanism map:
 *   - Warm-dark palette ........... Layer-1 --color-* (consumed site-wide via token scope)
 *   - Lime accent ................. --color-primary / --color-accent
 *   - Hairline rules .............. --color-border = --line (#2E2E22, subtle)
 *   - Pill buttons ................ --radius-button = 9999px
 *   - voteCTA outlined→fill pill .. variant: "minimal-pill" (lime outline, fills on hover)
 *   - Quiet display type .......... --font-display = Inter (loaded in layout.js)
 *
 * SCOPE (updated 2026-06-13): ALL pages now ship studio-dark layouts (home /
 * candidates / party / vote multi+single / results / success / closed). The
 * `elements` overrides below recolor the catalog elements the studio HOME still
 * composes (voteCTA-button, stats, meet, banner, hero text); the other pages are
 * self-contained StudioDark* layout components (not catalog elements — editing
 * there is theme-token + central text only, per the editor-strategy decision).
 *
 * PARITY RULE (like gumroad/verdure/original): every colour derives from
 * utils/studioDarkPalettes.js — the SAME ramp StudioDarkBaseStyles emits
 * (--sd-* vars) and injectTemplateTheme pushes in previews. Each colour variant
 * carries its FULL palette so an applied variant matches the preview.
 *
 * Per P-LOG-005: do NOT modify classic.js here. All overrides spread from
 * classicTemplate first.
 */

import { classicTemplate } from "./classic";
import { STUDIO_THEMES } from "../../../../../utils/studioDarkPalettes";

const SHADOW_SOFT = "0 16px 48px rgba(0,0,0,.4)";

// Palette slots per theme (see studioDarkPalettes.js): bg / bg2 / bg3 / bgRail,
// line / lineStrong, ink / ink2 / ink3 / ink4, accent / accent2.
function buildStudioTemplate(slug, name, description, p) {
  return {
    ...classicTemplate,
    id: slug,
    slug,
    name,
    description,
    layoutFamily: "studio-dark", // real template — own page layouts (left rail + chapter scenes)

    colorSwatch: {
      primary: p.accent,
      secondary: p.ink,
      background: p.bg
    },

    pages: {
      home:       { visible: true },
      vote:       { visible: true, backgroundColor: p.bg },
      candidates: { visible: true, backgroundColor: p.bg },
      results:    { visible: true, backgroundColor: p.bg },
      closed:     { visible: true, backgroundColor: p.bg },
      success:    { visible: true, backgroundColor: p.bg }
    },

    theme: {
      colors: {
        primary:    p.accent,
        accent:     p.accent2,
        background: p.bg,
        surface:    p.bg2,
        text:       p.ink,
        textMuted:  p.ink2,
        border:     p.line
      },
      typography: classicTemplate.theme?.typography,
      spacing:    classicTemplate.theme?.spacing,
      effects: {
        borderRadius: "1.125rem", // 18px — soft, not chunky
        shadow:       SHADOW_SOFT
      },
      // Layer 1 tokens — full set (no inheritance, snapshot-friendly).
      tokens: {
        "--color-primary":     p.accent,
        "--color-accent":      p.accent2,
        "--color-bg":          p.bg,
        "--color-surface":     p.bg2,
        "--color-text":        p.ink,
        "--color-text-muted":  p.ink2,
        "--color-border":      p.line,      // hairline rules everywhere
        "--radius-sm":         "10px",
        "--radius-md":         "14px",
        "--radius-card":       "22px",
        "--radius-button":     "9999px",    // pill buttons
        "--shadow-card":       SHADOW_SOFT,
        "--shadow-button":     "none",
        // Display font LOADED via next/font (layout.js → --font-studio-sans = Inter,
        // a near-identical sub for the prototype's Geist). Thai falls through to
        // Anuphan. The literal names are the fallback for any out-of-scope context.
        "--font-display":      "var(--font-studio-sans), 'Inter', var(--font-anuphan), 'Anuphan', system-ui, sans-serif",
        "--font-body":         "var(--font-anuphan), 'Anuphan', var(--font-studio-sans), system-ui, sans-serif"
      }
    },

    elements: {
      ...classicTemplate.elements,

      // === Hero text → warm off-white over dark ===
      "hero-title": {
        config: { ...classicTemplate.elements["hero-title"].config, color: p.ink }
      },
      "hero-subtitle": {
        config: { ...classicTemplate.elements["hero-subtitle"].config, color: p.ink2 }
      },
      "hero-subtitle2": {
        config: { ...classicTemplate.elements["hero-subtitle2"].config, color: p.ink3 }
      },
      "hero-year-badge": {
        config: { ...classicTemplate.elements["hero-year-badge"].config, color: p.ink3 }
      },

      // === Countdown — dark surface, ink cells, accent label (for non-home pages
      // still on classic layout; the studio-dark home rail owns its own countdown) ===
      "hero-countdown": (() => {
        const base = classicTemplate.elements["hero-countdown"].config;
        const dark = (s) => ({
          ...s,
          pillBackground: p.bg2,
          badgeBackgroundColor: p.bg3, badgeTextColor: p.ink,
          textMain: p.ink, textSub: p.ink2,
          borderColor: p.line, shadowColor: "transparent"
        });
        return {
          config: {
            before: dark(base.before),
            running: { ...dark(base.running), badgeBackgroundColor: p.accent, badgeTextColor: p.bg },
            paused: dark(base.paused),
            manualEnded: dark(base.manualEnded),
            nextYear: dark(base.nextYear)
          }
        };
      })(),

      // === voteCTA — minimal-pill: accent outline on transparent, fills on hover.
      // The variant reads --color-primary for outline/text and --color-surface
      // for the hover text — both resolve to studio-dark tokens automatically. State
      // logic (login/notVoted/voted/ended/closed/paused) is handled inside the variant. ===
      "voteCTA-button": {
        variant: "minimal-pill",
        config: { ...classicTemplate.elements["voteCTA-button"].config },
        vars: {
          ...classicTemplate.elements["voteCTA-button"].vars,
          "--btn-radius":       "9999px",
          // Layer-2 colour vars must REFERENCE Layer-1 tokens (not literal hex) so
          // preview swatch morphs re-tint them; resolution is identical since
          // studio's accent == --color-primary in every colour variant.
          "--btn-hover-bg":     "var(--color-primary)",
          "--btn-padding-x":    "28px",
          "--btn-padding-y":    "16px",
          "--btn-font-size":    "15px",
          "--btn-font-weight":  "500",
          "--btn-letter-spacing": "0"
        }
      },

      // === Stats — dark tiles, accent data highlights (non-home classic layout) ===
      "stats-voted-card": {
        config: {
          backgroundType:  "solid",
          backgroundColor: p.bg2,
          textColor:       p.ink
        }
      },
      "stats-progress-card": {
        config: {
          backgroundColor: p.bg2,
          borderColor:     p.line,
          numberColor:     p.ink,
          labelColor:      p.ink2,
          accentColor:     p.accent
        }
      },
      "stats-eligible-card": {
        config: {
          backgroundColor: p.bg2,
          borderColor:     p.line,
          numberColor:     p.ink,
          labelColor:      p.ink2,
          iconColor:       p.accent
        }
      },

      // === Meet section — dark surface + accent CTA ===
      "meet-section": {
        config: {
          visible:      true,
          borderColor:  p.line,
          glowFrom:     p.accent,
          glowVia:      p.accent2,
          glowTo:       p.bg2,
          surfaceLight: false
        }
      },
      "meet-title": {
        config: { ...classicTemplate.elements["meet-title"].config, color: p.ink }
      },
      "meet-cta": {
        config: {
          ...classicTemplate.elements["meet-cta"].config,
          backgroundColor: p.accent,
          textColor:       p.bg
        }
      },

      // === Banner — dark surface, hairline frame ===
      "banner-section": {
        variant: "default",
        config: { visible: true, borderColor: p.line },
        vars: {
          "--banner-bg":           "var(--color-surface)",
          "--banner-border":       "var(--color-border)",
          "--banner-border-width": "1px",
          "--banner-radius":       "var(--radius-card)",
          "--banner-shadow":       SHADOW_SOFT
        }
      },

      // === Vote page card → dark surface ===
      "vote-party-card": {
        config: {
          ...classicTemplate.elements["vote-party-card"].config,
          backgroundColor: p.bg2,
          borderColor:     p.line
        }
      }
    }
  };
}

export const studioDarkTemplate = buildStudioTemplate(
  "studio-dark", "Dark",
  "พื้นดำอุ่น เส้นบางคม ตัวอักษรเรียบ มีแถบเมนูอยู่ซ้ายมือตลอด ดูสงบและพรีเมียม สีเน้นเริ่มต้นเป็นเขียวไลม์ เลือกได้ 4 แบบ",
  STUDIO_THEMES["studio-dark"]);
export const studioDarkCyberTemplate = buildStudioTemplate(
  "studio-dark-cyber", "Dark · Cyber Blue",
  "โทนดำน้ำเงินเย็น + ฟ้าไซเบอร์ — คมกริบ เทคนิคัล ทันสมัย",
  STUDIO_THEMES["studio-dark-cyber"]);
export const studioDarkMagentaTemplate = buildStudioTemplate(
  "studio-dark-magenta", "Dark · Magenta",
  "โทนดำอมพลัม + ชมพูแมเจนต้า — จัดจ้าน มีพลัง กล้าแสดงออก",
  STUDIO_THEMES["studio-dark-magenta"]);
export const studioDarkAmberTemplate = buildStudioTemplate(
  "studio-dark-amber", "Dark · Amber",
  "โทนดำอุ่นอำพัน + ทองเหลว — ภูมิฐาน อบอุ่น พรีเมียม",
  STUDIO_THEMES["studio-dark-amber"]);

export default studioDarkTemplate;
