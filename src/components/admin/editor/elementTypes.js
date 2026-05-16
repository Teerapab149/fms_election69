/**
 * elementTypes.js — Phase 2 catalog refactor (Step 2 / 5).
 *
 * Semantic type definitions for the type-instance catalog system.
 * Each instance in elementInstances.js references one of these typeIds.
 *
 * `category` is the legacy control category used by PropertyPanel
 * (one of: "text" | "button" | "card" | "image" | "toggle" | "countdown").
 *
 * Forward-compat fields (`layout`, `componentLibrary`) are populated but
 * not yet consumed; Phase 2.5+ wires them.
 *
 * Zero consumers wired in this step. See LIVE_STEP_H_CATALOG_CORE.md.
 */

export const ELEMENT_TYPES = {
  // ============================================================
  // Text types
  // ============================================================
  "text-title": {
    id: "text-title",
    name: "ข้อความหัวเรื่อง",
    description: "Primary heading text — H1-level",
    category: "text",
    layout: { minWidth: null, maxWidth: null, fluid: true, responsive: null },
    componentLibrary: {
      icon: "Heading1",
      tags: ["heading", "h1", "title", "ข้อความใหญ่"],
      previewable: true
    },
    schemaVersion: "v1"
  },

  "text-subtitle": {
    id: "text-subtitle",
    name: "ข้อความย่อย",
    description: "Subheading / paragraph description text",
    category: "text",
    layout: { minWidth: null, maxWidth: null, fluid: true, responsive: null },
    componentLibrary: {
      icon: "Type",
      tags: ["subtitle", "description", "paragraph", "คำอธิบาย"],
      previewable: true
    },
    schemaVersion: "v1"
  },

  "text-label": {
    id: "text-label",
    name: "ป้ายข้อความเล็ก",
    description: "Small label / pill text (badge appearance)",
    category: "text",
    layout: { minWidth: null, maxWidth: null, fluid: true, responsive: null },
    componentLibrary: {
      icon: "Tag",
      tags: ["label", "badge", "pill", "ป้าย"],
      previewable: true
    },
    schemaVersion: "v1"
  },

  "text-body": {
    id: "text-body",
    name: "เนื้อหา",
    description: "Body copy / footer text",
    category: "text",
    layout: { minWidth: null, maxWidth: null, fluid: true, responsive: null },
    componentLibrary: {
      icon: "AlignLeft",
      tags: ["body", "footer", "เนื้อหา"],
      previewable: true
    },
    schemaVersion: "v1"
  },

  "text-divider": {
    id: "text-divider",
    name: "ข้อความคั่น",
    description: "Divider text such as 'หรือ' between option groups",
    category: "text",
    layout: { minWidth: null, maxWidth: null, fluid: true, responsive: null },
    componentLibrary: {
      icon: "Minus",
      tags: ["divider", "separator", "คั่น"],
      previewable: true
    },
    schemaVersion: "v1"
  },

  // ============================================================
  // Button types
  // ============================================================
  "button-primary": {
    id: "button-primary",
    name: "ปุ่มหลัก",
    description: "Primary call-to-action button",
    category: "button",
    layout: { minWidth: null, maxWidth: null, fluid: false, responsive: null },
    componentLibrary: {
      icon: "MousePointerClick",
      tags: ["button", "cta", "primary", "ปุ่ม"],
      previewable: true
    },
    schemaVersion: "v1"
  },

  "button-secondary": {
    id: "button-secondary",
    name: "ปุ่มรอง",
    description: "Secondary / outline button (e.g., abstain, disapprove)",
    category: "button",
    layout: { minWidth: null, maxWidth: null, fluid: false, responsive: null },
    componentLibrary: {
      icon: "Square",
      tags: ["button", "secondary", "outline", "ปุ่มรอง"],
      previewable: true
    },
    schemaVersion: "v1"
  },

  "button-badge": {
    id: "button-badge",
    name: "ป้ายแบบปุ่ม",
    description: "Badge-style button / chip (small, label-like)",
    category: "button",
    layout: { minWidth: null, maxWidth: null, fluid: false, responsive: null },
    componentLibrary: {
      icon: "Bookmark",
      tags: ["badge", "chip", "tag", "ป้าย"],
      previewable: true
    },
    schemaVersion: "v1"
  },

  "button-stateful": {
    id: "button-stateful",
    name: "ปุ่มสถานะ",
    description: "Stateful button (voteCTA) — renders differently per runtime state",
    category: "button",
    layout: { minWidth: null, maxWidth: null, fluid: false, responsive: null },
    componentLibrary: {
      icon: "ToggleRight",
      tags: ["button", "stateful", "voteCTA", "ปุ่ม"],
      previewable: true
    },
    schemaVersion: "v1"
  },

  // ============================================================
  // Card types
  // ============================================================
  "card-primary": {
    id: "card-primary",
    name: "การ์ดหลัก",
    description: "Primary feature card (large stat / hero card)",
    category: "card",
    layout: { minWidth: null, maxWidth: null, fluid: true, responsive: null },
    componentLibrary: {
      icon: "LayoutGrid",
      tags: ["card", "feature", "primary", "การ์ด"],
      previewable: true
    },
    schemaVersion: "v1"
  },

  "card-secondary": {
    id: "card-secondary",
    name: "การ์ดรอง",
    description: "Secondary / small stat card",
    category: "card",
    layout: { minWidth: null, maxWidth: null, fluid: true, responsive: null },
    componentLibrary: {
      icon: "Square",
      tags: ["card", "secondary", "stat", "การ์ดเล็ก"],
      previewable: true
    },
    schemaVersion: "v1"
  },

  "card-party": {
    id: "card-party",
    name: "การ์ดพรรค",
    description: "Party display card (vote page / candidates page)",
    category: "card",
    layout: { minWidth: null, maxWidth: null, fluid: true, responsive: null },
    componentLibrary: {
      icon: "Users",
      tags: ["card", "party", "candidate", "พรรค"],
      previewable: true
    },
    schemaVersion: "v1"
  },

  "card-meet": {
    id: "card-meet",
    name: "การ์ดรู้จักผู้สมัคร",
    description: "Meet-candidates section card on home page",
    category: "card",
    layout: { minWidth: null, maxWidth: null, fluid: true, responsive: null },
    componentLibrary: {
      icon: "Heart",
      tags: ["card", "meet", "candidates", "รู้จัก"],
      previewable: true
    },
    schemaVersion: "v1"
  },

  // ============================================================
  // Image / toggle / countdown
  // ============================================================
  "image-banner": {
    id: "image-banner",
    name: "ภาพแบนเนอร์",
    description: "Large promotional image / banner",
    category: "image",
    layout: { minWidth: null, maxWidth: null, fluid: true, responsive: null },
    componentLibrary: {
      icon: "Image",
      tags: ["image", "banner", "ภาพ"],
      previewable: true
    },
    schemaVersion: "v1"
  },

  "toggle-visibility": {
    id: "toggle-visibility",
    name: "สวิตช์เปิดปิด",
    description: "Visibility toggle — single boolean `visible` field",
    category: "toggle",
    layout: { minWidth: null, maxWidth: null, fluid: false, responsive: null },
    componentLibrary: {
      icon: "ToggleRight",
      tags: ["toggle", "switch", "visible", "สวิตช์"],
      previewable: false
    },
    schemaVersion: "v1"
  },

  "countdown-timer": {
    id: "countdown-timer",
    name: "นับถอยหลัง",
    description: "Stateful countdown timer (hero-countdown)",
    category: "countdown",
    layout: { minWidth: null, maxWidth: null, fluid: false, responsive: null },
    componentLibrary: {
      icon: "Timer",
      tags: ["countdown", "timer", "stateful", "นับถอยหลัง"],
      previewable: true
    },
    schemaVersion: "v1"
  }
};

export function getType(typeId) {
  return ELEMENT_TYPES[typeId] || null;
}

export function listTypes() {
  return Object.values(ELEMENT_TYPES);
}
