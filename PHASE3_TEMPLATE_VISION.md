# PHASE3_TEMPLATE_VISION.md — Canva-Style Template Gallery System

## Status
Vision document — captures design intent before token exhaustion.
Phase 3 implementation deferred until Phase 2 complete + Phase 4 (party page) groundwork.

## Core Vision (User's Words — Verified Understanding)

> "1 template คือ เป็น template ให้เอามาเลือกปรับ เช่น แบบ original ที่มีอยู่ 
> ก็คือ template นั้นๆ จะเอา element แต่ละตัว มาจัดวางให้เข้ากันเป็น 1 template 
> และทุก template จะมี default design ไว้ แต่สามารถ custom เอา element อื่นๆ 
> มาใช้ได้ หรือจะปรับ element ที่มี default ของ template นั้นๆ ก็ทำได้"

> "ถ้าให้เห็นภาพง่ายๆ ก็เช่น การที่เราเอา template ของ canva ที่เราเลือก 
> template ของคนอื่นมาแล้วสามารถ edit ได้ดั่งใจ เช่นการย้ายตำแหน่ง การปรับ 
> ขนาด ปรับรูปแบบต่างๆ"

## The Mental Model — Canva Analogy

```
Canva Workflow                    →  FMS Template System
─────────────────────────────────────────────────────────────
1. Browse template gallery        →  Browse FMS template gallery
   (Project Brief, Pitch Deck...)    (Modern Dark, Pastel, Minimal...)

2. Select template                →  Select template
   (preview all 13 slides)          (preview all 6 pages)

3. Apply "Use this template"      →  Apply "ใช้ template นี้"
   (all slides become this style)   (all pages become this design)

4. Edit any element on any slide  →  Edit any element on any page
   - Move position                   - Move position (Phase 4 drag-drop)
   - Resize                          - Resize via CSS controls
   - Change text/color/font          - Change via PropertyPanel tiers
   - Delete element                  - Toggle visibility
   - Add element from library        - Add from Component Library

5. Save as new template            →  Save as new template
   (private to user)                  (D-101 legacy preservation)

6. Share with team / community     →  Future: cross-admin template sharing
```

## What 1 Template Contains

A template is a **complete design specification for ALL pages and ALL elements** 
in the system. NOT just a color theme.

