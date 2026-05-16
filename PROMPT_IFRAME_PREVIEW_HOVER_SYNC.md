# Prompt: Real Page iframe Preview + Hover Sync Highlight

```
Read CLAUDE.md first.

Do all changes without asking for confirmation. Execute in sequence.
Verify npm run build passes after each part.

## Goal
Replace dummy preview components with real page iframes.
Add hover-sync: hovering a section in the admin list highlights that section 
in the iframe preview and scrolls to it.

---

## PART 1 — Replace previews with iframe

In the admin page design tab preview panel:

1. Remove VotePreview and ResultsPreview imports (keep files for reference, just don't import).

2. Remove BlockRenderer import from preview panel if used there.

3. For ALL pages, render iframe pointing to the actual page:

```jsx
const [saveCount, setSaveCount] = useState(0);

const getPreviewUrl = (pageId) => {
  const pathMap = {
    home: '/',
    vote: '/vote',
    results: '/results',
    candidates: '/candidates',
    party: '/party',
    success: '/success'
  };
  const basePath = pathMap[pageId] || '/';
  // Add editor mode query param so pages know they're in preview
  return getPath(`${basePath}?editorPreview=true`);
};

// In preview area:
<div className="border border-slate-200 rounded-xl overflow-hidden bg-white relative"
  style={{ height: '600px' }}>
  <iframe
    key={`${selectedPage}-${saveCount}`}
    src={getPreviewUrl(selectedPage)}
    className="border-0 absolute top-0 left-0"
    style={{
      transform: 'scale(0.45)',
      transformOrigin: 'top left',
      width: deviceMode === 'mobile' ? '375px' : '222%',
      height: '222%',
    }}
    title={`Preview: ${selectedPage}`}
    id="preview-iframe"
  />
</div>
```

4. After successful save, increment saveCount to force iframe reload:
```jsx
const handleSave = async () => {
  // ... existing save logic ...
  if (success) {
    setSaveCount(prev => prev + 1); // reload iframe
  }
};
```

5. Device toggle stays the same (Desktop/Mobile buttons).
   Mobile: width 375px, keep scale 0.45.
   Desktop: width 222%, scale 0.45.

---

## PART 2 — Editor mode listener in public pages

Create: src/hooks/useEditorPreview.js

A hook that public pages call. It listens for postMessage from admin parent 
and applies highlight/scroll effects.

```jsx
"use client";
import { useEffect, useState } from 'react';

