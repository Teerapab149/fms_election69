# LIVE_STEP_H1.md — Universal Foundation for State-Aware Elements

## READ FIRST
Read `CLAUDE.md` and `LIVE_EDITOR_ARCHITECTURE.md` "EXECUTION RULES". Follow strictly.

## CONTEXT
This step creates the foundation for state-aware elements — UI elements that 
change appearance based on runtime conditions (like voteCTA-button showing 
different text/color when logged in vs logged out vs election ended).

Foundation includes:
- New registry schema with `isStateful`, `states`, `stateResolver`
- Universal helper functions for state resolution
- Template data structure with nested states
- Config merge logic (template defaults + user overrides)

This step only creates infrastructure. No existing elements are converted yet.

## SCOPE (DO NOT EXCEED)
Create exactly 3 new files:
1. `src/components/admin/editor/statefulRegistry.js`
2. `src/components/admin/editor/stateResolver.js`
3. `src/components/admin/editor/templateEngine.js`

Do NOT modify any existing file in this step.
Do NOT convert any existing elements yet.
Do NOT touch elementRegistry.js (keep it as-is for static elements).
Do NOT change PropertyPanel or HomeContent.
Do NOT install packages.

## FILE 1: `src/components/admin/editor/statefulRegistry.js`

Create a new registry for stateful elements. Keep it separate from 
`elementRegistry.js` to avoid breaking existing static element logic.

```js
/**
 * Registry for STATE-AWARE elements.
 * These elements change appearance based on runtime conditions.
 * 
 * Schema:
 *   {
 *     "element-id": {
 *       type: "button" | "card" | "badge" | "text" | "banner",
 *       label: "display name in Thai",
 *       section: "section name for grouping",
 *       isStateful: true,
 *       states: [{ id, label, description }],
 *       stateResolverKey: "key to lookup in stateResolvers",
 *       editableText: true | false,    // can admin edit text per state?
 *       defaultConfig: { /* fallback config if no template applied */ }
 *     }
 *   }
 */

// Global state types used across elements
export const GLOBAL_STATE_DIMENSIONS = {
  electionPhase: {
    label: "ช่วงเลือกตั้ง",
    values: ["upcoming", "active", "ended"]
  },
  systemMode: {
    label: "โหมดระบบ",
    values: ["auto", "pause", "closed"]
  },
  userAuth: {
    label: "การล็อกอิน",
    values: ["guest", "loggedIn"]
  },
  userVoteStatus: {
    label: "สถานะโหวต",
    values: ["notVoted", "voted"]
  },
  resultReveal: {
    label: "การเปิดเผยผล",
    values: ["hidden", "revealed"]
  }
};

// The registry itself — start with voteCTA-button
// Other elements will be added in later steps (H-5, H-6, etc.)
export const STATEFUL_ELEMENTS = {
  "voteCTA-button": {
    type: "button",
    label: "ปุ่มโหวต",
    section: "voteCTA",
    isStateful: true,
    editableText: true,
    stateResolverKey: "voteCTA",
    states: [
      { id: "login",    label: "ยังไม่ล็อกอิน",      description: "ผู้ใช้ยังไม่ล็อกอินเข้าระบบ" },
      { id: "notVoted", label: "ยังไม่โหวต",          description: "ล็อกอินแล้วแต่ยังไม่โหวต" },
      { id: "voted",    label: "โหวตแล้ว",            description: "โหวตเสร็จแล้ว" },
      { id: "ended",    label: "หมดเวลา",             description: "หมดช่วงเลือกตั้ง" },
      { id: "closed",   label: "ปิดรับโหวต",          description: "ระบบปิดรับโหวต manual" },
      { id: "paused",   label: "PAUSE (ปรับปรุง)",   description: "ระบบปิดปรับปรุงชั่วคราว" }
    ],
    defaultConfig: {
      // Fallback config — used if no template applied
      login:    { text: "เข้าสู่ระบบ / Sign in",        backgroundColor: "#8A2680", textColor: "#ffffff", borderRadius: "xl", fontSize: "lg", fontWeight: "bold" },
      notVoted: { text: "ลงคะแนน / Vote Now",           backgroundColor: "#10B981", textColor: "#ffffff", borderRadius: "xl", fontSize: "lg", fontWeight: "bold" },
      voted:    { text: "ดูผลคะแนน / Results",          backgroundColor: "#0369a1", textColor: "#ffffff", borderRadius: "xl", fontSize: "lg", fontWeight: "bold" },
      ended:    { text: "อยู่นอกระยะเวลาเลือกตั้ง / Ended", backgroundColor: "#1e293b", textColor: "#94a3b8", borderRadius: "xl", fontSize: "lg", fontWeight: "bold" },
      closed:   { text: "ระบบปิดรับลงคะแนน / Closed",   backgroundColor: "#1e293b", textColor: "#94a3b8", borderRadius: "xl", fontSize: "lg", fontWeight: "bold" },
      paused:   { text: "ระบบปิดปรับปรุง / Maintenance", backgroundColor: "#ea580c", textColor: "#ffffff", borderRadius: "xl", fontSize: "lg", fontWeight: "bold" }
    }
  }
};

// Helpers
export function getStatefulElement(elementId) {
  return STATEFUL_ELEMENTS[elementId] || null;
}

export function isStatefulElement(elementId) {
  return !!STATEFUL_ELEMENTS[elementId];
}

export function getStatesOf(elementId) {
  return STATEFUL_ELEMENTS[elementId]?.states || [];
}

export function getDefaultStateConfig(elementId, stateId) {
  return STATEFUL_ELEMENTS[elementId]?.defaultConfig?.[stateId] || {};
}
```

