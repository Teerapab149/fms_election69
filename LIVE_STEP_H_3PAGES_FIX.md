# LIVE_STEP_H_3PAGES_FIX.md — Fix 3 Bugs from H-3PAGES-PREV

## READ FIRST
Read `CLAUDE.md`, `MASTER_PLAN.md`, `DECISIONS.md` (especially P-LOG-001), 
and follow strictly.

## CONTEXT

After H-3PAGES-PREV, three related bugs surfaced. P-LOG-001 in DECISIONS.md 
documents the full root-cause analysis. This step implements the fix.

**Bug A — /vote production has duplicate header text:**
TWO sources render header simultaneously in multi-party mode:
- `vote/page.js` lines 131-142 — inline JSX (badge + h1 + greeting)
- `MultiPartyView.js` lines 70-92 — internal `<Wrap>` blocks

**Bug B — Admin candidates tab "shows vote content":**
Actually a CRASH at `getPath(null)` — PartyCard line 289 passes 
`party.logoUrl` which is null in DUMMY_PARTIES_MULTI. When 
CandidatesEditorPreview fails to render, the previous tab's DOM (vote 
preview) persists, creating illusion of "wrong component."

**Bug C — getPath has no null guard:**
`basePath.js:10` calls `path.startsWith('/')` with no defensive check. 
Future similar bugs will trigger same crash class.

## STRATEGY DECISION

Per P-LOG-001 lesson — **MultiPartyView owns the header**, not vote/page.js. 
This means:
- Remove inline header from `vote/page.js` (production)
- Remove duplicate Wraps from `VoteEditorPreview.js` (admin)
- Keep MultiPartyView's header — it renders in BOTH production and admin

Rationale:
- Single source of truth for header rendering
- Production /vote ALWAYS uses MultiPartyView in multi-party mode
- Admin VoteEditorPreview ALWAYS uses MultiPartyView in multi-mode
- No drift between two header implementations

## SCOPE (DO NOT EXCEED)

Modify exactly 5 files:

1. `src/utils/basePath.js` — add null guard
2. `src/utils/editorDummyData.js` — fix DUMMY_PARTIES logoUrl/groupImageUrl
3. `src/app/vote/page.js` — REMOVE inline header (lines 131-142)
4. `src/components/admin/VoteEditorPreview.js` — REMOVE duplicate Wraps for vote-header-*
5. `src/components/vote/MultiPartyView.js` — VERIFY header is correct (already there per P-LOG-001 — should not need changes, just verify)

Do NOT modify:
- `src/app/candidates/page.js`
- `src/components/admin/CandidatesEditorPreview.js`
- elementRegistry.js
- API routes
- Any other file

Do NOT install packages.

---

## PART 1: Harden getPath() in basePath.js

### File: `src/utils/basePath.js`

Find the existing function (around lines 5-11):

```js
export const getPath = (path) => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/fms-ovs';
    
    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    ...
};
```

### Add null guard at the very top of the function:

```js
export const getPath = (path) => {
    // Null/undefined/non-string guard — return empty string defensively.
    // Logs in dev to surface upstream issues without breaking UX.
    if (path == null || typeof path !== 'string') {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('[getPath] received non-string input:', path, '— returning empty string');
        }
        return '';
    }
    
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/fms-ovs';
    
    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    
    // ... rest unchanged
};
```

CRITICAL:
- Only add the guard at the top
- Don't change anything else in the function
- `console.warn` only fires in dev — production silent
- Empty string `''` makes `<img src="">` benign

---

## PART 2: Fix DUMMY_PARTIES data shape

### File: `src/utils/editorDummyData.js`

### 2.1 Find a placeholder image that exists

Before editing, verify what image assets exist:
```bash
ls public/images/logo/ 2>/dev/null
ls public/images/ 2>/dev/null
```

Use whichever placeholder exists. Diagnosis suggested `/images/logo/fms_logo50_color.png`. 
If that exact path doesn't exist, use any other PNG/JPG in `/public`.

### 2.2 Update DUMMY_PARTIES_MULTI (around lines 86-107)

Replace `logoUrl: null` and `groupImageUrl: null` with the placeholder path 
in BOTH party entries:

```js
{
  id: 1,
  number: 1,
  name: "The Unity Concord Of FMS 2",
  slogan: "หลากเอกลักษณ์ รวมเป็นหนึ่ง สู่ความสำเร็จที่ยั่งยืน",
  logoUrl: "/images/logo/fms_logo50_color.png",       // was null
  groupImageUrl: "/images/logo/fms_logo50_color.png", // was null
  voteCount: 245,
  color: "#8A2680"
},
{
  id: 2,
  number: 2,
  name: "อะไรไม่รู้ครับ",
  slogan: "หกด",
  logoUrl: "/images/logo/fms_logo50_color.png",
  groupImageUrl: "/images/logo/fms_logo50_color.png",
  voteCount: 187,
  color: "#2563EB"
}
```

