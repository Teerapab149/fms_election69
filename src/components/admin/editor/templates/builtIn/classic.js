/**
 * Classic Template — Default design (purple/white)
 *
 * Built-in template. Single source of truth in code.
 * Mirror of historical Phase 2 presets.classic data (per P-LOG-004 extracted
 * verbatim from src/components/admin/editor/elementInstances.js).
 *
 * For stateful elements (hero-countdown, voteCTA-button) where presets:null,
 * defaultConfig is used as the canonical "classic" state per spec section 4.2.
 *
 * Schema version: v1
 */

export const classicTemplate = {
  id: "classic",
  slug: "classic",
  name: "คลาสสิก",
  description: "แบบทางการ สีม่วง/ขาว เหมาะกับการเลือกตั้งทั่วไป",

  authorId: null,
  isBuiltIn: true,
  isLocked: false,
  forkedFrom: null,
  visibility: "public",

  colorSwatch: {
    primary: "#8A2680",
    secondary: "#9333EA",
    background: "#F8F9FD"
  },

  pages: {
    // Day 6: home.backgroundColor removed — Layer 1 token --color-bg drives.
    home:       { visible: true },
    vote:       { visible: true, backgroundColor: "#F8F9FD" },
    candidates: { visible: true, backgroundColor: "#F8F9FD" },
    results:    { visible: true, backgroundColor: "#F8F9FD" },
    closed:     { visible: true, backgroundColor: "#F8F9FD" },
    success:    { visible: true, backgroundColor: "#F8F9FD" }
  },

  // Per-element overrides — extracted verbatim from elementInstances.js (P-LOG-004).
  // 47 entries matching the catalog.
  elements: {
    // === Home / hero ===
    "hero-title": {
      config: { text: "SAMO 49", fontSize: "5xl", color: "#1a1a2e", fontWeight: "900", align: "left" }
    },
    "hero-subtitle": {
      config: { text: "โครงการเลือกตั้งคณะกรรมการบริหาร", fontSize: "base", color: "#374151" }
    },
    "hero-subtitle2": {
      config: { text: "สโมสรนักศึกษาคณะวิทยาการจัดการ", fontSize: "sm", color: "#6b7280" }
    },
    "hero-year-badge": {
      config: { text: "ประจำปีการศึกษา 2569", fontSize: "xs", color: "#6b7280", visible: true }
    },
    "hero-countdown": {
      // Stateful — defaultConfig used as classic state (presets:null in instance)
      config: {
        before: {
          label: "STARTS IN", pillBackground: "#ffffff",
          badgeBackgroundColor: "#9D3292", badgeTextColor: "#ffffff",
          textMain: "#9D3292", textSub: "#a78bfa",
          borderColor: "#e9d5ff", shadow: "md", shadowColor: "#9D3292",
          iconName: "Flag", iconAnimation: "none"
        },
        running: {
          label: "CLOSES IN", pillBackground: "#ffffff",
          badgeBackgroundColor: "#ef4444", badgeTextColor: "#ffffff",
          textMain: "#dc2626", textSub: "#f87171",
          borderColor: "#fecaca", shadow: "md", shadowColor: "#ef4444",
          iconName: "Zap", iconAnimation: "pulse"
        },
        paused: {
          label: "SYSTEM PAUSED", pillBackground: "#ffffff",
          badgeBackgroundColor: "#fed7aa", badgeTextColor: "#c2410c",
          textMain: "#ea580c", textSub: "#fb923c",
          borderColor: "#fed7aa", shadow: "sm", shadowColor: "#ea580c",
          iconName: "Hourglass", iconAnimation: "spin"
        },
        manualEnded: {
          label: "ELECTION ENDED", pillBackground: "#ffffff",
          badgeBackgroundColor: "#e2e8f0", badgeTextColor: "#334155",
          textMain: "#475569", textSub: "#94a3b8",
          borderColor: "#cbd5e1", shadow: "none", shadowColor: "#000000",
          iconName: "CalendarDays", iconAnimation: "none"
        },
        nextYear: {
          label: "SEE YOU {YEAR}", pillBackground: "#ffffff",
          badgeBackgroundColor: "#1e293b", badgeTextColor: "#ffffff",
          textMain: "#334155", textSub: "#94a3b8",
          borderColor: "#e2e8f0", shadow: "sm", shadowColor: "#000000",
          iconName: "CalendarDays", iconAnimation: "none"
        }
      }
    },

    // === Home / stats ===
    "stats-header": {
      config: { text: "สถิติผู้เข้าร่วมลงคะแนนโหวต", fontSize: "xs", color: "#374151" }
    },
    // Day 4 Step 4: enriched with gradient fields so the hero card can express
    // its 3-stop gradient (#691E61 -> #8A2680 -> #C026D3). borderRadius "3xl"
    // matches the current rounded-[24px]. backgroundColor kept as solid fallback.
    // Day 7a: borderRadius "3xl" (=24px) removed — matches --radius-card.
    "stats-voted-card": {
      config: {
        backgroundType: "gradient",
        backgroundColor: "#8A2680",
        gradientFrom: "#691E61",
        gradientVia: "#8A2680",
        gradientTo: "#C026D3",
        gradientDirection: "to-br",
        textColor: "#ffffff"
      }
    },
    // Day 4 Step 3: enriched with number/label/accent colors so sub-cards are
    // template-distinct. borderRadius xl->3xl + borderColor -> #f1f5f9 to
    // faithfully preserve the current rounded-[24px] / border-slate-100 look
    // (those fields were previously dead/ignored by StatsBlock JSX).
    // Day 6: backgroundColor removed — Layer 1 --color-surface drives it.
    "stats-progress-card": {
      config: { borderColor: "#f1f5f9", numberColor: "#1e293b", labelColor: "#94a3b8", accentColor: "#10b981" }
    },
    "stats-eligible-card": {
      config: { borderColor: "#f1f5f9", numberColor: "#334155", labelColor: "#94a3b8", iconColor: "#cbd5e1" }
    },

    // === Home / voteCTA (stateful, presets:null → defaultConfig) ===
    // Day 3a: enriched to full 18-field shape per state (source: HEAD~7
    // TEMPLATES.classic). Existing text strings preserved per spec P-LOG-005.
    "voteCTA-button": {
      variant: "default",
      config: {
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
          text: "ระบบปิดปรับปรุง / Maintenance",
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
      },
      vars: {
        "--btn-bg":              "var(--color-primary)",
        "--btn-bg-gradient":     "none",
        "--btn-text":            "var(--color-surface)",
        "--btn-border-color":    "transparent",
        "--btn-border-width":    "0px",
        "--btn-radius":          "var(--radius-button)",
        "--btn-shadow":          "var(--shadow-button)",
        "--btn-padding-x":       "32px",
        "--btn-padding-y":       "16px",
        "--btn-font-size":       "16px",
        "--btn-font-weight":     "600",
        "--btn-hover-bg":        "var(--btn-bg)",
        "--btn-hover-shadow":    "var(--btn-shadow)",
        "--btn-hover-transform": "none",
        "--btn-icon-color":      "var(--btn-text)",
        "--btn-letter-spacing":  "normal",
        "--btn-text-transform":  "none"
      }
    },

    // === Home / meetCandidates ===
    // Day 4 Step 5: enriched so the card body + animated glow are template-driven.
    // Classic reproduces the current look exactly (purple/pink/orange glow,
    // white body, light surface overlay). borderRadius "3xl" ~ the rounded-[24px]
    // glow / rounded-[22px] body (2px diff, imperceptible). surfaceLight gates the
    // light overlay + radial dots + blobs (off for dark/mono templates).
    // Day 6: backgroundColor removed — Layer 1 --color-surface drives it.
    "meet-section": {
      config: {
        borderColor: "#fecdd3",
        glowFrom: "#9333ea",
        glowVia: "#ec4899",
        glowTo: "#fb923c",
        surfaceLight: true,
        visible: true
      }
    },
    "meet-title": {
      config: { text: "รู้จักผู้สมัครของคุณหรือยัง?", fontSize: "sm", color: "#1a1a2e", fontWeight: "700" }
    },
    // Day 6: bg+textColor removed — --color-text + --color-surface drive.
    // Day 7a: borderRadius "full" (=9999px) removed — matches --radius-button.
    "meet-cta": {
      config: { text: "ดูรายชื่อพรรค →" }
    },

    // === Home / electionBanner ===
    // Day 4 Step 2: enriched with borderColor/backgroundColor so the frame is
    // template-distinct. borderRadius set to "3xl" to faithfully preserve the
    // current rounded-3xl frame (field was previously dead/ignored by JSX).
    // Day 6: backgroundColor removed — --color-surface drives it. borderColor
    // KEPT as #ffffff (white-on-white intentional, ≠ --color-border #e2e8f0).
    // Day 7a: borderRadius "3xl" (=24px) removed — matches --radius-card.
    // Day 7a Part 4: Layer 2 pilot — vars declared at element root per D10.
    // Day 7b: explicit variant field — resolver picks default.jsx.
    // borderColor #ffffff kept as Layer 3 (white-on-white intentional ≠ token).
    "banner-section": {
      variant: "default",
      config: { visible: true, borderColor: "#ffffff" },
      vars: {
        "--banner-bg":           "var(--color-surface)",
        "--banner-border":       "var(--color-border)",
        "--banner-border-width": "1px",
        "--banner-radius":       "var(--radius-card)",
        "--banner-shadow":       "0 25px 50px -12px rgba(0,0,0,0.25)"
      }
    },

    // === Vote / header ===
    "vote-header-badge": {
      config: { text: "ลงคะแนนเสียง", fontSize: "xs", color: "#8A2680" }
    },
    "vote-header-title": {
      config: { text: "เลือกตั้งสโมสรนักศึกษา", fontSize: "3xl", color: "#1a1a2e", fontWeight: "black" }
    },
    "vote-header-subtitle": {
      config: { text: "โปรดเลือกพรรคที่ต้องการ", fontSize: "sm", color: "#64748b" }
    },

    // === Vote / partyGrid + abstain ===
    "vote-party-card": {
      config: { backgroundColor: "#ffffff", borderRadius: "2xl", borderColor: "#e2e8f0" }
    },
    "vote-divider-text": {
      // presets:null in instance → defaultConfig used
      config: { text: "หรือ", color: "#64748b", fontSize: "xs" }
    },
    "vote-abstain-button": {
      config: { text: "งดออกเสียง", backgroundColor: "#ffffff", textColor: "#f97316", borderRadius: "xl", borderColor: "#fed7aa" }
    },
    "vote-disapprove-button": {
      config: { text: "ไม่รับรอง", backgroundColor: "#ffffff", textColor: "#dc2626", borderRadius: "xl", borderColor: "#fecaca" }
    },

    // === Results page (presets:null → defaultConfig) ===
    "results-header": {
      config: { text: "ผลการเลือกตั้ง", fontSize: "5xl", color: "#1e293b", fontWeight: "900", align: "center" }
    },
    "results-stats-bar": {
      config: { visible: true },
      vars: {
        "--rsb-accent":  "var(--color-primary)",
        "--rsb-card-bg": "rgba(255,255,255,0.9)"
      }
    },
    "results-candidates-heading": {
      config: { text: "🏆 สรุปผลการเลือกตั้ง (Official Results)", fontSize: "sm", color: "#475569", fontWeight: "700" }
    },
    "results-demographics": {
      config: { visible: true }
    },

    // === Candidates page (presets:null → defaultConfig {}) ===
    "candidates-tagline":    { config: {} },
    "candidates-title":      { config: {} },
    "candidates-subtitle":   { config: {} },
    "candidates-counter":    {
      config: {},
      vars: {
        "--cc-accent": "var(--color-primary)",
        "--cc-bg":     "rgba(138, 38, 128, 0.1)",
        "--cc-border": "rgba(138, 38, 128, 0.2)"
      }
    },
    "candidates-party-card": { config: {} },

    // === Success page ===
    "success-check-icon": {
      config: { visible: true }
    },
    "success-title":     { config: {} },
    "success-subtitle1": { config: {} },
    "success-subtitle2": { config: {} },
    "success-megaphone-card": {
      config: { backgroundColor: "#faf5ff", borderColor: "#e9d5ff", borderRadius: "2xl", visible: true }
    },
    "success-megaphone-title": {
      config: { text: "รับทรานสคริปต์กิจกรรม", fontSize: "base", color: "#8A2680", fontWeight: "bold", align: "left" }
    },
    "success-megaphone-desc": {
      config: { text: "กรุณาทำแบบประเมินให้ครบถ้วน", fontSize: "xs", color: "#64748b", fontWeight: "normal", align: "left" }
    },
    "success-chip-1": {
      config: { text: "ชั่วโมงกิจกรรม 2 ชม.", backgroundColor: "#f3e8ff", textColor: "#8A2680", borderRadius: "lg" }
    },
    "success-chip-2": {
      config: { text: "ประเภทเลือกเข้าร่วม", backgroundColor: "#fff1f2", textColor: "#e11d48", borderRadius: "lg" }
    },
    "success-lock-indicator": {
      config: { text: "และ ปลดล็อคหน้าสรุปผลคะแนนเสียง", fontSize: "xs", color: "#475569", fontWeight: "normal", align: "center" }
    },
    "success-form-btn": { config: {} },
    "success-footer":   { config: {} },

    // === Closed page ===
    "closed-lock-icon": {
      config: { visible: true }
    },
    "closed-title": {
      config: { text: "ยังไม่เปิดรับลงคะแนน", fontSize: "2xl", color: "#1e293b", fontWeight: "900", align: "center" }
    },
    "closed-description": {
      config: { text: "การลงคะแนนเสียงจะเริ่มในเร็วๆ นี้", fontSize: "sm", color: "#475569", fontWeight: "normal", align: "center" }
    },
    "closed-detail": {
      config: { text: "วันที่ 6 กุมภาพันธ์ 2569 เวลา 08.30 น. - 17.00 น.", fontSize: "xs", color: "#64748b", fontWeight: "normal", align: "center" }
    },
    "closed-back-btn": {
      config: { text: "กลับสู่หน้าหลัก", backgroundColor: "#f1f5f9", textColor: "#334155", borderRadius: "md" }
    }
  },

  theme: {
    colors: {
      primary:    "#8A2680",
      accent:     "#9333EA",
      background: "#F8F9FD",
      surface:    "#ffffff",
      text:       "#1a1a2e",
      textMuted:  "#64748b",
      border:     "#e2e8f0"
    },
    typography: {
      fontFamily:   "Inter, system-ui, sans-serif",
      baseFontSize: "16px"
    },
    spacing: {
      sectionGap: "4rem",
      elementGap: "1.5rem"
    },
    effects: {
      borderRadius: "0.75rem",
      shadow:       "0 4px 6px -1px rgba(0,0,0,0.1)"
    },
    // Layer 1 tokens — emitted as CSS vars on .fms-app scope (ADR-001 D9/D11).
    // Values mirror theme.colors / element configs of classic so the live page
    // renders byte-faithfully with Day 4. Each template defines ALL 15 tokens
    // (no inheritance) per D5 (snapshot-friendly).
    tokens: {
      "--color-primary":     "#8A2680",
      "--color-accent":      "#9333EA",
      "--color-bg":          "#F8F9FD",
      "--color-surface":     "#ffffff",
      "--color-text":        "#1a1a2e",
      "--color-text-muted":  "#64748b",
      "--color-border":      "#e2e8f0",
      "--radius-sm":         "8px",
      "--radius-md":         "16px",
      "--radius-card":       "24px",
      "--radius-button":     "9999px",
      "--shadow-card":       "0 8px 24px rgba(0,0,0,0.06)",
      "--shadow-button":     "0 4px 12px rgba(138,38,128,0.25)",
      "--font-display":      "Inter, system-ui, sans-serif",
      "--font-body":         "Inter, system-ui, sans-serif"
    }
  },

  schemaVersion: "v1",
  archivedYear: null
};

export default classicTemplate;
