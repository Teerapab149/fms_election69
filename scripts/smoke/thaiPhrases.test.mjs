import { test } from "node:test";
import assert from "node:assert/strict";
import { thaiPhrases, LONG_PHRASE } from "../../src/components/v2/shared/text/thaiPhrases.mjs";

test("the campaign breaks between its phrases, never inside a word", () => {
  assert.deepEqual(thaiPhrases("โครงการเลือกตั้งคณะกรรมการบริหาร"), ["โครงการเลือกตั้ง", "คณะกรรมการบริหาร"]);
  assert.deepEqual(thaiPhrases("โครงการเลือกตั้งคณะกรรมการบริหารนักศึกษา"), ["โครงการเลือกตั้ง", "คณะกรรมการบริหาร", "นักศึกษา"]);
});
test("สโมสรนักศึกษา stays one name; the faculty keeps its own line", () => {
  assert.deepEqual(thaiPhrases("สโมสรนักศึกษาคณะวิทยาการจัดการ"), ["สโมสรนักศึกษา", "คณะวิทยาการจัดการ"]);
});
test("Latin words and numbers stay with what comes before them", () => {
  assert.deepEqual(thaiPhrases("SAMO 50 โครงการเลือกตั้ง"), ["SAMO 50", "โครงการเลือกตั้ง"]);
  assert.deepEqual(thaiPhrases("เข้าสู่ระบบด้วย PSU Passport"), ["เข้าสู่ระบบด้วย PSU Passport"]);
});
test("every phrase of today's names is short enough to keep whole", () => {
  for (const s of ["โครงการเลือกตั้งคณะกรรมการบริหารนักศึกษา คณะวิทยาการจัดการ", "สโมสรนักศึกษาคณะวิทยาการจัดการ"]) {
    for (const ph of thaiPhrases(s)) assert.ok(ph.length <= LONG_PHRASE, `${ph} is ${ph.length}`);
  }
});
test("empty input gives one empty phrase, not a crash", () => {
  assert.deepEqual(thaiPhrases(""), [""]);
  assert.deepEqual(thaiPhrases(null), [""]);
});
