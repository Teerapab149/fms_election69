"use client";

// partyContent() wired to the app's own helpers, memoised per party. Every v2
// template's party material (party page, single-party ballot, member dialogs)
// reads through this; only how it LOOKS is the template's business.

import { useMemo } from "react";
import { getPath } from "../../../../utils/basePath";
import { normalizeImageUrls } from "../../../../utils/imageUrls";
import { sortMembersByPosition, positionRank } from "../../../../utils/memberSort";
import { socialList } from "../../../../utils/socialLinks";
import { partyContent } from "./partyContent.mjs";

/** a stored path (/images/…) or an absolute URL, as something an <img> can load */
export const mediaSrc = (p) => (!p ? null : String(p).startsWith("http") ? p : getPath(p));

const DEPS = { src: mediaSrc, normalizeImageUrls, sortMembersByPosition, positionRank };

export function usePartyContent(party) {
  return useMemo(() => ({
    ...partyContent(party, DEPS),
    // contact links: only when the party filled any of them in
    hasSocials: socialList(party?.socials).length > 0,
  }), [party]);
}
