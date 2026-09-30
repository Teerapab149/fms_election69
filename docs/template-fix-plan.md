# Template fix plan — keep each look, make it fit an election

Owner's direction (2026-09-30): every remaining template keeps its current look.
Fix what is wrong so it suits an election system, the way Verdure was fixed.
Redesign a part only when fixing it cannot make it good.

Reviewed at 1383×914 in template-preview, one pass per template (home top to
bottom, then candidates / vote / results where noted). Mobile not yet checked.

## Problems every template shares

| # | Problem | Where | Why it matters |
|---|---|---|---|
| S1 | **Status contradicts itself.** "ปิดหีบแล้ว" beside a live "เข้าสู่ระบบเพื่อลงคะแนน" button; Gumroad results say "POLLS OPEN SOON" for a date already past; Studio Dark shows "POLLS OPEN" and "POLLS CLOSED" on one screen. | Receipt, Gumroad, Blossom, Original, Studio Dark, FMS Official | Only Verdure (and Ballot) read the one shared status (`useElectionStatus`). The rest work it out from the dates, some also from the system mode, not consistently — so when an admin forces OPEN, the page gives two answers. On election day this is the worst possible bug. |
| S2 | **No "how to vote" steps on the home page.** | all except Verdure, Ballot | The owner wants the site to teach the steps (today the club does it on Instagram). |
| S3 | **Countdown to an invented next election** ("เจอกันปีหน้า 344 วัน", "SEE YOU 2027 344d") after polls close. | Receipt, Original | Counts to a date no one set; after closing the useful next step is the results. |
| S4 | **Thai headlines break mid-name** ("สโมสรนักศึกษาคณะ / วิทยาการจัดการ"). | Receipt, Blossom | Fixed in Ballot with the shared phrase splitter; not applied here. |
| S5 | **English where a Thai student needs Thai**: nav and buttons ("Meet Candidates", "Returns", "SIGN IN", "VIEW PROFILE"), an English tagline as the second headline (Studio Dark), tiny English mono labels everywhere (Receipt). | Gumroad, Studio Dark, Receipt, Original | Actions and navigation must be understood at a glance. Decorative English can stay small if it never carries meaning alone. |

## Per template

**Receipt** — notebook, receipt and poster on a desk. Strong identity; keep.
- S1, S3 (countdown "เจอกันปีหน้า"), S4 (headline is the org name, breaks mid-name).
- Candidates: the two party cards overlap each other and the big "1" "2" numerals.
- English mono labels are tiny and low-contrast ("ORDER · No. SAMO 50 · 02").

**Gumroad** — bold bento, black outlines, neon tiles. Keep.
- S1 on every page (home: closed; results: "POLLS OPEN SOON").
- S5: bilingual doubled labels ("เข้าสู่ระบบ / SIGN IN", "342 คน · VOTERS"), English nav.
- Constant ticker marquee across the top — keep, but stop it for reduced-motion users.

**Blossom** — pink editorial, rotating seal. Keep.
- S1 ("ปิดโหวตแล้ว" band with a vote button above), S4.
- Results: the page title "ผลคะแนน" is hollow outlined text — hard to read.

**Original** — purple bento with countdown pill. Keep.
- S1, S3 ("SEE YOU 2027" counting 344 days), S5 ("Meet Candidates", "Sign In").

**Studio Dark** — dark editorial with a left rail. Keep.
- S1 inside one screen, S5 (English tagline as a headline, English nav: Candidates / Vote / Returns).
- Small grey text on near-black is low contrast.

**FMS Official** — formal purple band, card hero. Ballot grew out of it; owner said keep it for now.
- S1, poster shown full width (same issue fixed in Ballot step 4).

## Plan

