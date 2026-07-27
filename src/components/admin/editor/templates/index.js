/**
 * Template Loader — Hybrid system
 *
 * Loads templates from:
 *   1. Built-in code files (always available, reserved slugs)
 *   2. Archive code files (yearly snapshots, preserved in git)
 *   3. DB Template table (user-created custom templates)
 *
 * Built-ins take priority if slug collision.
 */

import { modernDarkTemplate } from "./builtIn/modern-dark";
import { playfulTemplate }    from "./builtIn/playful";
import { minimalTemplate }    from "./builtIn/minimal";
import { gumroadTemplate, gumroadCyberTemplate, gumroadRetroTemplate, gumroadAcidTemplate, gumroadPremiumTemplate, gumroadBubblegumTemplate } from "./builtIn/gumroad";
import { studioDarkTemplate, studioDarkCyberTemplate, studioDarkMagentaTemplate, studioDarkAmberTemplate } from "./builtIn/studio-dark";
import { verdureTemplate, verdureHoneyTemplate, verdureTealTemplate, verdureBerryTemplate } from "./builtIn/verdure";
// Original is intentionally purple-only in the chooser: it's a hand-crafted
// single-palette design, so the field-colour variants (navy/emerald/crimson/
// aubergine) never matched the flagship's craft (owner call 2026-07-08). The
// builder + palettes are KEPT in builtIn/original.js + originalPalettes.js so
// re-enabling is just re-importing + re-registering them below.
import { originalTemplate } from "./builtIn/original";
import { blossomTemplate, blossomSkyTemplate, blossomMintTemplate, blossomButterTemplate } from "./builtIn/blossom";
import { receiptTemplate, receiptInkBlueTemplate, receiptTealTemplate, receiptCarbonTemplate } from "./builtIn/receipt";

const BUILT_IN_TEMPLATES = {
  // "classic" and "original" were never two designs. Original IS the classic layout
  // — it was born from an attempt to give classic colour themes, the attempt was
  // abandoned, and the revert left the rebuilt home/navbar/countdown behind as a
  // second family. Since then classic has been hidden from the chooser, so admins
  // already saw one template while the code carried two.
  //
  // The slug cannot simply be deleted: schema.prisma defaults activeTemplateId to
  // "classic", 27 places in src fall back to it, and any existing database still
  // holding that value would resolve to nothing. So it stays as an ALIAS — every
  // one of those paths now lands on the original template, a fresh install boots
  // into it, and there is exactly one official design in the system.
  classic:        originalTemplate,
  "modern-dark":  modernDarkTemplate,
  playful:        playfulTemplate,
  minimal:        minimalTemplate,
  gumroad:        gumroadTemplate,
  "gumroad-cyber": gumroadCyberTemplate,
  "gumroad-retro": gumroadRetroTemplate,
  "gumroad-acid":  gumroadAcidTemplate,
  "gumroad-premium": gumroadPremiumTemplate,
  "gumroad-bubblegum": gumroadBubblegumTemplate,
  "studio-dark":  studioDarkTemplate,
  "studio-dark-cyber":   studioDarkCyberTemplate,
  "studio-dark-magenta": studioDarkMagentaTemplate,
  "studio-dark-amber":   studioDarkAmberTemplate,
  verdure:        verdureTemplate,
  "verdure-honey": verdureHoneyTemplate,
  "verdure-teal":  verdureTealTemplate,
  "verdure-berry": verdureBerryTemplate,
  original:            originalTemplate,
  // field-colour variants un-registered (purple-only) — see import note above
  blossom:             blossomTemplate,
  "blossom-sky":       blossomSkyTemplate,
  "blossom-mint":      blossomMintTemplate,
  "blossom-butter":    blossomButterTemplate,
  receipt:             receiptTemplate,
  "receipt-ink-blue":  receiptInkBlueTemplate,
  "receipt-teal":      receiptTealTemplate,
  "receipt-carbon":    receiptCarbonTemplate
};

// Archive (empty for now — yearly snapshots imported here in Phase 5+).
const ARCHIVE_TEMPLATES = {};

/**
 * Get template by slug. Checks code files first, then DB.
 */
