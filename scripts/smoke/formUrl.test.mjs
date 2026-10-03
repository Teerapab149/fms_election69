import test from "node:test";
import assert from "node:assert/strict";
import { normalizeFormUrl, embedFormUrl } from "../../src/lib/forms/formUrl.mjs";

const OK = [
  "https://docs.google.com/forms/d/e/1FAIpQLSabc/viewform",
  "https://docs.google.com/forms/d/e/1FAIpQLSabc/viewform?usp=send_form",
  "https://docs.google.com/a/psu.ac.th/forms/d/e/1FAIpQLSabc/viewform",
  "https://forms.gle/AbC123_x-y",
  "  https://forms.gle/AbC123  ",
];
const BAD = [
  "javascript:alert(1)", "JaVaScRiPt:alert(1)", "data:text/html,<script>1</script>",
  "http://docs.google.com/forms/d/e/x/viewform", "https://evil.com/forms/x",
  "https://docs.google.com@evil.com/forms/x", "https://user:pw@docs.google.com/forms/x",
  "https://docs.google.com.evil.com/forms/x", "https://evildocs.google.com/forms/x",
  "https://docs.google.com/spreadsheets/d/abc", "https://docs.google.com/document/d/abc",
  "https://docs.google.com:8443/forms/d/x", "https://forms.gle/", "https://forms.gle/a/b",
  "https://docs.google.com/for\nms/d/x", "https://docs.google.com/forms/d/x y",
  "https://docs.google.com/forms/d/x\\@evil.com", "//docs.google.com/forms/x",
  "docs.google.com/forms/x", "", "   ", null, undefined, 42, {}, "https://" + "a".repeat(2100),
];

test("accepts Google Forms links", () => {
  for (const u of OK) assert.ok(normalizeFormUrl(u), u);
});
test("rejects everything else", () => {
  for (const u of BAD) assert.equal(normalizeFormUrl(u), null, String(u));
});
test("normalize strips embedded and fragment, keeps usp", () => {
  assert.equal(
    normalizeFormUrl("https://docs.google.com/forms/d/e/X/viewform?usp=send_form&embedded=true#top"),
    "https://docs.google.com/forms/d/e/X/viewform?usp=send_form");
});
test("embed never produces two question marks", () => {
  const withQ = embedFormUrl("https://docs.google.com/forms/d/e/X/viewform?usp=send_form");
  assert.equal(withQ, "https://docs.google.com/forms/d/e/X/viewform?usp=send_form&embedded=true");
  assert.equal((withQ.match(/\?/g) || []).length, 1);
  assert.equal(embedFormUrl("https://forms.gle/abc"), "https://forms.gle/abc?embedded=true");
});
test("embed is idempotent and null-safe", () => {
  const once = embedFormUrl("https://forms.gle/abc");
  assert.equal(embedFormUrl(once), once);
  assert.equal(embedFormUrl("javascript:1"), null);
});
