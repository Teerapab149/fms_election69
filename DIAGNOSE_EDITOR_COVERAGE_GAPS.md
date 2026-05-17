# DIAGNOSE_EDITOR_COVERAGE_GAPS.md — Find Remaining Editor Gaps

## TASK
Diagnose only — DO NOT modify any file. User reports:
1. After Phase 2.5: closed/success pages have SOME clickable elements 
   but still missing some
2. Across ALL pages: some elements don't show up in the editor's 
   element list/sections panel

## INVESTIGATION

### Section 1: Full Wrap inventory across ALL pages

For each page that's editable, list:
- All <Wrap id="..."> usages in the EditorPreview file
- All catalog instances with that page
- Check for mismatches

```bash
echo "=== Wraps in each EditorPreview ==="
for f in src/components/admin/HomeEditorPreview.js \
         src/components/admin/VoteEditorPreview.js \
         src/components/admin/ResultsEditorPreview.js \
         src/components/admin/CandidatesEditorPreview.js \
         src/components/admin/SuccessEditorPreview.js \
         src/components/admin/ClosedEditorPreview.js; do
  echo "--- $f ---"
  grep -oP '<Wrap[[:space:]]+id="[^"]+"' "$f" 2>/dev/null | sort -u
done

# Some preview files may be in editor/ subdir — check both
for f in src/components/admin/editor/HomeEditorPreview.js \
         src/components/admin/editor/VoteEditorPreview.js \
         src/components/admin/editor/ResultsEditorPreview.js \
         src/components/admin/editor/CandidatesEditorPreview.js \
         src/components/admin/editor/SuccessEditorPreview.js \
         src/components/admin/editor/ClosedEditorPreview.js; do
  if [ -f "$f" ]; then
    echo "--- $f ---"
    grep -oP '<Wrap[[:space:]]+id="[^"]+"' "$f" 2>/dev/null | sort -u
  fi
done
```

For each page, list:
```
Page: home
  Wraps: [...]
  Catalog instances: [...]
  In Wraps but NOT in catalog (ORPHAN production): [...]
  In catalog but NOT in Wraps (UNREACHABLE catalog): [...]

(Repeat for all 6 pages)
```

### Section 2: Catalog instances per page

```bash
echo "=== Catalog instances by page ==="
for page in home vote results candidates closed success party; do
  echo "--- $page ---"
  grep -B1 "pages: \[\"$page\"\]" src/components/admin/editor/elementInstances.js \
    | grep -oP '"[a-zA-Z][a-zA-Z0-9-]+":' \
    | sort -u
done
```

### Section 3: Sections in PageDesignTab UI

How does PageDesignTab display element list? Check the sidebar/section rendering:

```bash
grep -n "section\|Section" src/components/admin/PageDesignTab.js | head -40
```

Look for:
- How section list is built (from pageRegistry?)
- How elements within section are listed (from catalog?)
- Filter logic that might HIDE elements

```bash
# View PageDesignTab section render code
view src/components/admin/PageDesignTab.js
```

Identify lines that map catalog → UI list.

### Section 4: pageRegistry vs Catalog cross-check

For each page, verify section names match:

```bash
echo "=== pageRegistry sections per page ==="
grep -A20 "id: 'home'" src/utils/pageRegistry.js | head -25
grep -A20 "id: 'vote'" src/utils/pageRegistry.js | head -25
grep -A20 "id: 'results'" src/utils/pageRegistry.js | head -25
grep -A20 "id: 'candidates'" src/utils/pageRegistry.js | head -25
grep -A20 "id: 'success'" src/utils/pageRegistry.js | head -25
grep -A20 "id: 'closed'" src/utils/pageRegistry.js | head -25
```

Then compare with catalog:
```bash
echo "=== Catalog sections per page ==="
for page in home vote results candidates success closed; do
  echo "--- $page ---"
  grep -B3 "pages: \[\"$page\"\]" src/components/admin/editor/elementInstances.js \
    | grep "section:" | sort -u
done
```