```javascript
TEMPLATE_SCHEMA = {
  // Metadata
  id: "modern-dark",
  name: "Modern Dark",
  description: "เน้น dark mode + glow effects + sharp typography",
  thumbnail: "/templates/modern-dark/cover.png",
  thumbnails: {
    home: "/templates/modern-dark/home.png",
    vote: "/templates/modern-dark/vote.png",
    candidates: "/templates/modern-dark/candidates.png",
    results: "/templates/modern-dark/results.png",
    party: "/templates/modern-dark/party.png",
    closed: "/templates/modern-dark/closed.png",
    success: "/templates/modern-dark/success.png"
  },
  
  // Authorship + lineage
  author: "system | admin@psu | userId",
  isBuiltIn: true,           // false for user-saved
  isLocked: false,           // true for finalized historical (D-101)
  forkedFrom: null,          // parent template ID if user-saved variant
  createdAt: "2026-05-11T...",
  
  // Per-page configuration
  pages: {
    home: {
      visible: true,
      backgroundType: "gradient",  // or "solid" | "image"
      backgroundConfig: { from: "#0f172a", to: "#1e293b" },
      sections: ["hero", "stats", "voteCTA", "meetCandidates", "electionBanner"],
      sectionLayouts: {
        hero: { gridLayout: "centered", padding: 8 },
        stats: { gridLayout: "3-column", gap: 4 }
      }
    },
    vote: { /* same shape */ },
    candidates: { /* same shape */ },
    results: { /* same shape */ },
    party: { /* same shape — Phase 4 */ },
    closed: { /* same shape */ },
    success: { /* same shape */ }
  },
  
  // Per-element configuration (uses ELEMENT_CATALOG instance IDs)
  elements: {
    // Home page elements
    "hero-title": {
      visible: true,
      config: {
        text: "SAMO 50",
        fontSize: "6xl",
        color: "#ffffff",
        fontWeight: "900",
        align: "center",
        // CSS-level fields (per D-102 tiers)
        letterSpacing: "-0.02em",
        lineHeight: "1.1",
        textShadow: "0 0 20px rgba(6,182,212,0.5)"  // glow effect
      },
      cssOverrides: {
        // Raw CSS for advanced/expert tier
        ".hero-title": "filter: drop-shadow(0 0 10px #06b6d4);"
      }
    },
    "hero-countdown": {
      visible: true,
      config: {
        // Stateful: per-state config
        before:      { pillBackground: "#06b6d4", textColor: "#fff", borderRadius: "full" },
        running:     { pillBackground: "#10b981", textColor: "#fff", borderRadius: "full" },
        paused:      { pillBackground: "#f59e0b", textColor: "#fff", borderRadius: "full" },
        manualEnded: { pillBackground: "#ef4444", textColor: "#fff", borderRadius: "full" },
        nextYear:    { pillBackground: "#64748b", textColor: "#fff", borderRadius: "full" }
      }
    },
    "hero-subtitle":       { visible: true, config: { /* ... */ } },
    "hero-status-badge":   { visible: false },  // hidden in this template
    "stats-voted-card":    { visible: true, config: { /* ... */ } },
    "stats-progress-card": { visible: true, config: { /* ... */ } },
    "stats-eligible-card": { visible: true, config: { /* ... */ } },
    "voteCTA-button":      { visible: true, config: { /* per-state */ } },
    "meet-section":        { visible: true, config: { /* ... */ } },
    
    // Vote page elements
    "vote-header-title":     { visible: true, config: { /* ... */ } },
    "vote-header-subtitle":  { visible: true, config: { /* ... */ } },
    "vote-party-card":       { visible: true, config: { /* ... */ } },
    "vote-abstain-button":   { visible: true, config: { /* ... */ } },
    "vote-disapprove-button":{ visible: true, config: { /* ... */ } },
    "vote-divider-text":     { visible: true, config: { /* ... */ } },
    
    // Candidates page elements
    "candidates-title":      { visible: true, config: { /* ... */ } },
    "candidates-subtitle":   { visible: true, config: { /* ... */ } },
    "candidates-tagline":    { visible: true, config: { /* ... */ } },
    "candidates-counter":    { visible: true, config: { /* ... */ } },
    "candidates-party-card": { visible: true, config: { /* ... */ } },
    
    // Party page elements (Phase 4 — registered when /party gets editor)
    // "party-hero":          { visible: true, config: { /* ... */ } },
    // "party-vision":        { visible: true, config: { /* ... */ } },
    // "party-mission":       { visible: true, config: { /* ... */ } },
    // "party-policies":      { visible: true, config: { /* ... */ } },
    // "party-gallery":       { visible: true, config: { /* ... */ } },
    // "party-team":          { visible: true, config: { /* ... */ } },
    // "party-members":       { visible: true, config: { /* ... */ } },
    // "party-vote-cta":      { visible: true, config: { /* ... */ } },
    
    // Success page elements
    "success-title":         { visible: true, config: { /* ... */ } },
    "success-subtitle1":     { visible: true, config: { /* ... */ } },
    "success-subtitle2":     { visible: true, config: { /* ... */ } },
    "success-form-btn":      { visible: true, config: { /* ... */ } },
    "success-footer":        { visible: true, config: { /* ... */ } }
  },
  
  // Design tokens (for CSS-level consistency)
  theme: {
    colors: {
      primary: "#06b6d4",
      secondary: "#8b5cf6",
      background: "#0f172a",
      surface: "#1e293b",
      text: "#ffffff",
      textMuted: "#94a3b8",
      border: "#334155"
    },
    typography: {
      fontFamily: "Inter, system-ui, sans-serif",
      headingFontFamily: "Archivo Black, sans-serif",
      baseFontSize: "16px"
    },
    spacing: {
      sectionGap: "4rem",
      elementGap: "1.5rem"
    },
    effects: {
      borderRadius: "0.75rem",  // default border radius
      shadow: "0 10px 40px rgba(6,182,212,0.15)",
      glow: "0 0 20px rgba(6,182,212,0.5)"
    }
  },
  
  schemaVersion: "v1"
}
```

## User Flows

### Flow 1: Browse + Apply Template

```
1. Admin opens "ออกแบบหน้าเว็บ" tab
2. Sees template gallery on left sidebar with thumbnails:
   ├── Built-in: Modern Dark, Pastel, Minimal, Vibrant
   ├── User-saved: My SAMO 50 Style, Last Year's Theme
   └── [+ Browse Community] (future)
3. Hover thumbnail → preview popup (all 6 page thumbnails)
4. Click "Use this template"
5. Confirmation modal: "This will replace current design. Save current 
   as new template first?"
   ├── Yes → save current → apply new
   └── No, just apply
6. All pages now render with new template's elements + theme
7. Admin can edit freely from here
```

