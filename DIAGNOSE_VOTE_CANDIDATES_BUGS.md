# DIAGNOSE_VOTE_CANDIDATES_BUGS.md

## READ FIRST
Read CLAUDE.md first.

## TASK
Diagnose only — DO NOT modify files.

## TWO RELATED BUGS

### Bug 1: /vote production page has DUPLICATE header text
Production /vote page shows:
```
[badge] ลงคะแนนเสียง
เลือกตั้งสโมสรนักศึกษา       ← from vote/page.js inline JSX
สวัสดี ... โปรดเลือกพรรค     ← from vote/page.js inline JSX

เลือกตั้งสโมสรนักศึกษา       ← DUPLICATE — from MultiPartyView Wrap
คลิกเลือกพรรค...             ← from MultiPartyView
```

Hypothesis: MultiPartyView added EditorElement wraps with header content 
when fixing element IDs in PART 1 of LIVE_STEP_H_3PAGES_PREV. The wraps 
should ONLY render in editorMode, but they render in production too.

OR: MultiPartyView always rendered its own header, and vote/page.js also 
has a header — duplicate exists for a long time in production but no one 
noticed.

### Bug 2: /candidates admin preview shows VOTE page content
Admin preview for "รายชื่อผู้สมัคร" tab renders:
- "เลือกตั้งสโมสรนักศึกษา" title
- 2 party cards with "ดูรายละเอียด" buttons  
- "งดออกเสียง" abstain card

This is VOTE page UI, not candidates page UI. CandidatesPage should show 
party list with "Meet Candidates" / explore-style cards.

Hypothesis: CandidatesEditorPreview is importing the wrong component, OR 
CandidatesPage in editorMode is rendering MultiPartyView for some reason.

## INVESTIGATION

### Section 1: MultiPartyView header rendering

Read `src/components/vote/MultiPartyView.js`. Show:
1. Top of component — what props does it accept
2. The 3 EditorElement wraps around line 71-89 (`vote-header-title`, 
   `vote-header-subtitle`, etc.)
3. Are the wraps conditional on `editorMode`?
4. Or do they render ALWAYS regardless?

If unconditional → both production /vote AND editor preview show them = 
explains Bug 1.

### Section 2: vote/page.js inline header

Read `src/app/vote/page.js`. Show lines around 130-145 (the inline header 
JSX with badge, h1, greeting).

Question: is this inline header ALSO unconditional (renders always)? Or 
only in production mode?

### Section 3: CandidatesEditorPreview

Read `src/components/admin/CandidatesEditorPreview.js`. Show full content.

Check imports — is it importing CandidatesPage? Or accidentally importing 
something else (like VotePage)?

### Section 4: CandidatesPage editorMode

Read `src/app/candidates/page.js`. Show:
1. Top of component (around line 1-50) — props + early-mode handling
2. The render block — what JSX is returned in editorMode

Question: when editorMode={true}, does it render its own party list or 
does it render MultiPartyView?

### Section 5: CandidatesEditorPreview render path trace

Trace what gets rendered when admin opens "รายชื่อผู้สมัคร":

```
PageDesignTab branch 'candidates' →
  <CandidatesEditorPreview ... /> →
    <CandidatesPage editorMode={true} candidates={DUMMY_PARTIES_MULTI} ... /> →
      [returns ???]
```

What does the final returned JSX look like?

### Section 6: Cross-page contamination check

In MultiPartyView and CandidatesPage:
- Are they ever importing each other?
- Is there a chance React component identity mixed up?

Show the imports of:
- src/components/admin/CandidatesEditorPreview.js (top imports)
- src/app/candidates/page.js (top imports)
- src/components/vote/MultiPartyView.js (top imports)

### Section 7: Element registry sections check

Per H-3PAGES-PREV PART 1, MultiPartyView Wraps changed to:
- vote-header-title
- vote-header-subtitle  
- vote-abstain-button (×3)

But the ORIGINAL vote/page.js inline header (badge + h1 + greeting) does 
NOT wrap with EditorElement — those elements exist in registry with IDs 
vote-header-badge, vote-header-title, vote-header-subtitle.

So we now have TWO sources for "vote-header-title":
1. vote/page.js inline h1 (unwrapped, hardcoded text)
2. MultiPartyView <Wrap id="vote-header-title">{...}</Wrap>

When BOTH render → duplicate. Confirm this is the case.

## OUTPUT

For each bug, provide:

```
=== Bug 1: Vote duplicate header ===
Source A (causes first instance): file:line
Source B (causes second instance): file:line  
Why both render: [reason]
Fix approach: [smallest change]

=== Bug 2: Candidates shows vote content ===
Actual component path: PageDesignTab → CandidatesEditorPreview → ???
What ??? renders: [actual JSX]
Why it looks like vote: [reason]
Fix approach: [smallest change]
```

## DO NOT
- DO NOT modify files
- ONLY read and report
