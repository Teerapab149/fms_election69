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

import { classicTemplate }    from "./builtIn/classic";
import { modernDarkTemplate } from "./builtIn/modern-dark";
import { playfulTemplate }    from "./builtIn/playful";
import { minimalTemplate }    from "./builtIn/minimal";

const BUILT_IN_TEMPLATES = {
  classic:        classicTemplate,
  "modern-dark":  modernDarkTemplate,
  playful:        playfulTemplate,
  minimal:        minimalTemplate
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
    for (const tpl of Object.values(BUILT_IN_TEMPLATES)) {
      results.push({
        slug: tpl.slug,
        name: tpl.name,
        description: tpl.description,
        isBuiltIn: true,
        isLocked: tpl.isLocked || false,
        colorSwatch: tpl.colorSwatch,
        authorId: null,
        forkedFrom: null,
        createdAt: null
      });
    }
  }

  if (prisma && filters.isBuiltIn !== true) {
    try {
      const where = {};
      if (filters.isLocked !== undefined) where.isLocked = filters.isLocked;
      if (filters.authorId !== undefined) where.authorId = filters.authorId;

      const dbTemplates = await prisma.template.findMany({
        where,
        select: {
          slug: true,
          name: true,
          description: true,
          isLocked: true,
          authorId: true,
          forkedFrom: true,
          createdAt: true
        }
      });
      results.push(...dbTemplates.map((t) => ({ ...t, isBuiltIn: false })));
    } catch (err) {
      console.error("[listTemplates] DB query failed:", err.message);
    }
  }

  return results;
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
