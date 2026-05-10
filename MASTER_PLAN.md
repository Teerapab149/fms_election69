# MASTER_PLAN.md — FMS Election Editor System

**Last updated:** Phase 1.5 in progress, post-extensibility audit  
**Owner:** Teerapab (FMS PSU)  
**Vision:** Canva/Figma-level editor for student admin to redesign election website without code, with template legacy preservation across generations

---

## 🎯 Strategic Goals

1. **Runtime editor** — admin (non-dev) แก้ design ทุกหน้าได้ผ่าน UI
2. **Logic locked, design free** — election logic immutable; visual fully editable
3. **Template extensibility** — เพิ่ม master template ใหม่ได้ในการสั่ง 1 ครั้ง ไม่ต้อง migrate
4. **Element extensibility** — เพิ่ม element ใหม่ได้โดย templates ทั้งหมด auto-fallback
5. **Cross-generation legacy** — รุ่นน้องสร้าง template ของตัวเอง finalize lock ส่งต่อรุ่นถัดไป
6. **Cross-page reuse** — element ใช้ข้ามหน้าได้

---

## 🏗️ Target Architecture

```
┌──────────────────────────────────────────────────────────┐
│ Layer 1: Master Templates                                │
│ Source: templateEngine.js (hardcoded)                    │
│ Purpose: Devs maintain — factory presets                 │
│ Adding new: TEMPLATE_EXTENSION_SPEC.md → run             │
└──────────────────────────────────────────────────────────┘
                       ↓ (clone + customize)
┌──────────────────────────────────────────────────────────┐
│ Layer 2: Created Templates                               │
│ Storage: SystemConfig.pageLayout.createdTemplates[]      │
│ Lifecycle: draft → finalize → archive                    │
│ Purpose: User-made templates — รุ่นน้องสร้าง            │
└──────────────────────────────────────────────────────────┘
                       ↓ (apply per-page + override)
┌──────────────────────────────────────────────────────────┐
│ Layer 3: Active Page Configurations                      │
│ Storage: SystemConfig.pageLayout.perPage[pageId] = {     │
│   sourceTemplate, elementOverrides, backgroundId         │
│ }                                                        │
│ Note: per-page now (not global)                          │
└──────────────────────────────────────────────────────────┘
                       ↓ (snapshot)
┌──────────────────────────────────────────────────────────┐
│ Layer 4: Saved Designs                                   │
│ Storage: SystemConfig.pageLayout.savedDesigns[]          │
│ Operations: save / apply / revert                        │
│ Purpose: per-page version history                        │
└──────────────────────────────────────────────────────────┘

Cross-cutting:
┌──────────────────────────────────────────────────────────┐
│ Global Config — election name, year, faculty            │
│ Storage: SystemConfig.globalConfig                       │
│ Distribution: GlobalConfigProvider (React Context)       │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ Unified Element Catalog (NEW)                            │
│ File: src/components/admin/editor/elementCatalog.js      │
│ Purpose: Single source of truth for all elements         │
│ Each element has:                                        │
│   id, name, type, category, pages[], section,            │
│   isStateful, states[], stateResolverKey,                │
│   defaultConfig, presets[]                               │
│ APIs:                                                    │
│   getElementsByPage(pageId)                              │
│   getElementsByCategory(cat)                             │
│   getElementsBySection(sec)                              │
│   getElementById(id)                                     │
└──────────────────────────────────────────────────────────┘
```

---

## 📋 Element Catalog Schema (Target)

```js
// elementCatalog.js (unified — replaces split registries)
{
  "voteCTA-button": {
    // Identity
    id: "voteCTA-button",
    name: "ปุ่มโหวต",
    
    // Categorization (NEW)
    type: "button",
    category: "button",          // button | text | card | image | badge | chart | timer
    pages: ["home"],              // pages where this can appear (admin can add)
    section: "voteCTA",           // canonical section name
    
    // State system
    isStateful: true,
    stateResolverKey: "voteCTA",
    states: [
      { id: "login", label: "ยังไม่ล็อกอิน", description: "..." },
      // ...
    ],
    
    // Defaults (template fallback)
    defaultConfig: {
      login: { /* ... */ },
      notVoted: { /* ... */ },
      // ...
    },
    
    // Static presets (legacy compat — only for non-stateful elements)
    presets: null  // null because stateful
  },
  
  "hero-title": {
    id: "hero-title",
    name: "ชื่อการเลือกตั้ง",
    type: "text",
    category: "text",
    pages: ["home", "results"],   // can appear on multiple pages
    section: "hero",
    isStateful: false,
    states: null,
    defaultConfig: null,
    presets: [/* 4 presets: classic/dark/playful/minimal */]
  }
}
```

