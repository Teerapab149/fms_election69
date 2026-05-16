# DIAGNOSE_SUCCESS_PAGE_REAL.md

## READ FIRST
Read `CLAUDE.md` first.

## TASK
Diagnose only — DO NOT modify. Read full SuccessPage to understand structure.

## CONTEXT
Previous fix attempt (H-SUCCESS-FIX) created a generic SuccessEditorPreview 
that doesn't match production. User showed real /success has:

- ✅ Green check + "บันทึกคะแนนสำเร็จ!"
- ✅ Subtitle "ขอบคุณที่ร่วมเป็นส่วนหนึ่งในการขับเคลื่อนกิจกรรมนักศึกษาคณะวิทยาการจัดการ"
- ✅ Activity card with megaphone icon + "รับทรานสคริปต์กิจกรรม"
- ✅ Sub-text "กรุณาทำแบบประเมินให้ครบถ้วน"
- ✅ Tags: "ชั่วโมงกิจกรรม 2 ชม." + "ประเภทเลือกเข้าร่วม"
- ✅ Lock state: "ปลดล็อคหน้าสรุปผลคะแนนเสียง"
- ✅ Primary button: "เปิดแบบประเมิน (คลิกที่นี่) →" (dark, with bullet dot)
- ✅ Locked secondary: "ล็อค: กรุณาทำแบบประเมินก่อน"
- ✅ "กลับหน้าหลัก" link
- Modal opens with Google Form embed when clicking primary button

This is a multi-state page with lock/unlock logic. Need to understand the 
full layout before recreating it as a static editor preview.

## INVESTIGATION

### Section 1: Full SuccessPage source

Read `src/app/success/page.js` end-to-end. Show:

1. Function signature + all hooks declared (useState, useEffect, etc.)
2. State variables — what does each track?
3. Render output — every JSX block

### Section 2: State variants

Identify the visual states the page can be in:

- Initial (haven't filled form?)
- Locked (form not submitted?)
- Unlocked (form submitted?)
- Pending (loading?)

For each state, what's shown? What's hidden? What's enabled/disabled?

### Section 3: Form integration

How does the page handle the form?
- Is it a Google Form URL stored somewhere?
- Modal vs new tab?
- How does it detect form submission completion?
- What unlocks "ดูผลคะแนน" / "ผลสรุปคะแนนเสียง"?

### Section 4: Configuration sources

Look for hardcoded vs configurable:
- Activity hours (2 ชม.)
- Activity type (เลือกเข้าร่วม)
- Form URL
- All Thai text labels

Are any of these from globalConfig? From electionConfig? From DB?

### Section 5: Routes / API calls

What API endpoints does SuccessPage call?
- /api/check-status?
- Form submission endpoint?
- Any others?

### Section 6: Lock mechanism

Show the code that determines `isUnlocked` (or similar). What flips it?

### Section 7: Button hierarchy

In production, the page has visible elements. List them in render order:
1. ___
2. ___
3. ___
...

### Section 8: Activity card details

The "รับทรานสคริปต์กิจกรรม" card — show its full JSX.
- Icon (megaphone)
- Title styling
- Subtitle styling
- Pink/red badge styling for chips
- Lock badge styling

## OUTPUT FORMAT

```
=== Section 1: Full source ===
[show full file or relevant excerpts with line numbers]

=== Section 2: State variants ===
State 1: [name] — [conditions] — [renders what]
State 2: ...

=== Section 3: Form integration ===
Storage: ___
Trigger: ___
Detection: ___

=== Section 4: Config sources ===
Hardcoded: [list]
From globalConfig: [list]
From DB/electionConfig: [list]

=== Section 5: API calls ===
[list]

=== Section 6: Lock mechanism ===
[code]

=== Section 7: Render order ===
[list]

=== Section 8: Activity card JSX ===
[code]
```

## DO NOT
- DO NOT modify
- ONLY read and report
