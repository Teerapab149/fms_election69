# voteCTA-button element

Primary call-to-action button on the home page. Stateful with 6 election states.

## States

- **login** — User not authenticated (default fallback)
- **notVoted** — Authenticated, hasn't voted (green, animated pulse)
- **voted** — Has voted (blue, "Results" CTA)
- **ended** — Election ended (slate, link to /results)
- **closed** — Voting closed manually via systemMode (slate, link to /closed)
- **paused** — Paused by admin (orange, link to /closed)

State selection happens internally in the variant component, mirroring the
`STATE_RESOLVERS.voteCTA` logic in `stateResolver.js` (because the legacy
component carries its own Tailwind-class branches for the fallback path).

## Variants

- **default** — Original FMS chunky button (gradient + glow + shine, all 6 states)

Day 9b will add: **minimal-pill** and **chunky-stamp** (3-state focus + fallback).

## Variant contract

Every variant component MUST:
1. Render root with `data-element="voteCTA-button"` attribute on the inner button
2. Accept `{config, data, resolvedConfig}` props (matches legacy VoteCTABlock)
3. Use the stateConfig from `resolvedConfig` when present (Layer 3)
4. Fall back to `--btn-*` vars (Layer 2) when stateConfig field is absent
5. Layer 1 tokens drive the vars by default (D10 fallback chain)
6. Preserve hover, click, accessibility behaviors (signIn for login; Link else)

## Layer 2 vars (17, declared at element root)

Core (7): `--btn-bg`, `--btn-bg-gradient`, `--btn-text`, `--btn-border-color`,
`--btn-border-width`, `--btn-radius`, `--btn-shadow`

Sizing (4): `--btn-padding-x`, `--btn-padding-y`, `--btn-font-size`, `--btn-font-weight`

Hover (3): `--btn-hover-bg`, `--btn-hover-shadow`, `--btn-hover-transform`

Decoration (3): `--btn-icon-color`, `--btn-letter-spacing`, `--btn-text-transform`

## Stateful expectations per variant

**default**: ALL 6 states fully styled per template config (Layer 3 explicit).

Other variants (minimal-pill, chunky-stamp coming Day 9b):
- Focus 3 states: notVoted, voted, ended (95% of usage)
- Other 3 states: auto-fallback styling (derived from primary state)