---

## 📂 Page-Element Map (Target)

| Page | Sections | Elements (examples) |
|------|----------|---------------------|
| Home (`/`) | hero, stats, voteCTA, meet, banner | hero-title, hero-countdown, voteCTA-button, stats-* |
| Vote (`/vote`) | header, partyGrid | vote-header-*, vote-party-card, vote-abstain-button |
| Results (`/results`) | header, candidates, demographics | results-heading, result-card, result-card-winner, results-stats-bar |
| Candidates (`/candidates`) | header, list | candidates-header, party-list-card |
| Closed (`/closed`) | message, info | closed-message |
| Login (`/login`) | hero, oauth | login-cta |

**Cross-page reuse:** Same element can have `pages: ["home", "candidates"]` if applicable. SiteFooter is universal — present on every page.

---

## 🔄 Phase Roadmap

### ✅ Phase 0: Foundation (DONE)
LEGO blocks, EditorElement, click-lock, page editor base UI.

### ✅ Phase 1: State-Aware Foundation (DONE)
statefulRegistry, stateResolver, templateEngine, voteCTA-button, hero-countdown, Classic + Neon templates, StatefulGallery, save/load loop.

### 🔄 Phase 1.5: Real Preview Coverage [IN PROGRESS]

| Step | Status | Output |
|------|--------|--------|
| H-G | ✅ DONE | Global Config foundation |
| H-7a-FIX | ✅ DONE | Real components in Results editor |
| H-7a-FIX-WIRE | ✅ DONE | ResultsEditorPreview wired to PageDesignTab |
| **H-PREVIEW-INFRA** | 🔜 NEXT | Universal preview container (scrollable) + fullscreen results |
| H-CON | ⏳ | Replace hardcoded strings with useGlobalConfig |
| H-VOTE-PREV | ⏳ | Vote page editor preview |
| H-CAND-PREV | ⏳ | Candidates page editor preview |
| H-CLOSED-PREV | ⏳ | Closed page editor preview |

### 🔄 Phase 2: Schema Refactor + Element Coverage

**Pre-refactor (foundation gaps fixed first):**

| Step | Status | Output |
|------|--------|--------|
| **H-CATALOG** | ⏳ | Unify elementRegistry + statefulRegistry → elementCatalog.js with `pages[]`, `category`, fallback APIs |
| **H-FALLBACK-FIX** | ⏳ | Fix `resolveStatefulConfig` template-exists-element-missing fallback |
| **H-PAGE-NORMALIZE** | ⏳ | Reconcile section names (pageRegistry vs elementRegistry) |

**Then element coverage:**

| Step | Status | Output |
|------|--------|--------|
| H-7b | ⏳ | ResultCard stateful (3 states + winner separate element) |
| H-8 | ⏳ | Results elements (heading, stats bar, demographics) stateful |
| H-9 | ⏳ | Vote page elements stateful |
| H-10 | ⏳ | Hero elements (title, subtitle, year-badge) stateful where appropriate |
| H-11 | ⏳ | Stats Block (Home) stateful |
| H-12 | ⏳ | Meet Candidates Card stateful |

**Why refactor first:** Adding 6 elements (H-7b through H-12) without fixing fallback + unification means 6× drift between registries. Fix once, then add safely.

### 🔄 Phase 3: Save/Template System

**Pre-build (per-page state required):**

| Step | Status | Output |
|------|--------|--------|
| **H-PERPAGE-STATE** | ⏳ | Refactor `useEditorState`: `sourceTemplate` + `backgroundId` → per-page state map |

**Then features:**

| Step | Status | Output |
|------|--------|--------|
| H-SAVE-1 | ⏳ | Saved Designs schema in pageLayout.savedDesigns |
| H-SAVE-2 | ⏳ | Save/Apply/Revert UI |
| H-CT-1 | ⏳ | Created Templates schema |
| H-CT-2 | ⏳ | Create Template Wizard |
| H-CT-3 | ⏳ | Template Gallery Tab (browse Master + Created) |
| H-CT-4 | ⏳ | Finalize lock |

### 🔄 Phase 4: Polish + Advanced

| Step | Status | Output |
|------|--------|--------|
| H-COMP-LIB | ⏳ | Component Library tab (uses elementCatalog APIs) |
| H-IMG-LIB | ⏳ | Image upload + library (Docker volume) |
| H-ELECTION-DATES | ⏳ | Move dates from electionConfig.js → DB editor |
| H-LAYOUT-CTRL | ⏳ | Padding/margin/alignment per element |
| H-PRESET-EXPAND | ⏳ | Add Dark + Soft templates (use TEMPLATE_EXTENSION_SPEC.md) |
| H-LOGIN-PREV | ⏳ | Login page editor preview |
| H-MOBILE-OPT | ⏳ | Mobile editor experience |

