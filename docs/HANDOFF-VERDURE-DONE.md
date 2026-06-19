# HANDOFF — Verdure template DONE + direction for next session

Written end of a long Verdure build/polish session (branch `new-version`).
**Self-contained — next session has zero memory of this work.** Read top to bottom.

Branch: `new-version` · last commit `2e78ba8` · **Verdure work is NOT committed yet** (33 files).
DB `activeTemplateId = verdure` (owner applied it; was `studio-dark`).

---

## 0. READ THESE FIRST (the lessons paid for in this session)

1. **Read `docs/design-refs/` BEFORE building a template.** My biggest mistake: I built a wrong "glassmorphism terrarium" Verdure from a guess, when the real design was sitting in `docs/design-refs/Verdure 50.html` + `verdure.css` (next to the `Studio Dark v2.html` studio-dark came from). `docs/design-refs/CHAT-INTENT.md` + `TEMPLATE-LINEUP.md` hold the design intent + the owner's reactions. Always read them first.
2. **NEVER hide election content behind a JS/framer reveal.** I added `initial:{opacity:0}` + framer `animate`/`whileInView` entrance animations to the ballot option rows + party chapters — in this environment the animations didn't complete and the content stayed at `opacity:0`. **The ballot options were invisible → users couldn't vote.** Removed. Decorative motion is fine ONLY if the element is non-essential OR has a non-framer fallback (e.g. the single-vote intro has a `setTimeout` that unmounts the curtain even if the wipe never fires). Verify any reveal with `getComputedStyle(el).opacity`, not a screenshot.
3. **The preview `screenshot` tool wedges on continuous framer-motion rAF** (rotating rings, marquees). It times out after 30s. Verify via DOM (`preview_eval` + `getComputedStyle`) instead; the owner watches the live page anyway. Do NOT override `window.requestAnimationFrame` to freeze — that breaks the screenshot tool further.
4. **NEVER stop the dev server.** The owner watches it live in their browser / Claude Desktop on **port 3000** (`http://localhost:3000/fms-ovs`). Start it with the preview MCP tool (`preview_start` name `fms-dev`) so it shows in Claude Desktop and binds 3000. Don't `npm run dev` as a Bash background job (invisible + steals 3000 so the owner's own run jumps to another port). Don't `npm run build` while they watch (it forces stopping dev).
5. **The app lives at the `/fms-ovs` basePath.** `http://localhost:3000/` → 404 (by design); `http://localhost:3000/fms-ovs` → the app. "Applied verdure → 404" was just the bare-root path, not a bug.

---

## 1. WHAT VERDURE IS (the finished template)

Faithful port of `docs/design-refs/Verdure 50.html` + `verdure.css`: a **moss + cream +
terracotta serif "Anniversary Edition" editorial** template. Identity:
- **Palette:** moss `#1F3A2C` (dark surface/ink) · cream `#F4ECDB` (paper) · terracotta `#BC5E3E` (accent) · rule `#D4C9AC`. Pages alternate cream vs `.vd-moss` (candidates + success = moss bg).
- **Fonts (LOADED in `layout.js` via next/font):** DM_Serif_Display (`--font-dm-serif`, the big italic numerals/headings), Manrope (`--font-manrope`), IBM_Plex_Sans_Thai (`--font-plex-thai`, Thai body), Space_Mono (`--font-space-mono`, labels). A declared font does nothing unless loaded — this is the root cause of past drift.
- **Signature:** discs/circles everywhere (home wax-seal medallion, round party numbers, round ballot discs, results disc, success arched-text seal) + a fixed vertical edge label + an "S"-replaced FMS logo cornermark + a **bottom floating moss dock** (the unique nav, vs studio's left-rail / atelier's top-stepper).

