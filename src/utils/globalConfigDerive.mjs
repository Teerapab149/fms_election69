// Settings that are made of other settings. The admin types each name and the
// year once; these are assembled from them. Every key below is still STORED
// (templates keep reading campaignTitle, organizationName, electionCalendarYear,
// copyrightYear as before), the settings form just fills them in.
//
// A stored value that differs from what would be assembled is the admin's own
// wording ("แก้เอง") and is never overwritten — see isCustom(). Pure; tested.

import { parseBangkok } from "./electionConfig.js";

const BKK_OFFSET_MS = 7 * 60 * 60 * 1000;

// the calendar year the polls open in, or null when no date is set. Parsed the
// way the rest of the app parses it (parseBangkok: election times are Bangkok
// wall-clock by definition), so the year can never disagree with the schedule.
function pollingYear(cfg) {
  const d = parseBangkok(cfg?.electionStartAt);
  return d ? new Date(d.getTime() + BKK_OFFSET_MS).getUTCFullYear() : null;
}

export const DERIVED = {
  // "โครงการเลือกตั้ง" + the committee: the phrase every template's headline is
  campaignTitle: {
    from: ["committeeName"],
    derive: (c) => {
      const committee = String(c?.committeeName ?? "").trim();
      return committee ? `โครงการเลือกตั้ง${committee}` : "";
    },
  },
  // the organisation + the faculty: "สโมสรนักศึกษา" + "คณะวิทยาการจัดการ"
  organizationName: {
    from: ["organizationShort", "facultyName"],
    derive: (c) => `${String(c?.organizationShort ?? "").trim()}${String(c?.facultyName ?? "").trim()}`,
  },
  // the year the election actually happens in — the polling date's year, not
  // the academic year minus 543 (a Thai academic year spans two calendar years)
  electionCalendarYear: {
    from: ["electionStartAt"],
    derive: (c) => pollingYear(c) ?? "",
  },
  copyrightYear: {
    from: ["electionStartAt"],
    derive: (c) => pollingYear(c) ?? "",
  },
};

const same = (a, b) => String(a ?? "").trim() === String(b ?? "").trim();

/** true when the stored value is the admin's own, not the assembled one */
export function isCustom(key, cfg) {
  const d = DERIVED[key];
  if (!d) return false;
  const stored = cfg?.[key];
  if (stored == null || String(stored).trim() === "") return false;
  const assembled = d.derive(cfg);
  if (assembled === "") return false; // nothing to assemble from: keep what's there, not custom
  return !same(stored, assembled);
}

/**
 * The config with every non-custom derived key filled in.
 * @param manual  Set of keys the admin chose to write by hand
 */
export function applyDerived(cfg, manual = new Set()) {
  const out = { ...cfg };
  for (const [key, d] of Object.entries(DERIVED)) {
    if (manual.has(key)) continue;
    const v = d.derive(out);
    if (v !== "") out[key] = v; // no source yet → leave the stored value alone
  }
  return out;
}