## FILE 2: `src/components/admin/editor/stateResolver.js`

Create state resolver functions that compute the current state for each 
stateful element based on runtime context.

```js
/**
 * Runtime state resolvers.
 * Each resolver takes a context object and returns the current state ID
 * for a specific element type.
 * 
 * Context shape:
 *   {
 *     session: NextAuth session | null,
 *     electionPhase: "upcoming" | "active" | "ended",
 *     systemMode: "AUTO" | "MANUAL" | "PAUSE" | "ENDED" | "CLOSED",
 *     isSystemOpen: boolean,
 *     isVoted: boolean,
 *     isRevealed: boolean
 *   }
 */

export const STATE_RESOLVERS = {
  
  voteCTA: (context) => {
    const { session, systemMode, isSystemOpen, isVoted } = context || {};
    
    if (systemMode === "PAUSE") return "paused";
    if (systemMode === "ENDED") return "ended";
    if (isSystemOpen === false) return "closed";
    if (!session) return "login";
    if (isVoted) return "voted";
    return "notVoted";
  },

  // Placeholder for future resolvers — add as more elements are converted
  // countdown: (context) => { ... },
  // resultCard: (context) => { ... },
  // resultsHeading: (context) => { ... }
};

/**
 * Resolve the current state ID for a given stateful element.
 * Returns the state ID string, or null if element/resolver not found.
 */
export function resolveElementState(elementId, context) {
  // Import lazily to avoid circular dependency risk
  const { STATEFUL_ELEMENTS } = require('./statefulRegistry');
  
  const element = STATEFUL_ELEMENTS[elementId];
  if (!element) return null;
  
  const resolver = STATE_RESOLVERS[element.stateResolverKey];
  if (!resolver) return element.states[0]?.id || null;
  
  const stateId = resolver(context);
  
  // Validate: must be one of the declared states
  const isValid = element.states.some(s => s.id === stateId);
  return isValid ? stateId : element.states[0]?.id;
}

/**
 * Build runtime context from raw data sources.
 * Call this once per page render and pass the result to resolveElementState.
 */
export function buildRuntimeContext({ session, systemConfig, electionStatus, userData }) {
  return {
    session: session || null,
    electionPhase: electionStatus || "upcoming",
    systemMode: systemConfig?.systemMode || "AUTO",
    isSystemOpen: systemConfig?.isSystemOpen !== false,
    isVoted: userData?.isVoted || session?.user?.isVoted || false,
    isRevealed: systemConfig?.showResult === true
  };
}
```

## FILE 3: `src/components/admin/editor/templateEngine.js`

Create the template system that:
- Stores template definitions (starting with Classic + Neon)
- Merges template defaults with admin overrides
- Provides lookup and apply helpers

