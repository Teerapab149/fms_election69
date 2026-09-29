// Every election fact a v2 page prints comes from ตั้งค่าทั่วไป (globalConfig)
// and nowhere else — no literal names, years or dates in any template (rule 4).
// The context already merges GLOBAL_CONFIG_DEFAULTS, so a field the admin never
// set still has its documented default. (fmsMeta from the v1 family is
// deliberately not used: it carries a literal Thai university name that no
// setting controls.)

import { resolveElectionPosterPath } from "../../../../utils/electionPoster.mjs";

export function electionMeta(gc = {}) {
  const wordmark = gc.electionName || [gc.electionNamePrefix, gc.electionNumber].filter(Boolean).join(" ");
  return {
    wordmark,
    campaign: gc.campaignTitle || "",
    org: gc.organizationName || "",
    faculty: gc.facultyName || "",
    facultyShort: gc.facultyShortEn || "",
    university: gc.university || "",
    ay: gc.academicYearTh != null ? String(gc.academicYearTh) : "",
    copyrightYear: gc.copyrightYear != null ? String(gc.copyrightYear) : "",
    bannerUrl: resolveElectionPosterPath(gc),
  };
}
