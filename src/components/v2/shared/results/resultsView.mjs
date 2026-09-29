// The results page's arithmetic, shared by every v2 template: row order, each
// option's share, turnout, and the turnout-by-group tables.
//
// Rule 7 (docs/v2-design-rules.md) is enforced HERE rather than trusted to each
// template's markup: before the count is revealed the rows come back in ballot
// order with no score on them, so no template can sort, size or light a row by
// a number it does not have.
//
// Who won is not decided here — that is resolveVerdict() (utils/electionVerdict),
// shared by every family. Pure (no React, no app imports), tested by node.

/** ballot order: parties by number, then abstain (0), then disapprove (-1) */
const ballotOrder = (a, b) => {
  const na = a?.number ?? 0;
  const nb = b?.number ?? 0;
  if (na > 0 && nb > 0) return na - nb;
  return nb - na; // a party (>0) before 0 before -1
};

/**
 * @returns {{ rows: Array, eligible: number, turnout: number, demo: Array }}
 *   rows: revealed → sorted by score, each with `score` and `share` (%);
 *         sealed → ballot order, `score`/`share` removed
 */
export function resultsView({ candidates = [], totalVotes = 0, demographics = {}, revealed = false, groups = [] } = {}) {
  const list = (Array.isArray(candidates) ? candidates : []).filter(Boolean);
  const rows = revealed
    ? [...list]
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .map((c) => ({ ...c, score: c.score || 0, share: totalVotes > 0 ? ((c.score || 0) / totalVotes) * 100 : 0 }))
    : [...list].sort(ballotOrder).map(({ score: _score, share: _share, ...c }) => c);

  const eligible = demographics?.totalEligible || 0;
  const turnout = eligible > 0 ? (totalVotes / eligible) * 100 : 0;

  // groups: [{ key: "byYear", label: "ชั้นปี" }, …] — labels are the template's words
  const clean = (arr) => (arr || []).filter((d) => d && d.name != null && String(d.name).trim() !== "");
  const demo = groups
    .map((g) => {
      const rowsOf = clean(demographics?.[g.key]).map((x) => ({ name: x.name, value: x.value || x.count || 0 }));
      const sum = rowsOf.reduce((a, x) => a + x.value, 0) || 1;
      return { label: g.label, rows: rowsOf.map((x) => ({ ...x, share: (x.value / sum) * 100 })) };
    })
    .filter((g) => g.rows.length > 0);

  return { rows, eligible, turnout, demo };
}
