# HANDOFF — Gumroad "Active Pulse" polish (continue in a new chat)

Branch: `new-version` · all changes UNCOMMITTED in the working tree (commit only when the user asks).
This doc = where we are + how to keep polishing the public gumroad pages.

---

## 0. The one-paragraph context

The public election site runs the **gumroad "Active Pulse"** template (`activeTemplateId === 'gumroad'`).
Each public route's `page.js` fetches `/api/admin/page-layout` → if `isGumroad`, it renders a
`GumroadX` component (classic preserved under `!isGumroad`). We redesigned the whole template to a
**soft "ละมุน" tone** + per-page distinctive layouts. The user is design-led and iterates page by page;
they dislike overstatement (measure with computed values, not just screenshots), dislike tilted/เบี้ยว
elements, and want **each page to have its OWN identity** (do NOT copy one page's signature onto another).

---

## 1. Design system (FOLLOW THIS — already established)

**Soft palette** (every gumroad `.X-root` defines these as CSS vars; some files hardcode the hex):
```
--ink:#26271c   (warm dark-olive, NOT pure black)   --ink2:#5c5a4b
--cream:#FFF6EC --cream2:#FFE9D6 --paper:#FFFDFA
--pink:#FF9CE9  --lime:#C2F47E  --yellow:#FFD24D  --sky:#B6E6FF  --coral:#FF8A8A
--bw:2.5px      --sh:5px 5px 0 var(--ink)  (+ --sh-sm 3px, --sh-lg 8px)
fonts: --fd Archivo Black (display, latin) · --fb Anuphan/Kanit (Thai body) · --fm Space Grotesk (mono)
```
**Page background** (all pages): `background:linear-gradient(135deg,#FFE6F2 0%,#FFF7EE 46%,#EEF7DB 100%) fixed;`
(the old harsh `radial-gradient` colour blobs were removed everywhere.)

**Identity rules**
- Chunky: 2.5px ink borders + HARD offset shadows (no blur). Pop-colour fills.
- **NO tilts** — keep stickers/stamps/cards straight (`transform:none`). User repeatedly rejected เบี้ยว.
- Each page = its OWN head treatment. Home uses a pink-box "50" stamp; candidates uses a totally
  different one (ink text + pink offset-echo `text-shadow:.06em .06em 0 var(--pink)` + ✦ star + confetti).
  **Don't reuse the pink box elsewhere.** Give results/vote their own when you polish them.
- Per-page CSS prefixes: `gh-` home · `gc-` candidates · `gr-` results · `gv-` vote · `gsp-` single-party
  · `gcl-` closed · `gsx-` success · `gnav-` shared navbar · `gsi-` party intro.

---

## 2. Per-page status — what to polish next

| Page | File | State | Polish opportunities |
|---|---|---|---|
| **home** | `components/home/GumroadHome.js` | ✅ heavily polished (mosaic layout, distinctive). | mostly done. |
| **candidates** | `components/vote/GumroadCandidates.js` | ✅ head redesigned (echo+confetti), cards use party colours, cover centered. | card body layout could be tightened; empty-cover state. |
| **results** | `components/vote/GumroadResults.js` | ✅ soft palette + party colours; **head redesigned 2026-06-09 → own "live scoreboard" identity** (election name = INK plaque + LIME text + pink hard-shadow, in `elements/results-head/gumroad.jsx`). Verified live (computed: bg #26271c / text #C2F47E / shadow #FF9CE9). | demographics charts polish; locked-state head still uses `.gr-headline` (dark) — fine. |
| **vote (multi)** | `components/vote/GumroadVote.js` + `composites/vote-party-card/gumroad.jsx` | ✅ **LIVE-VERIFIED 2026-06-09** (mock-login 6610510149 + `node scripts/tmp-vote.js <id> false`): head + 2 party cards + งดออกเสียง + sticky "ยืนยันการลงคะแนน" footer render clean, no console errors. **BUG FIXED:** card logos were CLIPPED (tall/portrait logos overflowed the 220px `.gv-card__media` box — `max-height:78%` on a grid item doesn't resolve, so it acted as `none`). Fix: `.gv-card__media .el-img{ position:absolute; inset:0; width:100%; height:100%; object-fit:contain; padding:22px; box-sizing:border-box }` → letterboxes reliably (verified desktop+mobile, both logos now fully visible incl. "FMS PSU" wordmark). | head still uses pink-box device (like home) — give it own identity if polishing. |
| **single-party** | `components/vote/GumroadSingleParty.js` | ⚠️ soft palette applied, **still build-verified only** — live-verify needs 1-party ballot, but the temp party is LOCKED (user: อย่าลบ). member-tile (its core composite) IS live-verified on `/party`. | live-verify via a non-destructive 1-party path; extend party colours to hero; head. |
| **closed** | `components/vote/GumroadClosed.js` | ✅ soft, simple, fine. | minor. |
| **success** | `components/vote/GumroadSuccess.js` | ⚠️ soft palette, verified earlier via mock-login. | minor polish. |
| **party intro** | `components/vote/GumroadPartyIntro.js` | ✅ soft palette (hardcoded hex updated). cinematic. | minor. |

Suggested order (updated 2026-06-09): ✅ results head done · ✅ vote multi live-verified · **next: single-party live-verify (non-destructive 1-party path) → optional vote/results head distinctness → success minor**.

> NB strategy (memory `editor-strategy-decision`): gumroad is functionally 6/6 done; remaining is OPTIONAL polish. Higher priority for "lasts 10 years" = verify admin covers yearly edits + docs (`MAINTENANCE-RUNBOOK.md`). Don't over-invest in subjective head polish.

---

## 3. Systems you can reuse

- **Party colours** — `src/utils/partyColors.js`: `getPartyColor(party, party.number-1)`. Default rival
  palette (1 blue ↔ 2 red, then contrasting). Admin override via `Candidate.color` (DB) is `adaptToTone()`'d
  (softened toward the system tone). Already used in candidates cards + results race/ranks/winner.
  **TODO if polishing single-party:** use `getPartyColor` for the hero accent.
- **Image optimize on upload** — `src/lib/imageOptimize.js` (`optimizeImage(buffer,{maxWidth,quality,format})`,
  uses `sharp`). Wired into ALL upload handlers in `api/admin/candidates/route.js`. Applies to FUTURE uploads
  only; existing files are untouched (a batch re-optimize script was offered, not built).
- **Shared navbar** — `components/GumroadMobileMenu.js`: mobile burger+drawer AND desktop auth (`.gnav-auth-d`
  = login btn / user-name+logout). Each page reveals burger + hides desktop-auth in its mobile `@container`
  rule: `.gnav-nav{display:none} .gnav-burger{display:grid} .gnav-auth-d{display:none}`. Home uses its OWN
  `gh-` navbar (not this component).
- **voteCTA** — `components/elements/voteCTA-button/chunky-stamp.jsx`. Uses `var(--ink)`/`var(--pink)` so it
  follows the soft tone. "voted" state = pink stamp (clickable → /results). Mobile size trimmed via
  `.gh-cta .chunky-stamp-btn{padding/font !important}` at ≤560 (login config padding is huge).
- **GlobalConfig** — `utils/globalConfigDefaults.js` + `components/admin/GlobalConfigTab.js`. `campaignTitle`
  is a textarea (admin presses Enter for a manual line break; the home renders `\n` splits).

---

## 4. Env quirks & verification (IMPORTANT)

- **Preview**: `preview_start` name `dev` (port 3000, basePath `/fms-ovs`). `http://localhost:3000/fms-ovs`
  (no trailing slash = 200; trailing slash 308-redirects).
- **DB**: `prisma db push` (NOT `migrate dev` — migration history has drift, migrate would RESET/wipe data).
  After a schema change: db push → **stop the preview server first** (`preview_stop`) before `prisma generate`
  (EPERM lock on `query-engine-windows.exe` while the dev server holds it) → `prisma generate` → restart preview.
- **DB state**: `systemMode=MANUAL_OPEN, showResult=true, activeTemplateId=gumroad`. A **temp party (number 2
  "พรรคทดสอบ TEMP")** is intentionally kept so `/candidates` shows the grid (1 real party → `/candidates`
  redirects to `/party`). Helper to add/remove it: `node scripts/tmp-party.js add|remove`.
- **Auth-gated pages**: vote / success / single-party need a student session. Use the dev mock-login: open
  `/login` (shows a "Mock Login" form when `NEXT_PUBLIC_ENABLE_MOCK_LOGIN=true`), student id `6610510148`
  (isVoted=true → `/vote` redirects to `/success`; set isVoted=false to see the vote page).
- **Motion**: the preview forces `prefers-reduced-motion: reduce`, so CSS animations (e.g. the VOTED tile
  heartbeat `.gh-ekg path` sweep) render STATIC in preview — they animate in a real browser. Don't "fix" them.
- **Screenshots**: ticker / infinite anims hang `preview_screenshot` → inject
  `*{animation:none!important;transition:none!important}` via `preview_eval` first.
- **Verify with computed values** (`preview_inspect` / `preview_eval` getComputedStyle), not just screenshots —
  the user dislikes overstatement. Always check `preview_console_logs` level=error after changes.

---

## 5. Files touched this effort (working tree)

New: `GumroadMobileMenu.js`, `vote/Gumroad{Candidates,Closed,Success}.js`, `utils/partyColors.js`,
`lib/imageOptimize.js`, `scripts/tmp-party.js`, this doc.
Modified: `home/GumroadHome.js`, `vote/Gumroad{Results,Vote,SingleParty,PartyIntro}.js`,
`elements/voteCTA-button/chunky-stamp.jsx`, `components/Navbar.js`, `EditCandidateModal.js`,
`admin/GlobalConfigTab.js`, `utils/globalConfigDefaults.js`, `prisma/schema.prisma` (+`Candidate.color`),
`api/admin/candidates/route.js`, `app/{candidates,closed,success}/page.js`.

Also read the persistent memory note **`gumroad-progress`** (and `template-vision`, `vote-single-vs-multi`)
for the longer running history.

---

## 6. Working agreements with this user (don't relearn the hard way)

- Iterate **one page / one element at a time**, show it, get a reaction, adjust. Offer 2–4 visual variants
  for subjective choices (render a comparison overlay via `preview_eval` + ask) — this worked well for the
  meet button + the candidates headline.
- **Don't macro-rewrite a layout they already liked.** "bolder" = elevate details, not new IA.
- Keep Thai-first copy. Reply in Thai. No tilts. Soft tone. Each page distinct.
- Commit only when asked. Don't delete the temp party (kept on purpose).
