import { test } from "node:test";
import assert from "node:assert/strict";
import { applyDerived, isCustom } from "../../src/utils/globalConfigDerive.mjs";

const BASE = {
  committeeName: "คณะกรรมการบริหารนักศึกษา",
  organizationShort: "สโมสรนักศึกษา",
  facultyName: "คณะวิทยาการจัดการ",
  electionStartAt: "2027-02-06T08:30",
};

test("names are assembled from the parts typed once", () => {
  const c = applyDerived(BASE);
  assert.equal(c.campaignTitle, "โครงการเลือกตั้งคณะกรรมการบริหารนักศึกษา");
  assert.equal(c.organizationName, "สโมสรนักศึกษาคณะวิทยาการจัดการ");
});
test("the calendar and copyright years are the polling date's year (Bangkok)", () => {
  const c = applyDerived(BASE);
  assert.equal(c.electionCalendarYear, 2027);
  assert.equal(c.copyrightYear, 2027);
  // the typed wall-clock is Bangkok's: 1 Jan 00:30 is the new year even though
  // UTC is still on 31 Dec, and 31 Dec 23:30 is still the old one
  assert.equal(applyDerived({ electionStartAt: "2027-01-01T00:30" }).electionCalendarYear, 2027);
  assert.equal(applyDerived({ electionStartAt: "2026-12-31T23:30" }).electionCalendarYear, 2026);
});
test("a key the admin writes by hand is left alone", () => {
  const c = applyDerived({ ...BASE, campaignTitle: "งานเลือกตั้งพิเศษ" }, new Set(["campaignTitle"]));
  assert.equal(c.campaignTitle, "งานเลือกตั้งพิเศษ");
});
test("no source yet → the stored value stays", () => {
  const c = applyDerived({ copyrightYear: 2027 });
  assert.equal(c.copyrightYear, 2027);
});
test("a stored value that differs from the assembled one is the admin's own", () => {
  assert.equal(isCustom("campaignTitle", { ...BASE, campaignTitle: "โครงการเลือกตั้งคณะกรรมการบริหารนักศึกษา" }), false);
  assert.equal(isCustom("campaignTitle", { ...BASE, campaignTitle: "งานเลือกตั้งพิเศษ" }), true);
  assert.equal(isCustom("campaignTitle", { ...BASE, campaignTitle: "" }), false);
  // today's live data: committee "คณะกรรมการบริหาร" + campaign "โครงการเลือกตั้งคณะกรรมการบริหาร"
  assert.equal(isCustom("campaignTitle", { committeeName: "คณะกรรมการบริหาร", campaignTitle: "โครงการเลือกตั้งคณะกรรมการบริหาร" }), false);
  assert.equal(isCustom("unrelatedKey", BASE), false);
});
