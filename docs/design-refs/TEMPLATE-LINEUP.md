# Final Template Lineup — curation (2026-06-02)

## ✅ CONFIRMED by user (2026-06-02): **6 templates**, build **Gumroad first**
Classic + Quorum 50 + Editorial Narrative + Studio Dark v2 + Active Pulse/Gumroad + **Atelier 50**
(Atelier kept as the 6th = cobalt option, in case a non-civic blue is wanted alongside Quorum).
Dropped from active lineup (source archived in this folder): **Verdure 50** (user: unsuitable for
election) + **Studio Dark v1** (superseded by v2).
**Next session build target: the Gumroad / Active Pulse template** (`index.html` + `styles.css`),
continuing from the voteCTA `chunky-stamp` variant already shipped this session.

---


Source: 7 full redesigns of all 6 election pages (home/vote/success/candidates/party/results),
made for THIS site (FMS SAMO 50) in a Claude Design session. Raw HTML+CSS here in `docs/design-refs/`.
Intent + the user's reactions are in `CHAT-INTENT.md` (read it — it's where the intent lives).

Every design ships a clean `:root` token set (`--bg --surface --ink --primary --accent --rule …`)
that maps directly onto our ADR-001 Layer-1 tokens (`--color-bg/-surface/-text/-primary/-accent/-border`),
so the COLOUR side is cheap. The real per-template work is element treatments + page layout/variants
(Quorum's stepper + usable ballot, Studio v2's left rail, Gumroad's sticker chrome) — do one at a time,
the modern-dark way.

## Recommended FINAL lineup (5) — distinct, election-appropriate moods

| # | Template | Palette | Mood / why keep | Status |
|---|----------|---------|-----------------|--------|
| 1 | **Classic** (current) | purple `#8A2680` | Brand default, safe, in production | ✅ exists |
| 2 | **Quorum 50** ⭐ | putty `#F1EDE4` + civic blue `#2D43C9` + amber `#F5B82E` + emerald `#15803D` | **Most usable / civic / trustworthy.** Kiosk-grade: horizontal stepper, select→review→confirm ballot, dashboard home, comparison-table candidates. The user's iteration LANDED here ("designed to be used, not just admired"). Best for the real election. | 🔜 build (flagship) |
| 3 | **Editorial Narrative** | cream `#F2EDE2` + oxblood `#7A2E2E` (serif) | Calm, elegant, easy on the eyes, single accent, no gradients. User refined it (less quote-y, simpler). Distinct serif identity. | 🔜 build |
| 4 | **Studio Dark v2** | soft-dark `#14140F` + electric-lime `#D5FF3F` | Premium Awwwards dark; left-rail UX + ledger results. User: "i like this one look good." **Upgrades/replaces the modern-dark stub.** | 🔜 build (supersedes modern-dark) |
| 5 | **Active Pulse / Gumroad** | cream/peach + pink+lime+yellow+sky pops, Archivo Black | Bold, youthful student energy. User: "this is insane" (loved). **voteCTA `chunky-stamp` variant already in our system** — this is its full home. Becomes the real "playful" template. | ✅ **built `gumroad` 2026-06-03** (P-LOG-072): tokens + home + chunky-stamp voteCTA + pop stat tiles + chunky banner. GAPS: display font not consumed yet; stats hard-shadow blocked by fixed Tailwind class; per-page detail polish pending |

## Deferred / dropped (source kept in design-refs anyway)
- **Studio Dark v1** (`Studio Dark.html`) — superseded by v2 (same palette, weaker UX). Use v2.
- **Atelier 50** — bone + cobalt `#2845E0`. User lukewarm ("color not flow together, same as my design"). Candidate for a 6th later if we want a cobalt option.
- **Verdure 50** — moss `#1F3A2C` + terracotta `#BC5E3E`. Beautiful but user said "hard to use, didn't suit the election system." Archive only.

## Build order (highest value first)
1. **Quorum** — flagship usability for the real Feb-2027 election.
2. **Studio Dark v2** — replace the modern-dark stub with the real premium dark.
3. **Editorial Narrative** — the calm/elegant option.
4. **Gumroad** — finish the playful template (voteCTA chunky-stamp already done).

Each = (a) translate `:root` → Layer-1 tokens, (b) element configs/vars per the design, (c) any
new variants for distinct chrome (sticker borders, hairline rules, stepper), (d) per-page layout
where the UX differs. Reuse the deconfliction + tokenization work already done.