### 2.3 Apply same fix to DUMMY_PARTIES_SINGLE (around line 78)

Same logoUrl + groupImageUrl replacement for the single party entry.

### 2.4 Apply same fix to DUMMY_PARTIES (around line 30)

If DUMMY_PARTIES is just a re-export → no change needed.
If separate definition → update logoUrl + groupImageUrl.

### 2.5 Verify no other null logoUrl

```bash
grep -n "logoUrl" src/utils/editorDummyData.js
```

All entries should have valid paths.

---

## PART 3: Remove inline header from /vote production page

### File: `src/app/vote/page.js`

### 3.1 Find the inline header block (around lines 131-142)

Look for this pattern, only rendered when `!isSingleParty`:

```jsx
<div className="text-center mb-8 animate-fade-in-up">
  <div className="inline-flex ... bg-white/70">
    <span className="text-xs font-bold text-[#8A2680]">ลงคะแนนเสียง</span>
  </div>
  <h1 className="text-3xl md:text-5xl font-black ...">
    เลือกตั้ง<span className="text-[#8A2680]">{globalConfig.organizationShort}</span>
  </h1>
  <p className="mt-2 text-sm ...">
    สวัสดีคุณ <span ...>{session?.user?.name}</span> โปรดเลือกพรรค...
  </p>
</div>
```

### 3.2 Delete this entire block

Remove from `<div className="text-center mb-8 animate-fade-in-up">` through 
its closing `</div>`. Header rendering is now solely owned by MultiPartyView.

### 3.3 IMPORTANT — Do NOT touch other JSX

Keep ALL other content in vote/page.js intact:
- Background blob divs
- `<Navbar />`
- `<MultiPartyView />` invocation
- `<SinglePartyView />` invocation  
- `<VoteFooter />`
- Modals (PartyDetailModal, VoteConfirmationModal)
- CSS keyframes

ONLY remove the inline header `<div>` block.

### 3.4 Preserve greeting (or accept loss)

The greeting "สวัสดีคุณ {session?.user?.name}" was unique to the inline 
header (not in MultiPartyView). After removal, the greeting will not 
appear on /vote.

Decision: **accept the loss** — greeting can be added to MultiPartyView 
later as a separate element if needed. Per scope discipline, don't add 
new features in this fix step.

---

## PART 4: Remove duplicate Wraps from VoteEditorPreview

### File: `src/components/admin/VoteEditorPreview.js`

### 4.1 Find the header section (added in H-3PAGES-PREV)

Look for `<Wrap>` blocks with these IDs:
```jsx
<Wrap id="vote-header-badge">
  ...
</Wrap>

<Wrap id="vote-header-title">
  <h1>...</h1>
</Wrap>

<Wrap id="vote-header-subtitle">
  <p>...</p>
</Wrap>
```

### 4.2 Remove these 3 Wrap blocks entirely

Delete the entire block including the `<Wrap>` open + content + `</Wrap>` close.

After removal, VoteEditorPreview should only contain:
- Real `<Navbar />` (if present)
- Background container div
- `<MultiPartyView ... />` (this now renders the header itself)
- `<SinglePartyView ... />` (single mode branch)
- `<VoteFooter />` (if present)

### 4.3 Verify MultiPartyView in editorMode still receives editor props

Inside VoteEditorPreview, MultiPartyView should be invoked with:
```jsx
<MultiPartyView
  editorMode={true}
  regularParties={DUMMY_PARTIES_MULTI}
  specialOptions={DUMMY_SPECIAL_OPTIONS}
  selectedPartyId={null}
  onSelect={() => {}}
  onViewDetails={() => {}}
  config={pageLayout?.vote?.multiPartyConfig || {}}
  pageLayout={pageLayout}
  elementConfigs={elementConfigs}
  selectedElement={selectedElement}
  hoveredElement={hoveredElement}
  onSelectElement={onSelectElement}
  onHoverElement={onHoverElement}
  onHoverEnd={onHoverEnd}
/>
```

The editor props flow through to MultiPartyView's internal Wraps — 
`vote-header-title`, `vote-header-subtitle`, `vote-abstain-button` etc. 
are now editable through that path.

---

## PART 5: Verify MultiPartyView header is intact

### File: `src/components/vote/MultiPartyView.js`

### 5.1 Confirm header block exists (around lines 70-92)

```jsx
<div className="text-center mb-8 space-y-2">
  <Wrap id="vote-header-title">
    <h1 ...>{cfg('vote-header-title').text || 'เลือกตั้งสโมสรนักศึกษา'}</h1>
  </Wrap>
  <Wrap id="vote-header-subtitle">
    <p ...>{cfg('vote-header-subtitle').text || 'คลิกเลือกพรรคที่คุณต้องการ'}</p>
  </Wrap>
</div>
```