```js
/**
 * Template engine for state-aware elements.
 * 
 * Data layers:
 *   Layer 1: TEMPLATES (read-only, hardcoded)
 *   Layer 2: activeState (saved in DB per admin session)
 *     - sourceTemplate: which template is active
 *     - elementOverrides: { [elementId]: { [stateId]: { ...partial config } } }
 *     - backgroundId: which background is active
 *   Layer 3: resolved config (computed at render time)
 *     = template defaults + overrides merged
 */

// ============================================================
// TEMPLATES
// ============================================================

export const TEMPLATES = {
  classic: {
    id: "classic",
    name: "คลาสสิก",
    description: "สีม่วง-ขาว สไตล์ทางการ สำหรับการเลือกตั้งมาตรฐาน",
    previewColor: "#8A2680",
    defaultBackgroundId: "gradient-purple-light",
    elements: {
      "voteCTA-button": {
        login: {
          text: "เข้าสู่ระบบ / Sign in",
          backgroundType: "gradient",
          backgroundColor: "#8A2680",
          gradientFrom: "#691E61",
          gradientVia: "#8A2680",
          gradientTo: "#C026D3",
          gradientDirection: "to-r",
          textColor: "#ffffff",
          borderRadius: "xl",
          borderColor: "transparent",
          borderWidth: "0",
          shadow: "lg",
          shadowColor: "#8A2680",
          paddingX: "10",
          paddingY: "4",
          fontSize: "lg",
          fontWeight: "bold",
          iconName: "LogIn",
          iconPosition: "right",
          hoverEffect: "lift"
        },
        notVoted: {
          text: "ลงคะแนน / Vote Now",
          backgroundType: "gradient",
          backgroundColor: "#10B981",
          gradientFrom: "#10B981",
          gradientVia: "#059669",
          gradientTo: "#047857",
          gradientDirection: "to-r",
          textColor: "#ffffff",
          borderRadius: "xl",
          borderColor: "transparent",
          borderWidth: "0",
          shadow: "lg",
          shadowColor: "#10B981",
          paddingX: "10",
          paddingY: "4",
          fontSize: "lg",
          fontWeight: "bold",
          iconName: "Vote",
          iconPosition: "right",
          hoverEffect: "lift"
        },
        voted: {
          text: "ดูผลคะแนน / Results",
          backgroundType: "gradient",
          backgroundColor: "#0369a1",
          gradientFrom: "#0369a1",
          gradientVia: "#0284c7",
          gradientTo: "#38bdf8",
          gradientDirection: "to-r",
          textColor: "#ffffff",
          borderRadius: "xl",
          borderColor: "transparent",
          borderWidth: "0",
          shadow: "lg",
          shadowColor: "#0369a1",
          paddingX: "10",
          paddingY: "4",
          fontSize: "lg",
          fontWeight: "bold",
          iconName: "BarChart3",
          iconPosition: "right",
          hoverEffect: "lift"
        },
        ended: {
          text: "อยู่นอกระยะเวลาเลือกตั้ง / Ended",
          backgroundType: "gradient",
          backgroundColor: "#1e293b",
          gradientFrom: "#334155",
          gradientVia: "#1e293b",
          gradientTo: "#0f172a",
          gradientDirection: "to-r",
          textColor: "#94a3b8",
          borderRadius: "xl",
          borderColor: "transparent",
          borderWidth: "0",
          shadow: "md",
          shadowColor: "#000000",
          paddingX: "10",
          paddingY: "4",
          fontSize: "lg",
          fontWeight: "bold",
          iconName: "Vote",
          iconPosition: "right",
          hoverEffect: "none"
        },
        closed: {
          text: "ระบบปิดรับลงคะแนน / Closed",
          backgroundType: "gradient",
          backgroundColor: "#1e293b",
          gradientFrom: "#334155",
          gradientVia: "#1e293b",
          gradientTo: "#0f172a",
          gradientDirection: "to-r",
          textColor: "#94a3b8",
          borderRadius: "xl",
          borderColor: "transparent",
          borderWidth: "0",
          shadow: "md",
          shadowColor: "#000000",
          paddingX: "10",
          paddingY: "4",
          fontSize: "lg",
          fontWeight: "bold",
          iconName: "Vote",
          iconPosition: "right",
          hoverEffect: "none"
        },
        paused: {
          text: "ระบบปิดปรับปรุงชั่วคราว / Maintenance",
          backgroundType: "gradient",
          backgroundColor: "#ea580c",
          gradientFrom: "#f97316",
          gradientVia: "#ea580c",
          gradientTo: "#c2410c",
          gradientDirection: "to-r",
          textColor: "#ffffff",
          borderRadius: "xl",
          borderColor: "transparent",
          borderWidth: "0",
          shadow: "lg",
          shadowColor: "#ea580c",
          paddingX: "10",
          paddingY: "4",
          fontSize: "lg",
          fontWeight: "bold",
          iconName: "Vote",
          iconPosition: "right",
          hoverEffect: "none"
        }
      }
    }
  },

  neon: {
    id: "neon",
    name: "นีออน",
    description: "สีสดใส เรืองแสง สไตล์ Cyberpunk สำหรับ audience วัยรุ่น",
    previewColor: "#06b6d4",
    defaultBackgroundId: "gradient-cyber-dark",
    elements: {
      "voteCTA-button": {
        login: {
          text: "SIGN IN",
          backgroundType: "solid",
          backgroundColor: "#06B6D4",
          gradientFrom: "#06B6D4",
          gradientVia: null,
          gradientTo: "#06B6D4",
          gradientDirection: "to-r",
          textColor: "#ffffff",
          borderRadius: "full",
          borderColor: "#0891B2",
          borderWidth: "2",
          shadow: "2xl",
          shadowColor: "#06B6D4",
          paddingX: "12",
          paddingY: "5",
          fontSize: "xl",
          fontWeight: "black",
          iconName: "LogIn",
          iconPosition: "right",
          hoverEffect: "glow"
        },
        notVoted: {
          text: "VOTE NOW",
          backgroundType: "solid",
          backgroundColor: "#84CC16",
          gradientFrom: "#84CC16",
          gradientVia: null,
          gradientTo: "#65A30D",
          gradientDirection: "to-r",
          textColor: "#ffffff",
          borderRadius: "full",
          borderColor: "#65A30D",
          borderWidth: "2",
          shadow: "2xl",
          shadowColor: "#84CC16",
          paddingX: "12",
          paddingY: "5",
          fontSize: "xl",
          fontWeight: "black",
          iconName: "Vote",
          iconPosition: "right",
          hoverEffect: "glow"
        },
        voted: {
          text: "SEE RESULTS",
          backgroundType: "solid",
          backgroundColor: "#A855F7",
          gradientFrom: "#A855F7",
          gradientVia: null,
          gradientTo: "#7E22CE",
          gradientDirection: "to-r",
          textColor: "#ffffff",
          borderRadius: "full",
          borderColor: "#7E22CE",
          borderWidth: "2",
          shadow: "2xl",
          shadowColor: "#A855F7",
          paddingX: "12",
          paddingY: "5",
          fontSize: "xl",
          fontWeight: "black",
          iconName: "BarChart3",
          iconPosition: "right",
          hoverEffect: "glow"
        },
        ended: {
          text: "ENDED",
          backgroundType: "solid",
          backgroundColor: "#0f172a",
          gradientFrom: "#0f172a",
          gradientVia: null,
          gradientTo: "#0f172a",
          gradientDirection: "to-r",
          textColor: "#64748b",
          borderRadius: "full",
          borderColor: "#334155",
          borderWidth: "2",
          shadow: "md",
          shadowColor: "#000000",
          paddingX: "12",
          paddingY: "5",
          fontSize: "xl",
          fontWeight: "black",
          iconName: "None",
          iconPosition: "none",
          hoverEffect: "none"
        },
        closed: {
          text: "CLOSED",
          backgroundType: "solid",
          backgroundColor: "#0f172a",
          gradientFrom: "#0f172a",
          gradientVia: null,
          gradientTo: "#0f172a",
          gradientDirection: "to-r",
          textColor: "#64748b",
          borderRadius: "full",
          borderColor: "#334155",
          borderWidth: "2",
          shadow: "md",
          shadowColor: "#000000",
          paddingX: "12",
          paddingY: "5",
          fontSize: "xl",
          fontWeight: "black",
          iconName: "None",
          iconPosition: "none",
          hoverEffect: "none"
        },
        paused: {
          text: "MAINTENANCE",
          backgroundType: "solid",
          backgroundColor: "#f59e0b",
          gradientFrom: "#f59e0b",
          gradientVia: null,
          gradientTo: "#d97706",
          gradientDirection: "to-r",
          textColor: "#ffffff",
          borderRadius: "full",
          borderColor: "#d97706",
          borderWidth: "2",
          shadow: "2xl",
          shadowColor: "#f59e0b",
          paddingX: "12",
          paddingY: "5",
          fontSize: "xl",
          fontWeight: "black",
          iconName: "Vote",
          iconPosition: "right",
          hoverEffect: "glow"
        }
      }
    }
  }
};

// ============================================================
// BACKGROUNDS
// ============================================================

export const BACKGROUNDS = {
  "gradient-purple-light": {
    id: "gradient-purple-light",
    name: "ม่วง-ขาว",
    type: "gradient",
    config: { from: "#faf5ff", via: "#f3e8ff", to: "#ffffff", direction: "to-br" }
  },
  "gradient-cyber-dark": {
    id: "gradient-cyber-dark",
    name: "ไซเบอร์ดาร์ก",
    type: "gradient",
    config: { from: "#0f172a", via: "#06b6d4", to: "#0f172a", direction: "to-b" }
  },
  "solid-white": {
    id: "solid-white",
    name: "ขาวล้วน",
    type: "solid",
    config: { color: "#ffffff" }
  },
  "solid-dark": {
    id: "solid-dark",
    name: "ดำล้วน",
    type: "solid",
    config: { color: "#0f172a" }
  },
  "mesh-rainbow": {
    id: "mesh-rainbow",
    name: "รุ้งพาสเทล",
    type: "mesh",
    config: { colors: ["#fef3c7", "#fce7f3", "#ddd6fe", "#bae6fd"] }
  },
  "pattern-dots-light": {
    id: "pattern-dots-light",
    name: "ลายจุด (สว่าง)",
    type: "pattern",
    config: { pattern: "dots", bgColor: "#ffffff", dotColor: "#8A2680" }
  },
  "gradient-sunset": {
    id: "gradient-sunset",
    name: "พระอาทิตย์ตก",
    type: "gradient",
    config: { from: "#fbbf24", via: "#f472b6", to: "#a855f7", direction: "to-br" }
  }
};

// ============================================================
// HELPERS
// ============================================================

export function getTemplate(templateId) {
  return TEMPLATES[templateId] || null;
}

export function listTemplates() {
  return Object.values(TEMPLATES);
}

export function getBackground(backgroundId) {
  return BACKGROUNDS[backgroundId] || null;
}

export function listBackgrounds() {
  return Object.values(BACKGROUNDS);
}

/**
 * Resolve final config for an element state by merging template defaults
 * with admin overrides.
 * 
 * @param {string} templateId - Active template ID
 * @param {string} elementId - Element ID
 * @param {string} stateId - State ID
 * @param {object} overrides - Admin overrides for this element+state
 * @returns {object} Merged config ready to render
 */
export function resolveStatefulConfig(templateId, elementId, stateId, overrides = {}) {
  const template = getTemplate(templateId);
  if (!template) {
    // Fallback to statefulRegistry defaults
    const { getDefaultStateConfig } = require('./statefulRegistry');
    return { ...getDefaultStateConfig(elementId, stateId), ...overrides };
  }

  const templateConfig = template.elements?.[elementId]?.[stateId] || {};
  
  // Shallow merge — admin overrides take precedence
  return { ...templateConfig, ...overrides };
}

/**
 * Check if an element+state has any overrides from the template defaults.
 */
export function hasOverrides(overrides, elementId, stateId) {
  const over = overrides?.[elementId]?.[stateId];
  return over && Object.keys(over).length > 0;
}
```

## VERIFICATION

After creating all 3 files:

1. Run `npm run build` — must pass with exit 0
2. No existing functionality should be affected (no files modified)
3. Open each new file, confirm:
   - `statefulRegistry.js` exports STATEFUL_ELEMENTS, GLOBAL_STATE_DIMENSIONS, helpers
   - `stateResolver.js` exports STATE_RESOLVERS, resolveElementState, buildRuntimeContext
   - `templateEngine.js` exports TEMPLATES, BACKGROUNDS, resolveStatefulConfig, helpers

## REPORT FORMAT

```
Created src/components/admin/editor/statefulRegistry.js — STATEFUL_ELEMENTS registry with voteCTA-button (6 states)
Created src/components/admin/editor/stateResolver.js — state resolver for voteCTA + buildRuntimeContext helper
Created src/components/admin/editor/templateEngine.js — TEMPLATES (classic, neon), BACKGROUNDS (7 options), resolveStatefulConfig merge helper
Build: PASS
```

No other commentary. Do not run dev server. Do not suggest next steps.
