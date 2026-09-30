// Thai has no spaces, so a line breaks wherever the dictionary allows —
// "สโมสรนักศึกษาคณะ / วิทยาการจัดการ" split the faculty's name in two. A line may
// only break between phrases: before "คณะ…" / "สโมสร" / "ประจำปี" / "เพื่อ"
// ("เข้าสู่ระบบ / เพื่อลงคะแนน"), or at a space
// the admin typed — but never before a Latin word or a number, so "SAMO 50" and
// "ปีการศึกษา 2570" stay whole. Anything else stays as written (one phrase).
//
// Same rule as Ballot's own copy in templates/ballot-official/BallotChrome.js
// (kept there untouched for now); shared here so v1 templates can use it.
// Pure; tested by node (scripts/smoke/thaiPhrases.test.mjs).
export function thaiPhrases(s) {
  const str = String(s || "");
  const parts = str.split(/(?=คณะ|สโมสร|ประจำปี|เพื่อ)|\s+(?![0-9A-Za-z])/).map((x) => x.trim()).filter(Boolean);
  return parts.length ? parts : [str];
}

// A phrase longer than this may still break inside itself: a name nobody
// anticipated (one long word, no spaces) must wrap rather than run out of its
// column. Callers give such a phrase white-space:normal.
export const LONG_PHRASE = 18;
