/**
 * Committee member ordering — shared across every template / page.
 *
 * Admins enter each member's free-text `position` but can't reorder people in the
 * admin UI (members render in insert order). The committee has a real hierarchy,
 * so the SYSTEM imposes the canonical order here instead:
 *
 *   1. นายกสโมสรนักศึกษา            (president)
 *   2. อุปนายกฝ่ายกิจการภายนอก       (vice president, external)
 *   3. อุปนายกฝ่ายกิจการภายใน        (vice president, internal)
 *   4. เลขานุการ                    (secretary)
 *   5. เหรัญญิก                      (treasurer)
 *   6. ประธานฝ่าย…                   (department heads — keep admin's input order)
 *   7. ทุกตำแหน่งอื่น                 (anything unmatched — keep input order)
 *
 * Matching is keyword-based on the Thai position string. "อุปนายก" is tested
 * before "นายก" because it contains it. Sort is stable: equal-rank members keep
 * their original order (so the dept-head list and unknowns stay as entered).
 */

export function positionRank(positionRaw) {
  const p = String(positionRaw || "").replace(/\s+/g, "");
  if (!p) return 7;
  if (p.includes("อุปนายก")) {
    if (p.includes("ภายนอก")) return 2;
    if (p.includes("ภายใน")) return 3;
    return 2.5; // generic vice president, between the two
  }
  if (p.includes("นายก")) return 1; // president (อุปนายก already handled above)
  if (p.includes("เลขา")) return 4;
  if (p.includes("เหรัญญิก")) return 5;
  if (p.includes("ประธาน")) return 6;
  return 7;
}

/**
 * Returns a new array of members ordered by committee hierarchy.
 * Non-mutating; stable within the same rank.
 */
export function sortMembersByPosition(members) {
  if (!Array.isArray(members)) return [];
  return members
    .map((m, i) => ({ m, i, r: positionRank(m?.position) }))
    .sort((a, b) => (a.r - b.r) || (a.i - b.i))
    .map((x) => x.m);
}

export default sortMembersByPosition;
