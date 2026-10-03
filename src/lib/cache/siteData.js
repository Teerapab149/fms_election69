// Cached reads for what every page render needs (root layout + home + metadata).
// See ttlCache.mjs for why and for the multi-instance behaviour. Admin writers
// call bustSiteData() after a successful write so a change shows on the next
// request of that process, not after the TTL.
import { db } from "../db";
import { getTemplate } from "../../components/admin/editor/templates";
import { ttlCache, bustAllTtlCaches } from "./ttlCache.mjs";

// 3 s: short enough that an instance that did NOT see the admin write is stale
// for at most one human blink; long enough that a 30-60 s reload storm (~25-60
// renders/s) collapses ~3-4 SystemConfig reads per render into one per 3 s.
export const SITE_CONFIG_TTL_MS = 3000;
// Turnout number + candidate cards on the home. home-info already tolerates 8 s.
export const HOME_STATS_TTL_MS = 5000;

const configCache = ttlCache("siteConfig", SITE_CONFIG_TTL_MS);
const templateCache = ttlCache("siteTemplate", SITE_CONFIG_TTL_MS);
const homeCache = ttlCache("homeStats", HOME_STATS_TTL_MS);

// The row EVERY render reads. adminPasswordHash and themeConfig are not selected:
// nothing on the render path needs them and the hash should not sit in a
// long-lived object. null = no row yet.
export function getSiteConfig() {
  return configCache.get("", () =>
    db.systemConfig.findFirst({
      where: { id: 1 },
      select: {
        id: true, showResult: true, systemMode: true, googleFormUrl: true,
        pageLayout: true, globalConfig: true, activeTemplateId: true,
      },
    }),
  );
}

// Built-in templates resolve from memory; this matters for DB-forked slugs
// (one findUnique per render otherwise) and is busted by every template write.
export function getTemplateCached(slug) {
  return templateCache.get(String(slug), () => getTemplate(slug, db));
}

const VALID_YEARS = ["ปี 1", "ปี 2", "ปี 3", "ปี 4"];
export function getHomeStats() {
  return homeCache.get("", async () => {
    const [candidates, totalEligible, totalVoted] = await Promise.all([
      db.candidate.findMany({
        select: { id: true, number: true, logoUrl: true, name: true, slogan: true, groupImageUrls: true },
        orderBy: { number: "asc" },
        take: 5,
      }),
      db.user.count({ where: { year: { in: VALID_YEARS } } }),
      db.user.count({ where: { isVoted: true, year: { in: VALID_YEARS } } }),
    ]);
    return { candidates, totalEligible, totalVoted };
  });
}

export function bustSiteData() {
  bustAllTtlCaches();
}
