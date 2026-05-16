# DIAGNOSE_CANDIDATES_CRASH.md

## READ FIRST
Read `CLAUDE.md` first.

## TASK
Diagnose only — DO NOT modify files.

## ERROR
```
TypeError: Cannot read properties of null (reading 'startsWith')
src/utils/basePath.js (10:28) @ startsWith

const cleanPath = path.startsWith('/') ? path : `/${path}`;
                       ^
```

When admin clicks "รายชื่อผู้สมัคร" tab in PageDesignTab.

## INVESTIGATION

### Section 1: basePath.js
Read `src/utils/basePath.js`. Show full content.

Specifically: does `getPath` handle null/undefined input gracefully? Or does 
it crash on first call with non-string?

### Section 2: getPath callers in candidates render path
Find all `getPath` calls in:
- `src/app/candidates/page.js`
- `src/components/admin/CandidatesEditorPreview.js`
- Any PartyCard component

For each, show line + what's passed to getPath. Is anything potentially null?

### Section 3: CandidatesPage in editorMode
Read `src/app/candidates/page.js`. When `editorMode === true`:
- Does it skip API fetches? Or still try to fetch?
- Does PartyCard get called with party.id that might be null/undefined?
- Are there `Link href={getPath(...)}` patterns that could receive bad input?

Show the editorMode handling logic.

### Section 4: DUMMY_PARTIES_MULTI shape
Read `src/utils/editorDummyData.js`. Show DUMMY_PARTIES_MULTI structure.
- Each party has `id`? `number`? `logoUrl`?
- Are any fields `null` that downstream code expects to be string?

### Section 5: PartyCard component
Find PartyCard (likely inline in candidates/page.js around line 227).
Show full PartyCard code.

Specifically:
- Where does it use party.id, party.number, party.logoUrl, party.galleryUrl?
- Any `getPath(party.X)` that could pass null?
- Any `Link href={getPath(...)}`?

### Section 6: Stack trace continuation
The error trace stops at basePath.js:10. The Call Stack panel says "Show 
collapsed frames" — find what calls getPath with null.

Likely candidates:
- `<Link href={getPath(\`/party?id=${party.id}\`)}>` — if party.id is null
- `<img src={getPath(\`/api/gallery?id=${party.id}\`)}>` — same
- `getPath(party.logoUrl)` — if logoUrl is null

Inspect each suspect.

### Section 7: editorCandidates pass-through
In CandidatesEditorPreview, what does it pass as candidates prop?
What does CandidatesPage do with it in editorMode?

Show the data flow from CandidatesEditorPreview → CandidatesPage → PartyCard.

## OUTPUT FORMAT

```
=== Section 1: basePath.js ===
[full content]

Vulnerable to null input: yes/no
Recommended fix: [...]

=== Section 2: getPath callers ===
[list with line numbers]

=== Section 3: editorMode handling ===
[code]

=== Section 4: Dummy data ===
[shape + null fields]

=== Section 5: PartyCard ===
[code]

=== Section 6: Likely null-passing call ===
File:line — passed value: ___

=== Section 7: Data flow ===
CandidatesEditorPreview passes: ___
CandidatesPage uses as: ___
PartyCard receives: ___

=== Root cause ===
[1-2 sentences]

=== Recommended fix ===
[1-2 lines, smallest change]
```

## DO NOT
- DO NOT modify any file
- ONLY read and report
