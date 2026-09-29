// Thai has no spaces, so a line breaks wherever the dictionary allows —
// "โครงการ / เลือกตั้งคณะ / กรรมการบริหาร" split "คณะกรรมการ" in two, and
// "สโมสรนักศึกษาคณะ / วิทยาการจัดการ" split the faculty's name. A line may only
// break between phrases:
//   · before "คณะ…" / "สโมสร" / "ประจำปี"
//   · before "นักศึกษา" — except inside "สโมสรนักศึกษา", which is one name
//     ("คณะกรรมการบริหาร / นักศึกษา")
//   · at a space the admin typed — but never before a Latin word or a number,
//     so "SAMO 50", "PSU Passport" and "ปีการศึกษา 2570" stay whole.
// Anything else stays as written (one phrase). Pure; tested by node.

const SPLIT = /(?=คณะ|สโมสร|ประจำปี)|(?<!สโมสร)(?=นักศึกษา)|\s+(?![0-9A-Za-z])/;

// A phrase longer than this may still break inside itself: a name nobody
// anticipated must wrap rather than run out of its column (Thai characters,
// counting vowel and tone marks).
export const LONG_PHRASE = 18;

export function thaiPhrases(s) {
  const str = String(s || "");
  const parts = str.split(SPLIT).map((x) => x.trim()).filter(Boolean);
  return parts.length ? parts : [str];
}