**Correction (2026-09-30).** Two S1 observations above came from the preview, not
the site. `template-preview` feeds v2 families a consistent phase (`?variant=
before|open|paused|ended`, dates placed around now), but every v1 family gets
`systemMode: AUTO, electionStatus: ONGOING`, no `isSystemOpen`, and the REAL
dates from the database. Gumroad's "opens soon" was correct: the owner had moved
the dates to tomorrow. So nothing about S1 is concluded until it is re-checked
with states the live site can actually produce.

**Phase 0 — correctness, no visual change (one commit per step)**
0. **Make the preview tell the truth first.** Give every family the same phase
   data v2 gets, built exactly the way `app/page.js` builds it on the live site
   (systemMode + isSystemOpen + electionStatus from mode and dates), plus the
   admin-forced cases. Without this every later check is guesswork.
1. **Audit before fixing.** For each family, record what the home (and any
   status in the header/rail/nav) shows in each case the live site can produce:

   | case | mode | dates | what a student should see |
   |---|---|---|---|
   | A | AUTO | before start | "เปิดในอีก …", countdown to opening, no vote button |
   | B | AUTO | between | "เปิดอยู่ ปิดเวลา …", countdown to closing, sign in / vote |
   | C | AUTO | after end | "ปิดแล้ว", results link, no countdown |
   | D | OPEN (forced) | before start | open, as B — the admin opened early |
   | E | OPEN (forced) | after end | open, as B, no negative/next-year countdown |
   | F | PAUSE | any | "หยุดชั่วคราว", no vote button |
   | G | ENDED (forced) | any | as C |

   each also signed out / signed in / already voted. Only what fails here is a
   bug; only those get fixed.
2. **Fix what failed** by reading status from the shared `useElectionStatus`
   (as Verdure and Ballot do) instead of each component working it out. Keep
   each template's own words and look. Re-run the whole table after.
3. **S3** falls out of step 2 — the shared status never counts to a next year —
   but check each template's closed state still has something useful (closing
   time, results link).
4. **S4:** apply `shared/text/thaiPhrases` to headlines that print an org or
   campaign name, one template at a time, checked at 1383 / 768 / 375 / 320.

Other pages that show status (closed, vote gate, results) are checked in the
same table; the live route logic for them is already shared, so they are
expected to pass — verified, not assumed.