---

## 🚦 Critical Path & Dependencies

```
Phase 1.5 → Phase 2 (refactor) → Phase 2 (elements) → Phase 3 (per-page state) 
   → Phase 3 (save/template) → Phase 4 (polish)

Blockers:
- H-7b cannot start until H-CATALOG + H-FALLBACK-FIX done
- H-COMP-LIB cannot start until H-CATALOG done (needs unified API)
- H-SAVE-1 cannot start until H-PERPAGE-STATE done
- H-PRESET-EXPAND uses TEMPLATE_EXTENSION_SPEC.md (after Phase 2 refactor)
```

---

## 📦 Batching for Execution

| Batch | Steps | Model | Rationale |
|-------|-------|-------|-----------|
| 1 | ~~H-G~~ | ~~Opus~~ | ✅ done |
| 2 | ~~H-7a-FIX + WIRE~~ | ~~Sonnet~~ | ✅ done |
| 3 | **H-PREVIEW-INFRA** | Sonnet | NEXT — small scope, infra fix |
| 4 | H-CON | Opus | Cross-cutting migration |
| 5 | H-VOTE-PREV + H-CAND-PREV + H-CLOSED-PREV | Sonnet | Same pattern, different pages |
| 6 | H-CATALOG + H-FALLBACK-FIX + H-PAGE-NORMALIZE | Opus | Foundation refactor — high stakes |
| 7 | H-7b + H-8 | Opus | Tightly coupled (results elements) |
| 8 | H-9 + H-10 + H-11 + H-12 | Sonnet | Same pattern, batch |
| 9 | H-PERPAGE-STATE | Opus | Schema refactor |
| 10 | H-SAVE-1 + H-SAVE-2 | Opus | Foundation + UI |
| 11 | H-CT-1 + H-CT-2 + H-CT-3 + H-CT-4 | Opus | Template system |
| 12 | H-COMP-LIB | Sonnet | Use existing APIs |
| 13 | H-IMG-LIB | Opus | Storage decisions |
| 14 | H-ELECTION-DATES + H-LAYOUT-CTRL | Sonnet | Polish |
| 15 | H-PRESET-EXPAND | Sonnet | Uses TEMPLATE_EXTENSION_SPEC |
| 16 | H-LOGIN-PREV + H-MOBILE-OPT | Sonnet | Polish |

**~16 batches → ~16 Claude Code sessions remaining**

---

## 🛡️ Architectural Invariants (Always)

1. **Single source of truth for elements** → elementCatalog.js (after H-CATALOG)
2. **Templates are factory presets, not customization** → admins create custom via Created Templates
3. **All page-level state is per-page** → no global sourceTemplate/backgroundId after Phase 3
4. **Real components in editor** → no mocks (D-004)
5. **Adding a master template never breaks existing elements** → fallback to defaultConfig (after H-FALLBACK-FIX)
6. **Adding an element never breaks existing templates** → all templates must declare or fallback (after H-CATALOG)
7. **JSON columns over new tables** → schema flexibility
8. **Click-lock at capture phase** → no editor-mode navigation accidents

---

## 📑 Spec Files (Reference Documents)

- `CLAUDE.md` — AI context
- `MASTER_PLAN.md` — this file (roadmap)
- `DECISIONS.md` — locked decisions log
- `PROGRESS.md` — step status tracker
- `LIVE_EDITOR_ARCHITECTURE.md` — execution rules
- **`TEMPLATE_EXTENSION_SPEC.md` — how to add a new master template** (used after Phase 2)
- **`ELEMENT_EXTENSION_SPEC.md` — how to add a new element** (used after Phase 2)
- `LIVE_STEP_*.md` — per-step specs
- `DIAGNOSE_*.md` — pre-step diagnoses

---

## 🎯 Definition of Done (Project)

- ✅ All Phase 1.5 → 4 steps complete
- ✅ All hardcoded strings → globalConfig
- ✅ Unified element catalog with API
- ✅ Per-page templates + backgrounds
- ✅ Saved designs working
- ✅ Created templates with finalize lock
- ✅ Component Library functional
- ✅ Image library with Docker volume
- ✅ Adding new master template = 1 prompt
- ✅ Adding new element = 1 prompt with template auto-update
- ✅ Documentation handed to next admin (รุ่นน้อง)

---

**Phase 1.5 next step: H-PREVIEW-INFRA**
