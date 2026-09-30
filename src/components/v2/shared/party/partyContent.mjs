// A party's own material, reduced to what a page may show — the same rules for
// every v2 template, so a party can never be presented differently by the
// template that happens to be active:
//
//   - every section exists only when the party filled it in (placeholders
//     like "ยังไม่มีข้อมูล…" count as empty)
//   - the first group photo is the cover; the ACTIVITY GALLERY is the rest, so
//     it exists only when more than one group photo was uploaded
//   - the team comes in tiers by positionRank: president (1), vice presidents
//     (2–3), everyone else (4+) — the same order every template uses
//
// Pure (no React, no app imports), tested by node. The app's helpers are passed
// in (`deps`) so this file never has to resolve a Next path.

const asText = (it) => (typeof it === "string" ? it : it?.title ?? it?.name ?? "");
const asDesc = (it) => (typeof it === "string" ? "" : it?.desc ?? it?.description ?? it?.detail ?? "");
export const isPlaceholder = (t) => !t || String(t).startsWith("ยังไม่มีข้อมูล");

/**
 * @param {object} party
 * @param {{ src: (p) => string|null, normalizeImageUrls: Function,
 *           sortMembersByPosition: Function, positionRank: Function }} deps
 */
export function partyContent(party, deps) {
  const { src, normalizeImageUrls, sortMembersByPosition, positionRank } = deps;
  const images = normalizeImageUrls(party?.groupImageUrls).map(src).filter(Boolean);
  const cover = images[0] || src(party?.officialImageUrl);
  const gallery = images.slice(1);

  const story = String(party?.logoMeaning || "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  const missions = (party?.missions || []).map(asText).filter((t) => !isPlaceholder(t));
  const policies = (party?.policies || [])
    .map((it) => ({ title: asText(it), desc: asDesc(it) }))
    .filter((p) => !isPlaceholder(p.title));

  const members = sortMembersByPosition(party?.members || []);
  const tiers = {
    lead: members.filter((m) => positionRank(m.position) === 1),
    vice: members.filter((m) => { const r = positionRank(m.position); return r > 1 && r < 4; }),
    rest: members.filter((m) => positionRank(m.position) >= 4),
  };

  return { images, cover, gallery, story, missions, policies, members, tiers };
}
