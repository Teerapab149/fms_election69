import { test } from "node:test";
import assert from "node:assert/strict";
import { setupChecklist, scheduleItem, formItem, hoursItem, thaiLongDateTime, thaiDuration } from "../../src/utils/setupChecklist.mjs";
import { parseBangkok } from "../../src/utils/electionConfig.js";

const NOW = new Date("2026-09-30T12:00:00+07:00");
const READY = {
  electionNamePrefix: "SAMO", electionNumber: 50, academicYearTh: 2570,
  campaignStartAt: "2027-01-29T08:30", electionStartAt: "2027-02-06T08:30", electionEndAt: "2027-02-06T17:00",
  electionBannerUrl: "/uploads/poster.jpg", googleFormUrl: "https://docs.google.com/forms/d/e/abc/viewform", activityHours: 2,
};

test("a complete year reads as ready", () => {
  const c = setupChecklist(READY, NOW);
  assert.equal(c.ready, c.total);
  assert.equal(scheduleItem(READY, NOW).value, "เปิดหีบ 6 ก.พ. 2570 08.30 น. ปิด 17.00 น.");
});
test("a schedule that cannot be right is not 'set'", () => {
  assert.equal(scheduleItem({ ...READY, electionEndAt: "2027-02-06T08:00" }, NOW).status, "ปิดหีบก่อนเปิดหีบ");
  assert.equal(scheduleItem({ ...READY, campaignStartAt: "2027-02-07T08:00" }, NOW).status, "เปิดตัวผู้สมัครหลังเปิดหีบ");
  // today's dev data: 9 Sep 2569, already over
  const past = { ...READY, campaignStartAt: "2026-09-09T10:00", electionStartAt: "2026-09-09T07:00", electionEndAt: "2026-09-09T22:00" };
  assert.equal(scheduleItem(past, NOW).status, "เปิดตัวผู้สมัครหลังเปิดหีบ");
  assert.equal(scheduleItem({ ...past, campaignStartAt: "2026-09-01T10:00" }, NOW).status, "ผ่านไปแล้ว");
  assert.equal(scheduleItem({ ...READY, electionStartAt: "" }, NOW).tone, "warn");
});
test("the form link must be a real https link", () => {
  assert.equal(formItem({ googleFormUrl: "" }).tone, "warn");
  assert.equal(formItem({ googleFormUrl: "docs.google.com/forms" }).status, "ไม่ใช่ลิงก์ Google Form");
  assert.equal(formItem({ googleFormUrl: "javascript:alert(1)" }).tone, "err");
  assert.equal(formItem({ googleFormUrl: "https://evil.example/forms" }).tone, "err");
  assert.equal(formItem(READY).tone, "ok");
});
test("no activity hours is a valid choice, not a gap", () => {
  const h = hoursItem({ activityHours: "" });
  assert.equal(h.tone, "none");
  assert.equal(setupChecklist({ ...READY, activityHours: "" }, NOW).ready, 5);
});
test("dates read the way a Thai admin reads them", () => {
  assert.equal(thaiLongDateTime(parseBangkok("2027-02-06T08:30")), "วันเสาร์ที่ 6 กุมภาพันธ์ 2570 เวลา 08.30 น.");
  assert.equal(thaiDuration(8.5 * 3600 * 1000), "8 ชั่วโมง 30 นาที");
  assert.equal(thaiDuration(3600 * 1000), "1 ชั่วโมง");
});
