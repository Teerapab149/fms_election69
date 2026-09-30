# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Voters:** undergraduate students of the Faculty of Management Sciences (FMS), Prince of Songkla University. They vote once per year for the SAMO (สโมสรนักศึกษา) executive board, almost always **on their own phone, from anywhere** — between classes, on the way home, whenever they remember. They sign in with PSU Passport (SSO), cast one ballot, and leave.
- **Admins:** the student election committee. They pick the active template, edit election content (dates, parties, members, images) and run the election modes on the day.

## Product Purpose

The faculty's online election for the SAMO executive board. It lets every eligible student learn who is running, cast a secret ballot, see that the ballot was received, and later see the result.

Success is all three at once — trust in the result, turnout, and a memorable experience — but **trust is invisible to the voter, so the design leads with experience**. Turnout cannot be forced; a good experience is how it rises.

## Positioning

A faculty election that people want to open. The system ships several complete templates that all run the same election; the committee picks a different one each year so the election never looks the same twice. Each template is its own world, not a recolour.

## Operating Context

- One election a year, in **February** (next: February 2027, SAMO 50 / academic year 2570).
- Voting window is a single day (e.g. 07:00–22:00). Before it: campaign period, candidates visible. After it: closed, results revealed by the committee.
- Often **one party runs** ("พรรคเดียวที่ลงสมัคร"): the ballot is approve / disapprove (ไม่รับรอง) / abstain (งดออกเสียง). Multi-party ballots are also supported.
- Election modes: `AUTO` (by time), `MANUAL_OPEN`, `PAUSE`, `ENDED`.
- Pages every template must provide: home, candidates, party detail, vote (single + multi), results (locked + revealed), success, closed, login.

## Capabilities and Constraints

- **All templates share one function.** Selection, confirmation, submission, status, results and auth logic are identical across templates; templates differ only in UX/UI.
- Ballots are encrypted and hash-chained; the app never stores who chose what. Design must never imply otherwise.
- Election numbers, years, names and dates come from admin config (`globalConfig`), never hardcoded.
- **No Thai digits** anywhere (owner rule: ห้ามใช้เลขไทย) — Arabic numerals only.
- Existing templates are **kept**. Redesigns are built as **new templates alongside** the current ones; the owner deletes an old one only after approving its replacement.
- Stack is fixed: Next.js App Router, Tailwind v3, Framer Motion, PostgreSQL/Prisma.

## Brand Commitments

- The **FMS faculty logo must be in the navbar/chrome of every page of every template**, so a voter always knows this is the faculty's own site — the templates deliberately look different from the university's central website, so the logo is what anchors them.
- Thai is the primary language; English may appear as secondary/decorative text.
- Faculty purple `#8A2680` is the identity colour of the official templates; design templates may choose their own palettes.

## Evidence on Hand

- Real party data (logos, group photos, member portraits, policies, slogans) entered by admins — layouts must handle missing items gracefully.
- The "เลือกตั้ง" campaign poster image.
- The **Original** template was used in the real election last year and was **well received**.
- No testimonials, statistics claims, or founding history exist; do not invent them (e.g. no computed "EST." year).

## Product Principles

1. **Election first, show second.** The action a voter came for is always the loudest thing on the screen.
2. **Motion tells the election's story.** The ballot intro and the "where did my ballot go" cast animation are the heart of the experience, not decoration — keep them, make them skippable, never let them block a tap.
3. **One truth about status.** Open, closed, paused and countdowns come from one source and never contradict each other on a screen.
4. **Every template is a different world.** Same election, different experience each year.
5. **Phone in one hand.** The decision is reachable without hunting; the primary action sits where a thumb is.
