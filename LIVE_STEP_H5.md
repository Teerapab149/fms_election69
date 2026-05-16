# LIVE_STEP_H5.md — Replace All Editor Mocks with Real Block Components

## READ FIRST
Read `CLAUDE.md` and `LIVE_EDITOR_ARCHITECTURE.md` "EXECUTION RULES". Follow strictly.

## CONTEXT
HomeContent.js currently has an `editorBlocks` object (lines 282–418) that 
renders mock versions of voteCTA, meetCandidates, stats, electionBanner.
The real production components exist in `BLOCK_COMPONENTS` map and are used 
in normal mode via `renderColumn`. Mocks were quick approximations and don't 
match real visual output.

This step removes ALL mocks and uses the real components in editor mode too,
matching the pattern Hero already uses (single source of truth).

## SCOPE (DO NOT EXCEED)
Modify exactly 2 files:
1. `src/components/HomeContent.js` — remove editorBlocks, build editorBlockData, wrap real blocks
2. `src/components/admin/PageDesignTab.js` — pass initialData to HomeContent in editor mode

Do NOT modify:
- Block components (StatsBlock, VoteCTABlock, etc.) — keep as-is
- elementRegistry, statefulRegistry, templateEngine
- PropertyPanel, StatefulGallery
- editorDummyData.js (we'll transform fields in HomeContent, not add new fields)
- API routes / Prisma schema

## PART 1: Modify `src/components/HomeContent.js`

### Step 1A: Build editor block data
Near where `blockData` is currently constructed (around line 150), add a 
SECOND blockData specifically for editor mode using `editorData` (DUMMY_ELECTION).

```js
// existing line:
// const blockData = { session, isVotedReal, isCheckingVoted, initialData, stats };

// Add right below:
const editorBlockData = editorMode ? {
  session: null,
  isVotedReal: false,
  isCheckingVoted: false,
  initialData: {
    systemMode: "AUTO",
    electionStatus: "ACTIVE", 
    isSystemOpen: true,
    // include other fields if blocks read them
  },
  stats: {
    totalVoted: editorData?.totalVoted ?? 0,
    totalEligible: editorData?.totalEligible ?? 0,
    percentage: (editorData?.percentageVoted ?? 0).toFixed(2)
  }
} : null;

// Use editorBlockData when in editor mode, else use the real blockData
const activeBlockData = editorMode ? editorBlockData : blockData;
```

### Step 1B: Update renderColumn to wrap blocks for editor mode

Find `renderColumn` function (around line 250). It currently looks like:
```js
const Component = BLOCK_COMPONENTS[block.type];
const extraProps = block.type === 'voteCTA' ? { resolvedConfig: voteCTAResolvedConfig } : {};
content = <Component config={block.config || {}} data={blockData} {...extraProps} />;
```

Change `blockData` to `activeBlockData` and wrap with `<Wrap>` for editor mode.
Each block needs a top-level Wrap with element ID matching its main editable element.

Wrap mapping:
- `voteCTA` → `<Wrap id="voteCTA-button">`
- `stats` → `<Wrap id="stats-section">` (or whatever ID exists in registry; use `stats-voted-card` if more accurate as the primary element)
- `meetCandidates` → `<Wrap id="meet-section">`
- `electionBanner` → `<Wrap id="banner-section">`
- `hero` → already handled by renderHero (skip)

Updated pattern:
```js
function renderColumn(blocks) {
  return blocks.map((block) => {
    let content;
    
    if (block.type === 'hero') {
      content = renderHero();
    } else {
      const Component = BLOCK_COMPONENTS[block.type];
      if (!Component) return null;
      
      const extraProps = block.type === 'voteCTA' 
        ? { resolvedConfig: voteCTAResolvedConfig } 
        : {};
      
      const blockJSX = (
        <Component 
          config={block.config || {}} 
          data={activeBlockData} 
          {...extraProps} 
        />
      );
      
      // In editor mode, wrap with the appropriate Wrap id for selection
      if (editorMode) {
        const wrapIdMap = {
          voteCTA: 'voteCTA-button',
          stats: 'stats-voted-card',
          meetCandidates: 'meet-section',
          electionBanner: 'banner-section'
        };
        const wrapId = wrapIdMap[block.type];
        content = wrapId 
          ? <Wrap id={wrapId}>{blockJSX}</Wrap>
          : blockJSX;
      } else {
        content = blockJSX;
      }
    }
    
    return (
      <div key={block.id || block.type}>
        {content}
      </div>
    );
  });
}
```

Adjust to match existing renderColumn structure (key handling, visibility filter, etc.). Keep all existing logic for filtering/sorting blocks; only change the inner rendering.

### Step 1C: Delete the editorBlocks object and renderEditorColumn

Find lines 282–418 (the `editorBlocks` object).
Find `renderEditorColumn` function (around line 421).

Delete BOTH entirely.

### Step 1D: Use renderColumn in both modes

Find where `renderEditorColumn` is called (in the JSX return for editor mode).
Replace those calls with `renderColumn(...)` — same function used in normal mode.

The component should now render the same way in both modes, just with Wrap 
adding hover/select overlays in editor mode.

### Step 1E: Visibility check in editor mode

For toggleable elements (banner-section, meet-section, etc.):
The mocks had checks like `cfg('banner-section').visible !== false && (...)`.

Preserve this in editor mode:
```js
// Inside renderColumn, before rendering:
if (editorMode && block.type === 'electionBanner' && cfg('banner-section').visible === false) {
  return null;
}
if (editorMode && block.type === 'meetCandidates' && cfg('meet-section').visible === false) {
  return null;
}
```

Or use a more general visibility map. Whatever pattern fits the existing code best.

For normal mode, use whatever existing visibility logic is there (likely `block.visible !== false`).

## PART 2: Modify `src/components/admin/PageDesignTab.js`

### Step 2A: Pass initialData to HomeContent in editor mode

Find where `<HomeContent>` is rendered in the live preview (likely around line 326).

Currently it might look like:
```jsx
<HomeContent
  editorMode={true}
  editorData={DUMMY_ELECTION}
  pageLayout={livePageLayout}
  elementConfigs={editor.elementConfigs}
  ...
/>
```

Add `initialData` prop to provide the runtime context that real blocks need. 
For editor mode, supply a sensible default:

```jsx
<HomeContent
  editorMode={true}
  editorData={DUMMY_ELECTION}
  initialData={{
    systemMode: "AUTO",
    electionStatus: "ACTIVE",
    isSystemOpen: true,
    stats: {
      totalVoted: DUMMY_ELECTION.totalVoted,
      totalEligible: DUMMY_ELECTION.totalEligible,
      percentage: (DUMMY_ELECTION.percentageVoted ?? 0).toFixed(2)
    }
  }}
  pageLayout={livePageLayout}
  elementConfigs={editor.elementConfigs}
  ...existing props
/>
```

This gives blocks a reasonable default to render. HomeContent's editor mode 
also overrides via `editorBlockData`, so this is mostly defensive — but pass 
it explicitly so any block that reads from `initialData` directly still works.

## DO NOT
- Do NOT modify any block component (StatsBlock, VoteCTABlock, etc.)
- Do NOT add new fields to DUMMY_ELECTION
- Do NOT change resolvedConfig logic for voteCTA (keep H-2 intact)
- Do NOT install packages
- Do NOT change normal mode rendering at all — only editor mode is being unified

## VERIFICATION

1. `npm run build` passes exit 0
2. Real `/` page renders identically to before (Hero, Stats, VoteCTA, MeetCandidates, ElectionBanner)
3. Admin live preview now shows REAL components for all sections:
   - Stats: real animated progress bar with 342 / 1200 / 28.50%
   - VoteCTA: real button with gradient, icon, shadow (login state default)
   - MeetCandidates: real card with logos placeholder, real "ดูรายชื่อพรรค" button
   - ElectionBanner: real image (samo49_1.png) loading
4. Hovering any section in editor preview shows purple dashed border
5. Clicking section opens PropertyPanel (or StatefulGallery for voteCTA)
6. Toggle banner visibility → banner disappears in preview
7. Toggle meet-section visibility → section disappears
8. No console errors about missing data fields

## REPORT FORMAT

```
Modified src/components/HomeContent.js — removed editorBlocks (lines 282-418) and renderEditorColumn, unified renderColumn for both modes, added editorBlockData with transformed editorData, wrapped real blocks with Wrap in editor mode
Modified src/components/admin/PageDesignTab.js — passed initialData prop to HomeContent in editor mode
Build: PASS
```

No other commentary. Do not run dev server.
