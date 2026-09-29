import { test } from "node:test";
import assert from "node:assert/strict";
import { thaiPhrases } from "../../src/components/v2/shared/text/thaiPhrases.mjs";

test("org and campaign names break between phrases, never inside a word", () => {
  assert.deepEqual(thaiPhrases("สโมสรนักศึกษาคณะวิทยาการจัดการ"), ["สโมสรนักศึกษา", "คณะวิทยาการจัดการ"]);
  assert.deepEqual(thaiPhrases("โครงการเลือกตั้งคณะกรรมการบริหาร"), ["โครงการเลือกตั้ง", "คณะกรรมการบริหาร"]);
});
test("a button label breaks before เพื่อ, not inside ลงคะแนน", () => {
  assert.deepEqual(thaiPhrases("เข้าสู่ระบบเพื่อลงคะแนน"), ["เข้าสู่ระบบ", "เพื่อลงคะแนน"]);
});
test("Latin words and numbers stay with what comes before them", () => {
  assert.deepEqual(thaiPhrases("SAMO 50 โครงการเลือกตั้ง"), ["SAMO 50", "โครงการเลือกตั้ง"]);
});
test("empty input gives one empty phrase, not a crash", () => {
  assert.deepEqual(thaiPhrases(""), [""]);
});