### Flow 2: Edit Element (CSS-level)

```
1. In editor preview, click any element (e.g., hero-title)
2. PropertyPanel opens on right with TIERS (per D-102):
   ┌────────────────────────────┐
   │ Simple                      │
   │ ─ Text: [SAMO 50         ] │
   │ ─ Color: [color picker]    │
   │ ─ Size: [dropdown]         │
   │                             │
   │ Advanced ▼                  │
   │ ─ Font weight              │
   │ ─ Letter spacing           │
   │ ─ Line height              │
   │ ─ Shadow                   │
   │ ─ Border radius            │
   │                             │
   │ Expert ▼                    │
   │ ─ CSS overrides:           │
   │   ┌──────────────────┐    │
   │   │ .hero-title {    │    │
   │   │   filter: ...    │    │
   │   │ }                │    │
   │   └──────────────────┘    │
   │                             │
   │ [Reset to template default] │
   └────────────────────────────┘
3. Changes preview live
4. Changes saved to "user override" layer (separate from template)
```

### Flow 3: Save as New Template

```
1. Admin has edited elements significantly
2. Click "Save as template" button
3. Modal:
   ┌────────────────────────────┐
   │ Save template               │
   │                             │
   │ Name: [My SAMO 50 Style  ] │
   │ Desc: [Optional 2-3 lines] │
   │ Forked from: Modern Dark    │
   │                             │
   │ Visibility:                 │
   │ ○ Private (only me)         │
   │ ○ Project (PSU admins)      │
   │ ○ Public (future)           │
   │                             │
   │ Lock after save?            │
   │ ☐ Yes (D-101 preservation)  │
   │                             │
   │ [Cancel] [Save]            │
   └────────────────────────────┘
4. Save → POST /api/admin/templates
5. New template appears in "User-saved" section of gallery
6. Lineage tracked: forkedFrom: "modern-dark"
```

### Flow 4: Edit Saved Template (with D-101 lock check)

```
1. Admin clicks edit on saved template
2. If isLocked: 
   ├── Show: "This template is locked (used in election 2026)"
   ├── Options:
   │   - View only
   │   - Fork (create copy)
   │   - Request unlock (admin approval, future)
3. If not locked:
   ├── Edit freely
   └── Changes save in place (or fork — user choice)
```

## Resolution Chain (Updated for Phase 3)

Final config used at render time:

```
1. ELEMENT_TYPES[typeId].baseConfig              ← absolute defaults
2. ELEMENT_INSTANCES[instanceId].defaultConfig   ← instance defaults
3. ELEMENT_INSTANCES[instanceId].presets[name]   ← legacy presets (Phase 2 compat)
4. activeTemplate.elements[instanceId].config    ← template's element override
5. userOverride[instanceId]                      ← admin's edits in editor
6. activeTemplate.elements[instanceId].cssOverrides ← raw CSS (expert tier)

Final = mergeDeepWithCSSOverrides(...)
```

## DB Schema Changes (Phase 3)

```prisma
model SystemConfig {
  // ... existing fields
  
  // NEW: active template selection
  activeTemplateId  String?    @default("modern-dark")
  
  // EXISTING but extended: page-level overrides
  pageLayout        Json?      // user's overrides on top of template
}

// NEW: templates table
model Template {
  id            String   @id @default(uuid())
  name          String
  description   String?
  thumbnail     String?  // URL
  thumbnails    Json     // { home: url, vote: url, ... }
  
  // Authorship
  author        String   // "system" or userId
  isBuiltIn     Boolean  @default(false)
  isLocked      Boolean  @default(false)  // D-101 preservation
  forkedFrom    String?  // parent template ID
  visibility    String   @default("private")  // private | project | public
  
  // Design data
  pages         Json     // per-page config
  elements      Json     // per-element config
  theme         Json     // design tokens
  
  // Metadata
  schemaVersion String   @default("v1")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Lineage (D-101)
  electionYear  String?  // if locked to specific election
  
  @@index([author])
  @@index([forkedFrom])
}

// API endpoints
POST   /api/admin/templates           // create new
GET    /api/admin/templates           // list (filtered by auth)
GET    /api/admin/templates/:id       // get one with full data
PUT    /api/admin/templates/:id       // update (if not locked)
DELETE /api/admin/templates/:id       // soft delete
POST   /api/admin/templates/:id/lock  // lock per D-101
POST   /api/admin/templates/:id/fork  // create copy
POST   /api/admin/templates/:id/apply // set as active
```