export async function getTemplate(slug, prisma) {
  if (BUILT_IN_TEMPLATES[slug]) {
    return BUILT_IN_TEMPLATES[slug];
  }
  if (ARCHIVE_TEMPLATES[slug]) {
    return ARCHIVE_TEMPLATES[slug];
  }

  if (prisma) {
    try {
      const dbTemplate = await prisma.template.findUnique({ where: { slug } });
      return dbTemplate;
    } catch (err) {
      console.error("[getTemplate] DB lookup failed:", err.message);
      return null;
    }
  }

  return null;
}

/**
 * List all available templates (built-ins + DB).
 *
 * filters:
 *   isBuiltIn:  true | false (omit to include both)
 *   isLocked:   true | false
 *   authorId:   number
 */
export async function listTemplates(prisma, filters = {}) {
  const results = [];

  if (filters.isBuiltIn !== false) {
    // dedupe by slug: "classic" is an ALIAS onto the original template (see the map
    // above), so iterating the values yields that one template twice and the chooser
    // would draw it as two identical swatches.
    const seen = new Set();
    for (const tpl of Object.values(BUILT_IN_TEMPLATES)) {
      if (seen.has(tpl.slug)) continue;
      seen.add(tpl.slug);
      results.push({
        slug: tpl.slug,
        name: tpl.name,
        description: tpl.description,
        isBuiltIn: true,
        isLocked: tpl.isLocked || false,
        // "classic" = theme-recolor of the original layout; "gumroad"/"studio-dark"
        // = real templates with their own layouts (drives the gallery thumb + chip).
        layoutFamily: tpl.layoutFamily || "classic",
        colorSwatch: tpl.colorSwatch,
        authorId: null,
        authorName: null,
        forkedFrom: null,
        createdAt: null,
        elementCount: Object.keys(tpl.elements || {}).length,
        pageCount: Object.keys(tpl.pages || {}).length
      });
    }
  }

  if (prisma && filters.isBuiltIn !== true) {
    try {
      const where = {};
      if (filters.isLocked !== undefined) where.isLocked = filters.isLocked;
      if (filters.authorId !== undefined) where.authorId = filters.authorId;

      // Pillar 2 (gallery slice 1): pull the blobs to derive metadata, but
      // strip them from the list payload — only counts + swatch ship.
      const dbTemplates = await prisma.template.findMany({
        where,
        select: {
          slug: true,
          name: true,
          description: true,
          isLocked: true,
          authorId: true,
          author: { select: { name: true } },
          forkedFrom: true,
          createdAt: true,
          pages: true,
          elements: true,
          theme: true
        }
      });
      results.push(...dbTemplates.map((t) => {
        const { pages, elements, theme, author, ...rest } = t;
        return {
          ...rest,
          isBuiltIn: false,
          // DB templates are token forks — HomeRenderer dispatches layouts by
          // SLUG, and a fork's new slug falls back to the classic layout.
          layoutFamily: "classic",
          authorName: author?.name || null,
          colorSwatch: deriveColorSwatch(theme),
          elementCount: elements ? Object.keys(elements).length : 0,
          pageCount: pages ? Object.keys(pages).length : 0
        };
      }));
    } catch (err) {
      console.error("[listTemplates] DB query failed:", err.message);
    }
  }

  return results;
}

/**
 * Derive a 2-color swatch from a DB template's theme (no colorSwatch column).
 * Prefers Layer 1 tokens, falls back to a legacy colors map, then brand purple.
 */
function deriveColorSwatch(theme) {
  const tokens = theme?.tokens || {};
  const colors = theme?.colors || {};
  return {
    primary:
      tokens["--color-primary"] || colors.primary || "#8A2680",
    secondary:
      tokens["--color-secondary"] || colors.secondary || "#9333EA"
  };
}

/**
 * Check whether a template is editable (not built-in, not locked).
 */
export function isTemplateEditable(template) {
  if (!template) return false;
  if (template.isBuiltIn) return false;
  if (template.isLocked) return false;
  return true;
}

/**
 * Check if slug is a built-in (reserved).
 */
export function isBuiltInSlug(slug) {
  return Object.prototype.hasOwnProperty.call(BUILT_IN_TEMPLATES, slug);
}

export { BUILT_IN_TEMPLATES, ARCHIVE_TEMPLATES };
