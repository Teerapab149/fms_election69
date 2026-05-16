# DIAGNOSE_BLOCKS_ROUND2.md — Block Components Data Shape Inspection

## READ FIRST
Read `CLAUDE.md` first.

## TASK
Diagnose only — DO NOT modify any file. DO NOT write any code. Only read and report.

## CONTEXT
Goal: replace editor-mode mock blocks (in HomeContent.js editorBlocks object) 
with their real production components. Need to know exactly what data each 
real block expects so we can seed it properly in editor mode.

## FILES TO READ

1. `src/components/blocks/StatsBlock.js`
2. `src/components/blocks/VoteCTABlock.js`
3. `src/components/blocks/MeetCandidatesBlock.js`
4. `src/components/blocks/ElectionBannerBlock.js`
5. `src/components/MeetCandidatesCard.js` (referenced by MeetCandidatesBlock)
6. `src/components/HomeContent.js` (only the renderColumn + blockData parts, ~lines 145-280)
7. `src/utils/editorDummyData.js` (existing dummy data we have)
8. `src/components/blocks/HeroBlock.js` (reference — already works in both modes)

## REPORT FORMAT

For each of the 4 blocks below, answer ALL questions in this exact structure:

---

### Block: [BlockName]

**File path:** `src/components/blocks/[BlockName].js`

**Component signature:**
```js
export default function [BlockName]({ ... })
```
(show full destructured props)

**Required `config` keys (with defaults):**
- `key1` (default: `xxx`) — purpose
- `key2` (default: `xxx`) — purpose
- ...

**Required `data` keys:**
- `data.field1` — type, where it comes from in production
- `data.field2.subfield` — type, source
- ...

**External fetches inside the component:**
- Does it call any API? (fetch, useSWR, useQuery, useEffect+fetch)
- Does it use any hook that fetches? (useSession?)
- List each fetch call with URL + when it triggers

**Image / asset references:**
- Hardcoded image paths (e.g. `/banner.jpg`, `/team.png`)
- URLs from `data` (e.g. `data.party.logoUrl`)
- Fallback if image missing?

**Conditional rendering:**
- What conditions hide/show different parts?
- States detected (if any) — like ENDED / ACTIVE / WAITING

**State-aware behavior:**
- Does it use `resolvedConfig` from H-2?
- Does it have `forceState` from H-3.5?
- Should it support either in editor mode?

---

## SPECIAL INVESTIGATION

### Question A: HomeContent blockData
In HomeContent.js around line 150, find where `blockData` is built:
```js
const blockData = { session, isVotedReal, isCheckingVoted, initialData, stats };
```

For each field:
- Where does it come from? (props / hooks / API)
- What is its shape?
- Is it available in editor mode currently?

### Question B: Stats data shape
StatsBlock reads `data.stats.???`. What exact keys does it read?
- `data.stats.totalVoted`?
- `data.stats.totalEligible`?
- `data.stats.percentageVoted`?
- Other?

### Question C: MeetCandidatesBlock data
Does MeetCandidatesBlock or MeetCandidatesCard fetch parties from an API?
Or does it use `data.parties` already in props?
What field names? What shape?

### Question D: ElectionBannerBlock images
- Where do the image URL(s) come from?
- Hardcoded path? `/public/...`?
- From `data`? (`data.bannerImage`?)
- From a config like `config.imageUrl`?
- What does it look like if URL is missing?

### Question E: Existing DUMMY_ELECTION
Open `src/utils/editorDummyData.js`. List every field in `DUMMY_ELECTION`.
Compare against what the 4 real blocks need:
- What's already in DUMMY_ELECTION that we can reuse?
- What's missing that we'd need to add?

### Question F: Editor data shape gap
HomeContent in editor mode currently passes `editorData = DUMMY_ELECTION` 
but mock blocks read from it directly (e.g. `ed.totalVoted`). 

If we replace mocks with real blocks, we need to transform `editorData` 
into the shape blocks expect (`blockData.stats.totalVoted` etc.).

Map every field:
| Mock reads | Real block reads | Transformation needed |
|------------|------------------|----------------------|
| ed.totalVoted | data.stats.totalVoted | blockData.stats.totalVoted = editorData.totalVoted |
| ... | ... | ... |

## DO NOT

- DO NOT modify any file
- DO NOT suggest fixes
- DO NOT write code
- ONLY report findings

Return your full diagnosis.