## Phase 3 Implementation Steps (Future)

```
Step 1: H-TEMPLATE-MODEL
  Create Template prisma model + migration
  Create /api/admin/templates CRUD endpoints
  Update SystemConfig.activeTemplateId
  
Step 2: H-TEMPLATE-RESOLUTION
  Update resolveConfig() in elementCatalog to use 6-layer chain
  Test backward compat (current presets still work)
  
Step 3: H-TEMPLATE-DEFAULTS
  Seed 4 built-in templates (Modern Dark, Pastel, Minimal, Vibrant)
  Each covers ALL elements (32 in Phase 2 catalog, more in Phase 4)
  
Step 4: H-TEMPLATE-EDITOR-TIERS
  Implement Simple/Advanced/Expert PropertyPanel tiers (D-102)
  Add CSS override field for Expert tier
  Add visibility toggle per element
  
Step 5: H-TEMPLATE-GALLERY-UI
  Sidebar gallery with thumbnail browsing
  Preview popups
  Apply/Save/Fork/Lock buttons
  
Step 6: H-TEMPLATE-SAVE-API
  Wire save-as-new-template flow
  D-101 lock enforcement
  Fork lineage tracking
  
Step 7: H-TEMPLATE-LAYOUT  (advanced, optional)
  Drag-and-drop element positioning
  Per-page layout config
  Section reordering
```

## Phase 3 Dependencies on Phase 2

```
REQUIRED before Phase 3 can start:
✅ ELEMENT_CATALOG complete (32 instances + 16 types)
✅ resolveConfig() helper exists
✅ Section normalizations applied
✅ Fallback gap fixed in templateEngine
✅ All consumers using catalog (post Step 3 WIRE)

Phase 3 BUILDS ON Phase 2 — it doesn't replace it.
Element catalog = the "vocabulary" templates use.
```

## Critical Design Decisions Captured

### D-301 (Phase 3): Template = complete design, not theme
A template covers ALL pages and ALL elements. Applying a template should 
change everything visible. This is the Canva mental model — not the 
"color scheme" mental model.

### D-302 (Phase 3): User overrides separate from template
User's edits in editor go to `userOverride` layer, NOT into the template. 
Template stays pristine. User can "reset to template default" any time.

