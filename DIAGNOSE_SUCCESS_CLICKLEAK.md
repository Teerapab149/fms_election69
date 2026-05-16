# DIAGNOSE_SUCCESS_CLICKLEAK.md

## READ FIRST
Read `CLAUDE.md` first.

## TASK
Diagnose only — DO NOT modify any file. Just read and report.

## BUG
When admin clicks "โหวตสำเร็จ" tab in PageDesignTab and clicks anything in 
the live preview, the browser actually navigates — typically to /vote because 
middleware redirects un-voted users from /success.

This breaks the click-lock invariant — admin should never be able to navigate 
out of the editor by clicking on preview content.

## INVESTIGATION

### Section 1: PageDesignTab handling for selectedPage='success'

In `src/components/admin/PageDesignTab.js`, find what renders for 'success':

1. The renderPreview branch — likely falls to PagePreviewRenderer fallback
2. The left panel branch — likely PlaceholderPageSectionList

Show the actual code paths.

### Section 2: PagePreviewRenderer 'success' case

In `src/components/admin/previews/PagePreviewRenderer.js`, find the switch 
case for `pageId === 'success'` (or similar).

Show:
- What component renders for success
- Is it `<SuccessPreview />`, `<SuccessPage />`, or inline JSX?
- Does it contain `<Link>` or `<a>` tags that could navigate?
- Does it call `router.push()` anywhere?

### Section 3: Success page structure

If SuccessPreview is inline in PagePreviewRenderer, show that JSX.
If it's `src/app/success/page.js` rendered, show top of that file.

Look for navigation patterns:
- `<Link href={...}>` 
- `<a href={...}>`
- `onClick={() => router.push(...)}`
- form submissions
- automatic redirects via `useEffect`

### Section 4: Click-lock infrastructure

In `src/components/admin/PageDesignTab.js`, find the LivePreview container's 
`onClickCapture` handler (added per H-PREVIEW-INFRA / H-5.5).

Show the handler code. Specifically:
- Does it block ALL clicks NOT inside an EditorElement?
- Does it use `e.target.closest('.group\\/editor')` to detect editor wraps?
- What happens when clicking outside any wrap?

### Section 5: Why click escapes

For success preview, content is rendered without EditorElement wrappers (no 
elements registered for success page). So:
- Hypothesis A: onClickCapture blocks clicks correctly, but Links use 
  navigation that bypasses click events (e.g., real `<a href>` natural)
- Hypothesis B: onClickCapture has a bug allowing certain clicks through
- Hypothesis C: The `<Link>` component bypasses event capture via its own 
  internal mechanism
- Hypothesis D: There's a useEffect-based auto-redirect on success page

Test each hypothesis by reading code.

### Section 6: Navbar in success preview

Does success preview render a Navbar? Navbar has Links to "หน้าแรก", 
"ผลการลงคะแนนเสียง", "Meet Candidates". Clicking those would navigate.

If Navbar is present in success preview AND click-lock doesn't catch its 
links → that's another leak source.

### Section 7: Current click-lock at LivePreview wrapper

Show the JSX wrapping renderPreview() in PageDesignTab. Is the 
onClickCapture on:
- The outer div with overflow-y-auto (height 650px)?
- Or somewhere inside?

If the capture handler is too far up the tree, certain anchor clicks may not 
fire onClick events to be intercepted (browser may skip event for 
`<a target=_self>` follow-through).

## OUTPUT FORMAT

```
=== Section 1: PageDesignTab 'success' branches ===
renderPreview: [code]
left panel: [code]

=== Section 2: PagePreviewRenderer 'success' ===
Component used: ___
Has Links: yes/no
Has router.push: yes/no
Has redirects: yes/no

=== Section 3: Success page JSX ===
[relevant code]

=== Section 4: Click-lock handler ===
[code with line numbers]

=== Section 5: Why click escapes ===
Confirmed hypothesis: A/B/C/D
Specific code path: ___

=== Section 6: Navbar in success preview ===
Present: yes/no
Links inside: ___

=== Section 7: onClickCapture position ===
Element + line: ___

=== Root cause ===
[1-2 sentences]

=== Recommended fix ===
Smallest change: ___
Better fix: ___
```

## DO NOT
- DO NOT modify files
- ONLY read and report
