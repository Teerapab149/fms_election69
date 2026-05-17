# DIAGNOSE_CLOSED_SUCCESS_NOT_EDITABLE.md — Find Root Cause

## TASK
Diagnose only — DO NOT modify any file. User reports that elements in 
`closed` and `success` pages cannot be clicked in admin editor.

Other pages (home/vote/results/candidates) work fine — confirmed by user.

## INVESTIGATION

### Check 1: Elements registered in catalog for closed + success
```bash
echo "=== Closed page elements ==="
grep -B1 'pages: \["closed"\]' src/components/admin/editor/elementInstances.js

echo "=== Success page elements ==="
grep -B1 'pages: \["success"\]' src/components/admin/editor/elementInstances.js
```

Report:
- Closed: list IDs OR "ZERO registered"
- Success: list IDs OR "ZERO registered"

### Check 2: Wraps in EditorPreview files
```bash
echo "=== ClosedEditorPreview Wraps ==="
grep -oP '<Wrap[[:space:]]+id="[^"]+"' src/components/admin/editor/ClosedEditorPreview.js 2>/dev/null || echo "NO FILE FOUND"

echo "=== SuccessEditorPreview Wraps ==="
grep -oP '<Wrap[[:space:]]+id="[^"]+"' src/components/admin/editor/SuccessEditorPreview.js 2>/dev/null || echo "NO FILE FOUND"
```

Report:
- Closed Wrap IDs: [list]
- Success Wrap IDs: [list]

### Check 3: Check both preview files exist + how they handle clicks
```bash
ls -la src/components/admin/editor/ClosedEditorPreview.js
ls -la src/components/admin/editor/SuccessEditorPreview.js

# View first 50 lines of each
echo "=== ClosedEditorPreview.js (head 50) ==="
head -50 src/components/admin/editor/ClosedEditorPreview.js

echo "=== SuccessEditorPreview.js (head 50) ==="
head -50 src/components/admin/editor/SuccessEditorPreview.js
```

Report import statements + Wrap usage patterns.

### Check 4: pageRegistry for closed + success
```bash
echo "=== closed page in registry ==="
grep -A15 "id: 'closed'\|id: \"closed\"" src/utils/pageRegistry.js

echo "=== success page in registry ==="
grep -A15 "id: 'success'\|id: \"success\"" src/utils/pageRegistry.js
```

Report sections defined for each page.

### Check 5: Section names match between catalog and pageRegistry
Cross-reference:
- Catalog `closed-*` instances section names
- pageRegistry `closed` page sections list

Same for success.

### Check 6: Verify other working pages
For comparison — check home which IS working:
```bash
echo "=== HomeEditorPreview first Wrap ==="
grep -m3 -oP '<Wrap[[:space:]]+id="[^"]+"' src/components/admin/editor/HomeEditorPreview.js
echo "=== Home elements in catalog ==="
grep -c 'pages: \["home"\]' src/components/admin/editor/elementInstances.js
```

This gives baseline for comparison.

## OUTPUT FORMAT

```
=== Section 1: Catalog Coverage ===
closed elements registered: [N]
success elements registered: [N]
[IDs listed]

=== Section 2: Production Wraps ===
ClosedEditorPreview.js Wraps: [list IDs]
SuccessEditorPreview.js Wraps: [list IDs]

=== Section 3: EditorPreview Setup ===
Closed imports + structure: [paste relevant code]
Success imports + structure: [paste relevant code]

=== Section 4: pageRegistry ===
closed page sections: [list]
success page sections: [list]

=== Section 5: Match Analysis ===
For closed:
  Wrap IDs in preview: [...]
  Catalog instance IDs: [...]
  Match: [YES / PARTIAL / NO]
  
For success:
  Wrap IDs in preview: [...]
  Catalog instance IDs: [...]
  Match: [YES / PARTIAL / NO]

=== Section 6: Comparison with Working Page (home) ===
[show home setup for contrast]

=== ROOT CAUSE HYPOTHESIS ===
[Diagnose: which is true?]
- A: closed has ZERO elements in catalog
- B: closed has elements but Wrap IDs don't match
- C: closed page not configured to use catalog properly
- D: section names mismatch between catalog and pageRegistry
- E: ClosedEditorPreview doesn't use <Wrap> at all
- F: Other (specify)

(Repeat for success.)

=== RECOMMENDED ACTIONS ===
For closed:
  Required work: [...]
  Estimated effort: S/M/L

For success:
  Required work: [...]
  Estimated effort: S/M/L
```

## DO NOT
- Do NOT modify any file
- Only read + report
- Per P-LOG-003: paste actual command output, not summary
