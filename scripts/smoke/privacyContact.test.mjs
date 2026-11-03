import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizePrivacyEmail, privacyEmailOf } from "../../src/lib/privacyContact.mjs";

test("a plain address is accepted and trimmed", () => {
  assert.equal(normalizePrivacyEmail("election@psu.ac.th"), "election@psu.ac.th");
  assert.equal(normalizePrivacyEmail("  Dpo.office+vote@fms.psu.ac.th "), "Dpo.office+vote@fms.psu.ac.th");
});

test("anything that could widen a mailto: link is refused", () => {
  for (const bad of [
    "", "   ", "a", "a@b", "a@b.", "@psu.ac.th", "a b@psu.ac.th",
    "a@psu.ac.th,b@psu.ac.th", "a@psu.ac.th;b@psu.ac.th", "a@psu.ac.th?cc=x@y.com",
    "a@psu.ac.th&bcc=x", "a%0d%0a@psu.ac.th", "<a@psu.ac.th>", "\"a\"@psu.ac.th",
    "a@@psu.ac.th", ".a@psu.ac.th", "a.@psu.ac.th", "a..b@psu.ac.th", "a@-psu.ac.th",
    "a@psu.ac.th\nBcc: x@y.com", "javascript:alert(1)",
  ]) assert.equal(normalizePrivacyEmail(bad), null, JSON.stringify(bad));
  assert.equal(normalizePrivacyEmail(null), null);
  assert.equal(normalizePrivacyEmail(42), null);
  assert.equal(normalizePrivacyEmail(`${"a".repeat(65)}@psu.ac.th`), null);
  assert.equal(normalizePrivacyEmail(`a@${"b".repeat(250)}.com`), null);
});

test("the page shows an address only when the stored one is usable", () => {
  assert.equal(privacyEmailOf({ privacyContactEmail: "x@psu.ac.th" }), "x@psu.ac.th");
  assert.equal(privacyEmailOf({ privacyContactEmail: "" }), "");
  assert.equal(privacyEmailOf({ privacyContactEmail: "garbage" }), "");
  assert.equal(privacyEmailOf(null), "");
  assert.equal(privacyEmailOf({}), "");
});
