# HANDOFF — Verdure single-vote "warm ballot booth" + next steps

Written end of a long review/polish session (branch `new-version`).
**Self-contained — next session has zero memory of this.** Read top to bottom.

Branch: `new-version` · all work **COMMITTED** (6 verdure commits, newest first):
```
efdf7f9 feat(verdure): balanced top bar + tappable user pill (chrome)
d7f4438 feat(verdure): polish the single-vote booth (intro, decision, labels)
2240f64 chore(verdure): template-preview support for the redesigns
a22f54d fix(verdure): mobile pass, WCAG-AA contrast, Thai punctuation
0003f44 feat(verdure): party-detail page — logo crest, separate group photo, fixes
230b918 feat(verdure): redesign single-vote as a warm "ballot booth"
```
DB `activeTemplateId = verdure`. Election restored to **MULTI-party** (Unity #1 + test
party "พรรคทดสอบ TEMP" #8). NOT pushed. Not yet merged to main.

---

## 0. READ FIRST — the lessons + quirks this session paid for

1. **NEVER hide election content behind a JS/framer reveal.** The wax-seal INTRO is a
   curtain OVER always-rendered content + a `setTimeout(onDone, 4600)` safety that
   unmounts it no matter what. Verify any reveal with `getComputedStyle(el).opacity`,
   not a screenshot.
2. **The preview screenshot tool + long eval-polling loops WEDGE on continuous
   framer rAF** (the intro's rotating ring). Verify the intro via a single
   `await sleep; read` (no polling loop, no iframe poll). Reading CSS *rules* from
   `document.styleSheets` is reliable; `getComputedStyle` of `var()`-based colors
   sometimes returns black/transparent (a CDP quirk) — don't trust those, screenshot
   or read the rule instead. Geometry (`getBoundingClientRect`) reads are reliable.
3. **The preview `screenshot` often captures the page TOP regardless of scroll** on the
   live `/vote`. To show scrolled sections, use `template-preview` (scrolls better) or
   just verify via DOM and let the owner scroll on their own browser.
4. **NEVER stop the dev server** the owner watches (port 3000). Start via the preview
   tool (`preview_start` name `fms-dev`). It dropped a few times this session; just
   restart it (the owner's NextAuth session expires on restart → re-mock-login).
5. **Thai punctuation:** all-Thai sentences must NOT end with a period. Keep periods on
   English headlines + abbreviations (ม.ค.). Owner is firm on this.

---

## 1. WHAT THE SINGLE-VOTE PAGE IS NOW (`VerdureSingleParty.js`)

A warm "ละมุน" **ballot booth**, deliberately DIFFERENT from the cream *magazine*
party page (`VerdureParty.js`). Flow:
- **Intro** — a warm-cream wax-seal curtain: eyebrow → "PARTY No. 01" → the party LOGO
  stamps in (spring + bursting terra flash ring) → name reveals word-by-word → slogan →
  divider → tagline → pulsing "แตะเพื่อเริ่ม" hint → wipes up (~4.6s, tap to skip).
- **Hero** — golden-hour cream wash (`.vd-booth-bg`), a glowing cream seal showing the
  party logo (fits ANY logo: fixed 70% box + `object-fit:contain` → small logos enlarge,
  big shrink, never clipped), name, slogan, then the GROUP-PHOTO hero banner (→ lightbox).
- **Sections** — bilingual two-tier headers (EN eyebrow + big serif Thai + a terra accent
  bar): "เกี่ยวกับพรรค" (a bordered SCROLL panel, capped height), "นโยบายเด่น" (numbered
  list), "ทีมผู้สมัคร" (large portrait candidate cards — full-bleed, no light border).
- **Decision** — a "ballot moment": terra accent + serif "การตัดสินใจของคุณ" + instruction;
  options **รับรอง · Approve** (warm terra-soft primary) / **ไม่รับรอง · Disapprove** /
  **งดออกเสียง · Abstain** (dashed neutral) → confirm bar → double-check dialog.
- **No** status chip / secure footer (owner: redundant). Order: hero → about → policies →
  team → decision.

Shared chrome (`VerdureChrome.js`): cornermark (top-left logo+text on a translucent
blur pill) + user pill (top-right) are a **matched, aligned pair**. On phones the
cornermark collapses to its logo chip and the user pill to avatar + sign-out; **tap the
avatar** to drop down the name/id. Lightbox (`VerdureMemberModal.js`) image fills 96vw
on mobile with a wrapping caption.

---

## 2. HOW TO PREVIEW THE REAL SINGLE-VOTE (it needs a single-party election)

Live DB is multi-party, so `/vote` shows the multi grid. To see the single-vote booth
with REAL data, flip the election (snapshot + reversible, allowed in
`.claude/settings.local.json`):
```
node .specs/election-switch.js single      # hide the test party -> single-party
node .specs/election-switch.js voter       # prints a not-yet-voted studentId to mock-login
#   open http://localhost:3000/fms-ovs/vote  (mock-login that studentId; don't tap+confirm
#   an option unless you mean to cast that voter's real vote)
node .specs/election-switch.js restore     # ALWAYS restore the test party after
```
No-DB option: `template-preview?slug=verdure&page=vote&variant=single` (mock data,
editorMode — no intro, no user pill); add `&intro=1` to preview the intro in isolation.

---

## 3. NEXT SESSION — recommended work

**FIRST: the pre-merge gate.** Before merging `new-version` → `main`:
`preview_stop` → `rm -rf .next` → `npm run build` (must be GREEN) → `rm -rf .next` →
restart dev → `npm run smoke` (15/15). Paste outputs. (Needs the dev server stopped, so
do it when the owner is free — they watch port 3000.)

| Option | What | Why |
|---|---|---|
| **A. Consistency pass** | The single-vote page got heavy polish; the **multi-vote** `VerdureVote.js` and the success/results/closed pages now look plainer by comparison. Bring them up to the same warmth/level (section headers, contrast, spacing) so the template feels cohesive. | Most likely the owner's next ask — they care about polish |
| **B. More single-vote** | Owner iterates a LOT here; expect more tweaks. Possible: pinch-zoom lightbox for the group photo (repo has `react-zoom-pan-pinch`); micro-interactions; the multi-vote ballot. | If they want to keep refining |
| **C. Template lineup** | `docs/design-refs/` still has Quorum 50 / Editorial Narrative / Atelier 50 to build as new templates (read the ref FIRST — see HANDOFF-VERDURE-DONE.md §0.1). | The "5 distinct templates" goal |
| **D. Go-live infra** | owner's, not code — rotate secrets, backups, day-of checklist (`docs/PLAN-NEXT-SESSION.md`). | Before the real election |

My recommendation: **A** (consistency) — the single-vote now sets the quality bar; the
rest of Verdure should match it before shipping.

---

## 4. KEY FILES
```
Single-vote booth:  components/vote/VerdureSingleParty.js  (intro + booth + decision)
Party magazine:     components/vote/VerdureParty.js
Shared chrome:      components/home/VerdureChrome.js  (cornermark/user pill/dock + base CSS)
Lightbox + modal:   components/vote/VerdureMemberModal.js
Auth-free preview:  app/template-preview/page.js  (?slug=verdure&page=vote&variant=single[&intro=1])
Single/multi flip:  .specs/election-switch.js  (single | restore | voter | inspect) — gitignored
Design refs:        docs/design-refs/  ·  prior handoff: docs/HANDOFF-VERDURE-DONE.md
```
