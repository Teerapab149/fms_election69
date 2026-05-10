# DIAGNOSE_H7A_FIX.md — Results Page Real Structure + Global Config Audit

## READ FIRST
Read `CLAUDE.md` first.

## TASK
Diagnose only — DO NOT modify any file. DO NOT write code. Only read and report.

## CONTEXT
After H-7a, the admin Results page editor preview has gaps:
1. Missing Navbar + Footer
2. Stats summary cards rendered as mock JSX (violates "no dummy component" rule)
3. Missing demographics panels (สาขา / ชั้นปี / เพศ)
4. "SAMO 49" hardcoded in many places — needs to become a global config

We need to know the EXACT real structure of Results page + audit all hardcoded
"SAMO 49" / election title strings.

## FILES TO READ

### Part A: Results page structure
1. `src/app/results/page.js` (full file — list every JSX section)
2. Any components imported by results page that we haven't audited yet

### Part B: Global title audit
3. `src/components/Navbar.js`
4. `src/components/HomeContent.js`
5. `src/components/blocks/HeroBlock.js`
6. `src/app/results/page.js`
7. `src/app/candidates/page.js`
8. `src/app/closed/page.js`
9. `src/app/login/page.js`
10. `src/app/success/page.js`
11. `src/app/vote/page.js`
12. `src/app/party/page.js`
13. `src/components/MeetCandidatesCard.js`
14. `src/utils/electionConfig.js`
15. `prisma/schema.prisma` (only the SystemConfig model)

### Part C: ResultsEditorPreview current state
16. `src/components/admin/ResultsEditorPreview.js` (after H-7a)

## REPORT IN THIS EXACT STRUCTURE

---

## SECTION A — Results Page Real Structure

### A.1: Full JSX section breakdown

For `src/app/results/page.js`, list EVERY top-level visual section in render order.
For each section report:
- Section name (descriptive)
- Component used (real component name OR inline JSX)
- Line range
- Conditional rendering (if any)
- Whether it uses real component or inline

Example format:
```
1. Navbar — <Navbar /> component, line 357
2. Page header — inline JSX, lines 360-380
   "ผลการเลือกตั้ง SAMO 49" + subtitle
3. Stats summary cards — inline JSX, lines 382-420
   3 cards: "คะแนนเสียงรวม" / "ผู้มีสิทธิ์" / "ร้อยละ"
4. ...
N. Footer — inline JSX, lines XXX-YYY
```

Continue until end of file.

### A.2: Stats summary cards detail

Find the 3 stats cards (คะแนนเสียงรวม / ผู้มีสิทธิ์ / ร้อยละ) in results page.
- Are they a reusable component (e.g. <StatsBlock>)?
- Or inline JSX?
- Show the JSX structure
- What variables drive the numbers? (totalVotes, candidates.length, etc.)

### A.3: Demographics / chart panels

If results page has demographic breakdown panels (แยกตามสาขา / ชั้นปี / เพศ):
- What component renders them?
- File path
- Conditional rendering (only when `isRevealed`?)
- Data source

### A.4: ResultCard list rendering

- How is the grid laid out? (className)
- Is it inside a wrapper section?
- What heading is above it?

### A.5: Footer in Results page

- Inline JSX or separate component?
- Show the JSX

### A.6: Other components rendered

List any other components rendered by results page that we haven't touched
(modals, tooltips, banners, error states).

---

## SECTION B — Global "SAMO 49" / Election Title Audit

### B.1: Hardcoded occurrences

Search every file in the codebase for:
- `"SAMO 49"`
- `"SAMO"`  
- `49` (only when it appears as a year/election number, not as random number)
- `"โครงการเลือกตั้ง"` (election project title)
- `"คณะกรรมการบริหาร"` (committee title)
- `"สโมสรนักศึกษา"` (student union)
- `"ปีการศึกษา 2569"` (academic year hardcoded)

Report in this table format:

| File | Line | Exact string | Context |
|------|------|--------------|---------|
| ... | ... | ... | ... |

### B.2: Existing config sources

Check these locations for any existing election title/year config:
- `src/utils/electionConfig.js` — what fields exist?
- `prisma/schema.prisma` `SystemConfig` model — what fields exist?
- Any other config file

Show the full content of:
- `electionConfig.js`
- `SystemConfig` model in schema

### B.3: How HeroBlock currently gets the title

After H1-H6 work, HeroBlock receives data via props or direct import?
- Trace where "SAMO 49" comes from in Hero
- Is it a static string or computed/fetched?

### B.4: ELECTION_YEAR usage

ELECTION_YEAR was discussed earlier (used in countdown's "SEE YOU 2027").
- Where is it imported from?
- What format? ("2027" string vs 2027 number)
- Other places it's used

---

## SECTION C — Global Config Strategy Recommendation

Based on findings, recommend:

### C.1: What fields should be globalConfig

Suggest a `globalConfig` shape that covers all the hardcoded strings found:
```js
{
  electionName: "SAMO 49",       // or split into prefix + number?
  electionYear: 2569,
  campaignTitle: "โครงการเลือกตั้งคณะกรรมการบริหาร",
  organizationName: "สโมสรนักศึกษาคณะวิทยาการจัดการ",
  facultyName: "FMS PSU",
  // etc.
}
```

### C.2: Storage location

Where should this live?
- New table in Prisma?
- Add to `SystemConfig.pageLayout` JSON?
- New `globalConfig` JSON field?

Recommend with pros/cons.

### C.3: How components should consume it

- Pass as prop from each page?
- React Context provider?
- Direct fetch in each component?

Recommend the cleanest pattern.

### C.4: Editor UI

Where should admin edit this?
- New tab in admin panel? "ตั้งค่าทั่วไป"
- Embed in existing "ออกแบบหน้าเว็บ" tab?
- Separate "Global Config" section

---

## SECTION D — Recommendations for fixing H-7a

Based on findings, recommend how to fix the H-7a gaps:

### D.1: Add Navbar to ResultsEditorPreview
- Just import and render `<Navbar />`?
- Any concerns about session in editor mode?

### D.2: Replace mock stats cards with real component
- Use real `<StatsBlock />`?
- Or extract a separate `<ResultsSummary />` component?

### D.3: Add demographics panels
- Real component name?
- How to provide demo data?

### D.4: Add Footer
- If it's inline JSX in results page, recommend extracting to component first?
- Or duplicate the JSX in editor preview?

---

## DO NOT
- DO NOT modify any file
- DO NOT write code
- DO NOT install anything
- ONLY read and report

Return your full diagnosis report.