### Files (all NEW, uncommitted)
```
src/components/admin/editor/templates/builtIn/verdure.js   theme tokens + register
src/components/home/VerdureChrome.js   edge rail · cornermark (real FMS logo) · cornerstatus · dock · base CSS · verdureMeta()
src/components/vote/VerdureShell.js    inner-page wrapper (cream/moss canvas + chrome)
src/components/home/VerdureHome.js     SAMO medallion (animated wax seal) + state-aware CTA + stat ledger
src/components/vote/VerdureCandidates.js  moss page · round-logo party panels + number discs
src/components/vote/VerdureParty.js    ribbon + Vision/Mission/Policies/Team chapters + logo crest + roster
src/components/vote/VerdureVote.js     ballot: round-disc option rows + moss confirm bar
src/components/vote/VerdureSingleParty.js  full presentation + 3-choice ballot + WAX-SEAL INTRO
src/components/vote/VerdureResults.js  result disc (winner) + tidy stat row + embargoed race + demographics
src/components/vote/VerdureSuccess.js  arched-text seal ornament + receipt
src/components/vote/VerdureClosed.js   composed status page (seal disc)
src/components/vote/VerdureMemberModal.js  member modal + lightbox
src/components/login/VerdureLogin.js   editorial login card (vertical FMS logo)
```
Dispatch seams wired (the `M` files): `layout.js` (4 fonts), `HomeRenderer.js`, the 7 `app/*/page.js`, `ThemedLoadingScreen.js`, `template-preview/page.js`, the 5 `*EditorPreview.js`, `PageDesignTab.js` (thumb + family order), `DesignLibrary.js`, `templateEngine.js` (TEMPLATE_INFOS), `templates/index.js`.

---

## 2. WHAT THIS SESSION DID (newest → oldest)