This is the SOLE header source after this fix. Do not modify it.

### 5.2 Optional improvement — add badge wrap if missing

If MultiPartyView doesn't have a `<Wrap id="vote-header-badge">`, you may 
add one above the title to match elementRegistry. But ONLY if the badge 
text exists in the rendering — don't add new visual elements.

If unsure, skip this. Match-existing-content is the priority.

---

## DO NOT
- Do NOT modify SinglePartyView (separate component, different concerns)
- Do NOT modify candidates/page.js (production correct)
- Do NOT add ErrorBoundary to LivePreview (separate concern, future work)
- Do NOT install packages
- Do NOT add new features (e.g., greeting in MultiPartyView header)
- Do NOT register new elements in elementRegistry

---

## VERIFICATION

### 1. Build
```bash
npm run build
```
Must PASS exit 0.

### 2. Grep proof
```bash
# Null guard added
grep -A3 "export const getPath" src/utils/basePath.js | head -10

# Dummy data fixed
grep -n "logoUrl" src/utils/editorDummyData.js

# Inline header removed from vote/page.js (should not match)
grep -n "ลงคะแนนเสียง" src/app/vote/page.js
# Expected: only matches inside MultiPartyView via cfg() if any, NOT a literal h1

# VoteEditorPreview no longer has duplicate header Wraps
grep -n "vote-header-badge\|vote-header-title\|vote-header-subtitle" src/components/admin/VoteEditorPreview.js
# Expected: 0 matches (Wraps removed)

# MultiPartyView still owns header  
grep -n "vote-header-title\|vote-header-subtitle" src/components/vote/MultiPartyView.js
# Expected: matches found (header preserved)
```

### 3. Manual test — Bug A: vote duplicate header
1. Open `/vote` (production, multi-party mode with 2+ parties in DB)
2. ✅ See SINGLE header: "เลือกตั้งสโมสรนักศึกษา" + subtitle
3. ✅ NO duplicate "เลือกตั้งสโมสรนักศึกษา" appearing twice
4. (Greeting "สวัสดีคุณ ..." is removed — acceptable)

### 4. Manual test — Bug B: candidates crash
1. Admin → ออกแบบหน้าเว็บ
2. Click "หน้าหลัก" first (establish baseline)
3. Click "รายชื่อผู้สมัคร"
4. ✅ NO crash
5. ✅ Preview updates (no stale DOM from previous tab)
6. ✅ See party list rendered with placeholder logos

### 5. Manual test — Other admin tabs still work
1. Click "หน้าลงคะแนน" (vote)
2. ✅ See VoteEditorPreview with MultiPartyView's header (single instance)
3. ✅ Click vote-header-title — selectable
4. ✅ Click vote-header-subtitle — selectable
5. ✅ Click party-card — selectable
6. ✅ Click abstain-button — selectable
7. Click "ผลคะแนน" — results editor still works
8. Click "หน้าระบบปิด" — closed editor still works
9. Click "หน้าหลัก" — home editor still works

### 6. H-SYNC-FIX still works
1. Click "หน้าหลัก" → click hero-title
2. ✅ See 🔗 hint
3. Edit text → preview + cross-surface sync still functions

### 7. Console check
- No red errors when clicking through tabs
- No `[getPath] received non-string input` warnings (means data is now clean)

---

## REPORT FORMAT

```
Modified src/utils/basePath.js — added null/non-string guard at top of getPath; logs warning in dev mode and returns empty string defensively to prevent null/undefined crashes
Modified src/utils/editorDummyData.js — replaced logoUrl: null and groupImageUrl: null with /images/logo/fms_logo50_color.png in DUMMY_PARTIES_MULTI (2 entries), DUMMY_PARTIES_SINGLE (1 entry), DUMMY_PARTIES (if separate); maintains shape contract with production data
Modified src/app/vote/page.js — removed inline header block (badge + h1 + greeting, lines 131-142); header now solely rendered by MultiPartyView per P-LOG-001 strategy; greeting removed (acceptable scope cut)
Modified src/components/admin/VoteEditorPreview.js — removed 3 duplicate Wraps for vote-header-badge/title/subtitle that overlapped with MultiPartyView's internal Wraps; header editing flows through MultiPartyView's Wraps via editor props pass-through
Verified src/components/vote/MultiPartyView.js — header Wraps for vote-header-title and vote-header-subtitle preserved (no changes needed)

Grep verifications (PROOF):
[paste actual grep output for all 4 commands]

Build: PASS

Manual tests:
- /vote production: single header, no duplicate ✅
- Admin candidates tab: no crash, party list renders ✅
- Admin vote tab: header editable through MultiPartyView Wraps ✅
- Other admin tabs: unchanged ✅
```

No other commentary.