### D-303 (Phase 3): Save = new template, not modify built-ins
"Save changes" creates a new template (or updates user's draft template). 
Built-in templates are immutable. User templates can be modified if not locked.

### D-304 (Phase 3): Lock enables D-101 legacy preservation
Locked templates can't be edited or deleted. Reserved for templates used 
in historical elections. Forking is always allowed.

### D-305 (Phase 3): CSS-level override is Expert tier
Per D-102 tier system, raw CSS overrides are gated behind Expert tier 
to prevent novice admins from breaking layouts.

### D-306 (Phase 3): NO per-element gallery
Earlier vision considered "each element has its own design gallery". 
REJECTED because it leads to incoherent mixed designs. Templates are 
curated whole-system designs (Canva model).

### D-307 (Phase 3): Visibility toggles per element
Each template entry has `visible: bool`. Templates can hide elements 
they don't want to show. User overrides can re-show them.

## Architectural Distinctions (CRITICAL — don't confuse)

### /party page vs SinglePartyView component

```
/party?id=N  =  Independent page in the application
                ├── Reached when user clicks a party in /candidates
                ├── Shows party detail (hero, vision, mission, policies, 
                │   gallery, team, members, vote section)
                ├── Has its own set of elements (Phase 4)
                └── Templates will style this page's elements

SinglePartyView  =  Component used INSIDE /vote
                    ├── Renders when system has exactly 1 party
                    ├── Cinematic landing in voting flow
                    ├── Uses existing vote-* elements (vote-party-card,
                    │   vote-abstain-button, vote-disapprove-button)
                    └── NOT a separate page

These are NOT the same. Templates style:
- /party page elements when on /party
- Vote page elements (including those used by SinglePartyView) when on /vote
```

## Known Open Questions (Resolve in Phase 3 design phase)

1. **Section ordering** — how does user reorder sections within a page?
   Drag-drop? Up/down arrows? Code-level only?

2. **Custom elements** — can user create entirely new elements?
   Or only use elements from Component Library?

3. **Template inheritance depth** — multiple levels of forking?
   Or just 1 level (built-in → user)?

4. **Template versioning** — if user edits, do we keep history?
   Or last-write-wins?

5. **Real-time collaboration** — multiple admins editing simultaneously?
   Or single-editor-at-a-time?

6. **Mobile-first preview** — toggle to design for mobile-first?
   Currently desktop-first with deviceMode toggle.

7. **Component Library** (Phase 4) integration with templates — do new 
   library items inherit from active template's style?

## What This Phase Does NOT Cover

- Image library (Phase 4)
- Component library (Phase 4)
- /party page elements registration (Phase 4)
- Multi-admin permissions on templates (future)
- Template marketplace / sharing (future)
- AI-powered template generation (future)
- A/B testing different templates (future)

## Success Criteria

When Phase 3 complete:

1. ✅ 4+ built-in templates render entire system differently
2. ✅ Admin can apply template with 1 click → entire system changes
3. ✅ Admin can edit any element at CSS level
4. ✅ Admin can save edited design as new template
5. ✅ Saved templates appear in gallery
6. ✅ Locked templates respect D-101 preservation
7. ✅ Forking preserves lineage (forkedFrom chain)
8. ✅ User overrides separate from template (reset works)
9. ✅ Mobile/desktop preview toggles work
10. ✅ Visibility toggles per element work

## Files to Create in Phase 3

```
src/components/admin/editor/
├── templates/
│   ├── builtIn/
│   │   ├── modern-dark.js
│   │   ├── pastel.js
│   │   ├── minimal.js
│   │   └── vibrant.js
│   ├── TemplateGallery.js          (sidebar UI)
│   ├── TemplatePreviewModal.js     (popup preview)
│   ├── TemplateSaveModal.js        (save flow)
│   ├── TemplateApplyConfirmation.js
│   └── cssTierEditor.js            (Expert tier CSS field)
├── resolveTemplateConfig.js         (6-layer resolution)
└── templateStore.js                 (client state)

src/app/api/admin/templates/
├── route.js                         (list, create)
├── [id]/
│   ├── route.js                     (get, update, delete)
│   ├── lock/route.js                (D-101 lock)
│   ├── fork/route.js                (clone)
│   └── apply/route.js               (set active)

prisma/migrations/
└── XXX_phase3_templates.sql
```

## Timeline Estimate

```
Phase 3 total: ~10-12 hours focused work
- Step 1 (MODEL):       1.5h  (DB + API CRUD)
- Step 2 (RESOLUTION):  1h    (helper update)
- Step 3 (DEFAULTS):    3h    (4 built-in templates, hand-crafted)
- Step 4 (EDITOR):      2h    (tier system + CSS field)
- Step 5 (GALLERY UI):  2h    (browse, preview, apply)
- Step 6 (SAVE API):    1h    (save/fork/lock flows)
- Step 7 (LAYOUT):      1.5h  (drag-drop, optional)
```

## When to Start Phase 3

```
Prerequisites:
✅ Phase 2 complete (all 5 steps)
✅ Phase 4 partial — /party page elements registered (gives full catalog coverage)
✅ DECISIONS.md has D-301 through D-307 documented
✅ Admin tested current system, comfortable with element catalog UX

Trigger: User explicitly requests "เริ่ม template gallery" or similar.
```

## Phase 4 Sneak Peek (for context only)

After Phase 3, Phase 4 will tackle:
- `/party?id=N` page editor (8+ sections — hero, vision, mission, policies, 
  gallery, team, members, vote)
- Component Library (palette of all available elements to add to pages)
- Image Library (user uploads + crops for use in elements)
- Mobile-first design tools

These extend the template system created in Phase 3.

---

## End of Vision Document

This document captures user's design intent for Phase 3 BEFORE the 
implementation phase begins, to prevent design drift. Reference this 
document when starting Phase 3 work.

Cross-references:
- `MASTER_PLAN.md` — overall project roadmap
- `PHASE2_ARCHITECTURE.md` — element catalog foundation
- `DECISIONS.md` — D-101 (legacy preservation), D-102 (CSS tier system)
- `DIAGNOSE_PHASE2_DEEP.md` — element inventory + section normalizations