- **Party page rework** (owner feedback): symmetric ribbon stat column; **Mission split into its own chapter** (Vision · Mission · Policies · Team, roman numerals auto-numbered); 88px section spacing + terra chapter eyebrows + bigger serif heads; **party logo crest** added in Vision; **member role font 9px → 13px** (sans). Candidates **logo fit**: padding 38→22px + lighter cream-2 disc so the mark fills the frame and white logo bgs blend.
- **Admin image upload already compresses** — `sharp` via `src/lib/imageOptimize.js`; `api/admin/candidates` resizes (maxWidth 800–1600) + quality 80–82 (mozjpeg/webp). No work needed.
- **Single-vote unique INTRO** — a wax-seal cinematic opener (`VerdureBallotIntro` inside `VerdureSingleParty`): moss curtain → party seal stamps in (spring + rotating ring) → name reveals word-by-word → "ENTER" hint → curtain wipes up. Skips in editorMode; **has a 3s `setTimeout` safety** so it can never get stuck. Only plays live when 1 party runs.
- **Removed unsafe entrance animations** (the opacity:0 ballot bug — see §0.2).
- **Candidates fixes:** party-1 name was cream-on-cream (invisible) → set `.vd-ppanel__name { color:var(--moss) }`; media now prefers the party **logo** over the team group photo.
- **No "№"** — replaced with "No." everywhere (7 files).
- **Logo swaps:** cornermark uses the real horizontal FMS logo (`FMS_Standard_Logo_PNG.png`); login + loading use the **vertical** logo (`09_FMS_Short_EN_V_PNG.png`). Owner's call on horizontal vs vertical per spot.
- **Home polish:** seal = Awwwards-grade (mouse-parallax 3D tilt + rotating stamp-text ring + counter-rotating dashed ring + cursor sheen + press-on-hover, all framer so reduce-motion can't freeze it); the **central wordmark/above-line is dead-centre** (3-col grid); the **CTA is now a big state-aware terracotta pill** under the seal (was a buried tiny circle); CTA hover fixed (terra-2, not moss — it was merging into the moss seal). Stat ledger compact.
- **Dock redesign:** 4 clear Thai-labelled items (หน้าหลัก · ผู้สมัคร · ลงคะแนน · ผลคะแนน), dropped "Profile" (reached via Candidates, which already auto-redirects a 1-party election to `/party`), dropped the studio-like numbers, fits mobile without scroll.
- **Results tidied:** removed the scattered tilted orbital stat cards → moderate result disc (winner name inside) + a clean 3-stat row. Embargo preserved (locked shows only `??.?%` + veil).
- **De-hardcoded all year/number/edition text** via `verdureMeta(globalConfig)` in `VerdureChrome.js` (electionNumber/prefix/electionCalendarYear/academicYearTh/facultyShortEn/organizationName). "Fiftieth Anniversary Edition" → `"— {faculty} Student Council Election —"`. **NO Thai numerals** — `toArabic()` normalises ๐-๙→0-9 (verified `hasThaiNumerals:false` on every page).
- **Full faithful rebuild** of the whole template from the design-ref (after scrapping the wrong terrarium version).

---

## 3. STATE / VERIFICATION

- Every Verdure route returns 200 via dev; content visible (`getComputedStyle opacity` = 1 on ballot rows + chapters); embargo intact; no console/portal errors. Screenshots captured for home (desktop+mobile), candidates, vote, results, success, party, login.
- **Build + smoke NOT re-run since the last batch of edits** (party rework, candidates logo, intro). The dev server compiles all pages, but before committing the next session MUST: stop dev → `rm -rf .next` → `npm run build` (GREEN) → `rm -rf .next` → start dev → `npm run smoke` (15/15). Re-paste outputs (Rule 8).
- DB: `activeTemplateId=verdure`, real parties = Unity №1 (17→21 members, has logo) + พรรคทดสอบ TEMP №2. **It's MULTI-party**, so the single-vote intro doesn't show live — to demo it, temporarily make the election single-party (snapshot DB first).

---

## 4. RECOMMENDED DIRECTION (pick one — owner's call)

**FIRST, regardless:** commit Verdure. 33 files of unsaved work = real loss risk. Run the build+smoke gate (§3), then atomic commits on `new-version` (theme+register · chrome+shell · pages · seams · polish). Don't `git add -A`.

Then choose:

| Option | What | Why / when |
|---|---|---|
| **A. Finish Verdure polish** | success/closed/login mobile pass; WCAG-AA contrast audit (lots of low-opacity mono labels); demo + tune the single-vote intro on a real single-party election; safe micro-interactions (hover only, never opacity-hide) | If Verdure is the template you'll actually ship — make it production-tight |
| **B. Build template #5** | `docs/design-refs/` still has **Quorum 50** (kiosk-grade, "designed to be used" — the owner's flagship-usability pick), **Editorial Narrative** (cream+oxblood serif), **Atelier 50** (bone+cobalt). Build one the same way (read the ref first!) | If you want the full "5 distinct templates" lineup |
| **C. Reconcile the "4 colour themes" idea** | The original plan was "5 templates × 4 themes", but Verdure shipped as a single fixed moss/cream/terra colourway (not accent-swaps). Decide whether the 4-themes concept still applies and to which templates | If the multi-theme product surface still matters |
| **D. Per-template lock** | hide/remove the voteCTA variant picker so each built-in template just renders its own design (open item from the prior handoff); the Design Library is the browse surface | Editor cleanup |
| **E. Infra / go-live** | owner's, NOT code — rotate burned secrets, cron backups, rehearse restore, day-of checklist (`docs/PLAN-NEXT-SESSION.md`) | Before the real Feb-2027 election |

My recommendation: **A then B.** Lock Verdure down to ship-quality (it's the one with momentum), then build Quorum next (it's the most election-usable design and a totally different UX, satisfying the "as different as possible" goal).

---

## 5. KEY FILE MAP
```
Theme/register: components/admin/editor/templates/builtIn/verdure.js (+ index.js + templateEngine.js TEMPLATE_INFOS)
Chrome+meta:    components/home/VerdureChrome.js  (edge/cornermark/dock/base CSS + verdureMeta + toArabic)
Home seam:      components/home/HomeRenderer.js (slug → VerdureHome)
Page seams:     app/{vote,results,party,candidates,success,closed,login}/page.js  (isVerdure dispatch)
Fonts:          app/layout.js  (DM_Serif_Display/Manrope/IBM_Plex_Sans_Thai/Space_Mono)
Editor preview: components/admin/{Vote,Results,Candidates,Closed,Success}EditorPreview.js + PageDesignTab.js
Auth-free preview: app/template-preview/page.js  (?slug=verdure&page=…&variant=…)
Design refs:    docs/design-refs/Verdure 50.html + verdure.css (+ CHAT-INTENT.md + TEMPLATE-LINEUP.md)
Image compress: lib/imageOptimize.js (sharp) ← used by api/admin/candidates/route.js
```

## 6. FIRST MOVES (next session)
1. Read `CLAUDE.md`, this file, then `docs/design-refs/CHAT-INTENT.md` + `TEMPLATE-LINEUP.md`, then memory (`verdure-template`, `feedback-no-js-hidden-content`, `feedback-keep-server-running`).
2. Start dev via the preview tool on 3000 (don't stop it). Open `http://localhost:3000/fms-ovs`.
3. Build+smoke gate (§3), then commit Verdure atomically.
4. Pick a direction from §4 (recommend A → B) and confirm with the owner before a big build.