export function useEditorPreview() {
  const [isEditorMode, setIsEditorMode] = useState(false);
  const [highlightedSection, setHighlightedSection] = useState(null);

  useEffect(() => {
    // Check if loaded inside editor preview
    const params = new URLSearchParams(window.location.search);
    if (params.get('editorPreview') !== 'true') return;
    
    setIsEditorMode(true);

    const handleMessage = (event) => {
      const { type, payload } = event.data || {};
      
      if (type === 'EDITOR_HIGHLIGHT') {
        // payload = { sectionType: "hero" } or null to clear
        setHighlightedSection(payload?.sectionType || null);
        
        // Scroll to section if it exists
        if (payload?.sectionType) {
          const el = document.querySelector(`[data-editor-section="${payload.sectionType}"]`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }
      
      if (type === 'EDITOR_RELOAD') {
        window.location.reload();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return { isEditorMode, highlightedSection };
}
```

---

## PART 3 — Add data-editor-section attributes to HomeContent

Modify: src/components/HomeContent.js

Each block wrapper needs a data attribute so the editor can find it.

In the renderBlock function or wherever blocks are rendered, wrap each block:

```jsx
<div data-editor-section={block.type}>
  {/* existing block component */}
</div>
```

Also add the highlight overlay when in editor mode:

```jsx
import { useEditorPreview } from '../hooks/useEditorPreview';

// Inside HomeContent component:
const { isEditorMode, highlightedSection } = useEditorPreview();

// In the render, wrap each block:
<div 
  data-editor-section={block.type}
  className="relative"
>
  {/* Block component */}
  
  {/* Editor highlight overlay */}
  {isEditorMode && highlightedSection === block.type && (
    <div className="absolute inset-0 border-2 border-[#8A2680] rounded-lg pointer-events-none z-50 bg-[#8A2680]/5">
      <div className="absolute top-2 left-2 bg-[#8A2680] text-white text-[10px] font-bold px-2 py-0.5 rounded">
        {block.type}
      </div>
    </div>
  )}
</div>
```

IMPORTANT: When NOT in editor mode (normal public view), the hook returns 
isEditorMode=false and nothing extra renders. Zero impact on production.

---

## PART 4 — Send postMessage from admin on hover

In the admin page design tab, when hovering over a section item in the list:

```jsx
const iframeRef = useRef(null);
// or use: document.getElementById('preview-iframe')

const handleSectionHover = (sectionType) => {
  const iframe = document.getElementById('preview-iframe');
  if (iframe?.contentWindow) {
    iframe.contentWindow.postMessage({
      type: 'EDITOR_HIGHLIGHT',
      payload: { sectionType }
    }, '*');
  }
};

const handleSectionHoverEnd = () => {
  const iframe = document.getElementById('preview-iframe');
  if (iframe?.contentWindow) {
    iframe.contentWindow.postMessage({
      type: 'EDITOR_HIGHLIGHT',
      payload: null
    }, '*');
  }
};
```

On each section list item, add:
```jsx
<div
  onMouseEnter={() => handleSectionHover(block.type)}
  onMouseLeave={handleSectionHoverEnd}
  // ... existing props
>
```

---

## PART 5 — Click section in admin → highlight + scroll in iframe

When user CLICKS a section item in the admin list (not just hover):

```jsx
const handleSectionClick = (sectionType) => {
  setSelectedSection(sectionType); // existing state for showing config panel
  
  // Also send to iframe for persistent highlight
  const iframe = document.getElementById('preview-iframe');
  if (iframe?.contentWindow) {
    iframe.contentWindow.postMessage({
      type: 'EDITOR_HIGHLIGHT',
      payload: { sectionType }
    }, '*');
  }
};
```

The highlight stays visible until another section is clicked or hover moves elsewhere.

---

## Summary of visual behavior:

1. Admin opens "ออกแบบหน้าเว็บ" tab
2. Selects "หน้าหลัก" → iframe loads actual Home page
3. Hovers "Hero" in section list → iframe scrolls to Hero section, 
   purple border + label appears around it
4. Mouse leaves → highlight fades
5. Clicks "Stats" → config panel opens for Stats, 
   iframe scrolls to Stats with persistent highlight
6. Changes config → clicks "บันทึก" → iframe reloads showing updated page

---

## Files:

NEW:
- src/hooks/useEditorPreview.js

MODIFY:
- Admin page design tab (iframe + postMessage sender + hover handlers)
- src/components/HomeContent.js (add data-editor-section + highlight overlay)

DO NOT MODIFY:
- Block components themselves
- vote/page.js, results/page.js, etc. (only HomeContent for now)
- API routes, database

## Constraints:
- No new npm dependencies
- postMessage uses '*' origin for simplicity (same-origin anyway)
- Editor overlay must not affect layout (position absolute + pointer-events-none)
- Production pages unaffected (editorPreview query param check)
- getPath() for iframe URLs

## Verification:
1.  [ ] iframe loads actual Home page in preview
2.  [ ] iframe loads actual Vote page when "หน้าลงคะแนน" selected
3.  [ ] iframe loads actual Results page when "ผลคะแนน" selected
4.  [ ] Device toggle changes iframe width (desktop/mobile)
5.  [ ] Hovering section in list → iframe highlights that section with purple border
6.  [ ] Mouse leave → highlight disappears
7.  [ ] Clicking section → persistent highlight + config panel opens
8.  [ ] Save → iframe reloads → shows updated content
9.  [ ] Public Home page without ?editorPreview=true shows NO overlay/highlight
10. [ ] npm run build passes
```