Report any section name in catalog that doesn't exist in pageRegistry for 
that page.

### Section 5: "visible: false" hidden elements

```bash
echo "=== Elements with visible: false in defaultConfig ==="
grep -B5 'visible: false' src/components/admin/editor/elementInstances.js | grep -E '"[a-zA-Z]'
```

Report which elements default to hidden.

### Section 6: Production source for missing elements

Read each production page (not EditorPreview) and look for Wraps there too:

```bash
# Production pages
for f in src/app/home/page.js src/app/home/HomeContent.js \
         src/app/vote/page.js src/app/vote/VoteContent.js \
         src/app/results/page.js \
         src/app/candidates/page.js \
         src/app/success/page.js \
         src/app/closed/page.js \
         src/components/HomeContent.js \
         src/components/MultiPartyView.js \
         src/components/SinglePartyView.js; do
  if [ -f "$f" ]; then
    echo "--- $f ---"
    grep -oP '<Wrap[[:space:]]+id="[^"]+"' "$f" 2>/dev/null | sort -u
  fi
done
```

Find Wraps in PRODUCTION components that aren't in EditorPreview.

### Section 7: Element registry expected by PageDesignTab

```bash
# Find where PageDesignTab iterates over elements for display
grep -n "ELEMENT_INSTANCES\|getInstancesByPage\|getElement\|sectionedElements" src/components/admin/PageDesignTab.js
```

What does PageDesignTab USE from catalog? If it uses 
`getInstancesByPage`, our catalog data drives the list.
If it uses something else (hardcoded section list?), there may be a 
mismatch.

### Section 8: Section panel render component

```bash
# Find component that renders section/element list in admin UI
grep -rn "SectionPanel\|SectionList\|ElementList" src/components/admin/ --include="*.js" | head -10

# Or look for sidebar render in PageDesignTab
grep -A30 "Sections\|sections" src/components/admin/PageDesignTab.js | head -50
```

Identify component that's responsible for showing elements per section.

## OUTPUT FORMAT

```
=== Section 1: Wraps per page ===
home:
  Wraps in preview: [...] (count: N)
  Catalog instances for home: [...] (count: N)
  
  ORPHAN production (Wrap exists but no catalog entry):
    [list]
  UNREACHABLE catalog (entry exists but no Wrap):
    [list]

[repeat for vote, results, candidates, success, closed]

=== Section 2: Catalog instances by page ===
[full listing]

=== Section 3: PageDesignTab section render logic ===
[paste relevant code lines explaining how section list is built]

=== Section 4: pageRegistry vs Catalog section names ===
home: pageRegistry sections [...] vs catalog sections [...] → MATCH/MISMATCH
[repeat all pages]

=== Section 5: Hidden by default elements ===
[list IDs with visible: false]

=== Section 6: Production Wraps not in EditorPreview ===
[list - these are elements in production that editor doesn't show]

=== Section 7: PageDesignTab catalog usage ===
[paste lines showing which catalog functions are called]

=== Section 8: Section panel render ===
[paste relevant code]

=== ROOT CAUSE SUMMARY ===

Problem A (closed/success — some clicks not working):
[Most likely cause + specific elements affected]

Problem B (all pages — some elements not showing in list):
[Most likely cause]
  - Is it section-name mismatch?
  - Is it visible: false defaults?
  - Is it PageDesignTab filter logic?
  - Is it ORPHAN Wraps in production that catalog doesn't have?
  - Is it UNREACHABLE catalog entries that EditorPreview doesn't render?

=== RECOMMENDED FIXES (per category) ===

Quick fixes (~30 min each):
[...]

Medium fixes (~60 min):
[...]

Larger refactors:
[...]
```

## DO NOT
- Do NOT modify any file
- Per P-LOG-003: paste actual command output
- Be thorough — list every Wrap and every catalog entry
- Per P-LOG-006: scan ALL production component files for orphan Wraps