**Phase 1 — one template at a time, in this order:** Receipt → Gumroad → Blossom → Original → Studio Dark → FMS Official.
For each: home (add the steps section in that template's own style, S2), then candidates / party / vote / success / results / closed / login, then a mobile pass (375 and 320). Fix S5 and the template's own items. Show the owner before committing; one commit per template.

**Rules kept throughout:** no hardcoded settings text, FMS logo in every header, loopless Thai for UI, "หีบออนไลน์", sample ballots stamped "ตัวอย่าง", no Thai digits, reduced motion respected.

## Owner decisions (2026-09-30)

- Phase 0 first, carefully: think it through as the builder AND as a student
  using it; verify rather than assume.
- Language: navigation and buttons in Thai. Some students are international
  (a small group) and must still be able to use it — so key navigation and the
  primary action carry a small English line under the Thai (one convention
  across all templates); everything else Thai, with English only as small
  decoration that never carries meaning alone.
- Steps section: yes, every template, drawn in its own style, following that
  template's actual voting flow — check each flow for real, not by assumption.
- FMS Official: leave it as it is (the faculty's formal template). Ballot is
  the successor of Original.

## Questions for the owner (answered above)

1. Phase 0 first, across all templates at once? (recommended — S1 is a correctness bug)
2. S5: make all navigation and buttons Thai, keeping English only as small decoration? Or keep the bilingual labels where they are part of a template's look?
3. S2: a steps section on every home, each in its own style — yes for all six?
4. FMS Official: fix it too, or leave it since Ballot replaces it?

## Progress log (overnight 2026-09-30 → 10-01, nothing committed — owner reviews)

Rules held: no commits, no deploys, no settings/DB changes, FMS Official not
touched on purpose, and no edits to files that carry another session's
uncommitted work (QA contrast fixes dated 2026-09-25: BlossomHome, BlossomTheme,
StudioDarkHome, StudioDarkRail, OriginalCountdownTimer, VerdureChrome,
FmsOfficialChrome, several vote/* files, blossom/studioDark palettes). Fixes
those files need are listed as BLOCKED below instead.

### Step 0 — the preview tells the truth
- `lib/election/systemStatus.mjs` — `liveSystemStatus`, the mode+schedule →
  {isSystemOpen, electionStatus} step, moved out of `app/page.js` (which now
  calls it). Test proves identical answers for 5 modes × 5 moments.
- `app/template-preview` — every family gets `?variant=before|far|open|after|
  early|overtime|paused|ended` built with that same function, plus the
  `systemConfig` block; v1 families get the dates swapped through a nested
  read-only settings provider. No variant: v1 = real schedule judged as AUTO.

### Step 1 — audit findings (real, re-checked with truthful states)
- The earlier "closed + vote button" screenshots were preview artefacts.
- Real bugs found:
  1. Shared button text vs click disagreed (three separate ladders: the
     resolver for the TEXT, each button style for the CLICK, the countdown).
     Before opening: text "ระบบปิดลงคะแนน / CLOSED", click = sign-in.
     After closing (AUTO): text "not open yet"/"closed", click = results.
  2. Gumroad countdown froze at 00:00:00:00 when the admin kept the polls
     open past the scheduled end.
  3. Blossom countdown shows "VOTING CLOSED" in that same forced-open-late case
     (BLOCKED — BlossomHome has another session's changes).
  4. Receipt and Original count down ~364 days to an invented next election
     after closing (S3).
  5. v2 (Ballot, Verdure via useElectionStatus): a page left open across the
     opening or closing time kept the old phase until reloaded — "not open"
     with the button disabled after opening, "open, sign in" after closing.

### Step 2 — fixes (uncommitted)
- `lib/election/electionStatus.mjs`
  - `voteCtaState()` — ONE ladder for the v1 vote button, used by
    `stateResolver.voteCTA` (text) and the three button styles (click/look).
    Before opening the button stays a sign-in on purpose (Original's
    documented choice: v1 homes never re-judge status, a frozen "not open"
    button would stay frozen after opening). After closing → "ended".
  - AUTO phase now moves forward with the clock (before→open→ended), never
    backward; forced modes untouched. Tested.
- `elements/voteCTA-button/{default,chunky-stamp,minimal-pill}.jsx` → use it.
- Ended button text (classic config, element default, default.jsx):
  "อยู่นอกระยะเวลาเลือกตั้ง / Ended" → "ดูผลคะแนน / Results" (it links there).
- `elements/hero-countdown/gumroad.jsx` — forced open late says
  "เปิดรับลงคะแนนอยู่" instead of four zeros.
- Verified in the browser: Gumroad after / before / overtime.
- Receipt S3: the "เจอกันปีหน้า" ~364-day countdown removed; the ended sheet
  keeps the election date, the red stamp and the close time, and the hero
  button already reads "ดูผลคะแนนอย่างเป็นทางการ". Checked 1383 / 768 / 375.
- Blossom and Studio Dark after-close buttons now go to results — through the
  shared fix, their own (blocked) files untouched. Verified.
- Original: its inline ladder was already consistent; ended text → "ดูผลคะแนน
  / Results" (OriginalHome is clean).
- Ballot + Verdure regression: before / after / overtime all correct.

### Step 4 — Thai line breaks (uncommitted)
- `components/v2/shared/text/thaiPhrases.mjs` re-created (it went away with
  the นักศึกษา revert) WITHOUT the นักศึกษา rule, plus "before เพื่อ" for
  button labels. Ballot keeps its own copy untouched. Tests: 4 pass.
- Receipt: headline "สโมสรนักศึกษา / คณะวิทยาการจัดการ", subtitle
  "โครงการเลือกตั้ง / คณะกรรมการบริหาร", button "เข้าสู่ระบบ / เพื่อลงคะแนน" —
  broken mid-word at 320 before. No gap inside the button when it fits.
- Blossom's headline already splits on คณะ by design — no change needed.

### Unblocked 2026-10-01 — owner kept the QA session's work (1e6fa24)
Reviewed file by file: measured contrast and tap-target fixes, kept. The
Verdure phone member photo crop now holds near the top (object-position
50% 22%) so faces aren't cut through. backups/ (real student data) ignored.
Uploaded images in public/images and AGENTS.md left untracked on purpose.

Owner also decided: Original stays and gets the new features; Receipt's
"ต้นขั้ว" goes.

- Receipt success: "ต้นขั้ว · STUB No." → "เลขอ้างอิง · REF No." (fits the
  150px stub).
- Original countdown: no more "SEE YOU 2027" (counted to a date nobody set);
  paused / closed / forced-open-late show one Thai line instead of
  00:00:00:00. All 7 cases checked in the preview.
- Original: "วิธีลงคะแนน" steps in its own card language (white 24px cards,
  brand gradient number, lucide icon), from its real flow. Nav Thai-first:
  หน้าแรก / ผลคะแนน / ผู้สมัคร / เข้าสู่ระบบ, each with a small English line
  ("Meet Candidates" was English only). No overflow 320 → 1440.
- Studio Dark rail: "POLLS CLOSED 00 00 00 00" → a Thai line for paused /
  closed / open-late. Nav Thai-first with the English as the small line, on
  the desktop rail and the phone pills; pills fit at 360 and 320 (padding
  trimmed ≤340px), 45px tall.
- Studio Dark results: "ทันทีเมื่อปิดโหวต" ×3 → when the committee
  announces; the bare countdown now says เปิดโหวตใน / ปิดโหวตใน, and after
  closing "ปิดโหวตแล้ว · รอประกาศผล" (pill: CLOSED · รอประกาศผล).
- Studio Dark home: steps in the numbers panel's material (ruled frame,
  serif-italic accent numerals). 4 → 2 → 1 columns at 1100 / 560.
- Blossom: forced-open-late said "VOTING CLOSED" → "เปิดรับลงคะแนนอยู่ ·
  VOTING OPEN" (no results link, no close date). After closing,
  "ดูผลได้ที่หน้าผลการเลือกตั้ง" → "รอคณะกรรมการประกาศผล".
- Blossom home: steps as a contents page (ink rule, indexed rows, one candy
  ink per step), 2 columns ≥900. Step numbers 5.07–6.39 : 1 and English
  labels 4.80–4.84 : 1 on all 4 themes.
- Not changed: components/CountdownTimer.js has the same next-year countdown
  but only renders for a template with no layout of its own (HomeContent
  fallback) — none of the built-in ones.

### Phase 1 — Receipt (uncommitted)
- Home: "วิธีลงคะแนน" — one long narrow receipt under the desk (the turnout
  slip's paper/head/ref/die-cut end): 4 line items from this template's real
  flow (เข้าสู่ระบบ · ทำเครื่องหมายบนบัตร · หย่อนบัตร · รับใบยืนยันการใช้สิทธิ์,
  words taken from its own vote/success pages), English tag at right (hidden
  ≤420px), results as the "total" line with a link. Voting only: the form
  step stays on the success page (googleFormUrl may not reach the public
  settings context, so the home cannot know if there is a form).
  Checked 1383 / 375, themes receipt / teal / carbon.
- Party page: party name breaks only between its own words.
- Long-phrase guard: a phrase >18 chars (one long word) may wrap rather than
  overflow (shared LONG_PHRASE).
- Candidates: the "overlapping cards" from the first audit was a misreading of
  a tiny screenshot — at full size only the deliberate desk layering overlaps.
- Overflow sweep: all 7 pages at 320 / 375 / 768 — none.
- Nav is already Thai (หน้าแรก · ผู้สมัคร · ผลคะแนน · เข้าสู่ระบบ); the English
  mono tags are small decoration paired with Thai — left as they are.
- Question for owner: the success page still says "ต้นขั้ว · STUB NO." —
  the owner called that word old-fashioned in Ballot. Here it is the receipt
  metaphor itself; left unchanged until the owner decides.

### Phase 1 — Gumroad (uncommitted)
- Nav (desktop pills + mobile drawer): "Meet Candidates" alone among Thai →
  ผู้สมัคร / ผลคะแนน / หน้าแรก with a small English line (owner's rule).
- Home: "โหวตง่าย ๆ ใน 4 ขั้นตอน" — four chunky bento tiles in the mosaic's
  own material (pink / lime / sky / yellow, ink outline, hard shadow, Archivo
  numbers), words from its own ballot/done pages. 4 → 2 → 1 columns at
  980 / 560. Title contrast measured on all 6 colour themes: 6.2–17.9 : 1;
  description opacity removed so it keeps full contrast.
- Results "not open yet": the big English "POLLS OPEN SOON" → Thai
  "ยังไม่เปิดโหวต" (English moved to the small kicker), and the deck no
  longer promises results "แบบเรียลไทม์เมื่อเปิดหีบ" — false: the tally is
  hidden until revealed.

### Cross-template copy fix — when results appear (uncommitted)
Every template told students the results appear "(ทันที)เมื่อปิดโหวต". The
API hides the tally until the admin turns on การแสดงผลคะแนน ("ปิดหีบอย่างเดียว
ยังไม่แสดงผล" — ตั้งค่าระบบ), so after closing and before the reveal the page
contradicted itself. Now "เมื่อคณะกรรมการประกาศผล" in Gumroad (4), Blossom (3),
Receipt (3), Verdure (3) results pages. Ballot already said so.
BLOCKED: StudioDarkResults.js (3 places) — another session's changes.

### Cross-template — "VIEW PROFILE" (uncommitted)
The party-card link on the vote page read "VIEW PROFILE" in Gumroad, Studio
Dark and Verdure → "ดูนโยบาย" (it opens the party's policy page). Verdure's
`.vd-opt__more` and Studio Dark's `.sdv-strip__view` were mono, tracked and
uppercase — set for Latin; now the template's Thai face (IBM Plex Sans Thai /
Anuphan), 13px, no tracking. Checked on both vote previews.

### Results page — the two states nobody previewed (uncommitted)
The preview's v1 results pages only showed "sealed while open" and "revealed".
The live page (app/results/page.js) also reaches:
- `?variant=before`: WAITING, isNotStarted, countdown to opening.
- `?variant=after`: polls closed, committee hasn't announced. The live
  countdown has hit zero and reads "เร็วๆ นี้".
Both are added for Gumroad / Studio Dark / Verdure / Blossom / Receipt through
`resultsCase` (spread last), and the interactive results previews now get the
case's dates too (`withPhaseDates`), so Gumroad's "เปิดโหวต วันที่ …" no longer
shows the real, already-past date.

What they showed, and the fixes:
- Verdure after close: "CLOSES IN เร็วๆ นี้" → "ปิดโหวตแล้ว · รอประกาศผล";
  before opening it counted "CLOSES IN" → "OPENS IN"; the chip, kicker and
  cornermark said COUNTING / กำลังนับคะแนน before a single vote → UPCOMING /
  ยังไม่เปิดโหวต; "Embargoed until polls close." → "until announced."
- Verdure at 375px: the countdown ("2 วัน 3 ชม. 20 น." — the live format,
  longer than the preview's old mock) ran past the circle. Label now sits
  above the time; measured inside the disc at 375 and checked at desktop.
- Gumroad: "HIDDEN UNTIL CLOSE" → "HIDDEN UNTIL ANNOUNCED".
- Blossom / Receipt before opening: "ผลการเลือกตั้งจะปรากฏที่นี่เมื่อเริ่มการ
  ลงคะแนน" (false — results never appear when voting starts) → "ผลคะแนนจะแสดง
  ที่นี่ เมื่อคณะกรรมการประกาศผล".
- Blossom / Receipt after close: already correct ("ปิดโหวตแล้ว · รอประกาศผล").
- Studio Dark results: not checked in these states — file BLOCKED (below).

- Verdure at 320px (sweep): the disc's 300px minimum plus its outer dashed
  ring overflowed the page by 30px in every results state. ≤360px now sizes
  it to the viewport (100vw − 64px) and tightens what sits inside; measured
  in the before / after / revealed states — no overflow, contents inside.

### Preview fixes (preview-only, uncommitted)
- Closed page: `?variant=waiting` showed the real (past) date under "not
  open yet" — it now gets the case's dates like home and results.
- Hydration warning on those pages: the case dates came from Date.now() run
  on the server and again in the browser; a minute boundary between the two
  changed the printed time. The preview clock is now on the 10-minute mark.

### Responsive sweep (overflow, iframe at each width)
Gumroad, Verdure, Blossom, Receipt — home, candidates, party, vote, results
(before / after), success, closed at 320 / 375 / 768 / 1024 / 1440: no
horizontal overflow except the Verdure disc above (fixed, re-swept at 320 in
all four results states). Studio Dark not swept — its files are BLOCKED.

### DECISION NEEDED — the 2026-09-25 QA session's uncommitted files
BlossomHome, StudioDarkHome/Rail, OriginalCountdownTimer, VerdureChrome,
StudioDarkResults and others hold small uncommitted contrast fixes from a
QA session five days ago. Until those are committed (or dropped), the home
steps sections for Blossom and Studio Dark, and the blocked fixes above,
cannot be done without mixing two sessions' work in one file.

### How-to-vote reach + Verdure success words (2026-10-01)
Owner asked: keep the steps on the landing page (not a separate page), but
make them findable and drop them when they no longer help.
- `hooks/useHowToVote.js`: one id (`how-to-vote`) for every template, so a
  post can link `…/#how-to-vote`; hidden once the polls have closed (checked
  every minute, so an open page drops it at closing); jumps to it on load when
  the URL carries the hash (most homes render after mount, so the browser's
  own jump found nothing).
- A quiet "วิธีลงคะแนน ↓" link under or beside each hero's main button, in
  each template's own style (Gumroad inked underline, Receipt pencilled
  dashed line + HOW TO VOTE, Blossom text link after its two pills, Studio
  Dark a third ghost link, Original brand underline, Verdure under the pills,
  Ballot under the turnout). 44px tap height everywhere.
- Checked in open / after / overtime on all seven: the section and link
  are there while voting is possible, gone after closing (and still there
  when an admin keeps voting open late).
- Ballot: its "journey" is the whole page under the hero (candidates,
  results link, poster), so after closing only the link goes; the journey
  stays. Its lead section carries the id.
- Verdure success: "SMALL VOICES. SHARED GROWTH." / "จากหนึ่งเสียง สู่การ
  เติบโต" / "ดูแลการเติบโตต่ออีกนิด" / "GROWING, TOGETHER" / corner
  "Together · A shared future" read as if this were not a real vote →
  "YOUR VOTE IS RECORDED." / "ลงคะแนน เรียบร้อยแล้ว" / "เหลืออีกหนึ่ง
  ขั้นตอน" / "ONE STUDENT. ONE VOTE." / "Vote recorded · บันทึกการลงคะแนน
  แล้ว". The plant drawing stays. Same line in the cast animation.
- Owner then asked for the same on the others: Blossom "เขียนบทต่อไปด้วยกัน"
  → "เหลืออีกหนึ่งขั้นตอน", Studio Dark "The next chapter." → "One more step."

### ตั้งค่าระบบ — mode + การแสดงผล (2026-10-01)
Rule, in `lib/election/adminGuards.mjs` (tests: `adminGuards.test.mjs`):
the tally is public only once the box is closed, and a box whose tally is
public never reopens. "Closed" = ENDED, or AUTO past the scheduled end.
- Publishing results while votes can be cast (AUTO in the window, OPEN, PAUSE)
  is refused by the server; the switch is greyed out with the reason.
- While results are shown, OPEN / PAUSE / AUTO-still-in-window are refused;
  the buttons are greyed out and a line says to hide results first.
- TOGGLE_SHOW_RESULT → SET_SHOW_RESULT { value }: a blind flip could invert
  what the admin saw (two screens, a double click). Mode and visibility are
  checked and written under a row lock on SystemConfig.
- /api/results ranked the list by score after closing even when the scores
  were masked, so the raw JSON showed who led before the announcement. It
  now ranks only once results are revealed.
- The mode confirm says what the change does (reopens now, opens at the
  scheduled time, stays closed, …) instead of "change to MANUAL_OPEN?".
- annual-reset.sql now also sets showResult = false and systemMode = 'AUTO'
  and drops last year's certifiedAt/By — before, a new year opened with last
  year's "show results" still on, publishing live scores from the first vote.
- Checked against the local DB, which was in exactly that state (OPEN +
  results shown): publish / pause / bad values all refused, data unchanged.
- Open: OPEN has no end (warn, or close at the scheduled end?); a stepper for
  close → check → publish → certify; "election rounds" instead of the
  yearly delete (see chat 2026-10-01).
- Owner 2026-10-01: OPEN stays open-ended on purpose → written on its card,
  under "Current status" when it is the active mode, and in the confirm:
  "OPEN จะไม่เปลี่ยนเป็น ENDED เอง … ต้องกลับมากด ENDED ด้วยตัวเอง".
- Closing steps (replaces the separate reveal switch and the certify card):
  1 ปิดหีบ (button: ENDED) → 2 ตรวจคะแนนกับ IT (outside the system; the
  scripts are named) → 3 ประกาศผล / ซ่อนผล → 4 รับรองผล. Done / this step /
  waiting per row; a step's button opens only when the previous one is done.
  The publish confirm asks the admin to confirm IT has checked the count.
  The red box now only explains the yearly reset. Checked at 1280 and 375.
- Audit log: written after the command with its outcome ("ok" / "refused
  409" + reason). It was written before the checks, so refused commands
  (e.g. publishing mid-vote) read like ones that happened. The table is
  append-only, so it is one row per command, after the fact.
- Election rounds: dropped (owner). Staff back up and start a fresh database
  every year because the student list changes; the reset script covers it.
- Owner: no IT-check step (last year the committee published straight after
  closing) → removed, and the publish confirm no longer asks about it.
  Certify stays, marked "ไม่บังคับ". Steps are now ปิดหีบ → ประกาศผล →
  รับรองผล (ไม่บังคับ).
- Owner: keep the steps after closing too — they are part of each template's
  look. `useHowToVote` now returns `link` (the "วิธีลงคะแนน ↓" jump link,
  still hidden once closed, since the main button then leads to results);
  the steps section always renders.
- Main button after closing, before results are published: every template
  said "ดูผลคะแนน(อย่างเป็นทางการ) / FINAL RESULTS" and led to a page that
  only said "wait". Now "ปิดหีบแล้ว · รอประกาศผล" (+ AWAITING RESULTS /
  note) until showResult; the configured "results" text once published.
  One rule (`isAwaitingResults` in lib/election/electionStatus) used by
  Blossom, Receipt, Verdure, FMS Official (own maps), Ballot and every v2
  home (useHomeModel), Original (own ladder) and the voteCTA variants
  (Gumroad chunky-stamp, Studio Dark / others minimal-pill, classic default).
  Editor/gallery renders carry no systemConfig and keep the configured text.
  Checked on all 8 in the preview's "after" case and on the live home.
