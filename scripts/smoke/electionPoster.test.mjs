import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_ELECTION_POSTER_PATH,
  resolveElectionPosterPath,
} from "../../src/utils/electionPoster.mjs";

test("poster resolver uses the checked-in poster when the setting is absent", () => {
  assert.equal(resolveElectionPosterPath(), DEFAULT_ELECTION_POSTER_PATH);
  assert.equal(resolveElectionPosterPath({ electionBannerUrl: "" }), DEFAULT_ELECTION_POSTER_PATH);
  assert.equal(resolveElectionPosterPath({ electionBannerUrl: "   " }), DEFAULT_ELECTION_POSTER_PATH);
});

test("poster resolver trims and prefers the admin-configured image", () => {
  assert.equal(
    resolveElectionPosterPath({ electionBannerUrl: "  /images/banner/election-new.jpg  " }),
    "/images/banner/election-new.jpg",
  );
});

test("poster resolver preserves external image URLs", () => {
  assert.equal(
    resolveElectionPosterPath({ electionBannerUrl: "https://cdn.example.com/poster.webp" }),
    "https://cdn.example.com/poster.webp",
  );
});
